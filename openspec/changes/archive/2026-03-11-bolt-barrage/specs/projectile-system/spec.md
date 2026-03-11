# Specification

## Purpose
プロジェクタイルシステムの複数弾同時生成対応（既存仕様への差分）

## MODIFIED Requirements

### Requirement: プロジェクタイル状態の定義
プロジェクタイルは以下の読み取り専用フィールドを持つ `ProjectileState` インターフェースで表現しなければならない（SHALL）。`id: string`、`ownerId: string`（発射者ID）、`targetId: string`（追尾対象ID）、`position: Position`（現在位置）、`damage: number`、`speed: number`（px/sec）、`radius: number`（描画・衝突判定用半径）。すべてのフィールドは `readonly` でなければならない（SHALL）。

`ProjectileEffectParams` に以下のオプショナルフィールドを追加しなければならない（SHALL）：`projectileCount: number`（生成するプロジェクタイルの数、デフォルト1）、`spreadAngle: number`（扇状の全角度、ラジアン単位）。

#### Scenario: ProjectileState の生成
- **WHEN** `createProjectile` に ownerId, targetId, 発射位置, damage, speed, radius を渡す
- **THEN** 指定されたパラメータを持つ新しい `ProjectileState` が返される

#### Scenario: イミュータブルな状態
- **WHEN** `ProjectileState` を更新する
- **THEN** 元のオブジェクトは変更されず、新しいオブジェクトが返される

#### Scenario: 複数弾生成パラメータ
- **WHEN** projectileCount=5, spreadAngle=0.436 の ProjectileEffectParams でスキルを発動する
- **THEN** 5つのプロジェクタイルが生成され、各プロジェクタイルは spreadAngle の範囲内に均等に分布した方向ベクトルを持つ

## ADDED Requirements

### Requirement: 複数プロジェクタイル生成ロジック
`projectileEffectHandler` は `projectileCount > 1` の場合、指定方向を中心に `spreadAngle` 幅の扇状に均等分布した複数のプロジェクタイルを生成しなければならない（SHALL）。`projectileCount` が 1 または未指定の場合、既存の単発生成ロジックを維持しなければならない（SHALL）。

#### Scenario: projectileCount=1 の場合は単発
- **WHEN** projectileCount=1 または未指定のスキルが発動される
- **THEN** 既存の単発プロジェクタイル生成と同一の動作をする

#### Scenario: projectileCount=5 の場合はファン状に生成
- **WHEN** projectileCount=5, spreadAngle=0.436 で direction=(1,0) のスキルが発動される
- **THEN** 5つのプロジェクタイルが角度 [-0.218, -0.109, 0, +0.109, +0.218] の方向に生成される

#### Scenario: 各プロジェクタイルは独立
- **WHEN** 複数のプロジェクタイルが生成される
- **THEN** 各プロジェクタイルは独立した id、hitSet、distanceTraveled を持ち、個別に移動・衝突・除去される
