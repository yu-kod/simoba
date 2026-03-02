## MODIFIED Requirements

### Requirement: Configurable respawn time

リスポーン時間はヒーローのレベルに応じて `computeRespawnTime(hero.level)` で算出しなければならない（SHALL）。`DEFAULT_RESPAWN_TIME` 定数は使用しない。

#### Scenario: レベル1ヒーローの死亡

- **WHEN** レベル1のヒーローが死亡する
- **THEN** `respawnTimer` に 3秒がセットされる

#### Scenario: レベル5ヒーローの死亡

- **WHEN** レベル5のヒーローが死亡する
- **THEN** `respawnTimer` に 15秒がセットされる

#### Scenario: レベルアップ後の死亡

- **WHEN** レベル3のヒーローが死亡する
- **THEN** `respawnTimer` に 8秒がセットされる（死亡時点のレベルで算出）
