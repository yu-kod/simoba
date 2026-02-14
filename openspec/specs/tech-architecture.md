# Tech Architecture

## Frontend

- **Engine:** Phaser.js 3.x
- **Build Tool:** Vite 6.x (dev server + bundler)
- **Rendering:** 2D top-down (Canvas / WebGL)
- **Resolution:** 1280x720 (Scale.FIT + CENTER_BOTH)
- **Physics:** Arcade Physics (gravity: 0, top-down)
- **Hosting:** S3 + CloudFront (static files)
- **Language:** TypeScript (strict mode)

## Backend (Phase 2+)

Phase 1 has no backend. Bot-only, runs entirely client-side.

- **Game Server:** Colyseus (Node.js)
- **Protocol:** WebSocket (server-authoritative)
- **Tick Rate:** 60Hz fixed
- **Client-side:** Prediction + linear interpolation

### Why Colyseus

- Official Phaser.js integration tutorial
- JS/TS full-stack unification
- `npm install` and go. No DB required.
- Built-in binary diff state sync
- Built-in room-based matchmaking
- Sufficient for 2v2 small rooms
- WebSocket-only (no UDP), acceptable for casual .io MOBA

### Future Alternatives

| Candidate | Language | When to consider |
|-----------|----------|-----------------|
| Nakama | Go | 5v5 expansion, rankings, friends, rUDP needed |
| Custom (Rust) | Rust | Heavy physics, max performance |
| GameLift | Any | Thousands of concurrent users |

## AWS Infrastructure

```
[S3 + CloudFront] → Static Phaser.js client

[ECS on EC2 (t3.small)] ← WebSocket → Colyseus game server
```

### Why ECS on EC2

- ECS itself is free. Pay only for EC2.
- Docker-based deploy = no env drift.
- Auto-restart on container crash.
- Scale by adding EC2 instances.

### Cost Estimate (Monthly)

| Component | Cost | Notes |
|-----------|------|-------|
| EC2 t3.small (1 instance) | ~$20 | Handles dozens of rooms |
| ECS on EC2 | ~$20 | Same as EC2, no ECS surcharge |
| ECS on Fargate | ~$35-40 | No EC2 management but more expensive |
| S3 + CloudFront | ~$1-3 | Nearly free at low traffic |

Initial monthly cost: **~$20**.

## Infrastructure as Code

- **Tool:** Terraform (>= 1.0)
- **Local dev:** LocalStack (Docker Compose) for AWS service emulation
- **Structure:**
  - `infrastructure/terraform/modules/` — reusable modules (static-hosting)
  - `infrastructure/terraform/environments/local/` — LocalStack config
  - `infrastructure/terraform/environments/prod/` — Production AWS config
- **State:** S3 backend with DynamoDB locking (prod)

## CI/CD

- **Platform:** GitHub Actions
- **Claude Code Review:** Auto-reviews all non-draft PRs targeting `develop`
- **Claude Code (@claude):** On-demand via `@claude` mention in PR/issue comments
