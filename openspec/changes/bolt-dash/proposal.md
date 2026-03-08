## Why

BOLT はレンジャー（後衛）ヒーローだが、現在リポジショニング手段がない。敵に詰められた際の離脱手段として、BOLT 固有の短距離ダッシュスキルを追加する。既存の dash effectType を再利用でき、スキル基盤の汎用性を検証する最初のケースでもある。

## What Changes

- `shared/skills/skillDefinitions.ts` に `bolt-dash` スキル定義を追加（effectType: dash, damage: 0）
- BOLT のタレントツリーに `bolt-dash` を取得するノードを追加
- BLADE Charge との差別化: ダメージなし、代わりにほぼ瞬間移動（極短 duration）

## Capabilities

### New Capabilities
- `bolt-dash`: BOLT 固有の無ダメージ瞬間ダッシュスキルの定義・パラメータ

### Modified Capabilities
（なし — 既存の dash effectType と skill-execution 基盤をそのまま再利用）

## Impact

- `shared/skills/skillDefinitions.ts`: エントリ追加
- `shared/talents/boltTalents.ts`: grant_skill ノード追加
- サーバー側: 変更なし（dash handler が damage=0 を既にサポート）
- クライアント側: 変更なし（スロット装備・ターゲティング・HUD は汎用）
