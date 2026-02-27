## Context

HUD にレベルバッジ・XP パイチャートが実装済みだが、サーバー→クライアントの同期パイプラインが欠落しているため常に Lv1/XP0 のまま。サーバーの `HeroSchema` には `xp` フィールドがあり、`ServerMinionSystem.processMinionDeaths` で `hero.xp += xpEach` が実行されているが、`level` フィールドが存在せず、レベルアップ判定もない。クライアント側は `HeroState` に `level`, `xp` フィールドが定義済みだが、`ServerHeroState` / `OnlineGameMode` でこれらを受け取っていない。

## Goals / Non-Goals

**Goals:**
- サーバー側でレベルアップ判定 + タレントポイント付与 + ステータス成長を行う
- クライアント側で `xp`, `level`, `talentPoints` を同期し HUD に反映する
- レベルアップ判定を純粋関数として実装しテスト容易にする

**Non-Goals:**
- タレント選択 UI・タレント取得ロジック（別 Issue）
- レベルアップ演出・エフェクト
- レベル連動リスポーンタイマー (#84)

## Decisions

### D1: レベルアップ判定は `shared/` の純粋関数

レベルアップ判定ロジックを `shared/systems/levelUp.ts` に純粋関数として実装する。

```typescript
interface LevelUpResult {
  readonly newLevel: number
  readonly levelsGained: number
}
function computeLevelUp(currentLevel: number, xp: number): LevelUpResult
```

**理由:** `XP_THRESHOLDS` は `shared/constants.ts` に既にあり、判定ロジックはサーバー・クライアント双方で参照可能にしておくことで、将来のクライアント予測やテストが容易になる。Colyseus Schema への書き込みとロジックを分離する設計原則に沿う。

**代替案:** `ServerMinionSystem` 内にインライン実装 → テスト性が低く、責務が混在するため不採用。

### D2: ステータス成長は `ServerMinionSystem.processMinionDeaths` 内で XP 付与直後に適用

XP 加算 → `computeLevelUp` → レベルが上がった場合のみ `HeroSchema` の各ステータスフィールドを更新する。

```
hero.xp += xpEach
const { newLevel, levelsGained } = computeLevelUp(hero.level, hero.xp)
if (levelsGained > 0) {
  hero.level = newLevel
  hero.talentPoints += levelsGained
  // growth 適用: base + growth * (newLevel - 1) で再計算
  applyStatsGrowth(hero, definition, newLevel)
}
```

**理由:** XP 加算とレベルアップが同一 tick で処理されるため、中間状態がクライアントに同期されない。Colyseus は tick 末の state patch でまとめて送信するため、XP 変化 → level 変化 → stats 変化が1パッチで届く。

### D3: ステータス成長関数 `applyStatsGrowth` でベース値から再計算

レベルアップ時のステータス更新は `base + growth * (level - 1)` で再計算する方式。差分加算（`+= growth * levelsGained`）ではなく、常にベースから計算し直す。

```typescript
function applyStatsGrowth(hero: HeroSchema, def: HeroDefinition, newLevel: number): void
```

**理由:** 差分加算は浮動小数点誤差が蓄積しやすく、バフ解除後の値復元にも問題がある。ベース再計算なら常に正確な値が保証される。`maxHp` 増加時は `hp` も同量増やして「レベルアップで即死」を防ぐ。

**代替案:** 差分加算 `+= growth * levelsGained` → 浮動小数点誤差リスクがあるため不採用。

### D4: `HeroSchema` に `level: uint8`, `talentPoints: uint8` を追加

`uint8` (0-255) で十分。`MAX_LEVEL=5`, タレントポイントは最大 4（Lv2-5 で各1）。既存の `xp: uint32` はそのまま利用。

### D5: クライアント同期は既存パターンを踏襲

`OnlineGameMode` のリスナーパターン（`$(hero).listen('field', schedule)`）に `xp`, `level`, `talentPoints` を追加。`notifyServerHeroUpdate` で `ServerHeroState` に含め、`applyServerHeroNonPositionState` で `HeroState` に反映する。既存の `HeroState` には `level`, `xp` が定義済みなので、`talentPoints` のみ追加が必要。

### D6: `HeroState` に `talentPoints` フィールドを追加

`shared/entities/Hero.ts` の `HeroState` に `talentPoints: number` を追加し、`createHeroState` で初期値 0 に設定する。

## Risks / Trade-offs

- **[複数レベルジャンプ]** → `computeLevelUp` が一括で最大レベルまで上げる設計で対応済み。テストで Lv1→Lv4 等のケースをカバーする。
- **[maxHp 増加と hp]** → レベルアップ時に hp も増加させるが、現在 hp が maxHp を超えないようクランプが必要。`Math.min(hero.hp + hpGain, newMaxHp)` で対処。
- **[Colyseus Schema 変更の後方互換]** → `level`, `talentPoints` はデフォルト値付きで追加するため、既存クライアントは 0/0 として受け取り問題なし。
