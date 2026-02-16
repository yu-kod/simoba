## ADDED Requirements

### Requirement: HeroRenderer による描画分離
HeroRenderer クラスが Phaser.GameObjects.Container をラップし、HeroState を受けて描画を同期する。GameScene は描画の詳細を知らず、HeroRenderer に委譲する。

#### Scenario: HeroRenderer を生成する
- **WHEN** `new HeroRenderer(scene, heroState)` でインスタンスを作成する
- **THEN** scene に Container が追加され、ヒーローのジオメトリック形状が描画される

#### Scenario: HeroRenderer を同期する
- **WHEN** `renderer.sync(heroState)` を呼ぶ
- **THEN** Container の位置が `heroState.position` に、回転が `heroState.facing` に更新される

#### Scenario: HeroRenderer を破棄する
- **WHEN** `renderer.destroy()` を呼ぶ
- **THEN** Container とその子オブジェクトが scene から削除される

### Requirement: ヒーロータイプ別の形状と色
BLADE・BOLT・AURA はそれぞれ異なるジオメトリック形状と固有色で描画され、視覚的に区別できる。全て円を基本とし、タイプ別のインジケーター形状を持つ。チームの識別はヒーロー本体の色ではなく HP バー (#58) で行うため、ヒーロー本体の色はタイプごとに自由に設定できる。

#### Scenario: BLADE の形状
- **WHEN** `type: 'BLADE'` のヒーローを描画する
- **THEN** 円に加え、近接ファイターを示す形状（三角形など）が描画される

#### Scenario: BOLT の形状
- **WHEN** `type: 'BOLT'` のヒーローを描画する
- **THEN** 円に加え、遠距離レンジャーを示す形状（ひし形など）が描画される

#### Scenario: AURA の形状
- **WHEN** `type: 'AURA'` のヒーローを描画する
- **THEN** 円に加え、サポートを示す形状（六角形など）が描画される

### Requirement: 向きインジケーターの描画
ヒーローの facing 方向を示すインジケーター（小さな三角形やラインなど）を描画する。facing の変化に追従してインジケーターが回転する。

#### Scenario: 右を向いているとき
- **WHEN** `facing: 0`（右方向）のヒーローを描画する
- **THEN** インジケーターが右方向を指す

#### Scenario: facing が変化したとき
- **WHEN** `sync()` で `facing` が前回と異なる値で呼ばれる
- **THEN** インジケーターが新しい facing 方向に回転する

### Requirement: GameScene のリファクタ
GameScene はインラインのヒーロー描画コードを削除し、HeroRenderer を使用する。プレイヤーヒーロー1体を管理する。

#### Scenario: GameScene がヒーローを生成する
- **WHEN** GameScene の `create()` が実行される
- **THEN** `createHeroState` でヒーロー状態を生成し、`HeroRenderer` で描画する

#### Scenario: GameScene の update でヒーローを更新する
- **WHEN** GameScene の `update()` が毎フレーム実行される
- **THEN** InputHandler から入力を読み取り、移動と facing を更新し、`renderer.sync()` で描画を同期する
