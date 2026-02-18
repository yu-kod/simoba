## Context

現在 Phase 1 はクライアントのみ（Phaser.js + Vite）で動作しており、バックエンドは存在しない。敵ヒーローは `GameScene` 内のローカル静的エンティティとしてハードコードされている。

domain ロジック（移動、攻撃、プロジェクタイル等）はすべて純粋関数として Phaser から分離されているため、サーバーへの移行が比較的容易な構造になっている。

既存インフラ: `infrastructure/terraform/modules/static-hosting/`（S3 + CloudFront）と `infrastructure/docker/docker-compose.yml`（LocalStack）が構築済み。

## Goals / Non-Goals

**Goals:**
- 2 人のプレイヤーがブラウザから同じマップで移動・攻撃し合える
- Colyseus サーバーを Docker コンテナとして実行でき、ECS on EC2 にデプロイ可能な構成にする
- サーバー未起動時は既存のローカル Bot 対戦にフォールバック
- 将来のサーバー権威型移行を妨げない構造

**Non-Goals:**
- サーバー権威型ゲームロジック（クライアント信頼型で十分）
- クライアント側予測・補間（遅延が気になるレベルでは不要）
- マッチメイキング UI やロビー画面
- ミニオン・ボス・タワーの同期

## Decisions

### 1. モノレポ構成: `server/` を独立パッケージとして配置

フロントエンド（ルート `package.json`）とバックエンド（`server/package.json`）を同一リポジトリ内で分離する。

**理由:** domain 型（`Position`, `HeroType`, `Team` 等）を共有しつつ、依存関係を分離できる。`server/tsconfig.json` で `paths` を設定し、`@shared/` エイリアスで共有型をインポートする。

**代替案:**
- npm workspaces: 設定が複雑になりすぎる。Phase 1 の規模では不要。
- 型定義を npm パッケージとして公開: 開発のオーバーヘッドが大きすぎる。

### 2. 共有型の配置: `shared/` ディレクトリ

クライアントとサーバーで共有する型定義（`Position`, `Team`, `HeroType` 等）を `shared/types.ts` に配置する。既存の `src/domain/types.ts` から共通型を `shared/` に移動し、両方からインポートする。

**理由:** 型の二重定義を防ぎ、スキーマとドメイン型の一貫性を保証する。

### 3. メッセージプロトコル: Colyseus State + Custom Messages

- **State sync（自動）:** position, facing, hp, maxHp, heroType, team → `@type()` スキーマで定義し、Colyseus 組み込みのバイナリ差分同期を使用
- **Custom messages（手動）:** 攻撃イベント、ダメージイベント、プロジェクタイル生成 → `room.send()` / `room.onMessage()` で送受信

**理由:** 位置のような高頻度更新は State sync の差分圧縮が効率的。攻撃やダメージのようなイベント的なデータは Custom message が適切。

### 4. GameScene の Online/Offline 切り替え: Strategy パターン

`GameScene` にネットワーク層を直接組み込むのではなく、`GameMode` インターフェースで抽象化する。

```
interface GameMode {
  onSceneCreate(scene): void
  getRemotePlayerState(): HeroState | null
  sendLocalState(state): void
  sendDamageEvent(event): void
  sendProjectileSpawn(event): void
  onRemoteDamage(callback): void
}
```

- `OfflineGameMode`: 既存のローカル Bot 対戦（何もしない）
- `OnlineGameMode`: Colyseus 接続 + 状態送受信

**理由:** GameScene のコア処理を変更せずにオンライン/オフライン切り替えが可能。テスタビリティも高い。

### 5. 送信レート制御: 50ms 固定間隔（20Hz）

位置・facing の送信は毎フレーム（60fps）ではなく 50ms 間隔に制限する。タイマーベースのスロットリングを `OnlineGameMode` 内で実装する。

**理由:** 帯域節約とサーバー負荷軽減。20Hz はカジュアルゲームでは十分な更新頻度。

### 6. Terraform モジュール: `game-server`

`infrastructure/terraform/modules/game-server/` に ECS on EC2 モジュールを新設する。

構成要素:
- ECS クラスター + EC2 キャパシティプロバイダー（t3.small）
- ECS タスク定義（Colyseus コンテナ、ポート 2567）
- ECS サービス（desired_count: 1）
- ALB + ターゲットグループ（WebSocket sticky session）
- セキュリティグループ（ALB: 80/443 インバウンド、ECS: ALB からの 2567 のみ）
- ECR リポジトリ（Docker イメージ格納）

`infrastructure/terraform/environments/prod/main.tf` に `module "game_server"` を追加。

### 7. docker-compose: Colyseus サービス追加

既存の `infrastructure/docker/docker-compose.yml` に `colyseus` サービスを追加する。LocalStack と同じネットワークで起動し、ポート 2567 を公開する。

### 8. 同時起動: concurrently

ルートの `package.json` に `concurrently` を追加し、`npm run dev` で Vite と Colyseus サーバーを同時に起動する。

```json
"dev": "concurrently \"vite\" \"npm run dev:server --prefix server\""
```

## Risks / Trade-offs

**[クライアント信頼型のチート耐性]** → 簡易オンラインの検証フェーズでは許容。Phase 2 でサーバー権威型に移行する際に解消する。GameMode インターフェースの抽象化により、移行時の変更範囲を限定できる。

**[位置同期の遅延・ジャンプ]** → 20Hz の送信レートでは、60fps のフレーム間で補間なしだとカクつく可能性がある。Phase 1 では許容し、Phase 2 で線形補間を追加する。

**[shared/ への型移動による破壊的変更]** → `src/domain/types.ts` の型を `shared/types.ts` に移動すると、全 import パスが変わる。TypeScript の path alias で吸収し、既存コードへの影響を最小化する。

**[Colyseus バージョン互換性]** → Colyseus 0.15.x（最新安定版）を使用。メジャーバージョンアップ時に State スキーマの互換性が壊れる可能性があるが、Phase 1 では固定バージョンで運用する。
