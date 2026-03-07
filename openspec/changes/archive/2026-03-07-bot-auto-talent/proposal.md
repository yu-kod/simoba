## Why

Bot ヒーローはレベルアップでタレントポイントを獲得するが、`acquireTalent` メッセージを送信しないため一切消費しない。レベル5到達時に5ポイント未消費となり、同レベルの人間プレイヤーよりステータスが大幅に低くなるバランス問題がある（PR #176 の CI レビューで指摘）。

## What Changes

- Bot がタレントポイントを保持している場合、サーバー側で自動的にタレントを取得するロジックを追加
- 選択戦略: prerequisites が満たされている取得可能なノードからランダムに1つ選んで取得
- Bot 専用のタレント消費処理を `gameUpdate()` ループ内に組み込み

## Capabilities

### New Capabilities
- `bot-talent-spending`: Bot がレベルアップ時に自動でタレントポイントを消費し、タレントツリーからノードを取得するサーバーサイドロジック

### Modified Capabilities
（なし — 既存の `talent-tree` スペックの要件は変更しない。Bot は既存の `acquireTalent` 関数を内部的に呼び出すだけ）

## Impact

- **サーバー**: `ServerBotSystem.ts` に新関数追加、または新ファイル `ServerBotTalentSystem.ts` を作成
- **GameRoom**: `gameUpdate()` 内でレベルアップ処理後に Bot タレント消費を呼び出し
- **テスト**: Bot タレント自動消費のユニットテスト追加
- **クライアント**: 変更なし（Colyseus state sync で Bot の `acquiredTalents` が自動反映）
- **バランス**: Bot と人間プレイヤーの成長曲線が同等になる
