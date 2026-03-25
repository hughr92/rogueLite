# PRD: Enemy Separation / Anti-Stack Collision

## Objective

Improve enemy movement by preventing enemies from stacking directly on top of one another.

Right now, enemies can overlap too easily, which causes:
- unnatural clumping
- projectile enemies hiding inside other enemies
- less readable combat
- player movement devolving into just running circles around one dense blob

Add lightweight enemy-to-enemy collision or separation so that enemies maintain some spacing and movement feels more chaotic, organic, and readable.

This should remain MVP-friendly and performant.

---

## Goal

Enemies should still pursue and pressure the player, but they should no longer collapse into a single overlapping mass.

The result should feel like:
- a crowd with physical presence
- more irregular movement patterns
- better enemy readability
- more interesting openings and lanes
- more dynamic projectile pressure

---

## Scope

### In Scope
- enemy-to-enemy separation
- lightweight collision response
- support for mixed enemy groups
- preserve overall pursuit behavior
- improve combat readability

### Out of Scope
- full physics engine
- complex pathfinding
- terrain collision
- ally collision
- advanced flocking systems
- navmesh logic

---

## Desired Behavior

### Core Rule
Enemies should not be able to occupy the same physical space.

Each enemy should have:
- a collision radius
- a personal space buffer

When two enemies overlap or get too close:
- they push away from each other
- their positions are corrected
- they continue pursuing the player afterward

---

## Gameplay Intent

This system should create:

- more sporadic crowd motion
- less perfect circular kiting by the player
- more natural gaps and funnels in packs
- more readable projectile enemy placement
- better visual distinction between enemy types

Enemy groups should still be threatening, but less blob-like.

---

## Implementation Approach

Use a lightweight enemy separation system.

### Recommended Method
For each update step:

1. Loop through enemies
2. Compare nearby enemies
3. Detect overlap based on collision radius
4. Push overlapping enemies apart
5. Apply only a modest correction each frame
6. Then continue normal movement toward the player

This should behave more like separation than hard-body physics.

---

## Separation Rules

### Collision Radius
Each enemy should have a collision size value.

Examples:
- small enemies = smaller radius
- large enemies / minibosses = larger radius

This radius does not need to match sprite size exactly, but should feel believable.

---

### Overlap Response
When two enemies overlap:

- calculate distance between them
- calculate overlap amount
- push them away from each other proportionally

The push should:
- be smooth
- avoid jitter where possible
- not launch enemies unrealistically

---

### Bias Rules
If useful, the system can favor these rules:

- basic enemies push each other evenly
- heavier enemies resist being moved as much
- minibosses push smaller enemies more strongly
- bosses should barely move when crowded

This creates better crowd texture.

---

## Movement Priority

Enemy movement should still prioritize:
1. attacking / pursuing the player
2. maintaining local separation

Separation should not fully override pursuit.
It should just prevent collapse.

The end result should be:
- enemies still chase
- enemies no longer overlap heavily

---

## Performance Guidance

Keep this simple and fast.

### MVP-Safe Options
Use one of these:
- pairwise checks if enemy counts are still moderate
- or a simple spatial partition later if needed

For now, prefer the simplest implementation that remains performant.

If enemy counts become large later, this can be optimized with:
- grid partitioning
- neighbor buckets
- local nearby checks only

Do not over-engineer the first pass.

---

## Special Enemy Type Considerations

### Melee Chasers
- should separate clearly
- should form loose packs rather than a single blob

### Fast Enemies
- should still dart through spaces
- separation should not remove their aggressive feel

### Ranged Enemies
- should benefit from spacing
- should no longer hide inside melee packs
- should be more visible and threatening

### Dash / Swarm Enemies
- can use slightly smaller separation if needed
- should still feel chaotic
- should not fully stack

### Minibosses / Bosses
- should have larger collision radius
- should displace smaller enemies more easily
- should not get trapped inside crowds

---

## Optional Extra Behavior

If the basic separation feels too robotic, consider adding a tiny amount of:

- random drift
- slight side bias
- local steering wobble

Only do this if needed.
The main fix is collision/separation.

---

## Tuning Controls

Expose a few tuning values in an easy-to-find place.

Suggested values:
- enemy collision radius by type
- separation strength
- max separation correction per frame
- heavyweight resistance multiplier for elites/bosses

These values should be easy to tweak without rewriting logic.

---

## Visual / Feel Targets

The movement should feel:

- less blobbed
- more physical
- more unpredictable
- more readable
- still dangerous

The player should see:
- enemy fronts
- side openings
- ranged enemies peeking from behind
- shifting crowd shapes instead of one solid knot

---

## Failure Cases To Avoid

Do not let this system cause:

- heavy jittering
- enemies vibrating in place
- enemies being launched away
- enemies getting permanently stuck
- enemies completely stopping pursuit
- bosses being pushed around by trash mobs
- major frame drops

---

## Interaction With Projectiles

This change should indirectly improve projectile combat because:

- ranged enemies will spread more naturally
- projectile origins will be easier to read
- the player will face less single-direction circular kite gameplay

No projectile rewrite is required for this task.

---

## Acceptance Criteria

This task is complete when:

1. Enemies no longer heavily overlap each other
2. Enemy packs form looser, more natural shapes
3. Ranged enemies are easier to distinguish within groups
4. Movement feels more sporadic and less blob-like
5. Player kiting patterns feel less like simple circles around one stacked mass
6. Minibosses and bosses retain physical presence
7. Performance remains stable
8. The system is lightweight and easy to tune

---

## Deliverable

Update enemy movement to include lightweight enemy-to-enemy collision or separation so enemies cannot stack directly on one another.

Output full updated project files with clean structure and readable logic.