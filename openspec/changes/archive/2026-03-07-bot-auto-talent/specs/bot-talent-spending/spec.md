## ADDED Requirements

### Requirement: Bot タレント自動消費
Bot ヒーロー（`isBot === true`）がタレントポイントを1以上保持している場合、サーバーは毎ティック自動的にタレントを取得しなければならない（SHALL）。タレント取得には既存の `acquireTalent()` 関数を使用しなければならない（SHALL）。

#### Scenario: Bot がレベルアップしてタレントポイントを獲得した場合
- **WHEN** Bot ヒーローが `talentPoints >= 1` を保持している
- **THEN** サーバーは取得可能なタレントノードから1つ選んで `acquireTalent()` を呼び出す

#### Scenario: Bot にタレントポイントがない場合
- **WHEN** Bot ヒーローの `talentPoints === 0` である
- **THEN** サーバーはタレント取得処理をスキップする

### Requirement: ランダム選択戦略
Bot のタレント選択は、取得可能なノード（prerequisites が全て取得済み かつ 未取得）の中からランダムに1つを選ばなければならない（SHALL）。

#### Scenario: 複数の取得可能ノードがある場合
- **WHEN** Bot のタレントツリーに取得可能なノードが複数存在する
- **THEN** その中からランダムに1つが選択される

#### Scenario: 取得可能ノードが1つだけの場合
- **WHEN** 取得可能なノードが1つだけ存在する
- **THEN** そのノードが選択される

#### Scenario: 取得可能ノードがない場合
- **WHEN** 全ノードが取得済み、またはポイントはあるが prerequisites を満たすノードがない
- **THEN** タレント取得処理をスキップする

### Requirement: 人間プレイヤーへの非干渉
Bot タレント自動消費は Bot ヒーロー（`isBot === true`）のみに適用されなければならない（SHALL）。人間プレイヤーのタレント取得フローに影響を与えてはならない（SHALL NOT）。

#### Scenario: 人間プレイヤーがタレントポイントを保持している場合
- **WHEN** 人間プレイヤー（`isBot === false`）が `talentPoints >= 1` を保持している
- **THEN** サーバーは自動タレント取得を行わない

### Requirement: gameUpdate ループへの統合
Bot タレント消費処理は `GameRoom.gameUpdate()` 内で、レベルアップ処理（XP付与）の後に実行されなければならない（SHALL）。

#### Scenario: ゲームティックの実行順序
- **WHEN** `gameUpdate()` が1ティック実行される
- **THEN** XP付与・レベルアップ処理の後に Bot タレント消費が実行される

### Requirement: 複数ポイントの連続消費
Bot が複数のタレントポイントを保持している場合（例: 複数レベル同時ジャンプ）、1ティック内でポイントがなくなるまで繰り返しタレントを取得しなければならない（SHALL）。

#### Scenario: Bot が2ポイント保持している場合
- **WHEN** Bot が `talentPoints === 2` で取得可能ノードが2つ以上ある
- **THEN** 1ティック内で2つのタレントを取得し `talentPoints === 0` になる

#### Scenario: ポイントはあるが取得可能ノードが不足する場合
- **WHEN** Bot が `talentPoints === 2` だが取得可能ノードが1つしかない
- **THEN** 1つだけ取得し `talentPoints === 1` が残る
