# Specification

## Purpose
レーンミニオンのスポーン、行動AI（移動・攻撃・チェイス）、試合終了時の停止処理の仕様

## Requirements

### Requirement: 試合終了時のミニオン停止
`matchPhase` が `'finished'` の間、ミニオンウェーブのスポーン、ミニオンの行動（移動・攻撃・チェイス）、ミニオンの死亡処理は実行されてはならない（SHALL NOT）。既存のミニオンはその場で停止しなければならない（SHALL）。

#### Scenario: 試合終了後のミニオンスポーン停止
- **WHEN** `matchPhase` が `'finished'` の状態でミニオンスポーン間隔に達する
- **THEN** 新しいミニオンはスポーンされない

#### Scenario: 試合終了後のミニオン行動停止
- **WHEN** `matchPhase` が `'finished'` の状態で `processMinionBehavior` が呼ばれる
- **THEN** ミニオンは移動・攻撃・チェイスを行わず、現在の位置に留まる
