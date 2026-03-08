## Context

スキル発動基盤（skill-activation）は構築済みで、dash effectType の handler も `damage=0` のエスケープダッシュを既にサポートしている。BOLT のタレントツリーには `bolt-dash` ノード（Depth 2, Cost 2, `grant_skill: 'bolt-dash'`）が定義済みだが、対応するスキル定義が `SKILL_DEFINITIONS` に存在しないため、スキルを取得しても発動できない状態。

## Goals / Non-Goals

**Goals:**
- `bolt-dash` のスキル定義を追加し、タレントで取得後に発動可能にする
- BLADE Charge との明確な差別化: ダメージなし・ほぼ瞬間移動

**Non-Goals:**
- dash effectType や handler の改修（既存で十分）
- クライアント側のダッシュ演出の差別化（将来の VFX チケット #37 で対応）

## Decisions

### D1: パラメータ設計 — BLADE Charge との差別化

**決定**: `bolt-dash` は distance を短く、duration を極短（0.05秒）に設定し、瞬間移動の感触にする。

| パラメータ | blade-charge | bolt-dash | 差別化意図 |
|-----------|-------------|-----------|-----------|
| distance | 300 | 180 | BOLTは短距離リポジション |
| duration | 0.3s | 0.05s | ほぼ瞬間移動 |
| damage | 80 | 0 | 機動特化、攻撃性なし |
| cooldown | 8s | 6s | 機動スキルなので回転率高め |
| dashSpeed | 1000 | 3600 | distance/duration で自動算出 |

**理由**: duration 0.05s（≈3フレーム @ 60fps）は移動中に被弾する隙をほぼなくし、「ブリンク」に近い操作感を実現する。BLADE Charge は duration 0.3s で経路上の敵にダメージを与える設計なので、性格が明確に異なる。

### D2: 実装範囲

**決定**: `shared/skills/skillDefinitions.ts` にエントリ1つ追加するだけ。

**理由**: タレントツリーのノード（`bolt-dash`）は既に存在し、`grant_skill: 'bolt-dash'` で参照している。サーバーの dash handler は `damage=0` をサポート済み（`processDashDamage` が `dashDamage <= 0` をスキップ）。クライアントのターゲティング・HUD もスキル定義から自動取得。新規コードは不要。

## Risks / Trade-offs

**[瞬間移動のネットワーク体験]** → duration 0.05s はサーバー tick（16ms @ 60Hz）1-3回分。エンティティ補間が追いつかず「ワープ」に見える可能性があるが、BOLT のダッシュとしては意図通り。クライアント側で将来ブリンク演出を追加すれば改善可能（#37）。

**[バランス未確定]** → cooldown 6s / distance 180 は仮値。プレイテストで調整する。定数テーブル化済みなので変更は容易。
