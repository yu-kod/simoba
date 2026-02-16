## 1. HeroState・HeroDefinition の拡張

- [x] 1.1 `HeroDefinition` に `canMoveWhileAttacking: boolean` を追加する（BLADE=true, BOLT=false, AURA=false）（spec: hero-stats）
- [x] 1.2 `HeroState` に `attackCooldown: number`、`attackTargetId: string | null` を追加し、`createHeroState` で初期値を設定する（spec: hero-stats）
- [x] 1.3 上記変更のユニットテストを作成する（Hero.test.ts の既存テスト更新 + 新規テスト追加）

## 2. 攻撃ドメイン純粋関数

- [x] 2.1 `findClickTarget(clickWorldPos, enemies[], radiusMap)` — クリック位置×敵 radius ヒットテストの純粋関数を作成する（spec: attack-system「右クリックによるターゲット指定」）
- [x] 2.2 `isInAttackRange(attacker, target, attackerRadius, targetRadius)` — 攻撃距離判定の純粋関数を作成する（spec: attack-system「攻撃距離判定」）
- [x] 2.3 `applyDamage(target, damage)` — ダメージ適用の純粋関数を作成する（HP を 0 下限クランプ、イミュータブル更新）（spec: attack-system「ダメージ適用」）
- [x] 2.4 `updateAttackState(hero, target, deltaTime, attackerRadius, targetRadius)` — 攻撃状態マシンの純粋関数を作成する（クールダウン管理、範囲判定、DamageEvent 発行）（spec: attack-system「攻撃状態マシン」「攻撃クールダウン」）
- [x] 2.5 上記 2.1〜2.4 のユニットテストを作成する（各 spec の Scenario をカバー）

## 3. facing 更新の拡張

- [x] 3.1 `updateFacing` を拡張して `attackTargetId` による facing 優先度を実装する（攻撃ターゲット方向 > 移動方向 > 現在値維持）（spec: hero-stats「向きの更新」、attack-system「攻撃中の facing 制御」）
- [x] 3.2 updateFacing 拡張のユニットテストを作成する（攻撃中のターゲット方向固定、攻撃+移動時の優先度）

## 4. 攻撃エフェクト（View 層）

- [x] 4.1 `AttackEffectRenderer` インターフェースを定義する（play, update, isActive, destroy）（spec: attack-system「攻撃エフェクトの抽象化」）
- [x] 4.2 `MeleeSwingRenderer` を実装する（前方扇形のジオメトリック描画、150ms フェードアウト）
- [x] 4.3 `HeroRenderer` に `flash()` メソッドを追加する（被ダメージ時のヒットフラッシュ）（spec: attack-system「被ダメージエフェクト」）

## 5. GameScene 統合

- [x] 5.1 敵ヒーロー（red チーム、静止 BLADE）を仮配置し、HeroRenderer で描画する（design: Decision 9）
- [x] 5.2 右クリック → `findClickTarget` → `attackTargetId` 設定のフローを実装する
- [x] 5.3 update ループに `updateAttackState` を組み込み、ダメージイベント → `applyDamage` → HP 更新を実装する
- [x] 5.4 `canMoveWhileAttacking` による移動中攻撃 / 攻撃キャンセルの制御を実装する（spec: attack-system「移動中攻撃フラグ」）
- [x] 5.5 ダメージイベント発生時に `MeleeSwingRenderer.play()` と敵 `HeroRenderer.flash()` を呼び出すエフェクト統合を実装する

## 6. E2E テスト

- [x] 6.1 攻撃フローの E2E テストを作成する（敵クリック → 攻撃エフェクト表示 → 敵 HP 減少の確認）
