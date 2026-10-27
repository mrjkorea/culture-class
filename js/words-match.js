import {
  escapeHtml,
  getMonthIdFromQuery,
  loadWordsPackForMonth,
  monthPageUrl,
  shuffle,
} from "./words-data.js";
import { playWordAudio } from "./words-audio.js";
import { setStepDone } from "./month-progress.js";
import { repoRoot, wordsLearnUrl } from "./paths.js";

const app = document.getElementById("app");
let terms = [];
let month = null;

/** @type {{ tiles: object[], picked: number[], matched: Record<string, boolean>, pairs: number, need: number, started: number, timer: number|null }} */
let matchGame = null;

function renderShell(body) {
  const back = month
    ? `<a class="back-link halloween-back" href="${escapeHtml(monthPageUrl(month.slug))}">← Map</a>`
    : "";
  app.innerHTML = `
    <div class="wrap words-flow halloween-flow">
      ${back}
      <header class="halloween-hero">
        <h2>${month ? escapeHtml(month.name) + " — Match" : "Match"}</h2>
        <p>Tap two cards — match each picture with its English word.</p>
      </header>
      ${body}
      <footer class="site-footer">Culture Class · Halloween</footer>
    </div>`;
}

function updateMatchHud() {
  const el = document.getElementById("match-hud");
  if (!el || !matchGame) return;
  const s = Math.floor((Date.now() - matchGame.started) / 1000);
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  el.textContent = `Pairs ${matchGame.pairs} / ${matchGame.need} · ${mm}:${ss}`;
}

function drawMatch() {
  const grid = document.getElementById("match-grid");
  if (!grid || !matchGame) return;
  grid.innerHTML = "";
  matchGame.tiles.forEach((t, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `match-tile match-tile-${t.side}`;
    if (matchGame.matched[t.pair]) b.classList.add("matched");
    if (matchGame.picked.includes(idx)) b.classList.add("picked");
    if (t.side === "pic" && t.img) {
      b.innerHTML = `<img src="${escapeHtml(t.img)}" alt="" class="match-tile-pic">`;
    } else {
      b.textContent = t.text;
    }
    b.addEventListener("click", () => onMatchTap(idx));
    grid.appendChild(b);
  });
}

function onMatchTap(idx) {
  if (!matchGame) return;
  const t = matchGame.tiles[idx];
  if (matchGame.matched[t.pair]) return;
  if (matchGame.picked.includes(idx)) return;
  if (matchGame.picked.length >= 2) return;
  const term = terms.find((w) => w.id === t.pair || w.term === t.pairKey);
  if (term && t.side === "pic") void playWordAudio(term.term, term.audio);
  matchGame.picked.push(idx);
  drawMatch();
  if (matchGame.picked.length < 2) return;

  const a = matchGame.tiles[matchGame.picked[0]];
  const b = matchGame.tiles[matchGame.picked[1]];
  const ok = a.pair === b.pair && a.side !== b.side;
  if (ok) {
    matchGame.matched[a.pair] = true;
    matchGame.pairs += 1;
    matchGame.picked = [];
    drawMatch();
    updateMatchHud();
    if (matchGame.pairs >= matchGame.need) {
      if (matchGame.timer) clearInterval(matchGame.timer);
      finish();
    }
  } else {
    setTimeout(() => {
      matchGame.picked = [];
      drawMatch();
    }, 420);
  }
}

function startMatch() {
  const tiles = [];
  for (const w of terms) {
    const img = w.image ? `${repoRoot()}/${String(w.image).replace(/^\/+/, "")}` : "";
    tiles.push({
      pair: w.id,
      pairKey: w.term,
      side: "pic",
      text: w.term,
      img,
    });
    tiles.push({
      pair: w.id,
      pairKey: w.term,
      side: "en",
      text: w.term,
      img: "",
    });
  }
  matchGame = {
    tiles: shuffle(tiles),
    picked: [],
    matched: {},
    pairs: 0,
    need: terms.length,
    started: Date.now(),
    timer: setInterval(updateMatchHud, 250),
  };
  renderShell(`
    <p class="match-hud" id="match-hud">Pairs 0 / ${terms.length} · 0:00</p>
    <div class="match-grid" id="match-grid"></div>`);
  drawMatch();
  updateMatchHud();
}

function finish() {
  if (month) setStepDone(month.id, "match");
  const next = month ? wordsLearnUrl(month.id) : "#";
  renderShell(`
    <div class="words-complete halloween-panel">
      <p class="words-complete-lead">🎉 You matched all <strong>${terms.length}</strong> words!</p>
      <div class="step-actions">
        <a class="btn btn-glow" href="${escapeHtml(next)}">Next: Learn →</a>
        <a class="btn btn-glow-secondary" href="${escapeHtml(monthPageUrl(month.slug))}">Back to map</a>
      </div>
    </div>`);
}

async function init() {
  const monthId = getMonthIdFromQuery();
  if (!monthId) {
    renderShell(`<p class="placeholder-box">Open from the October map.</p>`);
    return;
  }
  const loaded = await loadWordsPackForMonth(monthId);
  month = loaded.month;
  terms = loaded.terms;
  if (!month?.wordsPreviewFile || !terms.length) {
    renderShell(`<p class="placeholder-box">Words not ready.</p>`);
    return;
  }
  document.title = `Culture Class — ${month.name} Match`;
  document.body.classList.add("halloween-theme");
  startMatch();
}

init().catch(console.error);
