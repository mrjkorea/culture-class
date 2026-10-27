# Jack-o'-Lantern Craft (V3)

October mini-game for Mr. Jay's Culture Class. Students open the page, type a nickname, and play all 10 stages. Fastest time on that device wins.

**Play:** [/craft/october/](https://mrjkorea.github.io/culture-class/craft/october/)

The October month page links here (`months/10-october/`).

## Graphics (for Jay)

| Era | In-game look | Between stages / end |
|-----|----------------|----------------------|
| **V1/V2** | Mostly flat **CSS/SVG** pumpkins, house, pan, kids | **AI photoreal stills** (JPG) — 8–12s each |
| **V3** | **3D-style AI scene art** (`assets/scenes3d/*.jpg`) with large props (~75–85% of the screen) | **3s countdown** only; after the run, **10 highlight clips** (`assets/transitions/video/t01…t10.mp4`) |

Chrome (HUD, titles) is minimized. One short Frank line on screen. EN mode shows **English only** until the player switches to KO.

## Voice (Fish Audio)

Frank uses pre-baked **Fish Monster (clear words)** MP3s in `assets/audio/frank/` — no Web Speech during play. Kid **“Trick or treat!”** clips are meshed from `assets/audio/kids/*_tot.mp3` (staggered) when the candy stage starts.

Clip paths are wired in `assets/manifest.json` → `audio`. Game code passes `clipKey` (for example `wash_start`, `roast_ouch`). The mute button silences Frank **and** SFX.

## What plays

| Stage | Type | Budget |
|------:|------|--------|
| 1 Pumpkin patch | luck hunt | 36 pumpkins, 1 good |
| 2 Wash | mash | 50 clicks |
| 3 Cut the top | mash | 80 clicks, knife bob |
| 4 Scoop | mash | 150 clicks |
| 5 Roast seeds | mash | 60 clicks (handle only; fire/pan = ouch) |
| 6 Pin the face | guided mash | 80 clicks, push-pin tool, 4 faces |
| 7 Carve | guided mash | 120 clicks, knife tool, same face |
| 8 Light the candle | mash | 25 clicks |
| 9 Front of the house | luck hunt | 20 spots, 1 good |
| 10 Give candy | mash | 50 clicks |

Before each stage: **3-second countdown** (optional `countdown.mp3`). Play time pauses during countdowns and the end reel. Leaderboard: fastest play time, then fewer misses (`localStorage` key `culture_craft_oct_pumpkin_v1`).

Stages 1 and 9 are pure luck. Spoken lines stay generic in `stages.json` (no hints about side, size, color, window, door, or step).

## Swap lines

Edit `stages.json` — same as V2 for budgets, `uiCopy`, and stage lines. `STAGES_SPEC.json` remains the build contract.

## Swap art / audio

- **3D scenes:** `assets/manifest.json` → `scenes3d`
- **Frank + kids:** `manifest.json` → `audio`
- **End reel:** `manifest.json` → `transitionVideos`
- **Transition thumbs (optional):** `manifest.json` → `transitions` (JPG stills)

Face shapes: `assets/faces.json`. Frank talking head: `assets/frank/frank_talk_*.jpg`.

## Files

| File | Role |
|------|------|
| `index.html` | Game page |
| `stages.json` | Budgets, lines, UI copy |
| `assets/manifest.json` | Scenes3d, audio, videos, stills |
| `assets/audio/` | Fish Frank + kid TOT MP3s |
| `assets/scenes3d/` | Large stage backdrops |
| `assets/transitions/video/` | End-of-run highlight reel |
| `js/speech.js` | Fish MP3 playback + Frank flap |
| `js/scenes.js` | Stage UI (roast handle, pin vs knife carve, etc.) |
| `js/game.js` | Flow, countdown, reel, single-language HUD |
