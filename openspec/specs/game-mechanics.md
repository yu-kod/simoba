# Game Mechanics

## Map

- **Layout:** Horizontal single-lane. Blue base (left) ↔ Red base (right).
- **Towers:** 1 per team.
- **Boss:** 1 at center (spawns at 4:00).
- **Bushes:** 2-3 along lane edges (top/bottom). Break line of sight for ambush plays.
- **No jungle.** Minimal map cognition load.

## Players

- **Format:** 2v2
- **Roles:** Front-line + Back-line (minimum viable role split)
- **Disconnect:** Bot replaces disconnected player. Mid-match join OK.

## Minions

- Auto-spawn at fixed intervals from each base.
- Walk the lane automatically.
- **No last-hitting.** XP gained by proximity when enemy minions die.
- Player decision: push lane or hold lane.

## Growth System

- **Max level:** 5. No items.
- **Level up:** Binary talent choice appears on screen ("Skill A upgrade" OR "Skill B upgrade").
- **Lv3:** Ultimate unlocked.
- **Lv5:** Ultimate enhanced.
- Zero build knowledge required. Different builds possible each match.

## Match Tempo

| Time | Event | Effect |
|------|-------|--------|
| 0:00 | Match start | Standard minion waves |
| 3:00 | Minion buff | Minions become stronger, game accelerates |
| 4:00 | Boss spawn | Center of map. Killing team gains major advantage |
| 5:00 | Sudden death | All structures lose HP/sec. Match guaranteed to end |

## Controls

| Input | Action |
|-------|--------|
| WASD | Movement |
| Mouse | Aim direction |
| Left click | Basic attack |
| Q | Skill 1 |
| E | Skill 2 |
| R | Ultimate (unlocked at Lv3) |
| Space | Dodge dash (long cooldown) |

## Visual Style

- **Geometric / .io style.** Characters = circles + polygons.
- **No image assets.** Pure Canvas/WebGL drawing.
- Top-down 2D view.
