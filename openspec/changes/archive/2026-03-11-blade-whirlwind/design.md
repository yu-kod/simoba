## Context

BLADE の火力ビルド Depth 3 スキル「Whirlwind」を実装する。既存の zone システム（`aura-slow-field`, `bolt-trap`）は固定座標のゾーンだが、Whirlwind はキャスター中心に追従する持続ダメージゾーンが必要。

現在の zone システム:
- `ZoneSchema` — 固定座標 (x, y)、`remainingDuration` で自動消滅
- `ServerZoneSystem.tickZones()` — tick ごとに status effect を付与（ダメージは `triggerDamage` による一回型のみ）
- `ZoneRenderer` — `skillId` → `ZONE_VISUALS` で色・透過度を決定

## Goals / Non-Goals

**Goals:**
- Whirlwind をキャスター追従型の持続ダメージゾーンとして実装する
- 既存の zone インフラ（Schema, tickZones, ZoneRenderer）を拡張して再利用する
- 発動中のキャスター移動速度低下で操作判断を要求する

**Non-Goals:**
- タレントによる Whirlwind 強化（`blade-cyclone` の range +20% 等）の実装 — 別チケット
- Whirlwind 発動中の通常攻撃無効化 — Phase 1 では許可する（シンプルさ優先）
- 新しいチャネリング/詠唱システムの導入 — status effect + zone の組み合わせで実現する

## Decisions

### 1. 既存 zone システムの拡張で実装する

**選択:** `ZoneSchema` に `tickDamage`（float32）と `followHeroId`（string）を追加

**理由:** Whirlwind の本質は「移動するダメージゾーン」。zone の tick ループ内で座標更新 + ダメージ判定を行えば、新しいシステムを作る必要がない。`followHeroId` が空文字なら従来通り固定座標、設定されていればヒーロー追従。

**代替案:** 専用の `WhirlwindSystem` を新設 → zone と重複するコードが増え、ZoneRenderer も二重管理になる

### 2. tick ダメージは ServerZoneSystem 内で直接適用する

**選択:** `tickZones()` 内で `tickDamage > 0` の場合、範囲内の敵に毎 tick ダメージを適用する。ダメージ間隔は `tickInterval`（float32）で制御し、zone 内にタイマー `tickTimer` を持つ。

**理由:** 毎フレーム（16.6ms）ダメージだと DPS 計算が不直感的で、クライアントのダメージ表示も溢れる。0.5 秒間隔でまとめてダメージを与えることで、明確な tick 感を出す。

**代替案:** status effect の damage-over-time → 既存の buff/debuff は数値バフのみ対応、ダメージ適用には別のメカニズムが必要で複雑化する

### 3. 発動中の移動速度低下は self-buff で実現する

**選択:** Whirlwind の effect handler 実行時に、キャスターに speed debuff の status effect を付与する（duration = zone の duration と一致）。

**理由:** 既存の `StatusEffectSystem.tickBuffs()` が自動的に speed 修正を適用・期限切れ解除する。zone と同時に消えるので同期の心配がない。

### 4. SkillDefinition は `zone` effectType を再利用する

**選択:** `ZoneEffectParams` に optional フィールド `tickDamage`, `followCaster`, `tickInterval` を追加。Whirlwind は `targeting: 'self'` + `effectType: 'zone'` で定義。

**理由:** zone handler で `followCaster: true` の場合に `targetPosition` をキャスター座標にし、`followHeroId` を設定するだけ。新しい effectType を作る必要がない。

### 5. パラメータ値

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| cooldown | 12s | Depth 3 スキルとして中程度 |
| zoneRadius | 120px | BLADE の近接レンジより少し広い |
| zoneDuration | 3s | 短い持続で回転切りの感覚 |
| tickDamage | 30 | 0.5s 間隔 → 6 tick → 合計 180 ダメージ |
| tickInterval | 0.5s | 体感で明確な tick |
| 移動速度低下 | -40 | 速度 debuff（回転中は鈍足） |
| followCaster | true | キャスター追従 |
| zoneEffect | speed -40 (self debuff) | 既存の zone effect 構造を活用 |

## Risks / Trade-offs

- **[追従ゾーンのネットワーク帯域]** ゾーンの x, y が毎 tick 変更されるため、state patch が増える → 1 つのゾーンの座標更新程度なら許容範囲。複数ヒーローが同時に Whirlwind を使うケースでも 2v2 なので最大 2 つ
- **[既存ゾーンへの影響]** `tickDamage`, `followHeroId` のデフォルト値は 0/空文字 → 既存の `aura-slow-field`, `bolt-trap` は影響なし
- **[キャスター死亡時のゾーン]** キャスターが Whirlwind 中に死亡した場合、ゾーンも即座に消す必要がある → `tickZones` 内で `followHeroId` のヒーローが dead なら zone を削除する
