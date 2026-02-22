## Why

現在のオンラインモードの戦闘エフェクトは状態差分検知（HP 変化でフラッシュ、attackCooldown 増加でスイング）で実装しているが、スキル/タレント/エフェクト追加のたびにプロパティ監視パターンを個別に追加する必要があり拡張性に欠ける。サーバーからの明示的イベントメッセージに移行し、将来のスキルシステム・レーン処理に耐えうる基盤を構築する。

## What Changes

- サーバーが攻撃・ダメージ・死亡/リスポーン発生時に `room.broadcast()` で明示的イベントを送信する
- クライアントが `room.onMessage()` でイベントを受信し、エフェクトを描画する
- **BREAKING**: GameScene の `handleServerHeroUpdate` / `handleServerTowerUpdate` から state-diff 検知ロジック（HP 比較、attackCooldown 比較）を削除
- OnlineGameMode の `attackCooldown` Colyseus リスナーを削除（毎 tick 発火を解消、帯域最適化）
- イベントごとに型安全な分離型メッセージを定義（AttackEvent, DamageEvent, DeathEvent）
- 死亡/リスポーンの予測リセット（InputBuffer.clear, MovementPredictor.setPosition）は `dead` プロパティの状態同期に残す（予測と密結合のため）
- オフラインモードは変更なし（ローカル CombatManager が直接エフェクトをトリガー）

## Non-Goals

- スキルシステムの実装（イベント基盤のみ。スキル固有イベントは将来追加）
- 死亡時カメラ操作の実装（死亡時キャラ非表示 + カメラ自由操作は別 Issue で対応）
- ダメージ数値表示やヒットストップなどの追加エフェクト

## Capabilities

### New Capabilities
- `combat-events`: サーバー→クライアントの戦闘イベントメッセージ基盤（AttackEvent, DamageEvent, DeathEvent の定義・送受信・エフェクト連携）

### Modified Capabilities
（既存 spec への要件変更なし。実装詳細の変更のみ）

## Impact

- **サーバー**: `ServerCombatManager`、`ServerProjectileSystem`、`ServerDeathSystem` にイベント発行を追加。`GameRoom` で broadcast 処理を追加
- **クライアント**: `OnlineGameMode` にイベントリスナー追加。`GameMode` インターフェースに `onCombatEvent` 系コールバック追加。`GameScene` の state-diff 検知を削除しイベントハンドラに置換
- **共有**: `shared/messages.ts` にイベント型定義を追加
- **テスト**: GameScene / OnlineGameMode / サーバー側のテスト更新
- **帯域**: `attackCooldown` リスナー削除で毎 tick の不要な通知がなくなる（4ヒーロー × 20tick/s = 80 calls/s 削減）
