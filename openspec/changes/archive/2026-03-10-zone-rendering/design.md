## Context

Zone スキル（aura-slow-field, bolt-trap）はサーバーで稼働中だが、クライアント描画がない。既存の ProjectileRenderer + PROJECTILE_VISUALS パターンが確立されており、同様のアプローチで ZoneRenderer を構築する。

## Goals / Non-Goals

**Goals:**
- `ZONE_VISUALS` レジストリでスキルごとの色・スタイルをデータ駆動管理
- 新スキル追加時はレジストリにエントリ追加のみで描画対応
- 既存の ProjectileRenderer パターン（clear + redraw 毎フレーム）を踏襲
- Colyseus onAdd/onRemove による状態同期

**Non-Goals:**
- アニメーション（パルス、回転）
- フェードイン/フェードアウト
- 追従型ゾーン（Sanctuary 等）
- トラップの敵非表示ロジック

## Decisions

### D1: スキルIDベースの色決定（チーム色ではない）

ゾーンの色はスキルIDで決定する。チーム色にすると敵味方のゾーンが同じスキルでも異なる色になり、スキルの識別性が下がる。

**代替案:** チーム色ベース → スキルの視覚的一貫性が失われるため不採用。

### D2: ZONE_VISUALS レジストリ（shared/ に配置）

`shared/zone/zoneVisuals.ts` に `ZONE_VISUALS` を定義。ProjectileVisuals と同パターン。

```typescript
export interface ZoneVisualDef {
  readonly color: number       // fill color (hex)
  readonly alpha: number       // fill alpha (0-1)
  readonly borderColor: number // stroke color
  readonly borderAlpha: number // stroke alpha
  readonly borderWidth: number // stroke width (px)
}

export const ZONE_VISUALS: Record<string, ZoneVisualDef> = {
  'aura-slow-field': { color: 0x9b59b6, alpha: 0.2, borderColor: 0x9b59b6, borderAlpha: 0.6, borderWidth: 2 },
  'bolt-trap':       { color: 0xf1c40f, alpha: 0.15, borderColor: 0xf1c40f, borderAlpha: 0.5, borderWidth: 1 },
}

export const DEFAULT_ZONE_VISUAL: ZoneVisualDef = {
  color: 0x95a5a6, alpha: 0.2, borderColor: 0x95a5a6, borderAlpha: 0.5, borderWidth: 1,
}
```

新スキル追加時は `ZONE_VISUALS` にエントリを足すだけ。将来的にアニメーション型（pulse, rotate 等）を追加する場合は `ZoneVisualDef` を discriminated union に拡張可能。

### D3: ZoneRenderer クラス（single Graphics パターン）

`src/scenes/effects/ZoneRenderer.ts` に ProjectileRenderer と同様の構造で実装。

- 1つの `Phaser.GameObjects.Graphics` を再利用
- 毎フレーム clear + redraw（ゾーン数は少ないため十分高速）
- depth は hero（10）より下、ground より上に設定（depth: 3）

### D4: ServerZoneState インターフェース + GameMode コールバック

`GameMode` に `onServerZoneAdd` / `onServerZoneRemove` を追加。ServerProjectileState と同パターン。

```typescript
export interface ServerZoneState {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly radius: number
  readonly skillId: string  // ZONE_VISUALS のキー
}
```

zone は位置が変わらないため interpolation buffer は不要。onAdd で追加、onRemove で削除するだけ。

### D5: OnlineGameMode の同期パターン

projectile と異なり zone は位置変更がないため、batching（queueMicrotask）は不要。onAdd 時に ServerZoneState を構築してコールバック発火、onRemove 時に id でコールバック発火。

## Risks / Trade-offs

- **[Risk] ゾーン数が急増した場合の描画コスト** → 現実的には同時ゾーン数は2-4程度。問題が出れば dirty flag パターンに切り替え可能。
- **[Risk] ZoneVisualDef が将来複雑化** → 現時点では fill + stroke のみでシンプルに保つ。アニメーション追加時に discriminated union 拡張で対応。
- **[Trade-off] チーム色なし** → 敵味方のゾーン区別がつきにくい可能性があるが、スキル識別を優先。将来的にボーダーの点線/実線でフレンドリー表示を追加可能。
