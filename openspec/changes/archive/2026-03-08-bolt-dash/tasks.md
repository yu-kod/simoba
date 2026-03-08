## 1. スキル定義追加

- [x] 1.1 `shared/skills/skillDefinitions.ts` に `bolt-dash` エントリを追加（effectType: dash, distance: 180, duration: 0.05, damage: 0, cooldown: 6, targeting: direction）

## 2. テスト

- [x] 2.1 `bolt-dash` のスキル定義が正しく取得できることをテスト（getSkillDefinition）
- [x] 2.2 `bolt-dash` で executeSkill を実行し、dashTimer/dashSpeed が正しく設定され damage=0 であることをテスト
- [x] 2.3 既存の dashSystem テストの「zero-damage dash skip」が bolt-dash パラメータでも動作することを確認

## 3. 検証

- [x] 3.1 `npm run test:unit` 全パス確認
- [x] 3.2 `npm run lint` パス確認
