## ADDED Requirements

### Requirement: ヒーローキル XP 報酬定数

ヒーローキル時の XP 報酬は `HERO_KILL_XP_REWARD` 定数で定義しなければならない（SHALL）。値は `shared/constants.ts` に配置し、ハードコードしてはならない（SHALL NOT）。

#### Scenario: 定数の存在

- **WHEN** ゲームが初期化される
- **THEN** `HERO_KILL_XP_REWARD` が正の整数として定義されている

### Requirement: キラー追跡フィールド

`HeroSchema` に `lastAttackerSessionId: string`（初期値 `''`）を追加しなければならない（SHALL）。ヒーローがダメージを受けたとき、攻撃元がヒーローであれば `lastAttackerSessionId` を攻撃元の sessionId で更新しなければならない（SHALL）。攻撃元がヒーロー以外（タワー、ミニオン）の場合は更新してはならない（SHALL NOT）。

#### Scenario: ヒーローからのダメージで lastAttackerSessionId が更新される

- **WHEN** ヒーロー A がヒーロー B にダメージを与える
- **THEN** ヒーロー B の `lastAttackerSessionId` がヒーロー A の sessionId になる

#### Scenario: タワーからのダメージでは更新されない

- **WHEN** タワーがヒーロー B にダメージを与える
- **THEN** ヒーロー B の `lastAttackerSessionId` は変化しない

#### Scenario: リスポーン時にリセットされる

- **WHEN** ヒーローがリスポーンする
- **THEN** `lastAttackerSessionId` が `''` にリセットされる

### Requirement: ヒーローキル時の XP 付与

ヒーローが死亡したとき、`lastAttackerSessionId` に有効なヒーローが存在すれば、そのヒーローに `HERO_KILL_XP_REWARD` 分の XP を付与しなければならない（SHALL）。XP 付与後に `computeLevelUp` + `applyStatsGrowth` でレベルアップ判定を行わなければならない（SHALL）。

#### Scenario: ヒーローがヒーローを倒してXPを獲得する

- **WHEN** ヒーロー A がヒーロー B を倒す（B の HP が 0 以下になる）
- **THEN** ヒーロー A の XP が `HERO_KILL_XP_REWARD` 分加算される
- **THEN** レベルアップ条件を満たせばヒーロー A がレベルアップする

#### Scenario: キラーが既に死亡している場合

- **WHEN** ヒーロー B が死亡し、`lastAttackerSessionId` のヒーロー A も死亡状態である
- **THEN** ヒーロー A に XP が付与される（死亡中でも XP は獲得できる）

#### Scenario: lastAttackerSessionId が空の場合（タワー/ミニオンキル）

- **WHEN** ヒーローが死亡し、`lastAttackerSessionId` が `''` である
- **THEN** どのヒーローにも XP は付与されない

#### Scenario: lastAttackerSessionId のヒーローが切断済みの場合

- **WHEN** ヒーローが死亡し、`lastAttackerSessionId` の sessionId が heroes マップに存在しない
- **THEN** XP は付与されない（エラーにならない）

### Requirement: ヒーローキルによるレベルアップ

ヒーローキル XP でレベルアップ閾値に到達した場合、`computeLevelUp` で新レベルを算出し、`applyStatsGrowth` でステータスを成長させなければならない（SHALL）。複数レベル分の閾値を超えた場合も一括で処理しなければならない（SHALL）。レベルアップ時に `talentPoints` をレベル上昇分だけ加算しなければならない（SHALL）。`talentPoints` 加算後、`effectiveStats` の再計算は不要である（タレント取得時に再計算するため）。

#### Scenario: キルXPでレベルアップ

- **WHEN** Lv1・XP=0 のヒーローが `HERO_KILL_XP_REWARD`(150) XP を獲得する
- **THEN** XP が 150 になり、level が 2 になる（XP_THRESHOLDS[1]=100 を超過）
- **THEN** ステータスが growth 分成長する
- **THEN** talentPoints が 1 加算される

#### Scenario: 複数レベルジャンプ時のポイント付与

- **WHEN** Lv1・XP=0 のヒーローが一度に 300 XP を獲得する
- **THEN** level が 3 になる（2レベル分ジャンプ）
- **THEN** talentPoints が 2 加算される
