## 1. 共有ドメイン移動 (shared-domain)

- [x] 1.1 `shared/messages.ts` を作成 — `InputMessage` 型（seq, moveDir, attackTargetId, facing）を定義
- [x] 1.2 `shared/constants.ts` を作成 — MAP_WIDTH, MAP_HEIGHT, RESPAWN_TIME, DEFAULT_ENTITY_RADIUS 等のゲーム定数を `src/` から移動
- [x] 1.3 `shared/combat.ts` を作成 — `applyDamage()`, `isInAttackRange()`, `checkDeath()`, `checkHeroDeath()` を `src/domain/` から移動
- [x] 1.4 `shared/entities/Hero.ts` を作成 — `HERO_DEFINITIONS`, `createHeroState()`, `HeroState` を `src/domain/entities/Hero.ts` から移動
- [x] 1.5 `shared/entities/Tower.ts` を作成 — `TOWER_DEFINITIONS`, `createTowerState()` を `src/domain/entities/Tower.ts` から移動
- [x] 1.6 クライアント側の import パスを更新 — `src/domain/` から `@shared/` への参照に変更
- [x] 1.7 サーバー側の `tsconfig.json` に `@shared/*` パスエイリアスが正しく設定されていることを確認
- [x] 1.8 既存のユニットテストが全パスすることを確認

## 2. Colyseus スキーマ拡張 (server-game-loop, online-multiplayer)

- [x] 2.1 `server/src/schema/HeroSchema.ts` を作成 — id, x, y, facing, hp, maxHp, dead, team, heroType, attackCooldown, attackTargetId, speed, attackDamage, attackRange, attackSpeed, radius, respawnTimer の `@type` フィールド
- [x] 2.2 `server/src/schema/TowerSchema.ts` を作成 — id, x, y, hp, maxHp, dead, team, radius, attackCooldown, attackTargetId, attackDamage, attackRange, attackSpeed の `@type` フィールド
- [x] 2.3 `server/src/schema/ProjectileSchema.ts` を作成 — id, x, y, targetX, targetY, speed, damage, ownerId, team の `@type` フィールド
- [x] 2.4 `GameRoomState` を更新 — `players` MapSchema を `heroes` MapSchema<HeroSchema> に変更、`towers`, `projectiles` MapSchema を追加、`matchTime` フィールドを追加
- [x] 2.5 既存の `PlayerSchema` を削除し、`HeroSchema` に置き換え

## 3. サーバーゲームロジック (server-game-loop)

- [x] 3.1 `server/src/game/ServerMovementSystem.ts` を作成 — moveDir 入力から位置計算、マップ境界クランプ、dead ヒーローの移動無視
- [x] 3.2 `server/src/game/ServerCombatManager.ts` を作成 — 攻撃ステートマシン（クールダウン管理、射程・対象バリデーション、近接ダメージ適用、投射物生成）
- [x] 3.3 `server/src/game/ServerProjectileSystem.ts` を作成 — 投射物の位置更新、衝突判定（radius ベース）、命中時ダメージ適用、射程外削除
- [x] 3.4 `server/src/game/ServerTowerSystem.ts` を作成 — タワーの自動ターゲット選択、クールダウン管理、投射物生成、dead タワーのスキップ
- [x] 3.5 `server/src/game/ServerDeathSystem.ts` を作成 — 全ヒーローの死亡判定（hp <= 0 → dead: true）、respawnTimer 管理、リスポーン処理（HP 全回復、スポーン位置移動）
- [x] 3.6 `GameRoom.update()` を実装 — `setSimulationInterval(16.6ms)` で 60Hz ティック。処理順: 入力適用 → 移動 → 攻撃 → 投射物 → 死亡/リスポーン

## 4. GameRoom 入力処理 (server-game-loop, online-multiplayer)

- [x] 4.1 `GameRoom.onMessage('input')` を実装 — `InputMessage` を受信し、プレイヤーの最新入力として保持
- [x] 4.2 `GameRoom.onJoin()` を更新 — `HeroSchema` を `heroes` MapSchema に追加、チーム・スポーン位置を設定
- [x] 4.3 `GameRoom.onCreate()` を更新 — `gameStarted` 時にタワーを `towers` MapSchema に登録
- [x] 4.4 `GameRoom.onLeave()` を更新 — `heroes` MapSchema からプレイヤーを削除
- [x] 4.5 既存の `updatePosition`, `damage`, `projectileSpawn` メッセージハンドラを削除

## 5. クライアント OnlineGameMode 更新 (client-prediction, online-multiplayer)

- [x] 5.1 `OnlineGameMode` を更新 — `sendLocalState()` を `sendInput(inputMessage)` に変更、毎フレーム `input` メッセージを送信
- [x] 5.2 `OnlineGameMode` に Colyseus state コールバック実装 — `heroes`/`towers`/`projectiles` の `onAdd`/`onRemove`/`onChange` で EntityManager を更新
- [x] 5.3 `sendDamageEvent()` と `sendProjectileSpawn()` を削除 — サーバーが管理するため不要
- [x] 5.4 `lastProcessedSeq` の受信処理を実装 — サーバーからの state 更新に含まれる seq をクライアント予測 reconciliation に使用

## 6. クライアント予測 (client-prediction)

- [x] 6.1 `src/network/InputBuffer.ts` を作成 — seq 付き入力のバッファ管理（追加、確認済み削除、未確認入力の取得）
- [x] 6.2 `src/network/MovementPredictor.ts` を作成 — ローカル移動予測の適用、サーバー位置を基準にした reconciliation ロジック
- [x] 6.3 GameScene のオンラインモード更新 — ローカルヒーロー移動のみ予測実行、攻撃処理・ダメージ適用をスキップ（サーバーに委譲）

## 7. NetworkBridge 更新 (client-prediction, online-multiplayer)

- [x] 7.1 `NetworkBridge` を更新 — `sendDamageEvent`/`sendProjectileSpawn` を削除、`sendInput` に統一
- [x] 7.2 `NetworkBridge` のコールバック更新 — `onRemoteDamage`/`onRemoteProjectileSpawn` を削除、Colyseus state 同期ベースに変更
- [x] 7.3 GameScene の分岐更新 — オンラインモード時は CombatManager のローカル処理をスキップ、オフラインモード時は既存ロジック維持

## 8. サーバーユニットテスト (server-game-loop)

- [x] 8.1 `ServerMovementSystem` のテスト — 移動計算、境界クランプ、dead ヒーロー移動無視
- [x] 8.2 `ServerCombatManager` のテスト — クールダウン、射程バリデーション、近接ダメージ、投射物生成
- [x] 8.3 `ServerProjectileSystem` のテスト — 移動、衝突判定、命中ダメージ、射程外削除
- [x] 8.4 `ServerTowerSystem` のテスト — 自動ターゲット、投射物生成、dead タワースキップ
- [x] 8.5 `ServerDeathSystem` のテスト — 死亡判定、リスポーンタイマー、リスポーン処理
- [x] 8.6 `GameRoom` 統合テスト — ティックループの処理順序、入力受信からの状態変更

## 9. クライアントテスト (client-prediction)

- [x] 9.1 `InputBuffer` のテスト — バッファ追加、seq 削除、未確認入力取得
- [x] 9.2 `MovementPredictor` のテスト — 予測適用、reconciliation
- [x] 9.3 既存ユニットテストの更新 — shared/ への import パス変更に追従
- [x] 9.4 既存 E2E テストがオフラインモードで引き続きパスすることを確認

## 10. 結合テスト・動作確認

- [ ] 10.1 `npm run dev` でクライアント + サーバーを同時起動し、2 ブラウザタブでオンライン対戦を確認
- [ ] 10.2 移動の同期を確認 — 両プレイヤーで相手の位置が正しく表示される
- [ ] 10.3 攻撃・ダメージの同期を確認 — 両プレイヤーで HP が一致する
- [ ] 10.4 死亡・リスポーンの同期を確認 — 両プレイヤーで死亡状態が一致する
- [ ] 10.5 タワー攻撃の同期を確認 — 両プレイヤーでタワーの HP・投射物が一致する
- [ ] 10.6 オフラインモード（Bot 戦）が既存通り動作することを確認
