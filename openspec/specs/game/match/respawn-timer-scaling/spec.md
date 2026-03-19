# Specification

## Purpose
レベル別リスポーン時間テーブルとリスポーンタイマーのスケーリング仕様

## Requirements

### Requirement: レベル別リスポーン時間テーブル

`RESPAWN_TIMES` 定数をレベルごとのリスポーン秒数テーブルとして定義しなければならない（SHALL）。インデックスはレベル値に対応し、`RESPAWN_TIMES[level]` でそのレベルのリスポーン秒数を取得できなければならない（SHALL）。

#### Scenario: 各レベルのリスポーン時間

- **WHEN** ヒーローのレベルが 1〜5 のいずれかである
- **THEN** `RESPAWN_TIMES[level]` が以下の値を返す: Lv1=3秒, Lv2=5秒, Lv3=8秒, Lv4=12秒, Lv5=15秒

### Requirement: リスポーン時間算出関数

純粋関数 `computeRespawnTime(level: number): number` を提供しなければならない（SHALL）。`RESPAWN_TIMES` テーブルからレベルに応じたリスポーン秒数を返さなければならない（SHALL）。レベルが範囲外の場合は最も近い有効レベルにクランプしなければならない（SHALL）。

#### Scenario: レベル1のリスポーン時間

- **WHEN** `computeRespawnTime(1)` を呼ぶ
- **THEN** 3 が返される

#### Scenario: レベル5のリスポーン時間

- **WHEN** `computeRespawnTime(5)` を呼ぶ
- **THEN** 15 が返される

#### Scenario: レベル0（範囲外下限）

- **WHEN** `computeRespawnTime(0)` を呼ぶ
- **THEN** レベル1と同じ値（3）が返される

#### Scenario: MAX_LEVEL超過（範囲外上限）

- **WHEN** `computeRespawnTime(10)` を呼ぶ
- **THEN** レベル5（MAX_LEVEL）と同じ値（15）が返される
