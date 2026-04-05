# Skill Icon Prompt Manager – PRD

## Overview

This tool is a **Skill Icon Prompt Manager UI** used to standardize, generate, and organize skill icon prompts for the game.

It allows the user to:
- Create and save **templated prompts**
- Generate **consistent Midjourney-ready prompts**
- Track **image outputs**
- Link prompts to **local folder paths**
- Preview generated **skill icon images**

This tool should feel similar in structure and usability to the existing **Sprite Builder** and **Map Editor**.

---

## Goals

- Standardize skill icon generation across the game  
- Reduce prompt inconsistency  
- Create a reusable prompt system  
- Maintain a structured image library  
- Enable fast iteration on icon variations  

---

## Core Features

### 1. Prompt Template System

Users can create reusable templates.

Each template contains:
- Template Name  
- Category (Global, Class, Weapon, Effect, etc.)  
- Base Prompt Text  
- Tags (optional)  

Templates are used as building blocks for final prompts.

---

### 2. Prompt Builder

UI that composes a final prompt using:

- Global Style Template (required)  
- Subject (skill description)  
- Optional Modifiers:  
  - Color theme  
  - Effect type (fire, lightning, shadow, etc.)  
  - Weapon type  
  - Class flavor  

Final Output:
- A fully concatenated Midjourney-ready prompt string  

---

### 3. Skill Entry System

Each skill icon entry contains:

- Skill Name  
- Class (Barbarian, Mage, etc.)  
- Category (Attack, Passive, Utility)  
- Folder Path (local project path)  
- Prompt Used  
- Version (v01, v02, etc.)  
- Tags  

---

### 4. Image Preview Panel

Each skill entry displays:

- Image preview (from local path)  
- Version selector (if multiple images exist)  
- Thumbnail grid (optional)  

If no image exists:
- Show placeholder state  

---

### 5. Folder Structure Integration

Each skill links to a folder path.

Example structure:

images  
→ skills  
→ barbarian  
→ ground_slam  
→ ground_slam_v01.png  
→ ground_slam_v02.png  

The UI should:
- Display the folder path  
- Allow editing of the path  
- Automatically suggest paths based on:
  - Class  
  - Skill name  

---

### 6. Prompt History / Versioning

Each skill should support multiple prompt versions:

- v01, v02, v03...  

Each version stores:
- Prompt used  
- Image reference  
- Notes (optional)  

User can:
- Switch versions  
- Duplicate a version to iterate  

---

### 7. Copy to Clipboard (Midjourney Flow)

Each generated prompt should have:

- Copy button  
- Quick access for paste into Midjourney  

---

## UI Layout

### Left Panel – Template Library

- List of templates  
- Filter by category  
- Select template to edit  

---

### Center Panel – Prompt Builder

Sections:

1. Global Template (dropdown)  
2. Subject Input (text field)  
3. Modifiers (dropdowns or tags)  
4. Final Prompt Output (read-only textarea)  
5. Copy Button  

---

### Right Panel – Skill Entry + Preview

- Skill metadata form  
- Folder path display  
- Image preview  
- Version selector  

---

## Data Model

### Template

- id  
- name  
- category  
- prompt  
- tags  

---

### Skill

- id  
- name  
- class  
- category  
- folderPath  
- tags  

---

### Skill Version

- versionNumber  
- prompt  
- imagePath  
- createdAt  
- notes  

---

## Prompt Composition Rules

Final prompt should be constructed as:

Global Template  
+ Subject Description  
+ Modifiers  
+ Style Consistency Tags  

Example Output:

top-down fantasy skill icon, glowing orange and gold background, radial light burst, strong vignette edges, high contrast black silhouette subject, dramatic lighting, painterly style, bold shapes, minimal detail, readable at small size, centered composition, no text, square icon  
a barbarian slamming a weapon into the ground, large circular shockwave expanding outward, debris and cracks radiating, bright impact point, energy burst from center  

---

## MVP Scope

Include:

- Template creation/editing  
- Prompt builder  
- Skill entry creation  
- Folder path linking  
- Image preview (static reference)  
- Copy prompt button  

Exclude for now:

- Direct Midjourney integration  
- Auto image generation  
- Cloud storage  
- Multi-user support  

---

## Future Enhancements

- Swap Midjourney for API-based generator  
- Auto-save generated images  
- Batch generation  
- Tag-based search across skills  
- AI-assisted prompt suggestions  
- Integration with asset pipeline  

---

## Technical Notes

- Frontend: React  
- State: Local state or simple store  
- Image loading: from local project paths  
- No backend required for MVP  

---

## Success Criteria

- User can create a prompt in under 10 seconds  
- Icons look visually consistent across skills  
- Prompt reuse reduces manual typing by 80%+  
- Easy navigation between skills and templates  