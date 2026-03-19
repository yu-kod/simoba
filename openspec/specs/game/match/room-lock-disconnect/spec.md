# Specification

## Purpose
ルームロック（マッチ開始時の新規参加ブロック）と切断時マッチ終了の仕様

## Requirements

### Requirement: ルームロック
サーバーは `matchPhase` が `'playing'` に遷移するタイミングで Colyseus `this.lock()` を呼び、新規プレイヤーの参加をブロックしなければならない（SHALL）。ロック後に `joinOrCreate` を試みたクライアントは新しいルームに接続されなければならない（SHALL）。

#### Scenario: マッチ開始時にルームがロックされる
- **WHEN** 規定人数のプレイヤーが揃い `matchPhase` が `'playing'` に遷移する
- **THEN** `this.lock()` が呼ばれ、ルームがマッチメイキング対象から除外される

#### Scenario: ロック後に新規プレイヤーが参加を試みる
- **WHEN** ロック済みのルームに対して新規クライアントが `joinOrCreate` を呼ぶ
- **THEN** 新しいルームが作成され、ロック済みルームには参加できない

#### Scenario: ソロモードでもルームがロックされる
- **WHEN** ソロモードでプレイヤーが参加し `matchPhase` が `'playing'` に遷移する
- **THEN** `this.lock()` が呼ばれる

### Requirement: 切断時マッチ終了
試合中（`matchPhase === 'playing'`）にプレイヤーが切断または離脱した場合、サーバーは切断者のチームの敵チームを勝者として即座にマッチを終了しなければならない（SHALL）。切断が意図的（`consented = true`）か否か（`consented = false`）かに関わらず、同じ処理を行わなければならない（SHALL）。

#### Scenario: 試合中にプレイヤーが切断する
- **WHEN** `matchPhase` が `'playing'` の状態でプレイヤーが切断する（`consented = false`）
- **THEN** 切断者の敵チームが `winnerTeam` に設定され、`matchPhase` が `'finished'` になる

#### Scenario: 試合中にプレイヤーが意図的に離脱する
- **WHEN** `matchPhase` が `'playing'` の状態でプレイヤーが `room.leave()` を呼ぶ（`consented = true`）
- **THEN** 離脱者の敵チームが `winnerTeam` に設定され、`matchPhase` が `'finished'` になる

#### Scenario: 待機中の離脱はマッチ終了しない
- **WHEN** `matchPhase` が `'waiting'` の状態でプレイヤーが離脱する
- **THEN** ヒーローが削除されるのみで、`matchPhase` は変更されない

#### Scenario: 試合終了後の離脱はマッチ状態に影響しない
- **WHEN** `matchPhase` が `'finished'` の状態でプレイヤーが離脱する
- **THEN** `matchPhase` と `winnerTeam` は変更されない

### Requirement: ソロモードの切断処理
ソロモード（`isSoloMode = true`）では、プレイヤーの切断時にマッチ終了の勝敗判定を行ってはならない（SHALL NOT）。ヒーローの削除のみ行わなければならない（SHALL）。

#### Scenario: ソロモードでプレイヤーが切断する
- **WHEN** ソロモードの試合中にプレイヤーが切断する
- **THEN** ヒーローが削除される
- **THEN** `winnerTeam` は設定されず、マッチ終了の勝敗判定は行われない
