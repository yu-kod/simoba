## Context

zone システム（ZoneSchema + ServerZoneSystem + zoneEffectHandler）は Slow Field で導入済み。ゾーンは `tickZones` で毎フレームティックされ、範囲内のヒーローに StatusEffect を適用する。

Trap は「トリガー式」ゾーン — 敵が踏んだ瞬間に1回だけダメージ+デバフを適用し、即座に消滅する。

## Goals / Non-Goals

**Goals:**
- ZoneSchema と tickZones を拡張してトリガー式ゾーンをサポートする
- `bolt-trap` スキル定義を追加する

**Non-Goals:**
- 設置数上限
- 罠のステルス表示
- クライアント描画

## Decisions

### Decision 1: ZoneSchema にトリガーフィールドを追加

**選択:** `ZoneSchema` に `triggerDamage: float32`（トリガー時ダメージ）と `triggerOnce: boolean`（1回トリガーで消滅）を追加する。

**理由:**
- 既存の ZoneSchema を拡張するだけで済む（新しい Schema 不要）
- `triggerOnce: false` + `triggerDamage: 0` なら既存の Slow Field と同じ動作（後方互換）
- 将来の設置型スキル（地雷型、反復ダメージゾーン等）にも対応可能

### Decision 2: tickZones 内でトリガー判定

**選択:** `tickZones` の既存ループ内で、トリガー式ゾーンの処理を追加する。`triggerDamage > 0` かつ敵が範囲内にいる場合、ダメージを適用し、`triggerOnce` なら即座に削除リストに追加する。

**理由:**
- 別システムを作るほどの複雑さがない
- 距離判定は既に行われている箇所に追加するだけ

### Decision 3: Trap のデバフは通常の StatusEffect

**選択:** Trap のスロー効果は `zoneEffect` の既存の仕組みを使う。ただし `triggerOnce` なのでゾーンは即消滅 → デバフの `remainingDuration` はゾーンの ZONE_EFFECT_DURATION (0.1s) ではなく、スキル定義に `zoneEffect.duration` として明示する。

**理由:**
- 持続ゾーン（Slow Field）は毎フレーム refresh するので短い duration でよいが、トリガー式はゾーン消滅後もデバフが残る必要がある
- `ZoneEffectParams.zoneEffect` に `duration` を追加して、トリガー式ゾーンではこの値を使う

### Decision 4: lastAttackerSessionId をセット

**選択:** Trap ダメージで `lastAttackerSessionId` をキャスターの ID にセットする。

**理由:** キル XP 帰属。AoE と同じパターン。

## Risks / Trade-offs

- **[後方互換]** `triggerDamage` と `triggerOnce` のデフォルト値は `0` と `false` なので、既存の Slow Field に影響なし
- **[デバフ duration]** トリガー式では `zoneEffect.duration` を使い、持続式では `ZONE_EFFECT_DURATION` を使う → `duration` が未定義なら ZONE_EFFECT_DURATION にフォールバック
