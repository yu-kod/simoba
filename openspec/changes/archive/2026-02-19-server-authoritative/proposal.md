## Why

現在のアーキテクチャはクライアント権威型で、ゲームロジック（移動、攻撃、ダメージ、死亡/リスポーン）がすべてクライアント上で実行されている。サーバーはプレイヤー間のメッセージ中継のみ行うため、プレイヤー間で HP・ポジション・死亡状態が不一致になる問題が発生している。Phase 2（1v1 オンライン対戦）に進むにはサーバー権威アーキテクチャが必須。

## What Changes

- **BREAKING**: クライアントはゲームロジックを実行しなくなる。入力送信 + 描画のみに変更
- サーバーが 60Hz 固定ティックでゲームシミュレーションを実行（移動、攻撃、ダメージ計算、死亡/リスポーン、投射物）
- Colyseus スキーマを拡張し、全エンティティ（ヒーロー、タワー、ミニオン、投射物）をサーバー state で管理
- クライアントは入力コマンド（移動方向、攻撃対象、スキル発動）のみサーバーに送信
- ローカルヒーローの移動にはクライアント予測を適用し、サーバー補正で reconcile
- リモートエンティティにはエンティティ補間を適用してスムーズに描画
- `shared/` ディレクトリでクライアント・サーバー間の型定義を共有

## Non-goals

- マッチメイキングの改善（既存のまま）
- 新ヒーロー・新エンティティの追加
- ボット AI のサーバー移行（Phase 2 ではオンライン対戦のみ、ボット戦は既存のクライアントロジック維持）
- ミニオン・ボス・タレントシステムのサーバー実装（後続タスク）

## Capabilities

### New Capabilities
- `server-game-loop`: サーバー側の 60Hz ゲームシミュレーション。EntityManager・CombatManager のサーバー版、移動バリデーション、死亡/リスポーン処理
- `client-prediction`: ローカルヒーローのクライアント予測 + サーバー reconciliation、リモートエンティティの補間描画
- `shared-domain`: クライアント・サーバー間で共有する TypeScript 型定義（CombatEntityState 階層、メッセージ型、定数）

### Modified Capabilities
- `online-multiplayer`: プロトコル変更 — クライアントは state ではなく input コマンドを送信、サーバーが全 state を権威的に管理・配信

## Impact

- **サーバー (`server/src/`)**: GameRoom 大幅拡張、サーバー側 EntityManager・CombatManager 新設、Colyseus スキーマ拡張
- **クライアント (`src/`)**: GameScene・CombatManager をサーバー state 受信・描画に変更、OnlineGameMode を input 送信型に変更
- **共有 (`shared/`)**: 新ディレクトリ。エンティティ型、メッセージ型、ゲーム定数を移動
- **ビルド**: monorepo 的な TypeScript パス設定（client → shared、server → shared）
- **既存スペック参照**: `entity-registry`, `attack-system`, `unified-world`, `online-multiplayer`, `game-server-infra`
