# PRD: Swarm Event System for Combat Encounters

## Objective

Add a **Swarm Event** mechanic to the gameplay loop to create bursts of panic, movement pressure, and combat variety.

Swarm events should be short, high-intensity moments that interrupt the normal spawn rhythm and force the player to react differently.

These events should:

- increase tension
- create dynamic battlefield shifts
- break up standard survival pacing
- make movement decisions more interesting

This should remain lightweight and modular so more swarm variants can be added later.

---

## Design Goal

The normal enemy loop creates constant pressure.

The swarm system should add:
- sudden danger spikes
- directional threats
- temporary arena control challenges
- moments where the player must reposition quickly

The player should feel:
- “I need to react right now”
- not just “more enemies spawned”

---

## Core Concept

At set intervals, trigger a **Swarm Event**.

A swarm event is a special spawn pattern that differs from regular enemy spawning.

For MVP, include at least these two swarm types:

1. **Rush Swarm**
   - enemies enter from one side or corner
   - move rapidly across the screen toward another side
   - creates a sweeping danger lane

2. **Encirclement Swarm**
   - enemies spawn in a ring around the player
   - begin closing inward or attacking from all directions
   - creates panic and positioning pressure

---

## Scope

### In Scope
- timed swarm event system
- at least 2 swarm patterns
- visual and gameplay distinction from normal spawns
- integration into current game timer loop
- basic pacing controls
- support for scaling later in the run

### Out of Scope
- unique swarm-only enemy species
- cinematic intros
- elaborate warnings with VO/audio
- map hazards
- procedural encounter scripting
- level-specific swarm logic

---

## Swarm Event Design Principles

Swarm events should be:

- brief
- intense
- readable
- disruptive
- survivable if reacted to properly

They should not feel like:
- just random extra spawns
- unavoidable cheap damage
- impossible clutter

---

## Event Timing

Swarm events should happen at **set intervals**.

Recommended MVP structure:
- first swarm after an early warmup period
- then repeat on a regular timer

Suggested pacing direction:
- begin after player has settled into the run
- recur often enough to feel memorable
- not so often that normal spawning loses identity

A good starting approach is:
- one swarm every 45 to 90 seconds
- with slight variation so it does not feel robotic

Exact cadence should be easy to tune.

---

## Swarm Event Rules

### General Rules
When a swarm event starts:

- it should be clearly distinguishable from regular spawning
- event lasts for a short burst window
- event may either:
  - add on top of normal spawns in a controlled way
  - or temporarily suppress normal spawns for clarity

Recommended MVP:
- slightly reduce or pause normal spawn pressure during the swarm event
- let the swarm itself be the main danger beat

This makes swarm moments more readable and intentional.

---

## Swarm Type 1: Rush Swarm

## Concept
A pack of enemies rapidly sweeps across the screen from one direction to another.

Examples:
- corner to opposite corner
- left edge to right edge
- top-left to bottom-right

This creates:
- directional urgency
- lane-based danger
- a need to sidestep or cut through safely

---

## Rush Swarm Behavior

- enemies spawn just off-screen or near one edge/corner
- they move faster than usual
- their goal is not purely to collapse on the player
- instead they surge across the visible play space
- they may still damage on contact if intersecting the player

This should feel like:
- a raiding wave
- a stampede
- a fast-moving hazard front

---

## Rush Swarm Variants

Allow simple variant directions:

- left to right
- right to left
- top to bottom
- bottom to top
- corner to opposite corner

For MVP, 2 to 4 directions are enough.

---

## Rush Swarm Enemy Types

Best candidates:
- fast melee enemies
- dash enemies
- fragile swarm enemies

Avoid:
- too many ranged attackers in this pattern at first
- slow tank enemies that do not sell the sweep effect

---

## Swarm Type 2: Encirclement Swarm

## Concept
Enemies appear around the player in a ring or partial ring.

This creates:
- panic
- surround pressure
- forced gap-seeking
- urgency to break out or reposition

---

## Encirclement Swarm Behavior

- enemies spawn around the player at a fixed radius
- the spawn shape can be:
  - full circle
  - partial circle with one opening
  - staggered ring
- after spawning, they begin pressing inward

This should create the feeling:
- “I have to find an escape lane”
- or
- “I need to kill a gap open”

---

## Encirclement Variants

Allow these variants:

### Full Ring
- full surround
- most panic-inducing
- should use lower density to remain fair

### Broken Ring
- one visible opening
- encourages smart movement

### Double-Layer Ring (future)
- outer loose ring plus inner pressure
- not required for MVP

For MVP, implement:
- full ring
- broken ring

---

## Swarm Event Telegraphing

Swarm events should have at least a small warning so they feel dramatic, not unfair.

Recommended lightweight warnings:
- short screen-edge marker
- brief flash or indicator
- text alert such as:
  - Swarm Incoming
  - Encircled
  - Incoming Rush

Do not overbuild this.
A small readable cue is enough.

---

## Difficulty Scaling

Swarm events should scale over time.

Possible scaling levers:
- number of enemies
- enemy speed
- enemy durability
- ring density
- rush width
- event duration

Suggested scaling philosophy:
- early swarms are mostly movement checks
- later swarms become real kill threats

---

## Spawn Control During Swarms

To avoid overwhelming chaos, define swarm interaction with normal spawning.

Recommended MVP behavior:
- during a swarm:
  - reduce or pause normal spawns briefly
- after swarm ends:
  - resume normal spawning smoothly

This preserves clarity.

Alternative later:
- allow partial overlap for very late game pressure

---

## Integration With Existing Systems

Swarm events must work with:

- enemy separation / anti-stack collision
- player-centered world movement
- projectile systems
- XP/gold drops
- normal difficulty scaling

Swarm enemies should still:
- collide/separate normally
- be killable
- drop rewards if intended

---

## Reward Behavior

For MVP, swarm enemies can use standard drops.

Optional later:
- finishing a swarm grants bonus XP burst
- guaranteed gold drops
- small event reward chest

Do not require bonus rewards yet unless simple.

---

## Pacing Impact

Swarm events should act like punctuation in the run.

The loop should feel like:
- baseline pressure
- sudden swarm spike
- recovery
- baseline pressure
- another spike

This creates a more memorable rhythm.

---

## Visual Readability

Swarms should be readable even in a messy fight.

Important readability goals:
- player can tell swarm direction
- player can identify incoming ring pressure
- player can respond before damage becomes unavoidable

Avoid:
- invisible spawn-ins directly on top of player
- overly dense instant rings
- rushes that begin too close to dodge

---

## Tuning Controls

Expose these values in an easy-to-edit location:

### Global Swarm Controls
- time between swarm events
- first swarm delay
- swarm event duration
- normal spawn suppression during swarm

### Rush Swarm Controls
- spawn direction options
- enemy count
- movement speed multiplier
- lane width / formation width

### Encirclement Controls
- ring radius
- enemy count
- chance of broken ring vs full ring
- inward speed

These should be easy to tweak without rewriting logic.

---

## Fairness Rules

Swarm events should feel dangerous but fair.

### Do
- give slight warning
- spawn just outside immediate unavoidable contact range
- allow at least one plausible reaction path

### Do Not
- spawn unavoidable damage directly on player
- create instant full-screen death walls
- overlap too many systems at once in early game

---

## Failure Cases To Avoid

Avoid swarm events that:
- feel identical to normal spawns
- instantly kill the player with no warning
- clutter the screen so much that nothing is readable
- break enemy separation logic
- cause large frame drops
- happen too often and lose impact

---

## Suggested MVP Event Pool

For the first version, implement:

1. Rush Swarm
   - fast enemies
   - sweeping lane
   - 2 to 4 directional variants

2. Encirclement Swarm
   - ring spawn around player
   - full ring or broken ring variant

This is enough to create meaningful variety.

---

## UI / Feedback Requirements

At minimum, include:
- a small warning label or event banner
- or edge indicators for rush direction
- or a visible ring telegraph before ring spawn

Recommended simple examples:
- “Swarm Incoming”
- “Rush”
- “Encircled”

Keep it fast and readable.

---

## Acceptance Criteria

This feature is complete when:

1. Swarm events occur at set intervals during runs
2. Swarm events feel distinct from regular spawning
3. At least 2 swarm types exist:
   - Rush Swarm
   - Encirclement Swarm
4. Rush Swarms sweep across the play space directionally
5. Encirclement Swarms pressure the player from a ring around them
6. Events create noticeable panic and dynamic interest
7. Swarm timing and density are tunable
8. Events do not break normal enemy behavior or current combat systems
9. Swarm events remain readable and reasonably fair
10. The system is structured so more swarm types can be added later

---

## Deliverable

Implement a swarm event system that introduces timed combat spikes using:

- directional rushing enemy waves
- ring-based surround events

Output full updated project files with clean structure and readable logic.