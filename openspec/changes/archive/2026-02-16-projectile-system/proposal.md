## Why

近接攻撃（BLADE）は実装済みだが、BOLT と AURA の通常攻撃はプロジェクタイル（飛翔体）を発射する遠距離攻撃であり、そのためのプロジェクタイルシステムが存在しない。また、将来的にタワーの自動攻撃やスキル（Pierce Shot 等）でもプロジェクタイルを再利用するため、汎用的な基盤として今構築する。

## What Changes

- プロジェクタイルの生成・飛翔・衝突判定・消滅を管理するドメインロジックを新規追加
- プロジェクタイルのジオメトリック描画（小さい円）を行うレンダラーを新規追加
- BOLT/AURA の通常攻撃を近接スイングからプロジェクタイル発射に切り替え
- GameScene にプロジェクタイルの更新ループと描画を統合
- 攻撃システムのエフェクト部分を拡張（`AttackEffectRenderer` の projectile 実装）

## Capabilities

### New Capabilities
- `projectile-system`: プロジェクタイルの生成・飛翔・衝突判定・消滅のライフサイクル管理。純粋関数ベースのドメインロジックとレンダラー

### Modified Capabilities
- `attack-system`: 攻撃発動時に近接 or 遠距離を `attackRange` で判別し、遠距離の場合はプロジェクタイルを生成する分岐を追加

## Impact

- `src/domain/` — プロジェクタイル状態・更新・衝突判定の純粋関数群を新規追加
- `src/scenes/` — ProjectileRenderer、GameScene への統合
- `src/scenes/GameScene.ts` — プロジェクタイルプール管理、update ループへの組み込み
- `src/domain/entities/heroDefinitions.ts` — projectile 関連パラメータ（速度・半径）の追加が必要になる可能性
- 既存の近接攻撃ロジック・テストには影響なし（追加のみ）
