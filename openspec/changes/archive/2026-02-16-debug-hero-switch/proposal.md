## Why

プロジェクタイルシステムの実装・検証において、BLADE（近接）・BOLT（遠距離）・AURA（遠距離）を素早く切り替えてテストする手段がない。毎回コードを書き換えて再起動するのは非効率なため、ランタイムでヒーロータイプを切り替えるデバッグ機能が必要。

## What Changes

- 数字キー 1/2/3 で操作ヒーローの タイプを BLADE/BOLT/AURA に即座に切り替える機能を GameScene に追加
- 切り替え時に position/facing を保持し、レンダラー・カメラフォローを再構築

## Non-goals

- 敵ヒーローのタイプ切り替え（プレイヤーのみ）
- UI 表示（現在のヒーロータイプを画面に表示する等）
- 本番リリースへの残存（リリース前に削除。別 Issue で追跡）

## Capabilities

### New Capabilities
- `debug-hero-switch`: 数字キーによるヒーロータイプ即時切り替え。position/facing 保持、レンダラー再構築、カメラ再追従

### Modified Capabilities

## Impact

- `src/scenes/GameScene.ts` — キーリスナー追加、`debugSwitchHero` メソッド追加
