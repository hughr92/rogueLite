# RL Map Editor (V1)

Standalone browser tool for brush-based map authoring with theme-aware terrain rendering.

## Open

1. Open `tools/map-editor/index.html` in your browser.
2. Use top bar actions for open/save/local slots.

No install/build step is required.

## Core Workflow

1. Pick a level slot (`Editing Level`) and set map metadata (`id`, `name`, `width`, `height`, `theme`).
2. Choose a terrain type (`ground`, `water`, `path`, `trees`, `walls`).
3. Paint with click-drag using brush controls (`size`, `density`, `randomness`, `softness`).
4. Use `River/Path` to draw flowing lines that fill terrain along the stroke.
5. Import a background image and tune opacity/scale/offset for tracing.
6. Paint a `Play Area` mask to define visible playable regions.
7. Validate and export JSON.

## Tools

- `Select`: select and move terrain stamps
- `Paint`: paint terrain with brush
- `River/Path`: draw continuous path/water strokes
- `Play Area`: paint playable mask (right-click to erase)
- `Play Area Rect`: click-drag rectangle for full playable field (right-click drag removes)
- `Eraser`: remove terrain

## Layer Toggles

- Grid
- Background
- Terrain
- Props
- Play Area Overlay
- Collision/Walls

## Data Model (Export)

- `id`
- `levelId`
- `name`
- `width`
- `height`
- `theme`
- `terrain[]`
- `props[]`
- `playAreaMask[]`
- `backgroundImage`

Compatibility fields (`terrainObjects`, `boundaries`, `crossings`) are also included in output for legacy workflows.

## Shortcuts

- `1..7` switch tools
- `Ctrl+Z` undo
- `Ctrl+Y` or `Ctrl+Shift+Z` redo
- `Ctrl+D` duplicate selected stamp
- `Delete` remove selected stamp
- `Space + Drag` pan camera
- Mouse wheel zoom
