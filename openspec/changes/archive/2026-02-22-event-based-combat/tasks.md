## 1. 共有メッセージ型定義

- [x] 1.1 `shared/messages.ts` に AttackEvent, DamageEvent, DeathEvent の型定義を追加する

## 2. サーバー: イベント発行

- [x] 2.1 `processHeroCombat` の戻り値をイベント配列に変更し、melee/ranged 攻撃時に AttackEvent + DamageEvent（melee のみ）を返す
- [x] 2.2 `processProjectiles` の戻り値をイベント配列に変更し、投射物ヒット時に DamageEvent を返す
- [x] 2.3 `processTowerCombat` の戻り値をイベント配列に変更し、タワー攻撃時に AttackEvent + DamageEvent を返す
- [x] 2.4 `processDeathAndRespawn` の戻り値をイベント配列に変更し、死亡時に DeathEvent(death)、リスポーン時に DeathEvent(respawn) を返す
- [x] 2.5 `GameRoom.gameUpdate()` で各 process 関数の戻り値を集約し、`room.broadcast()` で送信する
- [x] 2.6 サーバー側の既存テストを更新し、各 process 関数がイベントを正しく返すことを検証する

## 3. クライアント: イベント受信基盤

- [ ] 3.1 `GameMode` インターフェースに `onAttackEvent`, `onDamageEvent`, `onDeathEvent` コールバック登録メソッドを追加する
- [ ] 3.2 `OnlineGameMode` に `room.onMessage('attack'|'damage'|'death', ...)` リスナーを実装する
- [ ] 3.3 `OfflineGameMode` に no-op 実装を追加する
- [x] 3.4 `NetworkBridge` にイベントコールバックの配線を追加する（setupCallbacks 内）

## 4. クライアント: エフェクト連携

- [x] 4.1 `GameScene` に DamageEvent ハンドラを追加し、`entityRenderers.get(targetId)?.flash()` を呼ぶ（ヒーロー・タワー両対応）
- [x] 4.2 `GameScene` に AttackEvent ハンドラを追加し、melee の場合 `meleeSwing.play()` を呼ぶ
- [x] 4.3 `GameScene` に DeathEvent ハンドラを追加する（将来のビジュアル用。現時点では受信のみ）

## 5. state-diff 検知の削除

- [x] 5.1 `handleServerHeroUpdate` から prevHp 比較 → flash() ロジックを削除する
- [x] 5.2 `handleServerHeroUpdate` から prevAttackCooldown 比較 → meleeSwing.play() ロジックを削除する
- [x] 5.3 `handleServerTowerUpdate` から prevHp 比較 → flash() ロジックを削除する
- [x] 5.4 `OnlineGameMode` から `$(hero).listen('attackCooldown', ...)` リスナーを削除する
- [x] 5.5 エンティティ更新から `attackCooldown` フィールド同期を削除する（handleServerHeroUpdate 内の updateEntity 呼び出し）

## 6. テスト

- [x] 6.1 GameScene のイベントハンドラ（damage flash, melee swing）のユニットテストを追加する
- [x] 6.2 state-diff 検知が削除されていることを確認するテストを追加する（HP 変化のみでは flash しない等）
- [x] 6.3 既存の GameScene テスト（death/respawn 予測リセット）が引き続き PASS することを確認する
- [x] 6.4 全テスト（クライアント + サーバー）を実行し PASS を確認する
