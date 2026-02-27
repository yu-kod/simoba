## Context

現在のGameSceneはエンティティ上のHPバーとリスポーンタイマーのみ表示している。スキル状態・レベル・XPなどの情報はプレイヤーに一切表示されていない。

既存のUI実装パターン:
- `HpBarRenderer` — Phaser Graphics でフレーム毎にclear+redraw
- `computeHpBar` — 純粋関数でレイアウト計算
- `createText` — サンセリフフォント統一ヘルパー
- `setScrollFactor(0)` + `setDepth(1000+)` — カメラ固定UI

カメラは2xズーム（GAME_WIDTH=2560, BASE_WIDTH=1280）。HUD要素のフォントサイズ・座標はズーム後の値で指定する必要がある。

## Goals / Non-Goals

**Goals:**
- Dota 2/LoL風の画面下部中央スキルバーを実装
- スキルスロット（アクティブ/パッシブ/空）の3状態を表示
- レベルバッジ + XPプログレスバーを表示
- HP/MaxHP数値バーを表示
- データ駆動設計でスロット構成を差し替え可能にする

**Non-Goals:**
- スキル効果の実装（表示のみ）
- タレントツリー選択UI
- ステータスパネル（AD, Speed等）
- レベリングロジック（XP閾値計算）

## Decisions

### 1. HUDレイアウト（Dota/LoL参考）

```
┌─────────────────────────────────────────────────────────┐
│                    Game World                           │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              ┌──┬───┬───┬───┬──────┐                   │
│              │Lv│ Q │ ○ │   │XP Bar│                   │
│              │3 │   │pas│emp│██░░░░│                   │
│              ├──┴───┴───┴───┴──────┤                   │
│              │   650 / 650  HP Bar  │                   │
│              └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

- **スキルバー**: 画面下部中央に配置
- **レベルバッジ**: スキルバー左端に丸型で表示
- **HP数値バー**: スキルバーの下に配置
- **XPプログレスバー**: スキルバー右側に横バーで表示

**理由**: Dota 2/LoLの標準的な下部中央配置。プレイヤーの視線移動が最小になるレイアウト。

### 2. スキルスロットのデータモデル

```typescript
type SkillSlotType = 'active' | 'passive' | 'empty'

interface SkillSlotConfig {
  readonly type: SkillSlotType
  readonly key?: string           // 'Q', 'E', 'R' etc. (activeのみ)
  readonly name: string           // スキル名（表示用）
  readonly iconShape?: string     // ジオメトリック形状の識別子
  readonly cooldownMax?: number   // 最大CD秒数（activeのみ）
}
```

スロット配列で定義し、タレントツリー実装時に動的に差し替え可能:
```typescript
const DEBUG_SKILL_SLOTS: SkillSlotConfig[] = [
  { type: 'active', key: 'Q', name: 'Skill 1', cooldownMax: 8 },
  { type: 'passive', name: 'Passive 1' },
  { type: 'empty', name: '' },
]
```

**理由**: 配列ベースにすることで、スロット数の増減・順序変更が容易。タレントツリーからスキルを取得した際に配列を更新するだけで済む。

### 3. HUDコンポーネント分割

| ファイル | 責務 |
|---------|------|
| `src/scenes/ui/GameHud.ts` | HUD全体のコンテナ。子コンポーネントの生成・配置・更新 |
| `src/scenes/ui/SkillSlotRenderer.ts` | 個別スキルスロットの描画（アクティブ/パッシブ/空の3状態） |
| `src/scenes/ui/LevelBadge.ts` | レベル数値の丸型バッジ描画 |
| `src/scenes/ui/XpBar.ts` | XPプログレスバー描画 |
| `src/scenes/ui/HudHpBar.ts` | HUD用HP数値バー描画 |
| `src/scenes/ui/uiScale.ts` | カメラズーム補正ユーティリティ（全フィールド外UIで再利用） |
| `src/domain/ui/hudLayout.ts` | HUDレイアウト計算の純粋関数 |

**理由**: 既存のRenderer分割パターン（HeroRenderer, MinionRenderer等）に合わせた設計。各コンポーネントが独立してテスト可能。

### 4. カメラズーム対応 — UIスケールユーティリティ

カメラズームはフィールド外のUI全般に影響するため、ズーム補正ロジックを汎用ユーティリティとして切り出す。HUDだけでなく、今後のタレントツリーUI・ステータスパネル・設定画面等でも再利用する前提。

**ファイル:** `src/scenes/ui/uiScale.ts`

```typescript
/** カメラズームに影響されないUI要素のサイズ・座標を計算するユーティリティ */
export function createUiScale(cameraZoom: number) {
  return {
    /** 意図したピクセルサイズを、ズーム補正後の実値に変換 */
    size: (intended: number) => intended / cameraZoom,
    /** 意図したフォントサイズを文字列で返す（例: '12px'） */
    fontSize: (intended: number) => `${intended / cameraZoom}px`,
    /** 現在のズーム値 */
    zoom: cameraZoom,
  }
}
export type UiScale = ReturnType<typeof createUiScale>
```

- 各UIコンポーネントは `UiScale` を受け取り、`scale.size(64)`, `scale.fontSize(24)` で直感的に指定
- ズーム値の変更時は `createUiScale` の引数が変わるだけで、全コンポーネント自動対応
- HUD Depth: 1100（ゲームワールドの上、リスポーンテキストの上、マッチ終了の下）

**理由**: ズーム補正はフィールド外UI共通の関心事。ユーティリティ化で今後のUI実装コストを下げる。

### 5. 描画方式: Phaser Graphics + Text

- スロット背景・クールダウンオーバーレイ → `Phaser.GameObjects.Graphics`（フレーム毎にclear+redraw）
- テキスト（キーラベル、レベル数値、HP数値等）→ `Phaser.GameObjects.Text`（`createText`使用）
- 全体を `Phaser.GameObjects.Container` でグルーピング

**理由**: 既存のHpBarRendererと同じパターン。画像アセット不使用のジオメトリックスタイルに合致。

### 6. 更新頻度

- HP/クールダウン → 毎フレーム更新（GameScene.update内でHUD.update呼び出し）
- レベル/XP → 値変更時のみ更新（前回値と比較）
- スロット構成 → 変更時のみ再構築（タレント取得時）

**理由**: 毎フレームのGraphics再描画は既存パターンで問題なし。テキスト更新は値変更時のみで負荷軽減。

## Risks / Trade-offs

- **[スキルクールダウン未実装]** → 現時点ではHeroSchema.attackCooldownのみ存在。スキル個別CDはサーバー実装待ち。HUDは仮のCD値（0固定）を表示し、サーバー対応時に接続する設計にする
- **[レベルフィールド未同期]** → HeroSchemaにlevelフィールドは未追加。HUDはHeroState.level（クライアント側、初期値1固定）を表示。レベリング実装時にサーバー同期される
- **[ズーム変更時のレイアウト崩れ]** → CAMERA_ZOOMが変更された場合、HUDの座標・フォントサイズの再調整が必要。BASE_WIDTHベースの相対座標で軽減
