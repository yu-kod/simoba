## Context

`GameScene.ts` のオンラインモード処理に2つの構造的問題がある:

1. **`handleServerHeroUpdate`** — `isLocal` 分岐で状態更新ロジックが3箇所に重複（local+prediction, local-prediction, remote）。同じフィールド群（type, radius, position, facing, hp, maxHp, dead, attackTargetId, respawnTimer）を3回書いており、新フィールド追加時に漏れが発生する（Issue #113 の radius 漏れが実例）。

2. **`updateOnlineInput` / `updateOfflineHero`** — `localHero` スナップショットを冒頭で取得し、途中で `updateEntity` した後も古い参照を使い続ける stale reference パターン。Issue #103 で facing 計算が stale な `attackTargetId` を参照するバグが実際に発生。

## Goals / Non-Goals

**Goals:**

- 全ヒーローに共通の状態適用を1箇所に集約し、local/remote の区別を状態更新から排除
- 予測（prediction）・カメラ制御・ID リマップを状態適用とは独立したレイヤーとして分離
- `updateOnlineInput` / `updateOfflineHero` の読み取り→計算→書き込みフェーズ分離で stale reference を構造的に排除

**Non-Goals:**

- オフラインモード廃止（#107）
- Entity Interpolation / スムージング（#100）
- EntityManager API 変更

## Decisions

### 1. `handleServerHeroUpdate` を3ステップ構造に分離

**現在:** `if (isLocal) { ... } else { ... }` で完全に分岐

**変更後:**

```
Step 1: ensureEntityExists(state)     — エンティティ・レンダラーが無ければ作成（local/remote 共通）
Step 2: applyServerState(state)       — サーバー状態を全フィールド一括適用（1箇所のみ）
Step 3: applyLocalOverrides(state)    — ローカルヒーローのみ: 予測位置上書き + カメラ + prediction reset
```

**理由:** 状態適用を1箇所にすることで、フィールド追加時の漏れが構造的に防げる。予測は「サーバー状態を適用した後に位置だけ上書きする」レイヤーとして明確に分離。

**代替案:** 状態適用オブジェクトを `buildStateUpdate(state)` で構築して共有 → 位置だけ差し替える案も検討したが、関数分割のほうが各ステップの責務が明確。

### 2. `updateOnlineInput` を gather → compute → apply に分離

**現在:** 読み取りと書き込みが混在し、`localHero` 参照が途中で stale になる

**変更後:**

```
Phase 1 (gather):  localHero スナップショット + 入力値を読み取り
Phase 2 (compute): attackTarget, facing, inputMsg, prediction を純粋計算
Phase 3 (apply):   updateEntity を1回だけ呼び、networkBridge.sendInput
```

**理由:** 読み取りと書き込みを分離すれば、stale reference が構造的に発生しない。compute フェーズは入力値のみに依存するため、将来的にテスタビリティも向上。

### 3. `updateOfflineHero` にも同パターンを適用

現在 `heroNow`, `heroForFacing`, `heroForMove` と3回再取得しており、各時点で状態が異なる。同じ gather → compute → apply パターンに整理する。

### 4. ローカルヒーロー初回 ID リマップの扱い

`remapLocalHeroToSession` は Step 1 (ensureEntityExists) の中で、`state.sessionId !== this.entityManager.localHeroId` の場合にのみ実行。既存ロジックを移動するだけで変更なし。

## Risks / Trade-offs

- **リファクタ範囲が大きい** → 既存テストが全 PASS することを各ステップで確認しながら進める。テスト自体の構造変更は最小限に留める
- **予測位置の上書きタイミング** → applyServerState の後に上書きすることで、サーバー状態が常に正として保存され、予測位置は描画用の一時的な上書きになる。現在と同じ動作を維持
- **`updateOfflineHero` の攻撃処理** → `combatManager.processAttack` が内部で `updateEntity` を呼ぶため、完全な分離は困難。攻撃処理部分は現行のまま維持し、facing + movement の stale reference のみ解消
