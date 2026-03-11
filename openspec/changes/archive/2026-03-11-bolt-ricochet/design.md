## Context

既存の projectile システムは `homing`（追尾）と `linear`（直線 + 貫通）の2モードをサポート。Ricochet は `linear` モードの拡張で、ヒット時に最近接敵にリダイレクトするバウンス動作を追加する。

既存の仕組み:
- `ProjectileTracker` が hitSet（既ヒット敵ID集合）と distanceTraveled を管理
- `processLinearProjectile` がフレームごとに移動 → 衝突判定 → pierce 処理
- `collectEnemyEntities` で敵候補を収集済み

## Goals / Non-Goals

**Goals:**
- `linear` モードのプロジェクタイルにバウンス動作を追加
- ヒット時に `bounceRemaining > 0` なら最近接の未ヒット敵にリダイレクト
- `ProjectileEffectParams` / `ProjectileSchema` にバウンスパラメータ追加

**Non-Goals:**
- バウンスプロジェクタイル専用の新モード追加（`linear` モードの拡張で対応）
- タワー/ミニオンへのバウンス（ヒーローのみ。将来拡張可能）
- バウンス時のダメージ減衰（バランス調整フェーズで検討）

## Decisions

### 1. `linear` モードの拡張として実装
バウンスは `linear` モードの on-hit behavior の分岐として実装する。`bounceRemaining > 0` のときは pierce の代わりにリダイレクトする。

代替案: 新しい `bounce` モードを追加 → processProjectiles のモード分岐が増える。バウンスの移動は直線と同じなので、拡張のほうが DRY。

### 2. バウンスと pierce は排他
同一プロジェクタイルが pierce と bounce を同時に持つことはない。`bounceRemaining > 0` の場合、ヒット時は pierce ではなくバウンスを実行する。

### 3. バウンスターゲットはヒーローのみ
`collectEnemyEntities` からヒーロー以外をフィルタするのではなく、バウンス先の検索時にヒーローのみを対象にする専用関数を追加。

### 4. パラメータ設定
| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| cooldown | 8s | pierce-shot(5s) と barrage(10s) の間 |
| damage | 50 | バウンスで複数ヒットを前提にやや控えめ |
| speed | 700 | barrage と同等 |
| range | 500 | 初弾の最大飛距離 |
| radius | 5 | pierce-shot と同じ |
| bounceCount | 3 | 初弾 + 3バウンド = 最大4ヒット |
| bounceRange | 300 | バウンド先の探索範囲 |

### 5. バウンス時の距離リセット
バウンドのたびに distanceTraveled をリセットし、maxRange をバウンド先までの距離を元に再計算。これにより各バウンドで range 制限が適用される。

## Risks / Trade-offs

- **[密集戦で強すぎる]** → 4ヒット × 50 = 200 total。Barrage (5 × 25 = 125) より高いが、敵が4体密集するのは稀。バランス調整フェーズで数値チューニング。
- **[バウンス先が見つからない場合]** → 弾丸は消滅。最後のヒット時にダメージは入るので問題なし。
- **[distanceTraveled リセットの複雑さ]** → バウンス時にリセットするだけ。1行の変更。
