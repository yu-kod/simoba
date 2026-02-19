## Context

現在のアーキテクチャはクライアント権威型。GameScene/CombatManager がすべてのゲームロジック（移動、攻撃、ダメージ、死亡/リスポーン、投射物）を実行し、サーバー（GameRoom）は位置・ダメージの中継のみ行う。Colyseus 0.16 + schema v3 を使用。`shared/types.ts` で型定義を共有済み。entity-generalization (#94) により EntityManager は単一 Map で全エンティティを統合管理している。

## Goals / Non-Goals

**Goals:**
- サーバーが全エンティティの state（位置、HP、死亡、攻撃）の唯一の権威になる
- クライアントは入力送信 + 描画（予測・補間含む）のみ
- プレイヤー間の HP・位置・死亡状態の不一致を解消
- チート耐性の確保（ダメージ・移動のサーバーバリデーション）

**Non-Goals:**
- ミニオン・ボス・タレントのサーバー実装（後続タスク）
- マッチメイキング改善
- ボット AI のサーバー移行
- ラグ補償（Phase 2 は 1v1 のみ、シンプルな予測で十分）

## Decisions

### D1: サーバーゲームループ — `setSimulationInterval` 60Hz

**選択:** Colyseus の `setSimulationInterval(callback, 1000/60)` でサーバー側に 60Hz 固定ティックループを実装。

**理由:**
- Colyseus 組み込み API で安定したティックレートを提供
- クライアントの Phaser ゲームループと同じ 60Hz で state の精度が揃う
- state 変更は Colyseus が自動的にバイナリ差分で同期

**代替案:**
- Node.js `setInterval` 直接使用 → ドリフトが発生しやすい、Colyseus との統合が不自然
- 30Hz サーバー + 60Hz クライアント補間 → シンプルだが攻撃判定の精度が落ちる

### D2: Colyseus スキーマ設計 — エンティティ種別ごとの MapSchema

**選択:** GameRoomState に `heroes: MapSchema<HeroSchema>`, `towers: MapSchema<TowerSchema>`, `projectiles: MapSchema<ProjectileSchema>` を別々に保持。

```
GameRoomState
├── heroes: MapSchema<HeroSchema>        # id → hero state
├── towers: MapSchema<TowerSchema>        # id → tower state
├── projectiles: MapSchema<ProjectileSchema>  # id → projectile state
├── gameStarted: boolean
└── matchTime: number
```

**理由:**
- Colyseus schema はフィールドごとにバイナリエンコードするため、不要フィールドが多い単一スキーマは帯域の無駄
- 種別ごとの MapSchema なら各スキーマが必要最小限のフィールドを持てる
- クライアント側で `onAdd`/`onRemove` コールバックを種別ごとに設定できて直感的

**代替案:**
- 単一 `entities: MapSchema<EntitySchema>` に全フィールド → フィールド数が爆発、帯域効率悪い
- ArraySchema → ID ベースの検索が O(n)、MapSchema の方が自然

### D3: 入力プロトコル — コマンドベースメッセージ

**選択:** クライアントは以下の入力コマンドをサーバーに送信。サーバーが解釈・バリデーション・適用する。

| メッセージ | ペイロード | 送信タイミング |
|------------|-----------|---------------|
| `input` | `{ seq, moveDir: {x,y}, attackTargetId, facing }` | 毎フレーム (60Hz) |

**設計:**
- `seq` (シーケンス番号) はクライアント予測の reconciliation に使用
- `moveDir` は正規化された方向ベクトル (0,0 = 停止)。サーバーが `speed * deltaTime` を適用
- `attackTargetId` は攻撃対象（null = 攻撃なし）。サーバーが射程・クールダウン・対象存在を検証
- 全フィールドを 1 メッセージに統合して通信回数を最小化

**代替案:**
- イベント分離（moveStart/moveStop, attackStart/attackStop）→ 順序保証が複雑
- 位置直接送信 + バリデーション → 真の権威型にならない、テレポートチートの余地

### D4: サーバー側ゲームロジック — 純粋関数の再利用

**選択:** クライアントの `src/domain/` にある純粋関数（ダメージ計算、射程判定、死亡判定）を `shared/` に移動し、サーバーでも同じ関数を使用。

**移動対象:**
- `shared/combat.ts` — `applyDamage()`, `isInAttackRange()`, `checkDeath()`, `checkHeroDeath()`
- `shared/entities/` — `createHeroState()`, `createTowerState()`, `HERO_DEFINITIONS`, `TOWER_DEFINITIONS`
- `shared/types.ts` — 既存（変更なし）

**サーバー専用の新規コード:**
- `server/src/game/ServerEntityManager.ts` — Colyseus schema ベースのエンティティ管理
- `server/src/game/ServerCombatManager.ts` — 攻撃ステートマシン、投射物管理
- `server/src/game/ServerMovementSystem.ts` — 移動適用・マップ境界バリデーション
- `server/src/game/ServerDeathSystem.ts` — 死亡判定・リスポーン管理

**理由:**
- 同じゲームルールをクライアント・サーバーで二重実装しない（Single Source of Truth）
- 純粋関数は Phaser 非依存なのでそのまま共有可能
- サーバー専用コードは Colyseus schema 操作のみ

### D5: クライアント予測 — ローカル移動予測 + サーバー reconciliation

**選択:** ローカルヒーローの移動のみクライアント予測を適用。攻撃・ダメージは予測しない。

**移動予測フロー:**
1. クライアントが入力を処理し、ローカルで即座に移動を適用（予測）
2. 入力を `seq` 付きでサーバーに送信。未確認入力をバッファに保持
3. サーバーから state 更新を受信したら、`lastProcessedSeq` を確認
4. 確認済み入力をバッファから削除
5. サーバー位置を基準に、未確認入力を再適用（reconciliation）

**攻撃・ダメージ:**
- 予測なし。サーバー確認後にクライアントに反映
- 理由: カジュアルゲームで攻撃予測のロールバックは UX 悪化（ダメージが巻き戻る）

**リモートエンティティ:**
- サーバーから受信した位置をそのまま適用（補間なし、Phase 2 初期はシンプルに）
- 将来的に線形補間を追加可能（Non-goal として明示）

### D6: クライアント GameScene の分離 — OnlineMode と OfflineMode

**選択:** 既存の `GameMode` インターフェースを活用し、オンライン時はサーバー state を受信して描画、オフライン時は既存のローカルシミュレーションを維持。

**OnlineGameMode の責務変更:**
- Before: 位置・ダメージの送受信中継
- After: 入力コマンド送信 + サーバー state の受信・EntityManager への反映

**GameScene の変更:**
- オンライン時: ローカルヒーローの移動予測のみ実行。攻撃処理・ダメージ適用はサーバーに委譲
- オフライン時: 既存ロジックをそのまま維持（Bot 戦用）

## Risks / Trade-offs

**[R1] 入力遅延の増加** → ローカル移動予測で体感遅延を最小化。攻撃は遅延を許容（カジュアルゲーム）

**[R2] shared/ 移動による既存テスト破損** → import パスを `@shared/` エイリアスに統一済み。テストの import パスも追従

**[R3] Colyseus schema と domain 型の二重管理** → schema はネットワーク同期専用、domain 型はゲームロジック用。サーバー内で schema ↔ domain 変換レイヤーを設ける

**[R4] オフラインモード（Bot 戦）の維持コスト** → GameMode インターフェースで分離済み。ロジック共有化により差分は最小

## Open Questions

- **Q1:** サーバーティックレートを 60Hz から 20Hz に下げて帯域を節約すべきか？（クライアント補間が必須になる）
- **Q2:** 投射物の同期方式 — サーバーが毎ティック位置を送るか、spawn イベント + クライアント予測か？
