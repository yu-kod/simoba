## ADDED Requirements

### Requirement: タレントツリー定義
各ヒーロータイプは固有のタレントツリー定義を持たなければならない（SHALL）。タレントツリーは `TalentTreeDefinition` として `shared/talents/` に静的データとして定義されなければならない（SHALL）。ツリー定義は `heroType` と `nodes` 配列で構成されなければならない（SHALL）。

#### Scenario: ヒーロータイプごとのツリー定義
- **WHEN** ゲームが BLADE / BOLT / AURA いずれかのヒーローを生成する
- **THEN** そのヒーロータイプに対応するタレントツリー定義が存在する

### Requirement: タレントノード構造
各タレントノードは以下のフィールドを持たなければならない（SHALL）: `id`（一意な文字列）、`name`（表示名）、`description`（効果説明）、`cost`（必要ポイント、正の整数）、`prerequisites`（前提タレントIDの配列、空配列 = ルートノード）、`effects`（`TalentEffect` の配列）。`id` はツリー全体で一意でなければならない（SHALL）。

#### Scenario: ルートノード（前提なし）
- **WHEN** タレントノードの `prerequisites` が空配列である
- **THEN** そのノードはポイントさえあれば取得可能である

#### Scenario: 前提タレント付きノード
- **WHEN** タレントノードの `prerequisites` が `["blade-q-charge"]` である
- **THEN** `blade-q-charge` が取得済みでなければそのノードは取得できない

### Requirement: タレントポイント管理
`HeroSchema` は `talentPoints`（uint8）フィールドを持たなければならない（SHALL）。レベルアップ時にタレントポイントが1付与されなければならない（SHALL）。タレントポイントは Colyseus state sync でクライアントに同期されなければならない（SHALL）。

#### Scenario: レベルアップでポイント獲得
- **WHEN** ヒーローが Lv1 → Lv2 にレベルアップする
- **THEN** `talentPoints` が 1 増加する

#### Scenario: 複数レベルジャンプ
- **WHEN** ヒーローが一度に Lv1 → Lv3 にジャンプする
- **THEN** `talentPoints` が 2 増加する

### Requirement: タレント取得（サーバー権威）
クライアントは `acquireTalent` メッセージ（`talentId: string`）をサーバーに送信してタレント取得を要求しなければならない（SHALL）。サーバーは以下を全て検証しなければならない（SHALL）: (1) `talentPoints >= cost`、(2) 全 `prerequisites` が取得済み、(3) 同じタレントが未取得。全て合格した場合のみタレントを取得し、`talentPoints` を `cost` 分減算しなければならない（SHALL）。検証失敗時はメッセージを無視しなければならない（SHALL）。

#### Scenario: 正常なタレント取得
- **WHEN** プレイヤーが `talentPoints >= 1` で、前提を満たしたタレントを要求する
- **THEN** タレントが `acquiredTalents` に追加され、`talentPoints` が 1 減少する

#### Scenario: ポイント不足
- **WHEN** プレイヤーが `talentPoints === 0` でタレント取得を要求する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 前提条件未達
- **WHEN** プレイヤーが前提タレントを取得していない状態で子タレントを要求する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 重複取得の防止
- **WHEN** プレイヤーが既に取得済みのタレントを再度要求する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

### Requirement: 取得済みタレントの同期
`HeroSchema` は `acquiredTalents`（`ArraySchema<string>`）フィールドを持たなければならない（SHALL）。取得済みタレントIDがこの配列に格納され、Colyseus state sync で全クライアントに同期されなければならない（SHALL）。

#### Scenario: タレント取得後のクライアント同期
- **WHEN** サーバーでタレントが取得される
- **THEN** `acquiredTalents` 配列に talentId が追加され、全クライアントの state に反映される

### Requirement: タレントツリー UI 表示
プレイヤーは Tab キーまたは HUD のタレントボタンをクリックしてタレントツリー UI を開閉できなければならない（SHALL）。ツリー UI はオーバーレイとして表示され、ゲームはリアルタイムで続行しなければならない（SHALL）。ツリー UI にはノード間の前提関係が視覚的に表示されなければならない（SHALL）。取得済みノード、取得可能ノード、ロック中ノードが視覚的に区別されなければならない（SHALL）。未使用タレントポイントがある場合、HUD にバッジ表示しなければならない（SHALL）。

#### Scenario: Tab キーでツリーを開く
- **WHEN** プレイヤーが Tab キーを押す
- **THEN** タレントツリー UI がオーバーレイで表示される

#### Scenario: ツリーを開いてもゲーム続行
- **WHEN** タレントツリー UI が開いている
- **THEN** ゲームはリアルタイムで進行し続ける（一時停止しない）

#### Scenario: ノードの視覚的区別
- **WHEN** タレントツリー UI が表示される
- **THEN** 取得済みノードはハイライト、前提を満たした未取得ノードは選択可能表示、前提未達ノードはグレーアウトで表示される

#### Scenario: 未使用ポイントバッジ
- **WHEN** プレイヤーの `talentPoints` が 1 以上である
- **THEN** HUD のタレントボタンにポイント数のバッジが表示される
