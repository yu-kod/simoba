## Context

サーバー権威モード（PR #102）導入後、ヒーロー間攻撃が1発で止まるバグが発生。オフラインモードではクライアントが `attackTargetId` をローカルに永続管理し連続攻撃が動作するが、オンラインモードでは右クリックフレームのみ `attackTargetId` を送信し、以降 `null` を送信 → サーバーが毎ティッククリアする。

現在の関連コード:
- `GameScene.updateOnlineInput()` — 入力送信（右クリック時のみターゲット設定）
- `ServerCombatManager.processHeroCombat()` — サーバー側攻撃処理（`null` でターゲットクリア）
- `GameScene.updateOfflineHero()` — オフライン攻撃処理（ローカルにターゲット永続管理、参考実装）

## Goals / Non-Goals

**Goals:**
- オンラインモードでオフラインと同等の自動連続攻撃を実現
- クライアント・サーバー間のプロトコル（`InputMessage`）を変更せず修正

**Non-Goals:**
- 攻撃ビジュアルフィードバック（Issue #101）
- Entity Interpolation（Issue #100）
- `canMoveWhileAttacking: false` ヒーローのオンライン対応

## Decisions

### 1. クライアント側でターゲットを永続管理し毎フレーム送信

**選択**: クライアントがローカルに `attackTargetId` を保持し、毎フレーム `InputMessage` に含めて送信する

**代替案**: サーバーがティック間で `attackTargetId` を保持し、`null` = 変更なし / `''` = クリア / `"id"` = 新規の3状態プロトコルにする

**理由**:
- オフラインモードの既存パターン（`HeroState.attackTargetId` で永続管理）をそのまま流用できる
- `InputMessage` の型変更不要（`null | string` の2状態のまま）
- サーバーはステートレスに「来た値をそのまま使う」だけ — 3状態の分岐ロジック不要
- 毎フレーム同じ文字列を送るコストは Colyseus のバイナリ差分圧縮で実質ゼロ

### 2. ターゲット解除条件はオフラインモードと統一

クライアント側のターゲット解除条件:
- 移動開始時（`!canMoveWhileAttacking` のヒーロー）→ `attackTargetId = null`
- ターゲットが死亡 → サーバーの `handleServerHeroUpdate` 経由でクライアントの `attackTargetId` が更新される
- 射程外 → サーバー側で判定してクリア、クライアントに反映

### 3. サーバー側のターゲット検証は維持

クライアントがターゲットを送信しても、サーバーは以下を検証:
- ターゲットが存在するか
- ターゲットが死んでいないか
- ターゲットが敵チームか
- ターゲットが射程内か

不正なターゲットはサーバーがクリアし、`hero.attackTargetId = ''` に戻す。

## Risks / Trade-offs

- **クライアントとサーバーのターゲット不整合** → サーバーが毎ティック検証するため、最大1ティック（16ms）で収束。サーバーから `attackTargetId` が同期されるのでクライアント側も追従する
- **死亡ターゲットへの攻撃リクエスト** → サーバーが `target.dead` チェックで弾く。クライアントはサーバーから死亡通知を受けた時点でローカルターゲットを解除
