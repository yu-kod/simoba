# Specification

## Purpose
BLADE ヒーローの Whirlwind スキル仕様 — キャスターに追従する回転ゾーンで範囲内の敵にティックダメージを与える

## Requirements

### Requirement: Whirlwind スキル定義
システムは `SKILL_DEFINITIONS` に `blade-whirlwind` を登録しなければならない（SHALL）。`targeting: 'self'`、`effectType: 'zone'`、`cooldown: 12`、`zoneRadius: 120`、`zoneDuration: 3`、`tickDamage: 30`、`tickInterval: 0.5`、`followCaster: true`。

#### Scenario: スキル定義が登録されている
- **WHEN** `getSkillDefinition('blade-whirlwind')` が呼ばれる
- **THEN** `effectType: 'zone'`、`cooldown: 12`、`zoneRadius: 120`、`zoneDuration: 3` を持つ有効な `SkillDefinition` が返される

### Requirement: Whirlwind は発動時にキャスター追従ゾーンを生成する
BLADE ヒーローが `blade-whirlwind` を発動すると、サーバーはキャスターの位置を中心にゾーンを生成し、`followHeroId` をキャスターのセッション ID に設定しなければならない（SHALL）。ゾーンは毎ティックキャスターに追従する。

#### Scenario: キャスター位置にゾーンが生成される
- **WHEN** 位置 (500, 300) の BLADE ヒーローが `blade-whirlwind` を発動する
- **THEN** `x: 500`、`y: 300`、`radius: 120`、`followHeroId` がキャスターのセッション ID、`remainingDuration: 3` のゾーンが生成される

#### Scenario: ゾーンがキャスターの移動に追従する
- **WHEN** キャスターが Whirlwind 中に (500, 300) から (600, 350) に移動する
- **THEN** ゾーンの座標が毎ティック (600, 350) に更新される

### Requirement: Whirlwind は範囲内の敵にティックダメージを与える
ゾーンは `tickInterval` ごとに範囲内のすべての敵に `tickDamage` を与えなければならない（SHALL）。味方とキャスターはダメージを受けない（SHALL NOT）。

#### Scenario: ゾーン内の敵がティックダメージを受ける
- **WHEN** 敵ヒーローがゾーン中心から 120px 以内にいて、最後のティックから 0.5 秒が経過する
- **THEN** 敵は 30 ダメージを受け、ゾーンの `lastAttackerSessionId` が被害者に設定される

#### Scenario: 味方は味方の Whirlwind でダメージを受けない
- **WHEN** 味方ヒーローが味方の Whirlwind ゾーンから 120px 以内にいる
- **THEN** 味方はダメージを受けない（SHALL NOT）

#### Scenario: 複数の敵が同時にダメージを受ける
- **WHEN** ダメージティック時に 2 人の敵ヒーローがゾーン半径内にいる
- **THEN** 両方の敵がそれぞれ 30 ダメージを受ける

#### Scenario: 全持続時間での合計ダメージ
- **WHEN** 敵が Whirlwind ゾーン内に 3 秒間の全持続時間とどまる
- **THEN** 敵は合計約 180 ダメージを受ける（30 ダメージ × 6 ティック、0.5 秒間隔）

### Requirement: Whirlwind はキャスターに移動速度低下を適用する
Whirlwind 発動時、キャスターはゾーン持続時間中スピードデバフステータスエフェクトを受けなければならない（SHALL）。キャスターの移動速度は 40 低下する。

#### Scenario: Whirlwind 中にキャスターが減速される
- **WHEN** BLADE ヒーローが `blade-whirlwind` を発動する
- **THEN** キャスターは `value: -40`、`duration: 3` の `speed` ステータスエフェクトを持つ

#### Scenario: Whirlwind 終了後に速度が正常に戻る
- **WHEN** Whirlwind の 3 秒間の持続時間が満了する
- **THEN** キャスターのスピードデバフは既存の `tickBuffs` システムにより削除される

### Requirement: Whirlwind ゾーンはキャスター死亡時に削除される
キャスターが Whirlwind アクティブ中に死亡した場合、ゾーンは即座に削除されなければならない（SHALL）。

#### Scenario: Whirlwind 中にキャスターが死亡する
- **WHEN** Whirlwind ゾーンがアクティブな状態でキャスターの HP が 0 になる
- **THEN** ゾーンは同ティックで削除される

### Requirement: Whirlwind はダッシュ中にブロックされる
キャスターが現在ダッシュ中の場合、Whirlwind の発動は拒否されなければならない（SHALL）（既存のスキル実行ガードと一貫）。

#### Scenario: ダッシュ中に発動が拒否される
- **WHEN** `dashTimer > 0` のヒーローが `blade-whirlwind` を発動しようとする
- **THEN** 発動は null を返し、ゾーンは生成されない

### Requirement: Whirlwind クールダウン
発動成功後、スキルのクールダウンは 12 秒に設定されなければならない（SHALL）。

#### Scenario: 発動後にクールダウンが適用される
- **WHEN** `blade-whirlwind` がスロット Q で発動に成功する
- **THEN** キャスターの `cooldownQ` が 12 に設定される

### Requirement: Whirlwind ゾーンのビジュアル
クライアントは `ZONE_VISUALS` で赤オレンジのカラースキームで Whirlwind ゾーンをレンダリングしなければならない（SHALL）。

#### Scenario: ゾーンがすべてのプレイヤーに表示される
- **WHEN** Whirlwind ゾーンがアクティブである
- **THEN** 味方・敵の両プレイヤーがゾーンを塗りつぶし円＋ボーダーとして見ることができる

### Requirement: Whirlwind はミニオンにもダメージを与える
Whirlwind ゾーンは範囲内の敵ミニオンにもティックダメージを与えなければならない（SHALL）。

#### Scenario: 敵ミニオンがティックダメージを受ける
- **WHEN** ダメージティック時に敵ミニオンが Whirlwind ゾーン半径内にいる
- **THEN** ミニオンは 30 ダメージを受ける
