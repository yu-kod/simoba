## 1. 共有: スキルメタデータ定義

- [x] 1.1 `shared/skills/skillDefinitions.ts` に `SkillDefinition` インターフェースと `SKILL_DEFINITIONS` 定数テーブルを作成。`blade-charge` を最初のエントリとして定義（仮値: cooldown=8, distance=300, damage=80, duration=0.3, targeting='direction'）（spec: skill-execution）
- [x] 1.2 `shared/messages.ts` に `UseSkillMessage` 型（`slot`, `target`）と `SkillEvent` 型（`casterId`, `skillId`, `position`, `direction`）を追加（spec: skill-execution）

## 2. サーバー: スキーマ拡張

- [x] 2.1 `HeroSchema` に `cooldownQ`, `cooldownE`, `cooldownR`（各 `@type('float32')`、初期値 0）を追加（spec: skill-slots modified）
- [x] 2.2 `HeroSchema` に `dashTimer`, `dashDirX`, `dashDirY`, `dashSpeed`（各 `@type('float32')`、初期値 0）を追加（spec: blade-charge）

## 3. サーバー: スキル実行システム

- [x] 3.1 `ServerSkillExecutionSystem.ts` に `executeSkill(state, sessionId, slot, target)` 純粋関数を作成 — 共通バリデーション（装備・CD・生存）→ スキルID取得 → 個別ハンドラにディスパッチ → CD セット → SkillEvent 返却（spec: skill-execution）
- [x] 3.2 `executeCharge(hero, direction)` を実装 — `dashTimer`, `dashDirX/Y`, `dashSpeed` をセット（spec: blade-charge）
- [x] 3.3 `ServerSkillExecutionSystem` のユニットテスト — 共通バリデーション（CD中拒否、死亡中拒否、空スロット拒否）、Charge 発動でダッシュ状態セット（spec: skill-execution, blade-charge）

## 4. サーバー: ダッシュ処理

- [x] 4.1 `GameRoom.gameUpdate` の移動処理にダッシュ分岐を追加 — `dashTimer > 0` なら WASD 無視、`dashDir * dashSpeed * dt` で位置更新、`dashTimer -= dt`、ワールド境界クランプ（spec: blade-charge）
- [x] 4.2 ダッシュ中の接触ダメージ判定を実装 — 毎 tick 敵ヒーロー・ミニオンとの距離判定、ヒット済み Set で重複防止、タワー除外。DamageEvent を返却（spec: blade-charge）
- [x] 4.3 ダッシュ処理のユニットテスト — 位置更新、タイマー減算、境界クランプ、接触ダメージ、重複防止、タワー除外（spec: blade-charge）

## 5. サーバー: メッセージハンドラ・クールダウン tick

- [x] 5.1 `GameRoom.onMessage('useSkill', ...)` ハンドラを追加 — `executeSkill` を呼び、成功時に `broadcast('skill', event)` （spec: skill-execution）
- [x] 5.2 `GameRoom.gameUpdate` にクールダウン毎 tick 減算処理を追加 — 全ヒーローの `cooldownQ/E/R` を `Math.max(0, cd - dt)` で更新（spec: skill-execution）
- [x] 5.3 クールダウン減算のユニットテスト — 正常減算、0 クランプ（spec: skill-execution）

## 6. クライアント: スキル発動送信

- [x] 6.1 `GameMode` インターフェースに `sendUseSkill(slot, target)` を追加、`OnlineGameMode` に実装（spec: skill-execution）
- [x] 6.2 `NetworkBridge` に `sendUseSkill` を追加（spec: skill-execution）
- [x] 6.3 `GameScene.update()` で `targeting.phase === 'fired'` を検出し、`networkBridge.sendUseSkill(slot, target)` を送信、ターゲティング状態を idle にリセット（spec: skill-execution）

## 7. クライアント: イベント受信・状態同期

- [x] 7.1 `OnlineGameMode` に `skillEvent` メッセージリスナーを追加、`onSkillEvent` コールバックを追加（spec: skill-execution）
- [x] 7.2 `OnlineGameMode` の hero listen に `cooldownQ`, `cooldownE`, `cooldownR`, `dashTimer` を追加（spec: skill-execution, blade-charge）
- [x] 7.3 `ServerHeroState` に `cooldownQ`, `cooldownE`, `cooldownR`, `dashTimer` を追加、`notifyServerHeroUpdate` で読み取り（spec: skill-execution, blade-charge）

## 8. クライアント: クールダウン UI

- [x] 8.1 `GameHud` のスキルスロット表示にクールダウン残り秒数表示を追加 — CD 中はグレーアウト + 残り秒数（切り上げ整数）、CD 0 で通常表示（spec: skill-execution）

## 9. 検証

- [x] 9.1 `npm test` 全テスト通過を確認
- [x] 9.2 `npm run lint` 通過を確認
