# PRD: Skill Strip UI (Hover, Cooldown Overlay, Keybind Display)

## Overview

This document defines the UI behavior and structure for the **Skill Strip** component.

The Skill Strip displays player skills as **square icons** with:

- Background images (skill art)
- Hover-to-reveal skill name
- Cooldown overlay animation
- Keybinding display

The goal is to create a **clean, readable, and responsive skill bar** that provides immediate visual feedback with minimal UI clutter.

---

## Goals

- Display all equipped skills as square icons
- Use skill image as background
- Reveal skill name on hover
- Show cooldown progress visually
- Display keybind clearly
- Indicate when skill is ready vs on cooldown

---

## Non-Goals (MVP)

- No drag-and-drop reordering
- No mobile touch interactions (hover only for now)
- No advanced tooltip panels
- No skill upgrade UI inside this component

---

## Component Structure

### Parent Container

- `skill-strip`
  - Horizontal container
  - Holds multiple skill items

---

### Skill Item

Each skill is an `article` element:

- `skill-item` (article)
  - `skill-background`
  - `cooldown-overlay`
  - `skill-name` (hidden by default)
  - `keybind-label`

---

## Layout Rules

### Skill Strip

- Display: flex (row)
- Gap between items: small (e.g., 8px)
- Anchored to bottom center of screen (recommended)

---

### Skill Item

- Shape: **square**
- Size: fixed (e.g., 64x64 or 72x72)
- Position: relative
- Overflow: hidden

---

## Visual Layers (Per Skill)

Each skill item is composed of layered elements:

### 1. Background (Skill Image)

- Fills entire square
- Uses:
  - `background-image`
  - `background-size: cover`
  - `background-position: center`

---

### 2. Cooldown Overlay

- Positioned on top of background
- Covers entire skill area
- Semi-transparent dark layer

Behavior:

- Starts fully covering icon after skill use
- Shrinks vertically (bottom → top) as cooldown progresses
- When cooldown completes:
  - Overlay disappears
  - Skill becomes fully visible and bright

---

### 3. Skill Name (Hover State)

- Hidden by default
- Appears on hover

Behavior:

- Fade in on hover
- Positioned centered or bottom-center
- Short label only (no long descriptions)

---

### 4. Keybind Label

- Positioned bottom-left corner
- Small text
- Always visible

Example:

- "Q"
- "1"
- "E"

---

## Interaction Behavior

### Hover (Mouse Only - MVP)

On hover over skill item:

- Reveal skill name
- Optional: slightly brighten icon
- Optional: slight scale-up (e.g., 1.05)

---

### Active Use

When skill is triggered:

- Cooldown overlay instantly resets to full height
- Overlay begins shrinking over time

---

### Cooldown State

While on cooldown:

- Icon appears dimmed (via overlay)
- Cannot be activated

---

### Ready State

When cooldown completes:

- Overlay fully gone
- Icon returns to full brightness
- Optional: subtle pulse or glow

---

## Cooldown Logic

### Input

Each skill provides:

- `cooldownDuration`
- `cooldownRemaining`

---

### Visual Calculation

Cooldown percentage:
cooldownProgress = cooldownRemaining / cooldownDuration


Overlay height:

- Height = cooldownProgress × 100%

---

### Animation Behavior

- Smooth transition (linear)
- Updates per frame or tick

---

## Styling Guidelines

### Skill Item

- Border radius: small (e.g., 6–8px)
- Optional border or outline

---

### Cooldown Overlay

- Color: black or dark tone
- Opacity: ~0.5–0.7
- Direction: bottom → top fill

---

### Skill Name

- Font: bold, readable
- Color: white
- Background: optional dark gradient for readability

---

### Keybind Label

- Font: small but readable
- Color: white or light tone
- Optional background: semi-transparent dark box

---

## Accessibility Considerations

- Ensure contrast between overlay and icon
- Ensure keybind text is readable at small sizes
- Avoid overly subtle cooldown indicators

---

## Data Requirements

Each skill object must provide:

- id
- name
- icon (image path)
- keybind
- cooldownDuration
- cooldownRemaining

---

## Rendering Flow

1. Render skill strip container
2. Loop through player skills
3. Render each skill item:
   - Set background image
   - Render keybind label
   - Render cooldown overlay based on state
4. Attach hover behavior
5. Update cooldown overlay dynamically

---

## Acceptance Criteria

The feature is complete when:

- All skills render as square icons
- Skill images fill the background
- Hover reveals skill name
- Cooldown overlay animates correctly
- Keybind is visible in bottom-left
- Skills visually indicate ready vs cooldown
- UI is responsive and readable at different resolutions

---

## Future Extensions

- Tooltip with full skill description
- Cooldown numbers (seconds remaining)
- Drag-and-drop skill assignment
- Controller support (no hover)
- Radial cooldown overlay instead of vertical
- Skill upgrade indicators

---

## Codex Notes

- Use layered div structure with absolute positioning
- Keep animation lightweight (CSS or simple JS updates)
- Avoid re-rendering entire component per frame
- Separate visual logic from skill state logic

---