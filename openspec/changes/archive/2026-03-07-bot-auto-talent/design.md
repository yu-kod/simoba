## Context

Bot ヒーローは `ServerBotSystem` で移動・攻撃の入力を生成するが、タレント取得のロジックがない。人間プレイヤーはクライアントから `acquireTalent` メッセージを送信するが、Bot にはクライアントが存在しない。既存の `acquireTalent()` 関数（`ServerTalentSystem.ts`）はバリデーション付きでタレントを付与する純粋な関数であり、Bot からも再利用可能。

## Goals / Non-Goals

**Goals:**
- Bot がタレントポイントを保持していたら自動でタレントを取得する
- 取得可能なノードからランダムに選択する（Bot ごとに異なるビルドパスになる）
- 既存の `acquireTalent()` を再利用し、タレント取得ロジックを重複させない

**Non-Goals:**
- Bot に戦略的なタレント選択 AI を実装すること（将来の改善として別Issue）
- クライアント側の変更（state sync で自動反映される）
- Bot のタレント取得タイミングに演出や遅延を入れること

## Decisions

### D1: 新ファイル `ServerBotTalentSystem.ts` に分離

Bot タレントロジックを `ServerBotSystem.ts` に追加するのではなく、`ServerBotTalentSystem.ts` として分離する。

**理由:** `ServerBotSystem` は移動・攻撃の入力生成に責務が限定されている。タレント消費は入力生成とは異なる責務（状態変更）であり、分離がプロジェクトの「1モジュール = 1責務」原則に合致する。

**代替案:** `ServerBotSystem.ts` に関数追加 → 責務が混在するため却下。

### D2: `acquireTalent()` を直接呼び出し

Bot 用に新しいタレント取得関数を作らず、既存の `acquireTalent(hero, talentId, treeDef)` をそのまま呼ぶ。バリデーション（ポイント不足、前提未達、重複取得）は `acquireTalent` 側で保証済み。

**理由:** ロジック重複を防ぎ、人間プレイヤーと同じルールで取得を保証する。

### D3: gameUpdate() 内でレベルアップ処理の直後に呼び出し

`GameRoom.gameUpdate()` のレベルアップ処理（XP付与 → `grantXpAndLevelUp`）の後に Bot タレント消費を実行する。毎ティック呼ばれるが、`talentPoints === 0` の Bot はスキップするため負荷は無視できる。

### D4: ランダム選択に `Math.random()` を使用

取得可能なノードのリストから `Math.random()` でインデックスを選ぶ。ゲームの再現性（リプレイ）は Phase 1 のスコープ外であり、シード付き乱数は不要。

## Risks / Trade-offs

- **[毎ティック呼び出しの負荷]** → `talentPoints > 0` の Bot のみ処理するため、実質的にレベルアップ直後の数ティックだけ実行される。Bot は最大2体（2v2）なので問題なし。
- **[ランダム選択によるビルドの偏り]** → 5ノードのツリーで最大5レベルなので、最終的には全ノード取得。途中経過のビルド順が異なるだけで、ゲームバランスへの影響は軽微。
