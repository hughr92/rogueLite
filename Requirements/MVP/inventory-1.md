# PRD: Inventory System UI (Main Menu – Character Panel Expansion)

## Objective

Introduce a new **Inventory tab** alongside existing tabs:

- Weapons
- Class
- Inventory (new)

This feature establishes the foundation for:
- Equipment systems
- Loot drops (bosses, rewards)
- Build customization outside of runs

For now:
- This is **UI-only**
- No items exist yet
- No equip logic required
- No stat changes required

This is a **mocked but structured inventory system** ready for future expansion.

---

## Goal

When a player selects a character, they should:

1. See three tabs:
   - Weapons
   - Class
   - Inventory

2. Click **Inventory**
3. View:
   - Character equipment slots (silhouette layout)
   - Storage (inventory grid below)

This should clearly communicate:
- where items will go
- how equipment is structured
- that loot and progression systems are coming

---

## Scope

### In Scope
- Add Inventory tab
- Character equipment layout (silhouette-style)
- Equipment slots:
  - Helmet
  - Chest (Armor)
  - Primary Weapon (Melee)
  - Secondary Weapon (Ranged)
  - Ring 1
  - Ring 2
  - Amulet
- Storage grid (30 slots)
- Optional storage tabs (basic)
- Placeholder visuals for empty slots

### Out of Scope
- Item generation
- Equipping logic
- Drag and drop
- Stat calculation
- Tooltips
- Item rarity
- Backend changes beyond optional structure prep

---

## UI Structure

## Tab Bar Update

Add third tab:

- Weapons
- Class
- **Inventory**

Behavior:
- Tabs switch instantly
- Inventory tab loads its UI panel
- Default tab remains **Weapons**

---

## Inventory Tab Layout

### Section 1: Equipment (Top)

Title:
**Equipment**

Subtext:
`Equip items to enhance your character (coming soon)`

---

## Character Silhouette Layout

Use a simple placeholder (no art needed):
- basic human outline or rectangle figure
- or even just a centered box

Around or overlaid on this silhouette, place equipment slots.

---

## Equipment Slots

### Required Slots

- Head (Helmet)
- Chest (Armor)
- Primary Weapon (Melee)
- Secondary Weapon (Ranged)
- Ring Slot 1
- Ring Slot 2
- Amulet

---

## Suggested Layout (Conceptual)

- Top:
  - Helmet slot

- Center:
  - Chest slot

- Left side:
  - Primary Weapon (Melee)

- Right side:
  - Secondary Weapon (Ranged)

- Bottom left/right:
  - Ring 1 / Ring 2

- Bottom center:
  - Amulet

---

## Slot Presentation

Each slot should:
- be a visible square or circle
- have a border
- show label or icon placeholder

Example labels:
- Helmet
- Chest
- Melee
- Ranged
- Ring
- Amulet

Empty state:
- show faint icon or text:
  - “Empty”
  - or slot name

No items displayed yet.

---

## Section 2: Storage (Below Equipment)

Title:
**Storage**

Subtext:
`Items collected during your journey will appear here`

---

## Storage Grid

### Requirements

- 30 slots total per tab
- Display as grid:
  - e.g., 5 columns x 6 rows
- Each slot:
  - square
  - bordered
  - empty placeholder

---

## Storage Tabs (Optional but Recommended)

Allow 2–3 tabs:

- Tab 1: General
- Tab 2: (future use)
- Tab 3: (future use)

Behavior:
- clicking tab switches visible grid
- each tab has its own 30 slots

For now:
- all slots empty
- no persistence required beyond structure

---

## Visual Design Guidelines

Keep everything:

- clean
- minimal
- readable
- expandable

Avoid:
- heavy graphics
- complex animations
- drag-and-drop systems

Use:
- simple borders
- subtle background contrast
- consistent spacing
- clear labels

---

## Interaction Behavior

### Equipment Slots
- Static for now
- No click interaction required
- Optional:
  - hover highlight (lightweight)

---

### Storage Slots
- Static grid
- No item interaction yet
- Optional:
  - hover highlight

---

### Tabs
- Instant switching
- Maintain active state visually

---

## Empty State Handling

If no character is selected:
- show message:
  - `Select a character to view inventory`

Hide equipment + storage panels until a character is selected.

---

## Data Structure Guidance (Future-Proofing)

Even though not used yet, structure should support:

### Equipment

Per character:
- helmet
- chest
- primary weapon
- secondary weapon
- ring1
- ring2
- amulet

Each slot:
- initially null / empty

---

### Storage

Per character:

- storageTabs
  - tab1: 30 slots
  - tab2: 30 slots
  - tab3: 30 slots

Each slot:
- empty placeholder

---

## Future Expansion Hooks

This system should easily support:

- Items dropping from:
  - bosses
  - events
  - quests
- Drag-and-drop equipping
- Item stats and modifiers
- Rarity tiers
- Set bonuses
- Inventory sorting and filtering
- Expanded storage tabs
- Shared vs character-bound storage

---

## Content Copy

### Equipment Section
**Equipment**  
`Equip items to enhance your character (coming soon)`

---

### Storage Section
**Storage**  
`Items collected during your journey will appear here`

---

### Empty State
`Select a character to view inventory`

---

## UI States

### State 1: No Character Selected
- Show placeholder message
- Hide inventory UI

---

### State 2: Character Selected
- Show:
  - equipment silhouette + slots
  - storage grid
  - storage tabs

---

### State 3: Future (Items Present)
- Slots display item icons
- Storage grid populated

(Not required for this task)

---

## Acceptance Criteria

This feature is complete when:

1. A third tab **Inventory** appears alongside Weapons and Class
2. Clicking Inventory shows:
   - Equipment section with silhouette layout
   - All required equipment slots
3. Storage section appears below:
   - 30 visible slots
   - grid layout
4. Optional:
   - multiple storage tabs function correctly
5. No items are required to exist
6. Layout is clean and readable
7. UI scales for future item system
8. No gameplay systems are impacted

---

## Deliverable

Update the main menu UI to include:

- Inventory tab
- Equipment slot layout
- Storage grid system

Output full updated project files with clean structure and consistent styling.