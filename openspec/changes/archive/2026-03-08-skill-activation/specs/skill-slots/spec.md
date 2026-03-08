## MODIFIED Requirements

### Requirement: スキルスロット構造
`HeroSchema` は `skillSlotQ`、`skillSlotE`、`skillSlotR` フィールド（各 `string` 型）を持たなければならない（SHALL）。空文字はスロット未設定を意味しなければならない（SHALL）。各フィールドは Colyseus `@type` で全クライアントに同期されなければならない（SHALL）。`HeroSchema` は `cooldownQ`、`cooldownE`、`cooldownR` フィールド（各 `float32` 型）を持たなければならない（SHALL）。初期値は 0 でなければならない（SHALL）。各フィールドは Colyseus `@type` で全クライアントに同期されなければならない（SHALL）。

#### Scenario: 初期状態
- **WHEN** ヒーローが生成される
- **THEN** `skillSlotQ`、`skillSlotE`、`skillSlotR` は全て空文字であり、`cooldownQ`、`cooldownE`、`cooldownR` は全て 0 である
