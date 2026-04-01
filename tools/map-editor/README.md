# RL Map Editor (MVP)

Standalone browser tool for creating and iterating intentional map layouts.

## Open

1. Open `tools/map-editor/index.html` in your browser.
2. Use the top bar actions for file/local load-save.

No install/build step is required.

## Workflow

1. Set map metadata (`id`, `name`, `width`, `height`, `default theme`).
2. Place terrain objects with `Terrain` tool.
3. Draw non-walkable perimeters with `Boundary` tool.
4. Add bridge-like traversal points with `Crossing` tool.
5. Use `Validate` and fix issues before export.
6. Export JSON with `Save File` or `Copy JSON`.

## Core Controls

- `Select`: pick, drag, and edit objects
- `Terrain`: click to place
- `Boundary`: click points, double-click or `Enter` to finalize
- `Crossing`: click to place (must align with boundary edge)
- `Delete`: click to remove
- `Pan`: middle mouse drag, or hold `Space` + drag
- `Zoom`: mouse wheel
- `Duplicate`: `Ctrl + D`
- `Delete Selected`: `Delete` key
- `Cancel Boundary Draft`: `Escape`

## Data Contract

Exported map JSON:

- `id`
- `name`
- `width`
- `height`
- `defaultThemeId`
- `terrainObjects[]`:
  - `id`, `type`, `x`, `y`, `rotation`, `scale`
- `boundaries[]`:
  - `id`, `blocksPlayer`, `blocksEnemies`, `polygonPoints[]`
- `crossings[]`:
  - `id`, `type`, `x`, `y`, `orientation`, `width`, `length`

Use `tools/map-editor/maps/level-1-sample.json` as a reference.
