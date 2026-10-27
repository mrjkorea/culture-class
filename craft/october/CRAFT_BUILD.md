# October Pumpkin Craft — build brief (Jay GO 2026-10-27)

Playable Culture Class mini-game replacing feature video. Individual luck + clicks. ~12–15 min.

## Ship path
- Repo: mrjkorea/culture-class (GitHub Pages)
- Live path: `/craft/october/` → `index.html`
- Modular: `stages.json` drives clicks/lines; `assets/` for art; swap files without rewriting game logic

## V4 graphics (current)
- **three.js WebGL** low-poly meshes (same family as [ski-jump](https://github.com/mrjkorea/ski-jump)): clickable 3D pumpkin field (patch), 3D cut + knife, 3D wash; auto DPR / weak-GPU tuning in `js/three-runtime.js`
- **Between stages:** photoreal stills `assets/transitions/t01…t10.jpg` ~3s + countdown overlay (not countdown-only)
- **After full craft:** `assets/transitions/video/t01…t10.mp4` reel, then leaderboard
- **Voice:** Fish Audio MP3s via `manifest.json` `audio` (no Web Speech)
- **Keep:** EN-only lines until KO toggle, roast handle-only + ouch, pin ≠ carve, leaderboard, stage budgets

## Must have
1. Ten stages per `STAGES_SPEC.json`
2. Luck hunts stages 1 & 9
3. Mash/guided mash with exact click budgets
4. Four face presets for pin+carve
5. Local leaderboard (localStorage)
6. Chromebook-friendly (WebGL1-capable three r162 vendored in `vendor/`)

## Do not
- Strip Fish MP3s or break manifest audio paths
- Touch payments / LearnWorlds

## Done when
- Playable at Pages `/craft/october/`
- Full run: stills → stages → video reel → results
