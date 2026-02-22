## Why

オンラインモードでヒーロー間の自動連続攻撃が機能しない（Issue #103）。右クリックで敵を攻撃すると1発だけダメージが入るが、オフラインモードのように射程内で自動的に攻撃が継続しない。原因はクライアントが右クリックフレームのみ `attackTargetId` を送信し、以降のフレームで `null` を送信 → サーバーが毎ティックターゲットをクリアしてしまうこと。

## What Changes

- **クライアント側**: `GameScene.updateOnlineInput()` でクライアントが自身の攻撃ターゲットをローカルに保持し、毎フレーム現在の `attackTargetId` をサーバーに送信する（オフラインモードと同じターゲット管理パターン）
  - 右クリック時: ローカルのターゲットを更新して `"entity-id"` を送信
  - ターゲット維持中: 毎フレーム同じ `"entity-id"` を送信
  - 移動開始時（`!canMoveWhileAttacking`の場合）: ローカルのターゲットを解除して `null` を送信
- **サーバー側**: `ServerCombatManager.processHeroCombat()` のターゲット更新ロジックを簡素化。クライアントから受け取った `attackTargetId` をそのまま使用（`null` = 攻撃なし、`"id"` = 攻撃）。サーバーはティック間でターゲットを保持する必要なし
- **プロトコル**: `InputMessage.attackTargetId` のセマンティクスは変更なし（`null` | `"id"` の2状態のまま）

## Non-goals

- 攻撃のビジュアルフィードバック（フラッシュ、近接スイング、死亡透明化）— Issue #101 で対応
- ネットワーク描画のスムージング（Entity Interpolation）— Issue #100 で対応
- `canMoveWhileAttacking` のオンライン対応 — 現在 BLADE のみで true なのでスコープ外

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `attack-system`: オンラインモードでの攻撃ターゲット永続化。クライアントがローカルにターゲットを保持し毎フレーム送信する方式に変更。サーバーはクライアントが送る値をそのまま使用する

## Impact

- **クライアント**: `src/scenes/GameScene.ts` — `updateOnlineInput` でローカルターゲット管理 + 毎フレーム送信
- **サーバー**: `server/src/game/ServerCombatManager.ts` — `processHeroCombat` のターゲット更新ロジック簡素化
- **テスト**: `server/src/__tests__/ServerCombatManager.test.ts` — ターゲット永続化のテスト追加
