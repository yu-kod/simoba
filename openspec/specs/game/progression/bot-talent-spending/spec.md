# Specification

## Purpose
Bot ヒーローのタレントポイント自動消費（毎ティック acquireTalent 呼び出し）の仕様

## Requirements

### Requirement: Bot タレント自動消費
Bot ヒーロー（`isBot === true`）がタレントポイントを1以上保持している場合、サーバーは毎ティック自動的にタレントを取得しなければならない（SHALL）。タレント取得には既存の `acquireTalent()` 関数を使用しなければならない（SHALL）。

#### Scenario: Bot がレベルアップしてタレントポイントを獲得した場合
- **WHEN** Bot ヒーローが `talentPoints >= 1` を保持している
- **THEN** サーバーは取得可能なタレントノードから1つ選んで `acquireTalent()` を呼び出す

#### Scenario: Bot にタレントポイントがない場合
- **WHEN** Bot ヒーローの `talentPoints === 0` である
- **THEN** サーバーはタレント取得処理をスキップする

### Requirement: 複数ポイントの連続消費
Bot が複数のタレントポイントを保持している場合（例: 複数レベル同時ジャンプ）、1ティック内でポイントがなくなるか取得可能ノードがなくなるまで繰り返しタレントを取得しなければならない（SHALL）。可変コストノード（1〜3pt）に対応し、ポイント不足のノードはスキップしなければならない（SHALL）。

#### Scenario: Bot が2ポイント保持しコスト1ノードが2つある場合
- **WHEN** Bot が `talentPoints === 2` で取得可能なコスト1ノードが2つ以上ある
- **THEN** 1ティック内で2つのタレントを取得し `talentPoints === 0` になる

#### Scenario: Bot が2ポイント保持だがコスト3ノードしかない場合
- **WHEN** Bot が `talentPoints === 2` で取得可能ノードが全てコスト3
- **THEN** ポイント不足でどのノードも取得できず `talentPoints === 2` のまま残る

#### Scenario: Bot が3ポイント保持でコスト1とコスト3のノードがある場合
- **WHEN** Bot が `talentPoints === 3` で取得可能なコスト1ノードとコスト3ノードがある
- **THEN** いずれかのノードを取得する（ランダム選択）

### Requirement: ランダム選択戦略
Bot のタレント選択は、取得可能なノード（prerequisites が全て取得済み かつ 未取得 かつ `cost <= talentPoints`）の中からランダムに1つを選ばなければならない（SHALL）。

#### Scenario: 複数の取得可能ノードがある場合
- **WHEN** Bot のタレントツリーに取得可能なノードが複数存在する
- **THEN** その中からランダムに1つが選択される

#### Scenario: 取得可能ノードがない場合
- **WHEN** 全ノードが取得済み、またはポイントはあるが prerequisites を満たしかつコストを払えるノードがない
- **THEN** タレント取得処理をスキップする
