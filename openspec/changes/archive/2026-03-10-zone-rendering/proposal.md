## Why

Zone スキル（Slow Field, Bolt Trap）はサーバーで動作しているが、クライアント側で一切描画されないため動作確認ができない。今後の Sanctuary (#217) 等のゾーン型スキル追加にも対応できる再利用可能な描画基盤が必要。

## What Changes

- `OnlineGameMode` に `GameRoomState.zones` の onAdd/onRemove リスナーを追加し、ゾーン状態をクライアントに同期
- 再利用可能な `ZoneRenderer` を新規作成し、ゾーンを円形で描画（幾何学スタイル）
- **スキル別の色定義** — ゾーンの色はチーム色ではなくスキルID（skillId）に基づいて決定。スキルごとに固有の色を持つ（例: Slow Field=紫系、Trap=黄系）
- スキルタイプ別の描画バリエーション（持続円 / トラップマーカー）
- **描画スタイルの拡張性** — ゾーンのビジュアル（形状・色・パターン）をスキルごとにデータテーブルで定義し、新スキル追加時はテーブルにエントリを追加するだけで対応可能にする（ProjectileVisuals パターンの踏襲）
- ゾーン消滅時の即消し（フェードアウトは将来拡張）
- `GameScene` の update ループに ZoneRenderer の描画呼び出しを統合

## Non-goals

- ゾーンのアニメーション効果（パルス、回転等）は将来対応
- フェードイン/フェードアウトのトランジション
- Sanctuary (#217) の追従型ゾーン描画（本チケットでは固定位置ゾーンのみ）
- トラップの敵への非表示ロジック（ゲームバランス調整で後日検討）

## Capabilities

### New Capabilities
- `zone-rendering`: ゾーンエンティティのクライアント側描画基盤。状態同期、レンダラー、チーム色識別を含む

### Modified Capabilities

（なし — 既存 spec の要件変更はなし）

## Impact

- **クライアント:** `OnlineGameMode`（状態同期追加）、`GameScene`（描画統合）、新規 `ZoneRenderer`
- **共有:** ゾーン描画に必要な視覚定義の追加（`shared/` に配置予定）
- **サーバー:** 変更なし（ZoneSchema は既に必要なフィールドを持つ）
- **依存:** Phaser.js Graphics API（既存パターンと同一）
