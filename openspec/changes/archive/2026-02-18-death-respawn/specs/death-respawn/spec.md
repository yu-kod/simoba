## ADDED Requirements

### Requirement: Death on zero HP

ヒーローの HP が 0 以下になった時点で、そのヒーローは死亡状態に遷移する。死亡状態のヒーローは `dead: true` となり、死亡地点が `deathPosition` として記録される。

#### Scenario: Hero HP reaches zero from damage

- **WHEN** ヒーローがダメージを受けて HP が 0 以下になる
- **THEN** ヒーローの `dead` が `true` になる
- **THEN** `deathPosition` に死亡時の座標が記録される
- **THEN** `respawnTimer` にリスポーン秒数がセットされる

#### Scenario: Hero HP is already zero

- **WHEN** `hp` が既に 0 のヒーローに追加ダメージが発生する
- **THEN** 状態は変化しない（二重死亡しない）

### Requirement: Dead hero cannot act

死亡状態のヒーローは攻撃および移動ができない。

#### Scenario: Dead hero attempts to attack

- **WHEN** 死亡状態のヒーローに攻撃入力がある
- **THEN** 攻撃は実行されない

#### Scenario: Dead hero movement input

- **WHEN** 死亡状態のヒーローに移動入力がある
- **THEN** ヒーローの位置は変化しない

### Requirement: Dead hero is untargetable

死亡状態のヒーローは攻撃対象として選択できない。

#### Scenario: Click on dead enemy

- **WHEN** プレイヤーが死亡状態の敵ヒーローを右クリックする
- **THEN** 攻撃対象として選択されない

#### Scenario: Projectile targets dead enemy

- **WHEN** 飛行中のプロジェクタイルのターゲットが死亡する
- **THEN** プロジェクタイルは消滅する（ダメージなし）

### Requirement: Dead hero is hidden

死亡状態のヒーローの描画は非表示になる。HP バーも非表示になる。

#### Scenario: Hero dies

- **WHEN** ヒーローが死亡状態に遷移する
- **THEN** ヒーローのジオメトリック描画が非表示になる
- **THEN** HP バーが非表示になる

#### Scenario: Hero respawns

- **WHEN** ヒーローがリスポーンする
- **THEN** ヒーローの描画が再表示される
- **THEN** HP バーが再表示される

### Requirement: Respawn timer countdown

死亡状態のヒーローは `respawnTimer` を持ち、毎フレーム減算される。タイマーが 0 以下になるとリスポーンする。

#### Scenario: Timer decrements each frame

- **WHEN** 死亡状態のヒーローのゲームループが実行される
- **THEN** `respawnTimer` が `deltaSeconds` 分だけ減算される

#### Scenario: Timer reaches zero

- **WHEN** `respawnTimer` が 0 以下になる
- **THEN** ヒーローがリスポーン処理に遷移する

### Requirement: Respawn at configurable position

リスポーン時、ヒーローは `RespawnPositionResolver` が返す位置に復活する。デフォルトは自チームベースの中央。

#### Scenario: Default respawn at team base

- **WHEN** ヒーローがリスポーンする（デフォルト設定）
- **THEN** ヒーローの位置が自チームベースの中央座標になる
- **THEN** Blue チームは `MAP_LAYOUT.bases.blue` の中央、Red チームは `MAP_LAYOUT.bases.red` の中央

#### Scenario: Custom respawn position

- **WHEN** カスタム `RespawnPositionResolver` が設定されている
- **THEN** その resolver が返す座標でリスポーンする

### Requirement: Respawn restores full HP

リスポーン時、ヒーローの HP が最大値まで回復し、死亡状態がリセットされる。

#### Scenario: Hero respawns

- **WHEN** リスポーン処理が実行される
- **THEN** `hp` が `maxHp` と等しくなる
- **THEN** `dead` が `false` になる
- **THEN** `respawnTimer` が `0` になる
- **THEN** `attackTargetId` が `null` にリセットされる
- **THEN** `attackCooldown` が `0` にリセットされる

### Requirement: Configurable respawn time

リスポーン時間は関数引数として外部から渡せる構造とする。デフォルト値は `DEFAULT_RESPAWN_TIME`（5秒）定数を使用する。

#### Scenario: Default respawn time

- **WHEN** リスポーン時間が明示的に指定されていない
- **THEN** `DEFAULT_RESPAWN_TIME`（5秒）が使用される

#### Scenario: Custom respawn time

- **WHEN** リスポーン時間が引数で指定される
- **THEN** 指定された秒数が `respawnTimer` にセットされる

### Requirement: Free camera during death

死亡中、プレイヤーはカメラ追従が解除され、WASD でカメラを自由に移動できる。

#### Scenario: Hero dies and camera becomes free

- **WHEN** プレイヤーのヒーローが死亡する
- **THEN** カメラのヒーロー追従が解除される
- **THEN** WASD 入力でカメラ位置が移動する
- **THEN** カメラはワールド境界内に制限される

#### Scenario: Hero respawns and camera follows again

- **WHEN** プレイヤーのヒーローがリスポーンする
- **THEN** カメラがリスポーン位置に移動する
- **THEN** カメラのヒーロー追従が再開される

### Requirement: Respawn timer UI

死亡中、画面中央にリスポーンまでの残り秒数を表示する。

#### Scenario: Timer display during death

- **WHEN** プレイヤーのヒーローが死亡状態である
- **THEN** 画面中央に「Respawning in X...」の形式でカウントダウンが表示される
- **THEN** 表示は毎フレーム更新される（小数切り上げで整数秒表示）

#### Scenario: Timer hidden when alive

- **WHEN** プレイヤーのヒーローが生存中である
- **THEN** リスポーンタイマー UI は表示されない

### Requirement: Enemy bot death and respawn

敵 Bot ヒーローもプレイヤーと同じ死亡・リスポーンルールに従う。

#### Scenario: Bot HP reaches zero

- **WHEN** 敵 Bot の HP が 0 以下になる
- **THEN** Bot が死亡状態になる（`dead: true`）
- **THEN** Bot の描画が非表示になる
- **THEN** Bot が攻撃対象から除外される

#### Scenario: Bot respawns

- **WHEN** Bot のリスポーンタイマーが 0 以下になる
- **THEN** Bot が自チームベース中央でリスポーンする
- **THEN** Bot の HP が全回復する
- **THEN** Bot の描画が再表示される
