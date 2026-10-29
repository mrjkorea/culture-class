# October word TTS rebake (Fish Monster Frank / word pack voice)

No `FISH_API_KEY` in the Cloud Agent environment — these clips still need a proper Fish bake:

| Word | File | Synthesis text (display stays unchanged) |
|------|------|------------------------------------------|
| werewolf | `data/audio/oct-words/werewolf-wearwolf.mp3` | **wear-wolf** (or wair-wolf) |
| vampire | `data/audio/oct-words/vampire-vampier.mp3` | **vamp-ire** / **vam-pire** |

`js/words-audio.js` routes playback through the phonetic filenames above when the term slug is `werewolf` or `vampire`.

## Daily quiz (Frank `a1895a46a08d48578b8a679a035d79fe`)

Bake under `data/audio/oct-quiz/` (see `data/oct-quiz/MANIFEST.json`) — one MP3 per question stem + choice where needed. Wire only pre-baked files in `js/daily-quiz.js` (no SpeechSynthesis).

## Craft pin stage

Rebake `craft/october/assets/audio/frank/pin_start.mp3` (and mid if needed) with line **“Poke holes into the pumpkin.”** — not “pierce”. Copy in `craft/october/stages.json` is updated; audio must match.
