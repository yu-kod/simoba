## Why

Phase 1 の戦闘システムの基盤が未実装である。ヒーローの移動・描画はできるがダメージを与える手段がなく、ゲームとして成立しない。通常攻撃の共通フレームワーク（クールダウン、ダメージ適用、ヒット判定）と BLADE の近接攻撃を最初に実装し、後続の遠距離攻撃・スキル・ストラクチャーシステムの土台とする。

## What Changes

- **ターゲット指定:** 右クリックで敵エンティティを直接クリックしてターゲット指定。クリック位置と敵の当たり判定（radius）で判定する純粋関数。空の地面を右クリックした場合はその方向を向くだけ
- **攻撃状態マシン:**
  - 敵を右クリック + `attackRange` 内 → 攻撃ループ開始（クールダウンに従い繰り返し攻撃）
  - 敵を右クリック + `attackRange` 外 → facing のみ更新。攻撃モーション・ダメージ一切なし
  - 攻撃ループ中にターゲットが `attackRange` 外に出る → 攻撃即終了
  - 地面を右クリック → facing のみ更新。攻撃なし
- **移動中攻撃フラグ:** 攻撃タイプごとに `canMoveWhileAttacking: boolean` を定義。BLADE 近接は `true`（移動しながら攻撃可）。遠距離・スキルは各チケットで設定。`false` の場合は攻撃中 WASD 入力を無視。後から変更可能な設計
- **攻撃クールダウン:** `attackSpeed` ベースの発動間隔管理（純粋関数）
- **ダメージ適用:** `CombatEntityState` の HP を減少させる純粋関数
- **近接ヒット判定:** 攻撃発動時にターゲットが `attackRange` 内にいるか判定。距離はパラメータ化
- **BLADE 近接攻撃エフェクト:** 前方扇形のジオメトリック描画
- **被ダメージエフェクト:** ヒットフラッシュ
- **GameScene 統合:** 右クリック → ターゲット判定 → 範囲判定 → クールダウン → ダメージ → 描画

## Non-goals

- 遠距離攻撃（プロジェクタイル）— #63 で別途実装
- スキルシステム（Q/E/R）— #23-#25 で別途実装
- 防御計算・アーマー — Phase 1 では attackDamage をそのまま適用
- ミニオン・ストラクチャーへの攻撃 — エンティティ未実装のため対象外

## Capabilities

### New Capabilities
- `attack-system`: 攻撃の共通基盤（ターゲット指定、クールダウン管理、ダメージ適用、距離判定、攻撃エフェクト描画、攻撃状態管理）

### Modified Capabilities
- `hero-stats`: HeroState に攻撃クールダウン状態を追加（`attackCooldown: number`）

## Impact

- `src/domain/systems/` — 新規: 攻撃クールダウン、ダメージ適用、ヒット判定の純粋関数
- `src/domain/entities/Hero.ts` — HeroState に `attackCooldown` フィールド追加
- `src/scenes/GameScene.ts` — 攻撃ループの統合
- `src/scenes/` — 新規: 攻撃エフェクト描画クラス
- `src/domain/input/InputState.ts` — `attack` フィールドの消費
- 既存のユニットテスト・E2E テストへの影響なし（追加のみ）
