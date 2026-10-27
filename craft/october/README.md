# Jack-o'-Lantern Craft (V2)

October mini-game for Mr. Jay's Culture Class. Students open the page, type a nickname, and play all 10 stages. Fastest time on that device wins.

**Pages path:** [/craft/october/](https://mrjkorea.github.io/culture-class/craft/october/)

The October month page links here (`months/10-october/`).

## What plays

| Stage | Type | Budget |
|------:|------|--------|
| 1 Pumpkin patch | luck hunt | 36 pumpkins, 1 good |
| 2 Wash | mash | 50 clicks |
| 3 Cut the top | mash | 80 clicks, knife bob |
| 4 Scoop | mash | 150 clicks |
| 5 Roast seeds | mash | 60 clicks |
| 6 Pin the face | guided mash | 80 clicks, 4 faces |
| 7 Carve | guided mash | 120 clicks, same face |
| 8 Light the candle | mash | 25 clicks |
| 9 Front of the house | luck hunt | 20 spots, 1 good |
| 10 Give candy | mash | 50 clicks |

A **photoreal still** (JPG) plays **before** each stage for 8–12 seconds. There is no skip button. Play time pauses during those pictures. The leaderboard sorts by fastest play time, then fewer misses (`localStorage` key `culture_craft_oct_pumpkin_v1`).

Stages 1 and 9 are pure luck. Spoken lines must stay the generic lines in `stages.json`. Do not add words that point at a side, size, color, window, door, or step.

**V2 feel:** larger stage props (CSS/SVG), scoop spoon arcs + seeds into a bowl, roast pan flip + sizzle, sponge splash on wash, Web Audio SFX every stage, Frankenstein host voice with talking-head mouth flap, EN speech + EN/KO on screen.

## Swap lines

Edit `stages.json`.

- `stages[].lines.en` and `stages[].lines.ko` — three lines each: start, middle (or miss, on luck hunts), done.
- `stages[].title` / `titleKo` — HUD title.
- `transitions[].caption` — words on the still. Spoken in English.
- `transitions[].durationSec` — keep each value from 8 to 12 until Jay approves animation.
- `uiCopy` — buttons, nickname screen, results.
- Click budgets: `clicks`, `poolSize`, `goodCount`. Pin and carve stay equal for every face (`sameClicksAllFaces`).

`STAGES_SPEC.json` is the build contract. If you change a budget or a stage line, update both files.

## Swap TTS / Frank voice

In `stages.json` → `tts`:

- `pitch` — monster Frank is about `0.35`–`0.55` (default `0.42`)
- `rate` — slightly slow, about `0.85`–`0.95`
- `lang` — `en-US` while `languages.listeningPrimary` is `en`
- `missDebounceMs` — how often a wrong pumpkin can talk
- `maxMs` — safety cap for long lines (default `5200`)

**Talking head:** `assets/manifest.json` → `frank.closed` / `frank.open` (JPG paths). The HUD shows Frank while lines play; mouth toggles open/closed during speech.

**Pre-recorded clips (Fish Audio, etc.):** add entries under `manifest.json` → `audio`, for example:

```json
"audio": {
  "stage4_start": "audio/scoop_start.mp3"
}
```

Then pass `clipKey: "stage4_start"` from game code when you wire a line to a file. If the key is missing, Web Speech is used.

To speak Korean later, set `languages.listeningPrimary` to `ko`. The game then uses `ko-KR` and the Korean line.

The Sound button mutes speech **and** SFX for this tab.

## Swap SFX

Stage clicks use `js/sfx.js` (Web Audio). To replace a sound with a short file, extend `sfx.js` or load from `assets/sfx/` (add paths in manifest if you want them data-driven).

Distinct cues: miss, win, per-stage click (splash, scrape, flip/sizzle, pin, carve, strike, candy, patch, cut).

## Swap art

`assets/manifest.json` maps every transition id to a file under `assets/`:

```json
"t01_enter_patch": "transitions/t01_enter_patch.jpg"
```

Drop in a new JPG/PNG/SVG and change that path. **Stills only** until Jay picks which get motion; then swap the same id to a video or animated asset without renaming ids.

Built-in pumpkin, house, pan, candle, spoon, and kids are SVG in `js/art.js`. Face shapes are `assets/faces.json` (four presets).

Photoreal stills live in `assets/transitions/t01_enter_patch.jpg` … `t10_trick_or_treat.jpg`. Frank host: `assets/frank/frank_talk_closed.jpg` / `frank_talk_open.jpg`.

## Files

| File | Role |
|------|------|
| `index.html` | Game page |
| `stages.json` | Budgets, lines, TTS, still timing |
| `STAGES_SPEC.json` | Original 10-stage contract |
| `CRAFT_BUILD.md` | Build brief |
| `assets/manifest.json` | Art, Frank, optional audio clip paths |
| `assets/faces.json` | Four face presets |
| `assets/transitions/*.jpg` | Photoreal still slots |
| `assets/frank/*.jpg` | Talking head |
| `js/sfx.js` | Web Audio SFX |
| `js/` | Game, scenes, speech, leaderboard |
| `css/game.css` | Layout and colors |
