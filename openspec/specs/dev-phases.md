# Development Phases

## Phase 1: Prototype ← CURRENT

**Goal:** Validate "fun in 5 minutes"

**Scope:** Online-first. Colyseus server-authoritative + Phaser.js client.

**Deliverables:**
- [x] Map rendering (single lane, bases, tower, bushes)
- [x] Character movement (WASD + mouse aim)
- [x] Basic attack and skill system (Q, E, R)
- [x] 3 heroes playable (BLADE, BOLT, AURA)
- [x] Minion auto-spawn and lane walking
- [x] XP gain by proximity, level-up talent choices
- [x] Bot AI (enemy team + ally if needed)
- [x] Match tempo events (3min buff, 4min boss, 5min sudden death)
- [x] Win/lose condition and match reset
- [x] Colyseus game server setup
- [x] Server-authoritative game logic
- [x] Client-side prediction + interpolation
- [x] Talent tree system with skill slots
- [ ] ECS on EC2 deployment

**Tech:** Phaser.js + Vite + TypeScript + Colyseus. Deploy to S3 + CloudFront (client) + ECS on EC2 (server).

---

## Phase 2: 2v2 Online Match

**Goal:** Public release with full 2v2

**Deliverables:**
- [ ] Room-based matchmaking (Colyseus built-in)
- [ ] Mid-match join / Bot replacement on disconnect
- [ ] Hero and map balance tuning
- [ ] Basic UI (hero select, match result)
- [ ] Monitoring and metrics (active rooms, player count, tick performance)

---

## Phase 3: Expansion (Future)

- Additional heroes per type
- Ranking system
- 5v5 mode (consider Nakama migration)
- Mobile support (touch controls)
