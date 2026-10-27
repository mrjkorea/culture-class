# October Pumpkin Craft — build brief (Jay GO 2026-10-27)

Playable Culture Class mini-game replacing feature video. Individual luck + clicks. ~12–15 min.

## Ship path
- Repo: mrjkorea/culture-class (GitHub Pages)
- Live path: `/craft/october/` → `index.html`
- Wire from October month page when ready; also OK as standalone URL for pilot
- Modular: `stages.json` drives clicks/lines; `assets/` for art; swap files without rewriting game logic

## Must have
1. Ten stages exactly as `STAGES_SPEC.json` (attached / same folder)
2. Luck hunts on stages 1 & 9 (no English clue that reveals the answer)
3. Mash/guided mash with exact click budgets
4. 4 face presets for pin+carve, same click totals
5. Unskippable between-stage beat (~8–12s): show a **still** image from `assets/transitions/t01…t10.png` (animation files later — Jay must approve which stills get animated; do NOT generate video)
6. Fun TTS via Web Speech API with playful pitch/rate (seasonal vibe); EN speak + on-screen EN + KO mini text; language toggle ready
7. Local leaderboard (localStorage): name + time + misses
8. Bright, fun, Halloween colors; Chromebook-friendly (no WebGL required); looks polished not placeholder-ugly
9. Easy asset swap: every visual referenced by path in JSON or a small assets manifest

## Art approach for v1
- Prefer crisp **SVG + CSS** layered pumpkin + scene backgrounds so it looks great immediately
- Also accept PNG under `assets/` when provided; prefer SVG defaults that match the bright fun brief
- Leave clear slots for the 10 transition stills (can use nice SVG/CSS illustrations named t01–t10 until PNGs arrive)

## Do not
- Freehand drawing, 3D, teams, Firebase yet
- Animate transitions (stills only until Jay approves)
- Touch payments / LearnWorlds

## Done when
- PR merged or ready: playable at Pages `/craft/october/`
- Full run works start→candy→leaderboard
- stages.json documents all budgets/lines
- README in craft/october explains how to swap art / lines / TTS
