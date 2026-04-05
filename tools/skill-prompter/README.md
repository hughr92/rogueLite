# Skill Prompt Manager (MVP)

Open `tools/skill-prompter/index.html` in a browser.

Features:

- template library for reusable prompt blocks
- Midjourney-style prompt builder with copy action
- skill metadata entries with version history (`v01+`)
- image preview by version
- optional skills-folder import (`webkitdirectory`) for local file previews
- asset audit that highlights missing icon files by skill

Notes:

- No backend is required.
- State is persisted in `localStorage`.
- The tool reads game skill definitions from `../../data.js` (`window.RL_DATA`) and preloads entries from class skills + upgrade definitions.
