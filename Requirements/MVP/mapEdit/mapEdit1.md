# PRD: Map Editor Tool (External App) – MVP

## Overview

This document defines the MVP for a **standalone Map Editor tool** used to create, edit, and manage game maps.

The editor will allow developers to:

- Design maps with intentional layouts
- Place terrain obstacles and structures
- Define map boundaries (including organic shapes like rivers)
- Add traversal elements (e.g., bridges, crossings)
- Use **theme-based asset swapping** (same layout, different visual styles)

The Map Editor will be **separate from the main game application** and export data that the game can consume.

---

## Goals

- Enable fast creation and iteration of maps
- Support **intentional level design** over procedural-only layouts
- Allow reusable layouts with different visual themes
- Keep system simple, modular, and Codex-friendly
- Decouple editor from game runtime

---

## Non-Goals (MVP)

- No multiplayer editing
- No real-time collaboration
- No advanced terrain sculpting (heightmaps, lighting, etc.)
- No animation editing
- No in-editor playtesting (can be added later)

---

## High-Level Architecture

### Applications

1. **Map Editor (Standalone Tool)**
   - Used to create/edit maps
   - Saves maps as structured data (JSON)

2. **Game Client**
   - Loads map data files
   - Renders map using selected theme
   - Applies gameplay logic (collision, enemies, etc.)

---

## Core Concepts

### 1. Layout vs Theme Separation

Maps are composed of:

- **Layout Data**
  - Positions
  - Object types
  - Boundaries
  - Gameplay-relevant structure

- **Theme Data**
  - Visual assets
  - Sprite sets
  - Variants (wood, metal, bone, etc.)

This allows:

- Same map layout
- Multiple visual styles applied dynamically

---

### 2. Tile-Free / Object-Based System

Instead of strict tile grids, use:

- Free placement of objects (with optional grid snapping)
- Simple shapes for boundaries
- Object-based placement (terrain, bridges, etc.)

---

## Editor Features (MVP)

### 1. Map Creation

- Create new map
- Load existing map
- Save map to file

Map metadata:

- Map name
- Map size (width, height)
- Default theme (optional)

---

### 2. Terrain Placement

Ability to place static terrain objects:

Examples:

- Rocks
- Trees
- Debris
- Pillars

Features:

- Click to place
- Drag to reposition
- Delete objects
- Duplicate objects

Each terrain object stores:

- Position (x, y)
- Type (rock, tree, etc.)
- Size / scale (optional)

---

### 3. Boundary / Perimeter Tool

Create map edges and impassable areas.

#### Requirements

- Draw **freeform shapes** (polygon-based)
- Define areas as **non-walkable**

#### Use Cases

- Rivers
- Cliffs
- Forest edges
- Map borders

#### Behavior

- Player cannot cross boundary
- Enemies cannot cross boundary

---

### 4. Crossing Points (Bridges)

Define special traversal objects.

#### Concept

A "crossing" is a gameplay object that:

- Connects two walkable areas
- Overrides boundary blocking in a small region

#### Examples

- Bridge over river
- Narrow pass
- Plank crossing

#### Data

- Position
- Orientation
- Width

---

### 5. Theme System

Themes define how objects are rendered.

#### Example Themes

- Forest
- Desert
- Bone / Necrotic
- Metal / Industrial

---

### Theme Behavior

Each object type maps to a themed asset.

Example:

| Object Type | Forest Theme | Bone Theme | Metal Theme |
|------------|-------------|------------|-------------|
| Bridge     | Wooden      | Bone bridge| Steel bridge|
| Rock       | Mossy rock  | Skull pile | Scrap metal |
| Boundary   | River edge  | Blood river| Lava trench |

---

### Implementation Rule

Editor stores:

- Object type (e.g., "bridge")

Game resolves:

- Asset based on selected theme

---

## Editor UI (MVP)

### Layout

- Main canvas (map view)
- Left panel: tools
- Right panel: object properties
- Top bar: file actions

---

### Tools Panel

- Select tool
- Place terrain
- Draw boundary
- Place crossing (bridge)
- Delete tool

---

### Canvas Behavior

- Click to place objects
- Drag to move objects
- Pan and zoom support
- Optional grid overlay

---

### Properties Panel

When object is selected:

- Position (x, y)
- Type
- Size / scale (optional)
- Rotation (if applicable)

---

## Data Format (Map File)

Maps should be saved in a simple structured format.

### Example Structure

- id
- name
- width
- height

- terrainObjects:
  - id
  - type
  - position
  - rotation
  - scale

- boundaries:
  - id
  - polygonPoints

- crossings:
  - id
  - type (bridge)
  - position
  - orientation
  - width

---

## Game Integration

### Loading Maps

Game should:

1. Load map file
2. Load selected theme
3. Spawn objects using theme assets
4. Apply collision to:
   - Terrain
   - Boundaries
   - Crossings (walkable override)

---

### Collision Rules

- Terrain = blocking
- Boundary = blocking
- Crossing = walkable

---

## Theming System (Game Side)

Game resolves visuals like:
renderAsset = theme.getAsset(object.type)


Themes should be defined as:

- themeId
- asset mappings (objectType → sprite)

---

## MVP Constraints

- No lighting system
- No physics beyond collision
- No animation editing
- No terrain deformation
- Keep shapes simple (polygons, rectangles)

---

## Validation Rules

Editor should prevent:

- Overlapping invalid objects (optional for MVP)
- Crossing placed outside boundary edges
- Empty maps with no playable space
- Objects placed outside map bounds

---

## Acceptance Criteria

The feature is complete when:

- Maps can be created and saved
- Terrain can be placed and edited
- Boundaries can be drawn and block movement
- Crossings allow traversal over boundaries
- Game can load map files correctly
- Themes can swap visual appearance without changing layout
- Editor runs independently of game

---

## Suggested Implementation Order

1. Basic canvas + camera (pan/zoom)
2. Place and move terrain objects
3. Save/load map files
4. Add boundary drawing tool
5. Add collision flags to boundaries
6. Add crossing/bridge system
7. Implement theme mapping system
8. Integrate map loading into game

---

## Future Extensions

- In-editor playtest mode
- Enemy spawn zones
- Loot spawn points
- Path visualization
- Biome blending
- Terrain height variation
- Multiplayer map editing
- Procedural + manual hybrid tools

---

## Codex Notes

- Keep editor lightweight (web-based recommended)
- Use simple data structures
- Prioritize usability over complexity
- Avoid tight coupling with game runtime
- Treat this as a **content creation tool**, not a game system

---