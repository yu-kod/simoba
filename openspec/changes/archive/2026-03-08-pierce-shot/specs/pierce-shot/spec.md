## ADDED Requirements

### Requirement: Pierce Shot スキル定義
`shared/skills/skillDefinitions.ts` に `ProjectileEffectParams` インターフェースと `pierce-shot` スキル定義を追加しなければならない（SHALL）。`ProjectileEffectParams` は `effectType: 'projectile'`, `damage`, `speed`, `range`, `radius`, `pierceCount`, `homing` フィールドを持たなければならない（SHALL）。`SkillEffectParams` 共用体に `ProjectileEffectParams` を追加しなければならない（SHALL）。

#### Scenario: Pierce Shot 定義の参照
- **WHEN** `getSkillDefinition('pierce-shot')` を呼び出す
- **THEN** `{ id: 'pierce-shot', targeting: 'direction', cooldown: 5, effect: { effectType: 'projectile', damage: 60, speed: 800, range: 600, radius: 5, pierceCount: 3, homing: false } }` が返される

#### Scenario: SkillEffectParams 共用体
- **WHEN** `SkillEffectParams` 型を参照する
- **THEN** `DashEffectParams | ProjectileEffectParams` の共用体型である

### Requirement: projectile エフェクトハンドラ
`projectileEffectHandler` は effectType `'projectile'` のスキル発動時にプロジェクタイルを生成しなければならない（SHALL）。生成されるプロジェクタイルは `SkillExecutionContext` の `direction` 方向に直進し、`ProjectileEffectParams` のパラメータ（damage, speed, range, radius, pierceCount）を持たなければならない（SHALL）。

#### Scenario: Pierce Shot 発動でプロジェクタイルが生成される
- **WHEN** ヒーローが Pierce Shot を direction (1, 0) で発動する
- **THEN** ヒーローの位置から direction (1, 0) に直進するプロジェクタイルが生成され、damage=60, speed=800, range=600, pierceCount=3 のパラメータを持つ

#### Scenario: SkillExecutionContext にプロジェクタイル参照が提供される
- **WHEN** projectile effectType のスキルが発動される
- **THEN** `SkillExecutionContext.projectiles` を通じて `MapSchema<ProjectileSchema>` にアクセスでき、新しいプロジェクタイルを追加できる

### Requirement: Pierce Shot のクールダウン設定
Pierce Shot 発動後、使用したスロットのクールダウンが 5 秒にセットされなければならない（SHALL）。これは既存の `executeSkill` のクールダウン設定ロジックで自動的に処理される。

#### Scenario: 発動後のクールダウン
- **WHEN** ヒーローが Q スロットの Pierce Shot を発動する
- **THEN** `cooldownQ` が 5 にセットされる

### Requirement: 貫通による複数ヒット
Pierce Shot のプロジェクタイルは最大 `pierceCount` 体の敵を貫通しなければならない（SHALL）。同じ敵には1回のみヒットしなければならない（SHALL）。`pierceCount` 体にヒットした後、プロジェクタイルは除去されなければならない（SHALL）。

#### Scenario: 3体の敵を貫通する
- **WHEN** pierceCount=3 のプロジェクタイルが一直線上の敵3体を通過する
- **THEN** 3体すべてにダメージが適用され、3体目ヒット後にプロジェクタイルが除去される

#### Scenario: 同じ敵に2回ヒットしない
- **WHEN** プロジェクタイルが敵Aにヒットした後、敵Aの判定範囲内に留まる
- **THEN** 敵Aへの追加ダメージは発生しない

### Requirement: 射程制限
直進プロジェクタイルは `maxRange` で指定された距離を超えて飛行してはならない（SHALL）。累計移動距離が `maxRange` 以上になった時点でプロジェクタイルを除去しなければならない（SHALL）。

#### Scenario: 最大射程で消滅する
- **WHEN** range=600 のプロジェクタイルが 600px 以上移動した
- **THEN** プロジェクタイルが除去される

#### Scenario: 射程内では飛行を継続する
- **WHEN** range=600 のプロジェクタイルが 300px 移動した時点
- **THEN** プロジェクタイルは飛行を継続する
