# Specification

## Purpose
タワーエンティティの破壊判定、勝敗トリガー、Schema定義、描画の仕様

## Requirements

### Requirement: タワー破壊による勝敗判定トリガー
タワーの `dead` が `true` に変更されたとき、サーバーは勝敗判定処理をトリガーしなければならない（SHALL）。破壊されたタワーのチームの敵チームが勝者となる。この判定は `gameUpdate` ループ内で全戦闘処理が完了した後に実行されなければならない（SHALL）。

#### Scenario: タワー破壊で勝敗判定
- **WHEN** タワーにダメージが適用され `dead` が `true` になる
- **THEN** `matchPhase` が `'finished'` に、`winnerTeam` が破壊されたタワーの敵チームに設定される

#### Scenario: タワーが生存中は試合継続
- **WHEN** 両チームのタワーがともに `dead === false` である
- **THEN** `matchPhase` は `'playing'` のまま変化しない

### Requirement: TowerSchema supports summoned turrets
`TowerSchema` SHALL include `remainingDuration` (float32, default 0) and `ownerId` (string, default '').

When `remainingDuration` is 0, the tower is permanent (map tower). When > 0, it is a summoned turret with a limited lifetime.

#### Scenario: Map towers have default values
- **WHEN** a TowerSchema is created for a map tower
- **THEN** `remainingDuration` SHALL be 0 and `ownerId` SHALL be ''

#### Scenario: Summoned turrets have duration and owner
- **WHEN** a TowerSchema is created for a summoned turret
- **THEN** `remainingDuration` SHALL be set to the turret's duration and `ownerId` to the caster's id
