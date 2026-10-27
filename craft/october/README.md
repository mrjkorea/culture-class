# Jack-o'-Lantern Craft

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

A still picture plays **before** each stage for 8–12 seconds. There is no skip button and no video. Play time pauses during those pictures. The leaderboard sorts by fastest play time, then fewer misses (`localStorage` key `culture_craft_oct_pumpkin_v1`).

Stages 1 and 9 are pure luck. Spoken lines must stay the generic lines in `stages.json`. Do not add words that point at a side, size, color, window, door, or step.

Speech uses the Web Speech API in English (`languages.listeningPrimary`). English and Korean both stay on screen. The EN / KO control only changes which line is larger.

## Swap lines

Edit `stages.json`.

- `stages[].lines.en` and `stages[].lines.ko` — three lines each: start, middle (or miss, on luck hunts), done.
- `stages[].title` / `titleKo` — HUD title.
- `transitions[].caption` — words on the still. Spoken in English.
- `transitions[].durationSec` — keep each value from 8 to 12 until Jay approves animation.
- `uiCopy` — buttons, nickname screen, results.
- Click budgets: `clicks`, `poolSize`, `goodCount`. Pin and carve stay equal for every face (`sameClicksAllFaces`).

`STAGES_SPEC.json` is the build contract. If you change a budget or a stage line, update both files.

## Swap TTS

In `stages.json` → `tts`:

- `pitch` — playful is about `1.3`–`1.45`
- `rate` — about `1.0`–`1.08`
- `lang` — `en-US` while listening stays English
- `missDebounceMs` — how often a wrong pumpkin can talk

To speak Korean later, set `languages.listeningPrimary` to `ko`. The game then uses `ko-KR` and the Korean line. No other code change.

The Sound button mutes speech for this tab.

## Swap art

`assets/manifest.json` maps every transition id to a file under `assets/`:

```json
"t01_enter_patch": "transitions/t01.svg"
```

Drop in a PNG (or a new SVG) and change that path, for example to `transitions/t01.png`. The game loads whatever path is listed. Do not point these slots at video files. Stills only, until Jay approves which pictures become animation.

Built-in pumpkin, house, pan, candle, and kids are SVG in `js/art.js`. Face shapes are `assets/faces.json` (four presets). Each face is sampled to the pin count and the carve count, so every preset stays the same number of clicks.

Stage backgrounds are drawn in code so the game looks finished before any PNG arrives. Optional later: replace a transition still first; scene SVG can stay.

## Files

| File | Role |
|------|------|
| `index.html` | Game page |
| `stages.json` | Budgets, lines, TTS, still timing |
| `STAGES_SPEC.json` | Original 10-stage contract |
| `CRAFT_BUILD.md` | Build brief |
| `assets/manifest.json` | Art paths |
| `assets/faces.json` | Four face presets |
| `assets/transitions/t01.svg` … `t10.svg` | Still slots |
| `js/` | Game, scenes, speech, leaderboard |
| `css/game.css` | Layout and colors |
