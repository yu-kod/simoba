## Why

現在 `src/` はフラット構成（`scenes/`, `config/`）で、ゲームロジック・描画・入力が Scene クラスに混在する設計になっている。Phase 1 の本格実装（ヒーロー、ミニオン、戦闘、AI 等）を開始する前に、ドメインロジック層を Phaser から分離するアーキテクチャ基盤を確立する必要がある。

主要な動機:
1. **テスタビリティ**: 現在 Phaser 依存コードのユニットテストには `vi.mock('phaser')` が必要。ドメインロジックを Phaser から完全分離し、モック不要でテスト可能にする
2. **Phase 2 移行**: Colyseus サーバーへの移行時に、ドメインロジック（`domain/`）をそのままサーバーに移植できる構造が必要
3. **保守性**: 「HP計算のバグ → domain/」「描画がおかしい → scenes/ の描画コード」と問題箇所を即座に特定できるレイヤー分離

## What Changes

ロジック分離アプローチを採用する。ゲームルールの計算を `domain/` に集約し、Phaser は描画・物理・入力のインフラとして使う。

- **新規**: `src/domain/` — Phaser 非依存の純粋 TypeScript によるゲーム状態・ロジック層
  - `domain/entities/` — ゲームエンティティの状態型定義（Hero, Minion, Structure 等）
  - `domain/systems/` — ゲームルール処理の純粋関数（Combat, Movement, XP 等）
  - `domain/types.ts` — 共通型定義（Position, Team, EntityState 等）
- **変更**: `src/scenes/GameScene.ts` — domain 層を呼び出すオーケストレーター役に再構成。描画・入力は Scene に残すが、ロジック計算は domain に委譲
- **変更**: `src/config/gameConfig.ts` — ゲーム定数を domain 層からも参照可能な形に整理

### ディレクトリ構成
```
src/
  domain/           ← 純粋 TypeScript（Phaser import 禁止）
    entities/       Hero, Minion, Structure, Projectile 等の状態型
    systems/        Combat, Movement, XP, MatchTimer 等の純粋関数
    types.ts        共通型（Position, Team, EntityState）
  scenes/           ← Phaser Scene（描画 + 入力 + domain 呼び出し）
  config/           ← ゲーム設定・定数
```

### データフロー
```
Phaser Scene.update(delta)
  → 入力を読み取る（Phaser の keyboard/mouse）
  → domain の純粋関数でゲーム状態を更新
  → 新しい状態を Phaser オブジェクトに反映して描画
```

### 主要な設計判断
- **Phaser をそのまま活用**: 描画、物理演算、入力処理は Phaser の機能を使う。無理にアダプター層を挟まない
- **domain 層のみ分離**: ダメージ計算、クールダウン管理、XP計算等の「ゲームルール」だけを純粋関数として切り出す
- **イミュータブルな状態更新**: domain の関数は新しいオブジェクトを返す（mutation しない）
- **新規ライブラリ追加なし**: TypeScript の型定義と関数分離のみで実現
- **ECS は採用しない**: 2v2 規模では過剰。シンプルな型定義 + 純粋関数で十分

## Capabilities

### New Capabilities
- `mvc-architecture`: Domain 層の分離パターン、基底型定義、ドメインシステム（純粋関数）の規約、Scene からの呼び出しパターン

### Modified Capabilities
（なし — 既存の spec レベルの要件変更はない）

## Impact

- **コード構成**: `src/domain/` ディレクトリを新設
- **既存ファイル**: `GameScene.ts` のリファクタリング（機能変更なし、構造変更のみ）
- **テスト**: Domain 層のテストは `vi.mock('phaser')` 完全不要になる
- **依存関係**: 新規ライブラリの追加なし
- **関連 Issue**: #38 (本変更), #14 (ロジック分離の具体方針)
