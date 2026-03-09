## Context

AURAの Q スキル「Heal」を実装する。現在のスキルシステムは攻撃系（dash, projectile）のみで、味方を対象とするスキルが存在しない。Heal は味方または自分のHPを回復するシンプルな仕様で、新しい `heal` effectType と `ally` ターゲティングの最初の実装となる。

現在の実装:
- `SkillEffectParams` は `DashEffectParams | ProjectileEffectParams` の共用体
- `SkillEffectHandler` レジストリで effectType ごとにハンドラをディスパッチ
- `SkillExecutionContext` は `hero`, `casterId`, `direction`, `targetPosition`, `projectiles` を持つ
- `SkillTargeting` 型に `'ally'` は定義済みだが、サーバー側の ally ターゲット解決ロジックは未実装
- `CombatEntitySchema` に `applyDamage()` はあるが回復メソッドはない

## Goals / Non-Goals

**Goals:**
- `heal` effectType を追加し、ハンドラレジストリパターンを維持して拡張する
- `ally` ターゲティングのサーバー側解決ロジックを実装する（最寄り味方 or 自己回復）
- `SkillExecutionContext` に `heroes` MapSchema を追加し、味方検索を可能にする
- HP 回復は maxHp を超えないようクランプする

**Non-Goals:**
- Shield（E スキル）やその他バフ/デバフの実装
- 回復エフェクトのクライアント描画（Phase 1 では skillEvent の受信のみ）
- 回復量のレベルスケーリング（将来タレントツリーで対応）

## Decisions

### D1: HealEffectParams の設計

`HealEffectParams` を `{ effectType: 'heal', healAmount: number, range: number }` とする。

- `healAmount`: 回復量（固定値）
- `range`: 対象選択の射程（px）。ally ターゲティングで「クリック位置の最寄り味方」が射程内かの判定に使用。

**理由**: Dash（distance, duration, damage）、Projectile（speed, range, radius, ...）と同様に、effectType 固有のパラメータを持たせるパターンを踏襲。

### D2: ally ターゲット解決の実装箇所

`executeSkill` 内で、`targeting === 'ally'` の場合にクリック座標から最寄りの同チーム生存ヒーローを検索する。見つからない場合は自分自身を対象とする。

**理由**: ターゲット解決はスキル発動フロー（検証→ターゲット解決→エフェクト実行→CD設定）の一部であり、`executeSkill` に属する。エフェクトハンドラは「対象が確定した後の処理」に専念する。

**代替案**: エフェクトハンドラ内でターゲット解決 → 責務が混在するため却下。

### D3: SkillExecutionContext の拡張

`heroes: MapSchema<HeroSchema>` を `SkillExecutionContext` に追加する。`targetHero` フィールドも追加し、ally ターゲティングで解決されたヒーロー参照を渡す。

```typescript
export interface SkillExecutionContext {
  readonly hero: HeroSchema
  readonly casterId: string
  readonly direction: { readonly x: number; readonly y: number }
  readonly targetPosition: { readonly x: number; readonly y: number }
  readonly projectiles: MapSchema<ProjectileSchema>
  readonly heroes: MapSchema<HeroSchema>
  readonly targetHero?: HeroSchema  // ally ターゲティングで解決された対象
}
```

**理由**: `heroes` は将来の味方対象スキル（Shield, Haste 等）でも再利用される。`targetHero` は解決済みターゲットを渡すことでハンドラの責務をシンプルに保つ。

### D4: HP 回復メソッド

`CombatEntitySchema` に `applyHeal(amount: number)` を追加する。`applyDamage` と対称的に、`maxHp` を超えないようクランプし、`dead` 状態では無効とする。

**理由**: 回復ロジックを1箇所に集約し、将来の回復系スキル（zone heal 等）で再利用可能にする。

### D5: 自己回復のフォールバック

射程内に味方がいない場合、自分自身を回復対象とする。これにより「使ったのに何も起きない」ケースを防ぐ。

**理由**: MOBA の一般的な Heal スキル仕様。2v2 では味方が1人しかいないため、フォールバックが重要。

## Risks / Trade-offs

- **[Risk] ally ターゲティングの精度** — クリック座標から最寄り味方を選ぶため、密集時に意図しない対象を選ぶ可能性がある → 射程内チェックで緩和。2v2 なので味方は1人、実質的な問題は少ない。
- **[Risk] SkillExecutionContext の肥大化** — フィールド追加が続くと管理が難しくなる → 現時点では `heroes` と `targetHero` のみで許容範囲。大きくなりすぎた場合はコンテキストオブジェクトの分割を検討。
- **[Trade-off] 自己回復フォールバック** — 「味方を狙ったが自分に当たった」ケースが発生しうる → 2v2 の簡素さを優先し、Phase 1 では許容。
