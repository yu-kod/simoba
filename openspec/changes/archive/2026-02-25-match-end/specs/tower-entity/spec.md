## ADDED Requirements

### Requirement: タワー破壊による勝敗判定トリガー
タワーの `dead` が `true` に変更されたとき、サーバーは勝敗判定処理をトリガーしなければならない（SHALL）。破壊されたタワーのチームの敵チームが勝者となる。この判定は `gameUpdate` ループ内で全戦闘処理が完了した後に実行されなければならない（SHALL）。

#### Scenario: タワー破壊で勝敗判定
- **WHEN** タワーにダメージが適用され `dead` が `true` になる
- **THEN** `matchPhase` が `'finished'` に、`winnerTeam` が破壊されたタワーの敵チームに設定される

#### Scenario: タワーが生存中は試合継続
- **WHEN** 両チームのタワーがともに `dead === false` である
- **THEN** `matchPhase` は `'playing'` のまま変化しない
