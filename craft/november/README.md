# November — Thanksgiving Feast craft

Eleven kitchen and table stages: turkey hunt, pluck, stuff, ~60s oven roast hold, mash, gravy, pie, plates, silverware, seat family, thankful card.

<<<<<<< HEAD
**Grandma June** narrator — `assets/audio/grandma/` (`scripts/bake-grandma-audio.sh`, Fish `0a90765966ac4556a6ecfd86ef8057d3`). Host art still uses cowboy sprites. Audio baked **2026-11-04** (see `assets/audio/grandma/LINES.md`).
=======
**Grandma June** narrator — `assets/audio/grandma/` (`scripts/bake-grandma-audio.sh`, Fish `0a90765966ac4556a6ecfd86ef8057d3`). Host talking-head art still uses cowboy sprites (Grandma stills are a follow-up).

**Visuals:** Photo backdrops from transition stills on every stage; WebGL (three.js) for hunt, pluck, oven hold, mash, pie, and set-plates with 2D+backdrop fallbacks. Bump `js/asset-version.js` → `CRAFT_ASSET_V` when shipping asset changes.
>>>>>>> 55b16c8 (feat(november): Thanksgiving craft 3D stages and photo backdrops)

Leaderboard: `culture_craft_november_thanksgiving_v1`.

Placeholders: run `scripts/gen-transitions.sh` for stills and stage movies; bake audio when `FISH_API_KEY` is set.
