## 1. Shared: タレントデータ型定義

- [x] 1.1 `shared/talents/types.ts` — `TalentEffect` tagged union、`TalentNode`、`TalentTreeDefinition` 型を定義 (spec: talent-tree, talent-effects)
- [x] 1.2 `shared/talents/types.ts` — `SkillSlot` 型 (`'Q'|'E'|'R'`) を定義 (spec: skill-slots)
- [x] 1.3 `shared/talents/` — BLADE / BOLT / AURA 各ヒーローのプレースホルダーツリー定義（各3-5ノード、1つは `grant_skill` 効果を含む） (spec: talent-tree)
- [x] 1.4 ユニットテスト: ツリー定義の整合性チェック（ID一意性、prerequisites が有効ID、DAG検証）

## 2. Server: Schema 拡張

- [x] 2.1 `HeroSchema` に `acquiredTalents: ArraySchema<string>` を追加 (spec: talent-tree)
- [x] 2.2 `HeroSchema` に `ownedSkills: ArraySchema<string>` を追加 (spec: talent-effects)
- [x] 2.3 `HeroSchema` に `skillSlotQ`, `skillSlotE`, `skillSlotR` (string) を追加 (spec: skill-slots)
- [x] 2.4 ユニットテスト: 新フィールドの初期値とシリアライゼーション確認

## 3. Server: タレント取得ロジック

- [x] 3.1 `server/src/game/ServerTalentSystem.ts` — `acquireTalent(hero, talentId, treeDef)` 関数: ポイント残高・前提条件・重複チェック → 取得 (spec: talent-tree)
- [x] 3.2 `GameRoom.ts` — `acquireTalent` メッセージハンドラ登録 (spec: talent-tree)
- [x] 3.3 ユニットテスト: 正常取得、ポイント不足、前提未達、重複取得の全シナリオ

## 4. Server: タレント効果適用

- [x] 4.1 `server/src/game/ServerTalentSystem.ts` — `applyTalentEffects(hero, effects)` 関数: 効果タイプごとに switch で適用 (spec: talent-effects)
- [x] 4.2 `server/src/game/ServerTalentSystem.ts` — `recalculateEffectiveStats(hero, treeDef)` 関数: base + growth + talent modifiers → HeroSchema のステータスフィールドを更新 (spec: talent-effects)
- [x] 4.3 `grant_skill` 効果で `ownedSkills` に追加（重複防止） (spec: talent-effects)
- [x] 4.4 既存の `applyStatsGrowth` を `recalculateEffectiveStats` に統合または連携 (spec: talent-effects)
- [x] 4.5 ユニットテスト: stat_modifier (flat/percent)、grant_skill、複数効果の重複適用、effectiveStats 計算式

## 5. Server: スキルスロット管理

- [x] 5.1 `server/src/game/ServerSkillSlotSystem.ts` — `assignSkillSlot(hero, skillId, slot)` 関数: ownedSkills 検証 → 空スロットへの装着 (spec: skill-slots)
- [x] 5.2 `server/src/game/ServerSkillSlotSystem.ts` — `swapSkillSlots(hero, slotA, slotB, isInBase)` 関数: 拠点チェック → swap (spec: skill-slots)
- [x] 5.3 `server/src/game/ServerSkillSlotSystem.ts` — `unequipSkillSlot(hero, slot, isInBase)` 関数: 拠点チェック → 空文字に設定 (spec: skill-slots)
- [x] 5.4 `GameRoom.ts` — `assignSkillSlot`, `swapSkillSlots`, `unequipSkillSlot` メッセージハンドラ登録 (spec: skill-slots)
- [x] 5.5 ユニットテスト: 装着(成功/失敗)、入れ替え(拠点内/拠点外)、解除(拠点内/拠点外)の全シナリオ

## 6. Server: レベルアップ連携

- [x] 6.1 `xpUtils.ts` のレベルアップ処理で `talentPoints` 加算を確認（既存実装の動作確認） (spec: hero-kill-xp)
- [x] 6.2 レベルアップ時に `recalculateEffectiveStats` を呼び出す連携を追加 (spec: talent-effects)
- [x] 6.3 ユニットテスト: レベルアップ → talentPoints 加算 → タレント取得 → ステータス反映の一連フロー

## 7. Client: タレントツリー UI

- [x] 7.1 `src/scenes/ui/TalentTreeOverlay.ts` — オーバーレイコンテナ: 半透明背景、Tab キーで開閉 (spec: talent-tree)
- [x] 7.2 ツリーノード描画: ノード間の接続線、ノードアイコン（幾何学スタイル）、取得済み/取得可能/ロック中の視覚的区別 (spec: talent-tree)
- [x] 7.3 ノードクリック → `acquireTalent` メッセージ送信 (spec: talent-tree)
- [x] 7.4 `acquiredTalents` の state 変更を listen してツリー UI をリアルタイム更新 (spec: talent-tree)

## 8. Client: スキルスロット UI（ツリー画面内）

- [x] 8.1 所持スキル一覧パネル: `ownedSkills` を監視して表示 (spec: skill-slots)
- [x] 8.2 Q/E/R スロットパネル: `skillSlotQ/E/R` を監視して表示 (spec: skill-slots)
- [x] 8.3 ドラッグ&ドロップ: 所持スキル → 空スロット（装着） (spec: skill-slots)
- [x] 8.4 ドラッグ&ドロップ: スロット → 所持スキル（解除）、スロット → スロット（入れ替え） (spec: skill-slots)
- [x] 8.5 拠点外での入れ替え/解除をグレーアウト表示 + ツールチップ (spec: skill-slots)

## 9. Client: HUD 連携

- [x] 9.1 HUD にタレントボタン追加（クリックでツリー開閉） (spec: talent-tree)
- [x] 9.2 未使用 talentPoints > 0 のときバッジ表示 (spec: talent-tree)
- [x] 9.3 HUD のスキルスロット表示を `skillSlotQ/E/R` から読み取るように更新 (spec: skill-slots)
