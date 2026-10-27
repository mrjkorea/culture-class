# Culture Class — status

## October 2026 (month 10) — Halloween remake

- **Map UI**: `months/10-october/` — full-bleed adventure map with path nodes (video → quiz → Meet → Learn → Memory → Climb → CP → Craft → Bingo). Progress stored in `localStorage` (`culture-class-step-done-10-*`). All steps stay open (`test=1` on climb).
- **Words**: `data/oct-words.json` + `data/audio/oct-words/*.mp3` + SVG art under `assets/words/oct/`.
- **Meet / Learn / Memory**: `words/meet.html`, `words/learn.html`, `words/memory.html` with Halloween theme (`assets/css/halloween.css`). JPG art (no text in images); Pirate Fish mp3 audio. Memory uses pumpkin card backs, SFX, spoken English on flip.
- **Mountain Climb**: `climb/climb.html` + `climb/data/culture_m10.json` (words) and `culture_m10_show.json` (daily quiz). Coach SFX from day2-words Ray clips.
- **CP Speak**: `cp/speak.html` — Day 4 / Pronounce checker UI, `data/cp/culture_m10_cp.json`, Coach Ray lines in `data/audio/oct-cp/`, pass **80%**.
- **Bingo**: Larger student cells with word pictures + tap-to-hear audio.

Other months still use the classic step list in `js/month-page.js`.
