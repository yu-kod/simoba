## Why

スキルスロット（Q/E/R）の装備UIとタレントによるスキル付与は実装済みだが、スキルを発動しても何も起きない。ターゲティング入力ステートマシン（targetingReducer）も構築済みだが、`phase: 'fired'` を消費してサーバーに送信するパイプラインが存在しない。スキル発動基盤がないと全21スキルの実装に着手できないため、まず基盤を作り、最初のスキル1つ（BLADE の Charge）を動かすところまでをスコープとする。

## What Changes

- スキルメタデータ定義（共通パラメータ: cooldown, range, damage, targeting 等）を共有定数として追加
- サーバー側スキル実行システム: `useSkill` メッセージ受信 → バリデーション（装備済み・CD・生存）→ 効果適用 → イベントブロードキャスト
- HeroSchema にスロット別クールダウン状態を追加、毎 tick 減算
- クライアント側: targeting `phase: 'fired'` → `useSkill` メッセージ送信の接続
- クライアント側: 無効な対象への左クリック（地面など）でターゲティング待機状態を解除
- クライアント側: クールダウン表示（GameHud のスキルスロットにCD残り秒数を表示）
- 最初の実装スキル: BLADE の **Charge**（direction ターゲティング、直線ダッシュ＋接触ダメージ）

### ターゲティングフロー
1. Q/E/R キー押下 → スキル待機状態（targeting phase）に入る
2. 左クリックで対象を指定 → スキル発動（fired）→ サーバーに送信
3. 有効な対象がない場所（地面等）を左クリック → ターゲティング解除（idle に戻る）
4. 右クリック → ターゲティングキャンセル
5. 移動中でもスキル待機状態は維持される（移動によるキャンセルなし）

## Non-goals

- Charge 以外のスキルの実装（基盤の上に個別チケットで追加）
- パッシブスキルの実装
- バフ/デバフの持続効果システム（Charge は即時効果のみ）
- スキルエフェクトのビジュアル演出（最低限の表示のみ）
- 移動によるスキルキャストのキャンセル

## Capabilities

### New Capabilities
- `skill-execution`: スキル発動の共通基盤 — メタデータ定義、サーバー実行パイプライン、クールダウン管理、クライアント送信・表示
- `blade-charge`: BLADE の Charge スキル実装 — direction ターゲティング、直線ダッシュ、接触ダメージ

### Modified Capabilities
- `skill-slots`: スキル発動時のクールダウン状態管理を追加（HeroSchema にCD フィールド）

## Impact

- **サーバー**: `GameRoom` に `useSkill` メッセージハンドラ追加、新システム `ServerSkillExecutionSystem` 追加、`HeroSchema` にCD フィールド追加
- **共有**: `shared/messages` に `UseSkillMessage` / `SkillEvent` 型追加、`shared/skills/` にスキルメタデータ定義
- **クライアント**: `GameScene` / `NetworkBridge` でターゲティング結果をサーバーに送信、`GameHud` にCD表示追加
- **既存スペック**: `skill-slots`（CD状態の追加）
