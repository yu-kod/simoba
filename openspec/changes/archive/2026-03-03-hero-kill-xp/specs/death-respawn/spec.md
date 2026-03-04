## MODIFIED Requirements

### Requirement: Death on zero HP

ヒーローの HP が 0 以下になった時点で、そのヒーローは死亡状態に遷移する。死亡状態のヒーローは `dead: true` となり、死亡地点が `deathPosition` として記録される。死亡検知時に `lastAttackerSessionId` からキラーを特定し、キラーが有効なヒーローであれば `HERO_KILL_XP_REWARD` 分の XP を付与しなければならない（SHALL）。

#### Scenario: Hero HP reaches zero from damage

- **WHEN** ヒーローがダメージを受けて HP が 0 以下になる
- **THEN** ヒーローの `dead` が `true` になる
- **THEN** `deathPosition` に死亡時の座標が記録される
- **THEN** `respawnTimer` にリスポーン秒数がセットされる
- **THEN** `lastAttackerSessionId` のヒーローに XP が付与される

#### Scenario: Hero HP is already zero

- **WHEN** `hp` が既に 0 のヒーローに追加ダメージが発生する
- **THEN** 状態は変化しない（二重死亡しない）

#### Scenario: ヒーロー以外によるキルではXP付与なし

- **WHEN** ヒーローがタワーまたはミニオンによって倒される（`lastAttackerSessionId` が `''`）
- **THEN** XP は誰にも付与されない

### MODIFIED Requirements

### Requirement: Respawn restores full HP

リスポーン時、ヒーローの HP が最大値まで回復し、死亡状態がリセットされる。`lastAttackerSessionId` もリセットしなければならない（SHALL）。

#### Scenario: Hero respawns

- **WHEN** リスポーン処理が実行される
- **THEN** `hp` が `maxHp` と等しくなる
- **THEN** `dead` が `false` になる
- **THEN** `respawnTimer` が `0` になる
- **THEN** `attackTargetId` が `null` にリセットされる
- **THEN** `attackCooldown` が `0` にリセットされる
- **THEN** `lastAttackerSessionId` が `''` にリセットされる
