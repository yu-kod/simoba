## ADDED Requirements

### Requirement: サーバー側レベルアップ判定
サーバーは XP 加算後に `XP_THRESHOLDS` を参照し、累積 XP が次レベルの閾値以上であればレベルを上げなければならない（SHALL）。1 回の XP 加算で複数レベル分の閾値を超えた場合、到達可能な最大レベルまで一括で上げなければならない（SHALL）。`MAX_LEVEL` を超えてはならない（SHALL NOT）。レベルアップ判定は純粋関数として実装し、`HeroSchema` への書き込みと分離しなければならない（SHALL）。

#### Scenario: 閾値ちょうどでレベルアップ
- **WHEN** level=1, xp=100 のヒーローに対しレベルアップ判定を行う
- **THEN** 新しい level は 2 になる

#### Scenario: 閾値未満ではレベルアップしない
- **WHEN** level=1, xp=99 のヒーローに対しレベルアップ判定を行う
- **THEN** level は 1 のまま変化しない

#### Scenario: 複数レベルを一度に上がる
- **WHEN** level=1, xp=600 のヒーローに対しレベルアップ判定を行う
- **THEN** 新しい level は 4 になる（XP_THRESHOLDS[3]=600）

#### Scenario: MAX_LEVEL を超えない
- **WHEN** level=4, xp=2000 のヒーローに対しレベルアップ判定を行う
- **THEN** 新しい level は MAX_LEVEL (5) になる

### Requirement: レベルアップ時のタレントポイント付与
レベルアップ時に上昇したレベル数と同じ数の `talentPoints` を加算しなければならない（SHALL）。例えば Lv1→Lv3 なら +2 ポイント。`talentPoints` の消費（タレント取得）は本スコープ外とする。

#### Scenario: 1 レベルアップで 1 ポイント
- **WHEN** level が 1 から 2 に上がる
- **THEN** talentPoints が 1 加算される

#### Scenario: 複数レベルアップで複数ポイント
- **WHEN** level が 1 から 3 に上がる
- **THEN** talentPoints が 2 加算される

#### Scenario: レベルが変わらなければポイントは増えない
- **WHEN** XP が加算されたが level が変化しない
- **THEN** talentPoints は変化しない

### Requirement: HeroSchema の level・talentPoints フィールド
`HeroSchema` に `level: uint8`（初期値 1）と `talentPoints: uint8`（初期値 0）を追加しなければならない（SHALL）。Colyseus の state patch でクライアントに自動同期される。

#### Scenario: ヒーロー生成時の初期値
- **WHEN** GameRoom で新しいヒーローが生成される
- **THEN** `level` は 1、`talentPoints` は 0 で初期化される

#### Scenario: レベルアップ後の値
- **WHEN** ヒーローの XP が 100 に達する
- **THEN** `HeroSchema.level` が 2 に、`HeroSchema.talentPoints` が 1 に更新され、クライアントに同期される

### Requirement: クライアント同期パイプライン
`ServerHeroState` インターフェースに `xp`, `level`, `talentPoints` フィールドを追加しなければならない（SHALL）。`OnlineGameMode` で当該フィールドのリスナーを登録し、変更時に `GameScene` へ通知しなければならない（SHALL）。`applyServerHeroNonPositionState` で `xp`, `level`, `talentPoints` を `HeroState` に反映しなければならない（SHALL）。

#### Scenario: サーバーで XP が変化した時にクライアントに反映される
- **WHEN** サーバー側で `HeroSchema.xp` が 0 → 20 に変化する
- **THEN** クライアントの `HeroState.xp` が 20 に更新される

#### Scenario: サーバーでレベルアップした時にクライアントに反映される
- **WHEN** サーバー側で `HeroSchema.level` が 1 → 2 に変化する
- **THEN** クライアントの `HeroState.level` が 2 に更新され、HUD のレベルバッジが更新される

#### Scenario: talentPoints がクライアントに反映される
- **WHEN** サーバー側で `HeroSchema.talentPoints` が 0 → 1 に変化する
- **THEN** クライアントの `HeroState.talentPoints` が 1 に更新される

### Requirement: レベルアップ時のステータス成長
レベルアップ時にヒーローの実効ステータスを `HeroDefinition.growth` に基づいて更新しなければならない（SHALL）。上昇したレベル数分の `growth` を `base` に加算した値を新しいステータスとしなければならない（SHALL）。`maxHp` 増加時は `hp` も同量増加させなければならない（SHALL）。

#### Scenario: Lv1→Lv2 でステータスが成長する
- **WHEN** BLADE ヒーローが Lv1 から Lv2 にレベルアップする
- **THEN** `maxHp`, `attackDamage`, `speed` 等が `HERO_DEFINITIONS['BLADE'].growth` の値分だけ増加する

#### Scenario: maxHp 増加時に hp も回復する
- **WHEN** maxHp が 500 → 550 に増加する（growth.maxHp = 50）
- **THEN** hp も 50 増加する（現在 hp + 50）

#### Scenario: 複数レベルアップ時の成長量
- **WHEN** Lv1 から Lv3 に 2 レベル上がる
- **THEN** growth の 2 倍の値がステータスに加算される
