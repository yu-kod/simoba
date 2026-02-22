## 1. クライアント側: ローカルターゲット永続管理

- [x] 1.1 `GameScene.updateOnlineInput()` で右クリック時にローカル `HeroState.attackTargetId` を更新し、毎フレーム `InputMessage.attackTargetId` に現在のターゲットを送信する（`specs/attack-system/spec.md` — クライアントが毎フレームターゲットを送信するシナリオ）
- [x] 1.2 移動開始時（`!canMoveWhileAttacking`）にローカルの `attackTargetId` を `null` にクリアして送信する（`specs/attack-system/spec.md` — クライアントが null を送信してターゲット解除するシナリオ）

## 2. サーバー側: ステートレスターゲット処理

- [x] 2.1 `ServerCombatManager.processHeroCombat()` のターゲット更新ロジックを修正 — クライアントから受け取った `attackTargetId` をそのまま使用し、`null` / `undefined` の場合のみクリアする（`specs/attack-system/spec.md` — サーバーがクライアントのターゲットをそのまま使用するシナリオ）— 変更不要、既存ロジックが新クライアント動作と互換
- [x] 2.2 入力なし（`input === undefined`）の場合にターゲットをクリアする処理を確認（`specs/attack-system/spec.md` — 入力がないティックでサーバーがターゲットをクリアするシナリオ）— 確認済み、`input?.attackTargetId ?? null` で正しくクリアされる

## 3. テスト

- [x] 3.1 `ServerCombatManager.test.ts` にターゲット永続化テストを追加 — 連続ティックで同じターゲットを送信した場合に攻撃が継続すること
- [x] 3.2 `ServerCombatManager.test.ts` にターゲット解除テストを追加 — `null` 送信でターゲットがクリアされること
- [x] 3.3 `ServerCombatManager.test.ts` に不正ターゲット拒否テストを追加 — 死亡/味方/存在しないターゲットが拒否されること
- [x] 3.4 全ユニットテスト実行（`npm run test:unit` + サーバーテスト）で PASS 確認
