## Context

オンラインモードでは Colyseus サーバーが 60Hz でシミュレーションし、デフォルト patchRate 50ms（20Hz）でクライアントに状態を同期している。現在 `handleServerHeroUpdate` はリモートエンティティの `state.x/y` を直接 `HeroRenderer.sync()` → `container.setPosition()` で描画位置に適用するため、50ms ごとに瞬間移動（snap）が発生する。

ローカルヒーローはクライアント予測（`MovementPredictor`）を使用しているが、`reconcile()` がサーバー位置にリセット→未確認入力を再適用する際、予測とサーバーのズレが大きいとガクつく。

### 現在のデータフロー

```
Server (60Hz sim, 20Hz patch)
  → Colyseus binary diff
    → OnlineGameMode.onServerHeroUpdate callback
      → GameScene.handleServerHeroUpdate
        → computeHeroPosition (local: reconcile, remote: raw x/y)
          → applyServerHeroState → entityManager
            → HeroRenderer.sync() → container.setPosition() ← SNAP!
```

### 関連コード

- `HeroSchema`: `x`, `y`, `facing`, `lastProcessedSeq` など（`serverTime` フィールドなし）
- `GameScene.computeHeroPosition`: ローカル=reconcile、リモート=`{ x: state.x, y: state.y }` 直接返却
- `HeroRenderer.sync()`: `container.setPosition(x, y)` で即座に配置
- `MovementPredictor.reconcile()`: `predictedX/Y = serverX/Y` → 入力再適用（スムージングなし）

## Goals / Non-Goals

**Goals:**
- リモートエンティティの移動を滑らかにする（2スナップショット間の時間ベース線形補間）
- ローカルヒーローの reconcile 後のガクつきを軽減する（prediction smoothing）
- オフラインモードに影響を与えない（補間はオンライン専用）
- 既存の MovementPredictor / InputBuffer の予測ロジックに最小限の変更で統合

**Non-Goals:**
- サーバー tick rate / patchRate の変更
- Dead reckoning / extrapolation（補間のみ、外挿はしない）
- タワー・プロジェクタイルの補間（ヒーローのみ）
- ネットワーク遅延計測やクロック同期（固定バッファ時間で十分）

## Decisions

### D1: InterpolationBuffer — 固定遅延の 2-snapshot lerp

**選択:** サーバースナップショットを `{ prev, target }` ペアでバッファリングし、固定遅延（`INTERPOLATION_DELAY = 100ms` = patchRate × 2）を入れて prev→target 間を線形補間する。

**代替案:**
- **(A) 3+ snapshot リングバッファ:** Valve/Source Engine スタイル。精度は上がるが、遅延が増え実装が複雑。2v2 のカジュアルゲームには過剰。
- **(B) Dead reckoning (外挿):** velocity ベースで未来位置を予測。予測が外れるとポッピングが発生し、velocity フィールドの追加も必要。

**理由:** 2-snapshot lerp は最もシンプルで、100ms の追加遅延はカジュアル MOBA では許容範囲。patchRate が安定している前提で十分に滑らか。

### D2: serverTime フィールド — サーバー側で monotonic timestamp を付与

**選択:** `HeroSchema` に `serverTime: float64` を追加。サーバーの `gameUpdate()` 内で `Date.now()` を書き込む。クライアントは差分（`target.serverTime - prev.serverTime`）で補間レートを計算。

**代替案:**
- **(A) クライアント受信時の `performance.now()` を使う:** サーバー時刻不要だが、パケットの到着ジッターで補間速度が不安定になる。
- **(B) Colyseus の `clock.elapsedTime` を使う:** Room のクロックはミリ秒精度で利用可能だが、`elapsedTime` はクライアント側で直接参照できない。

**理由:** サーバー monotonic time が最も正確。float64 は 8 バイト追加だが、20Hz × 4 プレイヤーで帯域影響は無視できる。クライアント間の時間差は補間に影響しない（差分のみ使用）。

### D3: 補間の適用場所 — GameScene.update() で毎フレーム lerp

**選択:** `InterpolationBuffer` をリモートエンティティごとに保持（`Map<string, InterpolationBuffer>`）。`handleServerHeroUpdate` で snapshot を push し、`GameScene.update()` で毎フレーム `buffer.getInterpolatedPosition(now)` を呼んで entity の position を更新。HeroRenderer.sync() は従来通り呼ばれるが、渡される position が補間済み。

**代替案:**
- **(A) HeroRenderer 内で補間:** Renderer が状態を持つことになり、ロジックと描画の分離が崩れる。
- **(B) EntityManager 内で補間:** EntityManager は状態管理のみで、時間ベースロジックを持たせるのは責務違反。

**理由:** GameScene.update() は毎フレーム呼ばれ、delta time を持ち、エンティティの position 更新の責務がある。既存の `updateRemoteHeroes()` ループに統合できる。

### D4: Prediction Smoothing — reconcile 結果をブレンド

**選択:** `MovementPredictor` に smoothing ロジックを追加。`reconcile()` の結果と現在の予測位置の差が閾値（`SNAP_THRESHOLD = 200px`）未満なら、数フレームかけて指数的にブレンド（`smoothingFactor = 0.15`/フレーム）。閾値以上なら即スナップ（テレポート/リスポーン時）。

**代替案:**
- **(A) 固定フレーム数ブレンド（線形）:** 一定速度で補正するため、距離が大きいと遅く、小さいと速すぎる。
- **(B) reconcile 自体を変えない:** 現状維持だが、ネットワークジッターでガクつきが残る。

**理由:** 指数ブレンドは「大きいズレは速く、小さいズレはゆっくり」補正するため自然。SNAP_THRESHOLD はリスポーンやテレポート時の即座の位置変更に対応。smoothingFactor はチューニング可能。

### D5: オフラインモードへの影響回避

**選択:** `InterpolationBuffer` はオンラインモード（`isServerAuthoritative === true`）でのみ生成・使用。オフラインモードでは従来通り直接 position 適用。prediction smoothing もオンラインモードのみ有効化。

**理由:** オフラインモードはサーバー同期がなく、補間・スムージングは不要。条件分岐は `isOnline` フラグ（既存）で制御。

## Risks / Trade-offs

**[R1] 100ms 追加遅延** → リモートエンティティが常に 100ms 過去の位置で描画される。2v2 カジュアル MOBA では許容範囲だが、スキルショット精度に影響する可能性あり。将来的に遅延を `INTERPOLATION_DELAY` 定数で調整可能にしておく。

**[R2] パケットロス/遅延スパイク時の動作** → snapshot が届かないと補間が停止し、最後の target 位置で静止する。extrapolation を行わない設計なので、一時的なフリーズが見える。→ 許容：2-3パッチ分（100-150ms）の遅延は稀で、到着後に即座に追いつく。

**[R3] serverTime の精度** → `Date.now()` はミリ秒精度で十分だが、サーバープロセスの GC pause で timestamp が不均一になる可能性。→ 緩和：補間レートの異常値（例: interval < 10ms or > 200ms）はクランプする。

**[R4] Prediction smoothing の視覚的違和感** → smoothingFactor が小さすぎるとラバーバンディングが長引き、大きすぎるとスナップに近づく。→ 定数をチューニング可能にし、開発中に調整する。

**[R5] テスト困難** → 時間ベースの補間はユニットテストで `performance.now()` のモックが必要。→ InterpolationBuffer に時刻関数を注入可能にする設計にする。
