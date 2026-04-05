# Skill Prompt Manager – Subject Rules, Skill Linking, and Class System Fixes (PRD Update)

## Overview

This update refines the **Prompt Builder + Skill Linking system** to:

- Simplify Subject Rules
- Fix Skill → Prompt persistence and versioning
- Ensure proper **state switching when selecting skills**
- Introduce a **functional Class Rule selection system**
- Establish **palette control via class/weapon types**

---

## Key Changes Summary

### 1. Subject Rules Simplification
Remove:
- Weapon Context
- Subject Effect Behavior

Keep only:
- Image Reference
- Palette (optional override)
- Subject Description

All logic should now live inside **Subject Description**

---

## Updated Subject Rules Structure

### Subject Rules

- Image Reference (optional)
- Palette (optional override)
- Subject Description (primary field)

---

## Expected Behavior: Skill Selection (CRITICAL FIX)

### When user selects a different skill in Prompt Builder:

Example: switching from "Blood Frenzy" → "Widen Arc"

System should:

- Clear Subject Rules:
  - Image Reference → empty
  - Palette → empty (unless overridden later)
  - Subject Description → empty

- Keep:
  - Global Rules (unchanged)
  - Class Rules (based on selected class type)

---

## Important Rule

> Subject Rules are ALWAYS tied to the selected skill

> If no saved data exists → fields should be EMPTY

---

## Skill Linking – FIXED BEHAVIOR

### Current Issue

- Saving prompts increments version count
- But:
  - Versions are not visible
  - Not retrievable
  - Not tied to UI state

---

## Correct Behavior

### When user clicks "Save Prompt to Skill":

System must:

1. Save a new version entry
2. Persist the following:

- subjectDescription
- imageReference
- paletteOverride (if any)
- finalPrompt
- createdAt
- versionNumber (auto increment)

---

## Skill Data Model Update

### Skill

- id
- name
- classType
- category
- folderPath

---

### SkillPromptVersion

- id
- skillId
- versionNumber
- subjectDescription
- imageReference
- paletteOverride
- finalPrompt
- createdAt

---

## Skill Entry + Preview Panel – Version Display Fix

### Current Issue

- Only v01 visible
- v02+ not shown

---

### Required Fix

When viewing a skill:

- Display ALL versions:
  - v01
  - v02
  - v03

Each version should be selectable

---

## Behavior: Selecting a Version

When user selects a version:

System should populate:

### Subject Rules
- Image Reference
- Palette (if exists)
- Subject Description

### Prompt Output
- Final prompt

---

## Class Rules System (CRITICAL FIX)

### Current Issue

- Cannot select class type (e.g. Barbarian)
- Class templates exist but are not usable

---

## Required Behavior

### Class Rule Selector

Add dropdown:

Class Type:

Options:
- Barbarian
- Ranger
- Monk
- Necromancer
- Weapon (special category)

---

## Class Rule Behavior

When a class is selected:

System should:

- Load associated Class Template
- Apply its palette + style influence

---

## Class Palette System

Each class defines a **color identity**

### Examples

- Barbarian → reds, oranges, blacks
- Ranger → greens, browns
- Monk → golds, whites
- Necromancer → purples, sickly greens
- Weapon → neutral / metal tones

---

## Rule Priority System

Final prompt composition priority:

1. Global Rules (always applied)
2. Class Rules (based on selected class)
3. Subject Rules (skill-specific)
4. Palette Override (optional, highest priority)

---

## Prompt Builder Behavior Update

### When Class Changes

- Update palette influence
- DO NOT reset subject rules

---

### When Skill Changes

- Reset subject rules IF no saved version
- Load latest version IF exists

---

## Prompt Builder UI Updates

### Add Class Selector

Section: Class Rules

- Dropdown for Class Type
- Applies class template

---

### Subject Rules Section

Remove:
- Weapon Context
- Subject Effect Behavior

---

## Skill Linking Panel (Existing)

Ensure:

- Skill dropdown works correctly
- Save action persists usable data

---

## State Management Rules

### Prompt Builder State

Should track:

- selectedSkillId
- selectedClassType
- subjectRules
- globalTemplate (static)

---

## Edge Cases

### Switching Skills

- If skill has no versions → blank subject rules
- If skill has versions → load latest version

---

### Switching Class

- Updates palette + class styling
- Does NOT overwrite subject description

---

## Folder Consistency

Each version should correspond to image:

Example:

images  
→ skills  
→ barbarian  
→ blood_frenzy  
→ blood_frenzy_v01.png  
→ blood_frenzy_v02.png  

---

## MVP Scope (This Update)

Include:

- Subject Rules simplification
- Skill selection resets correctly
- Skill prompt saving works
- Version list displays correctly
- Version selection loads data
- Class selector works
- Class palette applied

---

## Exclude (For Now)

- Auto image syncing
- Prompt diffing
- Prompt comparison UI
- Skill → Prompt auto-preview button

---

## Success Criteria

- Switching skills correctly resets or loads data
- Saving prompts creates usable versions
- All versions are visible and selectable
- Class selection affects palette correctly
- Subject rules are simple and focused
- No hidden or broken state in UI