## Why

現在、ヒーローの HP が 0 になっても何も起きない。攻撃してダメージを与えても敵が消えず、ゲームとしての「倒す→倒される」ループが成立していない。死亡・リスポーンは MOBA の最も基本的なゲームサイクルであり、Phase 1 のプレイ体験に不可欠。

## What Changes

- HP が 0 になったヒーローを「死亡」状態に遷移させる
- 死亡中は攻撃不可、ヒーロー描画を非表示にする
- 死亡中も WASD でカメラを自由に移動できる（観戦モード）
- リスポーン時にカメラがベース位置に戻る
- リスポーンタイマー（固定秒数）経過後、復活位置で HP 全回復して復活（デフォルトは自チームベース。復活位置は可変設計とし、将来的にヒーロー能力で死亡地点復活等に対応可能にする）
- 敵 Bot も同様に死亡・リスポーンする
- 死亡中のリスポーンカウントダウンを画面に表示

## Non-goals

- 経験値・キル報酬（#27 で対応）
- キルログ / キルカウント UI
- 死亡アニメーション演出（#37 で対応）
- リスポーン時間のレベル連動（#84 で対応。ただし設計段階でタイマーを可変にできる構造にしておく）
- 無敵時間（リスポーン直後のグレース期間）

## Capabilities

### New Capabilities

- `death-respawn`: ヒーローの死亡判定、死亡状態管理、リスポーンタイマー、ベース位置での復活処理

### Modified Capabilities

_(なし — 既存 spec のリクワイヤメントレベルの変更はない)_

## Impact

- `src/domain/types.ts` / `shared/types.ts` — `CombatEntityState` に死亡状態フラグ追加
- `src/domain/systems/` — 死亡判定・リスポーンロジック（純粋関数）
- `src/scenes/GameScene.ts` — ゲームループに死亡チェック・リスポーン処理を統合
- `src/scenes/CombatManager.ts` 相当のロジック — 死亡中のエンティティを攻撃対象から除外
- ヒーロー描画 — 死亡中は非表示
- E2E テスト API — 死亡状態の公開（`getHeroDead()` 等）
- 参考: `openspec/specs/game-mechanics.md`, `openspec/specs/hero-stats/spec.md`, `openspec/specs/attack-system/spec.md`
