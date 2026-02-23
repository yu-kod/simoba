## Context

ヒーロー選択が LobbyScene に移動し、デバッグキー (1-2-3) が削除された。E2E テストはまだ旧フローに依存しており 4 件壊れている。加えて `startOffline()` が `selectedHeroType` を GameScene に渡さないバグがある。

現在のデータフロー:
```
LobbyScene.selectedHeroType → startOffline() → GameScene.init({ gameMode })
                                                  ↓
                                            heroType = 'BLADE' (ハードコード)
```

修正後:
```
LobbyScene.selectedHeroType → startOffline() → GameScene.init({ gameMode, heroType })
                                                  ↓
                                            heroType = data.heroType ?? 'BLADE'
```

## Goals / Non-Goals

**Goals:**
- 壊れた E2E テスト 4 件を修正し、全テストを PASS にする
- ロビーでのヒーロー選択を E2E テストでカバーする
- `startOffline()` → `GameScene` のヒーロータイプ受け渡しバグを修正する

**Non-Goals:**
- オンラインモードのテスト
- LobbyScene の UI/UX 変更
- 新規ヒーローの追加

## Decisions

### 1. `debug-hero-switch.spec.ts` → `hero-selection.spec.ts` に置換

デバッグキーが削除されたため、テスト対象自体が消失。ファイルごと削除し、ロビーのヒーロー選択をテストする新ファイル `hero-selection.spec.ts` を作成する。

テスト内容:
- デフォルトで BLADE が選択されている
- BOLT ボタンクリックで BOLT に切り替わる
- AURA ボタンクリックで AURA に切り替わる

### 2. E2E ヘルパーに `selectHeroInLobby()` を追加

ヒーロー選択ボタンのスクリーン座標を計算してクリックするユーティリティ関数:
```typescript
selectHeroInLobby(page: Page, heroType: 'BLADE' | 'BOLT' | 'AURA'): Promise<void>
```

ボタン座標はロビーレイアウトから計算:
- y = 300 (固定)
- x = 中央配置 (HERO_BUTTON_WIDTH=96, GAP=12, 3ボタン)
  - BLADE: x = 532, BOLT: x = 640, AURA: x = 748

### 3. `startOfflineGame(page, heroType?)` に heroType オプション引数追加

`heroType` が指定された場合、Offline Play クリック前に `selectHeroInLobby()` を呼ぶ。

### 4. ボタン座標定数の修正

`helpers.ts` の `OFFLINE_PLAY_BUTTON = { x: 640, y: 420 }` は実際のレイアウト y=460 と不一致。修正する。

### 5. `LobbyScene.startOffline()` に heroType 渡しを追加

```typescript
private startOffline(): void {
  const gameMode: GameMode = new OfflineGameMode()
  this.scene.start('GameScene', { gameMode, heroType: this.selectedHeroType })
}
```

### 6. `GameScene.init()` に heroType 受け取りを追加

```typescript
init(data?: { gameMode?: GameMode; localTeam?: Team; localPosition?: Position; heroType?: HeroType }): void {
  ...
  this.localHeroType = data?.heroType ?? 'BLADE'
}
```

`create()` でのヒーローエンティティ生成時に `this.localHeroType` を使う。

## Risks / Trade-offs

- **E2E のヒーローボタン座標ハードコード** — LobbyScene のレイアウト変更で壊れる。ただしこれは既存のボタン座標方式と同じトレードオフで、Canvas ベースのため避けられない。
- **`OFFLINE_PLAY_BUTTON.y` の修正** — 既存 E2E テストに影響。ただし現在 y=420 でも動作しているため、ボタンの判定範囲内に収まっている可能性あり。念のため修正する。
