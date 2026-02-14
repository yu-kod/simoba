# Development Phases

## Phase 1: Prototype (Bot Battle) ← CURRENT

**Goal:** Validate "fun in 5 minutes"

**Scope:** No backend. Phaser.js standalone. Static hosting only.

**Deliverables:**
- [ ] Map rendering (single lane, bases, tower, bushes)
- [ ] Character movement (WASD + mouse aim)
- [ ] Basic attack and skill system (Q, E, R, Space dodge)
- [ ] 3 heroes playable (BLADE, BOLT, AURA)
- [ ] Minion auto-spawn and lane walking
- [ ] XP gain by proximity, level-up talent choices
- [ ] Bot AI (enemy team + ally if needed)
- [ ] Match tempo events (3min buff, 4min boss, 5min sudden death)
- [ ] Win/lose condition and match reset

**Tech:** Phaser.js + Vite + TypeScript. Deploy to S3 + CloudFront or any static host.

---

## Phase 2: 1v1 Online

**Goal:** Validate real-time multiplayer

**Deliverables:**
- [ ] Colyseus game server setup
- [ ] Server-authoritative game logic migration
- [ ] Client-side prediction + interpolation
- [ ] ECS on EC2 deployment
- [ ] 2-player online match

---

## Phase 3: 2v2 Full Match

**Goal:** Public release

**Deliverables:**
- [ ] Room-based matchmaking (Colyseus built-in)
- [ ] Mid-match join / Bot replacement on disconnect
- [ ] Hero and map balance tuning
- [ ] Basic UI (hero select, match result)

---

## Phase 4: Expansion (Future)

- Additional heroes per type
- Ranking system
- 5v5 mode (consider Nakama migration)
- Mobile support (touch controls)
