# PR Auto — アーカイブ → PR作成 → レビュー待機 → 修正まで自動実行

OpenSpec アーカイブ、PR 作成、CI レビュー待機・修正を一気通貫で実行する。

**Input**: なし（現在のブランチから自動検出）

## Steps

### 1. OpenSpec アーカイブ確認

`openspec/changes/` に未アーカイブの change があるか確認:
```bash
openspec list --json
```

アクティブな change がある場合は自動でアーカイブを実行する（Skill tool で `opsx:archive` を呼ぶ）。
なければスキップ。

### 2. Lint & テスト

```bash
npm run lint
npm run test:unit
```

失敗したらここで停止。

### 3. コミット & プッシュ & PR 作成 & レビュー待機（シェル一括）

以下を **1つの Bash コマンド** で実行する。
タイムアウトは 600000ms（10分）に設定し、`run_in_background: false` で結果を待つ。

```bash
# --- コミット ---
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "feat: <自動生成メッセージ>"
fi

# --- プッシュ ---
git push -u origin HEAD

# --- PR 作成（既存なら取得） ---
PR_URL=$(gh pr view --json url -q '.url' 2>/dev/null)
if [ -z "$PR_URL" ]; then
  PR_URL=$(gh pr create --fill --json url -q '.url')
fi
PR_NUM=$(gh pr view --json number -q '.number')
echo "PR: $PR_URL"

# --- Claude Code Review アクション完了を待機 ---
# ワークフロー "Claude Code Review" の最新 run を取得して完了を待つ
echo "Waiting for Claude Code Review action to complete..."
BRANCH=$(git branch --show-current)
MAX_WAIT=20
for i in $(seq 1 $MAX_WAIT); do
  sleep 15
  RUN_ID=$(gh run list --branch "$BRANCH" --workflow "Claude Code Review" --limit 1 --json databaseId,status -q '.[0].databaseId' 2>/dev/null)
  if [ -n "$RUN_ID" ]; then
    break
  fi
  echo "Waiting for run to appear... $i/$MAX_WAIT"
done

if [ -z "$RUN_ID" ]; then
  echo "NO_REVIEW_RUN"
  exit 0
fi

echo "Found run $RUN_ID, waiting for completion..."
gh run watch "$RUN_ID" --exit-status 2>/dev/null || true

# --- 完了後にコメントを確認 ---
IC=$(gh api "repos/{owner}/{repo}/issues/$PR_NUM/comments" --jq 'length')
PC=$(gh api "repos/{owner}/{repo}/pulls/$PR_NUM/comments" --jq 'length')
COUNT=$((IC + PC))
if [ "$COUNT" -gt 0 ]; then
  echo "REVIEW_COMMENTS_FOUND"
else
  echo "NO_REVIEW_COMMENTS"
fi
```

- 出力に `REVIEW_COMMENTS_FOUND` が含まれる → Step 4 へ
- 出力に `NO_REVIEW_COMMENTS` が含まれる → 「レビューコメントなし、LGTM」と表示して終了
- 出力に `NO_REVIEW_RUN` が含まれる → 「レビュー Action が見つかりません」と表示して終了

**注意**: コミットメッセージは `git diff --cached` の内容から適切な conventional commit メッセージを事前に決定してからシェルに渡すこと。

### 4. 自律的に修正

レビューコメントが見つかったら Skill tool で `pr-fix` を呼び、引数に PR 番号を渡す。
例: `skill: "pr-fix", args: "223"`
（pr-fix は自律判断モードで動作する）

### 5. 完了

修正がプッシュされたら完了を表示:
```
PR: <URL>
Review comments fixed and pushed.
```

## Guardrails

- テストが通らない状態ではPRを作らない
- レビュー修正後もテストが通ることを確認してからプッシュ
- セキュリティ関連の指摘は必ず FIX
- `gh run watch` で Claude Code Review アクション完了を待機（最大5分で run 検出、その後 `gh run watch` で完了まで待つ）
- コミットメッセージはシェル実行前に確定させる（シェル内で対話しない）
