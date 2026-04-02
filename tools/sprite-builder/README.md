# RL Sprite Builder (MVP)

Standalone browser tool for generating, editing, previewing, and exporting directional idle sprite sets.

## Open

1. Open `tools/sprite-builder/index.html` in your browser.
2. Optionally launch from `tools/index.html`.

## AI Generation Server

Sprite generation now calls a local backend endpoint so API keys stay server-side.

1. Set environment variable `OPENAI_API_KEY`.
2. Optional overrides:
`OPENAI_IMAGE_MODEL` (default: `gpt-image-1`)
`SPRITE_BUILDER_PORT` (default: `8787`)
`OPENAI_API_BASE_URL` (default: `https://api.openai.com/v1`)
3. Start the server:

```powershell
node tools/sprite-builder/server.js
```

4. Keep the endpoint in the UI as `http://localhost:8787/api/images/generate`.

## Workflow

1. Create/select a project.
2. Enter prompt + style and choose generation mode (`Concept`, `Reference`, or `Edit`).
3. Upload references (or image URLs), then generate 1-6 concepts.
4. Select one concept as Master.
5. Generate one direction or all directions (each frame is generated individually from master reference).
6. Use `Generate Frame Variant` or `Regenerate Selected Frame` for quick iteration.
7. Touch up in editor, preview, validate, and export PNG + JSON.

## Editor Controls

- `Pencil`: paint pixels in selected color
- `Eraser`: clear pixels
- `Picker`: sample a pixel color
- `Undo/Redo`: per-frame edit history
- `Zoom +/-`: change pixel editing scale
- `Reset Pan`: center frame in editor
- `Grid`: toggle pixel grid
- `Onion`: show adjacent frame ghost
- Pan: middle mouse drag, or hold `Space` + left drag

## Exports

The export panel provides:

- Current frame (PNG + JSON)
- Current direction sheet + manifest
- All directions sheets + manifests

Manifest includes:

- `animationName`
- `direction`
- `frameWidth`, `frameHeight`, `frameCount`
- `loop`, `spacing`, `margin`
- frame coordinate entries with duration
