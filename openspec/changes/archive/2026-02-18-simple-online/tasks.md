## 1. 共有型 & モノレポ構成

- [x] 1.1 `shared/types.ts` を作成し、クライアント・サーバー共通の型（`Position`, `Team`, `HeroType` 等）を定義する（`online-multiplayer` spec: ステートスキーマ定義）
- [x] 1.2 既存の `src/domain/types.ts` から共通型を `shared/types.ts` に移動し、`src/domain/types.ts` は re-export に変更する（design: Decision 2）
- [x] 1.3 `server/package.json` と `server/tsconfig.json` を作成し、`@shared/` エイリアスを設定する（design: Decision 1）

## 2. Colyseus サーバーセットアップ（Issue #70）

- [x] 2.1 Colyseus 依存パッケージ（`colyseus`, `@colyseus/core`, `@colyseus/schema`）を `server/` にインストールする（`online-multiplayer` spec: サーバーセットアップ）
- [x] 2.2 `PlayerSchema` と `GameRoomState` を `@type()` デコレータで定義する（position, facing, hp, maxHp, heroType, team）（`online-multiplayer` spec: ステートスキーマ定義）
- [x] 2.3 `GameRoom` クラスを実装する（onCreate, onJoin, onLeave, onDispose、最大 2 人制限）（`online-multiplayer` spec: GameRoom 定義）
- [x] 2.4 サーバーエントリーポイント `server/src/index.ts` を作成し、`/health` エンドポイント + GameRoom 登録を行う（`online-multiplayer` spec: ヘルスチェック）
- [x] 2.5 `npm run dev:server` スクリプトを追加し、ポート 2567 でサーバー起動を確認するテストを書く（`online-multiplayer` spec: サーバーセットアップ）

## 3. Docker 化（Issue #70）

- [x] 3.1 `server/Dockerfile` を作成する（マルチステージビルド、ECS デプロイ前提）（`online-multiplayer` spec: Docker 化）
- [x] 3.2 `infrastructure/docker/docker-compose.yml` に `colyseus` サービスを追加する（ポート 2567、LocalStack と同一ネットワーク）（`game-server-infra` spec: docker-compose）

## 4. Terraform ゲームサーバーモジュール（game-server-infra）

- [x] 4.1 `infrastructure/terraform/modules/game-server/main.tf` を作成する（ECS クラスター、EC2 キャパシティプロバイダー t3.small、タスク定義、サービス）（`game-server-infra` spec: ECS on EC2）
- [x] 4.2 ALB + ターゲットグループ（WebSocket sticky session、ヘルスチェック `/health`）を定義する（`game-server-infra` spec: ALB + WebSocket）
- [x] 4.3 セキュリティグループを定義する（ALB: 80/443 インバウンド、ECS: ALB からの 2567 のみ）（`game-server-infra` spec: セキュリティグループ）
- [x] 4.4 ECR リポジトリと `variables.tf` / `outputs.tf` を作成する（`game-server-infra` spec: ECS on EC2）
- [x] 4.5 `infrastructure/terraform/environments/prod/main.tf` に `module "game_server"` を追加する（`game-server-infra` spec: ECS on EC2）

## 5. クライアント接続管理（Issue #71）

- [x] 5.1 `colyseus.js` をクライアント依存に追加する（`online-multiplayer` spec: クライアント接続管理）
- [x] 5.2 `NetworkClient` クラスを実装する（connect, disconnect, 接続状態管理: disconnected → connecting → connected）（`online-multiplayer` spec: クライアント接続管理）
- [x] 5.3 `GameMode` インターフェースを定義する（design: Decision 4）
- [x] 5.4 `OfflineGameMode` を実装する（既存 Bot 対戦動作を維持、何もしない）（`online-multiplayer` spec: オフラインフォールバック）
- [x] 5.5 `OnlineGameMode` を実装する（Colyseus Room 接続、状態送受信）（`online-multiplayer` spec: クライアント接続管理）
- [x] 5.6 `GameScene` に GameMode を統合し、接続失敗時の OfflineGameMode フォールバックを実装する（`online-multiplayer` spec: オフラインフォールバック）

## 6. プレイヤー位置・facing 同期（Issue #72）

- [x] 6.1 `OnlineGameMode` にローカルプレイヤーの position/facing を 50ms 間隔（20Hz）で送信するスロットリングを実装する（`online-multiplayer` spec: 位置同期、design: Decision 5）
- [x] 6.2 リモートプレイヤーの状態変更を受信し、HeroRenderer に反映する処理を実装する（`online-multiplayer` spec: 位置同期）
- [x] 6.3 リモートプレイヤーの参加時に HeroRenderer を生成し、退室時に破棄する処理を実装する（`online-multiplayer` spec: 位置同期）

## 7. 攻撃・ダメージ同期（Issue #73）

- [x] 7.1 近接攻撃ダメージイベントの送受信を Custom message で実装する（`online-multiplayer` spec: 攻撃・ダメージ同期、design: Decision 3）
- [x] 7.2 プロジェクタイル生成・命中イベントの送受信を Custom message で実装する（`online-multiplayer` spec: 攻撃・ダメージ同期）
- [x] 7.3 HP 変更を Room 状態スキーマ経由で同期する処理を実装する（`online-multiplayer` spec: 攻撃・ダメージ同期）

## 8. 開発体験の統合

- [x] 8.1 `concurrently` を devDependencies に追加し、`npm run dev` で Vite + Colyseus を同時起動するよう `package.json` を更新する（`online-multiplayer` spec: 同時起動、design: Decision 8）
- [x] 8.2 全体の結合テスト（サーバー起動 → クライアント接続 → 位置同期 → 攻撃同期）を確認する
