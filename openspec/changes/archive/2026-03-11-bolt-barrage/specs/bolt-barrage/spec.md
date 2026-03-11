# Specification

## Purpose
BOLT の火力ビルドパス用バースト連射スキル。複数の弾をファン状に同時発射する。

## Requirements

## ADDED Requirements

### Requirement: bolt-barrage スキル定義
`SKILL_DEFINITIONS` に `bolt-barrage` エントリを追加しなければならない（SHALL）。targeting は `direction`、effectType は `projectile`、cooldown は 10 秒とする。

#### Scenario: スキル定義の取得
- **WHEN** `getSkillDefinition('bolt-barrage')` を呼び出す
- **THEN** id='bolt-barrage', targeting='direction', cooldown=10 のスキル定義が返される

#### Scenario: エフェクトパラメータ
- **WHEN** bolt-barrage の effect を参照する
- **THEN** effectType='projectile', damage=25, speed=700, range=450, radius=4, pierceCount=0, projectileCount=5, spreadAngle=0.436 が含まれる

### Requirement: 複数プロジェクタイル生成
bolt-barrage の発動時、`projectileCount` 個のプロジェクタイルを `spreadAngle` の扇状に分散して同時生成しなければならない（SHALL）。各プロジェクタイルはカーソル方向を中心に均等に配置される。

#### Scenario: 5発のプロジェクタイルが扇状に生成される
- **WHEN** BOLT が右方向（dirX=1, dirY=0）に bolt-barrage を発動する
- **THEN** 5つのプロジェクタイルが -12.5° から +12.5° の範囲に 6.25° 間隔で生成される

#### Scenario: 各プロジェクタイルが独立したダメージを持つ
- **WHEN** bolt-barrage で生成された5つのプロジェクタイルのうち2つが敵に命中する
- **THEN** 敵は 25×2 = 50 のダメージを受ける

### Requirement: ダッシュ中の発動拒否
ダッシュ中（dashTimer > 0）は bolt-barrage を発動できない（SHALL）。

#### Scenario: ダッシュ中に発動を試みる
- **WHEN** dashTimer > 0 の BOLT が bolt-barrage を発動しようとする
- **THEN** スキルは発動されず、クールダウンは消費されない

### Requirement: クールダウン設定
bolt-barrage 発動後、10秒のクールダウンが設定されなければならない（SHALL）。

#### Scenario: クールダウンの適用
- **WHEN** BOLT が bolt-barrage を発動する
- **THEN** 使用したスキルスロットのクールダウンが 10 に設定される
