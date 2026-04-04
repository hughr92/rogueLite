# RL Map Editor Enhancement PRD (MVP → V1)

## Overview

Upgrade the current rudimentary grid-based map editor into a theme-aware, brush-based, and visually expressive level editor.

Modern terrain editors rely heavily on brush-based workflows where users “paint” terrain and the system handles smoothing and blending automatically, rather than placing rigid tiles.

Key improvements:
- Theme-driven asset rendering (forest, desert, snow, necrotic, etc.)
- Freeform brush tools instead of rigid tile placement
- Background image import for layout tracing
- Clear play area visualization
- Auto-smoothing and edge cleanup of painted terrain

This system should remain lightweight and optimized for a solo developer workflow.

---

## Goals

- Replace rigid tile placement with brush-based terrain painting
- Introduce a theme-aware asset mapping system
- Allow background image import and tracing
- Clearly define playable vs non-playable space
- Improve visual cohesion with auto-tiling and smoothing

---

## Non-Goals

- Multiplayer editing
- Procedural world generation (advanced)
- Lighting systems
- Physics-based terrain

---

## Core Concepts

### Theme System

Each map has a theme property:

- forest
- desert
- snow
- necrotic

Theme determines which assets are used for each terrain type.

---

### Terrain Types (Abstract Layer)

Terrain types remain generic:

- ground
- water
- trees
- walls
- path

These are logical categories, not direct assets.

---

### Asset Mapping System

Assets are selected dynamically based on theme + terrain type.

File structure:

/assets/themes/{theme}/{terrainType}/

Examples:

/assets/themes/forest/trees/tree_01.png  
/assets/themes/desert/trees/cactus_01.png  
/assets/themes/necrotic/trees/dead_tree_01.png  
/assets/themes/snow/trees/snow_tree_01.png  

---

### Asset Selection Logic

When placing terrain:

- Read current theme
- Load all assets for that terrain type
- Select one randomly
- Apply slight variation

Pseudo logic:

function getAsset(theme, terrainType):
    assets = loadAssets(theme, terrainType)
    return random(assets)

---

### Brush-Based Painting System

Replace click-to-place with click-and-drag painting.

Brush properties:

- size (radius)
- density (objects per stroke)
- randomness (position jitter)
- softness (edge blending)

Behavior:

- Mouse drag paints continuously
- Points are interpolated between frames
- Terrain applied within brush radius

---

### Flowy Terrain (Auto-Smoothing)

After painting:

- Detect neighboring terrain types
- Replace harsh edges with transition tiles

Example:

- grass next to water becomes shoreline tiles automatically

Approach:

- 4-direction or 8-direction neighbor checks
- Replace edge tiles based on adjacency rules

---

### River / Path Drawing Tool

Special drawing mode:

1. User draws a line path
2. System generates spline
3. Expands to width
4. Fills terrain (water/path)

Steps:

- Record mouse points
- Smooth path (basic interpolation)
- Apply terrain fill with width

---

### Background Image Import

Allow importing an image as a layout guide.

Requirements:

- Accept PNG or JPG
- Render as lowest layer
- Adjustable opacity
- Adjustable scale and position

UI:

- "Import Background" button
- Opacity slider (0–100%)

Data model:

backgroundImage:
  src: string
  opacity: number
  scale: number
  offsetX: number
  offsetY: number

---

### Play Area Definition

Problem: unclear playable boundaries

Solution: Play Area Mask

Options:

1. Paint mode (user paints playable region)
2. Default bounding box fallback

Visualization:

- Outside area: dark overlay (40–60% opacity)
- Inside area: fully visible

Optional:

- Glow or outline border

---

### Layer System

Editor supports layers:

1. Background Image
2. Terrain
3. Props (trees, rocks)
4. Play Area Mask
5. Collision / Walls

Each layer can be toggled on/off.

---

### Grid Visibility

- Toggle on/off
- Reduced opacity
- Should not dominate visuals

---

### Data Model (MVP)

map:
  theme: string
  terrain: array
  props: array
  playAreaMask: array
  backgroundImage: object or null

---

### Rendering Improvements

To reduce grid feel:

- Random position offset per asset
- Small rotation variation (±5–10 degrees)
- Scale variation (0.9–1.1)

---

### Undo / Redo System

- Maintain action stack
- Support:
  - paint
  - erase
  - background import

---

## UI Requirements

Toolbar:

- Terrain selector
- Theme selector
- Brush size slider
- Brush density slider

Toggles:

- Grid
- Play area overlay
- Background visibility

Buttons:

- Import Background
- Play Area Mode
- River Tool
- Eraser Tool

---

## Implementation Plan

### Phase 1 (Core Features)

- Theme + asset mapping
- Brush painting system
- Background image import
- Play area mask

### Phase 2 (Visual Polish)

- Edge smoothing
- River/path tool
- Layer toggles
- Asset variation

### Phase 3 (Nice-to-Have)

- Asset preview UI
- Save/load JSON
- Mini-map preview

---

## Risks

- Too much randomness causing visual noise
- Performance issues with large brush sizes
- Inconsistent asset quality between themes

---

## Success Criteria

- Maps no longer feel grid-based
- Designers can sketch layouts quickly
- Themes visually transform the same layout
- Playable space is immediately clear
- Background tracing speeds up level creation

---

## Future Extensions

- Procedural assist tools
- Biome blending (forest to snow transitions)
- Lighting and shadows
- Navigation mesh generation