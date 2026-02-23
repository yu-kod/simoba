## Context

現在の `GameScene.ts` (457 行) は Phaser の Scene クラスを継承し、以下を直接管理している:

- **エンティティ state**: `heroState`, `enemyState`, `remoteRenderers` (Map)
- **戦闘処理**: `processAttack()`, `processProjectiles()`, `handleAttackInput()`, `applyLocalDamage()`
- **ネットワーク**: `initGameMode()`, `setupRemotePlayerCallbacks()`, `addRemotePlayer()`, `removeRemotePlayer()`, `updateRemotePlayer()`
- **入力/移動**: `processInput()`, `processMovement()`, `processFacing()`
- **レンダリング同期**: `updateEffects()`, `syncRenderers()`
- **デバッグ**: `debugSwitchHero()`

今後、構造物 (#20) やミニオン (#21) を追加すると、エンティティの種類が増え、`resolveTarget()` や `getEntityRadius()` の分岐が爆発する。今の段階で責務を分割しておく。

## Goals / Non-Goals

**Goals:**
- GameScene を ~150 行のオーケストレーターに縮小する
- 各マネージャーを Phaser 非依存にし、ユニットテスト可能にする
- 構造物/ミニオン追加時にマネージャー単位で拡張できる構造にする

**Non-Goals:**
- ECS (Entity Component System) への全面移行は行わない
- レンダラー層の再構成は行わない
- ドメインロジック (`src/domain/`) の変更は行わない

## Decisions

### Decision 1: 3 マネージャー構成

**選択:** EntityManager / CombatManager / NetworkBridge の 3 クラスに分割

**理由:** GameScene の責務を分析すると、大きく「誰がいるか (Entity)」「戦闘 (Combat)」「通信 (Network)」の 3 軸に分かれる。これ以上細かく分けると連携コストが増え、これより粗いとリファクタリングの効果が薄い。

**代替案:**
- **2 分割 (GameLogic + Network):** シンプルだが、GameLogic が依然 300 行以上になり分割効果が弱い
- **ECS 導入:** 柔軟だがフレームワーク導入コストが高く、現規模ではオーバーエンジニアリング

### Decision 2: マネージャーは plain class (Phaser 非依存)

**選択:** マネージャーは Phaser.Scene を受け取らず、純粋な TypeScript クラスとして実装。レンダラーへの同期は GameScene のオーケストレーション層で行う。

**理由:**
- ユニットテスト時に Phaser モックが不要になる
- ドメインロジックとフレームワークの結合を防ぐ
- 将来的にサーバーサイドでロジック共有する余地を残す

**代替案:**
- **Phaser.Scene を注入:** テスト時にモックが必要になり、テストの脆さが増す

### Decision 3: EntityManager がエンティティ state の Single Source of Truth

**選択:** ローカルヒーロー、敵、リモートプレイヤーの全 state を EntityManager が一元管理。CombatManager や NetworkBridge は EntityManager 経由でエンティティを参照する。

**理由:**
- `resolveTarget()` や `getEntityRadius()` のようなエンティティ横断の検索ロジックを一箇所にまとめられる
- 構造物/ミニオン追加時も EntityManager にエンティティ種別を追加するだけで済む

**API 概要:**
```typescript
class EntityManager {
  readonly localHero: HeroState
  updateLocalHero(updater: (hero: HeroState) => HeroState): void
  getEntity(id: string): CombatEntityState | null
  getEnemies(): CombatEntityState[]
  getEntityRadius(id: string): number
  addRemotePlayer(remote: RemotePlayerState): HeroState
  removeRemotePlayer(sessionId: string): void
  updateRemotePlayer(remote: RemotePlayerState): void
}
```

### Decision 4: CombatManager は EntityManager に依存

**選択:** CombatManager はコンストラクタで EntityManager を受け取り、ターゲット解決やダメージ適用を EntityManager 経由で行う。

**理由:** 戦闘処理はエンティティ情報に依存するため自然な依存方向。逆方向の依存は発生しない。

**API 概要:**
```typescript
class CombatManager {
  constructor(entityManager: EntityManager)
  processAttack(deltaSeconds: number): CombatEvents
  processProjectiles(deltaSeconds: number): CombatEvents
  handleAttackInput(aimWorldPosition: Position): void
}

interface CombatEvents {
  damageEvents: Array<{ targetId: string; damage: number }>
  projectileSpawnEvents: Array<ProjectileSpawnEvent & { ownerId: string; ownerTeam: string }>
  meleeSwings: Array<{ position: Position; facing: number }>
}
```

### Decision 5: NetworkBridge はイベント仲介のみ

**選択:** NetworkBridge は GameMode のコールバック登録と、アウトバウンドイベント送信のみを担当。state 管理は行わない。

**理由:** ネットワーク層はイベントの仲介役に徹し、ビジネスロジックを持たないことで、オフライン/オンライン切り替えの複雑さを NetworkBridge 内に閉じ込められる。

**API 概要:**
```typescript
class NetworkBridge {
  constructor(
    gameMode: GameMode,
    entityManager: EntityManager,
    combatManager: CombatManager
  )
  setupCallbacks(): void
  sendLocalState(): void
  sendDamageEvent(event: DamageEvent): void
  sendProjectileSpawn(event: ProjectileSpawnEvent): void
}
```

### Decision 6: GameScene の update ループ実行順序

**選択:** `processInput → combatManager.processAttack → combatManager.processProjectiles → processFacing → processMovement → networkBridge.sendLocalState → syncRenderers`

**理由:** 現在の GameScene.update() と同じ順序を維持し、挙動の差分をゼロにする。

## Risks / Trade-offs

- **[クラス間の状態同期]** → EntityManager を Single Source of Truth にすることで軽減。CombatManager は EntityManager 経由でのみ state にアクセス
- **[リファクタリング漏れ]** → 既存テストスイートで挙動変更を検知。追加でマネージャー単体テストも書く
- **[依存グラフの複雑化]** → 依存方向は一方向のみ (GameScene → NetworkBridge → CombatManager → EntityManager) に統一し、循環を防ぐ
