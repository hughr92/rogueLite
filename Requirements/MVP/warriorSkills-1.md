# PRD: Barbarian Skill System (MVP Subset)

## Overview

This document defines a subset of Barbarian class skills for the MVP. These skills are designed to be:

- Simple to implement
- Easy to scale
- Synergistic with melee combat
- Compatible with the existing weapon and progression systems

Each skill follows a strict design rule:

- **Single identity**
- **Single upgrade path**
- **Two scaling variables maximum**

---

## Included Skills

This PRD includes the following Barbarian skills:

1. Sever Artery  
2. Blood Frenzy  
3. Ground Slam  
4. War Cry (Modified: Speed Reduction)

---

## Core System Rules

### Skill Structure

Each skill must define:

- Base behavior
- Trigger condition (if applicable)
- Upgrade scaling (single path)

---

### Upgrade Rules

- Each skill has **one upgrade path**
- Upgrades improve **existing effects only**
- No branching upgrades in MVP

---

## Skill Definitions

---

### 1. Sever Artery

**Type:** On-hit modifier  
**Category:** Damage Over Time (DoT)

#### Base Behavior

- On hit, apply **Bleed stacks** to the target
- Each stack:
  - Deals damage over time
  - Ticks once per second

#### Initial Values (Example)

- Base bleed damage per stack: Low
- Max stacks: 3

#### Upgrade Path

Upgrades increase:

- Max stack limit
- Damage per stack

#### Scaling Example

- Level 1:
  - Max stacks: 3
  - Damage per stack: 5

- Level 2:
  - Max stacks: 5
  - Damage per stack: 7

- Level 3:
  - Max stacks: 7
  - Damage per stack: 10

---

### 2. Blood Frenzy

**Type:** Passive (Triggered)  
**Category:** Momentum / Attack Speed Buff

#### Base Behavior

- On enemy kill:
  - Gain temporary **attack speed buff**

#### Initial Values (Example)

- Attack speed bonus: Moderate
- Duration: Short (e.g., 2 seconds)

#### Upgrade Path

Upgrades increase:

- Buff duration
- Attack speed bonus

#### Scaling Example

- Level 1:
  - Attack speed: +10%
  - Duration: 2s

- Level 2:
  - Attack speed: +15%
  - Duration: 3s

- Level 3:
  - Attack speed: +20%
  - Duration: 4s

#### Notes

- Buff refreshes on new kills
- Does not stack beyond duration refresh (MVP)

---

### 3. Ground Slam

**Type:** Active Ability  
**Category:** AoE + Crowd Control

#### Base Behavior

- Slam ground in a forward cone
- Deals damage to all enemies in area
- Applies **stun**

#### Initial Values (Example)

- Cone width: Medium
- Damage: Moderate
- Stun duration: Short (e.g., 0.5s)

#### Upgrade Path

Upgrades increase:

- Cone width (area coverage)
- Stun duration

#### Scaling Example

- Level 1:
  - Cone width: 45°
  - Stun: 0.5s

- Level 2:
  - Cone width: 60°
  - Stun: 0.75s

- Level 3:
  - Cone width: 75°
  - Stun: 1.0s

---

### 4. War Cry (Modified)

**Type:** Active AoE  
**Category:** Crowd Control / Debuff

#### Base Behavior

- Emits a shout in a radius around the player
- Applies **movement speed reduction** to enemies

#### Initial Values (Example)

- Radius: Medium
- Slow effect: Moderate (e.g., -20% movement speed)
- Duration: Short (e.g., 2 seconds)

#### Upgrade Path

Upgrades increase:

- Radius
- Slow strength

#### Scaling Example

- Level 1:
  - Radius: 3 units
  - Slow: -20%

- Level 2:
  - Radius: 4 units
  - Slow: -30%

- Level 3:
  - Radius: 5 units
  - Slow: -40%

#### Notes

- Does not stack with itself
- Refreshes duration if reapplied

---

## Integration with Combat System

### On-Hit Effects

- Sever Artery integrates with weapon hit detection

---

### Kill Triggers

- Blood Frenzy listens to enemy death events

---

### Active Skills

- Ground Slam and War Cry:
  - Triggered via input or cooldown system
  - Affect enemies within defined area

---

## Visual / Feedback Requirements (MVP)

Each skill should have minimal but clear feedback:

- Sever Artery:
  - Red tick or small bleed indicator

- Blood Frenzy:
  - Subtle glow or aura around player

- Ground Slam:
  - Ground impact effect

- War Cry:
  - Expanding ring or pulse

---

## Data Structure Requirements

Each skill should include:

- id
- name
- type
- baseValues
- scalingValues
- currentLevel

---

## Acceptance Criteria

The system is complete when:

- All four skills are implemented
- Each skill applies its base effect correctly
- Upgrades increase power along a single path
- Skills integrate with combat system events
- Effects are visible and understandable in gameplay

---

## Future Extensions (Not in MVP)

- Multi-branch upgrades
- Skill synergies
- Status effect stacking interactions
- Skill augment modifiers
- Class-specific passive trees

---

## Codex Notes

- Keep logic modular per skill
- Avoid shared complex systems in MVP
- Use simple scaling values
- Prioritize responsiveness and clarity over complexity

---