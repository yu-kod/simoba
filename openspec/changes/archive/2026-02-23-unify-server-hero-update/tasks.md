## 1. handleServerHeroUpdate の3ステップ分離 (online-multiplayer spec)

- [x] 1.1 `applyServerState` ヘルパーメソッドを抽出 — 現在3箇所に重複している `updateEntity` 呼び出し（L456, L470, L525）を1つの private メソッドに集約。全フィールド（type, radius, position, facing, hp, maxHp, dead, attackTargetId, respawnTimer）を一括適用。position は引数で受け取り、予測位置/サーバー位置の切り替えを呼び出し側に委譲
- [x] 1.2 `ensureEntityExists` ヘルパーメソッドを抽出 — remote ブランチのエンティティ作成ロジック（L509-L521）と local ブランチの ID リマップ（L436-L438）を統合。local/remote 共通でエンティティとレンダラーの存在を保証
- [x] 1.3 `applyLocalOverrides` ヘルパーメソッドを抽出 — ローカルヒーロー固有の処理（予測位置上書き、カメラ制御、prediction reset）を分離。`isLocal` 分岐はここだけに限定
- [x] 1.4 `handleServerHeroUpdate` を3ステップ呼び出しにリファクタ — ensureEntityExists → applyServerState → applyLocalOverrides の3行に整理。既存の `if (isLocal) { ... } else { ... }` 構造を除去
- [x] 1.5 既存テスト全 PASS を確認 — `npm run test:unit` で回帰がないことを検証

## 2. updateOnlineInput のフェーズ分離 (input-system spec)

- [x] 2.1 gather フェーズを分離 — メソッド冒頭で `localHero` スナップショットと入力値を読み取り、以降はスナップショットのみ参照。L296 の `attackTargetId !== localHero.attackTargetId` 比較後の `updateEntity` を apply フェーズに移動
- [x] 2.2 compute フェーズを分離 — attackTarget 判定、facing 計算、inputMsg 構築、prediction 位置計算を gather 出力のみに依存する形に整理。中間の `updateEntity` 呼び出しを除去
- [x] 2.3 apply フェーズを分離 — `updateEntity` を1回だけ呼び出し（attackTargetId + facing + position を一括更新）、`networkBridge.sendInput` で入力送信
- [x] 2.4 既存テスト全 PASS を確認

## 3. updateOfflineHero のフェーズ分離 (input-system spec)

- [x] 3.1 gather フェーズを分離 — `localHero` スナップショットを1回取得。`heroNow`, `heroForFacing`, `heroForMove` の3回再取得を排除
- [x] 3.2 compute + apply を整理 — facing 計算と移動計算を gather のスナップショットに基づいて実行。攻撃処理（`combatManager.processAttack`）は現行のまま維持。移動時の `HERO_DEFINITIONS[heroForMove.type].radius` を `localHero.radius`（サーバー値）に変更
- [x] 3.3 既存テスト全 PASS を確認

## 4. テスト更新・最終検証

- [x] 4.1 テスト構造の更新 — 新メソッド（applyServerState, ensureEntityExists, applyLocalOverrides）に対応するテストケースの追加・調整。既存テストのアサーションが新構造と整合することを確認
- [x] 4.2 全テストスイート PASS — `npm run test:unit` (325/325 PASS) + `npm run test:e2e` (22/26 PASS, 4 failures are pre-existing from hero-selection feature → Issue #117)
