## 1. HP バー描画ロジック（純粋関数）

- [x] 1.1 `src/domain/ui/computeHpBar.ts` に HP バー計算の純粋関数を作成する。入力: `hp`, `maxHp`, `barWidth`。出力: HP バーの各部分の幅（currentHpWidth, trailWidth）と区切り線の X 座標配列を返す
- [x] 1.2 `computeHpBar` のユニットテストを作成する（HP 50%, HP 0%, 区切り線の本数計算: maxHp=650, 750, 1000, 200 のケース）

## 2. トレイリングバー状態管理（純粋関数）

- [x] 2.1 `src/domain/ui/trailState.ts` にトレイリングバーの状態遷移を管理する純粋関数を作成する。`TrailState` 型（trailHp, delayRemaining）と `updateTrail(state, currentHp, deltaTime)` → 新しい `TrailState` を返す
- [x] 2.2 `trailState` のユニットテストを作成する（ダメージ直後の白バー表示、遅延後の縮小開始、現在HPへの到達で消滅、連続ダメージで右端維持）

## 3. HpBarRenderer（Phaser 描画）

- [x] 3.1 `src/scenes/ui/HpBarRenderer.ts` を作成する。Phaser Graphics を使い、背景バー・HP バー・トレイリングバー・区切り線・枠線を描画する。コンストラクタで `radius`, `maxHp`, `isAlly` を受け取る
- [x] 3.2 `sync(hp, maxHp, position)` メソッドで位置追従と HP 更新を行う。HP が変化したときにトレイリングバーの状態を更新する
- [x] 3.3 `update(delta)` メソッドでトレイリングバーの時間ベース縮小処理を行い、毎フレーム再描画する
- [x] 3.4 HP 満タン時（`hp === maxHp` かつトレイル非アクティブ）は非表示にする

## 4. HeroRenderer への統合

- [x] 4.1 `HeroRenderer` のコンストラクタで `HpBarRenderer` を生成し、Container に子として追加する。チームカラー判定に `isAlly` パラメータを追加する
- [x] 4.2 `HeroRenderer.sync()` で `HpBarRenderer.sync()` を呼び出し、HP 状態を渡す
- [x] 4.3 `HeroRenderer.update()` で `HpBarRenderer.update(delta)` を呼び出す

## 5. GameScene への接続

- [x] 5.1 `GameScene` でプレイヤーヒーローの `HeroRenderer` 生成時に `isAlly: true` を渡す
- [x] 5.2 `GameScene` で敵ヒーローの `HeroRenderer` 生成時に `isAlly: false` を渡す

## 6. テスト

- [x] 6.1 `computeHpBar` と `trailState` のユニットテストが全て PASS することを確認する
- [x] 6.2 E2E テスト: ダメージを受けた後に HP バーが表示されることを検証する
- [x] 6.3 既存のユニットテスト・E2E テストが全て PASS することを確認する
