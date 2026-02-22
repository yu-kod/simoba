## 1. ダメージフラッシュ（HP 差分検知）

- [x] 1.1 `handleServerHeroUpdate` で更新前の HP を取得し、`state.hp < prevHp` の場合 `flash()` を呼ぶ（ローカル・リモート両方）
- [x] 1.2 `handleServerTowerUpdate` で同様に HP 差分検知 → `flash()` を呼ぶ

## 2. メレースイング（attackCooldown 変化検知）

- [x] 2.1 `OnlineGameMode.setupListeners` に `attackCooldown` の listen コールバックを追加し、`ServerHeroState` に `attackCooldown` フィールドを追加
- [x] 2.2 `GameScene.handleServerHeroUpdate` で `attackCooldown` が 0→正値に変化したことを検知し、近接ヒーロー（`projectileSpeed === 0`）の場合のみ `meleeSwing.play()` を呼ぶ

## 3. 死亡/リスポーン時の予測リセット

- [x] 3.1 `handleServerHeroUpdate` でローカルヒーローの `dead` が `false→true` に遷移した時 `InputBuffer.clear()` + `MovementPredictor.setPosition()` を呼ぶ
- [x] 3.2 リスポーン（`dead: true→false`）時も `MovementPredictor.setPosition(state.x, state.y)` でリセット

## 4. テスト

- [x] 4.1 ユニットテスト：HP 差分検知ロジックのテスト（ヒーロー・タワー）
- [x] 4.2 全テスト PASS を確認（`npm run test:unit` + サーバーテスト）
- [x] 4.3 手動テスト：オンラインモードで攻撃時のフラッシュ・メレースイング・死亡/リスポーンを確認
