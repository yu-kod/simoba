## Context

レベルアップシステムは実装済み（Lv1〜5、XP テーブル、talentPoints フィールド）。現在はレベルが上がっても StatBlock の growth が加算されるだけで、プレイヤーに選択の余地がない。

スキルシステム（Q/E/R）は未実装。タレントはスキル獲得・強化を含むため、スキルスロットの概念もこのチケットで導入する。

既存アーキテクチャ:
- `shared/entities/Hero.ts` — `HeroDefinition`（base stats + growth）、`StatBlock` 型
- `server/src/schema/HeroSchema.ts` — Colyseus Schema（talentPoints フィールド既存）
- `server/src/game/xpUtils.ts` — レベルアップ時の talentPoints 付与
- サーバー権威モデル: 全ゲームロジックはサーバーで実行

## Goals / Non-Goals

**Goals:**
- ヒーロー共通のタレントツリーエンジン（データ駆動、ツリー形状）
- タレント効果の柔軟な型システム（パラメータ変更、通常攻撃変化、スキル付与）
- Q/E/R スキルスロットへの自由割り当て機構
- サーバー権威: タレント取得・効果適用はサーバーで検証
- 将来のレベル上限拡張（Lv30等）に対応可能な設計

**Non-Goals:**
- 各ヒーローの具体的なタレント内容の確定（プレースホルダーで実装）
- スキルの具体的なロジック実装（ダメージ処理、ターゲティング等は別チケット）
- タレント選択 UI の詳細デザイン（#35）
- R スロットのウルト専用制限（将来検討）

## Decisions

### D1: タレント定義のデータ構造

**決定:** `shared/talents/` に各ヒーロー用のタレントツリーを静的データとして定義する。

```typescript
// shared/talents/types.ts
interface TalentNode {
  id: string                    // 一意ID: "blade-q-charge-speed"
  name: string                  // 表示名
  description: string           // 効果説明
  cost: number                  // 必要ポイント（通常1）
  prerequisites: string[]       // 前提タレントID（ツリーの親）
  effects: TalentEffect[]       // 適用される効果リスト
}

interface TalentTreeDefinition {
  heroType: HeroType
  nodes: TalentNode[]
}
```

**理由:** 静的データ → JSON-like 定義で差し替え容易。ツリー構造は `prerequisites` 配列で表現し、任意の DAG（有向非巡回グラフ）に対応。

**代替案:** DB 保存 → Phase 1 では不要。クラス継承による効果定義 → データ駆動の方が柔軟。

### D2: タレント効果の型システム

**決定:** Tagged union（判別共用体）パターンで効果タイプを定義する。

```typescript
type TalentEffect =
  | { type: 'stat_modifier'; stat: keyof StatBlock; value: number; mode: 'flat' | 'percent' }
  | { type: 'grant_skill'; skillId: string }
  | { type: 'modify_basic_attack'; property: string; value: unknown }
  | { type: 'unlock_passive'; passiveId: string }
```

**理由:** 新しい効果タイプを追加する際に union に1行追加するだけ。各効果の適用ロジックは `applyTalentEffect()` 関数内で switch で分岐。

**代替案:** Strategy パターン（クラスベース） → 過剰。単純な switch で十分。

### D3: スキルスロットシステム

**決定:** `HeroSchema` に `skillSlotQ`, `skillSlotE`, `skillSlotR` を `string` 型で追加（スキルIDを格納）。空文字 = スロット未設定。

```typescript
// HeroSchema に追加
@type('string') skillSlotQ: string = ''
@type('string') skillSlotE: string = ''
@type('string') skillSlotR: string = ''
```

**理由:** Colyseus Schema はプリミティブ型が最もシンプルかつ効率的。MapSchema や ArraySchema よりもスロット数固定の場合は明示的で良い。

**代替案:** `MapSchema<string>` でスロット名→スキルID → 柔軟だがスロット数が3固定なので過剰。将来スロット数を動的にする場合はリファクタ。

### D4: タレント取得フロー（サーバー権威）

**決定:**
1. クライアント → `acquireTalent` メッセージ送信（talentId）
2. サーバー: ポイント残高チェック → 前提条件チェック → 重複チェック → OK なら取得
3. サーバー: `acquiredTalents` に追加、`talentPoints` 減算、効果を即座に適用
4. Colyseus の state sync でクライアントに反映

**理由:** サーバー権威モデルに合致。クライアントは送信のみ、検証は全てサーバー。

### D5: 取得済みタレントの Schema 表現

**決定:** `HeroSchema` に `acquiredTalents: ArraySchema<string>` を追加（取得済みタレントIDの配列）。

**理由:** クライアントがツリー UI を描画する際に、どのタレントが取得済みか知る必要がある。ArraySchema で自動同期。

**代替案:** ビットマスク → タレント数が増えると管理困難。MapSchema<boolean> → ArraySchema の方がシンプル。

### D6: スキルスロット割り当てフロー

**決定:**
1. クライアント: スキルアイコンをドラッグ&ドロップで操作
   - **所持スキル → スロット**: スキルをスロットに装着
   - **スロット → 所持スキル一覧**: スキルをスロットから外す（unequip）
   - **スロット → スロット**: スキルの位置を入れ替え（swap）
2. クライアント → `assignSkillSlot` メッセージ送信（skillId, slot: 'Q'|'E'|'R'|'none'）
3. サーバー: そのスキルを保持しているか検証 → スロットに割り当て or 解除
4. 同じスキルが既に別スロットにある場合は入れ替え（swap）

**スロット変更制限:**
- **空スロットへの装着（equip）**: どこでも可能。タレントでスキルを獲得したら即座にスロットにセットできる。
- **スキルの入れ替え（swap）/ 解除（unequip）**: 拠点エリア内でのみ可能。サーバーがプレイヤーの位置を検証し、拠点外なら拒否する。
- ※ この制限は暫定。バランステスト後に変更の可能性あり。

**理由:** ドラッグ&ドロップは直感的で、MOBA のアイテムビルド UI と同じ操作感。装着・解除・入れ替えを統一的な操作で実現。所持していないスキルの割り当てはサーバーで防ぐ。空スロットへの装着を自由にすることで、タレント取得の即時フィードバックを確保。入れ替えを拠点限定にすることで、スロット選択が戦略的判断になる。

### D7: タレント効果の適用タイミング

**決定:** タレント取得時に即座に `effectiveStats` を再計算する。`StatBlock` の base + growth + タレント修正 → 最終値。

```
effectiveStats = base + (growth × (level - 1)) + Σ talentStatModifiers
```

**理由:** 毎フレーム再計算は無駄。タレント取得時とレベルアップ時のみ再計算すれば十分。

## Risks / Trade-offs

**[タレント内容未定]** → プレースホルダーで最小限のツリー（各ヒーロー 3-5 ノード程度）を定義。データ駆動なので後から自由に追加・変更可能。

**[スキルシステム未実装]** → `grant_skill` 効果はスロットにスキルIDを入れるところまで。スキルの実際の発動ロジックは別チケットで実装。タレントシステムはスキルIDの「箱」を管理するのみ。

**[レベル上限変更への影響]** → `XP_THRESHOLDS` と `MAX_LEVEL` を拡張するだけでタレントシステムに影響なし。ツリーのノード数を増やすだけで対応可能。

**[Colyseus Schema サイズ増加]** → `acquiredTalents: ArraySchema<string>` + スキルスロット3フィールド追加。ヒーロー4人分でもデータ量は軽微（数十バイト/ヒーロー）。

## Open Questions

- タレントツリー UI のレイアウト（ツリーの視覚的表現）→ #35 で詳細設計
- R スロットをウルト専用に制限するかどうか → 実際のバランステスト後に判断
- ボットAI がタレントを自動取得するロジック → 別チケットまたは #29 で対応
