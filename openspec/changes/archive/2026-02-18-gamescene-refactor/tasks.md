## 1. EntityManager の抽出

- [x] 1.1 `src/scenes/EntityManager.ts` を作成。ローカルヒーロー、敵、リモートプレイヤーの state を保持する plain class を実装 (`localHero`, `getEntity()`, `getEnemies()`, `getEntityRadius()`)
- [x] 1.2 リモートプレイヤー管理メソッドを実装 (`addRemotePlayer()`, `removeRemotePlayer()`, `updateRemotePlayer()`)
- [x] 1.3 EntityManager のユニットテストを作成 (エンティティの追加・削除・検索・radius 取得)

## 2. CombatManager の抽出

- [x] 2.1 `src/scenes/CombatManager.ts` を作成。EntityManager を受け取り、`processAttack()`, `processProjectiles()`, `handleAttackInput()` を実装。戻り値は CombatEvents (damageEvents, projectileSpawnEvents, meleeSwings)
- [x] 2.2 `applyLocalDamage()` を CombatManager に移動。EntityManager 経由でターゲットの state を更新
- [x] 2.3 CombatManager のユニットテストを作成 (攻撃処理・投射物ライフサイクル・ダメージ適用)

## 3. NetworkBridge の抽出

- [x] 3.1 `src/scenes/NetworkBridge.ts` を作成。GameMode + EntityManager + CombatManager を受け取り、`setupCallbacks()` でコールバックを配線
- [x] 3.2 アウトバウンドイベント送信 (`sendLocalState()`, `sendDamageEvent()`, `sendProjectileSpawn()`) を実装
- [x] 3.3 NetworkBridge のユニットテストを作成 (コールバック配線・イベント送信)

## 4. GameScene の統合

- [x] 4.1 GameScene.create() でマネージャーを初期化し、既存のインライン処理を各マネージャーへの委譲に置き換え
- [x] 4.2 GameScene.update() のオーケストレーションを各マネージャーの呼び出しに置き換え (実行順序は維持)
- [x] 4.3 不要になった private メソッドを GameScene から削除

## 5. 検証

- [x] 5.1 `npm run test:unit` — 既存ユニットテスト + 新規マネージャーテストが全て PASS
- [x] 5.2 `npm run test:e2e` — 既存 E2E テストが全て PASS
- [x] 5.3 GameScene.ts が 212 行 (E2E 互換ゲッター含む、457→212 で 54% 削減)
