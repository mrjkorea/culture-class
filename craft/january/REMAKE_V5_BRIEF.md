# October craft V5 — per-stage movies + end ghost (Jay 2026-10-28 ~01:58 KST)

## Feedback (keep V4 three.js + Fish)
Almost perfect. Two changes:

1. **Movies one-at-a-time after each matching stage** — do NOT play all 10 Grok Imagine clips as an end reel. After the student finishes stage N, show that stage’s matching still briefly if you still want the beat, then play **only** `assets/transitions/video/t0N_….mp4` for that stage (unskippable until the clip ends / short max). Then continue to the next stage. Mapping is stage order ↔ t01…t10 in order (stage 1 → t01, …, stage 10 → t10).

2. **Very end: scary ghost jump-scare** — After stage 10’s movie finishes (candy done), play the ghost pop video + Fish line “Happy Halloween!”, then results/leaderboard. Assets attached / under:
   - `assets/ghost/ghost_pop.mp4` (jump-scare clip)
   - `assets/ghost/ghost_still.jpg` (fallback / poster)
   - `assets/audio/ghost/happy_halloween.mp3` (Fish Monster, same voice as Frank)

## Remove / change
- Remove or dead-code `playHighlightReel()` / any end-of-game sequential play of all 10 videos.
- Between-stage still (~3s) may stay **before** the matching movie, or fold into: still flash → movie → next stage. Prefer: stage complete → matching movie (can show still as first frame / poster while buffering) → next stage. Do not show a long still *and* a long movie if that makes the class drag; keep total post-stage beat reasonable (movie length is enough; optional 1s still).

## Done when
- Full run: after each stage, that stage’s mp4 plays once; no 10-clip end reel.
- After last movie: ghost pops + says Happy Halloween, then leaderboard.
- PR on mrjkorea/culture-class ready to merge; Pages `/craft/october/`.
