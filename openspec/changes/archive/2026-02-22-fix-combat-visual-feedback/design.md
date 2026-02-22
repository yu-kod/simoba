## Context

サーバー権威モード移行後、オンラインモードの `update()` ループでは `updateOnlineInput()` → `sendInput()` のパスのみ通る。オフラインモードが `processAttack()` の戻り値（`damageEvents`, `meleeSwings`）からエフェクトをトリガーしていたのに対し、オンラインではサーバー state sync 経由で状態が更新されるだけで、**エフェクトトリガーのフックが未接続**。

既存の仕組み:
- `HeroRenderer.flash()` / `TowerRenderer.flash()` — 白点滅（既存 API、呼ぶだけ）
- `MeleeSwingRenderer.play(params)` — 円弧エフェクト（既存 API）
- `HeroRenderer.sync(state)` — `setVisible(!dead)` で死亡非表示（毎フレーム呼ばれている）
- `MovementPredictor.setPosition()` / `InputBuffer.clear()` — リセット API（既存）

## Goals / Non-Goals

**Goals:**
- HP 減少時にダメージフラッシュが両プレイヤーの画面で表示される
- ローカルプレイヤーの近接攻撃時にメレースイングが表示される
- 死亡→リスポーン時の MovementPredictor/InputBuffer リセットで予測ズレを防止

**Non-Goals:**
- Entity Interpolation / ネットワークスムージング（#100）
- リモートプレイヤーのメレースイング表示（サーバーが攻撃イベントを通知しないため。将来課題）
- 新エフェクトの追加

## Decisions

### 1. HP 差分検知でダメージフラッシュ

`handleServerHeroUpdate` / `handleServerTowerUpdate` で更新前の HP を取得し、`state.hp < prevHp` なら `flash()` を呼ぶ。

**理由:** サーバーはダメージイベントを個別に送信しない（state sync のみ）。HP 差分が最もシンプルで確実な検知方法。

**代替案:** サーバーからダメージイベントメッセージを送信する → 追加のメッセージ型定義 + サーバー変更が必要。オーバーキル。

### 2. メレースイングは楽観的に再生（ローカルのみ）

`updateOnlineInput` 内で `attackTargetId` がセットされており、かつクールダウンが経過していると推定されるタイミングでメレースイングを再生する。ただし、クライアントには正確なクールダウン情報がないため、**サーバーの `attackCooldown` をスキーマ経由で同期してクライアントで判定する**。

**簡易アプローチ:** サーバーの `attackCooldown` の変化を監視し、`attackCooldown` が 0 にリセット→ 正値にジャンプ（= 攻撃発動）を検知してメレースイングを再生する。これはローカル・リモート両方で動作する。

**理由:** `attackCooldown` は既に `HeroSchema` の `float32` フィールドとして存在し、Colyseus で自動同期される。クライアント側で新しいリスナーを追加するだけで済む。

### 3. 死亡/リスポーン時の予測リセット

`handleServerHeroUpdate` で `dead` が `false → true` に遷移した時、`InputBuffer.clear()` + `MovementPredictor.setPosition(state.x, state.y)` を呼ぶ。リスポーン（`true → false`）時も同様にリセット。

**理由:** 死亡中も入力バッファが溜まるとリスポーン後に予測位置が大きくズレる。

## Risks / Trade-offs

- **[HP 差分が複数ヒットで 1 フラッシュになる]** → 60Hz tick で同一フレーム内の複数ダメージは稀。許容範囲。
- **[メレースイングのタイミングが若干ずれる]** → `attackCooldown` 変化検知方式なので、サーバーの攻撃タイミングに追従する。楽観的再生よりも正確。
- **[リモートプレイヤーのメレースイングも表示される]** → `attackCooldown` 変化は全ヒーローで検知できるため、リモートプレイヤーのスイングも表示可能。ただし BOLT（遠距離）にはスイングを出さないよう `projectileSpeed === 0` の判定が必要。
