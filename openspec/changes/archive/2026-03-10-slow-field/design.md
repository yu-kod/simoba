## Context

スキルシステムは判別共用体 `SkillEffectParams` + `SkillEffectHandler` パターンで拡張される。既存の effectType は `dash`, `projectile`, `heal`, `buff`, `aoe` の5種。Slow Field は6番目の effectType `zone` を追加する。

ゾーンシステムはコードベースに存在しない。地面設置型の持続効果エリアを管理するためのスキーマ・システム・ハンドラーを新規に構築する必要がある。

既存の StatusEffect システム（`StatusEffectSchema` + `tickBuffs`）で移動速度デバフは管理できるが、ゾーンのライフサイクル管理（生成・ティック・消滅）は別の仕組みが必要。

## Goals / Non-Goals

**Goals:**
- `effectType: 'zone'` のハンドラーを実装し、ゾーンエンティティを生成する
- `ServerZoneSystem` でゾーンの毎フレームティック（範囲内判定 + 効果適用 + 持続時間管理）を処理する
- `aura-slow-field` スキル定義を追加する

**Non-Goals:**
- クライアント側のゾーン描画（別 Issue）
- キャスター追従型ゾーン（Sanctuary は別 Issue #217）
- ミニオン・タワーへのゾーン効果
- ゾーン同士の相互作用

## Decisions

### Decision 1: ZoneSchema を GameRoomState に追加

**選択:** `ZoneSchema` を新規作成し、`GameRoomState.zones` MapSchema で管理する。

**理由:**
- ゾーンはヒーローやプロジェクタイルと同様の独立エンティティ
- MapSchema に入れることでクライアントへの state sync が自動化される（将来の描画対応）
- ID ベースで管理することで複数ゾーンの同時存在をサポート

### Decision 2: zoneEffectHandler はゾーン生成のみ

**選択:** `zoneEffectHandler.execute()` はゾーンエンティティの生成のみを行う。効果適用は `ServerZoneSystem.tickZones()` が毎フレーム処理する。

**理由:**
- ハンドラーはスキル発動時に1回だけ呼ばれる（既存パターン）
- 持続効果は GameRoom の update ループで毎フレームティックする必要がある
- 生成と効果適用を分離することで責務が明確になる

### Decision 3: ゾーン内デバフは毎フレーム上書き、ゾーン外で即解除

**選択:** ゾーン内の敵には毎フレーム StatusEffect を上書き（refresh）する。ゾーンから出た場合、次の `tickBuffs` で自然消滅するよう `remainingDuration` を短い値（0.1s）に設定する。

**理由:**
- 既存の StatusEffect + tickBuffs の仕組みを活用できる
- ゾーン内にいる限りデバフが維持され、出たら即座に解除される動作を実現
- ゾーン専用の「退出検知」ロジックを別途作る必要がない
- remainingDuration を毎フレーム上書きするので、ゾーン内では期限切れにならない

### Decision 4: ゾーン ID は連番で生成

**選択:** ゾーン ID は `zone-{counter}` の連番。カウンターは GameRoom のインスタンスごとに管理する。

**理由:**
- ProjectileTracker と同様のパターン
- ゾーンは1ルーム内で同時に数個程度なので、シンプルな連番で十分

### Decision 5: ZoneEffectParams に効果情報を含める

**選択:** `ZoneEffectParams` に `zoneRadius`, `zoneDuration`, `zoneEffect`（適用する StatusEffect の情報）を含める。

```typescript
interface ZoneEffectParams {
  effectType: 'zone'
  zoneRadius: number
  zoneDuration: number
  zoneEffect: {
    buffType: string
    value: number
    isDebuff: boolean
    target: 'enemy' | 'ally' | 'all'
  }
}
```

**理由:**
- ゾーンの効果内容をスキル定義に集約できる
- 将来、回復ゾーンやバフゾーンなど異なる効果のゾーンを同じ型で定義できる
- `target` フィールドで敵/味方/全員のフィルタリングを汎用化

## Risks / Trade-offs

- **[パフォーマンス]** 毎フレーム全ヒーローとの距離チェック → ゾーン数・ヒーロー数が少ないので Phase 1 では問題なし
- **[デバフ即解除]** remainingDuration 0.1s での自然消滅は最大 0.1s の遅延あり → 60fps では 1-6 フレーム。体感上問題なし
- **[StatusEffect キー]** ゾーンのデバフは `zone-{id}` をキーにする → 複数ゾーンが重なった場合、各ゾーンが独立したデバフを適用し value が加算される
