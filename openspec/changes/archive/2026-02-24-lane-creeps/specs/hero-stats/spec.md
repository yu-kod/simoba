## ADDED Requirements

### Requirement: 近接XP付与

敵ミニオン死亡時、死亡位置から半径 `XP_GRANT_RANGE` 以内の味方ヒーロー全員に XP を均等付与する純粋関数 `grantXp(hero, amount): HeroState` を提供しなければならない（SHALL）。`HeroState.xp` に `amount` を加算しなければならない（SHALL）。イミュータブルに新しい `HeroState` を返さなければならない（SHALL）。レベルアップ判定は行わない（SHALL NOT）。

#### Scenario: XP が加算される
- **WHEN** `xp: 0` のヒーローに `grantXp(hero, 20)` を適用する
- **THEN** 返されるヒーローの `xp` が `20` になる

#### Scenario: 累積XPが正しい
- **WHEN** `xp: 50` のヒーローに `grantXp(hero, 20)` を適用する
- **THEN** 返されるヒーローの `xp` が `70` になる

#### Scenario: イミュータブルな更新
- **WHEN** `grantXp` を適用する
- **THEN** 元の HeroState オブジェクトの `xp` は変更されない

#### Scenario: level は変化しない
- **WHEN** `grantXp` を適用する
- **THEN** 返されるヒーローの `level` は元の値と同じである

### Requirement: ミニオン死亡時のXP分配

敵ミニオンが死亡した時、死亡位置を中心とした `XP_GRANT_RANGE` 内の味方ヒーロー全員を検索し、`MINION_XP_REWARD` を均等に分配しなければならない（SHALL）。距離計算は center 間の距離を使用しなければならない（SHALL）。範囲内にヒーローがいない場合、XP は消失しなければならない（SHALL）。

#### Scenario: 1体のヒーローが範囲内
- **WHEN** 敵ミニオンが位置 (800, 360) で死亡し、味方ヒーローが位置 (700, 360)（距離100、XP_GRANT_RANGE 以内）にいる
- **THEN** そのヒーローに `MINION_XP_REWARD` の全額が付与される

#### Scenario: 2体のヒーローが範囲内
- **WHEN** 敵ミニオンが死亡し、味方ヒーロー2体が `XP_GRANT_RANGE` 以内にいる
- **THEN** 各ヒーローに `MINION_XP_REWARD / 2` が付与される

#### Scenario: 範囲外のヒーローには付与されない
- **WHEN** 味方ヒーローが `XP_GRANT_RANGE` 外の距離にいる
- **THEN** そのヒーローの `xp` は変化しない

#### Scenario: dead ヒーローには付与されない
- **WHEN** 範囲内の味方ヒーローが `dead === true` である
- **THEN** そのヒーローの `xp` は変化しない
