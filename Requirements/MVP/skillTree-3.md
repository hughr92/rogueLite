# Barbarian Class Skill Tree (Concept Draft)

## Objective

Define a simple but expandable **Barbarian class skill tree** that:

- Is separate from weapon upgrades
- Focuses on **core identity and playstyle**
- Uses **branching paths**
- Allows **multi-level upgrades per node**
- Introduces light **build specialization (offense vs defense)**

This system will eventually use **Legacy XP**, but for now is purely conceptual.

---

## Core Design Philosophy

The Barbarian should feel:

- Aggressive
- Momentum-driven
- Rewarded for staying in combat
- Stronger the longer they survive fights

Key mechanic theme:
- **Escalation over time**
- **Risk = reward**

---

## Structure Overview

The Barbarian skill tree is divided into **3 branches**:

1. **Ferocity (Offense)**
2. **Survivor (Defense)**
3. **Instinct (Utility / Hybrid)**

Each branch:
- Has up to ~8–10 nodes
- Includes **linear progression with light branching**
- Each node has **multiple upgrade levels (e.g., 1–5)**

---

# 1. Ferocity Path (Offense)

Focus:
- Damage scaling
- Rage mechanics
- Kill momentum
- Area dominance

---

## Core Mechanic: Rage Meter

- Builds from:
  - kills
  - hits
- At full meter → enter **Rage State**

Base Rage Effects:
- Increased size
- Increased attack radius
- Increased damage

---

## Nodes

### 1. Blood Rush
- Gain Rage faster from kills
- Levels increase Rage gain rate

---

### 2. Overflowing Rage
- Rage meter can exceed 100%
- Extends Rage duration

---

### 3. Savage Reach
- Increase attack radius during Rage
- Scales with levels

---

### 4. Giant’s Presence
- Increase player size during Rage
- Slight knockback to enemies on contact

---

### 5. Brutal Momentum
- Each kill increases damage temporarily
- Stacks decay over time

---

### 6. Relentless Strikes
- Increase attack speed while in Rage

---

### 7. Blood Explosion
- Enemies explode on death during Rage
- Small AoE damage

---

### 8. Apex Rage (Capstone)
Requires previous Ferocity nodes

- Rage becomes significantly stronger:
  - full circular attack amplification
  - heavy damage boost
- Visual and gameplay spike moment

---

# 2. Survivor Path (Defense)

Focus:
- Durability
- Sustain
- Damage mitigation
- Staying power in chaos

---

## Nodes

### 1. Thick Hide
- Flat damage reduction
- Scales per level

---

### 2. Vitality
- Increase max health

---

### 3. War Recovery
- Small healing on enemy kill

---

### 4. Last Stand
- Gain damage reduction at low HP

---

### 5. Iron Will
- Reduce stun / hit recovery time
- Prevent getting overwhelmed

---

### 6. Battle Hardened
- Gain stacking armor while taking hits

---

### 7. Unyielding
- Chance to ignore fatal damage (cooldown-based)

---

### 8. Immortal Rage (Capstone)
Requires Survivor progression

- Cannot die while in Rage
- Rage drains instead of HP when taking damage

---

# 3. Instinct Path (Utility / Hybrid)

Focus:
- Movement
- Awareness
- Combat flow
- Bridging offense + defense

---

## Nodes

### 1. Predator Sense
- Highlight or prioritize nearest enemies
- Improves auto-targeting feel

---

### 2. Hunter’s Step
- Increase movement speed

---

### 3. Battle Flow
- Reduce cooldowns slightly on kill

---

### 4. Adrenaline
- Gain temporary speed boost after taking damage

---

### 5. War Magnetism
- Increase pickup radius (XP + gold)

---

### 6. Tactical Rage
- Rage also increases movement speed

---

### 7. Combat Rhythm
- Alternating attacks increase effectiveness
- Encourages constant action

---

### 8. Primal Instinct (Capstone)
Requires Instinct progression

- Automatically triggers Rage at low HP
- Brief slow-motion effect when triggered

---

## Branching Logic (Simple Version)

- Each path progresses top → bottom
- Some nodes require:
  - previous node in path
  - or total points invested in that branch

Example:
- Must unlock Blood Rush before Overflowing Rage
- Must invest X points in Ferocity before Apex Rage

---

## Upgrade Levels

Each node:
- Can be upgraded multiple times (e.g., 1–5 levels)
- Each level increases effectiveness

Example scaling (conceptual):
- +5% per level
- +1 stack per level
- +duration increase per level

---

## Build Identity Examples

### Aggressive Build
- Ferocity heavy
- High Rage uptime
- Explosive damage
- Risky survivability

---

### Tank Build
- Survivor heavy
- Hard to kill
- Sustained fights
- Lower burst damage

---

### Hybrid Build
- Mix of Instinct + Ferocity
- Fast, mobile, reactive
- Balanced survivability

---

## Design Constraints

- No more than ~8–10 nodes per branch
- Keep descriptions short and readable
- Avoid overly complex mechanics for MVP
- Focus on **clear fantasy and impact**

---

## Future Expansion Hooks

This system can later support:

- Unlocking via Legacy XP
- Visual skill tree UI
- Branch-specific synergies
- Class-specific modifiers
- Additional branches
- Weapon + class interactions

---

## Summary

This Barbarian skill tree provides:

- Clear identity (rage-driven combat)
- Meaningful player choices
- Scalable progression system
- Strong foundation for future expansion

It complements the weapon system by:
- enhancing how the player fights
- not replacing weapon mechanics