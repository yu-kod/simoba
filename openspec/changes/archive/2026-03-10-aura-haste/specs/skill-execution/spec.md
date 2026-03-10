## MODIFIED Requirements

### Requirement: スキルメタデータ定義
各スキルの共通パラメータ（`cooldown`, `range`, `targeting`）を共有定数テーブルとして定義しなければならない（SHALL）。`targeting` は `'direction' | 'point' | 'self' | 'ally'` のいずれかでなければならない（SHALL）。スキル定義はサーバーとクライアントの両方から参照可能な `shared/` 配下に配置しなければならない（SHALL）。`ally` ターゲティングのスキルは `range` フィールド（味方選択射程 px）を持たなければならない（SHALL）。

#### Scenario: スキル定義の参照
- **WHEN** サーバーまたはクライアントがスキルID `blade-charge` のメタデータを取得する
- **THEN** cooldown, targeting 等のパラメータが返される

#### Scenario: ally ターゲティングスキルの range 参照
- **WHEN** `aura-heal` のメタデータを取得する
- **THEN** `range: 400` がスキル定義レベルで取得できる

## ADDED Requirements

### Requirement: getAllyRange の汎用化
`executeSkill` 内の ally ターゲット射程取得は `SkillDefinition.range` フィールドを使用しなければならない（SHALL）。effectType に依存してはならない（SHALL）。

#### Scenario: heal スキルの射程取得
- **WHEN** ally ターゲティングで `aura-heal`（range: 400）のターゲット解決を行う
- **THEN** `def.range` から 400 が取得される

#### Scenario: buff スキルの射程取得
- **WHEN** ally ターゲティングで `aura-haste`（range: 400）のターゲット解決を行う
- **THEN** `def.range` から 400 が取得される
