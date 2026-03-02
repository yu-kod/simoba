## Context

現在 `processDeathAndRespawn` はヒーロー死亡時に `DEFAULT_RESPAWN_TIME`（5秒）を直接使用している。death-respawn spec には「Configurable respawn time」要件があるが、実装は引数化されていない。Issue #84 ではレベルに応じてリスポーン時間を変動させ、終盤のデスペナルティを重くする。

関連ファイル:
- `shared/constants.ts` — `DEFAULT_RESPAWN_TIME = 5`
- `server/src/game/ServerDeathSystem.ts` — `processDeathAndRespawn()`
- `server/src/schema/HeroSchema.ts` — `level: uint8` (XP/level sync で追加済み)

## Goals / Non-Goals

**Goals:**
- レベルに応じたリスポーン時間の算出ロジックを `shared/` に純粋関数として定義する
- `processDeathAndRespawn` でヒーローの `level` を参照してリスポーン時間を決定する
- 5分マッチに適したバランスのリスポーン秒数を設定する

**Non-Goals:**
- リスポーン時間の UI 表示変更（既に `respawnTimer` を表示しており、値が変わるだけで自動対応）
- リスポーン位置のレベル連動
- バフ/デバフによるリスポーン時間変動（将来課題）

## Decisions

### 1. 算出方式: 線形補間テーブル

**選択:** レベルごとの固定テーブル `RESPAWN_TIMES: readonly number[]`

**根拠:** 5段階（MAX_LEVEL=5）なのでテーブルが最もシンプルで調整しやすい。計算式より直感的にバランス調整可能。

**代替案:**
- 計算式 `base + perLevel * (level - 1)` — レベル数が少ないため過剰
- 非線形式（二次関数等）— 5段階では差が出にくく複雑すぎる

**値の設計:**
- Lv1: 3秒（序盤は軽いペナルティ）
- Lv2: 5秒
- Lv3: 8秒
- Lv4: 12秒
- Lv5: 15秒（5分マッチの終盤で15秒は大きなペナルティ）

### 2. 純粋関数の配置

**選択:** `shared/systems/respawnTimer.ts` に `computeRespawnTime(level: number): number` を定義

**根拠:** `computeLevelUp` と同じパターン。shared に置くことでサーバー・テスト両方から利用可能。

### 3. processDeathAndRespawn の変更方針

**選択:** 関数内部で `hero.level` から直接算出する（引数追加なし）

**根拠:** `hero` (HeroSchema) は既に `level` フィールドを持っている。リスポーン時間は常にヒーロー自身のレベルで決まるため、外部から渡す必要がない。関数シグネチャ変更を避けることで呼び出し側への影響を最小化。

**代替案:**
- 引数でリスポーン時間を渡す — death-respawn spec の「Configurable respawn time」に沿うが、現状レベル以外の変動要因がなく過剰設計
- コールバック関数で算出 — 同上

## Risks / Trade-offs

- **バランス調整リスク** → テーブル方式なので定数変更のみで対応可能。実際のプレイテストで調整。
- **E2E テスト `death-respawn.spec.ts` への影響** → 固定5秒前提のウェイトがあれば修正が必要。ただしレベル1ヒーローなら3秒になるため、待機時間は短くなる方向で壊れにくい。
