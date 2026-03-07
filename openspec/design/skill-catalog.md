# Skill Catalog — 設計書

各ヒーローのスキル効果・数値・実装方針を決めるための設計ドキュメント。
合意後、スキルごとに個別チケットを作成して実装する。

---

## 共通ルール

### スキルスロット
- Q / E / R の3スロット
- タレントで`grant_skill`されたスキルが`ownedSkills`に入り、スロットに装備して使用
- **デフォルトスキルなし** — Lv0ではスキルなし、タレントポイントで好きなスキルを取得していく
- Ultimateも他スキルと同じ扱い（レベル制限なし、タレントで獲得してスロットに装備）
- Space Dashは不採用（各ヒーロー固有の回避/機動スキルで代替）

### パッシブ
- タレントで`unlock_passive`されたパッシブは**取得時に自動適用**（スキル枠不要）
- `stat_modifier`と同じ扱い — タレントポイントのコストとツリー深度が取得制限として機能する

### スキル共通パラメータ
| パラメータ | 説明 |
|-----------|------|
| cooldown | クールダウン（秒） |
| range | 射程距離（px） |
| damage | ダメージ量 |
| duration | 効果持続時間（秒） |
| area | 効果範囲（半径 px） |
| castTime | 詠唱時間（秒）、0 = 即時 |
| targeting | 照準方式（direction / point / self / ally） |

---

## BLADE — Fighter (Melee)

**コンセプト**: 前衛。近接火力 or タンクの2ビルドパス。
**スキル数**: 7

### ビルド方向性
| 方向 | 特徴 | スキル |
|------|------|--------|
| 火力 | 高近接DPS、AoE、フィニッシャー | Whirlwind, Fury, Execute |
| タンク | 被ダメ軽減、耐久 | Block, Fortify |
| 共通 | どちらでも使うエンゲージ/機動 | Charge, Dodge Roll |

### 通常攻撃
| パラメータ | 値 | 備考 |
|-----------|-----|------|
| type | melee swing | |
| range | — | 近接 |
| damage | base stat依存 | |
| attackSpeed | base stat依存 | |

### タレントで獲得するスキル

#### Charge（突進）— 共通 / Depth 1, Cost 1
> カーソル方向にダッシュして飛び込む

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| range/distance | | |
| damage | | |

#### Block（ブロック）— タンク / Depth 1, Cost 1
> 発動中、被弾ごとに固定値のダメージを吸収する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self | |
| cooldown | | |
| duration | | |
| block amount | | 1ヒットあたりの固定軽減値 |

#### Dodge Roll（回避）— 共通 / Depth 3, Cost 2
> 短距離の回避ロール。BLADE固有の機動スキル

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| distance | | |
| 無敵フレーム | | |

#### Whirlwind（旋風）— 火力 / Depth 3, Cost 2
> 回転しながら周囲の敵を攻撃する持続AoE

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self (周囲) | |
| cooldown | | |
| area | | |
| damage | | 持続型（tick damage） |
| duration | | |

#### Fortify（鉄壁）— タンク / Depth 3, Cost 2
> 一定時間、被ダメージを割合で軽減する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self | |
| cooldown | | |
| duration | | |
| 軽減率 | | 例: 被ダメ30%カット |

#### Fury（激昂）— 火力 / Depth 6, Cost 3
> 自己強化バフ。攻撃力・攻撃速度が上昇

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self | |
| cooldown | | |
| duration | | |
| 効果 | | 攻撃速度UP＋ダメージUP |

#### Execute（処刑）— 火力 / Depth 7, Cost 3
> 強力な近接フィニッシャー。低HP敵に追加ダメージ

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction / 単体 | |
| cooldown | | |
| damage | | |
| 追加効果 | | 低HP敵に追加ダメージ |

### パッシブ
| ID | 名前 | Depth | 効果（案） |
|----|------|-------|-----------|
| blade-thorns | Thorns | 3 | 被ダメ時に反射ダメージ |
| blade-tenacity | Tenacity | 4 | CC時間短縮 |
| blade-last-stand | Last Stand | 5 | 低HP時にダメージ軽減 |
| blade-lifesteal | Lifesteal | 5 | 通常攻撃でHP回復 |
| blade-immortal | Immortal | 7 | 致死ダメージを1回耐える |

---

## BOLT — Ranger (Ranged)

**コンセプト**: 後衛。低HP・高火力・高機動。3方向に特化しすぎないようタレントツリーで分岐させる。
**スキル数**: 7

### ビルド方向性
| 方向 | 特徴 | スキル |
|------|------|--------|
| 火力 | 高DPS、バースト、貫通 | Pierce Shot, Barrage, Ricochet, Snipe |
| ゾーンコントロール | 罠・設置で敵の動きを制限 | Trap, Turret |
| 機動 | 距離を取りながら戦う | Dash |

**注意**: 3方向すべてに手を出すと強すぎるため、タレントツリーのブランチ分岐を深くし、1方向を深く取ると他が取れない構造にする。

### 通常攻撃
| パラメータ | 値 | 備考 |
|-----------|-----|------|
| type | ranged projectile | |
| range | 長射程 | |
| damage | base stat依存 | |
| projectileSpeed | | |

### タレントで獲得するスキル

#### Pierce Shot（貫通弾）— 火力 / Depth 1, Cost 1
> 敵を貫通する弾丸。複数の敵にヒットする

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| range | | |
| damage | | |
| 貫通数 | | 無限？上限あり？ |

#### Trap（罠）— ゾーン / Depth 1, Cost 1
> 地面に罠を設置。敵が踏むとスロー＋ダメージ

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | point | |
| cooldown | | |
| damage | | |
| slow | | 減速率・持続時間 |
| 持続時間 | | 罠が設置されている時間 |
| 設置数上限 | | |

#### Dash（ダッシュ）— 機動 / Depth 2, Cost 2
> 素早い短距離ダッシュ。BOLT固有のリポジショニング手段

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| distance | | |

#### Barrage（連射）— 火力 / Depth 3, Cost 2
> 短時間で複数の弾を連射するバーストスキル

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| 弾数 | | |
| damage/弾 | | |
| duration | | チャネリング？即時？ |

#### Ricochet（跳弾）— 火力 / Depth 4, Cost 2
> 敵間を跳ね回る弾丸

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction | |
| cooldown | | |
| damage | | |
| バウンド回数 | | |
| バウンド範囲 | | |

#### Snipe（狙撃態勢）— 火力 / Depth 5, Cost 2
> 移動速度が低下する代わりに通常攻撃が大幅に強化される

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self (モード切替) | |
| cooldown | | |
| duration | | |
| 攻撃強化 | | 火力UP / 攻撃速度UP |
| 移動速度低下 | | デメリット。カイト不能のリスク |

#### Turret（タレット）— ゾーン / Depth 6, Cost 2
> 自動攻撃するタレットを設置する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | point | |
| cooldown | | |
| duration | | タレットの持続時間 |
| damage | | タレットの攻撃力 |
| attackSpeed | | タレットの攻撃速度 |
| range | | タレットの射程 |
| HP | | タレットは破壊可能？ |

### パッシブ
| ID | 名前 | Depth | 効果（案） |
|----|------|-------|-----------|
| bolt-windwalk | Windwalk | 3 | 移動速度UP（戦闘外） |
| bolt-quickdraw | Quickdraw | 3 | 攻撃後の移動速度UP |
| bolt-eagle-eye | Eagle Eye | 4 | 射程UP |
| bolt-headshot | Headshot | 5 | クリティカル確率 |

---

## AURA — Support

**コンセプト**: 後衛/フレックス。味方支援・敵デバフ・自分中心の範囲効果の3方向。
**スキル数**: 7

### ビルド方向性
| 方向 | 特徴 | スキル |
|------|------|--------|
| 味方支援 | HP回復・バフで味方を助ける | Heal, Haste |
| デバフ | 敵を弱体化する | Weaken, Slow Field |
| 範囲効果（オーラ） | 自分中心の持続範囲効果 | Barrier, Nova, Sanctuary |

### 通常攻撃
| パラメータ | 値 | 備考 |
|-----------|-----|------|
| type | ranged projectile | 低ダメージ |
| range | 中射程 | |
| damage | base stat依存（低め） | |

### タレントで獲得するスキル

#### Heal（回復）— 味方支援 / Depth 1, Cost 1
> 味方のHPを回復する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | ally / self | |
| cooldown | | |
| heal amount | | |
| range | | 味方への射程 |

#### Haste（加速）— 味方支援 / Depth 1, Cost 1
> 味方の移動速度を上昇させる

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | ally / self | |
| cooldown | | |
| speed bonus | | |
| duration | | |

#### Barrier（バリア）— 範囲効果 / Depth 2, Cost 2
> 地面に保護エリアを展開する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | point | |
| cooldown | | |
| area | | |
| duration | | |
| 効果 | | ダメージ軽減？敵侵入不可？ |

#### Weaken（弱体化）— デバフ / Depth 2, Cost 2
> 敵の攻撃力を一定時間低下させる

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | direction / 単体 | |
| cooldown | | |
| duration | | |
| 攻撃力低下率 | | |
| range | | |

#### Slow Field（減速フィールド）— デバフ / Depth 3, Cost 2
> 範囲内の敵の移動速度を低下させるフィールドを展開する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | point | |
| cooldown | | |
| area | | |
| duration | | |
| 減速率 | | |

#### Nova（聖なる爆発）— 範囲効果 / Depth 6, Cost 3
> 自分中心に範囲ダメージを与え、範囲内の味方を回復する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self (周囲) | |
| cooldown | | |
| area | | |
| damage | | 敵へのダメージ |
| heal | | 味方への回復量 |

#### Sanctuary（聖域）— 範囲効果 / Depth 7, Cost 3
> 自分中心に持続的な保護ゾーンを展開する

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| targeting | self | |
| cooldown | | |
| area | | |
| duration | | |
| 効果 | | 範囲内の味方にダメージ軽減＋回復 |

### パッシブ
| ID | 名前 | Depth | 効果（案） |
|----|------|-------|-----------|
| aura-regen | Regen | 2 | HP自然回復 |
| aura-inspiration | Inspiration | 3 | 周囲の味方にステータスバフ |
| aura-harmony | Harmony | 4 | スキルCD短縮 |
| aura-sacrifice | Sacrifice | 4 | 自分のHPを消費して味方を強化 |

---

## 決定済み事項

### スキルスロット
- Q / E / R は並列で同格。スロットごとの制限なし（どのスキルでもどのスロットにも装備可能）

---

## チケット作成予定

1回の実装でうまくまとまる単位でチケットを作成する。例:
1. スキル実行基盤（共通フレームワーク: CD管理、照準、エフェクト適用）
2. 関連するスキル群をまとめた実装チケット（例: BLADE近接スキル一式、BOLTゾーン系一式）
3. パッシブ効果の実装チケット
