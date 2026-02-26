## REMOVED Requirements

### Requirement: オフラインフォールバック
**Reason**: ブラウザゲームなのでオフラインプレイのシーンがない。Solo Play がサーバー上の1人用ルームで代替する
**Migration**: Solo Play モード（`mode: 'solo'`）を使用する。サーバー未起動時はエラー表示

## MODIFIED Requirements

### Requirement: プレイヤー位置・facing の同期
ローカルプレイヤーの `position` と `facing` をサーバーに送信しなければならない（SHALL）。送信レートはフレームレートより低い固定間隔（20Hz）でなければならない（SHALL）。リモートプレイヤーの状態変更を受信して描画に反映しなければならない（SHALL）。

`handleServerHeroUpdate` はサーバー権威モードで状態適用を実行しなければならない（SHALL）:

- `applyServerHeroNonPositionState` で position/facing 以外の全フィールド（type, radius, hp, maxHp, dead, attackTargetId, respawnTimer）を適用する。position と facing は `InterpolationBuffer` 経由で毎フレーム適用される

ローカルヒーローの facing はクライアントが即座に反映し、InterpolationBuffer の facing は無視しなければならない（SHALL）。リモートヒーローの facing は InterpolationBuffer から補間した値を使用しなければならない（SHALL）。

#### Scenario: ローカルプレイヤーの位置を送信する
- **WHEN** ローカルプレイヤーが移動する
- **THEN** 50ms 間隔で position と facing がサーバーに送信される

#### Scenario: リモートプレイヤーの位置を受信して描画する
- **WHEN** サーバーからリモートプレイヤーの position/facing 更新を受信する
- **THEN** スナップショットが InterpolationBuffer に push され、毎フレーム補間位置で HeroRenderer が描画される

#### Scenario: リモートプレイヤーが参加したときに描画が開始される
- **WHEN** リモートプレイヤーが Room に参加する
- **THEN** リモートプレイヤー用の HeroRenderer と InterpolationBuffer が生成され、マップ上に表示される

#### Scenario: リモートプレイヤーが退室したときに描画が停止される
- **WHEN** リモートプレイヤーが Room から退室する
- **THEN** リモートプレイヤーの HeroRenderer と InterpolationBuffer が破棄され、マップから消える

#### Scenario: ローカルヒーローの facing が即座に反映される
- **WHEN** ローカルプレイヤーがマウスを動かして aim 方向を変える
- **THEN** facing はサーバー往復遅延なく即座に反映され、InterpolationBuffer の facing 値は無視される

#### Scenario: ローカルヒーローの初回 ID リマップが ensureEntityExists で実行される
- **WHEN** ローカルヒーローの sessionId が EntityManager の localHeroId と異なる状態で初回更新を受信する
- **THEN** ensureEntityExists ステップで remapLocalHeroToSession が実行される
