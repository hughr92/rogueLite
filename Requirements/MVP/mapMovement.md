# PRD: World Movement System (Player-Centered Camera + Scrolling World)

## Objective

Replace the current “player moves inside a fixed container” system with a **player-centered world movement system**.

Instead of moving the player around the screen:
- The **player remains fixed at the center**
- The **world (enemies + background) moves relative to player input**

This creates the illusion of exploration and allows the game to feel like an open, continuous space.

This system must also consider **future multiplayer implications**, where multiple players share the same space.

---

## Core Design Shift

### Current System
- Player moves within screen bounds
- Enemies move relative to player position
- World is effectively static

### New System
- Player is locked to screen center
- Player input generates a **world offset**
- All entities (enemies, projectiles, background) move relative to that offset

---

## Goal

Create a system where:

- Movement feels like exploration rather than confinement
- The player is always centered on screen
- The world scrolls smoothly in all directions
- Enemy positioning and spawning adapt to a moving world
- System is compatible with future multiplayer

---

## Scope

### In Scope
- Player-centered camera system
- World offset system
- Enemy movement adaptation
- Background movement
- Spawn system adjustments
- Multiplayer movement constraints (design + basic handling)

### Out of Scope
- Procedural map generation
- Terrain collision
- Biomes or world tiles
- Network multiplayer implementation
- Camera zoom systems

---

## Core System Concept

## Player Anchor

- Player position is fixed at screen center
- Player no longer has “world coordinates” in the same way
- Instead, the world moves around the player

---

## World Offset

Introduce a global concept:

- World Offset (X, Y)

This represents how far the world has shifted relative to the player.

### Movement Rule

When player presses movement input:

- DO NOT move player position
- INSTEAD:
  - move all world objects in the opposite direction

Example:
- Player presses right
- World shifts left
- Enemies move left
- Background scrolls left

---

## Affected Systems

### 1. Enemies

Enemies must now:

- track their position relative to world space
- update position using:
  - their own movement logic (toward player)
  - plus world offset movement

Final position on screen = world position + current offset

---

### 2. Projectiles

Projectiles must:

- move independently in world space
- also be affected by world offset

This ensures:
- projectiles maintain consistent trajectories
- movement remains visually correct

---

### 3. Background

Background should:

- scroll based on world offset
- optionally loop or tile infinitely

MVP approach:
- repeating background texture
- seamless wrap or reposition when out of bounds

---

### 4. Spawning System

Enemy spawn logic must change.

#### Old Behavior
- spawn at screen edges

#### New Behavior
- spawn based on world-relative positions around player

Enemies should:
- spawn just outside visible screen bounds
- appear to enter from edges naturally as world scrolls

---

## Movement Feel

The system should feel:

- smooth
- responsive
- continuous
- directionally accurate

The player should feel like:
- they are traveling through space
- not pushing enemies around artificially

---

## Camera Behavior

- Camera is fixed to player
- No camera panning required
- No camera lag required for MVP

Optional future:
- slight camera lead in movement direction

---

## Multiplayer Considerations

## Core Constraint

In multiplayer:

- Players share the same screen space
- World movement must be unified

---

## Movement Rule (Multiplayer)

All players influence movement, but:

- There is only ONE world offset
- Players must stay within a shared viewport

---

## Player Positioning

Players are:

- allowed to move slightly within the screen
- not locked perfectly center in multiplayer

Instead:
- define a **movement boundary zone** (soft bounds)

---

## Shared Movement Behavior

### Case 1: Players Move Same Direction
- world offset follows input
- smooth shared movement

### Case 2: Players Move Different Directions
- players drift toward screen edges
- if a player reaches boundary:
  - they cannot move further outward
  - they are effectively “pushing against screen edge”

### Case 3: Majority Direction
Optional future rule:
- world moves in direction of average player input

---

## Boundary System (Multiplayer)

Define:

- a rectangular safe zone inside screen

Rules:
- players can move freely inside zone
- once at edge:
  - cannot move further outward
- prevents players from splitting apart infinitely

---

## Multiplayer Edge Behavior

If players attempt to separate:

- players on edges stop moving outward
- world movement slows or biases toward group center
- players must regroup to move effectively

---

## Collision and Interaction

This system should not break:

- enemy collision (separation system)
- projectile collision
- pickup logic

All should operate in world space.

---

## Data Model Changes

### Introduce:

- world offset (X, Y)

### Entities should track:

- world position
- screen position derived from:
  - world position
  - minus world offset

---

## Rendering Logic

For each frame:

1. Calculate world offset from player input
2. Update all entity world positions
3. Convert to screen positions using offset
4. Render everything relative to center

---

## Input Handling

### Single Player

- Input directly moves world offset

### Multiplayer (Future)

- Combine player inputs into shared movement vector
- Apply constraints based on player positions

---

## Performance Considerations

- Movement should remain lightweight
- Avoid recalculating unnecessary transforms
- Keep math simple (add/subtract offsets)

---

## Visual Feedback

The system should feel:

- like the player is moving forward
- like enemies are approaching from the world
- like the environment is continuous

Avoid:
- jitter
- snapping
- inconsistent speed

---

## Failure Cases To Avoid

- player drifting off center (single player)
- enemies sliding unnaturally
- projectiles desyncing visually
- spawn points appearing inside screen
- background not looping cleanly
- multiplayer players splitting off-screen

---

## Acceptance Criteria

This task is complete when:

1. Player is fixed at center of screen (single player)
2. Movement input shifts world instead of player
3. Enemies move correctly relative to world offset
4. Projectiles behave consistently under offset
5. Background scrolls smoothly
6. Enemies spawn just outside visible area
7. Movement feels continuous and natural
8. System does not break collision or combat
9. Multiplayer design constraints are defined:
   - shared world movement
   - player boundary zones
   - edge behavior when players separate

---

## Deliverable

Implement a player-centered world movement system where:

- player remains fixed
- world scrolls
- enemies and systems adapt accordingly
- structure supports future multiplayer constraints

Output updated project files with clean structure and readable logic.