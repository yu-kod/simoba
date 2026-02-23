## ADDED Requirements

### Requirement: 入力コマンド送信
OnlineGameMode はクライアントの入力を `input` メッセージとしてサーバーに送信しなければならない（SHALL）。メッセージには `seq`（シーケンス番号）、`moveDir`（正規化方向ベクトル）、`attackTargetId`（攻撃対象 ID または null）、`facing`（向きラジアン）を含まなければならない（SHALL）。毎フレーム送信しなければならない（SHALL）。

#### Scenario: 移動入力を送信する
- **WHEN** プレイヤーが WASD キーで移動操作を行う
- **THEN** `input` メッセージが `{ seq: N, moveDir: {x, y}, attackTargetId: null, facing }` としてサーバーに送信される

#### Scenario: 攻撃入力を送信する
- **WHEN** プレイヤーが敵を右クリックして攻撃対象を指定する
- **THEN** `input` メッセージの `attackTargetId` に対象の ID が含まれる

#### Scenario: seq が毎フレーム増加する
- **WHEN** 連続したフレームで入力が送信される
- **THEN** `seq` が 1 ずつ増加する

#### Scenario: 入力がない場合も送信される
- **WHEN** プレイヤーが何も操作していない
- **THEN** `moveDir: {x: 0, y: 0}`, `attackTargetId: null` の入力が送信される

### Requirement: ローカル移動予測
クライアントはローカルヒーローの移動入力を即座にローカルに適用しなければならない（SHALL）。サーバー確認を待たずに `moveDir * speed * deltaTime` で位置を更新しなければならない（SHALL）。入力を `seq` とともにバッファに保持しなければならない（SHALL）。

#### Scenario: 入力が即座にローカル反映される
- **WHEN** プレイヤーが右方向に移動入力を行う
- **THEN** ローカルヒーローの位置がサーバー応答を待たずに即座に右に移動する

#### Scenario: 未確認入力がバッファに保持される
- **WHEN** 入力が送信される
- **THEN** `{ seq, moveDir, deltaTime }` がペンディングバッファに追加される

### Requirement: サーバー reconciliation
クライアントはサーバーから受信した state に `lastProcessedSeq` が含まれる場合、確認済み入力をバッファから削除し、サーバー位置を基準に未確認入力を再適用しなければならない（SHALL）。

#### Scenario: 確認済み入力がバッファから削除される
- **WHEN** サーバーから `lastProcessedSeq: 5` を受信する
- **THEN** seq 5 以下のペンディング入力がバッファから削除される

#### Scenario: サーバー位置を基準に未確認入力を再適用する
- **WHEN** サーバーから位置 `{x: 100, y: 200}` と `lastProcessedSeq: 5` を受信し、バッファに seq 6, 7 の入力が残っている
- **THEN** サーバー位置 `{x: 100, y: 200}` から seq 6, 7 の移動を再適用した位置がローカルヒーローに設定される

#### Scenario: サーバーとクライアントの位置が一致している場合
- **WHEN** reconciliation 後の位置がローカル位置と一致する
- **THEN** 視覚的なジャンプは発生しない

### Requirement: サーバー state からのエンティティ同期
OnlineGameMode は Colyseus の `onAdd`/`onRemove`/`onChange` コールバックで heroes・towers・projectiles の変更を受信し、クライアントの EntityManager に反映しなければならない（SHALL）。ローカルヒーロー以外の全エンティティはサーバー state をそのまま適用しなければならない（SHALL）。

#### Scenario: リモートヒーローの追加
- **WHEN** サーバーの `heroes` MapSchema に新しいエントリが追加される
- **THEN** クライアントの EntityManager に対応する HeroState が登録され、レンダラーが生成される

#### Scenario: リモートヒーローの位置更新
- **WHEN** サーバーからリモートヒーローの位置が変更される
- **THEN** クライアントの EntityManager 内の対応ヒーローの位置が更新される

#### Scenario: タワーの HP 更新
- **WHEN** サーバーからタワーの HP が変更される
- **THEN** クライアントの EntityManager 内のタワーの HP が更新され、HP バーが再描画される

#### Scenario: 投射物の追加と削除
- **WHEN** サーバーの `projectiles` MapSchema にエントリが追加/削除される
- **THEN** クライアントの投射物レンダラーが追加/削除される

#### Scenario: ローカルヒーローの HP 更新はサーバーから反映される
- **WHEN** サーバーからローカルヒーローの HP が変更される
- **THEN** ローカルヒーローの HP がサーバー値に更新される（位置は reconciliation で処理）

### Requirement: オンライン時のクライアントロジック制限
オンラインモード時、クライアントはローカルヒーローの移動予測のみを実行しなければならない（SHALL）。攻撃処理、ダメージ適用、死亡判定、投射物管理をクライアント側で実行してはならない（SHALL NOT）。これらはすべてサーバーからの state 同期で反映しなければならない（SHALL）。

#### Scenario: オンライン時にクライアントがダメージ計算しない
- **WHEN** オンラインモードで攻撃がヒットする
- **THEN** クライアントはダメージ計算を行わず、サーバーからの HP 更新を待つ

#### Scenario: オンライン時にクライアントが投射物を生成しない
- **WHEN** オンラインモードでローカルヒーローが遠距離攻撃を行う
- **THEN** クライアントは投射物を生成せず、サーバーの `projectiles` MapSchema への追加で投射物が表示される

#### Scenario: オフラインモードでは既存ロジックが動作する
- **WHEN** オフライン（Bot 戦）モードでゲームが実行される
- **THEN** 既存のクライアント側 CombatManager がダメージ・投射物・死亡判定を実行する
