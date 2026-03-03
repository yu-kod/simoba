## MODIFIED Requirements

### Requirement: サーバー側レベルアップ判定

サーバーは XP 加算後に `XP_THRESHOLDS` を参照し、累積 XP が次レベルの閾値以上であればレベルを上げなければならない（SHALL）。1 回の XP 加算で複数レベル分の閾値を超えた場合、到達可能な最大レベルまで一括で上げなければならない（SHALL）。`MAX_LEVEL` を超えてはならない（SHALL NOT）。レベルアップ判定は純粋関数として実装し、`HeroSchema` への書き込みと分離しなければならない（SHALL）。XP の獲得源はミニオンキルおよびヒーローキルの両方を含む。

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

#### Scenario: ヒーローキル XP でレベルアップ

- **WHEN** level=1, xp=0 のヒーローがヒーローキルで 150 XP を獲得する
- **THEN** xp=150 となり level は 2 になる
