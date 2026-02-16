## 1. 実装

- [x] 1.1 GameScene に `debugSwitchHero(type)` private メソッドを追加（HeroState 再生成、HeroRenderer destroy/再生成、カメラ再追従）
- [x] 1.2 GameScene の `create()` に数字キー 1/2/3 のキーリスナーを登録

## 2. テスト

- [x] 2.1 ユニットテスト: スキップ（純粋関数レベルでテスト可能な部分なし。debugSwitchHero は Phaser Scene 依存の private メソッド）
- [x] 2.2 E2E テスト: キー 1/2/3 押下でヒーローの見た目が切り替わることを検証

## 3. Issue 作成

- [x] 3.1 GitHub Issue を作成: リリース前にデバッグヒーロー切り替え機能を削除する (#67)
