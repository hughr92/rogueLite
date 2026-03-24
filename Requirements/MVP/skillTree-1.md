# PRD: Weapon Skill Tree + Class Tabs (Main Menu UI Update)

## Objective

Update the main menu character panel to introduce a clearer long-term progression structure by separating:

- **Class Skill Tree (placeholder)**
- **Weapon Skill Tree (fully visible for MVP)**

This establishes the foundation for:
- class identity (future system)
- weapon-based progression (current focus)

For now:
- only **Barbarian** exists
- only **Axe (melee)** and **Javelin (ranged)** are available
- class skill tree is **non-functional placeholder**
- weapon skill tree is **read-only preview**

---

## Goal

When a player selects a character from the home screen, they should:

1. See their character summary
2. See two tabs:
   - **Class**
   - **Weapons**
3. Be able to switch between these tabs
4. Understand:
   - Barbarian has a class identity (future system)
   - Barbarian uses weapons that define gameplay (current system)

---

## Scope

### In Scope
- Add tab system to character panel
- Add Class Skill Tree placeholder
- Add Weapon Skill Tree UI
- Show:
  - melee weapon category
  - ranged weapon category
- Show:
  - Axe tree under melee
  - Javelin tree under ranged
- Keep everything read-only

### Out of Scope
- Unlocking nodes
- Spending currency
- Skill tree progression logic
- Multiple classes
- Additional weapons beyond Axe and Javelin
- Deep interactivity

---

## User Experience

### Flow

1. Player opens game
2. Player selects a character
3. Character panel updates
4. Two tabs are visible:
   - **Class**
   - **Weapons**
5. Default tab: **Weapons** (recommended for MVP clarity)

---

## UI Structure

## Character Panel Layout

When a character is selected, the right-side panel should include:

- Character Name
- Class: Barbarian
- Gold
- Legacy XP
- Best Time

Below this summary:

### Tab Bar
- Tab 1: **Weapons**
- Tab 2: **Class**

Tabs should:
- be clearly clickable
- highlight active tab
- switch content below without reloading the page

---

## Tab 1: Weapon Skill Tree (Primary Focus)

### Section Title
**Weapon Skill Tree**

### Subtext
`Available weapon specializations for this class`

---

## Weapon Categories

Split into two clear sections:

### 1. Melee Weapons
Label:
- **Melee**

Description:
- `Close-range combat options focused on control and burst damage`

Content:
- For now, only:
  - **Axe**

---

### 2. Ranged Weapons
Label:
- **Ranged**

Description:
- `Distance-based weapons for pressure and targeting`

Content:
- For now, only:
  - **Javelin**

---

## Weapon Tree Structure

Each weapon should be displayed as its own simple “tree” or list.

No need for visual connectors yet.

---

## Axe (Melee Weapon)

Label:
- **Axe**

Description:
- `Directional cleave weapon with high impact and area control`

Show 5 upgrade nodes:

- Heavy Edge  
  Increase axe damage

- Quick Cleave  
  Reduce swing cooldown

- Widen Arc  
  Increase attack width / cleave angle

- Twin Swing  
  Add an additional follow-up swing

- Whirlwind  
  Evolve into a full-circle or near full-circle attack

---

## Javelin (Ranged Weapon)

Label:
- **Javelin**

Description:
- `Auto-targeted projectile weapon for consistent ranged pressure`

Show 5 upgrade nodes:

- Barbed Tip  
  Increase javelin damage

- Quick Throw  
  Reduce throw cooldown

- Long Flight  
  Increase projectile speed and/or range

- Volley  
  Throw additional javelins

- Piercing Cast  
  Javelins pass through additional enemies

---

## Presentation Style (Weapons Tab)

Keep layout clean and readable.

Recommended structure:

- Weapon Skill Tree (title)
  - Melee section
    - Axe card/panel
      - name
      - short description
      - vertical list of upgrades
  - Ranged section
    - Javelin card/panel
      - name
      - short description
      - vertical list of upgrades

Styling guidelines:
- bordered cards or panels
- consistent spacing
- bold headers
- short descriptions
- no clutter
- no heavy graphics required

---

## Tab 2: Class Skill Tree (Placeholder)

### Section Title
**Barbarian Skill Tree**

### Subtext
`Innate abilities and long-term class progression (coming soon)`

### Content

For now, DO NOT implement actual nodes.

Instead show:

- a clean placeholder panel
- optional flavor text

Example content:

- "Barbarians specialize in aggressive melee combat and momentum-based fighting styles."
- "Class abilities and passive bonuses will be unlocked using Legacy XP."
- "This system will expand your core combat identity beyond weapons."

Optional placeholder sections:
- Passive Traits (coming soon)
- Rage Mechanics (coming soon)
- Survivability Traits (coming soon)

Do not overbuild this section.

---

## Interaction Behavior

### Tab Switching
- Clicking **Weapons** shows weapon skill tree
- Clicking **Class** shows class placeholder
- No reload
- No delay

### Default State
- When a character is selected → default to **Weapons tab**

### No Character Selected
Show message:
- `Select a character to view skill trees`

Hide tab content until a character is selected.

---

## Data Structure Guidance

Even though this is UI-only, structure data cleanly for expansion.

Suggested logical structure (not code):

- Classes
  - barbarian
    - weaponCategories
      - melee
        - axe
          - upgrades (5 items)
      - ranged
        - javelin
          - upgrades (5 items)
    - classTree (empty or placeholder)

This ensures future support for:
- more weapons per category
- more categories if needed
- multiple classes

---

## Rendering Guidance

Create a clear separation between:

- character selection logic
- tab state (active tab)
- UI rendering

Suggested structure:

- function to render character summary
- function to render tab bar
- function to render weapons tab
- function to render class tab

Avoid mixing logic across systems.

---

## Content Copy

### Weapons Tab
**Weapon Skill Tree**  
`Available weapon specializations for this class`

### Melee Section
**Melee**  
`Close-range combat options focused on control and burst damage`

### Ranged Section
**Ranged**  
`Distance-based weapons for pressure and targeting`

---

### Class Tab
**Barbarian Skill Tree**  
`Innate abilities and long-term class progression (coming soon)`

---

## UI States

### State 1: No Character Selected
- show placeholder message
- hide tabs or disable interaction

### State 2: Character Selected (Weapons Tab Active)
- show weapon categories
- show Axe and Javelin trees

### State 3: Character Selected (Class Tab Active)
- show placeholder class panel

### State 4: Future-safe fallback
If class is unknown:
- show message:
  - `Skill tree not available for this class`

---

## Save / Persistence Notes

No new save requirements needed.

Ensure:
- characters already include a `class` field
- default existing characters to:
  - class: barbarian

Do not store:
- skill tree progress
- unlocked nodes

This is strictly visual.

---

## Implementation Notes

- Keep everything lightweight
- Avoid over-engineering
- Use simple DOM structure and CSS
- Ensure layout works even if content grows later
- Allow vertical scrolling if panel becomes tall

The key outcome is clarity:
- Player immediately understands:
  - they have class progression (future)
  - they have weapon progression (current)

---

## Acceptance Criteria

This task is complete when:

1. Selecting a character shows a tab system with:
   - Weapons
   - Class

2. Weapons tab is active by default

3. Weapons tab shows:
   - Melee → Axe with 5 upgrades
   - Ranged → Javelin with 5 upgrades

4. Class tab shows:
   - Barbarian Skill Tree title
   - placeholder text

5. Tabs switch cleanly without reload

6. Layout is readable and clean

7. No gameplay systems are affected

8. Code structure allows:
   - adding more weapons later
   - adding more classes later
   - turning class tab into real system later

---

## Deliverable

Update the main menu UI to include:
- tab system
- weapon skill tree view
- class placeholder view

Output full updated project files with clean structure.