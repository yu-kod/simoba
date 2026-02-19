## MODIFIED Requirements

### Requirement: ステートスキーマ定義
Colyseus の `@type()` デコレータを使用して、Room 状態スキーマを定義しなければならない（SHALL）。GameRoomState は `heroes: MapSchema<HeroSchema>`, `towers: MapSchema<TowerSchema>`, `projectiles: MapSchema<ProjectileSchema>` をそれぞれ独立した MapSchema として保持しなければならない（SHALL）。`gameStarted: boolean` と `matchTime: number` も保持しなければならない（SHALL）。各エンティティスキーマはそのエンティティ種別に必要なフィールドを Colyseus `@type` デコレータ付きで定義しなければならない（SHALL）。

#### Scenario: プレイヤー参加時にヒーローが heroes MapSchema に追加される
- **WHEN** プレイヤーが Room に参加する
- **THEN** `heroes` MapSchema に初期状態のヒーロー（チームに応じたスポーン位置、facing 0、最大 HP、デフォルトヒーロータイプ、チーム割り当て）が追加される

#### Scenario: タワーが towers MapSchema で管理される
- **WHEN** ゲームが開始される
- **THEN** 両チームのタワーが `towers` MapSchema に登録され、バイナリ差分で同期される

#### Scenario: 投射物が projectiles MapSchema で管理される
- **WHEN** 攻撃により投射物が生成される
- **THEN** `projectiles` MapSchema に追加され、命中または射程外で削除される

#### Scenario: 状態変更がバイナリ差分で同期される
- **WHEN** ヒーローの position や HP が変更される
- **THEN** Colyseus の組み込みバイナリ差分同期により、全接続中クライアントに変更が伝播される

### Requirement: プレイヤー位置・facing の同期
クライアントは移動方向（`moveDir`）を入力メッセージとしてサーバーに送信しなければならない（SHALL）。位置座標を直接送信してはならない（SHALL NOT）。サーバーが `moveDir * speed * deltaTime` で位置を計算し、HeroSchema に反映しなければならない（SHALL）。クライアントはローカルヒーローに対して移動予測を適用しなければならない（SHALL）。リモートヒーローはサーバーから受信した位置をそのまま描画しなければならない（SHALL）。

#### Scenario: クライアントが移動方向を送信する
- **WHEN** プレイヤーが WASD で移動操作を行う
- **THEN** 正規化された移動方向ベクトルが `input` メッセージの `moveDir` フィールドとしてサーバーに送信される

#### Scenario: サーバーが位置を計算する
- **WHEN** サーバーがプレイヤーの `moveDir` 入力を受信する
- **THEN** サーバーが `speed * deltaTime` を適用してヒーローの位置を更新する

#### Scenario: リモートプレイヤーの位置がサーバーから同期される
- **WHEN** サーバーでリモートヒーローの位置が更新される
- **THEN** Colyseus の状態同期でクライアントに伝播され、レンダラーが更新される

#### Scenario: ローカルヒーローに移動予測が適用される
- **WHEN** ローカルプレイヤーが移動操作を行う
- **THEN** サーバー応答を待たずに即座にローカルで移動が反映される

### Requirement: 攻撃・ダメージの同期
クライアントは攻撃対象 ID（`attackTargetId`）を入力メッセージとしてサーバーに送信しなければならない（SHALL）。ダメージ量を直接送信してはならない（SHALL NOT）。サーバーが攻撃の射程・クールダウン・対象存在をバリデーションし、ダメージ計算を実行しなければならない（SHALL）。HP の変更は HeroSchema/TowerSchema のフィールド変更として Colyseus 状態同期で反映しなければならない（SHALL）。

#### Scenario: クライアントが攻撃対象を送信する
- **WHEN** プレイヤーが敵を右クリックして攻撃対象を指定する
- **THEN** `input` メッセージの `attackTargetId` に対象 ID が設定されてサーバーに送信される

#### Scenario: サーバーがダメージを計算する
- **WHEN** サーバーがヒーローの攻撃クールダウン完了を検知する
- **THEN** 対象の射程・存在・生存を検証し、`attackDamage` 分のダメージを対象の HP に適用する

#### Scenario: HP 変更が状態同期で反映される
- **WHEN** サーバーでヒーローの HP が変更される
- **THEN** HeroSchema の `hp` フィールド変更が Colyseus バイナリ差分で両クライアントに伝播される

#### Scenario: 不正なダメージリクエストが拒否される
- **WHEN** クライアントが射程外の対象への攻撃入力を送信する
- **THEN** サーバーがバリデーションで攻撃を無効化し、ダメージは発生しない

