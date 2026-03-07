## 1. 定数・XPカーブの拡張（Backend）

- [x] 1.1 `shared/constants.ts` の `MAX_LEVEL` を 5 → 30 に変更 [talent-tree-expansion]
- [x] 1.2 `XP_THRESHOLDS` を 30 エントリのセグメント型累積XPカーブに拡張（序盤30〜80, 中盤100〜250, 終盤300〜500） [talent-tree-expansion]
- [x] 1.3 `RESPAWN_TIMES` を 31 エントリ（Lv0〜Lv30）に拡張 [talent-tree-expansion]
- [x] 1.4 `src/domain/constants.ts` の re-export を更新（必要に応じて） [talent-tree-expansion]
- [x] 1.5 既存の XP・レベルアップ関連ユニットテストを新しい定数に合わせて更新・追加 [xp-level-sync]

## 2. レベルアップ・タレントポイントのロジック調整（Backend）

- [x] 2.1 `computeNewLevel` 等のレベルアップ判定が 30 レベル対応で正しく動作することを確認するテストを追加 [xp-level-sync]
- [x] 2.2 `effectiveStats` 計算式を `base + (growth × level)` に確認・修正（現在 `growth × (level - 1)` の場合） [talent-effects]
- [x] 2.3 effectiveStats 計算のユニットテストを Lv0〜Lv30 の範囲で追加 [talent-effects]

## 3. タレントツリー定義の拡張（Shared）

- [x] 3.1 `TalentNode` 型の `cost` フィールドのバリデーションを追加（1〜3 の範囲チェック） [talent-tree]
- [x] 3.2 BLADE のタレントツリーを 45〜55 ノードに拡張（コスト1/2/3の混在） [talent-tree]
- [x] 3.3 BOLT のタレントツリーを 45〜55 ノードに拡張 [talent-tree]
- [x] 3.4 AURA のタレントツリーを 45〜55 ノードに拡張 [talent-tree]
- [x] 3.5 各ツリー定義のバリデーションテスト（ノード数、コスト比率、prerequisites の整合性） [talent-tree]

## 4. Bot タレント消費の可変コスト対応（Backend）

- [x] 4.1 Bot のタレント選択ロジックを可変コスト対応に更新（`cost <= talentPoints` のフィルタリング） [bot-talent-spending]
- [x] 4.2 Bot タレント消費のユニットテスト追加（コスト不足スキップ、混在コストでの選択） [bot-talent-spending]

## 5. タレントツリー UI の扇状レイアウト変更（Frontend）

- [x] 5.1 `TalentTreeOverlay.ts` の `computeLayout` を下→上の扇状レイアウトに変更 [talent-tree]
- [x] 5.2 ノードにコスト表示（1/2/3）を追加 [talent-tree]
- [x] 5.3 ノード数増加に伴う UI 視認性テスト、必要に応じてパン・ズーム操作を追加 [talent-tree-expansion]

## 6. スペック・ドキュメント更新

- [x] 6.1 `openspec/specs/heroes.md` のタレントシステムセクションを更新（レベル30、可変コスト） [talent-tree-expansion]
- [x] 6.2 `openspec/specs/game-mechanics.md` の Growth System セクションを更新 [talent-tree-expansion]
