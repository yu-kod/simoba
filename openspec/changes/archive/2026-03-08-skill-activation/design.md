## Context

スキルスロット（Q/E/R）の装備・入れ替えUIは実装済みだが、スキルを発動するパイプラインが存在しない。既存の攻撃システム（ServerCombatManager / updateAttackState）はクールダウン管理・イベントブロードキャストのパターンを確立しており、スキルシステムもこのパターンに倣う。

現在の入力フロー: InputHandler → targetingReducer → `phase: 'fired'` まで到達するが、その先が未接続。

## Goals / Non-Goals

**Goals:**
- スキル発動の共通基盤を構築し、今後のスキル追加を容易にする
- BLADE の Charge を動作させ、基盤の妥当性を検証する
- 既存の攻撃・移動システムと干渉しない設計

**Non-Goals:**
- バフ/デバフの持続効果フレームワーク（Charge は即時効果のみ）
- パッシブスキルの実行基盤
- スキルエフェクトの演出（最低限のビジュアルのみ）

## Decisions

### D1: スキルメタデータの配置場所

**決定**: `shared/skills/skillDefinitions.ts` に全スキル定義を配置

**理由**: サーバー（バリデーション・効果適用）とクライアント（CD表示・ターゲティング判定）の両方で参照が必要。`shared/` に配置することで重複を避ける。既存の `shared/entities/Hero.ts`（ヒーロー定義）と同じパターン。

**構造**:
```typescript
interface SkillDefinition {
  id: string
  targeting: 'direction' | 'point' | 'self' | 'ally'
  cooldown: number
  range: number        // 射程（direction の場合は distance）
  damage: number
  duration: number     // 効果時間（0 = 即時）
}
```

### D2: サーバー側スキル実行の構造

**決定**: `ServerSkillExecutionSystem.ts` を新規作成。純粋関数 + スキル固有ハンドラのディスパッチ方式。

**理由**: 既存の ServerCombatManager は攻撃に特化しており、スキルの多様な効果（ダッシュ、AoE、バフ等）を扱うには別システムが必要。純粋関数パターンは ServerMatchSystem / ServerSkillSlotSystem と一致。

**フロー**:
1. `GameRoom.onMessage('useSkill', ...)` → `executeSkill(state, sessionId, slot, target)` を呼ぶ
2. `executeSkill`: 共通バリデーション（装備・CD・生存）→ スキルID取得 → 個別ハンドラにディスパッチ
3. 個別ハンドラ（例: `executeCharge`）: スキル固有のロジックを実行
4. 成功時: CD セット + `SkillEvent` を返却 → GameRoom がブロードキャスト

**代替案**: CombatManager にスキルを統合 → スキルと攻撃は独立した関心事（クールダウン体系、入力経路が異なる）なので分離が適切。

### D3: Charge ダッシュの状態管理

**決定**: `HeroSchema` に `dashTimer: float32`、`dashDirX: float32`、`dashDirY: float32`、`dashSpeed: float32` を追加。ダッシュ中は `dashTimer > 0`。

**理由**: サーバーが毎 tick ダッシュ進行を計算し、位置を更新する。クライアントはエンティティ補間で追従するため、特別な同期は不要。`dashTimer > 0` を移動入力無視の条件に使う。

**フロー**:
1. `executeCharge`: `dashTimer = duration`, `dashDirX/Y = 正規化方向`, `dashSpeed = distance / duration` をセット
2. `gameUpdate` の移動処理: `dashTimer > 0` なら WASD 入力を無視し、`dashDir * dashSpeed * dt` で位置更新。`dashTimer -= dt`。
3. `dashTimer <= 0` で通常移動に復帰

**代替案**: ダッシュを projectile のように別エンティティで管理 → 過度に複雑。ヒーロー自身の位置を動かすだけで十分。

### D4: Charge 接触ダメージの判定

**決定**: ダッシュ中の毎 tick で全敵エンティティとの距離判定を行い、ヒットした敵を Set で記録して重複防止。

**理由**: Charge はダッシュ中に通過する敵全員に当たる必要がある。projectile のような点判定ではなくヒーローの判定円を使う。`Set<string>` でヒット済みIDを管理し、1回のダッシュで同一敵への多重ヒットを防ぐ。

**ヒット済み管理**: `HeroSchema` には入れず、`GameRoom` の `Map<sessionId, Set<entityId>>` で管理。ダッシュ終了時にクリア。

### D5: クールダウンフィールドの追加方式

**決定**: `HeroSchema` に `cooldownQ`, `cooldownE`, `cooldownR`（各 `float32`）を追加。

**理由**: スロット固定の3フィールドなので MapSchema は不要。既存の `attackCooldown: float32` と同じパターン。クライアントは Colyseus の state sync で自動取得。

### D6: クライアントからの useSkill 送信経路

**決定**: `GameScene.update()` で `targeting.phase === 'fired'` を検出し、`NetworkBridge.sendUseSkill(slot, target)` → `GameMode.sendUseSkill()` → `room.send('useSkill', ...)` の経路。

**理由**: 既存の攻撃入力（`sendInput`）と同じ経路パターン。targeting state machine はクライアントローカルで完結し、`fired` 状態のみをサーバーに送信する。

### D7: skillEvent ブロードキャスト

**決定**: 既存の `CombatEventMessage` パターンに合わせ、`room.broadcast('skill', event)` で送信。クライアントは `OnlineGameMode` で受信しコールバックで通知。

**理由**: attack/damage/death と同じイベントパターン。将来のスキルエフェクト描画に必要な情報（caster位置、方向、スキルID）を含む。

## Risks / Trade-offs

**[ダッシュ中のネットワーク遅延]** → サーバー権威でダッシュ位置を計算し、クライアントはエンティティ補間で追従するため、既存の移動同期と同じ品質。プロトタイプ段階では許容範囲。

**[スキル定義の数値未決定]** → Charge の cooldown / distance / damage / duration の具体値が skill-catalog.md で空欄。仮値で実装し、プレイテストで調整する。

**[ダッシュ中の被ダメージ]** → 現設計ではダッシュ中も通常通り被ダメージする。無敵フレームは Dodge Roll の仕様であり、Charge には含めない。
