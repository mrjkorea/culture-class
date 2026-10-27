# October (Halloween) month remake — Jay GO 2026-10-28

Remake **months/10-october** end-to-end + index Halloween card. Keep live craft at `craft/october/` (V5).

## Design
- Halloween-themed month UI (orange/black/purple). Header art: `assets/covers/10-halloween-header.jpg`. Index card: `assets/covers/10-halloween.jpg`.
- **No Notes** step. **No section locks** — every step clickable anytime (remove Learn-before-Memory gate).
- Step order: Daily video → **5Q quiz** → Words (Meet → Match → Learn) → Memory (timer+leaderboard) → Mountain Climb (full animation like conversation day2-words day3/climb) → CP Speak (exact day4-speak) → Jack-o’-lantern Craft → Bingo (FREE center + loud TTS).

## Quiz (`data/oct-daily-quiz.json`)
- 5 MC from HALLOWEEN NOTES Easy; explanations EN/KO.
- Retake anytime; ink/record scores (localStorage). If not perfect, allow language toggle; show mistakes with answer explanations.

## Words (`data/oct-words.json`)
- Word Master order inside culture-class: **Meet the words → Match → Learn** (pictures + sound). Generate missing pictures; bake Fish TTS (Jay voice or clear EN) for each EN word; reuse for bingo.
- Memory: timer + mini leaderboard (localStorage).

## Climb
- Same experience as conversation mountain climb (animations), not stripped. Content from Halloween word/show Qs if packs missing — invent fair culture_m10 / culture_m10_show JSON and wire climbUrl.

## CP
- `data/cp/culture_m10_cp.json` + speak.html?month=10 — day4-speak format (Hear→Speak→% Citrinet pass 60, green/fail). Bake EN audio for CP lines if needed.

## Bingo
- FREE in center. Click cell → play word audio (same as Learn), repeatable loud. Teacher+student pages for month=10.

## Index
- At least upgrade home so October shows the new cover art and looks polished; full 12 covers can follow later if time.

## Done when
- PR ready; Pages: `/months/10-october/` playable full stack; `/` shows Oct cover; hard-refresh note for Jay.
