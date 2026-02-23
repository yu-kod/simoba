## ADDED Requirements

### Requirement: 数字キーによるヒーロータイプ切り替え
GameScene において数字キー 1/2/3 を押下することで、プレイヤーのヒーロータイプを即座に切り替えられなければならない（SHALL）。キーマッピングは `1 → BLADE`、`2 → BOLT`、`3 → AURA` でなければならない（SHALL）。切り替え時はヒーローの状態を初期スポーン状態に完全リセットしなければならない（SHALL）。この機能はデバッグ専用であり、リリース前に削除しなければならない（SHALL）。

#### Scenario: キー 1 で BLADE に切り替える
- **WHEN** プレイヤーが BOLT を操作中にキー 1 を押下する
- **THEN** ヒーローが BLADE に切り替わり、位置・HP・facing 等すべて初期状態にリセットされる

#### Scenario: キー 2 で BOLT に切り替える
- **WHEN** プレイヤーが BLADE を操作中にキー 2 を押下する
- **THEN** ヒーローが BOLT に切り替わり、位置・HP・facing 等すべて初期状態にリセットされる

#### Scenario: キー 3 で AURA に切り替える
- **WHEN** プレイヤーが BLADE を操作中にキー 3 を押下する
- **THEN** ヒーローが AURA に切り替わり、位置・HP・facing 等すべて初期状態にリセットされる

#### Scenario: 同じタイプへの切り替えは無視される
- **WHEN** プレイヤーが BLADE を操作中にキー 1 を押下する
- **THEN** 何も起こらない（再生成しない）

### Requirement: 切り替え時のレンダラー再構築
ヒーロータイプ切り替え時に、古い `HeroRenderer` を `destroy()` し、新しいタイプの `HeroRenderer` を生成しなければならない（SHALL）。カメラの `startFollow` を新しい renderer の `gameObject` に再設定しなければならない（SHALL）。

#### Scenario: レンダラーが再生成される
- **WHEN** ヒーロータイプを切り替える
- **THEN** 古いレンダラーが破棄され、新しいタイプの色・形状・半径で描画される

#### Scenario: カメラが新しいヒーローを追従する
- **WHEN** ヒーロータイプを切り替える
- **THEN** カメラが新しい `HeroRenderer` の `gameObject` を追従し続ける
