## ADDED Requirements

### Requirement: 共有型定義の配置
`shared/` ディレクトリにクライアント・サーバー間で共有する TypeScript 型定義を配置しなければならない（SHALL）。クライアントは `@shared/*` パスエイリアス経由で、サーバーも `@shared/*` パスエイリアス経由でインポートしなければならない（SHALL）。

#### Scenario: クライアントが共有型をインポートする
- **WHEN** クライアントコードが `import type { CombatEntityState } from '@shared/types'` を使用する
- **THEN** `shared/types.ts` の型が解決される

#### Scenario: サーバーが共有型をインポートする
- **WHEN** サーバーコードが `import type { HeroState } from '@shared/types'` を使用する
- **THEN** `shared/types.ts` の型が解決される

### Requirement: 共有戦闘ロジック関数
`shared/combat.ts` にクライアント・サーバーで共通利用する純粋関数を配置しなければならない（SHALL）。`applyDamage()`, `isInAttackRange()`, `checkDeath()`, `checkHeroDeath()` を含まなければならない（SHALL）。これらの関数は Phaser やその他のフレームワークに依存してはならない（SHALL NOT）。

#### Scenario: applyDamage がサーバーで使用可能
- **WHEN** サーバーが `applyDamage(entity, 50)` を呼び出す
- **THEN** `hp` が 50 減少した新しいエンティティが返される（元のオブジェクトは変更されない）

#### Scenario: isInAttackRange がサーバーで使用可能
- **WHEN** サーバーが `isInAttackRange(attacker, target)` を呼び出す
- **THEN** 中心間距離 - 両者の radius が attackRange 以内かどうかが返される

#### Scenario: checkHeroDeath がサーバーで使用可能
- **WHEN** サーバーが `checkHeroDeath(hero)` を呼び出す
- **THEN** HP 0 のヒーローに `dead: true`, `respawnTimer`, `deathPosition` が設定された新しいオブジェクトが返される

### Requirement: 共有エンティティ定義
`shared/entities/` に `HERO_DEFINITIONS` と `TOWER_DEFINITIONS` を配置しなければならない（SHALL）。`createHeroState()` と `createTowerState()` ファクトリ関数も共有しなければならない（SHALL）。クライアントの `src/domain/entities/` とサーバーの両方がこれらを使用しなければならない（SHALL）。

#### Scenario: サーバーがヒーロー定義を参照する
- **WHEN** サーバーが `HERO_DEFINITIONS['BLADE']` を参照する
- **THEN** BLADE ヒーローのステータス（maxHp, speed, attackDamage, attackRange, attackSpeed, radius）が取得できる

#### Scenario: サーバーがヒーローを生成する
- **WHEN** サーバーが `createHeroState({ id, type: 'BLADE', team: 'blue', position })` を呼び出す
- **THEN** `HERO_DEFINITIONS['BLADE']` のステータスが適用された HeroState が返される

#### Scenario: サーバーがタワーを生成する
- **WHEN** サーバーが `createTowerState({ id, team: 'blue', position })` を呼び出す
- **THEN** `TOWER_DEFINITIONS` のステータスが適用されたタワー state が返される

### Requirement: 共有メッセージ型定義
`shared/messages.ts` にクライアント→サーバーの入力メッセージ型とサーバー→クライアントのイベント型を定義しなければならない（SHALL）。

#### Scenario: InputMessage 型が定義されている
- **WHEN** クライアントが入力メッセージを構築する
- **THEN** `InputMessage` 型（`seq: number`, `moveDir: {x: number, y: number}`, `attackTargetId: string | null`, `facing: number`）に準拠する

#### Scenario: サーバーが InputMessage を受信する
- **WHEN** サーバーが `input` メッセージを受信する
- **THEN** `InputMessage` 型としてパースし、各フィールドのバリデーションを行う

### Requirement: 共有ゲーム定数
`shared/constants.ts` にゲーム全体で使用する定数（MAP_WIDTH, MAP_HEIGHT, RESPAWN_TIME, DEFAULT_ENTITY_RADIUS 等）を配置しなければならない（SHALL）。クライアントとサーバーの両方がこの定数を参照しなければならない（SHALL）。

#### Scenario: サーバーがマップサイズを参照する
- **WHEN** サーバーが移動のマップ境界チェックを行う
- **THEN** `shared/constants.ts` の `MAP_WIDTH`, `MAP_HEIGHT` を使用する

#### Scenario: クライアントとサーバーのマップサイズが一致する
- **WHEN** クライアントとサーバーがそれぞれマップサイズを参照する
- **THEN** 同じ `shared/constants.ts` から取得するため、値が常に一致する
