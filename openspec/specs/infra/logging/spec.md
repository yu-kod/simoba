# Specification

## Purpose
LogTape によるロギング基盤（階層カテゴリ、サーバー/クライアント設定）の仕様

## Requirements

### Requirement: LogTape 依存関係
プロジェクトはロギングライブラリとして `@logtape/logtape` v2.x を使用しなければならない（SHALL）。パッケージはワークスペースルートにインストールし、フロントエンド（`src/`）とバックエンド（`server/`）の両方からインポートできるようにしなければならない（SHALL）。

#### Scenario: パッケージインストール
- **WHEN** プロジェクトルートで `npm install` を実行する
- **THEN** `@logtape/logtape` が `src/` と `server/` の両方のコードでインポート可能である

### Requirement: 階層カテゴリ規約
すべてのロガーは `"simoba"` をルートとする階層カテゴリを使用しなければならない（SHALL）。第 2 レベルは `"client"` と `"server"` を区別しなければならない（SHALL）。第 3 レベル以降はサブシステムを識別する。

カテゴリ例:
- `["simoba", "client", "scene"]` — シーンライフサイクル
- `["simoba", "client", "network"]` — ネットワーク/接続イベント
- `["simoba", "server", "room"]` — Colyseus ルームライフサイクル
- `["simoba", "server", "game"]` — ゲームロジック（システム、戦闘）
- `["simoba", "server", "system"]` — サーバー起動/シャットダウン

#### Scenario: クライアントロガー生成
- **WHEN** フロントエンドモジュールが `getLogger(["simoba", "client", "scene"])` でロガーを生成する
- **THEN** ロガーは親カテゴリ `["simoba", "client"]` と `["simoba"]` からシンクとレベル設定を継承する

#### Scenario: サーバーロガー生成
- **WHEN** バックエンドモジュールが `getLogger(["simoba", "server", "room"])` でロガーを生成する
- **THEN** ロガーは親カテゴリ `["simoba", "server"]` と `["simoba"]` からシンクとレベル設定を継承する

### Requirement: フロントエンドログ設定
フロントエンドはアプリケーション起動時（Phaser ゲーム生成前）にコンソールシンクで LogTape を設定しなければならない（SHALL）。開発モード（`import.meta.env.DEV`）では最低レベルを `"debug"` にしなければならない（SHALL）。本番モードでは最低レベルを `"warning"` にしなければならない（SHALL）。

#### Scenario: 開発モードのロギング
- **WHEN** アプリが開発モード（`import.meta.env.DEV === true`）で実行される
- **THEN** debug レベル以上のログがブラウザコンソールに出力される

#### Scenario: 本番モードのロギング
- **WHEN** アプリが本番モード（`import.meta.env.DEV === false`）で実行される
- **THEN** warning レベル以上のログのみがブラウザコンソールに出力される
- **THEN** debug と info ログは抑制される

### Requirement: バックエンドログ設定
バックエンドはサーバー起動時（Colyseus サーバー listen 前）に構造化 JSON シンクで stdout に書き込むよう LogTape を設定しなければならない（SHALL）。開発モード（`NODE_ENV !== "production"`）では追加の人間可読コンソールシンクを設定しなければならない（SHALL）。本番モードでは JSON シンクのみをアクティブにしなければならない（SHALL）。

#### Scenario: 本番 JSON 出力
- **WHEN** サーバーが本番モード（`NODE_ENV === "production"`）で実行される
- **THEN** 各ログ行は最低限 `timestamp`（ISO 8601）、`level`、`category`（ドット結合文字列）、`message` を含む単一の JSON オブジェクトとして stdout に書き込まれる

#### Scenario: 開発コンソール出力
- **WHEN** サーバーが開発モード（`NODE_ENV !== "production"`）で実行される
- **THEN** ログが人間可読形式でコンソールに出力される
- **THEN** 本番フォーマットのテスト用に stdout への JSON シンクもアクティブである

### Requirement: 構造化ログプロパティ
ロガーは LogTape の構造化ロギング API を使用してログメッセージにコンテキストプロパティを添付しなければならない（SHALL）。プロパティにはドメイン関連データ（例: `roomId`、`playerId`、`sceneKey`）を含め、メッセージ文字列に埋め込まない。

#### Scenario: プロパティ付きルームイベント
- **WHEN** サーバールームが参加イベントをログする
- **THEN** ログレコードに `{ roomId: "abc123", playerId: "xyz", playerCount: 3 }` のような構造化プロパティが含まれ、JSON シリアライズと CloudWatch Logs Insights クエリでアクセス可能である

### Requirement: 既存の console 呼び出しの置き換え
コードベース内のすべての既存 `console.log`、`console.error`、`console.warn`、`console.debug` 呼び出しを適切な LogTape ロガーメソッドに置き換えなければならない（SHALL）。

#### Scenario: GameScene エラーの置き換え
- **WHEN** `GameScene` が欠落した gameMode に遭遇する
- **THEN** `console.error` の代わりに `logger.error` でログする

#### Scenario: サーバー起動の置き換え
- **WHEN** Colyseus サーバーがリスニングを開始する
- **THEN** `console.log` の代わりに `logger.info` でログし、ポートを構造化プロパティとして含める

### Requirement: サーバールームライフサイクルロギング
Colyseus `GameRoom` は主要なライフサイクルイベント（ルーム作成、プレイヤー参加、プレイヤー離脱、ルーム破棄）をログしなければならない（SHALL）。各ログには `roomId` と関連コンテキストを含める。

#### Scenario: ルーム作成
- **WHEN** GameRoom の `onCreate` が呼ばれる
- **THEN** カテゴリ `["simoba", "server", "room"]` とプロパティ `roomId` で info レベルのログが出力される

#### Scenario: プレイヤー参加
- **WHEN** プレイヤーが GameRoom に参加する
- **THEN** `roomId`、`playerId`（sessionId）、現在の `playerCount` で info レベルのログが出力される

#### Scenario: プレイヤー離脱
- **WHEN** プレイヤーが GameRoom を離脱する
- **THEN** `roomId`、`playerId`、残り `playerCount` で info レベルのログが出力される

#### Scenario: ルーム破棄
- **WHEN** GameRoom の `onDispose` が呼ばれる
- **THEN** `roomId` で info レベルのログが出力される

### Requirement: クライアントシーンライフサイクルロギング
Phaser ゲームクライアントはカテゴリ `["simoba", "client", "scene"]` で debug レベルのシーン遷移をログしなければならない（SHALL）。

#### Scenario: シーン作成
- **WHEN** シーンの `create` メソッドが呼ばれる
- **THEN** シーンキーで debug レベルのログが出力される

#### Scenario: シーンシャットダウン
- **WHEN** シーンの `shutdown` メソッドが呼ばれる
- **THEN** シーンキーで debug レベルのログが出力される

### Requirement: ESLint console 制限
ESLint ルールは `src/` と `server/src/` での直接 `console.*` 使用に警告を出さなければならない（SHALL）。ロガーの使用を推奨するため。テストファイルと設定ファイルはこのルールから除外する。

#### Scenario: ソースコードでの直接 console 使用
- **WHEN** 開発者がソースファイルに `console.log(...)` を書く
- **THEN** ESLint がロガーの使用を提案する警告を出す

#### Scenario: テストファイルでの console 使用
- **WHEN** 開発者がテストファイル（`*.test.ts`）に `console.log(...)` を書く
- **THEN** ESLint は警告を出さない
