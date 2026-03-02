## Why

現在リスポーン時間は固定5秒 (`DEFAULT_RESPAWN_TIME`) だが、レベルが上がっても同じペナルティでは終盤のデスの重みが薄い。レベル連動させることで、序盤は軽く・終盤は重いデスペナルティとなり、試合終盤の緊張感が増す。XP/レベルシステム (#162) が完成した今が導入タイミング。

## What Changes

- リスポーン時間をヒーローレベルに応じて変動させる計算式/テーブルを `shared/` に定義する
- `ServerDeathSystem.processDeathAndRespawn` で固定値 `DEFAULT_RESPAWN_TIME` の代わりにレベル依存の値を使用する
- `DEFAULT_RESPAWN_TIME` 定数は基本値として残し、レベル係数を追加する

## Capabilities

### New Capabilities
- `respawn-timer-scaling`: リスポーン時間のレベル連動ロジック。レベル→リスポーン秒数の算出式、定数定義、純粋関数

### Modified Capabilities
- `death-respawn`: リスポーンタイマー設定時にレベル依存の値を使用するよう要件変更

## Impact

- `shared/constants.ts` — リスポーン時間関連の定数追加
- `shared/systems/` — リスポーン時間算出の純粋関数追加
- `server/src/game/ServerDeathSystem.ts` — `processDeathAndRespawn` でレベル依存タイマー使用
- `server/src/__tests__/ServerDeathSystem.test.ts` — レベル連動テスト追加
- クライアント側変更なし（`respawnTimer` は既に Schema 経由で同期済み）
