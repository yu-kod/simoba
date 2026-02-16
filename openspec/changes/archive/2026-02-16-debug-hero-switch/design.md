## Context

現在 GameScene ではヒーローが `createHeroState({ type: 'BLADE', ... })` で固定生成されている。プロジェクタイルシステムの検証のために BOLT/AURA を試すには、コードを書き換えて再起動する必要がある。ランタイムで切り替えるデバッグ機能を追加する。

## Goals / Non-Goals

**Goals:**
- 数字キー 1/2/3 で操作ヒーローのタイプを即座に切り替え可能にする

**Non-Goals:**
- 敵ヒーローのタイプ切り替え
- 本番環境への残存（リリース前に削除）
- UI による現在タイプの表示

## Decisions

### Decision 1: GameScene 内の private メソッドとして実装

キーリスナーと切り替えロジックを `GameScene` に直接配置する。

**理由:** デバッグ専用の一時的な機能であり、独立モジュールに切り出すほどの寿命がない。GameScene 内のプライベートメソッドなら削除時にファイル1つの変更で済む。

### Decision 2: Phaser の `keydown-ONE/TWO/THREE` イベントを使用

`this.input.keyboard.on('keydown-ONE', ...)` で直接リスンする。

**理由:** 既存の `InputHandler` は WASD + マウスの戦闘入力を扱うもの。デバッグキーをそこに混ぜると責務が曖昧になり、削除時の影響範囲が広がる。

### Decision 3: 状態を完全リセット

切り替え時は `createHeroState()` で初期スポーン位置・HP・facing 等すべて初期状態に戻す。部分的な状態保持はしない。

**理由:** 実装がシンプルになり、タイプ間の maxHp 不整合などのエッジケースを考慮する必要がない。

### Decision 4: 同一タイプへの切り替えを early return でスキップ

`if (this.heroState.type === type) return` で無駄な再生成を防ぐ。

## Risks / Trade-offs

- **削除し忘れリスク** → 別 Issue で追跡し、リリースチェックリストに含める
