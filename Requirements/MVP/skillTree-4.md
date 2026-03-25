# PRD: Barbarian Attribute System (Replacing Class Skill Tree)

## Objective

Replace the current "Class Skill Tree" with an **Attribute-Based System** inspired by Guild Wars.

This system should:

- Replace linear skill unlocks with **scaling attributes**
- Modify existing systems:
  - weapons
  - combat
  - rage
- Support flexible builds
- Be simple for MVP but highly scalable

---

## Core Design Philosophy

Attributes are NOT skills.

Attributes:
- scale effectiveness of actions
- modify behavior of existing systems
- unlock power thresholds at key levels

Example from Guild Wars:
- Strength increases armor penetration per point, improving all attack skills globally :contentReference[oaicite:1]{index=1}

Apply this idea:

👉 Barbarian attributes should **enhance all gameplay systems**, not add separate abilities.

---

## System Overview

### Replace:
- Class Skill Tree

### With:
- Attribute Panel

---

## Barbarian Attributes

Barbarian has 4 core attributes:

1. Strength
2. Ferocity
3. Endurance
4. Instinct

Each attribute:
- ranges from Level 0 → 10 (MVP)
- scales continuously
- unlocks thresholds at key levels (3, 6, 10)

---

## Attribute Rules

### General Rules

- Each point increases effectiveness
- Higher levels give diminishing returns (optional later)
- Players invest points via:
  - Legacy XP (meta progression)
  - future run upgrades (optional later)

---

## Attribute Definitions

---

### 1. Strength (Primary Attribute)

## Purpose
Raw physical power

## Core Behavior
- Increases:
  - Slashing Damage
  - Piercing Damage
  - Bludgeoning Damage
- Improves effectiveness against armored enemies

## Scaling Effects

Per level:
- +X% physical damage
- +X% armor penetration (future)

## Threshold Unlocks

- Level 3:
  - Increased damage vs armored enemies

- Level 6:
  - Partial armor ignore

- Level 10:
  - Attacks bypass a portion of enemy defenses

---

### 2. Ferocity

## Purpose
Rage and aggression scaling

## Core Mechanic
Controls **Rage system**

## Scaling Effects

Per level:
- Rage gain increased
- Rage duration increased

## Threshold Unlocks

- Level 3:
  - Rage increases attack speed

- Level 6:
  - Kills extend Rage duration

- Level 10:
  - Rage modifies attacks (e.g. larger AoE or additional hits)

---

### 3. Endurance

## Purpose
Survivability

## Scaling Effects

Per level:
- +Health
- +Armor
- +Damage reduction

## Threshold Unlocks

- Level 3:
  - Reduced damage at low HP

- Level 6:
  - Gain armor when hit repeatedly

- Level 10:
  - Damage partially converts into Rage instead of HP loss

---

### 4. Instinct

## Purpose
Flow, speed, and responsiveness

## Scaling Effects

Per level:
- Movement speed
- Cooldown reduction
- Pickup radius

## Threshold Unlocks

- Level 3:
  - Minor cooldown reduction on kill

- Level 6:
  - Speed boost after taking damage

- Level 10:
  - Auto-trigger Rage at low HP

---

## Attribute Interaction Rules

Attributes modify:

### Weapons
- Strength → increases weapon damage output
- Ferocity → modifies attack behavior during Rage
- Instinct → affects attack speed and cooldowns

### Combat
- Endurance → reduces incoming damage
- Strength → improves damage vs armored enemies

### Systems
- Rage → controlled by Ferocity
- Movement → controlled by Instinct

---

## UI Requirements

## Replace Class Tab With:

### Attribute Panel

Display:

- Strength (level + bar)
- Ferocity (level + bar)
- Endurance (level + bar)
- Instinct (level + bar)

Each attribute should show:
- current level
- short description
- key scaling effect
- next threshold preview

---

## Example UI Layout

- Attribute Name
- Level Indicator (e.g., 4/10)
- Description
- Effects list
- Threshold preview

---

## Progression Rules

### Attribute Points

Players earn:
- Attribute Points via Legacy XP

### Spending

- Each point increases attribute level
- Increasing cost per level (future optional)
- Players must choose where to invest

---

## Build Identity Examples

### Damage Build
- High Strength
- High Ferocity
- Low Endurance

Result:
- high damage
- high Rage uptime
- fragile

---

### Tank Build
- High Endurance
- Medium Strength

Result:
- high survivability
- lower damage

---

### Hybrid Build
- Balanced across all attributes

Result:
- flexible playstyle
- consistent performance

---

## System Advantages

### 1. Scales Better Than Skill Trees
- No need for dozens of nodes
- Just adjust attribute scaling

### 2. Works With Weapons
- Attributes enhance weapon upgrades
- Not replace them

### 3. Cleaner UI
- Simple stat panel instead of large tree

### 4. More Replayability
- Different builds using same weapons

---

## Data Structure Guidance

Each character should store:

- Strength level
- Ferocity level
- Endurance level
- Instinct level

Each attribute should define:

- scaling effects
- thresholds
- max level

---

## Future Expansion Hooks

System should support:

- more attributes per class
- class-specific attributes
- item modifiers that boost attributes
- temporary attribute boosts during runs
- attribute-based weapon scaling
- enemy counters (e.g., high armor requires Strength)

---

## Acceptance Criteria

This feature is complete when:

1. Class Skill Tree is replaced by Attribute system
2. Barbarian has 4 attributes:
   - Strength
   - Ferocity
   - Endurance
   - Instinct
3. Each attribute:
   - scales continuously
   - has defined thresholds
4. Attributes modify:
   - damage
   - rage
   - survivability
   - speed
5. Attribute UI panel displays all attributes clearly
6. System integrates with:
   - weapons
   - combat
   - rage
7. System is extendable for future classes and items

---

## Deliverable

Implement:

- Attribute-based progression system
- Attribute UI panel
- Integration with combat and weapon systems

Output full updated project files with clean structure and readable logic.