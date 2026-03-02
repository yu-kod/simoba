# MOBA.io — 2v2 Micro Arena

## Project Summary

Browser-based casual MOBA x .io game. 2v2 micro arena, max 5 min per match, no account required.

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

## Git Workflow

- **Git Flow:** `main` ← `develop` ← `feature/xxx`
- **GitHub default branch:** `develop` (PR auto-base, `Closes #XX` triggers on develop merge)
- **Branch naming:** Full prefix only (`feature/`). Abbreviations like `feat/` are not allowed.

## Development Flow

1. **Plan** — Create an Issue
2. **Branch** — `git checkout -b feature/xxx develop`
3. **OpenSpec** — `/opsx:new` → `/opsx:continue` (review each artifact) → `/opsx:apply` → `/opsx:verify`
   - Do NOT use `/opsx:ff` (skips user confirmation)
4. **Test** — `npm run test:unit` + `npm run test:e2e` → all PASS
5. **Self-review** — Run code-reviewer subagent, fix issues before presenting to user
6. **PR** — `feature/*` → `develop`, include Summary + Test Plan
7. **Review** — Address feedback → all checks PASS
8. **Done** — `/opsx:archive` first → then merge PR (CI openspec-check detects unarchived changes)
- **Out-of-scope work → create an Issue** (don't implement on the spot)
