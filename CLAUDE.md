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

**Phase 1: Prototype (Bot Battle)**
- No backend. Phaser.js standalone.
- Static hosting only.
- Goal: "Fun in 5 minutes" validation.

## Design Principles

- MOBA depth with .io accessibility
- Geometric visual style (no image assets, Canvas shapes only)
- Immutable state patterns (per coding-style rules)
- Many small files, feature-based organization
