## MODIFIED Requirements

### Requirement: スキルメタデータ定義
各スキルの共通パラメータ（`cooldown`, `range`, `targeting`）を共有定数テーブルとして定義しなければならない（SHALL）。`targeting` は `'direction' | 'point' | 'self' | 'ally' | 'enemy'` のいずれかでなければならない（SHALL）。スキル定義はサーバーとクライアントの両方から参照可能な `shared/` 配下に配置しなければならない（SHALL）。`ally` および `enemy` ターゲティングのスキルは `range` フィールド（ターゲット選択射程 px）を持たなければならない（SHALL）。

#### Scenario: enemy ターゲティングスキルの range 参照
- **WHEN** `aura-weaken` のメタデータを取得する
- **THEN** `range: 500` がスキル定義レベルで取得できる

## ADDED Requirements

### Requirement: resolveEnemyTarget
`executeSkill` 内で `targeting: 'enemy'` のスキルの場合、クリック座標から最寄りの **敵チーム** 生存ヒーローを `range` 以内で検索しなければならない（SHALL）。射程内に敵がいない場合は `null` を返さなければならない（SHALL）。`resolveEnemyTarget` で解決された敵ヒーローは `SkillExecutionContext.targetHero` として渡されなければならない（SHALL）。`targetHero` が `null`（射程外）の場合、`executeSkill` は `null` を返し、クールダウンは消費されない（SHALL NOT）。

#### Scenario: 敵が射程内にいる
- **WHEN** enemy ターゲティングで敵ヒーローがクリック位置から range 以内にいる
- **THEN** その敵ヒーローが `targetHero` としてエフェクトハンドラに渡される

#### Scenario: 敵が射程外
- **WHEN** enemy ターゲティングで敵ヒーローがクリック位置から range 外にいる
- **THEN** `executeSkill` は `null` を返し、クールダウンは消費されない

#### Scenario: 味方を敵として選択しない
- **WHEN** enemy ターゲティングで味方ヒーローのみがクリック位置付近にいる
- **THEN** `resolveEnemyTarget` は `null` を返し、スキルが不発になる
