## 1. ドメインロジック — プロジェクタイル

- [x] 1.1 `src/domain/projectile/ProjectileState.ts` を作成: `ProjectileState` インターフェース + `createProjectile` 純粋関数
- [x] 1.2 `src/domain/projectile/updateProjectile.ts` を作成: 追尾移動の純粋関数
- [x] 1.3 `src/domain/projectile/checkProjectileHit.ts` を作成: 衝突判定の純粋関数
- [x] 1.4 `src/domain/projectile/updateProjectiles.ts` を作成: プール全体の更新（移動 + 衝突 + ターゲット消滅チェック → DamageEvent[] + 残存プロジェクタイル[]）
- [x] 1.5 上記 4 ファイルのユニットテストを作成（spec のシナリオをカバー）

## 2. HeroDefinition の拡張

- [x] 2.1 `HeroDefinition` に `projectileSpeed` と `projectileRadius` を追加。BLADE: 0/0、BOLT: 600/4、AURA: 400/5
- [x] 2.2 既存テストが壊れていないことを確認

## 3. 攻撃システムの修正

- [x] 3.1 `ProjectileSpawnEvent` インターフェースを `updateAttackState.ts` に追加
- [x] 3.2 `AttackStateResult` に `projectileSpawnEvents` 配列を追加
- [x] 3.3 `updateAttackState` を修正: `projectileSpeed > 0` の場合 DamageEvent の代わりに ProjectileSpawnEvent を発行
- [x] 3.4 既存の近接攻撃テストが引き続き PASS することを確認 + 遠距離攻撃のテストを追加

## 4. レンダラー

- [x] 4.1 `src/scenes/effects/ProjectileRenderer.ts` を作成: 単一 Graphics で全プロジェクタイルを毎フレーム描画

## 5. GameScene 統合

- [x] 5.1 GameScene に `projectiles: ProjectileState[]` フィールドと `ProjectileRenderer` を追加
- [x] 5.2 `processAttack` を修正: `projectileSpawnEvents` からプロジェクタイルを生成、近接時のみ `meleeSwing.play()` を呼ぶ
- [x] 5.3 update ループに `updateProjectiles` → DamageEvent 処理 → ProjectileRenderer 描画を追加

## 6. E2E テスト

- [x] 6.1 E2E テスト: BOLT に切り替えて攻撃し、プロジェクタイル命中後に敵 HP が減少することを検証
