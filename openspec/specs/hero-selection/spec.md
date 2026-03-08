# Specification

## Purpose
ロビーでのヒーロータイプ選択UI（BLADE/BOLT/AURA）とサーバーへの選択送信の仕様

## Requirements

### Requirement: Hero selection UI in lobby
ロビーの waiting 状態でプレイヤーがヒーロータイプを選択できる UI を表示する。利用可能な全ヒーロータイプ（BLADE, BOLT, AURA）をボタンとして表示し、選択状態を視覚的にハイライトする。デフォルト選択は BLADE とする。

#### Scenario: Default hero is BLADE
- **WHEN** プレイヤーがオンラインバトルを選択して waiting 状態に入る
- **THEN** BLADE がデフォルトで選択状態になっている

#### Scenario: Player selects a different hero
- **WHEN** プレイヤーが BOLT ボタンをクリックする
- **THEN** BOLT が選択状態にハイライトされ、他のボタンは非選択状態になる

#### Scenario: Hero selection persists until game start
- **WHEN** プレイヤーがヒーローを選択した後、対戦相手が接続してゲームが開始される
- **THEN** 選択されたヒーロータイプが GameScene に渡される

### Requirement: Join options include heroType
クライアントは `joinOrCreate` 時に選択した `heroType` を join options として送信する。NetworkClient の connect メソッドは options パラメータを受け取れるようにする。

#### Scenario: heroType sent with join request
- **WHEN** プレイヤーがヒーローを選択してオンラインバトルを開始する
- **THEN** `joinOrCreate('game', { heroType: 'BOLT' })` のように選択した heroType が送信される

#### Scenario: No heroType defaults to BLADE
- **WHEN** join options に heroType が含まれない
- **THEN** サーバーは BLADE をデフォルトとして使用する

### Requirement: Server validates and applies heroType
サーバーの `GameRoom.onJoin` は join options から `heroType` を受け取り、バリデーション後に `HERO_DEFINITIONS` を参照してヒーローを初期化する。

#### Scenario: Valid heroType in join options
- **WHEN** クライアントが `{ heroType: 'BOLT' }` で join する
- **THEN** サーバーは BOLT の HERO_DEFINITIONS を使ってヒーローを作成する（maxHp, speed, attackDamage 等が BOLT の値になる）

#### Scenario: Invalid heroType falls back to BLADE
- **WHEN** クライアントが `{ heroType: 'INVALID' }` で join する
- **THEN** サーバーは BLADE をフォールバックとして使用する

#### Scenario: Missing heroType falls back to BLADE
- **WHEN** クライアントが heroType なしで join する
- **THEN** サーバーは BLADE をデフォルトとして使用する
