# PRD: Starter Equipment, Item Rarity, Drag-and-Drop Inventory, and Small-Scale Item Power System

## Objective

Add the first functional version of an equipment system to the character inventory for **Barbarian Last Stand**.

This update should introduce:

- Item rarities
- Starter equipment for new Barbarian characters
- Equipment slot restrictions
- Drag-and-drop between equipped slots and storage
- Basic inventory sorting
- A lightweight item stat system
- A future-safe structure for stronger and rarer gear later

This should remain **small, stable, and MVP-friendly**.

Do not add item drops to gameplay yet.
Do not add merchants yet.
Do not add crafting yet.

The goal is to create the first real item foundation without disrupting the current game balance.

---

## High-Level Goals

This system should make it clear that:

- Characters can own and equip items
- Equipment belongs in specific slots
- Items can be moved between equipped slots and storage
- Rarity exists and will matter later
- Weapons and gear can grow in power over time
- The current implementation starts very small and safe

---

## Scope

### In Scope

- Item rarity definitions
- Starter Barbarian equipment
- Equipped gear shown in inventory
- Drag-and-drop behavior between equipped slots and storage
- Equipment slot validation
- Basic item stats
- Basic inventory sorting
- Minimal power scaling guidance
- Per-character inventory and storage

### Out of Scope

- Boss drops
- Quest rewards
- Item tooltips with deep detail
- Random item generation during gameplay
- Item affixes beyond very basic structure
- Salvaging, crafting, reforging
- Set bonuses
- Consumables
- Stackable materials
- Shared account-wide stash
- Full rebalance of the combat system

---

## Rarity System

Add five item rarity tiers in this order:

1. Grey
2. Blue
3. Purple
4. Gold
5. Green

These should represent increasing rarity and uniqueness.

### Rarity Meaning

#### Grey
- Common / basic
- No special attributes
- Only base stat contribution

#### Blue
- Uncommon
- Slightly improved base values
- May later support one minor extra property

#### Purple
- Rare
- Stronger values
- May later support more distinct item identities

#### Gold
- Epic / Legendary tier
- More impactful stat values
- More build-defining later

#### Green
- Highest rarity in current plan
- Most unique / special
- Intended for top-end or highly unusual gear

For now, only Grey items need to exist in the game.

---

## Starter Character Equipment

When a new character is created, and the only class is still Barbarian, they should begin with the following equipped items:

- Common Axe
- Common Javelin
- Common Chest Piece

These should appear immediately in the equipment UI.

### Starting Gear Placement

- Common Axe goes in Primary Weapon slot
- Common Javelin goes in Secondary Weapon slot
- Common Chest Piece goes in Chest slot

All other equipment slots start empty.

---

## Equipment Slots

The inventory/equipment layout should support these slots:

- Helmet
- Chest
- Primary Weapon
- Secondary Weapon
- Ring 1
- Ring 2
- Amulet

Only valid item types may be placed in matching slots.

### Slot Rules

#### Helmet Slot
Accepts:
- Helmet items only

#### Chest Slot
Accepts:
- Chest armor items only

#### Primary Weapon Slot
Accepts:
- Melee weapon items only

#### Secondary Weapon Slot
Accepts:
- Ranged weapon items only

#### Ring Slots
Accept:
- Ring items only

#### Amulet Slot
Accepts:
- Amulet items only

---

## Item Type Rules

The inventory system should understand at minimum these item categories:

- Melee Weapon
- Ranged Weapon
- Helmet
- Chest
- Ring
- Amulet

This should be enough to support current UI and future item growth.

---

## Initial Item Stat Rules

Keep item stats very small and meaningful.
Do not let this break the current gameplay balance.

### Weapon Stats

#### Melee Weapons
Main stat:
- Base damage bonus

Example effect:
- Slight increase to axe effectiveness

#### Ranged Weapons
Main stat:
- Base damage bonus

Example effect:
- Slight increase to javelin effectiveness

For now, weapon stats should only provide a small bump.

---

### Armor Stats

#### Chest Piece
Main stat:
- Armor

This should provide a small survivability bonus.

#### Helmet
Main stat:
- Armor and/or health

Helmet items do not need to exist yet, but the slot and rules should support them.

---

### Jewelry Stats

#### Amulet
Primary future role:
- Cooldown reduction
- Other utility effects later

No amulet item required yet.

#### Rings
Primary future role:
- Special damage types
- Minor offensive modifiers
- Specialty effects later

No ring items required yet.

---

## Starting Item Definitions

Only create a very small number of actual items for now.

### Required Starter Items

#### Common Axe
- Rarity: Grey
- Type: Melee Weapon
- Slot: Primary Weapon
- Function: small base damage increase to axe-related combat

#### Common Javelin
- Rarity: Grey
- Type: Ranged Weapon
- Slot: Secondary Weapon
- Function: small base damage increase to javelin-related combat

#### Common Chest Piece
- Rarity: Grey
- Type: Chest
- Slot: Chest
- Function: small armor increase

These should be intentionally plain and boring.
They are starter gear, not exciting loot.

---

## Power Budget Guidance

This item system should feel real, but the first implementation should be conservative.

### Current Design Rule
Starter gear should provide only a **small incremental bonus**.

Examples of acceptable feel:
- Weapon gives a tiny but noticeable damage bump
- Chest gives a modest survivability increase
- Player feels slightly stronger than naked baseline
- Game balance is not fundamentally changed

Avoid:
- major DPS spikes
- large cooldown cuts
- large health inflation
- making starter gear mandatory for survival

The starting gear should feel like the natural baseline for a Barbarian, not a power exploit.

---

## Item Scaling Concept

This system should prepare for stronger items later, even if only basic gear exists now.

### Suggested Future Item Power Direction

Items should scale by a combination of:

- Rarity tier
- Character progression
- Drop source quality
- Later world/boss progression tier

### Conceptual Progression Path

- Early progression:
  - mostly Grey
  - occasional Blue later

- Mid progression:
  - Blue and Purple become more common

- Late progression:
  - Purple, Gold, and rare Green items appear

---

## Suggested Item Level Model

Add a simple internal concept of item level, even if lightly used at first.

### Item Level Purpose

Item level can represent:
- baseline stat strength
- progression readiness
- future drop tuning

### Suggested Early Range

- Starter gear begins at a very low item level
- Keep first meaningful cap small

Suggested first implementation target:
- early item levels roughly in a small band, such as an entry-tier level range
- enough room for future expansion without needing a redesign

A good practical direction is:
- starter items sit at the lowest end
- early future upgrades improve gently
- top-end late-game gear can later scale much higher

The exact numbers do not matter yet as much as the structure.

---

## Practical Scaling Recommendation

For MVP:

- Treat starter Grey gear as baseline low-tier equipment
- Let each future rarity tier increase stats modestly
- Keep item contributions secondary to:
  - level-up upgrades
  - skill tree choices
  - player survival skill

Items should support the build, not completely replace the run progression system.

---

## Inventory Interaction Requirements

## Drag-and-Drop

Equipped items and storage items should be draggable.

The player should be able to:

- drag an equipped item into a valid storage slot
- drag a storage item into a valid equipment slot
- move items between storage slots
- swap items when valid

### Drag Rules

#### Equip to Matching Slot Only
- Melee weapon can only go into Primary Weapon slot
- Ranged weapon can only go into Secondary Weapon slot
- Chest can only go into Chest slot
- Helmet can only go into Helmet slot
- Ring can only go into Ring slot
- Amulet can only go into Amulet slot

#### Invalid Drops
If player drops an item into an invalid slot:
- item returns to original position
- no item should be lost
- optional light feedback is fine

#### Empty Slots
- Accept valid items
- Display empty state clearly

#### Swapping
If valid and convenient:
- allow swapping between storage slot and equipment slot
- allow swapping between two storage slots

Keep this implementation simple and reliable.

---

## Storage Requirements

Each character should have their own storage.

### Storage Basics

- Storage belongs to the character
- Not shared across all characters
- Storage appears below equipped item area
- Storage supports at least 30 slots per tab

### Storage Tabs

Allow multiple storage tabs if already planned.

Recommended initial approach:
- one active tab is enough for first implementation
- UI can still show multiple tabs for future growth
- only first tab needs to function if keeping MVP tight

---

## Sorting Requirements

Add basic sorting controls to storage.

### Sorting Options

At minimum, allow sorting by:
- Item Type
- Rarity

Optional later:
- Name
- Item Level
- Slot Type

### Sorting Goals

Sorting should help players quickly group gear as future item counts grow.

Since only a few starter items exist now, keep the UI basic but functional.

---

## Equipment UI Requirements

When a character opens the Inventory tab, they should see:

### Equipment Area
- Character silhouette or placeholder body layout
- Visible slot markers
- Equipped items displayed in their slots
- Empty slots shown clearly

### Storage Area
- Grid of slots
- Stored items displayed in cells
- Sorting control above storage
- Optional storage sub-tabs

---

## Item Display Requirements

Each visible item should show enough information to be readable without requiring complex systems.

At minimum display:
- Item name
- Rarity color
- Item type

Optional but useful:
- very short stat line

Examples of readable display style:
- Common Axe
- Grey border or text treatment
- Type label such as Melee Weapon

Do not overbuild tooltip systems yet.

---

## Data Structure Guidance

Structure the system so each item can later support more properties.

Each item should conceptually track:

- Unique item id
- Item name
- Rarity
- Item type
- Allowed slot
- Item level
- Base stats
- Future modifier hooks
- Owner character id
- Storage position or equipped position

Each character should conceptually track:

- Equipped items by slot
- Storage contents
- Current inventory tab state if needed

---

## Character Creation Requirements

When a new Barbarian is created:

1. Character save is created
2. Starter items are generated or assigned
3. Starter items are placed directly into:
   - Primary Weapon
   - Secondary Weapon
   - Chest
4. Inventory renders these items as equipped

This must happen automatically.

---

## Existing Save Compatibility

If characters already exist before this system is added, ensure safe migration.

Recommended behavior:
- Existing Barbarian characters receive the default starter items if those slots are empty
- Do not overwrite already equipped items if future saves exist
- Avoid duplicating items on repeated load

The migration should be safe and idempotent.

---

## Stat Application Rules

Keep stat application simple.

### Initial Stat Effects

#### Common Axe
- adds a small bonus to melee damage

#### Common Javelin
- adds a small bonus to ranged damage

#### Common Chest Piece
- adds a small armor bonus

These bonuses should be integrated cleanly into current combat calculations.

### Design Constraint
The effect size should remain intentionally small.

This system is not meant to rebalance the game yet.
It is meant to establish the item framework.

---

## Future Expansion Hooks

This system should later support:

- Boss item drops
- Randomized rewards
- Quest rewards
- Higher rarities
- Special affixes
- Unique named items
- Set bonuses
- More armor slots if desired
- More weapon families by class
- Item comparison views
- Salvage or upgrade systems
- Character-specific loadouts

---

## UX Priorities

Prioritize:

- clarity
- reliability
- small clean interactions
- future-safe item structure

Do not prioritize:
- flashy visuals
- advanced drag effects
- deep loot systems yet

This should feel like a strong foundational system, not a full ARPG inventory.

---

## Acceptance Criteria

This task is complete when:

1. The inventory system supports item rarities:
   - Grey
   - Blue
   - Purple
   - Gold
   - Green

2. New Barbarian characters begin with:
   - Common Axe equipped
   - Common Javelin equipped
   - Common Chest Piece equipped

3. Equipment slots enforce valid item types

4. Equipped items can be dragged into storage

5. Stored items can be dragged back into valid equipment slots

6. Invalid drops are rejected safely

7. Storage supports at least 30 slots

8. Storage includes basic sorting controls

9. Item stats apply only as small incremental bonuses

10. Existing characters safely receive starter gear if needed

11. The implementation does not break current gameplay balance

12. The code structure is ready for future loot drops and rarity expansion

---

## Deliverable

Update the project to include:

- starter equipment system
- rarity framework
- drag-and-drop inventory behavior
- slot validation
- basic sorting
- small safe stat bonuses

Output full updated project files with clean structure and readable logic.