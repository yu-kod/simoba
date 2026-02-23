## 1. サーバー側 serverTime フィールド追加

- [x] 1.1 `HeroSchema` に `@type('float64') serverTime: number = 0` を追加する (specs/online-multiplayer)
- [x] 1.2 `GameRoom.gameUpdate()` 内で全ヒーローの `serverTime` に `Date.now()` を書き込む (specs/online-multiplayer)
- [x] 1.3 クライアント側 `ServerHeroState` インターフェースに `serverTime: number` を追加する (specs/online-multiplayer)

## 2. InterpolationBuffer 実装

- [x] 2.1 `src/network/InterpolationBuffer.ts` を新規作成 — Snapshot 型、コンストラクタ（now 関数注入）、pushSnapshot、getInterpolatedPosition メソッド (specs/entity-interpolation)
- [x] 2.2 facing の角度最短経路 lerp を実装する (specs/entity-interpolation)
- [x] 2.3 スナップショット間隔の異常値クランプ（MIN_INTERVAL=10ms, MAX_INTERVAL=200ms）を実装する (specs/entity-interpolation)

## 3. GameScene へのリモート補間統合

- [x] 3.1 `GameScene` に `interpolationBuffers: Map<string, InterpolationBuffer>` を追加し、リモートエンティティの `handleServerHeroUpdate` で snapshot を push する (specs/online-multiplayer)
- [x] 3.2 `GameScene.update()` 内でリモートエンティティの補間位置を毎フレーム計算し、entity の position を更新する (specs/online-multiplayer)
- [x] 3.3 リモートプレイヤー退室時に `InterpolationBuffer` を破棄する (specs/online-multiplayer)

## 4. Prediction Smoothing 実装

- [x] 4.1 `MovementPredictor` に smoothing ロジックを追加 — `smoothedX/Y` プロパティ、`smoothPosition(reconciledX, reconciledY)` メソッド (specs/entity-interpolation)
- [x] 4.2 `SNAP_THRESHOLD`（200px）以上のズレは即スナップ、未満は `smoothingFactor`（0.15）で指数ブレンドする (specs/entity-interpolation)
- [x] 4.3 `GameScene.computeHeroPosition` で reconcile 後に smoothing を適用する (specs/entity-interpolation)

## 5. オフラインモード影響回避

- [x] 5.1 InterpolationBuffer の生成・使用を `isServerAuthoritative === true` の条件下に限定する (specs/entity-interpolation)
- [x] 5.2 Prediction Smoothing を `isServerAuthoritative === true` の条件下に限定する (specs/entity-interpolation)

## 6. ユニットテスト

- [x] 6.1 InterpolationBuffer のユニットテスト — pushSnapshot、getInterpolatedPosition、facing lerp、クランプ、時刻注入 (specs/entity-interpolation)
- [x] 6.2 MovementPredictor の Prediction Smoothing テスト — 小ズレブレンド、大ズレスナップ (specs/entity-interpolation)
- [x] 6.3 全ユニットテスト PASS を確認する (`npm run test:unit`)

## 7. 動作確認

- [x] 7.1 既存 E2E テスト（オフラインモード）が全 PASS することを確認する (`npm run test:e2e`)
