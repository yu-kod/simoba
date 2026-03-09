## Context

現在のプロジェクタイルシステムはホーミング専用（`targetId` で追尾対象を指定）で、通常攻撃のみが使用する。Pierce Shot は「方向指定・直進・貫通」というまったく異なる飛行モードを必要とする。既存の `ProjectileSchema` と `ServerProjectileSystem` を拡張して両方のモードをサポートする設計が必要。

### 既存コード構造
- `ProjectileSchema`: id, x, y, targetX, targetY, speed, damage, ownerId, team, targetId
- `ServerProjectileSystem.processProjectiles()`: ホーミング移動 + 指定ターゲットのみ衝突判定
- `skillEffectRegistry`: effectType → handler マッピング（現在 `dash` のみ）
- `SkillEffectParams`: discriminated union（現在 `DashEffectParams` のみ）

## Goals / Non-Goals

**Goals:**
- `projectile` effectType をスキルエフェクトハンドラとして追加
- 直進（non-homing）プロジェクタイルの飛行モードをサポート
- 貫通（pierce）: 同じプロジェクタイルが複数の敵にヒット可能
- 射程制限: 最大飛行距離を超えたら消滅
- 今後の projectile 系スキル（Barrage, Ricochet, Snipe）の基盤となる再利用可能な設計

**Non-Goals:**
- AoE 判定（Pierce Shot は線上の敵のみ）
- プロジェクタイルの軌道変更（Ricochet は別スキルで対応）
- チャージ/溜め撃ち機構
- 既存ホーミングプロジェクタイルの変更（通常攻撃は従来通り）

## Decisions

### 1. ProjectileSchema に `mode` フィールドを追加

```
mode: 'homing' | 'linear'  (default: 'homing')
```

- `homing`: 既存の targetId 追尾動作（通常攻撃）
- `linear`: dirX/dirY 方向に直進、targetId 不要

**理由**: 飛行モードを明示的に分離することで、ServerProjectileSystem 内の分岐が明確になる。将来のモード追加（parabolic 等）にも対応可能。

### 2. 貫通は `pierceRemaining` + `hitEntityIds` で管理

```
pierceRemaining: number   // 残り貫通回数（-1 = 無限）
hitEntityIds: string[]    // 既にヒットしたエンティティID
```

- ヒット時に `pierceRemaining` を減算、0 になったらプロジェクタイル除去
- `hitEntityIds` で同じ敵への二重ヒットを防止
- `hitEntityIds` はサーバーのみで管理（Schema にはせず、Map で保持）

**理由**: `hitEntityIds` を Schema に入れると ArraySchema のシリアライズコストが発生し、クライアントには不要な情報。サーバーサイドの `Map<projectileId, Set<string>>` で管理する。

### 3. 射程制限は `maxRange` + `distanceTraveled` で実装

```
maxRange: number          // 最大飛行距離 (px)
distanceTraveled: number  // 累計移動距離 (px)
```

- 毎フレーム `distanceTraveled += speed * dt` を加算
- `distanceTraveled >= maxRange` で除去
- ホーミングプロジェクタイルは `maxRange = 0`（無制限、targetId 到達で消滅）

**理由**: フレーム単位の位置比較より正確で、高速プロジェクタイルの飛び越しにも対応。

### 4. ProjectileEffectParams の設計

```typescript
interface ProjectileEffectParams {
  effectType: 'projectile'
  damage: number
  speed: number           // px/sec
  range: number           // max travel distance (px)
  radius: number          // collision/render radius
  pierceCount: number     // max enemies to pierce (0 = single hit)
  homing: boolean         // true = track target, false = straight line
}
```

**理由**: スキル定義に必要なパラメータをすべて含め、将来の projectile 系スキルで値を変えるだけで異なる挙動を実現できる。例: Snipe は `pierceCount: 0, speed: 1200, range: 800`、Barrage は `pierceCount: 0, speed: 400` を複数発射。

### 5. projectileEffectHandler はプロジェクタイル生成のみ担当

ハンドラは `ProjectileSchema` を生成して `GameRoomState.projectiles` に追加するだけ。移動・衝突・除去は既存の `ServerProjectileSystem.processProjectiles()` が担当。

**問題**: 現在の `SkillExecutionContext` には `projectiles` MapSchema への参照がない。

**解決**: `SkillExecutionContext` に `projectiles: MapSchema<ProjectileSchema>` を追加する。

### 6. Pierce Shot のパラメータ

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | 5s | |
| damage | 60 | |
| speed | 800 | px/sec、通常攻撃(600)より速い |
| range | 600 | px |
| radius | 5 | px |
| pierceCount | 3 | 最大3体貫通 |
| homing | false | 直進 |

## Risks / Trade-offs

- **hitEntityIds のメモリ管理**: サーバーサイド Map にプロジェクタイルIDをキーとして保持するため、プロジェクタイル除去時に確実にクリーンアップが必要
- **高速プロジェクタイルの衝突漏れ**: speed=800, dt=0.016 で 1フレーム12.8px 移動。radius=5 のターゲットを飛び越す可能性は低いが、極端に速いプロジェクタイルでは sweep collision が将来必要になる可能性がある（現時点では不要）
- **Schema フィールド増加**: ProjectileSchema に 4 フィールド追加（mode, dirX, dirY, maxRange）。ホーミングプロジェクタイルにも同期されるが、サイズ影響は軽微
