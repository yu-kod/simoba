# Specification

## Purpose

スキル発動システム — クライアントからのスキル使用リクエストの検証、クールダウン管理、スキルイベントのブロードキャスト、ターゲティング処理を担う。

## Requirements

### Requirement: スキルメタデータ定義
各スキルの共通パラメータ（`cooldown`, `range`, `damage`, `targeting`, `castTime`）を共有定数テーブルとして定義しなければならない（SHALL）。`targeting` は `'direction' | 'point' | 'self' | 'ally'` のいずれかでなければならない（SHALL）。スキル定義はサーバーとクライアントの両方から参照可能な `shared/` 配下に配置しなければならない（SHALL）。

#### Scenario: スキル定義の参照
- **WHEN** サーバーまたはクライアントがスキルID `blade-charge` のメタデータを取得する
- **THEN** cooldown, range, damage, targeting 等のパラメータが返される

### Requirement: useSkill メッセージ
クライアントは `useSkill` メッセージ（`slot: 'Q' | 'E' | 'R'`, `target: { x: number, y: number }`）をサーバーに送信しなければならない（SHALL）。サーバーは受信時に以下を検証しなければならない（SHALL）：該当スロットにスキルが装備されていること、スロットのクールダウンが 0 であること、ヒーローが生存中であること。検証失敗時はメッセージを無視しなければならない（SHALL）。

#### Scenario: 正常なスキル発動
- **WHEN** ヒーローが生存中で、Q スロットに `blade-charge` が装備されており、CD が 0 の状態で `useSkill { slot: 'Q', target: { x: 500, y: 300 } }` を送信する
- **THEN** サーバーがスキル効果を実行し、Q スロットのクールダウンがスキル定義の cooldown 値にセットされる

#### Scenario: クールダウン中のスキル発動拒否
- **WHEN** Q スロットのクールダウンが 0 より大きい状態で `useSkill { slot: 'Q', ... }` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 死亡中のスキル発動拒否
- **WHEN** ヒーローが死亡中に `useSkill` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

#### Scenario: 空スロットのスキル発動拒否
- **WHEN** Q スロットが空（スキル未装備）の状態で `useSkill { slot: 'Q', ... }` を送信する
- **THEN** サーバーはメッセージを無視し、状態は変化しない

### Requirement: クールダウン管理
`HeroSchema` はスロット別のクールダウン残り時間（`cooldownQ`, `cooldownE`, `cooldownR`、各 `float32`）を持たなければならない（SHALL）。初期値は 0 でなければならない（SHALL）。サーバーは毎 tick、0 より大きいクールダウンを deltaSeconds 分減算しなければならない（SHALL）。0 以下になった場合は 0 にクランプしなければならない（SHALL）。クールダウンフィールドは Colyseus `@type` で全クライアントに同期されなければならない（SHALL）。

#### Scenario: クールダウンの減算
- **WHEN** `cooldownQ` が 5.0 の状態で 0.1 秒経過する
- **THEN** `cooldownQ` が 4.9 になる

#### Scenario: クールダウンの 0 クランプ
- **WHEN** `cooldownQ` が 0.05 の状態で 0.1 秒経過する
- **THEN** `cooldownQ` が 0 になる（負の値にならない）

### Requirement: スキル発動イベントブロードキャスト
サーバーはスキル発動成功時に `skillEvent` メッセージを全クライアントにブロードキャストしなければならない（SHALL）。イベントには `casterId`（発動者のセッションID）、`skillId`（スキルID）、`position`（発動位置）、`direction`（方向、direction ターゲティング時）を含まなければならない（SHALL）。

#### Scenario: スキル発動イベントの受信
- **WHEN** プレイヤーAがスキルを発動する
- **THEN** 全クライアントが `skillEvent` メッセージを受信し、発動者・スキルID・位置が取得できる

### Requirement: クライアント側ターゲティング送信
クライアントは `targeting.phase` が `'fired'` になったとき、該当スロットとターゲット位置を `useSkill` メッセージとしてサーバーに送信しなければならない（SHALL）。送信後、ターゲティング状態を `'idle'` にリセットしなければならない（SHALL）。

#### Scenario: ターゲティング完了からサーバー送信
- **WHEN** プレイヤーが Q キーを押してターゲティング待機に入り、左クリックで位置を指定する
- **THEN** `useSkill { slot: 'Q', target: クリック位置 }` がサーバーに送信され、ターゲティング状態が idle に戻る

### Requirement: 無効対象でのターゲティング解除
`direction` ターゲティングのスキルでは左クリック位置は常に有効な方向として扱わなければならない（SHALL）。将来の対象指定型スキル（`ally` 等）では、有効な対象がない位置への左クリックでターゲティング待機状態を解除しなければならない（SHALL）。

#### Scenario: direction スキルは左クリックで常に発動
- **WHEN** direction ターゲティングのスキルで地面を左クリックする
- **THEN** クリック位置を方向としてスキルが発動する

### Requirement: クールダウン UI 表示
GameHud のスキルスロット表示にクールダウン残り時間を表示しなければならない（SHALL）。クールダウン中はスロットをグレーアウトし、残り秒数（小数点以下切り上げの整数）をスロット上に表示しなければならない（SHALL）。クールダウンが 0 のスロットは通常表示しなければならない（SHALL）。

#### Scenario: クールダウン中のスロット表示
- **WHEN** Q スロットのクールダウンが 3.2 秒残っている
- **THEN** Q スロットがグレーアウトされ、「4」と表示される

#### Scenario: クールダウン完了のスロット表示
- **WHEN** Q スロットのクールダウンが 0 になる
- **THEN** Q スロットが通常表示に戻り、秒数表示が消える
