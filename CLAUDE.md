# MOBA.io — 2v2 Micro Arena

## Project Summary

Browser-based casual MOBA x .io game. 2v2 micro arena, ~5-10 min per match, no account required.

## Specs

All game/tech specs live in `openspec/specs/`:

| File | Contents |
|------|----------|
| `game-mechanics.md` | Map, minions, match tempo, controls, growth system |
| `heroes.md` | Hero definitions, skills, talent choices |
| `tech-architecture.md` | Phaser.js, Vite, Colyseus, Terraform, AWS infra, CI/CD |
| `dev-phases.md` | Phase 1-4 deliverables and goals |

## Tech Stack

- **Frontend:** Phaser.js 3.x (Canvas/WebGL, 2D top-down)
- **Build:** Vite 6.x (dev server + bundler)
- **Backend (Phase 2+):** Colyseus on Node.js (WebSocket)
- **Infra:** Terraform + AWS (S3 + CloudFront static, ECS on EC2 game server)
- **CI/CD:** GitHub Actions (Claude Code auto-review)
- **Language:** TypeScript (strict mode)

## Current Phase

**Phase 1: Prototype**
- Online-first: Colyseus server + Phaser.js client.
- Goal: "Fun in 5 minutes" validation.

## Design Principles

- MOBA depth with .io accessibility
- Geometric visual style (no image assets, Canvas shapes only)
- Many small files, feature-based organization

## Design Quality

- **Reusability** — Don't repeat logic. Extract shared code to `shared/` or generic methods.
- **Layered architecture** — Clear layer responsibilities: Schema → GameRoom → System → Pure functions.
- **Separation of concerns** — 1 module = 1 responsibility. Separate judgment logic from state mutation (e.g. `checkTowerDestroyed()` vs `endMatch()`).
- **Structural correctness** — Follow existing design patterns. Record reasons in design.md when introducing new patterns.
- **Dependency direction** — Inheritance/implementation direction must be correct. Upper layers must not depend on lower layers.

## Architecture: Online-First

- **Server-authoritative is the standard** — Game logic lives on the server.
- **No offline-only implementations** — Don't add individual logic to OfflineGameMode.
- **Future:** Offline mode → local Colyseus server reusing the same GameRoom logic (Issue #143).

## Coding Rules

- **Immutability** — Domain layer creates new objects, no mutation. (Exception: Colyseus Schema is mutated directly on server.)
- **File size** — 200-400 lines typical, 800 max. Split when larger.
- **Feature-based organization** — Organize by feature/domain (`domain/systems/`, `scenes/effects/`), not by type (`models/`, `utils/`).
- **No hardcoded balance values** — Game balance numbers (damage, timers, XP, growth rates, etc.) must be centralized in constant tables for easy tuning later.
- **Interface 変更時はモック更新必須** — `GameMode`, `ServerHeroState`, `HeroState` 等の共有インターフェースにフィールドを追加・変更した場合、テストファイルのモック/ファクトリ関数も同時に更新する。`npx tsc --noEmit` で CI 前に検証。

## Git Workflow

- **Git Flow:** `main` ← `develop` ← `feature/xxx`
- **GitHub default branch:** `develop` (PR auto-base, `Closes #XX` triggers on develop merge)
- **Branch naming:** Full prefix only (`feature/`). Abbreviations like `feat/` are not allowed.

## Development Flow

1. **Plan** — Create an Issue
2. **Branch** — `git checkout -b feature/xxx develop`
3. **OpenSpec** — `/opsx:new` → `/opsx:continue` (review each artifact) → `/opsx:apply` → `/opsx:verify`
   - Do NOT use `/opsx:ff` (skips user confirmation)
   - **スキップ可能なケース:** 仕様変更を伴わないタスクは OpenSpec 不要。具体的には:
     - テスト追加のみ（既存実装に対するテスト）
     - バグ修正（仕様変更なし）
     - chore（リファクタリング、依存更新、lint 修正等）
     - ドキュメント更新
4. **Test** — `npm run test:unit` + `npm run test:e2e` → all PASS
5. **Self-review** — Run code-reviewer subagent, fix issues before presenting to user
6. **PR** — `feature/*` → `develop`, include Summary + Test Plan
7. **Review** — Address feedback → all checks PASS
8. **Done** — `/opsx:archive` first → then merge PR (CI openspec-check detects unarchived changes)
- **Out-of-scope work → create an Issue** (don't implement on the spot)
- **Task breakdown** — Before making changes, create a todo list breaking the feature into discrete tasks. Group by backend vs frontend. Implement backend first and verify with backend tests, then frontend and verify with frontend tests. Finally run E2E (`npm run test:e2e`) for integration. Check off each task as completed.
- **End-to-end completion** — For each task: implement code → write/update tests → run `npm test` and fix failures → run `npm run lint` and fix issues. Do not stop until all tests and lint pass.

## General Conventions

- **TypeScript only** — Always write new code in TypeScript. When editing config files (`.claude.json`, `settings.json`, etc.), prefer using the Write tool to write the complete file rather than partial edits to avoid merge conflicts.

## PR & Git Workflow

- Use `gh pr create` directly with flags (e.g., `gh pr create --title '...' --body '...'`). Avoid interactive shell prompts or piping.
- For GitHub operations (issues, PRs, checks), prefer `gh` CLI over GitHub MCP.
- **Issue 探しは open のみ** — 次のタスクを選ぶ際は open Issue だけを見る。closed Issue の機能が実装済みであることを前提に判断する。

## Debugging

- **Preflight diagnostics** — Before starting work on test failures or CI issues, run these checks first:
  1. Check for stale processes on dev ports (3000, 3001, 5173, 8080) with `lsof -i :<port>` and kill orphans
  2. Verify shell environment: `echo $SHELL && ls .`
  3. Check `git status` for clean working tree
  4. Verify deps in sync: `npm ls --depth=0 2>&1 | head -20`
- **Root cause first** — Diagnose by checking logs and process state, not just error messages. Don't jump to build config or dependency issues before ruling out environment problems.
- **Local CI gate** — Push and open a PR only after `npm test && npm run test:e2e` pass locally.
- **Playwright ブラウザテスト** — Playwright MCP でブラウザ操作する際は `localhost:3000` を使用する。サーバーが起動していなければユーザーに起動を依頼する。スクリーンショットは `.playwright-mcp/` 配下に保存する（ルートディレクトリに保存しない）。

## テト記憶エンジン連携

テト（重音テト AI）の長期記憶エンジンと連携する。セッションの作業内容を保存し、過去の文脈を検索できる。

### 保存（セッション終了時）

タスク完了・セッション終了前に、以下のコマンドで作業内容を保存する：

```bash
echo "【日付】$(date +%Y-%m-%d)
【プロジェクト】simoba
【作業内容】{やったことの要約}
【決定事項】{重要な設計判断・方針変更}
【次のステップ】{残タスク}" | ~/.local/bin/teto-memory-save.sh "session-$(date +%s)" "simoba"
```

- Lambda がチャンク化・ベクトル化を処理するので、テキストをそのまま送ればよい
- 要約は簡潔に（日本語OK）

### 検索（セッション開始時）

新しいセッションで前回の文脈が必要なとき、関連記憶を検索する：

```bash
curl -s "https://bo4dr2bvka.execute-api.ap-northeast-1.amazonaws.com/prod/memory/search?q={検索クエリ}&source=claude-code-simoba" \
  -H "x-api-key: ${TETO_MEMORY_API_KEY}" | jq '.results[:3]'
```

- セッション開始時に前回の作業を思い出すために使う
- ユーザーが「前回何やったっけ」と聞いたときに使う

## Design & Spec Work

- When a design spec or proposal document has already been reviewed and approved by the user, treat all details in it as requirements. Do not rearrange or reinterpret layout/positioning decisions that were explicitly stated in earlier phases.
- When the user provides numbered hard constraints, follow them exactly. If any constraint conflicts with best practices, flag it but do not override.
