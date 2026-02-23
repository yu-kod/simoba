## 1. Domain — 型・定数の追加

- [x] 1.1 `HeroState` に `dead: boolean`, `respawnTimer: number`, `deathPosition: Position` を追加し、`createHeroState` で初期値をセット
- [x] 1.2 `constants.ts` に `DEFAULT_RESPAWN_TIME = 5` を追加
- [x] 1.3 `RespawnPositionResolver` 型とデフォルト実装 `baseRespawn` を作成（`mapLayout.ts` のベース中央座標を返す）

## 2. Domain — 死亡・リスポーン純粋関数

- [x] 2.1 `checkDeath(hero, respawnTime?)` — HP<=0 なら dead:true, respawnTimer セット, deathPosition 記録。ユニットテスト作成
- [x] 2.2 `updateRespawnTimer(hero, deltaSeconds)` — dead 中のみタイマー減算。ユニットテスト作成
- [x] 2.3 `respawn(hero, respawnPosition)` — dead:false, hp:maxHp, position リセット, attackTargetId/attackCooldown リセット。ユニットテスト作成

## 3. EntityManager — 死亡フィルタ

- [x] 3.1 `getEnemies()` で `dead === true` を除外するフィルタを追加。ユニットテスト作成
- [x] 3.2 プロジェクタイル衝突判定で死亡ターゲットを除外（`CombatManager.processProjectiles` のターゲットリスト）

## 4. GameScene — ゲームループ統合

- [x] 4.1 `update()` 内でダメージ適用後に `checkDeath` を呼び出し、ローカルヒーロー・敵の死亡チェック
- [x] 4.2 死亡中のローカルヒーローの移動・攻撃入力をスキップ
- [x] 4.3 `updateRespawnTimer` を毎フレーム呼び出し、タイマー 0 到達時に `respawn` を実行
- [x] 4.4 敵 Bot にも同じ死亡チェック・リスポーン処理を適用

## 5. カメラ制御

- [x] 5.1 ローカルヒーロー死亡時にカメラ追従を解除（`stopFollow`）、WASD でカメラ位置を直接移動
- [x] 5.2 リスポーン時にカメラをベース位置に移動し、ヒーロー追従を再開（`startFollow`）

## 6. 描画 — 死亡中の非表示

- [x] 6.1 `HeroRenderer.sync()` で `dead === true` のとき `setVisible(false)`、復活時に `setVisible(true)`
- [x] 6.2 HP バーも同様に死亡中は非表示

## 7. リスポーンタイマー UI

- [x] 7.1 Phaser Text で「Respawning in X...」を画面中央に表示。dead 中のみ visible、小数切り上げ整数秒表示

## 8. E2E テスト API 拡張

- [x] 8.1 `getHeroDead()`, `getEnemyDead()` を E2E テスト API に追加
- [x] 8.2 死亡・リスポーンの E2E テストを作成（敵を倒す→非表示→タイマー経過→リスポーン確認）
