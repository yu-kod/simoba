## Context

現在の E2E テスト (4 ファイル) は `window.game.scene.getScene('GameScene')` 経由で内部 state を直接読み書きしている。

- **書き込み**: `scene.heroState = { ...scene.heroState, position: ..., attackTargetId: ... }` でヒーローの位置・攻撃対象を設定
- **読み取り**: `scene.enemyState.hp`, `scene.heroState.type`, `scene.projectiles.length` 等

これにより GameScene のリファクタリング (#76) で 12/18 テストが壊れた。現在はゲッター/セッターで互換を保っている。

## Goals / Non-Goals

**Goals:**
- テスト入力をキーボード/マウスのみに統一（内部 state 書き換え廃止）
- GameScene のテスト用ゲッター/セッター (heroState, enemyState, projectiles) を削除
- 検証用の読み取り専用テスト API を dev ビルド限定で提供
- CI (headless Chromium) で安定動作を維持

**Non-Goals:**
- `game-launch.spec.ts`, `map-rendering.spec.ts` の変更（既にブラックボックス的）
- スクリーンショット比較テストの拡充
- テストケース追加によるカバレッジ拡大

## Decisions

### Decision 1: テスト入力は Playwright のキーボード/マウス API のみ

**選択**: `page.keyboard`, `page.mouse` を使用。内部 state の直接書き換えを廃止。

**理由**: ユーザーが実際に操作する方法でテストすることで、入力ハンドラ → ドメインロジック → レンダリングの統合パスを検証できる。

**代替案**:
- `page.evaluate()` で state セット → 今と同じ問題を繰り返す
- Phaser の input event をプログラム的に発火 → Phaser 内部 API への結合度が高い

### Decision 2: 読み取り専用テスト API (`window.__test__`) を提供

**選択**: GameScene の `create()` 時に `window.__test__` オブジェクトを登録。読み取り専用のクエリメソッドを公開。

```typescript
// dev ビルドのみ
window.__test__ = {
  getHeroType: () => string,
  getHeroPosition: () => { x, y },
  getHeroHp: () => { current, max },
  getEnemyHp: () => { current, max },
  getEnemyPosition: () => { x, y },
  getProjectileCount: () => number,
}
```

**理由**: Canvas ゲームでは DOM がないため、ピクセルから HP 値やヒーロータイプを判定するのは非現実的。最小限の読み取り API は「テスト可観測性」を提供する現実的なアプローチ。

**代替案**:
- スクリーンショット比較のみ → 数値の正確な検証不可、環境差で flaky になりやすい
- DOM overlay で HP 表示 → ゲーム仕様を変えてしまう
- GameScene ゲッターを残す → 内部構造への結合が残り、リファクタリング耐性がない

**ゲッターとの違い**: ゲッターは `HeroState` オブジェクト全体を返すため内部構造に結合する。`__test__` API はプリミティブ値のみ返すため、内部構造が変わっても API の契約は安定する。

### Decision 3: テスト API は独立モジュール `src/test/e2eTestApi.ts` に配置

**選択**: GameScene 本体にテストコードを書かず、別モジュールで `registerTestApi(entityManager, combatManager)` 関数を提供。

**理由**: テスト支援コードをプロダクションコードから分離。GameScene は `import.meta.env.DEV` ガードで呼び出すだけ。

### Decision 4: 攻撃テストのアプローチ変更

**選択**: WASD でヒーローを敵の近くに移動 → 右クリックで攻撃。`waitForFunction` で HP 変化を待つ。

**現状の問題**: 敵は固定位置だが初期位置からの距離があり、移動に時間がかかる。

**対策**: EntityManager の初期配置で敵を近めに配置しているため (200px 離れ)、WASD 移動 + 右クリックで十分到達可能。`waitForFunction` でポーリング的に HP 変化を検知すれば `waitForTimeout` の固定待ちも削減できる。

## Risks / Trade-offs

**[Risk] 攻撃テストの不安定化** → `waitForFunction` で条件ベースの待機を使い、固定 `waitForTimeout` を最小化。Playwright の retry (CI: 2 回) でカバー。

**[Risk] `__test__` API の prod 混入** → `import.meta.env.DEV` ガード + Vite の tree-shaking で prod ビルドから除外される。

**[Trade-off] 完全なブラックボックスではない** → `window.__test__` による読み取りは「グレーボックス」テスト。Canvas ゲームではこれが現実的な最善策。
