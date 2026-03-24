You are building an MVP browser-based roguelike survival game as a local-only project with no backend and no server requirements. The goal is a clean, polished, playable prototype with very simple visuals and solid structure so it can be expanded later.

Build this as a small project that can be opened locally in a browser. Keep it lightweight, readable, and easy to extend.

## Project Goal

Create a very basic, polished roguelike survival game inspired by survival arena games.

The player controls a single available character type for now:
- Race: Human
- Class: Barbarian

The game should support:
- A home screen
- Character creation and save slot selection
- A playable survival run
- Pause menu
- Local save persistence
- End-of-run rewards
- Multiple saved characters

Do not overbuild. Keep it MVP, but make it clean and modular.

---

## Core Technical Requirements

Build this as a local browser project using only:
- HTML
- CSS
- Vanilla JavaScript
- SVG and/or Canvas for rendering simple shapes

No frameworks.
No backend.
No database.
No build step required if possible.
The game must run by opening `index.html` locally in a browser.

If needed, organize the project into a few small files such as:
- `index.html`
- `styles.css`
- `game.js`
- `save.js`
- `ui.js`
- `data.js`

Keep code readable and commented.

---

## Visual / Art Direction

Use very simple placeholder visuals only:
- Player: simple circle or simple SVG token
- Enemies: different colored/basic shapes
- Axe swing: visible arc in front of the player
- Javelins: simple line projectiles
- XP pickups: small glowing dots or circles
- Gold pickups: yellow circles
- Bosses / minibosses: larger distinct shapes

Do not spend effort on art.
Focus on game feel, readability, and structure.

---

## Main Gameplay Loop

The gameplay loop is:
1. Select or create a character from the home screen
2. Start a run
3. Survive as long as possible
4. Kill enemies
5. Gain XP and level up
6. Choose 1 of 3 upgrade options each level
7. Encounter minibosses every 5 minutes
8. Reach 20 minutes for the final boss
9. Die or finish run
10. Award gold and legacy XP
11. Save progression locally
12. Return to home screen and allow another run

---

## Controls

Use keyboard + mouse.

Required controls:
- WASD for movement
- Mouse aim / pointer determines facing direction
- Axe attacks should use facing direction
- Pause with `Escape`

The player should always face toward the mouse cursor or aiming direction.
Aim matters for directional melee attacks.

---

## Barbarian Loadout

For this MVP, the Barbarian always starts with:
- Primary melee weapon: Axe
- Ranged weapon: Javelin

No other starting choices yet.

### Axe
The axe is a directional cleave in front of the player.
Requirements:
- Visible attack arc in front of the player
- Basic cooldown
- Hits enemies in the cleave area
- Should feel like a deliberate front-facing melee attack
- Animation can be simple and short

### Javelin
The javelin is a projectile weapon.
Requirements:
- Auto-target nearest enemy
- Fires on a cooldown
- Projectile travels visibly
- Can pierce or not pierce depending on upgrade implementation
- Render as a simple line or narrow rectangle

---

## Upgrade System

On level up:
- Pause gameplay
- Present exactly 3 upgrade choices
- Player selects 1
- Then gameplay resumes

Keep upgrade pool simple and small.

Implement basic upgrade categories for both weapons.

### Axe Upgrade Pool
Create around 5 simple axe upgrade types:
1. Increase damage
2. Reduce swing cooldown
3. Increase swing arc/area
4. Add extra cleave swing
5. Chance or upgrade path to become full-circle spin attack at higher level

### Javelin Upgrade Pool
Create around 5 simple javelin upgrade types:
1. Increase damage
2. Reduce throw cooldown
3. Increase projectile speed
4. Throw additional javelins
5. Add piercing or improved targeting/range

You may also include a few generic stat upgrades if needed, but keep focus on axe and javelin.

Examples of acceptable generic upgrades:
- Move speed up
- Max HP up
- Pickup radius up

Do not create a huge content pool.
Keep level-up choices understandable and easy to test.

---

## Enemies

Create a small but functional enemy roster with escalating difficulty over a 20-minute run.

### Required enemy behaviors
Include at least:
1. Basic melee chaser
2. Fast fragile enemy
3. Ranged enemy that shoots projectiles
4. Dash enemy or swarm-style enemy that makes movement less predictable
5. Miniboss enemy type
6. Final boss

### General enemy rules
- Enemies should spawn around the edges of the arena / viewport area
- Difficulty should scale over time
- Enemy count and toughness should gradually increase
- Add some unpredictability through mixed waves and occasional bursts/swarms

### Minibosses
- Spawn approximately every 5 minutes
- Larger health pool
- Distinct behavior from basic enemies
- Reward legacy XP on defeat
- Also drop good rewards such as extra gold / XP burst

### Final Boss
- Spawn at 20 minutes
- Should be significantly harder than earlier content
- For the MVP, tune it to feel likely unbeatable on a first attempt
- It should still be functional and fair enough to test

---

## Run Progression / Scaling

Target a run structure that feels like:
- 0–5 min: manageable
- 5–10 min: noticeable pressure
- 10–15 min: dangerous mixed threats
- 15–20 min: heavy chaos
- 20 min: final boss

Implement lightweight time-based scaling:
- spawn rate increases
- enemy health increases modestly
- enemy mix evolves
- projectile enemies become more common later
- dash/swarm pressure appears later

Keep the system data-driven where possible.

---

## Arena / Camera

Keep the arena simple.
You can choose either:
- a fixed visible arena where enemies enter from edges, or
- a camera-follow system with a simple repeating background

For MVP, simplest clean option is preferred.

Player should remain clearly visible at all times.

---

## Health, Damage, and Pickups

Implement:
- Player HP
- Enemy HP
- Contact damage from melee enemies
- Damage from enemy projectiles
- Invulnerability frames after player is hit
- XP drops from enemies
- Gold drops from some enemies / bosses
- Pickup collection on overlap

Optional:
- slight pickup magnetism or pickup radius stat

---

## UI Requirements

### Home Screen
Must include:
- Game title
- Button to create new character
- List of existing saved characters
- Button to load/start run with selected character
- Display of basic character info:
  - name
  - race
  - class
  - gold
  - legacy XP
  - maybe highest survival time

### Character Creation
For now keep it very small:
- Enter character name
- Race locked to Human
- Class locked to Barbarian
- Save character locally

This is laying groundwork for more races/classes later, so structure data accordingly even though only one option exists now.

### In-Run HUD
Show:
- HP
- Level
- XP bar
- Gold this run
- Run timer
- Legacy XP earned this run
- Optional small weapon status / cooldown indicators

### Level Up Overlay
Show:
- 3 upgrade options
- short descriptions
- click to choose

### Pause Menu
Pressing Escape should open a pause overlay with:
- Resume
- Return to Home
- Restart Run (optional but useful)
- Maybe Save and Quit if needed, though full mid-run save is optional unless simple

### End-of-Run Screen
Show:
- character name
- time survived
- enemies killed
- gold earned
- legacy XP earned
- minibosses defeated
- whether final boss appeared/was defeated
- button to return home

---

## Save / Persistence Requirements

Use browser local storage.

The game must retain progress locally.

### Persisted data per character
At minimum save:
- unique id
- name
- race
- class
- total gold
- total legacy XP
- best survival time
- maybe runs played / miniboss kills

### Save system requirements
- Allow multiple characters
- Allow selecting between characters from home screen
- Creating a new character creates a new save entry
- Starting a run uses the selected character
- End-of-run rewards are added to that character and saved
- Home screen reflects updated progression

For now, do not implement the legacy skill tree itself.
Only save the currency and progression placeholders.

---

## Data Model Guidance

Please structure the code so future systems can be added cleanly:
- more races
- more classes
- more starting weapons
- pre-run loadouts
- shops/merchants
- skill tree using legacy XP
- permanent meta progression
- more bosses

Suggested data concepts:
- `characters`
- `runs`
- `weapons`
- `upgrades`
- `enemies`
- `spawnTables`
- `bossDefinitions`
- `metaCurrencies`

Even if simplified, keep names clear and extensible.

---

## Game Feel / MVP Expectations

This should not be a toy demo with no feel.
Even with simple shapes, aim for:
- smooth movement
- clear hit feedback
- readable enemy attacks
- responsive pause and menus
- clean UI hierarchy
- understandable upgrade choices
- satisfying XP pickup loop

Avoid overcomplication.
Prefer polish over scope.

---

## Acceptance Criteria

The project is successful when all of the following work:

1. Opening `index.html` locally launches the game
2. Home screen appears with create/select character flow
3. User can create multiple named characters
4. Character data persists in local storage
5. User can start a run with a selected character
6. Barbarian can move with WASD
7. Barbarian faces mouse direction
8. Axe swings in front of the player
9. Javelins auto-target nearby enemies
10. Enemies spawn and attack in distinct ways
11. Enemies drop XP and some gold
12. Player levels up and chooses 1 of 3 upgrades
13. Difficulty increases over time
14. Minibosses appear about every 5 minutes
15. Final boss appears at 20 minutes
16. Pause menu works with Escape
17. Dying ends the run and shows results
18. Gold and legacy XP are awarded and saved to the character
19. Returning to home screen shows updated progression
20. Code is organized enough to expand later

---

## Implementation Notes

Please make practical decisions without asking unnecessary follow-up questions.
Choose the simplest architecture that meets the requirements cleanly.

Where useful:
- use requestAnimationFrame game loop
- separate update/render logic
- use simple collision detection
- use plain object data structures
- use localStorage helper functions
- keep constants centralized for easy tuning

Do not add unnecessary features like:
- networking
- audio systems beyond maybe a placeholder hook
- inventory
- talent trees
- merchants
- procedural map generation
- elaborate art pipeline

---

## Deliverables

Provide the complete project files.
Output each file clearly in separate code blocks with filenames.

At minimum, include:
- `index.html`
- `styles.css`
- `game.js`

Add small helper files only if they improve clarity.

Also include:
1. a brief project structure summary
2. instructions to run locally
3. notes on where to tune difficulty, upgrade values, enemy stats, and reward values

---

## Final Quality Bar

This is an MVP foundation for a larger roguelike.
Prioritize:
- clarity
- clean structure
- local persistence
- satisfying survival gameplay loop
- easy future expansion

Do not give pseudocode.
Write the actual files.
Make everything functional.