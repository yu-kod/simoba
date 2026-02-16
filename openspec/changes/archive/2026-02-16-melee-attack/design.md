## Context

ヒーロー基盤（#19）で `HeroState` に `stats.attackDamage`, `stats.attackRange`, `stats.attackSpeed` が定義済み。入力システム（#18）で `InputState.attack`（右クリック）と `aimWorldPosition` が利用可能。現在は移動と描画のみで、戦闘は未実装。

GameScene は単一ヒーロー（プレイヤー）のみ。Phase 1 で敵ヒーロー（Bot）は #29 で追加予定だが、本チケットでは攻撃対象として仮の敵ヒーローを配置してテスト可能にする。

## Goals / Non-Goals

**Goals:**
- 攻撃の共通基盤を domain 層に純粋関数として構築する
- 右クリックで敵を指定 → 範囲内なら自動攻撃ループの MOBA 的操作を実現する
- BLADE の近接攻撃を動作させる
- `canMoveWhileAttacking` フラグで移動中攻撃の可否を制御する

**Non-Goals:**
- 遠距離攻撃（プロジェクタイル）— #63
- スキル — #23-#25
- 防御計算 — Phase 1 では raw damage
- ミニオン・ストラクチャーへの攻撃 — エンティティ未実装

## Decisions

### 1. 攻撃状態を HeroState に組み込む

`HeroState` に `attackCooldown: number` と `attackTargetId: string | null` を追加。

- `attackCooldown`: 次の攻撃まで残り秒数（0 以下で攻撃可能）
- `attackTargetId`: 現在のターゲットの entity ID（`null` = ターゲットなし）

**理由:** 攻撃状態はヒーロー固有。別オブジェクトで管理するとヒーロー ID との紐付けが必要になり複雑化する。イミュータブル更新パターン（`{ ...state, attackCooldown: newValue }`）で既存パターンと一貫性を保つ。

### 2. ターゲット指定: クリック位置 × 敵 radius のヒットテスト

```
findClickTarget(clickWorldPos, enemies[]): CombatEntityState | null
```

右クリックのワールド座標と各敵の `position` + `radius` で円判定。複数ヒット時は最も近い敵を選択。ヒットなし → `null`（地面クリック扱い）。

**理由:** 純粋関数で敵リストを受け取る設計により、テスト容易かつ将来ミニオン・ストラクチャーを同じ関数で判定可能。

### 3. 攻撃ループの状態遷移

```
updateAttackState(hero, target, deltaTime): { hero, damageEvents }
```

毎フレーム呼び出し。以下を判定：
1. `attackTargetId` が設定済みか
2. ターゲットが `attackRange` 内か（ヒーロー center 間の距離 - 両者の radius）
3. `attackCooldown <= 0` か

全条件を満たす → ダメージイベント発行 + クールダウンリセット。
ターゲットが範囲外 → `attackTargetId` を `null` に戻す（攻撃終了）。

**戻り値:** 更新済み `HeroState` と `DamageEvent[]`（0 or 1 個）のタプル。副作用なし。

### 4. ダメージ適用の分離

```
applyDamage(target, damage): CombatEntityState
```

HP 減算のみの純粋関数。`Math.max(0, target.hp - damage)` で下限クランプ。防御計算は将来ここに追加。

**理由:** 攻撃判定とダメージ適用を分離することで、スキルダメージ・ミニオンダメージ等も同じ関数を再利用可能。

### 5. canMoveWhileAttacking フラグ

`HeroDefinition` に `canMoveWhileAttacking: boolean` を追加。BLADE = `true`。

GameScene の update ループで、`canMoveWhileAttacking === false` かつ攻撃中に WASD 入力があった場合、移動を優先して攻撃をキャンセルする（`attackTargetId` を `null` に戻す）。`canMoveWhileAttacking === true`（BLADE）の場合は移動しても攻撃は継続する。

**理由:** 定義データに持たせることで、ヒーロータイプごとにフラグを変更するだけで挙動が切り替わる。将来のバフ・デバフで一時的に変更することも可能。

### 6. 攻撃中の facing 制御

攻撃中（`attackTargetId` が設定済み）は facing をターゲット方向に固定。移動方向ではなくターゲットを向き続ける。

**理由:** 近接攻撃中にターゲットから目を離すのは不自然。ターゲットを追いかけながら攻撃するイメージ。

### 7. ダメージ判定とエフェクトの完全分離

ダメージ判定（domain 層）とエフェクト描画（view 層）は完全に独立したシステムとする。

- **ダメージ判定:** `attackRange` を使った距離計算 → ダメージイベント発行。エフェクトの有無に一切依存しない
- **エフェクト描画:** ダメージイベントを受け取って視覚表現を再生するだけ。エフェクトの範囲パラメータは独自に定義

両者は同じような値（範囲、角度）を参照するが、あくまで別々に定義する。エフェクトが差し替わってもダメージロジックに影響しない。

攻撃エフェクトは共通インターフェースで抽象化し、差し替え可能にする。

```
interface AttackEffectRenderer {
  play(position, facing, params): void
  update(delta): void
  isActive(): boolean
  destroy(): void
}
```

初期実装は `MeleeSwingRenderer`（前方扇形の弧描画、150ms フェードアウト）。将来的にヒーロータイプ別やタレント別のエフェクトに差し替え可能。

### 8. 被ダメージエフェクト: ヒットフラッシュ

ダメージを受けたエンティティの `bodyGraphics` を一瞬白 → 元の色に戻すフラッシュ。HeroRenderer に `flash()` メソッドを追加。こちらも将来的に差し替え可能な設計とする。

### 9. 敵ヒーローの仮配置

GameScene に敵チーム（red）の静止ヒーローを1体配置。Bot AI は未実装のため動かない。攻撃対象としてのみ機能し、攻撃ループの動作確認に使用。

**理由:** 攻撃対象がいないと機能テスト不可。最小限の仮配置で検証可能にする。

## Risks / Trade-offs

- **[通常攻撃は単体攻撃]** → 右クリックで指定した敵1体のみにダメージ。範囲攻撃（AoE）はスキル（#23 Cleave 等）やタレント・アイテムで実現する設計
- **[仮の敵は静止]** → 移動する敵での範囲判定テストは Bot AI（#29）実装後に E2E で検証
- **[attackRange の解釈]** → center-to-center distance - 両者 radius で計算。ヒーロー同士のサイズ差（BLADE 22, BOLT 18, AURA 20）を考慮済み
- **[canMoveWhileAttacking の粒度]** → 通常攻撃用の boolean のみ。スキルには `canMoveDuringCast` / `canMoveDuringChannel` 等、より細かい制御が必要になるが、それは各スキルチケットで設計する
