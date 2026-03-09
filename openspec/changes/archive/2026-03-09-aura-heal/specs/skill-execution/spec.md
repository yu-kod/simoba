## MODIFIED Requirements

### Requirement: useSkill メッセージ
クライアントは `useSkill` メッセージ（`slot: 'Q' | 'E' | 'R'`, `target: { x: number, y: number }`）をサーバーに送信しなければならない（SHALL）。サーバーは受信時に以下を検証しなければならない（SHALL）：該当スロットにスキルが装備されていること、スロットのクールダウンが 0 であること、ヒーローが生存中であること。検証失敗時はメッセージを無視しなければならない（SHALL）。

`ally` ターゲティングのスキルの場合、サーバーはクリック座標から最寄りの同チーム生存ヒーローを検索しなければならない（SHALL）。最寄りヒーローがスキルの `range` 以内にいる場合、そのヒーローを対象としなければならない（SHALL）。射程内に味方がいない場合、発動者自身を対象としなければならない（SHALL）。解決されたターゲットは `SkillExecutionContext.targetHero` として渡されなければならない（SHALL）。

#### Scenario: 正常なスキル発動
- **WHEN** ヒーローが生存中で、Q スロットに `blade-charge` が装備されており、CD が 0 の状態で `useSkill { slot: 'Q', target: { x: 500, y: 300 } }` を送信する
- **THEN** サーバーがスキル効果を実行し、Q スロットのクールダウンがスキル定義の cooldown 値にセットされる

#### Scenario: クールダウン中のスキル発動拒否
- **WHEN** Q スロットのクールダウンが 0 より大きい状態で `useSkill { slot: 'Q', ... }` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 死亡中のスキル発動拒否
- **WHEN** ヒーローが死亡中に `useSkill` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 空スロットのスキル発動拒否
- **WHEN** Q スロットが空（スキル未装備）の状態で `useSkill { slot: 'Q', ... }` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: ally ターゲティングで味方を回復
- **WHEN** `aura-heal`（ally ターゲティング, range: 400）を装備し、味方ヒーローの近く（距離 300px）をクリックする
- **THEN** 最寄りの同チーム生存ヒーローが `targetHero` としてエフェクトハンドラに渡され、回復が実行される

#### Scenario: ally ターゲティングで射程外 — 自己回復
- **WHEN** `aura-heal`（range: 400）を装備し、味方ヒーローから 500px 離れた位置をクリックする
- **THEN** 発動者自身が `targetHero` としてセットされ、自己回復が実行される

## ADDED Requirements

### Requirement: SkillExecutionContext に heroes と targetHero を追加
`SkillExecutionContext` に `heroes: MapSchema<HeroSchema>` と `targetHero?: HeroSchema` フィールドを追加しなければならない（SHALL）。`heroes` はルーム内の全ヒーロー参照で、味方ターゲット検索に使用されなければならない（SHALL）。`targetHero` は ally ターゲティングで解決された対象ヒーローでなければならない（SHALL）。

#### Scenario: heroes が渡される
- **WHEN** `executeSkill` が呼ばれる
- **THEN** `SkillExecutionContext.heroes` にルーム内の全ヒーローの MapSchema が含まれる

#### Scenario: ally ターゲティング時に targetHero が設定される
- **WHEN** ally ターゲティングのスキルで味方が射程内にいる
- **THEN** `SkillExecutionContext.targetHero` にその味方ヒーローが設定される

### Requirement: GameRoom から executeSkill に heroes を渡す
`GameRoom` の `useSkill` メッセージハンドラで `executeSkill` に `this.state.heroes` を渡さなければならない（SHALL）。

#### Scenario: GameRoom が heroes を渡す
- **WHEN** クライアントが `useSkill` メッセージを送信する
- **THEN** `executeSkill` に `this.state.heroes` と `this.state.projectiles` の両方が渡される
