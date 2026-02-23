## MODIFIED Requirements

### Requirement: 攻撃状態マシン
`AttackerEntityState` を実装する任意のエンティティは `attackTargetId: string | null` で現在のターゲットを保持しなければならない（SHALL）。ターゲット指定・距離判定・クールダウンに基づいて以下の状態遷移を行わなければならない（SHALL）。`updateAttackState` はジェネリクス `<T extends AttackerEntityState>` で定義し、入力と同じ型 `T` を返さなければならない（SHALL）。

オンラインモード（サーバー権威）では、クライアントが `attackTargetId` をローカルに永続管理し、毎フレーム `InputMessage.attackTargetId` としてサーバーに送信しなければならない（SHALL）。サーバーはクライアントから受け取った `attackTargetId` を検証した上でそのまま使用しなければならない（SHALL）。サーバーはティック間で `attackTargetId` を自律的に保持してはならない（SHALL NOT）— クライアントが送信した値のみを信頼源とする。

#### Scenario: 敵を右クリックしてターゲットが attackRange 内
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` 以内である
- **THEN** `attackTargetId` にターゲットの ID が設定され、攻撃ループが開始される

#### Scenario: 敵を右クリックしてターゲットが attackRange 外
- **WHEN** 敵を右クリックし、ターゲットとの距離が `attackRange` を超えている
- **THEN** `attackTargetId` は `null` のまま、facing のみターゲット方向に更新される。攻撃モーション・ダメージは一切発生しない

#### Scenario: 攻撃ループ中にターゲットが attackRange 外に出る
- **WHEN** 攻撃ループ中にターゲットとの距離が `attackRange` を超える
- **THEN** `attackTargetId` が `null` に戻り、攻撃が即終了する

#### Scenario: 地面を右クリックする
- **WHEN** 地面を右クリックする（ターゲット `null`）
- **THEN** クリック方向に facing が更新され、攻撃は発生しない

#### Scenario: ジェネリクスによる型保持
- **WHEN** `HeroState` を `updateAttackState` に渡す
- **THEN** 戻り値の `entity` フィールドは `HeroState` 型である（ダウンキャスト不要）

#### Scenario: 非ヒーローエンティティの攻撃状態更新
- **WHEN** `AttackerEntityState` を実装するタワーやミニオンを `updateAttackState` に渡す
- **THEN** 同じ攻撃ステートマシンロジック（クールダウン、射程判定、ターゲットドロップ）が適用される

#### Scenario: オンラインモードでクライアントが毎フレームターゲットを送信する
- **WHEN** オンラインモードでクライアントが敵を右クリックしてターゲットを設定する
- **THEN** 以降の毎フレームで `InputMessage.attackTargetId` に同じターゲット ID が送信され続ける

#### Scenario: オンラインモードでサーバーがクライアントのターゲットをそのまま使用する
- **WHEN** サーバーが `InputMessage.attackTargetId = "enemy-id"` を受信する
- **THEN** サーバーはターゲットの存在・生存・チーム・射程を検証した上で `hero.attackTargetId` に設定し、攻撃処理を行う

#### Scenario: オンラインモードで入力がないティックでサーバーがターゲットをクリアする
- **WHEN** サーバーがあるティックでクライアントからの入力を受信しない（`input === undefined`）
- **THEN** サーバーは `hero.attackTargetId` を `''` にクリアする（入力なし = 攻撃意思なし）

#### Scenario: オンラインモードでクライアントが null を送信してターゲット解除する
- **WHEN** クライアントが移動入力によりローカルターゲットを解除し `InputMessage.attackTargetId = null` を送信する
- **THEN** サーバーは `hero.attackTargetId` を `''` にクリアし攻撃を停止する

#### Scenario: サーバーが不正なターゲットを拒否する
- **WHEN** クライアントが存在しない、死亡した、または味方のエンティティ ID を `attackTargetId` として送信する
- **THEN** サーバーは `hero.attackTargetId` を `''` にクリアし攻撃を発動しない
