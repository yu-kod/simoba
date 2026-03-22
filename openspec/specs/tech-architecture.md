# 技術アーキテクチャ

## フロントエンド

- **エンジン:** Phaser.js 3.x
- **ビルドツール:** Vite 6.x（開発サーバー + バンドラー）
- **レンダリング:** 2D トップダウン（Canvas / WebGL）
- **解像度:** 2560x1440（Scale.FIT + CENTER_BOTH）
- **物理演算:** Arcade Physics（gravity: 0、トップダウン）
- **ホスティング:** S3 + CloudFront（静的ファイル）
- **言語:** TypeScript（strict mode）

## バックエンド

- **ゲームサーバー:** Colyseus（Node.js）
- **プロトコル:** WebSocket（サーバー権威制）
- **ティックレート:** 60Hz 固定
- **クライアント側:** 予測 + 線形補間

### Colyseus を選んだ理由

- Phaser.js 公式連携チュートリアルあり
- JS/TS フルスタック統一
- `npm install` で即開始。DB 不要。
- バイナリ差分ステート同期内蔵
- ルームベースマッチメイキング内蔵
- 2v2 小規模ルームに十分な性能
- WebSocket のみ（UDP なし）、カジュアル .io MOBA では許容範囲

### 将来の代替候補

| 候補 | 言語 | 検討タイミング |
|------|------|---------------|
| Nakama | Go | 5v5 拡張、ランキング、フレンド、rUDP が必要な場合 |
| カスタム（Rust） | Rust | 高負荷物理演算、最大パフォーマンスが必要な場合 |
| GameLift | 任意 | 数千人の同時接続ユーザーの場合 |

## AWS インフラ

```
[S3 + CloudFront] → 静的 Phaser.js クライアント

[ECS on EC2 (t3.small)] ← WebSocket → Colyseus ゲームサーバー
```

### ECS on EC2 を選んだ理由

- ECS 自体は無料。EC2 の料金のみ。
- Docker ベースデプロイ = 環境差異なし。
- コンテナクラッシュ時に自動再起動。
- EC2 インスタンス追加でスケール。

### コスト見積もり（月額）

| コンポーネント | コスト | 備考 |
|---------------|--------|------|
| EC2 t3.small（1インスタンス） | 約$20 | 数十のルームを処理可能 |
| ECS on EC2 | 約$20 | EC2 と同額、ECS 追加料金なし |
| ECS on Fargate | 約$35-40 | EC2 管理不要だが高コスト |
| S3 + CloudFront | 約$1-3 | 低トラフィックではほぼ無料 |

初期月額コスト: **約$20**。

## Infrastructure as Code

- **ツール:** Terraform（>= 1.0）
- **ローカル開発:** LocalStack（Docker Compose）で AWS サービスをエミュレーション
- **構成:**
  - `infrastructure/terraform/modules/` — 再利用可能モジュール（static-hosting）
  - `infrastructure/terraform/environments/local/` — LocalStack 設定
  - `infrastructure/terraform/environments/prod/` — 本番 AWS 設定
- **ステート:** S3 バックエンド + DynamoDB ロック（本番）

## CI/CD

- **プラットフォーム:** GitHub Actions
- **Claude Code Review:** `develop` 向けの非ドラフト PR を自動レビュー
- **Claude Code（@claude）:** PR/Issue コメントでの `@claude` メンションによるオンデマンド実行
