# PRD: Merchant System (Level-Based Item Shop for Character Progression)

## Objective

Add a **Merchant System** that allows the player to buy equipment items for their character outside of runs.

This system should establish the foundation for:

- level-based item availability
- class-specific item offerings
- item refresh timing
- progression between stages
- spending gold on equipment upgrades

For now, keep the system focused only on **items**.

Do not add:
- consumables
- crafting materials
- skill books
- rerolls
- services
- repairs
- quests
- dialogue trees

This should be a simple, clean first pass that supports only the current state of the game.

---

## Current Game Context

Right now:

- only **Level 1** exists
- only **Barbarian** exists
- only a small item pool exists
- item rarities currently relevant are:
  - Grey
  - Blue

The merchant should therefore only sell:

- low-tier items
- appropriate for Level 1
- class-relevant to Barbarian

---

## High-Level Goal

After returning from runs, the player should be able to access a merchant and spend gold on equipment upgrades.

The merchant should:

- sell items appropriate to the player’s current level
- favor the player’s class
- refresh inventory every 5 runs
- support future scaling across multiple levels

For now, this is a persistent progression/shop system between runs.

---

## Scope

### In Scope
- Merchant UI
- Merchant inventory generation
- Class-specific item filtering
- Level-based rarity restrictions
- Run-count-based refresh cycle
- Item purchasing using gold
- Buying items into storage or equipment flow
- Persistence of merchant inventory and refresh state

### Out of Scope
- Selling items back
- Reroll button
- Merchant dialogue
- Discounts
- Reputation systems
- Multiple merchants per level
- Merchant animations
- Consumables or services
- Multiple classes beyond Barbarian
- More than Level 1 item pools

---

## Core Merchant Concept

Each playable level will eventually have its own merchant.

That merchant:

- is associated with that level
- sells level-appropriate items
- refreshes stock after every 5 runs
- scales items to the level the player is currently on

For now:

- only **Level 1 Merchant** exists

---

## Merchant Access

The merchant should be accessible from the main progression UI.

Recommended placement:

- from home screen / character screen
- via a new tab or button
- clearly separate from in-run gameplay

Examples of acceptable UI entry:
- Merchant tab
- Visit Merchant button
- Shop button near character summary

Choose whichever integrates most cleanly with the existing menu layout.

---

## Merchant Behavior

## Level Association

Merchant stock should be tied to the player’s current level progression.

For now:

- if player is on Level 1
- merchant sells only Level 1 appropriate items

Later:
- higher levels unlock merchants with stronger inventory pools

---

## Class Specific Inventory

Merchant stock should be filtered by class.

For now:
- only Barbarian exists
- merchant sells Barbarian-appropriate gear only

This means the merchant can sell:
- Barbarian-compatible melee weapons
- Barbarian-compatible ranged weapons
- Barbarian-compatible armor
- future Barbarian-compatible jewelry

For current implementation, keep focus on:
- Axe
- Javelin
- Chestpiece
- optionally Helmet later if item pool supports it

Do not generate items for other classes yet.

---

## Merchant Refresh Rule

Merchant stock should refresh every **5 runs**.

### Run Counting Rule

A run counts as:
- any completed attempt where the player enters gameplay and exits via death, victory, or valid run completion

The merchant should not refresh after every run.

Instead:
- stock remains stable for a block of 5 runs
- after the 5th run, merchant inventory refreshes to a new set

---

## Merchant Refresh State

The system should track:

- how many runs have occurred since the last refresh
- current merchant stock
- when next refresh should happen

This state must persist across sessions.

If the player closes and reopens the game, merchant stock should remain unchanged until the refresh threshold is reached.

---

## Merchant Inventory Size

Keep the first implementation small.

Recommended starting inventory size:
- 4 to 8 items visible at a time

A good MVP target is:
- 6 items

This is enough to:
- feel like a real shop
- offer choices
- stay easy to test

---

## Merchant Item Pool Rules

For Level 1, merchant inventory should only generate from the low-tier item pool.

### Allowed Rarities for Level 1 Merchant
- Grey
- Blue

### Disallowed for now
- Purple
- Gold
- Green

This ensures:
- early balance stays controlled
- merchant inventory feels appropriately weak for Level 1

---

## Level-Based Item Scaling

Merchant items should scale to the level the player is on.

For now, since only Level 1 exists:

- all merchant items should be low item level
- all stat ranges should remain modest
- all power increases should be incremental, not game-breaking

The merchant should provide upgrades that are:
- helpful
- noticeable
- not mandatory to survive

The item system should support stronger future scaling, but current output must remain conservative.

---

## Item Quality Rules for Merchant Inventory

### Grey Items
- basic
- 1 to 2 stats
- plain names
- lower stat ranges

### Blue Items
- basic but slightly stronger
- 2 to 3 stats
- plain names
- slightly higher thresholds

For Level 1 Merchant:
- Grey should be most common
- Blue should be less common

Keep the shop feeling like:
- mostly basic upgrades
- occasional stronger option

---

## Purchase Flow

When the player buys an item:

1. Check that player has enough gold
2. Deduct gold
3. Add purchased item to player inventory

Recommended destination:
- purchased item goes to storage first

This avoids:
- overwriting equipped gear automatically
- forcing immediate equip decisions

Optional later:
- allow “equip now” prompt

For now:
- purchased items should go into the first available storage slot

If storage is full:
- purchase should be blocked
- show clear message

---

## Storage Interaction

Merchant purchases must integrate with the existing inventory system.

Requirements:
- purchased items appear in storage
- player can later drag them to equipment slots
- all slot validation still applies

The merchant does not need to manage equipment directly.
It only needs to sell items into the player’s owned inventory.

---

## UI Requirements

## Merchant Screen Layout

The merchant screen should show:

- Merchant title
- Current level association
- Refresh status
- Player gold
- Item list for sale

Each item card should show at minimum:
- item name
- rarity
- item type
- slot
- key stats
- price
- buy button

Optional:
- small rarity color treatment
- compact item descriptions

---

## Refresh Information UI

The player should be able to understand when the stock changes.

Show one of:
- Runs until refresh: X
- Refreshes in X runs
- Stock refreshes every 5 runs

Recommended:
- show exact remaining run count until next refresh

Example:
- Refresh in 3 runs

This makes the system understandable and testable.

---

## Merchant Item Card Content

Each merchant item entry should clearly show:

- Name
- Rarity
- Item family
- Slot
- Relevant damage type if weapon
- Basic stat lines
- Price

Examples of readable labels:
- Axe
- Javelin
- Chestpiece

For now:
- Grey and Blue items should use plain names only

Do not add named uniques yet.

---

## Pricing Rules

Keep pricing simple and easy to tune.

Prices should be based on:
- rarity
- slot / item category
- item stat budget

For MVP:
- Grey items should be affordable
- Blue items should be noticeably more expensive

The player should not instantly buy everything after one run unless intended by current gold tuning.

Do not overcomplicate with dynamic economy systems.

---

## Example Pricing Philosophy

Use a simple structure such as:

- Grey = low cost
- Blue = moderate cost

Weapon and armor prices can vary slightly by category, but keep it readable.

The exact numbers are less important than:
- internal consistency
- easy future tuning
- meaningful decision-making

---

## Merchant Inventory Generation Rules

When generating merchant stock:

1. Determine current player level progression
2. Determine allowed rarity pool for that level
3. Filter item pool to class-valid items
4. Generate shop selection from eligible items
5. Persist that stock until refresh threshold is reached

For Level 1:
- item pool is low-tier Barbarian gear only
- rarity pool is Grey and Blue only

---

## Duplicate Item Handling

For MVP, duplicates are acceptable.

However:
- avoid generating a shop of nearly identical useless duplicates if possible

Preferred behavior:
- try to maintain some variety across:
  - melee
  - ranged
  - armor

If item pool is still tiny, duplicates are okay temporarily.

---

## Persistent Merchant State

The game should save, per character or progression state as appropriate:

- current level reached
- merchant inventory for that level
- runs since last refresh
- next refresh threshold progress

Decide whether merchant state is:
- per character
- or per account / save profile

Recommended for now:
- merchant state should be tied to the character, because progression is character-based

---

## Character Progression Integration

Merchant inventory should scale based on where the character is in progression.

For now:
- all characters are effectively Level 1 characters

Later:
- when a character clears a level, they gain access to the next level’s merchant pool

This PRD should prepare for that without needing to implement multiple levels now.

---

## Future Expansion Hooks

This system should be structured to support:

- multiple merchants by level
- more classes
- larger item pools
- Purple / Gold / Green items
- merchant rerolls
- selling items
- discounts
- special weekly offers
- class-specific unique items
- item categories beyond equipment
- consumables and crafting materials later

---

## UX Priorities

Prioritize:
- clean UI
- understandable refresh cycle
- stable persistence
- easy item inspection
- easy gold spending flow

Do not prioritize:
- flavor text
- merchant personalities
- deep economy systems
- advanced shop interactions

This should feel like a clean progression vendor, not a full RPG town system.

---

## Edge Cases

Handle these safely:

### Not Enough Gold
- Buy button disabled or purchase blocked with message

### Storage Full
- Purchase blocked with message

### Merchant Has Not Refreshed Yet
- Stock remains unchanged

### Existing Save Compatibility
If merchant system is added to existing saves:
- initialize Level 1 merchant stock safely
- initialize run counter safely
- do not overwrite player inventory

---

## Testing Support

Because this is a progression system, make it easy to inspect during testing.

Recommended:
- show current merchant refresh counter in UI
- optionally expose current merchant level tag in the test info panel later

This is not mandatory, but useful.

---

## Acceptance Criteria

This feature is complete when:

1. A merchant can be accessed from the main progression UI
2. The merchant sells equipment items only
3. Merchant stock is class-specific
4. Current Barbarian merchant offers only Barbarian-compatible gear
5. Level 1 merchant sells only Grey and Blue items
6. Merchant stock refreshes every 5 runs
7. Refresh progress persists across sessions
8. Purchased items cost gold
9. Purchased items go into storage
10. Purchase is blocked if gold is insufficient
11. Purchase is blocked if storage is full
12. Merchant stock is level-scaled and future-safe for multiple levels
13. Current implementation stays focused on Level 1 only
14. The system does not add non-item shop features yet

---

## Deliverable

Implement a Level 1 merchant system that:

- sells Barbarian-compatible Grey and Blue equipment
- refreshes every 5 runs
- uses player gold
- places purchased items into inventory storage
- is structured for future multi-level expansion

Output full updated project files with clean structure and readable logic.