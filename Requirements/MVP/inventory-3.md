# PRD: Damage-Type-Aware Item Data Structure + In-Game Item Reference Panel

## Objective

Update the item system specification so that weapon damage is no longer described in generic terms such as “melee damage” or “ranged damage,” and instead uses explicit physical damage types.

This update should also add a lightweight in-game reference panel so item rules can be reviewed inside the UI during testing without opening source files.

This task should produce:

- a cleaner item data structure direction
- explicit damage typing for future resistance/weakness systems
- controlled item generation rules by rarity
- a test-only in-game item information panel
- a compact item reference list, not every permutation

---

## Core Design Update

## Physical Damage Types

All weapons should use a defined physical damage type.

Supported physical damage types:

- Slashing
- Piercing
- Bludgeoning

These matter because future enemies will have:

- resistances
- weaknesses
- immunities or partial reductions

This means weapon identity should be explicit from the start.

---

## Current Barbarian Weapon Mapping

For the current Barbarian loadout:

- Axe
  - weapon category: Melee
  - physical damage type: Slashing

- Javelin
  - weapon category: Ranged
  - physical damage type: Piercing

Do not use generic labels like:
- Melee Damage
- Ranged Damage

Instead use:
- Slashing Damage
- Piercing Damage

Later weapons may introduce:

- Mace = Bludgeoning
- Sword = Slashing
- Spear = Piercing
- Hammer = Bludgeoning
- Great Axe = Slashing
- Bow = Piercing

---

## Item Stat Philosophy by Rarity

The rarity rules remain:

1. Grey
2. Blue
3. Purple
4. Gold
5. Green

For now, focus on Grey, Blue, Purple, and Gold logic.
Green can remain reserved for future highest-tier special content.

---

## Grey Items

Grey items should be:

- bland
- simple
- low power
- have 1 to 2 stats only
- never include special effects
- never include elemental effects
- never include named uniqueness

Grey gear is baseline equipment.

### Grey Weapon Rules
Grey weapon stat pool should draw from:

- Physical damage bonus
- Attack speed
- Attack width or attack range where applicable
- Cooldown reduction where appropriate

A Grey item should have:
- always 1 core stat
- optionally 1 extra minor stat
- never more than 2 total stats

### Grey Armor Rules
Grey armor should have:
- armor
- or armor plus health
- simple, plain stats only

---

## Blue Items

Blue items should be:

- still bland
- slightly stronger than Grey
- have 2 to 3 stats
- only use stat thresholds slightly above Grey
- no unique naming
- no advanced special mechanics

Blue items may include one extra utility stat more often than Grey.

### Blue Weapon Rules
Blue weapons should include:
- required physical damage stat
- plus 1 or 2 additional basic stats

Possible additional stats:
- attack speed
- attack width
- cooldown reduction
- projectile speed for ranged
- projectile range for ranged

### Blue Armor Rules
Blue armor may include:
- armor
- health
- minor damage reduction
- other small defensive thresholds later

Still no elemental rider damage yet unless deliberately introduced later.
For now, elemental damage begins at Purple.

---

## Purple Items

Purple items should be:

- noticeably stronger than Blue
- still generic in name
- include 2 to 4 stats
- begin introducing elemental or status enhancement
- still not fully unique named items

Purple is where the first real “interesting” drops begin.

### Purple Weapon Rules
Purple weapons should include:
- physical damage bonus
- 1 or 2 supporting combat stats
- optional elemental rider damage
- optional minor status enhancement

Purple item names should still remain plain:
- Axe
- Javelin
- Chestpiece

No unique names yet.

---

## Gold Items

Gold items should be:

- named
- unique
- more special
- more build-defining
- may include special mechanics
- may include status interactions
- may include conditional effects

Gold items are where identity begins.

Examples:
- Bloodied Axe
- Worldsplitter
- Stormcaller Javelin

Gold items can:
- apply stacking bleed
- chain lightning
- modify Rage generation
- alter swing behavior
- enable powerful conditional bonuses

---

## Green Items

Green remains reserved for later.

Conceptually:
- highest rarity currently planned
- strongest or strangest items
- potentially boss-specific
- potentially highly unique or transformational

Do not implement Green item complexity yet beyond supporting the rarity label in structure.

---

## Supported Elemental Damage Types

Purple and above should support a standard elemental pool.

Allowed elemental damage types:

- Fire
- Lightning
- Ice
- Poison
- Acid

These should be treated as bonus damage types layered on top of the weapon’s physical base type.

### Examples
- Axe = Slashing + Fire
- Javelin = Piercing + Ice
- Axe = Slashing + Poison

This creates future compatibility with enemy weaknesses and resistances.

---

## Supported Status / Damage Rider Concepts

These do not all need to be fully implemented immediately, but the structure should anticipate them.

Allowed status or rider effect categories:

- Bleed
- Burn
- Shock
- Chill
- Poisoned
- Corrode / Acid exposure

Conceptual mapping:

- Fire can imply Burn
- Lightning can imply Shock
- Ice can imply Chill or Slow
- Poison can imply Poisoned
- Acid can imply Corrode or defense reduction
- Bleed remains a physical/status hybrid, often suited for slashing weapons

---

## Item Attribute Families

To keep item generation structured, item attributes should be grouped into families.

### Physical Offense Stats
- Slashing Damage
- Piercing Damage
- Bludgeoning Damage

### Speed / Timing Stats
- Attack Speed
- Cooldown Reduction

### Area / Reach Stats
- Cleave Width
- Melee Range
- Projectile Speed
- Projectile Range

### Defensive Stats
- Armor
- Health
- Damage Reduction

### Elemental Rider Stats
- Fire Damage
- Lightning Damage
- Ice Damage
- Poison Damage
- Acid Damage

### Future Utility Stats
- Gold Find
- Pickup Radius
- Rage Gain
- Crit Chance
- Healing Received
- Movement Speed

Not all of these need to be in the current live item pool, but the item system should be ready for them.

---

## Item Data Structure Direction

The item system should be organized so each item definition clearly communicates:

- item name
- rarity
- slot
- item category
- weapon category if applicable
- physical damage type if applicable
- stat entries
- optional elemental options
- optional status effect hooks
- item level or progression tier
- whether item is generic or unique

---

## Required Top-Level Item Fields

Each item definition should support the following conceptual fields:

1. Item Name
2. Rarity
3. Slot
4. Item Category
5. Weapon Category if applicable
6. Physical Damage Type if applicable
7. Item Level
8. Stats
9. Optional Elemental Damage Entry
10. Optional Status Effect Entry
11. Is Unique
12. Unique Effect Description if applicable

---

## Slot Definitions

Allowed slots:

- Helmet
- Chest
- Primary Weapon
- Secondary Weapon
- Ring
- Amulet

---

## Item Category Definitions

Allowed item categories for current design:

- Weapon
- Armor
- Jewelry

Optional subcategories:

- Melee Weapon
- Ranged Weapon
- Helmet
- Chest
- Ring
- Amulet

---

## Weapon Type Definitions

For current testing, support these initial weapon families conceptually:

- Axe
  - melee
  - slashing

- Javelin
  - ranged
  - piercing

This should remain easy to extend later for sword, mace, bow, spear, hammer, etc.

---

## Item Range Display Rules for Testing

Do not list every possible item permutation in the UI or in the test reference.

Instead, show:

- the range of damage values a weapon can roll by rarity
- the possible extra stat pools by rarity
- the available elemental damage options for Purple and above
- example unique behavior categories for Gold

This keeps the test panel readable.

---

## Example Range Guidance for Current Barbarian Testing

These are not final balance targets, but examples of the type of information that should be visible.

### Axe Drop Range Display
Should show:
- Physical damage type: Slashing
- Grey damage bonus range
- Blue damage bonus range
- Purple damage bonus range
- Gold damage bonus range
- possible extra stats by rarity
- elemental options available at Purple+
- status or unique concepts at Gold

### Javelin Drop Range Display
Should show:
- Physical damage type: Piercing
- Grey damage bonus range
- Blue damage bonus range
- Purple damage bonus range
- Gold damage bonus range
- possible extra stats by rarity
- elemental options available at Purple+
- status or unique concepts at Gold

### Chestpiece Display
Should show:
- armor range by rarity
- health range by rarity
- optional defensive bonus pools by rarity

---

## Example Reference Content to Show In UI

The in-game reference panel should show compact test information such as:

### Axe
- Damage Type: Slashing
- Grey:
  - Slashing Damage range
  - optional Attack Speed
  - optional Cleave Width
- Blue:
  - higher Slashing Damage range
  - optional Attack Speed
  - optional Cleave Width
  - optional Cooldown Reduction
- Purple:
  - higher Slashing Damage range
  - Attack Speed or Cleave Width
  - optional elemental rider:
    - Fire
    - Lightning
    - Ice
    - Poison
    - Acid
- Gold:
  - named unique items
  - can include Bleed
  - can include special attack behavior
  - can include Rage synergy

### Javelin
- Damage Type: Piercing
- Grey:
  - Piercing Damage range
  - optional Throw Rate or Projectile Speed
- Blue:
  - higher Piercing Damage range
  - optional Throw Rate
  - optional Projectile Speed
  - optional Cooldown Reduction
- Purple:
  - higher Piercing Damage range
  - combat support stat
  - optional elemental rider:
    - Fire
    - Lightning
    - Ice
    - Poison
    - Acid
- Gold:
  - named unique items
  - can include piercing-through behavior
  - can include chain or bounce logic
  - can include status effects

### Chestpiece
- Grey:
  - Armor
  - optional Health
- Blue:
  - more Armor
  - more Health
  - optional Damage Reduction
- Purple:
  - stronger Armor
  - stronger Health
  - optional Regen or mitigation support
- Gold:
  - named unique armor
  - strong defensive conditionals
  - low-health survival effects
  - surrounded-by-enemies effects

---

## Test Utility Panel Requirement

Add a sticky test UI panel in the game interface so item data can be reviewed in-app.

### Placement
- Bottom left
- Sticky or fixed position
- Always accessible during testing
- Should not block core play UI too aggressively

### Purpose
This is a developer/testing convenience panel.
It allows quick inspection of current item rules from inside the UI.

---

## Test Utility Entry Point

The panel should start as a compact button, tab, or small visible icon.

Suggested label:
- Info
- Test Info
- Data
- Debug Info

Recommended approach:
- a small sticky button in bottom-left
- clicking opens an overlay, drawer, or popout panel

---

## Test Utility Panel Sections

Inside the panel, include a section called:

- Weapons
- or Item Reference

Inside that section, organize by item family:

1. Melee Weapons
2. Ranged Weapons
3. Armor

For the current implementation, it is enough to include:

- Axe
- Javelin
- Chestpiece

Optional future additions:
- Helmet
- Rings
- Amulets

---

## Test Utility Panel Content Rules

Do not dump all raw item definitions.

Instead show a curated reference:

### For each supported item type, display:
- item family name
- slot
- physical damage type if weapon
- rarity tiers supported
- damage or defense ranges by rarity
- optional stat pool by rarity
- available elemental rider options
- gold unique behavior category summary

This is a readability-first tool, not a raw JSON dump.

---

## Recommended Test Panel Content Structure

### Weapons Section

#### Axe
- Slot: Primary Weapon
- Weapon Type: Melee
- Damage Type: Slashing
- Rarity Progression:
  - Grey
  - Blue
  - Purple
  - Gold
  - Green reserved
- Damage Range by rarity
- Extra stat pool by rarity
- Elemental options:
  - Fire
  - Lightning
  - Ice
  - Poison
  - Acid
- Gold design themes:
  - Bleed
  - wider cleaves
  - Rage synergy
  - heavy impact effects

#### Javelin
- Slot: Secondary Weapon
- Weapon Type: Ranged
- Damage Type: Piercing
- Rarity Progression:
  - Grey
  - Blue
  - Purple
  - Gold
  - Green reserved
- Damage Range by rarity
- Extra stat pool by rarity
- Elemental options:
  - Fire
  - Lightning
  - Ice
  - Poison
  - Acid
- Gold design themes:
  - piercing
  - chaining
  - high velocity
  - status application

### Armor Section

#### Chestpiece
- Slot: Chest
- Core stats:
  - Armor
  - Health
- Rarity progression
- possible extra defensive stat pools

---

## Suggested Initial Range Display Categories

The UI reference should display range categories, not exact enumerations.

For example, it can show:

### Grey Axe
- Slashing Damage: low range
- Possible secondary rolls:
  - Attack Speed
  - Cleave Width

### Blue Axe
- Slashing Damage: modest range
- Possible secondary rolls:
  - Attack Speed
  - Cleave Width
  - Cooldown Reduction

### Purple Axe
- Slashing Damage: stronger range
- Possible secondary rolls:
  - Attack Speed
  - Cleave Width
  - Cooldown Reduction
- Elemental options:
  - Fire
  - Lightning
  - Ice
  - Poison
  - Acid

### Gold Axe
- Unique named item
- Higher stat budget
- May include Bleed or special behavior

Use the same structure for Javelin and Chestpiece.

---

## Inventory and Item Viewer Relationship

This item reference panel is separate from the Inventory tab.

Inventory tab should still show:
- equipped items
- storage
- draggable gear

The new bottom-left panel is a testing aid and should not replace the inventory.

---

## Current Live Item Requirements

For now, keep the live starter item set small:

- Common Axe
- Common Javelin
- Common Chestpiece

But the data structure and test panel should already support:

- future Blue items
- future Purple items
- future Gold uniques
- future elemental rider options
- future named item themes

---

## Balance Philosophy

This update should not break the current game.

Item stat contributions should remain small and stable.

The new structure is primarily to:

- support future loot design
- support enemy resistances and weaknesses
- support in-UI testing and validation

Keep starter item bonuses conservative.

---

## Acceptance Criteria

This task is complete when:

1. Weapon items use explicit physical damage types:
   - Slashing
   - Piercing
   - Bludgeoning

2. Current Barbarian mappings are:
   - Axe = Slashing
   - Javelin = Piercing

3. The item structure supports:
   - rarity
   - slot
   - item category
   - physical damage type
   - stat entries
   - elemental rider options
   - unique effect hooks

4. The item rules reflect:
   - Grey = 1 to 2 bland stats
   - Blue = 2 to 3 slightly stronger bland stats
   - Purple = stronger stats plus elemental options
   - Gold = named unique items with special behaviors

5. Supported elemental rider options are clearly defined:
   - Fire
   - Lightning
   - Ice
   - Poison
   - Acid

6. A sticky bottom-left test info control exists in the UI

7. Clicking the test info control opens a readable in-game item reference panel

8. The panel shows curated item range and option data for:
   - Axe
   - Javelin
   - Chestpiece

9. The panel does not list every item permutation

10. The panel shows:
   - damage or armor ranges by rarity
   - possible extra stat pools
   - elemental option pools
   - unique design themes for Gold

11. Current gameplay remains stable and is not heavily rebalanced

---

## Deliverable

Update the project to include:

- damage-type-aware item definitions
- future-safe item stat structure
- curated item range reference data
- a sticky bottom-left in-game item info panel for testing

Output full updated project files with clean structure and readable logic.