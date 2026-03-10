## ADDED Requirements

### Requirement: aura-weaken スキル定義
`SKILL_DEFINITIONS` に `aura-weaken` エントリを追加しなければならない（SHALL）。`targeting: 'enemy'`、`cooldown: 14`、`range: 500`、`effect` は `BuffEffectParams` で `buffType: 'attackDamage'`、`value: -15`、`duration: 4`、`isDebuff: true` でなければならない（SHALL）。

#### Scenario: aura-weaken スキル定義の参照
- **WHEN** `getSkillDefinition('aura-weaken')` を呼び出す
- **THEN** `targeting: 'enemy'`、`cooldown: 14`、`range: 500`、`effect.effectType: 'buff'`、`effect.buffType: 'attackDamage'`、`effect.value: -15`、`effect.duration: 4`、`effect.isDebuff: true` のスキル定義が返される

### Requirement: 攻撃力デバフの反映
`ServerCombatManager` でヒーローの攻撃ダメージを計算する際、`hero.attackDamage + getStatusEffectValue(hero, 'attackDamage')` を実効攻撃力として使用しなければならない（SHALL）。実効攻撃力は 0 以下にクランプしなければならない（SHALL）。

#### Scenario: デバフ中の攻撃力低下
- **WHEN** `hero.attackDamage` が 50、`attackDamage` デバフの合算値が -15 の状態でメレー攻撃する
- **THEN** 実効攻撃力が 35 でダメージ計算される

#### Scenario: デバフなしの攻撃力
- **WHEN** `attackDamage` のステータスエフェクトがない状態で攻撃する
- **THEN** `hero.attackDamage` がそのまま使用される

#### Scenario: デバフが攻撃力を超過する場合
- **WHEN** `hero.attackDamage` が 50、デバフ合算値が -60 の状態で攻撃する
- **THEN** 実効攻撃力は 0 にクランプされ、ダメージは 0 になる

### Requirement: 敵ターゲットへのデバフ適用
`executeSkill` で `targeting: 'enemy'` のスキルを発動した場合、`resolveEnemyTarget` で解決された敵ヒーローの `statusEffects` にデバフが適用されなければならない（SHALL）。射程内に敵がいない場合はスキルが不発（null を返す）でなければならない（SHALL）。

#### Scenario: 敵にデバフを適用
- **WHEN** `aura-weaken` を装備し、敵ヒーローから range 以内の位置をクリックする
- **THEN** 敵ヒーローの `statusEffects` に `'aura-weaken'` エントリが追加される

#### Scenario: 射程外で不発
- **WHEN** `aura-weaken` を装備し、敵ヒーローから range 外の位置をクリックする
- **THEN** スキルが不発（null）となり、クールダウンは消費されない
