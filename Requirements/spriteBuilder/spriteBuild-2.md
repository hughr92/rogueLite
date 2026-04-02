# Sprite Builder — OpenAI Image Generation Integration PRD

## Document Info

* Product: Internal Game Dev Tooling
* Feature: Replace seed-based generation with OpenAI Image Generation
* Status: MVP Integration PRD
* Audience: Codex / engineering implementation
* Goal: Integrate OpenAI image generation into the Sprite Builder to power concept creation, frame generation, and sprite editing workflows

---

## 1. Purpose

Replace the current **seed-based image generation system** with **OpenAI-powered image generation**.

This enables:

* prompt-driven character creation
* reference-based iteration
* controlled frame generation for animations
* partial image edits (inpainting-style workflows)
* consistent, reusable sprite pipelines

This change aligns the Sprite Builder with an **AI-first workflow**.

---

## 2. Core Concept

Instead of:

> “Generate based on seed”

We move to:

> “Generate based on prompt + reference + intent”

Each generation request becomes structured and reproducible.

---

## 3. Generation Modes

The system must support three core modes:

### 3.1 Text-to-Image (Concept Generation)

Used for:

* initial character concepts
* exploring variants

Inputs:

* prompt
* optional negative prompt
* style preset
* output size

---

### 3.2 Reference-Based Generation (Image-to-Image)

Used for:

* generating armor variants
* generating directional poses
* generating animation frames

Inputs:

* prompt
* reference image (master sprite)
* transformation intent (pose, variation)

---

### 3.3 Image Editing (Targeted Regeneration)

Used for:

* fixing specific areas (fur, armor, limbs)
* correcting silhouette issues
* minor animation adjustments

Inputs:

* prompt
* reference image
* optional mask region (future enhancement)

---

## 4. System Architecture

### Frontend (Sprite Builder)

* Prompt input
* Reference image upload
* Mode selection
* Generate / Regenerate actions
* Frame-level generation controls

### Backend (Generation Layer)

* Handles OpenAI API calls
* Stores results + metadata
* Returns generated images

### Storage

* Saves:

  * images
  * prompts
  * generation parameters

---

## 5. API Integration

### Endpoint (internal)

POST `/api/images/generate`

---

### Request Structure

```
{
  "prompt": "string",
  "negativePrompt": "string (optional)",
  "mode": "text-to-image | reference | edit",
  "referenceImage": "optional image file or path",
  "size": "1024x1024",
  "n": 4
}
```

---

### Response Structure

```
{
  "images": [
    {
      "url": "string",
      "localPath": "string",
      "metadata": {
        "prompt": "string",
        "mode": "string",
        "timestamp": "string"
      }
    }
  ]
}
```

---

## 6. Prompt System

### Prompt Template (Standardized)

All prompts must be normalized before sending.

Example structure:

```
{
  "style_anchor": "dark fantasy readable roguelite sprite",
  "camera": "3/4 view or side view",
  "character": "barbarian",
  "pose": "idle / walk frame / etc",
  "constraints": [
    "clean silhouette",
    "transparent background",
    "no environment",
    "consistent proportions"
  ]
}
```

The frontend should construct final prompts using:

* user input
* style preset
* system constraints

---

## 7. Master Sprite Workflow

### Requirements

* User selects one generated image as the **master**
* Master becomes required reference for:

  * animation frames
  * directional variants
  * edits

### Behavior

* All future generation uses:

  * prompt + master reference
* Prevents style drift

---

## 8. Frame Generation Workflow

### Idle / Walk / Animation Frames

Each frame is generated individually:

Example:

```
prompt:
"Use this character as reference. Maintain identical proportions and silhouette. 
Modify pose to show compression: torso lowered, knees bent."
```

### Rules

* Never generate full animation in one request
* Always generate per-frame
* Maintain strict consistency

---

## 9. UI Changes

### Replace:

* Seed input

### With:

* Mode selector (Concept / Reference / Edit)
* Prompt input
* Reference image panel
* Generate variants button
* Regenerate frame button

---

### Add:

* “Use as Master” action
* “Generate Frame Variant” action
* “Regenerate Selected Frame” action

---

## 10. Metadata Storage

Each generated image must store:

```
{
  "prompt": "string",
  "mode": "string",
  "referenceImage": "path",
  "size": "string",
  "timestamp": "string"
}
```

This enables:

* reproducibility
* iteration
* debugging

---

## 11. Generation Flow

### Concept Flow

1. User enters prompt
2. Generate 4–6 images
3. Select master

---

### Animation Flow

1. Select master
2. Choose animation type
3. Generate frame 1
4. Generate frame 2 (pose variation)
5. Continue per frame
6. Review + edit

---

### Edit Flow

1. Select frame
2. Modify prompt (e.g., fix shoulder)
3. Regenerate only that frame

---

## 12. Constraints Enforcement

All generation must enforce:

* single character only
* no background
* consistent proportions
* readable silhouette
* no props
* no UI/text
* same camera angle
* same lighting

These constraints must be automatically appended to prompts.

---

## 13. Performance Considerations

* Requests are asynchronous
* Show loading states per generation
* Allow batch generation (n = 4–6)
* Do not block UI during generation

---

## 14. Error Handling

Handle:

* failed generation
* empty responses
* invalid image references
* API timeouts

UI should allow retry.

---

## 15. Security

* API key stored server-side only
* No direct client exposure
* Requests proxied through backend

---

## 16. Acceptance Criteria

Integration is complete when:

1. Seed-based system is removed
2. User can generate concepts via prompt
3. User can use reference images for generation
4. User can generate animation frames from master
5. User can regenerate individual frames
6. Metadata is saved for each image
7. UI reflects new generation modes
8. Export pipeline remains functional

---

## 17. Future Enhancements

* Mask-based inpainting UI
* Prompt history
* Style locking
* Batch directional generation
* Animation presets
* Multi-character generation templates

---

## 18. Implementation Priority

1. API integration
2. Concept generation
3. Master selection
4. Reference-based generation
5. Frame regeneration
6. Metadata storage
7. UI updates

---

## 19. Final Notes

This change transforms the Sprite Builder from:

* a seeded variation tool

into:

* a structured AI-driven asset pipeline

The system should:

* prioritize consistency
* support iteration
* minimize manual editing
* accelerate sprite production

This is a foundational upgrade for the entire asset pipeline.
