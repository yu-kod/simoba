## Backend

（サーバー変更なし）

## Shared

- [x] `shared/zone/zoneVisuals.ts` — `ZoneVisualDef` 型と `ZONE_VISUALS` レジストリ、`DEFAULT_ZONE_VISUAL` を作成
- [x] `shared/zone/zoneVisuals.ts` — `aura-slow-field`（紫系）と `bolt-trap`（黄系）のエントリを追加

## Frontend

- [x] `src/network/GameMode.ts` — `ServerZoneState` インターフェースを追加
- [x] `src/network/GameMode.ts` — `GameMode` に `onServerZoneAdd` / `onServerZoneRemove` コールバック定義を追加
- [x] `src/network/OnlineGameMode.ts` — `zones` の onAdd/onRemove リスナー実装、`ServerZoneState` への変換とコールバック発火
- [x] `src/scenes/effects/ZoneRenderer.ts` — ZoneRenderer クラスを新規作成（single Graphics, clear+redraw パターン、depth: 3）
- [x] `src/scenes/GameScene.ts` — ZoneRenderer のインスタンス生成、zone コールバック購読、update ループで `zoneRenderer.draw()` 呼び出し

## Tests

- [x] `shared/zone/zoneVisuals.test.ts` — ZONE_VISUALS の定義テスト（既知スキルの色、未知スキルのフォールバック）
- [x] `src/scenes/effects/__tests__/ZoneRenderer.test.ts` — ZoneRenderer のユニットテスト（描画呼び出し、追加/削除、空状態）
