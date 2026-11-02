import { dataUrl, monthUrl, repoRoot } from "./paths.js";
import { applyI18n, getLang, mountLangSelect, setLang, t } from "./i18n.js";
import { isMonthPathOpen, pathLocksActive } from "./path-lock.js";

async function loadMonths() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("Could not load months.json");
  return res.json();
}

function coverStyle(month) {
  const file = month.cardCover || month.coverImage;
  if (!file) return "";
  const url = `${repoRoot()}/${String(file).replace(/^\/+/, "")}`;
  return ` style="--month-cover:url('${url}')"`;
}

function renderHome(data) {
  const titleEl = document.getElementById("site-title");
  const subEl = document.getElementById("site-subtitle");
  const grid = document.getElementById("month-grid");

  if (titleEl) titleEl.textContent = data.siteTitle || "Culture Class";
  if (subEl) subEl.textContent = data.siteSubtitle || t("cc_site_sub");

  grid.innerHTML = data.months
    .map((m) => {
      const hasCover = Boolean(m.cardCover || m.coverImage);
      const halloween = m.monthLayout === "halloween" || m.id === "10";
      const open = isMonthPathOpen(m.id);
      const locked = pathLocksActive() && !open;
      const cls = [
        hasCover
          ? `month-card month-card-cover${halloween ? " month-card-cover-halloween" : ""}`
          : "month-card",
        locked ? "month-card-locked" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const inner = `
      <div class="num">Month ${m.id}</div>
      <div class="name">${m.name}</div>
      <div class="theme">${m.theme}</div>
      ${locked ? '<div class="month-lock-tag">🔒</div>' : ""}`;
      if (locked) {
        return `
    <div class="${cls}" aria-disabled="true"${coverStyle(m)}>${inner}</div>`;
      }
      return `
    <a class="${cls}" href="${monthUrl(m.slug)}"${coverStyle(m)}>${inner}</a>`;
    })
    .join("");

  applyI18n(document);
}

setLang(getLang());
mountLangSelect(document.getElementById("lang-select"), () => {
  loadMonths().then(renderHome).catch(console.error);
});

loadMonths().then(renderHome).catch((err) => {
  console.error(err);
  document.getElementById("month-grid").innerHTML =
    '<p class="placeholder-box">Could not load course data. Check that <code>data/months.json</code> is deployed.</p>';
});
