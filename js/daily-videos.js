/**
 * Culture Class — the 18 daily culture videos, Day 1 to Day 18.
 *
 * Each video belongs to the month it is about (Jay, 2026-11-12). The month map
 * shows only that month's days; videos/index.html shows all 18.
 *
 * The files stay on the MRJ video Worker and are never copied, moved or
 * renamed. Only the URL is linked.
 */

import { repoRoot } from "./paths.js";

const WORKER = "https://mrj-videos.canadianvegetarian.workers.dev/videos/";

function pad(n, width) {
  return String(n).padStart(width, "0");
}

/** Worker key for a day: day1-books-and-culture__096_culture-class__MRJ_Daily_01.mp4 */
function videoUrl(day) {
  const n = pad(95 + day, 3);
  return `${WORKER}day1-books-and-culture__${n}_culture-class__MRJ_Daily_${pad(day, 2)}.mp4`;
}

/**
 * month = the month the video is about, from the video's own transcript.
 * Jay approved this mapping on 2026-11-12.
 */
const TOPICS = {
  1: { month: "03", topic: "St. Patrick's Day" },
  2: { month: "05", topic: "Buddhism" },
  3: { month: "04", topic: "Easter" },
  4: { month: "02", topic: "Valentine's Day" },
  5: { month: "01", topic: "New Year" },
  6: { month: "10", topic: "Halloween" },
  7: { month: "09", topic: "Climate change" },
  8: { month: "06", topic: "Remembrance" },
  9: { month: "12", topic: "Christmas in Canada" },
  10: { month: "12", topic: "Christmas songs" },
  11: { month: "11", topic: "Thanksgiving" },
  12: { month: "11", topic: "Thanksgiving, part 2" },
  13: { month: "08", topic: "History of Canada" },
  14: { month: "08", topic: "Korean history" },
  15: { month: "07", topic: "Naming Canada" },
  16: { month: "07", topic: "Canada, A to Z" },
  17: { month: "07", topic: "Canada culture class" },
  18: { month: "07", topic: "O Canada" },
};

export const DAILY_VIDEOS = Array.from({ length: 18 }, (_, i) => {
  const day = i + 1;
  const info = TOPICS[day];
  return { day, url: videoUrl(day), month: info.month, topic: info.topic };
});

/** The videos for one month, Day 1 first. */
export function dailyVideosForMonth(monthId) {
  const id = pad(String(monthId).replace(/\D/g, ""), 2);
  return DAILY_VIDEOS.filter((v) => v.month === id);
}

export function dailyVideosPageUrl() {
  return `${repoRoot()}/videos/`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {object} [opts]
 * @param {string} [opts.monthId] only this month's videos
 * @param {boolean} [opts.showFiles] show a small "Day N file" link per day
 * @param {string} [opts.heading] block heading, empty to omit
 * @param {string} [opts.note] one line under the heading
 */
export function renderDailyVideosHtml(opts = {}) {
  const showFiles = opts.showFiles === true;
  const list = opts.monthId ? dailyVideosForMonth(opts.monthId) : DAILY_VIDEOS;
  const heading = opts.heading === undefined ? "Daily culture videos" : opts.heading;
  const note =
    opts.note === undefined ? "Pick a day and it plays here." : opts.note;

  const items = list
    .map(({ day, url, topic }) => {
      const file = showFiles
        ? `<a class="day-file" href="${url}" target="_blank" rel="noopener">Day ${day} file</a>`
        : "";
      return `
        <div class="day-item">
          <button class="day-card" type="button" data-day="${day}" data-src="${url}" data-topic="${escapeHtml(topic)}">
            <span class="day-num">Day ${day}</span>
            <span class="day-topic">${escapeHtml(topic)}</span>
            <span class="day-play">Watch</span>
          </button>
          ${file}
        </div>`;
    })
    .join("");

  return `
    <section class="daily-videos" aria-label="Daily culture videos">
      ${heading ? `<h3 class="daily-videos-heading">${escapeHtml(heading)}</h3>` : ""}
      ${note ? `<p class="daily-videos-note">${escapeHtml(note)}</p>` : ""}
      <p class="player-now" data-day-status>Choose a day to start.</p>
      <div class="player-frame">
        <video data-day-player controls playsinline preload="none"></video>
      </div>
      <div class="day-grid" data-day-grid>${items}
      </div>
    </section>`;
}

function playDay(block, btn) {
  const player = block.querySelector("[data-day-player]");
  const status = block.querySelector("[data-day-status]");
  if (!player) return;
  const day = btn.getAttribute("data-day");
  const src = btn.getAttribute("data-src");
  const topic = btn.getAttribute("data-topic") || "";
  if (!src) return;

  const grid = block.querySelector("[data-day-grid]");
  const old = grid ? grid.querySelector('.day-card[aria-current="true"]') : null;
  if (old) old.removeAttribute("aria-current");
  btn.setAttribute("aria-current", "true");

  if (status) {
    status.textContent = topic ? `Now playing: Day ${day} — ${topic}` : `Now playing: Day ${day}`;
  }
  player.src = src;
  player.load();
  const p = player.play();
  if (p && p.catch) p.catch(() => {});
  if (player.scrollIntoView) player.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Wire every mounted block in scope. Safe to call more than once. */
export function installDailyVideos(scope = document) {
  Array.from(scope.querySelectorAll(".daily-videos")).forEach((block) => {
    if (block.dataset.dailyWired === "1") return;
    block.dataset.dailyWired = "1";

    block.addEventListener("click", (e) => {
      const btn = e.target.closest(".day-card");
      if (btn && block.contains(btn)) playDay(block, btn);
    });

    block.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const grid = block.querySelector("[data-day-grid]");
      if (!grid) return;
      const all = Array.from(grid.querySelectorAll(".day-card"));
      const i = all.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      const next = e.key === "ArrowRight" ? all[i + 1] : all[i - 1];
      if (next) {
        next.focus();
        playDay(block, next);
      }
    });

    const player = block.querySelector("[data-day-player]");
    const status = block.querySelector("[data-day-status]");
    if (player && status) {
      player.addEventListener("error", () => {
        if (player.getAttribute("src")) {
          status.textContent = "That video did not load. Try the day again.";
        }
      });
    }
  });
}
