# Specification

## Purpose
レベル別リスポーン時間テーブルとリスポーンタイマーのスケーリング仕様

## Requirements

### Requirement: レベル別リスポーン時間テーブル

`RESPAWN_TIMES` 定数をレベルごとのリスポーン秒数テーブルとして定義しなければならない（SHALL）。インデックスはレベル値に対応し、`RESPAWN_TIMES[level]` でそのレベルのリスポーン秒数を取得できなければならない（SHALL）。テーブルは Lv0〜Lv30 の 31 エントリを持つ。

#### Scenario: 各レベルのリスポーン時間

- **WHEN** ヒーローのレベルに応じた `RESPAWN_TIMES[level]` を参照する
- **THEN** 以下の値が返される:
  - Lv0=0秒
  - Lv1-8: 2, 2, 3, 3, 4, 4, 5, 5 秒
  - Lv9-20: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 16 秒
  - Lv21-30: 17, 18, 19, 20, 21, 22, 23, 24, 24, 25 秒

### Requirement: リスポーン時間算出関数

純粋関数 `computeRespawnTime(level: number): number` を提供しなければならない（SHALL）。`RESPAWN_TIMES` テーブルからレベルに応じたリスポーン秒数を返さなければならない（SHALL）。レベルが範囲外の場合は最も近い有効レベルにクランプしなければならない（SHALL）。

#### Scenario: レベル1のリスポーン時間

- **WHEN** `computeRespawnTime(1)` を呼ぶ
- **THEN** 2 が返される

#### Scenario: レベル30のリスポーン時間

- **WHEN** `computeRespawnTime(30)` を呼ぶ
- **THEN** 25 が返される

#### Scenario: レベル0（範囲外下限）

- **WHEN** `computeRespawnTime(0)` を呼ぶ
- **THEN** 0 が返される

#### Scenario: MAX_LEVEL超過（範囲外上限）

- **WHEN** `computeRespawnTime(35)` を呼ぶ
- **THEN** レベル30（MAX_LEVEL）と同じ値（25）が返される
