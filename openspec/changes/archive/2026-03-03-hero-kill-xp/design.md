## Context

現在 XP 獲得源はミニオンキルのみ。`ServerMinionSystem.processMinionDeaths` でミニオン死亡時に近隣ヒーローへ `MINION_XP_REWARD` を均等分配し、`computeLevelUp` + `applyStatsGrowth` でレベルアップ処理を行っている。

ヒーロー死亡は `ServerDeathSystem.processDeathAndRespawn` で検知するが、「誰が倒したか」の情報がなく、XP 付与先を特定できない。ダメージ適用は `combatUtils.applyDamageToTarget` で行われるが、攻撃元 ID を記録していない。

## Goals / Non-Goals

**Goals:**
- ヒーローキル時にキラーへ固定 XP を付与する
- キラー追跡のため「最後にダメージを与えたヒーロー」を記録する
- 既存のレベルアップパイプライン（`computeLevelUp` + `applyStatsGrowth`）を再利用する

**Non-Goals:**
- アシスト XP（キラー以外への分配）
- レベル差による報酬変動
- キルストリーク / シャットダウンボーナス
- クライアント側のキルフィード UI

## Decisions

### 1. キラー追跡: `lastAttackerSessionId` フィールド

**決定**: `HeroSchema` に `lastAttackerSessionId: string` を追加し、ダメージ適用時に攻撃元ヒーローの sessionId を記録する。

**代替案**:
- (A) ダメージイベントのログを保持 → メモリ増、2v2 では過剰
- (B) 死亡検知時に「直近の DamageEvent」を逆引き → タイミング依存で不安定

**理由**: 2v2 の小規模マッチでは「ラストヒット = キラー」で十分。フィールド 1 つの追加で最もシンプル。

### 2. ダメージ適用時の attacker 記録場所

**決定**: `combatUtils.applyDamageToTarget` に `attackerSessionId` 引数を追加し、ヒーローへのダメージ時に `lastAttackerSessionId` を更新する。

**理由**: ダメージ経路が 3 つ（melee, projectile, tower/minion）あり、共通の `applyDamageToTarget` で記録するのが漏れにくい。タワー/ミニオンからのダメージは `attackerSessionId = ''` とし、キルXP 対象外とする。

### 3. XP 報酬値

**決定**: `HERO_KILL_XP_REWARD = 150` を定数テーブルに追加。

**根拠**: ミニオン 1 体 = 20 XP、Lv2 到達 = 100 XP（ミニオン 5 体分）。ヒーローキル = ミニオン約 7.5 体分でリスクに見合う報酬。5 分マッチで 2〜3 回のキルが発生する想定で、ミニオンファームとキルの両方がレベリングに貢献するバランス。

### 4. XP 付与タイミング

**決定**: `processDeathAndRespawn` の死亡検知ブロック内で、`lastAttackerSessionId` からキラーを特定し XP を付与する。

**理由**: 死亡検知と同一ティックで処理することで、タイミングずれを防ぐ。既存の `computeLevelUp` + `applyStatsGrowth` をそのまま呼び出す。

### 5. 自殺・タワーキルの扱い

**決定**: `lastAttackerSessionId` が空文字またはヒーローが存在しない場合は XP 付与をスキップ。

**理由**: タワーやミニオンによるキルは「ヒーロー vs ヒーロー」ではないため XP 不要。

## Risks / Trade-offs

- **[ラストヒット偏重]** → アシスト不要の 2v2 では問題にならない。4v4 以上に拡張時は Issue で再検討。
- **[XP バランス]** → `HERO_KILL_XP_REWARD` は定数テーブルで管理し、プレイテストで容易に調整可能。
- **[lastAttackerSessionId のリセット]** → リスポーン時に空文字にリセットし、前回のキラー情報が残らないようにする。
