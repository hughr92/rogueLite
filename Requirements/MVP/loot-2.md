# PRD: Loot Scaling, Rarity Progression, and Set System (MVP)

## Overview

This document defines the loot progression system for the roguelike game. The goal is to:

- Ensure **loot always feels like an upgrade**
- Introduce **progressive rarity visibility via merchant levels**
- Add **base damage scaling tied to game level**
- Introduce **boss reward excitement**
- Implement **first set system (Barbarian armor set)**

This system is intentionally simple, scalable, and easy for Codex to implement.

---

## Core Design Principles

- Players should **consistently receive stronger items over time**
- Shops should **feel more exciting as they level up**
- Bosses should provide **high-value, memorable rewards**
- Sets should provide **clear power spikes and synergy**
- Avoid complex stat scaling for MVP — use **linear or factor-based scaling**

---

## Weapon System

### Base Damage Scaling

Each weapon has a **Base Damage** that scales with **Game Level**.

- Formula:
  - Base Damage = 5 × Game Level

### Examples

- Game Level 1 → Base Damage = 5  
- Game Level 2 → Base Damage = 10  
- Game Level 3 → Base Damage = 15  

### Bonus Stats (unchanged system)

Weapons also roll bonus stats:

- Axe → +X Slashing Damage  
- Javelin → +X Piercing Damage  

### Bonus Scaling (Simple Range)

- Game Level 1 → +2 to 4 bonus damage  
- Game Level 2 → +5 to 8 bonus damage  
- Game Level 3 → +8 to 12 bonus damage  

---

## Rarity System

### Rarity Tiers

- Gray (Common)
- Blue (Magic)
- Purple (Rare)
- Gold (Legendary)
- Green (Set Items)

---

## Merchant Level Progression

Merchant level determines **maximum rarity available in shop**.

### Rules

- Merchant Level 1:
  - Available: Gray, Blue

- Merchant Level 2:
  - Available: Gray, Blue

- Merchant Level 3:
  - Available: Gray, Blue, Purple (NEW unlock)

- Merchant Level 4:
  - Available: Blue, Purple

- Merchant Level 5:
  - Available: Blue, Purple, Gold (NEW unlock)

### Notes

- Higher rarity is **not guaranteed**
- Shop rolls a **mix of rarities up to the cap**

---

## Drop System

### Enemy Drops (General)

- Scale loosely with game level
- Mostly Gray / Blue early

---

### Mini-Boss Drops

- Guaranteed: 1 Purple item
- Chance: Small chance to upgrade to Gold

---

### Final Boss Drops

- Drops **3 items total**

Drop Table:

- Guaranteed: Gold items
- Chance: One or more items replaced with Set (Green)

---

## Set Item System (Barbarian - MVP)

### Set Name

- Berserker Set

### Set Pieces

- Helmet
- Chest
- Leggings
- Boots

---

## Set Bonuses

### 2-Piece Bonus

- Effect: Passive AoE Damage Aura

Behavior:

- Constant damage around player
- Ticks every second
- Small radius

Example:

- Damage per second = small flat value (e.g., 5–10)

---

### 4-Piece Bonus

- Effect: Enhanced Berserker Aura

Behavior:

- Increased AoE damage
- Adds knockback to enemies
- Slightly larger radius

Example:

- Higher DPS (e.g., 15–25)
- Knockback applied per tick

---

## Set Drop Rules

- Set items (Green rarity):
  - ONLY drop from Final Boss
  - Very low drop rate

---

## Progression Flow Summary

1. Player starts at Game Level 1
   - Low base damage
   - Only Gray/Blue in shop

2. As player progresses:
   - Base damage increases linearly
   - Bonus stats increase in range
   - Shop unlocks Purple at Merchant Level 3

3. Mid progression:
   - Purple gear becomes common upgrade path

4. Late progression:
   - Gold gear appears (Merchant Level 5)
   - Final boss becomes key loot source

5. End goal:
   - Acquire full Berserker Set
   - Unlock powerful AoE + knockback build

---

## Implementation Notes for Codex

- Use simple functions:
  - getBaseDamage(gameLevel)
  - getBonusRange(gameLevel)
  - getShopRarityPool(merchantLevel)

- Loot generation should:
  - Roll rarity first
  - Then apply stats based on game level

- Set tracking:
  - Count equipped set pieces
  - Apply effects dynamically

- AoE system:
  - Tick every 1 second
  - Affect enemies within radius

---

## Future Extensions (Not in MVP)

- Additional sets for other classes
- Weapon-based set bonuses
- Scaling AoE with player stats
- Unique item effects (on-hit, proc-based)
- Rarity-based visual effects