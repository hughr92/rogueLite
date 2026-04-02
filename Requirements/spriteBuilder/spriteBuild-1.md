# Sprite Builder Tool PRD

## Document Info

* Product: Internal Game Dev Tooling
* Feature: Sprite Builder
* Status: MVP PRD
* Audience: Codex / engineering implementation
* Goal: Create an internal sprite-building tool for rapidly generating, editing, previewing, and exporting character sprites and base animation sets in a consistent style for the game

---

## 1. Purpose

Build a **Sprite Builder** tool for the game’s internal tools area, similar in spirit to the existing map editor.

The Sprite Builder should let the developer:

* generate character concepts from prompts
* use uploaded/reference images as source material
* standardize a base character design
* generate animation directions and frames
* make small manual touch-ups in a simple paint-like editor
* preview animations in motion
* test movement with keyboard controls
* export sprite sheets and metadata in a game-ready format

This tool is not intended to be a full-featured art package. It should be a **production helper** for creating gameplay-ready sprite assets quickly and consistently.

---

## 2. MVP Scope

### Included in MVP

* Tool launchable from the Tools section
* Sprite Builder page/view
* Prompt input for character generation
* Reference image upload/use
* Base character generation workflow
* Direction set generation for:

  * up
  * down
  * left
  * right
  * diagonals
* Idle animation workflow for those directions
* Basic frame-by-frame preview
* Simple movement preview using WASD
* Very lightweight manual touch-up editor
* Export of sprite sheets + metadata

### Out of Scope (MVP)

* Advanced painting tools
* Bone rigging
* Mesh animation
* Full layer compositing system
* Complex VFX
* Multiplayer collaboration
* Armor modular systems
* Non-idle animations UI beyond foundational structure

---

## 3. Primary Use Case

1. Open Sprite Builder from Tools
2. Enter a prompt
3. Upload a reference image if needed
4. Generate 4 to 6 concepts
5. Select a master
6. Generate directional idle animations
7. Touch up frames if needed
8. Preview animation and movement with WASD
9. Export sprite sheets and metadata

---

## 4. Product Goals

* **Speed**: Faster asset creation
* **Consistency**: Standardized style and proportions
* **Iteration**: AI generation plus light editing
* **Feedback**: Immediate gameplay preview

---

## 5. Navigation

Routes:

* `/tools`
* `/tools/sprite-builder`

Tools Index should include:

* Map Editor
* Sprite Builder

Suggested Sprite Builder description:
Generate, edit, preview, and export character sprites and directional animations.

---

## 6. Layout

The Sprite Builder page should use a simple multi-panel layout with these sections:

* Prompt/Input
* References
* Concept Grid
* Frame Editor
* Animation Preview
* Movement Sandbox
* Export Panel

This does not need to be visually fancy. It should be functional first.

---

## 7. Features

### 7.1 Prompt Panel

Inputs:

* Prompt
* Negative prompt (optional)
* Style preset
* Sprite size (default 48)
* Direction set (4-direction or 8-direction)
* Animation type (idle)

Suggested style presets:

* Dark fantasy readable
* Survivors-like readable
* Grim medieval
* High contrast chunky
* Custom

---

### 7.2 Reference Images

Requirements:

* Upload multiple images
* Display thumbnails
* Select a primary reference
* Remove or replace references
* Support prompt plus reference workflow

---

### 7.3 Concept Generation

Requirements:

* Generate 4 to 6 variants
* Display concepts in a selectable grid
* Allow actions:

  * Select as Master
  * Regenerate
  * Save Candidate
  * Discard

Generation output should prefer:

* one character only
* neutral or transparent background
* no environment clutter
* consistent framing

---

### 7.4 Master Locking

Requirements:

* One selected sprite becomes the approved master
* All further generation derives from that master
* The UI should visibly indicate which asset is the current master
* Store master metadata including:

  * character name
  * prompt
  * references
  * style preset
  * sprite size
  * notes

---

### 7.5 Directional Idle Generation

Support:

* N
* NE
* E
* SE
* S
* SW
* W
* NW

Requirements:

* 4 idle frames per direction
* Allow generating all directions at once or one at a time
* Allow per-direction review
* Left/right mirroring is acceptable internally, but the UI should still represent the full direction set clearly

---

### 7.6 Frame Editor (Basic Paint Tool)

This editor is for minor cleanup only.

Tools:

* Pencil
* Eraser
* Color picker
* Palette swatches
* Undo / redo
* Zoom in / out
* Pan
* Grid toggle
* Onion skin toggle (optional)

Not required in MVP:

* Layers
* Lasso selection
* Transform tools
* Blur or smudge
* Advanced brushes
* Text tools

Primary use cases:

* Fix a shoulder fur edge
* Clean a belt buckle pixel
* Correct silhouette pixels
* Fix alignment artifacts
* Nudge a frame detail by hand

---

### 7.7 Animation Preview

Requirements:

* Play / pause
* Frame step
* Loop toggle
* Speed control
* Per-direction preview
* Preview at:

  * 1x
  * 2x
  * 4x
  * gameplay scale

Must support:

* Idle animation playback
* Frame-by-frame inspection
* Quick visual check for jitter or drift

---

### 7.8 Movement Sandbox

Requirements:

* Small preview playfield
* Movement with WASD
* Direction switching
* Idle animation playback based on facing
* Optional simple positional movement inside the sandbox
* Placeholder floor/background only

Initial MVP behavior:

* Pressing WASD changes facing direction
* Holding movement plays the selected direction animation
* This should be enough to validate readability and feel

---

### 7.9 Export

Outputs:

* Current frame
* Current direction animation
* All idle directions
* PNG sprite sheet
* JSON manifest

Export requirements:

* Transparent background
* Normalized frame size
* Equal spacing
* Consistent padding
* Baseline aligned
* Standardized file names

---

## 8. File Structure

Suggested asset structure:

```
/art/characters/{characterName}/
  master/
  idle/
    down/
    up/
    left/
    right/
    down_left/
    down_right/
    up_left/
    up_right/
  exports/
```

The exact location can be adapted to the repo, but the implementation should enforce consistency.

---

## 9. JSON Manifest Example

Use this shape as the baseline:

```
{
  "animationName": "barbarian_idle",
  "frameWidth": 48,
  "frameHeight": 48,
  "frameCount": 4,
  "loop": true,
  "spacing": 4,
  "margin": 4,
  "frames": []
}
```

Minimum JSON fields:

* animationName
* direction
* frameWidth
* frameHeight
* frameCount
* loop
* spacing
* margin
* frame coordinates
* optional duration

---

## 10. Data Model

Suggested project model:

```
type SpriteProject = {
  id: string
  characterName: string
  prompt: string
  negativePrompt?: string
  stylePreset?: string
  spriteSize: number
  references: SpriteReference[]
  masterAsset?: SpriteAsset
  animations: SpriteAnimationSet[]
  updatedAt: string
}
```

Suggested animation model:

```
type SpriteAnimationSet = {
  animationName: string
  direction: string
  frameCount: number
  loop: boolean
  frames: SpriteFrame[]
}
```

Suggested frame model:

```
type SpriteFrame = {
  id: string
  imagePath?: string
  edited: boolean
  durationMs?: number
}
```

Codex can adapt naming to project conventions, but should preserve the overall structure.

---

## 11. Workflow

1. Create project
2. Enter prompt and upload references if needed
3. Generate concepts
4. Select master
5. Generate directional idle animations
6. Review and edit frames
7. Preview animation
8. Test movement in sandbox
9. Export assets

This is the intended MVP loop.

---

## 12. Validation Rules

Soft validation warnings should include:

* Frame size mismatch
* Missing transparency
* Baseline misalignment
* Missing required directions
* Unequal frame count
* Export blocked if no master selected

Future validation ideas:

* Silhouette drift detection
* Palette drift detection
* Per-frame bounding box jitter detection

Only basic warnings are required in MVP.

---

## 13. Components

Suggested components:

* `SpriteBuilderPage`
* `SpritePromptPanel`
* `SpriteReferencePanel`
* `SpriteConceptGrid`
* `SpriteMasterCard`
* `SpriteFrameEditor`
* `SpriteAnimationPreview`
* `SpriteMovementSandbox`
* `SpriteExportPanel`

Suggested utility modules:

* `spritePacking`
* `frameAlignment`
* `spriteManifestBuilder`
* `spriteProjectStorage`

Codex may rename these to fit project conventions.

---

## 14. Performance Targets

The Sprite Builder should feel responsive.

Targets:

* Smooth animation preview playback
* Responsive frame editing
* Immediate-feeling WASD movement
* Prompt/generation actions should not freeze the rest of the tool unnecessarily

---

## 15. Risks

### Risk 1: Overbuilding the editor

Mitigation: Keep it minimal and focused on sprite workflow

### Risk 2: Style inconsistency

Mitigation: Enforce master-lock workflow

### Risk 3: Export mismatch with the game

Mitigation: Standardize sprite sheet and manifest structure early

### Risk 4: Too much UI polish too early

Mitigation: Prioritize workflow reliability over presentation

---

## 16. Acceptance Criteria

The MVP is complete when:

1. Sprite Builder is accessible from Tools
2. Prompt to concept generation works
3. Reference image upload works
4. Master selection works
5. Directional idle generation works
6. Minor frame editing works
7. Animation preview works
8. WASD sandbox works
9. Export outputs a transparent sprite sheet and JSON manifest
10. Exported assets follow a predictable structure

---

## 17. MVP Delivery Order

1. Routing and page layout
2. Prompt input and generation
3. Master selection
4. Directional idle generation
5. Animation preview system
6. Basic paint editor
7. WASD sandbox
8. Export system
9. Validation warnings

---

## 18. Future Enhancements

Do not build these first, but keep the architecture open for them:

* Walk animations
* Attack / hurt / death animations
* Palette locking
* Onion skin improvements
* Equipment variants
* Animation events
* Armor set generation
* Modular equipment regions
* Version history
* Better mirroring tools

---

## 19. Final Notes

This tool should:

* prioritize speed
* enforce consistency
* enable rapid iteration
* reduce reliance on external tools

It should feel like the sprite equivalent of the map editor:

* focused
* fast
* structured
* useful immediately
