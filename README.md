# Barbarian Last Stand (MVP)

Local-only browser roguelike survival prototype built with HTML, CSS, and vanilla JavaScript.

## Project Structure

- `index.html` - app layout (home screen, canvas, overlays)
- `styles.css` - UI and HUD styling
- `data.js` - game content and tuning tables (weapons, enemies, spawns, upgrades, scaling)
- `save.js` - localStorage character persistence
- `ui.js` - DOM/UI controller for menus and overlays
- `game.js` - game loop, combat, enemy AI, progression, rewards

## Run Locally

1. Open `index.html` directly in a browser.
2. Create a character from the home screen.
3. Select the character and press **Start Run**.

Home screen includes a read-only skill tree panel with tabs:
- `Weapons` (Axe + Javelin tree outline)
- `Class` (Barbarian concept draft with branch cards, point spending, and capstone previews)
- `Inventory` (character-specific equipment slots + 3 storage tabs with 30 slots each)
  - supports drag-and-drop moving between equipment and storage slots

No backend, package install, or build step is required.

## Tuning Guide

### Difficulty and Scaling

- `data.js` -> `RUN`:
  - `baseSpawnRatePerSecond`
  - `healthScalingPerMinute`
  - `damageScalingPerMinute`
  - `finalBossTimeSeconds`
  - `minibossIntervalSeconds`
- `data.js` -> `SPAWN_TABLES`:
  - time windows (`start`, `end`)
  - enemy mix (`weights`)
  - pressure (`spawnRateMultiplier`, `packMin`, `packMax`, `burstChance`)

### Enemy Stats and Behaviors

- `data.js` -> `ENEMIES`:
  - base hp/damage/speed/radius/rewards
  - ranged cadence (`shotCooldown`, `preferredRange`, `projectileSpeed`)
  - dash cadence (`dashCooldown`, `dashDuration`, `dashMultiplier`)

### Upgrade Values

- `data.js` -> `UPGRADES`:
  - `type` (`generic`, `path`, `ultimate`)
  - `maxRank`
  - `weight`
  - unlock rules (`requirements`)
- `data.js` -> `TOTAL_UPGRADE_CAPACITY`:
  - total finite upgrades per run (currently `32`)
- `data.js` -> `SKILL_TREES`:
  - weapon path labels, max levels, and ultimate requirement text shown in menu UI

### Rewards and Progression

- `data.js` -> `RUN`:
  - `goldRewardPerSecond`
  - `legacyPerMinute`
- `data.js` -> `LEGACY_PROGRESSION`:
  - controls Legacy XP leveling pace for class skill points
- `data.js` -> `ENEMIES.miniboss.legacyReward` and `ENEMIES.finalBoss.legacyReward`
- `data.js` -> `LEVEL_CURVE` for leveling speed
