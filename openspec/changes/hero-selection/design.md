## Context

現在 `GameRoom.onJoin()` で heroType が `'BLADE'` にハードコードされている。`HeroType` 型 (`'BLADE' | 'BOLT' | 'AURA'`) と `HERO_DEFINITIONS` は `@shared/types` と `@shared/entities/Hero` に既に定義済み。LobbyScene は `menu → connecting → waiting → starting` のステートマシンで動作し、`NetworkClient.connect()` → `joinOrCreate()` でサーバーに接続する。

## Goals / Non-Goals

**Goals:**
- ロビー UI でヒーロー選択を可能にする
- 選択された heroType を joinOrCreate options で送信する
- サーバー側で heroType をバリデーション・適用する

**Non-Goals:**
- ゲーム中のヒーロー切り替え
- ヒーローのロック/アンロック
- 重複ヒーロー禁止
- 選択タイムアウト

## Decisions

### D1: ヒーロー選択のタイミング — 接続前 vs 接続後

**選択: 接続前（ロビーの menu 状態で選択 → connect 時に送信）**

- **代替案 A**: 接続後の waiting 状態で選択し、メッセージで通知 → サーバー側でヒーロー再作成が必要になり複雑
- **代替案 B**: 接続前に選択して join options で送信 → Colyseus の `joinOrCreate(room, options)` の標準パターン。サーバーは `onJoin(client, options)` で受け取れる

join options はシンプルで、ヒーローの再作成ロジックが不要。Colyseus の設計に沿っている。

### D2: UI レイアウト — menu 画面にヒーロー選択を統合

ヒーロー選択ボタンを LobbyScene の menu 状態に配置する。「Online Battle」ボタンの上にヒーロー選択を表示し、選択してからオンラインバトルを開始する流れにする。

```
  SIMOBA
  2v2 Micro Arena

  [ BLADE ] [ BOLT ] [ AURA ]   ← ヒーロー選択（横並び）

  [   Online Battle   ]
  [   Offline Play     ]
```

選択状態は `BUTTON_HOVER_COLOR` (#74b9ff) でハイライト。非選択はデフォルトの `BUTTON_COLOR` (#636e72)。

### D3: NetworkClient.connect — options パラメータ追加

```typescript
// Before
async connect(roomName: string = 'game'): Promise<Room>

// After
async connect(roomName: string = 'game', options?: Record<string, unknown>): Promise<Room>
```

`joinOrCreate(roomName, options)` に options をそのまま渡す。既存の呼び出し元は options なしで動作する（後方互換）。

### D4: サーバー側バリデーション

`GameRoom.onJoin(client, options)` で `options.heroType` を取得し、`HERO_DEFINITIONS` のキーに存在するかチェック。無効値は BLADE にフォールバック。

```typescript
const heroType: HeroType = isValidHeroType(options?.heroType)
  ? options.heroType
  : 'BLADE'
```

`isValidHeroType` は `heroType in HERO_DEFINITIONS` で判定する。

### D5: オフラインモードへの影響

オフラインモードはヒーロー選択の影響を受けない。`LobbyScene.startOffline()` は従来通り `OfflineGameMode` を作成し、GameScene 内の既存ロジック（デフォルト BLADE）がそのまま機能する。将来的にオフラインでもヒーロー選択を追加する場合は別 Issue とする。

## Risks / Trade-offs

- **[Risk] ヒーロー選択 UI がモバイルで押しにくい** → 現時点ではデスクトップ優先。ボタンサイズは既存の Online/Offline ボタンと同等にする
- **[Risk] 既存テストへの影響** → `GameRoom.onJoin` テストが heroType=BLADE を前提としている。options パラメータを追加してテストも更新する
- **[Trade-off] 接続前選択のため、他プレイヤーの選択は見えない** → Non-goal（重複禁止なし）なので問題ない

## Open Questions

(なし — スコープが明確)
