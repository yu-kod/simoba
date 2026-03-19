# Specification

## Purpose
HeroSchema の level/talentPoints フィールド同期と XP/レベルアップ処理の仕様

## Requirements

### Requirement: HeroSchema の level・talentPoints フィールド
`HeroSchema` に `level: uint8`（初期値 0）と `talentPoints: uint8`（初期値 0）を追加しなければならない（SHALL）。Colyseus の state patch でクライアントに自動同期される。

#### Scenario: ヒーロー生成時の初期値
- **WHEN** GameRoom で新しいヒーローが生成される
- **THEN** `level` は 0、`talentPoints` は 0 で初期化される

#### Scenario: レベルアップ後の値
- **WHEN** ヒーローの XP が Lv1 の閾値に達する
- **THEN** `HeroSchema.level` が 1 に、`HeroSchema.talentPoints` が 1 に更新され、クライアントに同期される

### Requirement: サーバー側レベルアップ判定
サーバーは XP 加算後に `XP_THRESHOLDS` を参照し、累積 XP が次レベルの閾値以上であればレベルを上げなければならない（SHALL）。1 回の XP 加算で複数レベル分の閾値を超えた場合、到達可能な最大レベルまで一括で上げなければならない（SHALL）。`MAX_LEVEL`（30）を超えてはならない（SHALL NOT）。レベルアップ判定は純粋関数として実装し、`HeroSchema` への書き込みと分離しなければならない（SHALL）。XP の獲得源はミニオンキルおよびヒーローキルの両方を含む。

#### Scenario: 閾値ちょうどでレベルアップ
- **WHEN** level=0, xp=30 のヒーローに対しレベルアップ判定を行う（XP_THRESHOLDS[0]=30 と仮定）
- **THEN** 新しい level は 1 になる

#### Scenario: 閾値未満ではレベルアップしない
- **WHEN** level=0, xp=29 のヒーローに対しレベルアップ判定を行う
- **THEN** level は 0 のまま変化しない

#### Scenario: 複数レベルを一度に上がる
- **WHEN** level=0, xp=200 のヒーローに対しレベルアップ判定を行う
- **THEN** XP_THRESHOLDS を順に走査し、到達可能な最大レベルまで上がる

#### Scenario: MAX_LEVEL を超えない
- **WHEN** level=29, xp=99999 のヒーローに対しレベルアップ判定を行う
- **THEN** 新しい level は MAX_LEVEL (30) になる

#### Scenario: ヒーローキル XP でレベルアップ
- **WHEN** level=0, xp=0 のヒーローがヒーローキルで 150 XP を獲得する
- **THEN** xp=150 となり、XP_THRESHOLDS に基づいて到達可能な最大レベルに上がる

### Requirement: レベルアップ時のタレントポイント付与
レベルアップ時に上昇したレベル数と同じ数の `talentPoints` を加算しなければならない（SHALL）。例えば Lv0→Lv3 なら +3 ポイント。`talentPoints` の消費（タレント取得）は本スコープ外とする。

#### Scenario: 1 レベルアップで 1 ポイント
- **WHEN** level が 0 から 1 に上がる
- **THEN** talentPoints が 1 加算される

#### Scenario: 複数レベルアップで複数ポイント
- **WHEN** level が 0 から 3 に上がる
- **THEN** talentPoints が 3 加算される

#### Scenario: レベルが変わらなければポイントは増えない
- **WHEN** XP が加算されたが level が変化しない
- **THEN** talentPoints は変化しない
