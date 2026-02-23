## Context

ワールド空間 (3200x720) とカメラシステムは #44 で実装済み。現在の `GameScene.create()` は単色背景 (`0x2d3436`) のみ描画している。ここにマップ要素（レーン、ベース、タワー、ブッシュ、ボス地点）を静的ビジュアルとして追加する。

既存アーキテクチャ:
- 定数: `src/domain/constants.ts`（ゲームルール定数）
- 描画: `GameScene.create()` 内で `Phaser.GameObjects.Graphics` を使用
- MVC パターン: Model（domain 層）/ View（Phaser Scene）

## Goals / Non-Goals

**Goals:**
- マップレイアウト定数を domain 層に定義する
- 全マップ要素をジオメトリック描画で表示する
- 描画処理を GameScene から分離して専用関数にする
- 定数変更だけでレイアウト調整が可能な設計にする

**Non-Goals:**
- ゲームロジック（HP、攻撃、視界遮蔽）
- エンティティの当たり判定
- 動的な状態管理（破壊、アニメーション）

## Decisions

### 1. マップ定数の構造

マップ要素の座標・サイズを `src/domain/mapLayout.ts` に分離する。`constants.ts` はスカラー値に留め、マップ定数はオブジェクト構造で管理する。

```typescript
// src/domain/mapLayout.ts
export const MAP_LAYOUT = {
  lane: { y, height },
  bases: { blue: { x, y, width, height }, red: { ... } },
  towers: { blue: { x, y, radius }, red: { ... } },
  bushes: [{ x, y, width, height }, ...],
  bossSpawn: { x, y },
}
```

**理由:** 定数が増えるため `constants.ts` に全部入れるとファイルが肥大化する。マップレイアウトは関連性の高い定数群なので1ファイルにまとめる方が保守しやすい。

**代替案:** `constants.ts` に追記 → 将来的にファイルが大きくなりすぎる。

### 2. 描画処理の分離

`src/scenes/mapRenderer.ts` に描画関数を切り出す。GameScene からは `renderMap(scene)` を呼ぶだけにする。

```typescript
// src/scenes/mapRenderer.ts
export function renderMap(scene: Phaser.Scene): void { ... }
```

**理由:** GameScene.create() にマップ描画コードを全て書くと 100 行以上になり、ファイルが肥大化する。描画関数を分離することで GameScene の責務を軽くする。

**代替案:** GameScene に直接記述 → 可読性が下がり、将来のマップ変更が困難。

### 3. マップレイアウトの配置

ワールド (3200x720) の水平シングルレーン配置:

```
[Blue Base] --- [Blue Tower] --- [Bush] --- [Boss] --- [Bush] --- [Red Tower] --- [Red Base]
  x=0                                     x=1600                                    x=3200
```

- **レーン:** ワールド中央の帯状エリア（y 中央、高さ約 200px）
- **ベース:** 左右端の大きめ矩形
- **タワー:** ベースとレーン中央の間に配置、円形
- **ブッシュ:** レーン上下端に 2 箇所（左右対称）
- **ボス地点:** ワールド中央 (x=1600) にマーカー

### 4. カラーパレット

チームカラーとマップ要素の色を定数化する。

| 要素 | 色 | 説明 |
|------|----|------|
| 背景 | `0x2d3436` | 既存のダークグレー |
| レーン | `0x636e72` | 背景より明るいグレー |
| Blue ベース | `0x2980b9` | 青系 |
| Red ベース | `0xc0392b` | 赤系 |
| タワー | チーム色の明るめ | ベースより明るく |
| ブッシュ | `0x27ae60` | 緑系 |
| ボス地点 | `0xf39c12` | 黄/金系（警告色） |

## Risks / Trade-offs

- **[座標のハードコーディング]** → 全座標を `mapLayout.ts` の定数に集約して変更容易にする
- **[描画順序の依存]** → 背景 → レーン → ベース → タワー → ブッシュ → ボスの順で描画（後が上に重なる）。Phaser の depth を使えば後から調整可能
- **[将来のリファクタ]** → ストラクチャーシステム (#20) 実装時にベース・タワーの描画がエンティティ管理に移行する可能性がある。定数と描画関数を分離しておくことで移行しやすくする
