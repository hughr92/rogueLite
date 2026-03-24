# PRD: Weapon Upgrade System Refactor (Barbarian Last Stand)

## Objective

Refactor the current weapon upgrade system to:

- Separate **generic upgrades** from **weapon-specific upgrades**
- Introduce **multi-level upgrade tracks (0 → 5)**
- Add a **final evolution (ultimate upgrade)** per weapon
- Establish a **finite level cap per run**
- Ensure upgrades feel meaningful and structured

This system will define the core progression loop during a run and set the foundation for future class and weapon expansion.

---

## Design Goals

- Make upgrades feel **intentional and layered**
- Provide **clear progression paths per weapon**
- Introduce **build completion moments (ultimate unlocks)**
- Prevent infinite scaling by enforcing a **hard cap**
- Encourage **decision-making across multiple systems later**

---

## High-Level System Changes

### 1. Separate Upgrade Types

#### Generic Upgrades (Available to All Classes)
These are no longer tied to weapons:

- Damage Increase
- Cooldown Reduction

These:
- apply globally (or to relevant systems)
- are always part of the upgrade pool
- are not shown inside weapon trees
- are considered baseline progression options

---

### 2. Weapon Upgrade Tracks

Each weapon now has:

- **Two core upgrade paths**
- Each path upgrades from **Level 0 → Level 5**
- Once both paths are maxed, an **Ultimate Upgrade** becomes available

---

## Weapon Structure Overview

### Melee → Axe

#### Core Upgrade Paths

1. Widen Arc
   - Expands attack width / cleave angle
   - Improves crowd control and coverage

2. Twin Swing
   - Adds additional follow-up swings
   - Improves burst output and hit frequency

#### Upgrade Rules

- Each path has **5 levels**
- Starts at Level 0 (base weapon)
- Can be upgraded up to Level 5
- Each upgrade meaningfully improves the effect
- Exact values not required yet

#### Ultimate Upgrade

Unlocked when:
- Widen Arc = Level 5
- Twin Swing = Level 5

Ultimate:

- Whirlwind
  - Converts attack into a full-circle or near full-circle attack
  - Represents final evolution of the axe

---

### Ranged → Javelin

#### Core Upgrade Paths

1. Volley
   - Throws additional javelins
   - Improves multi-target coverage

2. Long Flight
   - Improves projectile speed and/or range
   - Improves targeting reach and consistency

#### Upgrade Rules

- Each path has **5 levels**
- Starts at Level 0
- Can be upgraded up to Level 5
- Each upgrade meaningfully improves performance

#### Ultimate Upgrade

Unlocked when:
- Volley = Level 5
- Long Flight = Level 5

Ultimate:

- Piercing Volley
  - Javelins pierce through enemies
  - May also combine with multi-projectile behavior
  - Represents final evolution of ranged weapon

---

## Upgrade Pool Behavior

### Level-Up Choices

Each level-up:
- Player is presented with **3 choices**
- Choices can include:
  - Generic upgrades
  - Weapon upgrades (if not maxed)
  - Ultimate upgrade (if unlocked and not yet taken)

---

### Availability Rules

#### Weapon Path Upgrades
- Available until they reach Level 5
- Once Level 5 is reached → removed from pool

#### Ultimate Upgrades
- Only appear when:
  - both core paths are maxed (5/5 each)
- Only offered if not already selected
- Should appear with high priority once unlocked

#### Generic Upgrades
- Always available unless system later caps them
- Continue appearing even if weapons are complete

---

## Total Upgrade Count Per Run

### Weapon Upgrades

Per weapon:

- 5 levels → Path 1
- 5 levels → Path 2
- 1 ultimate

Total per weapon:
- 11 upgrades

Two weapons (Axe + Javelin):
- 22 upgrades

---

### Generic Upgrades

- Damage Increase: 5 levels
- Cooldown Reduction: 5 levels

Total generic:
- 10 upgrades

---

### Total Upgrade Capacity

- Weapon upgrades: 22
- Generic upgrades: 10

Total:
- **32 total upgrades per run**

---

## Level Cap System

### Hard Cap Behavior

Once the player has:

- maxed all weapon upgrades
- maxed all generic upgrades

Then:

- player stops leveling up
- XP bar should no longer progress
- no further upgrade prompts appear

---

### Expected Player Experience

- Early game: many upgrade choices available
- Mid game: specialization begins
- Late game: nearing completion of build
- End game:
  - fully upgraded character
  - no more level-ups
  - survival depends on build strength

---

## UI Implications

### Weapon Skill Tree UI

Update current weapon skill tree display to reflect:

#### Axe
- Widen Arc (0–5)
- Twin Swing (0–5)
- Whirlwind (locked until both complete)

#### Javelin
- Volley (0–5)
- Long Flight (0–5)
- Piercing Volley (locked until both complete)

---

### Visual Indicators

Each upgrade path should display:

- current level (e.g., 2/5)
- max level (5/5)
- locked or unlocked status for ultimate

---

### Ultimate State

Before unlock:
- show ultimate as:
  - locked
  - with requirement text:
    - “Requires both paths at max level”

After unlock:
- show as available
- highlight visually (e.g., distinct color or border)

After selection:
- mark as complete

---

### Generic Upgrades UI

Do NOT include generic upgrades inside weapon trees.

Optional:
- show in separate “Core Upgrades” section later
- for now, they exist only in level-up choices

---

## Data Model (Conceptual)

Represent upgrade state per run:

- Axe
  - Widen Arc level (0–5)
  - Twin Swing level (0–5)
  - Whirlwind unlocked (true/false)

- Javelin
  - Volley level (0–5)
  - Long Flight level (0–5)
  - Piercing Volley unlocked (true/false)

- Generic
  - Damage level (0–5)
  - Cooldown level (0–5)

---

## Upgrade Selection Logic

When generating level-up choices:

1. Build pool of valid upgrades:
   - include all upgrades not at max
   - include ultimates if unlocked and not taken

2. Randomly select 3 unique options

3. Avoid:
   - offering maxed upgrades
   - offering ultimates before unlock

4. Prefer:
   - offering ultimate once unlocked

---

## Future Expansion Hooks

This system should support:

- more weapons per category
- more categories (e.g., magic, traps)
- class-specific modifiers
- branching upgrade paths
- synergy upgrades between weapons
- legacy system modifying max levels or unlock conditions

---

## Acceptance Criteria

This feature is complete when:

1. Damage and Cooldown upgrades are no longer tied to specific weapons
2. Axe has:
   - Widen Arc (0–5)
   - Twin Swing (0–5)
   - Whirlwind unlocks after both reach 5
3. Javelin has:
   - Volley (0–5)
   - Long Flight (0–5)
   - Piercing Volley unlocks after both reach 5
4. Each upgrade path caps at 5 levels
5. Each weapon has exactly 1 ultimate upgrade
6. Total upgrade count per run equals 32
7. Player stops leveling after all upgrades are completed
8. Level-up choices respect availability rules
9. Weapon skill tree UI reflects levels and lock states
10. System is cleanly extendable for future weapons and classes

---

## Deliverable

Refactor the upgrade system and update UI to reflect:

- multi-level weapon upgrade tracks
- ultimate unlock logic
- generic upgrades separated from weapon trees
- hard cap progression system

Output updated project files with clean structure and readable logic.