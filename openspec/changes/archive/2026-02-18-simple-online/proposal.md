## Why

Phase 1 はローカル Bot 対戦のみだが、「オンラインで他のプレイヤーと遊べる」体験を早期に検証したい。既存の domain 純粋関数を活かし、Colyseus を最小構成で導入して 2 人がリアルタイムに移動・攻撃し合える状態を作る。AWS (ECS on EC2) への Terraform デプロイを意識した構成にする。

## What Changes

- `server/` ディレクトリに Colyseus ゲームサーバーを新設（独立 package.json）
- GameRoom + ステートスキーマ（プレイヤーの position, facing, hp, type, team）を定義
- Dockerfile + docker-compose で Colyseus サーバーをコンテナ化（ECS デプロイ前提）
- Terraform モジュール `game-server` を追加（ECS on EC2, ALB, セキュリティグループ）
- クライアントに `colyseus.js` を追加し、Room への接続・入退室を処理
- プレイヤーの位置・facing・攻撃状態・ダメージ・プロジェクタイルをリアルタイム同期
- サーバー未起動時はローカル Bot 対戦にフォールバック

## Non-goals

- サーバー権威型ロジック（各クライアントがローカル計算して送信するクライアント信頼型）
- クライアント側予測・補間
- マッチメイキング UI（自動で Room に参加）
- ミニオン・ボス・タワーの同期
- 本番 AWS デプロイの実行（Terraform モジュールの定義まで）

## Capabilities

### New Capabilities
- `online-multiplayer`: Colyseus サーバー + クライアント接続 + プレイヤー状態同期（位置・facing・攻撃・ダメージ・プロジェクタイル）。サーバーセットアップ、GameRoom、ステートスキーマ、クライアント接続管理、オフラインフォールバック、Dockerfile を含む
- `game-server-infra`: ECS on EC2 デプロイ用 Terraform モジュール（ALB, セキュリティグループ、docker-compose）

### Modified Capabilities
(なし — tech-architecture の更新は実装時にインラインで対応)

## Impact

- **新規依存:** `colyseus` (server), `@colyseus/core`, `@colyseus/schema`, `colyseus.js` (client)
- **ディレクトリ:** `server/` 新設、`infrastructure/terraform/modules/game-server/` 新設
- **既存コード:** `GameScene.ts` をオンライン/オフライン切り替え対応に修正
- **開発体験:** `npm run dev` で Vite + Colyseus 同時起動（concurrently）
- **Docker:** `server/Dockerfile` + `docker-compose.yml` に Colyseus サービス追加
