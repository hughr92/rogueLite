# PRD: Boss & Mini-Boss Loot Drop System (Level-Scaled Rarity)

## Objective

Introduce a **loot drop system** for:

- Mini-bosses
- Final bosses

This system should:

- reward players for defeating high-value enemies
- introduce controlled item progression
- respect level-based rarity limits
- integrate with the existing inventory system

For now, this system should be tuned for **Level 1 only**.

---

## Design Goals

- Make boss fights feel rewarding
- Introduce meaningful loot progression
- Prevent early access to high-tier items
- Keep drops simple, readable, and tunable
- Ensure drops integrate cleanly with inventory/storage

---

## Core Rules

### Drop Sources

Only the following enemies drop items:

- Mini-bosses
- Final boss

Regular enemies:
- DO NOT drop items (for now)

---

## Level-Based Drop Caps

For **Level 1**:

### Mini-Boss Drops
- Maximum rarity: **Blue**
- Cannot drop:
  - Purple
  - Gold
  - Green

### Final Boss Drops
- Maximum rarity: **Purple**
- Cannot drop:
  - Gold
  - Green

---

## Drop Guarantee Rules

### Mini-Boss
- Always drops at least:
  - 1 item

### Final Boss
- Always drops at least:
  - 1 item
- Has chance to drop:
  - additional item(s)

---

## Drop Count Rules

### Mini-Boss
- 1 guaranteed item
- Optional small chance for 2nd item

### Final Boss
- 1 guaranteed item
- Moderate chance for 2nd item
- Small chance for 3rd item

Keep item counts low for readability and balance.

---

## Rarity Distribution (Level 1)

### Mini-Boss Drop Table

- Grey: high chance
- Blue: moderate chance

No Purple or higher

---

### Final Boss Drop Table

- Blue: moderate chance
- Purple: low chance
- Grey: fallback chance

No Gold or Green

---

## Example Drop Weight Structure (Conceptual)

Mini-Boss:
- Grey = most common
- Blue = less common

Final Boss:
- Blue = most common
- Purple = rare but possible

Exact percentages should be:
- easy to tune
- defined in a central config

---

## Item Generation Rules

When a drop occurs:

1. Determine rarity (based on drop table)
2. Select item type from valid pool
3. Generate stats based on:
   - rarity
   - item type
   - level scaling rules

---

## Allowed Item Types (Level 1)

For now, limit drops to:

- Axe (Melee, Slashing)
- Javelin (Ranged, Piercing)
- Chestpiece (Armor)

Optional:
- Helmet (if implemented)

Do not include:
- Rings (unless ready)
- Amulets (unless ready)
- Off-class items

---

## Class Filtering

Drops must respect class:

- Only generate items usable by Barbarian
- Do not generate irrelevant gear

---

## Item Stat Scaling (Level 1)

Items should:

- provide small incremental power increases
- not overpower player progression
- stay within early-tier stat ranges

### Scaling Rules

- Grey: baseline
- Blue: slightly stronger
- Purple: noticeable upgrade

Avoid:
- large stat spikes
- game-breaking effects

---

## Drop Positioning

When a boss dies:

- items should spawn at or near death location
- items should be visually distinct from XP and gold

---

## Pickup Behavior

Items should:

- remain on ground until collected
- be picked up on player overlap

Optional (recommended):
- slight pickup radius interaction

---

## Inventory Integration

When an item is picked up:

- it is added to player storage
- if storage is full:
  - item remains on ground
  - or pickup is blocked

Do NOT auto-equip items.

---

## Visual Differentiation

Items should be visually distinguishable by rarity.

Examples:
- Grey → neutral color
- Blue → blue tint
- Purple → purple tint

Keep it simple but readable.

---

## Drop Feedback

When a boss drops an item:

- player should clearly notice the drop

Suggested feedback:
- small visual burst
- item glow
- short text indicator (optional)

---

## Persistence

No persistence required for drops themselves.

Once picked up:
- item is stored in character inventory
- follows normal save system

---

## Scaling for Future Levels

System should be built to support:

### Higher Levels

- higher rarity caps
- new rarity tiers (Gold, Green)
- expanded item pools
- more drop sources

---

### Future Drop Cap Examples

- Level 2:
  - Mini-boss → up to Purple
  - Boss → up to Gold

- Level 3+:
  - unlock Green tier

This is not required now but must be supported structurally.

---

## Data Structure Guidance

The drop system should define:

### Per Enemy Type

- drop enabled (true/false)
- min drop count
- max drop count
- rarity weight table
- allowed item pool
- level scaling rules

---

### Rarity Table

Each rarity should have:
- weight value
- level cap check

---

### Item Generator

Should accept:
- rarity
- item type
- level

And output:
- generated item with valid stats

---

## Integration With Existing Systems

Must work with:

- inventory system
- drag-and-drop equipment
- item rarity system
- stat system
- enemy system

---

## Edge Cases

### Storage Full
- item not added
- remains on ground

### Multiple Drops Overlapping
- items should not stack invisibly
- ensure spacing or slight offset

### Player Dies Before Pickup
- items are lost (for now)

---

## Testing Requirements

For testing:

- ensure mini-boss always drops item
- ensure final boss drops item
- verify rarity limits enforced
- verify items appear in storage
- verify no invalid items generated

Optional:
- expose drop debug info in test panel later

---

## Acceptance Criteria

This feature is complete when:

1. Mini-bosses drop items on death
2. Final boss drops items on death
3. Mini-boss items are capped at Blue rarity
4. Final boss items are capped at Purple rarity
5. Drop counts follow defined rules
6. Items are generated correctly by rarity and type
7. Items appear in the world and can be picked up
8. Picked items go into storage
9. System supports future scaling for higher levels
10. No invalid item types are generated

---

## Deliverable

Implement a boss loot drop system that:

- assigns drop tables to mini-bosses and bosses
- enforces Level 1 rarity caps
- generates valid Barbarian items
- integrates with inventory and item systems

Output full updated project files with clean structure and readable logic.