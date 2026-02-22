## Context

オンラインモードの戦闘エフェクト（ダメージフラッシュ、メレースイング、死亡/リスポーン）は現在 Colyseus Schema の状態差分検知で実装している。サーバーは Schema プロパティを変更するだけで、Colyseus が自動的に差分を配信。クライアントの `handleServerHeroUpdate` で前回値と比較してエフェクトを発火する。

この方式はスキル/エフェクト追加のたびにプロパティ監視パターンを個別追加する必要がある。`room.broadcast()` による明示的イベントメッセージに移行する。

## Goals / Non-Goals

**Goals:**
- サーバーが攻撃・ダメージ・死亡/リスポーン時に明示的イベントを broadcast
- クライアントがイベントを受信してエフェクトを描画
- state-diff 検知ロジック（prevHp 比較、prevAttackCooldown 比較）を削除
- `attackCooldown` Colyseus リスナーを削除（帯域最適化）
- プレイヤーから見た体験は現行と同等を維持

**Non-Goals:**
- スキルシステムの実装
- 死亡時カメラ自由操作
- ダメージ数値表示・ヒットストップ等の追加エフェクト
- オフラインモードの変更

## Decisions

### 1. メッセージ送信方式: `room.broadcast()` メッセージ

**採用**: Colyseus の `room.broadcast(type, data)` で fire-and-forget メッセージを送信。

**理由**: 戦闘イベントは一時的（起きて消える）。Schema は永続的状態向き。イベントを Schema に入れるとライフサイクル管理（追加→処理→削除）が必要で複雑化する。broadcast なら新イベントタイプ追加時にスキーマ変更不要。

**却下案**: Schema に ArraySchema/MapSchema で CombatEvent を追加 — 状態とイベントの境界が曖昧になり、クリーンアップ処理が必要。

### 2. メッセージ型設計: イベント種別ごとの分離型

**採用**: `AttackEvent`, `DamageEvent`, `DeathEvent` を個別の型として定義。チャネルも分離（`room.broadcast('attack', ...)`, `room.broadcast('damage', ...)` 等）。

```typescript
// shared/messages.ts に追加

interface AttackEvent {
  readonly attackerId: string
  readonly targetId: string
  readonly attackType: 'melee' | 'ranged'
  readonly position: { readonly x: number; readonly y: number }
  readonly facing: number
}

interface DamageEvent {
  readonly targetId: string
  readonly amount: number
  readonly sourceId: string
}

interface DeathEvent {
  readonly heroId: string
  readonly type: 'death' | 'respawn'
  readonly position: { readonly x: number; readonly y: number }
}
```

**理由**: 型ごとにフィールドが異なる。統一型だと optional フィールドが増え型安全性が低下する。将来スキルイベント追加時も新しい型を追加するだけ。

**却下案**: 統一 `CombatEvent` 型 with `type` discriminator — optional フィールド多数、switch 文が肥大化。

### 3. イベント発行ポイント

サーバーの既存関数にイベント収集を追加する。関数は純粋関数のまま保ち、戻り値でイベントを返す。`GameRoom.gameUpdate()` がイベントを集約して broadcast する。

| イベント | 発行元 | トリガー |
|---------|--------|---------|
| AttackEvent (melee) | `processHeroCombat` | メレー攻撃発動時（`def.projectileSpeed === 0` ルート） |
| AttackEvent (ranged) | `processHeroCombat` | 遠距離攻撃発動時（projectile spawn ルート） |
| DamageEvent (melee) | `processHeroCombat` | メレーダメージ適用時 |
| DamageEvent (projectile) | `processProjectiles` | 投射物ヒット時 |
| DamageEvent (tower melee) | `processTowerCombat` | タワーのメレー攻撃時 |
| DeathEvent (death) | `processDeathAndRespawn` | `hero.dead = true` 設定時 |
| DeathEvent (respawn) | `processDeathAndRespawn` | `hero.dead = false` 設定時 |

**設計パターン**: 各 process 関数はイベント配列を返す。GameRoom が集約して broadcast。

```typescript
// Before (副作用のみ)
processHeroCombat(hero, heroId, input, heroes, towers, projectiles, ProjectileSchemaClass, deltaTime): void

// After (イベントを返す)
processHeroCombat(hero, heroId, input, heroes, towers, projectiles, ProjectileSchemaClass, deltaTime): CombatEventUnion[]
```

### 4. クライアント側の受信アーキテクチャ

```
OnlineGameMode
  └─ room.onMessage('attack', cb)  → attackCallbacks
  └─ room.onMessage('damage', cb)  → damageCallbacks
  └─ room.onMessage('death', cb)   → deathCallbacks

GameMode interface
  └─ onAttackEvent(cb): void
  └─ onDamageEvent(cb): void
  └─ onDeathEvent(cb): void

NetworkBridge.setupCallbacks()
  └─ gameMode.onAttackEvent(cb) → meleeSwing.play() / (ranged: 将来対応)
  └─ gameMode.onDamageEvent(cb) → entityRenderers.get(targetId).flash()
  └─ gameMode.onDeathEvent(cb)  → (将来: 死亡エフェクト)

OfflineGameMode
  └─ onAttackEvent / onDamageEvent / onDeathEvent → no-op
```

### 5. 死亡/リスポーンの予測リセット: 状態同期に残す

`dead` プロパティの変化検知（`prevDead` vs `state.dead`）で InputBuffer.clear / MovementPredictor.setPosition を実行する現行方式を継続。

**理由**: 予測リセットは権威的状態（`dead`）と密結合。イベントと状態同期のタイミングズレで予測が壊れるリスクを回避。

### 6. `attackCooldown` リスナー削除

メレースイング検知が AttackEvent に移行するため、OnlineGameMode の `$(hero).listen('attackCooldown', ...)` を削除。attackCooldown はサーバー側の内部管理値として Schema に残すが、クライアントへの通知は不要。

## Risks / Trade-offs

**[メッセージ到達順序]** → broadcast とスキーマ同期の到達順序が保証されない可能性。例: DamageEvent が hp 変化より先に届く場合、flash 対象エンティティがまだ古い HP を持つ。→ **緩和**: エフェクトは座標・ ID ベースで発火し、HP 値に依存しないため実害なし。

**[オフラインモードとの二重パス]** → オフライン（CombatManager 直接）とオンライン（イベント経由）で同じエフェクトを異なるコードパスでトリガーする。→ **緩和**: エフェクト発火のインターフェースを統一（同じ renderer メソッドを呼ぶ）し、トリガー元だけが異なる設計。

**[イベント欠損]** → WebSocket (TCP) なのでパケットロスはないが、クライアントが接続途中の場合は過去イベントを受け取れない。→ **緩和**: 戦闘イベントは瞬間的ビジュアルのみ。権威的状態（HP, dead）は Schema 同期で補完される。

## Open Questions

（解決済み）

- ~~タワーの攻撃エフェクト~~ → タワーもイベントは発行する。エフェクト描画は将来対応。
