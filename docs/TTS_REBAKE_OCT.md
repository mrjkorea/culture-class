# October TTS rebake — **baked** (2026-10-29)

Fish MP3s are committed in-repo. Playback is pre-baked files only (`Audio` / manifest paths) — **no `SpeechSynthesis`**.

| CoS | Asset | Path | Voice (Fish reference) |
|-----|--------|------|-------------------------|
| MEET-01 | werewolf (phonetic) | `data/audio/oct-words/werewolf-wearwolf.mp3` | Pirate `b70214e5a3644d748956c81677e09ecc` |
| MEET-01 | vampire (phonetic) | `data/audio/oct-words/vampire-vampier.mp3` | Pirate `b70214e5a3644d748956c81677e09ecc` |
| QUIZ-02 | Daily quiz stems q1–q5 | `data/audio/oct-quiz/q1_stem.mp3` … `q5_stem.mp3` | Frank `a1895a46a08d48578b8a679a035d79fe` |
| CRAFT-06 / pin | Pin stage start | `craft/october/assets/audio/frank/pin_start.mp3` | Frank — line: **“Poke holes into the pumpkin.”** |

Wiring:

- Meet / words: `js/words-audio.js` → phonetic filenames for `werewolf` / `vampire`.
- Quiz: `data/oct-quiz/MANIFEST.json` + `js/daily-quiz.js` `playQuizClip()` on each question (`{id}_stem`, e.g. `q1_stem`).
- Craft: `craft/october/assets/manifest.json` → `pin_start`; stage copy in `craft/october/stages.json`.

Quiz choice feedback SFX uses `assets/sfx/match.mp3` / `miss.mp3` (not Fish TTS).
