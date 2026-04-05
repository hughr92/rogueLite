# Skill Prompt Linking & Persistence – PRD Update

## Overview

This update enhances the **Skill Icon Prompt Manager** by introducing:

- Prompt → Skill linking
- Persistent **Subject Rules per skill**
- Ability to **reload and iterate on previous prompts**
- Skill-driven **auto-population of Prompt Builder**

This ensures that:
- Global and Class rules remain fixed
- Only **Subject Rules are tied to individual skills**
- Users can quickly iterate on previously created prompts

---

## Key Concept

> A **Skill stores its own Subject Rules and Prompt Configuration**, not the full template system.

- Global Rules → static
- Class Rules → static per class
- Subject Rules → **owned by the skill**

---

## New Feature: Link Prompt to Skill

### Location in UI

Inside **Prompt Builder**, below:

Final Prompt Output

Add:

- Skill Selector (searchable dropdown)
- Save Prompt to Skill button

---

## Skill Selector Behavior

User can:

- Search for an existing skill (e.g. "Blood Frenzy")
- Select that skill
- Click "Save Prompt to Skill"

---

## What Gets Saved to the Skill

When saving, store:

- Subject Rules (text input)
- Optional modifiers (color, effects, etc.)
- Final generated prompt
- Any reference inputs (optional)
- Timestamp
- Version number

---

## Important Rule

- Global Template → NOT saved per skill
- Class Template → NOT saved per skill
- Only **Subject + Prompt Configuration** is saved

---

## Skill Data Model Update

### Skill

- id
- name
- class
- category
- folderPath
- tags

---

### Skill Prompt Config (NEW)

- skillId
- subject
- modifiers
- finalPrompt
- referenceImage (optional)
- version
- createdAt

---

## Behavior: Loading a Skill

### From Skill Entry + Preview Panel

When user clicks a skill (e.g. Blood Frenzy):

System should:

1. Load saved Subject Rules into Prompt Builder
2. Auto-select:
   - Global Template (default)
   - Class Template (based on skill class)
3. Populate:
   - Subject field
   - Modifiers
   - Final prompt

---

## New Feature: "Preview Prompt Settings"

### Location

Inside **Skill Entry + Preview Panel**

Add button:

Preview Prompt Settings

---

### Behavior

When clicked:

- Opens or focuses Prompt Builder
- Populates builder with:
  - Skill’s saved Subject Rules
  - Associated Class Template
  - Default Global Template

---

## Prompt Builder Updates

### Add Section Below Final Prompt

Skill Linking Panel:

- Searchable Skill Dropdown
- Save Prompt Button

---

### Flow

1. User builds prompt
2. Selects skill from dropdown
3. Clicks Save
4. System:
   - Stores subject + config to skill
   - Creates/updates version

---

## Versioning Behavior

Each save creates:

- v01, v02, v03...

User can later:

- View previous versions
- Reload a version into builder (future enhancement)

---

## UX Flow Example

### Creating Prompt

1. Select Global Template
2. Select Class Template (Barbarian)
3. Enter Subject:
   "barbarian entering frenzy, blood aura pulsing outward"
4. Generate prompt
5. Select Skill → "Blood Frenzy"
6. Click Save

---

### Editing Later

1. Click "Blood Frenzy" in Skill Panel
2. Click "Preview Prompt Settings"
3. Prompt Builder auto-populates
4. Adjust subject or modifiers
5. Save new version

---

## Folder + Image Consistency

Skill remains linked to:

images  
→ skills  
→ barbarian  
→ blood_frenzy  
→ blood_frenzy_v01.png  

Prompt versions should align with image versions where possible.

---

## MVP Scope (This Update)

Include:

- Skill dropdown in Prompt Builder
- Save prompt to skill
- Store subject rules per skill
- Load skill into Prompt Builder
- Preview Prompt Settings button

Exclude:

- Auto image syncing
- Version comparison UI
- Prompt diffing

---

## Future Enhancements

- Version history viewer
- Side-by-side prompt comparison
- Auto-link image versions to prompts
- Tag-based skill filtering
- Prompt performance tracking

---

## Success Criteria

- User can reload any skill’s prompt instantly
- Iteration time reduced significantly
- No need to rewrite prompts from scratch
- Clear separation of:
  - Global rules
  - Class rules
  - Skill-specific rules