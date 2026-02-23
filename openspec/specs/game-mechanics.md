# Game Mechanics

## Map

- **Layout:** Horizontal single-lane. Blue base (left) ↔ Red base (right).
- **World size:** 3200x720 (px). Camera follows player within this world.
- **Towers:** 1 per team (positioned between base and lane center).
- **Boss:** 1 at center of the lane (spawns at 4:00).
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
| Right click | Basic attack |
| Q | Skill 1 |
| E | Skill 2 |
| R | Ultimate (unlocked at Lv3) |
| Space | Dodge dash (long cooldown) |
| Left click | Confirm skill target (Normal Cast mode) |

### Skill Targeting Modes

- **Normal Cast**: Press skill key to enter targeting mode, left click to confirm and fire, right click to cancel.
- **Quick Cast**: Skill fires at mouse position when key is released. Right click during key hold cancels.

## Universal Mechanics

These mechanics are shared by all heroes and are not counted as hero abilities:

- **Dodge Dash (Space):** Short invincibility-frame dash in movement direction. Long cooldown (~10s). Universal escape/engage tool.

## Visual Style

- **Geometric / .io style.** Characters = circles + polygons.
- **No image assets.** Pure Canvas/WebGL drawing.
- Top-down 2D view.
