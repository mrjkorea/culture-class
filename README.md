# Culture Class

MRJ ENGLISH **Culture Class** course hub (GitHub Pages).

**Live site:** [https://mrjkorea.github.io/culture-class/](https://mrjkorea.github.io/culture-class/)

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Home — 12 month cards (from `data/months.json`) |
| `months/NN-name/index.html` | Monthly step stack (9 steps) |
| `data/months.json` | Themes, CP Doc URLs, Mountain Climb unit ids |
| `data/aug-words.json` | August vocabulary — **24 terms** from the **KHwords Quizizz bank** (Quizlet export was blocked by captcha) |
| `bingo/teacher.html` | Teacher call list (v0 offline) |
| `bingo/student.html` | Student local bingo card |
| `assets/css/site.css` | Shared classroom UI |

## Monthly step map

Each month follows the same stack:

1. **MRJ Daily** — YouTube embeds from [@mrjenglishnews](https://www.youtube.com/@mrjenglishnews) when `introYoutube` IDs exist in `data/months.json` (placeholder if missing)
2. **Words — Learn** — Word Master pack link (`#` until published)
3. **Words — Match** — Word Master match link
4. **Words quiz** — [Mountain Climb](https://mrjkorea.github.io/day2-words/day3/climb.html) `?unit=culture_mNN`
5. **PRO COMP** — Google Doc CP TEST (see `data/months.json`)
6. **Feature show** — “Watch in class (licensed source)” — no cartoon hosting
7. **Feature quiz** — Mountain Climb `?unit=culture_mNN_show`
8. **Bingo** — teacher + student pages (`?month=NN`)
9. **Notes** — static blurb per month

**August pilot** includes the full 24-term words preview, CP Doc link, bingo pool (`?month=08`), and live Word Master pack `culture_m08` (Learn/Match deep link in `data/months.json`).

## Mountain Climb unit ids

| Month | Words unit | Feature quiz unit |
|-------|------------|-------------------|
| 01–12 | `culture_m01` … `culture_m12` | `culture_m01_show` … `culture_m12_show` |

Quiz JSON on the climb server may land later; URLs are wired now.

## GitHub Pages

Deploy from **`main`** branch, folder **`/`** (root).

## v1 scope

- No mrj-signin gate
- Culture intro videos play in-page via YouTube (`youtube-nocookie.com` embeds); missing slots stay as placeholders
- No copyrighted cartoon hosting
- Bingo v0 without Firebase (teacher projects call list)
