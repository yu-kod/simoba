## Context

BOLT の火力ビルドに Snipe（狙撃態勢）スキルを追加する。移動速度を犠牲にして通常攻撃を強化するセルフバフスキル。既存の `buff` エフェクトハンドラが `additionalBuffs` をサポートしており、新しいハンドラは不要。

既存の類似スキル:
- `blade-fury`: self targeting, buff effectType, attackDamage +25 / attackSpeed +0.5, duration 5s, cooldown 18s
- `aura-haste`: ally targeting, buff effectType, speed +80, duration 3s

## Goals / Non-Goals

**Goals:**
- `bolt-snipe` スキル定義を追加（buff effectType + additionalBuffs）
- `boltTalents.ts` に Depth 5 タレントノードを追加
- サーバーテストで全バフ適用を検証

**Non-Goals:**
- 新しいエフェクトハンドラの作成（既存 buff ハンドラで十分）
- クライアント側のカスタム UI / エフェクト（既存 StatusEffect 表示で対応）
- Snipe 中の通常攻撃アニメーション変更

## Decisions

### 1. buff effectType + additionalBuffs パターンを使用
`blade-fury` と同じパターンで、primary buff に attackDamage、additionalBuffs に attackSpeed と speed（負値）を設定する。

代替案: 新しい `stance` effectType を作る → 過剰設計。既存の buff で同等の動作が実現可能。

### 2. パラメータ設定
| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| cooldown | 16s | blade-fury(18s) より短め。レンジャーのため頻度高め |
| duration | 5s | blade-fury と同じ。十分な戦闘ウィンドウ |
| attackDamage | +20 | BOLT の基礎攻撃力が BLADE より低いため控えめ |
| attackSpeed | +0.4 (40%) | 火力倍率の主軸 |
| speed | -60 | aura-haste の +80 と対照的。カイト困難なリスク |

### 3. タレントノード配置
Depth 5 の marksman ブランチ（`bolt-dead-eye` の隣）に配置。前提条件は `bolt-eagle-eye`（Depth 4, 射程系パッシブ）。火力特化ビルドの自然な延長。

## Risks / Trade-offs

- **[移動速度-60 が強すぎる/弱すぎる]** → バランス調整フェーズで数値チューニング。定数テーブルで一元管理済み。
- **[additionalBuffs の isDebuff フラグが parent から継承される]** → speed の負値は機能的に正しく動作する。isDebuff フラグは将来の dispel ロジック用メタデータのみ。現時点では問題なし。
