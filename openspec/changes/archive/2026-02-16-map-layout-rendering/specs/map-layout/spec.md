## ADDED Requirements

### Requirement: マップレイアウト定数の定義

マップ要素（レーン、ベース、タワー、ブッシュ、ボス地点）の座標・サイズは `src/domain/mapLayout.ts` に定義しなければならない (SHALL)。定数はイミュータブルなオブジェクト構造でエクスポートしなければならない (SHALL)。Phaser に依存してはならない (SHALL NOT)。

#### Scenario: マップレイアウト定数ファイルが存在する
- **WHEN** `src/domain/mapLayout.ts` を参照する
- **THEN** レーン、ベース（blue/red）、タワー（blue/red）、ブッシュ、ボス地点の座標・サイズが定義されている

#### Scenario: マップレイアウト定数が Phaser に依存しない
- **WHEN** `src/domain/mapLayout.ts` の import 文を検査する
- **THEN** `phaser` を import していない

### Requirement: レーン背景の描画

ワールド中央に帯状のレーン背景を描画しなければならない (SHALL)。レーンは背景色とは異なる色で視覚的に区別できなければならない (SHALL)。

#### Scenario: レーンが描画されている
- **WHEN** GameScene が作成される
- **THEN** ワールドの y 中央付近に帯状の矩形が背景とは異なる色で描画されている

#### Scenario: レーンがワールド全幅に渡る
- **WHEN** レーンの描画を確認する
- **THEN** レーンの x 範囲が 0 から WORLD_WIDTH まである

### Requirement: ベースの描画

Blue ベース（ワールド左端）と Red ベース（ワールド右端）をジオメトリック描画で表示しなければならない (SHALL)。チームカラーで識別できなければならない (SHALL)。画像アセットを使用してはならない (SHALL NOT)。

#### Scenario: Blue ベースが左端に描画されている
- **WHEN** GameScene が作成される
- **THEN** ワールド左端付近に青系の色で矩形が描画されている

#### Scenario: Red ベースが右端に描画されている
- **WHEN** GameScene が作成される
- **THEN** ワールド右端付近に赤系の色で矩形が描画されている

#### Scenario: ベースがチームカラーで識別できる
- **WHEN** Blue ベースと Red ベースの色を比較する
- **THEN** 明確に異なる色（青系 vs 赤系）で描画されている

### Requirement: タワーの描画

各チーム 1 基のタワーをジオメトリック描画で表示しなければならない (SHALL)。タワーはベースとレーン中央の間に配置しなければならない (SHALL)。チームカラーで識別できなければならない (SHALL)。

#### Scenario: Blue タワーが配置されている
- **WHEN** GameScene が作成される
- **THEN** Blue ベースとワールド中央の間にチームカラーの円形が描画されている

#### Scenario: Red タワーが配置されている
- **WHEN** GameScene が作成される
- **THEN** Red ベースとワールド中央の間にチームカラーの円形が描画されている

#### Scenario: タワーがレーン上に配置されている
- **WHEN** タワーの y 座標を確認する
- **THEN** レーンの y 範囲内に配置されている

### Requirement: ブッシュの描画

レーン上下端に 2 箇所のブッシュをジオメトリック描画で表示しなければならない (SHALL)。ブッシュは他のマップ要素と視覚的に区別できなければならない (SHALL)。

#### Scenario: ブッシュが 2 箇所描画されている
- **WHEN** GameScene が作成される
- **THEN** レーン付近に 2 つのブッシュ領域が緑系の色で描画されている

#### Scenario: ブッシュがレーン上下端に配置されている
- **WHEN** ブッシュの座標を確認する
- **THEN** ブッシュがレーンの上端または下端付近に配置されている

### Requirement: ボススポーン地点の描画

ワールド中央にボススポーン地点のマーカーを描画しなければならない (SHALL)。マーカーは他のマップ要素と視覚的に区別できなければならない (SHALL)。

#### Scenario: ボス地点がワールド中央に描画されている
- **WHEN** GameScene が作成される
- **THEN** ワールド中央 (x ≈ WORLD_WIDTH / 2) に黄/金系の色でマーカーが描画されている

#### Scenario: ボス地点がレーン上に配置されている
- **WHEN** ボス地点の y 座標を確認する
- **THEN** レーンの y 範囲内に配置されている

### Requirement: 描画処理の分離

マップ描画処理は GameScene から分離した関数として実装しなければならない (SHALL)。GameScene からは関数呼び出しのみでマップを描画できなければならない (SHALL)。

#### Scenario: マップ描画関数が分離されている
- **WHEN** `src/scenes/mapRenderer.ts` を参照する
- **THEN** マップ全体を描画する関数がエクスポートされている

#### Scenario: GameScene がマップ描画関数を呼び出す
- **WHEN** `GameScene.create()` の実装を確認する
- **THEN** マップ描画関数を呼び出しており、マップ描画のロジックが GameScene 内に直接記述されていない

### Requirement: ジオメトリック描画のみ

全マップ要素は Phaser.GameObjects.Graphics によるジオメトリック描画で表示しなければならない (SHALL)。画像アセット（スプライト、テクスチャ）を使用してはならない (SHALL NOT)。

#### Scenario: 画像アセットが使用されていない
- **WHEN** マップ描画コードを検査する
- **THEN** `this.load.image()` や `this.add.sprite()` の呼び出しがない

#### Scenario: Graphics オブジェクトで描画されている
- **WHEN** マップ描画コードを検査する
- **THEN** `Phaser.GameObjects.Graphics` の `fillRect`、`fillCircle` 等のメソッドで描画されている
