# PRD: Small Terrain Obstacles and Collision System (MVP)

## Overview

This document defines the MVP implementation for adding small terrain elements into the game world that block movement. These terrain objects should create more interesting navigation by forcing both the player and enemies to move around them.

The goal is to make the map feel less empty, add light positional strategy, and introduce simple pathing constraints without overcomplicating the current gameplay.

---

## Goals

- Add small terrain elements to the game map
- Prevent the player from moving through these terrain elements
- Prevent enemies from moving through these terrain elements
- Force both player and enemies to navigate around obstacles
- Keep the implementation lightweight and scalable for MVP

---

## Non-Goals

- No destructible terrain in this phase
- No terrain that changes state during combat
- No height system or vertical traversal
- No complex environmental interactions
- No line-of-sight blocking unless already supported elsewhere

---

## Core Feature Summary

Introduce small terrain objects that spawn on the map as static obstacles.

These obstacles:

- Have a visible sprite or placeholder art
- Have collision enabled
- Block movement for both player and enemies
- Remain fixed in place during a run
- Cannot be pushed or moved
- Should be placed so they do not trap the player unfairly

Examples of terrain elements:

- Rocks
- Tree stumps
- Crates
- Broken pillars
- Bone piles
- Bushes
- Small ruins debris

For MVP, placeholder shapes or simple sprites are acceptable.

---

## Design Intent

Terrain should make the level feel more alive and create movement decisions without frustrating the player.

Desired gameplay outcomes:

- The player kites enemies around obstacles
- Enemies bunch up or route around terrain
- The map gains visual variety
- Positioning becomes slightly more tactical

Terrain should not:

- Completely block large sections of the map
- Spawn in a way that traps the player on load
- Make navigation feel cramped or annoying
- Break enemy movement logic

---

## Terrain Object Requirements

Each terrain element must support the following:

### Visual Representation

- Rendered in the world as a map object
- Uses placeholder art or simple sprites
- Has a consistent footprint that matches its collision area closely enough for MVP

### Collision

- Blocks player movement
- Blocks enemy movement
- Does not move when touched
- Does not get destroyed

### Static Placement

- Spawned when the level is generated or loaded
- Remains fixed for the duration of the run

---

## Collision Rules

### Player Collision

When the player attempts to move into terrain:

- Movement should stop at the terrain boundary
- Player should slide naturally if moving diagonally against the edge, if the movement system already supports sliding
- Player should never overlap the terrain collider

### Enemy Collision

When enemies move toward the player:

- Enemies should not move through terrain
- Enemies should attempt to route around terrain
- If pathfinding is not yet advanced, enemies should at minimum be prevented from clipping through obstacles

### Shared Rule

Terrain obstacles must use the same blocking logic for both player and enemies unless a future enemy type is intentionally designed to ignore collision.

---

## Spawn Rules

Terrain should be placed intentionally enough to create interest without causing broken layouts.

### MVP Spawn Rules

- Spawn a small number of obstacles per map section or arena
- Keep clear space around player spawn
- Keep clear space around enemy spawn points where possible
- Avoid placing obstacles directly on top of pickups, doors, portals, or key interactables
- Avoid fully sealing narrow passages unless the map is intentionally designed that way

### Safety Rules

Do not allow terrain generation that causes:

- Player spawning inside collision
- Enemies spawning inside collision
- No valid path through major play space
- Terrain overlapping other terrain
- Terrain overlapping walls or map boundaries in unintended ways

---

## Recommended Obstacle Density

For MVP, use a light density.

Suggested initial tuning:

- Small arena: 3 to 6 obstacles
- Medium arena: 5 to 10 obstacles
- Large arena: 8 to 14 obstacles

These numbers can be tuned later based on feel.

The map should still have enough open space for dodging and movement-heavy gameplay.

---

## Object Sizes

Terrain should remain small enough to create navigation moments without dominating the arena.

Suggested categories:

### Small

- Rocks
- Bushes
- Crates

Use for most placements.

### Medium

- Broken pillars
- Ruined statues
- Larger debris piles

Use sparingly.

For MVP, start with one or two consistent sizes to simplify implementation.

---

## Pathing Behavior

### Minimum Acceptable MVP

- Enemies cannot pass through obstacles
- Enemy movement reacts to collision and attempts to continue pursuit
- If full pathfinding is not yet implemented, enemies may use simple steering or collision avoidance

### Preferred Behavior

- Enemies can route around obstacles in a stable way
- Enemies do not jitter heavily when blocked
- Enemies do not get stuck permanently on small terrain

---

## Map Generation Integration

Terrain should be added as part of the level setup process.

### Flow

1. Level loads or generates
2. Valid terrain spawn points are identified
3. Terrain objects are spawned
4. Collision is registered
5. Player and enemies navigate around placed obstacles

### Placement Methods

Any of the following are acceptable for MVP:

- Hand-placed obstacle coordinates
- Random placement from valid spawn points
- Random placement within allowed navigation zones

Random placement is acceptable as long as validation rules are enforced.

---

## Technical Data Model

Each terrain obstacle should have data similar to:

- id
- type
- position
- size
- sprite or asset reference
- collision shape
- blocksPlayer = true
- blocksEnemies = true
- destructible = false

Optional later fields:

- health
- loot table
- biome tag
- navigation cost modifier

---

## Collision Shape Guidance

For MVP, use simple collider shapes.

Recommended order:

- Rectangle collider
- Circle collider where appropriate

Do not use highly detailed polygon collisions for early implementation.

Keep collision readable and performant.

---

## Rendering Layering

Terrain should render in a way that feels natural in the world.

Basic requirements:

- Terrain appears above the ground
- Player and enemies should visually read clearly around obstacles
- If needed, use simple sort ordering based on Y position or a fixed layer strategy

Do not overcomplicate layering for MVP.

---

## Gameplay Considerations

Terrain should create tactical moments such as:

- Breaking enemy approach lines
- Giving the player something to kite around
- Creating brief safety pockets without making the player invulnerable
- Slightly changing how melee and ranged enemies approach

Terrain should not become so dense that it undermines the fast movement and survival feel of the game.

---

## Edge Cases

The system should safely handle:

- Player pushed toward terrain
- Enemy crowding near terrain
- Multiple enemies trying to route around the same obstacle
- Loot dropping near terrain
- Projectiles interacting near terrain, if projectile collision is added later

For MVP, loot may be allowed to drop near terrain as long as it remains collectible.

---

## Debug Requirements

Add simple debug support so terrain placement and collision can be tested easily.

Helpful debug options:

- Show collider outlines
- Show obstacle spawn points
- Show blocked areas
- Toggle terrain on and off for testing

---

## Acceptance Criteria

The feature is complete when all of the following are true:

- Small terrain elements appear in the map
- The player cannot move through terrain
- Enemies cannot move through terrain
- Both player and enemies visibly move around obstacles
- Terrain does not spawn on top of the player
- Terrain does not create obviously broken or unfair map layouts
- Collision feels stable and readable during gameplay

---

## Suggested MVP Implementation Order

1. Add one placeholder terrain object type
2. Add collider support for that terrain object
3. Block player movement against terrain
4. Block enemy movement against terrain
5. Add simple placement rules
6. Add several visual variants
7. Tune spawn density and spacing

---

## Future Extensions

Not included in MVP, but compatible with this system:

- Destructible objects
- Biome-specific terrain sets
- Projectile blocking terrain
- Hazard terrain
- Elite enemies that jump over obstacles
- Terrain with loot containers
- Breakable walls or shortcuts
- Dynamic map events that alter terrain

---

## Codex Implementation Notes

Build this as a lightweight static obstacle system.

Priority order:

- Stable collision
- Fair placement
- Simple enemy navigation response
- Basic visual variety

Do not overengineer the terrain system in this phase. The goal is to quickly improve map feel and movement decision-making with a minimal set of obstacle objects.