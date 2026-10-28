import { dataUrl, monthUrl, repoRoot } from "./paths.js";

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

  if (titleEl) titleEl.textContent = data.siteTitle;
  if (subEl) subEl.textContent = data.siteSubtitle;

  grid.innerHTML = data.months
    .map((m) => {
      const hasCover = Boolean(m.cardCover || m.coverImage);
      const halloween = m.monthLayout === "halloween" || m.id === "10";
      const cls = hasCover
        ? `month-card month-card-cover${halloween ? " month-card-cover-halloween" : ""}`
        : "month-card";
      return `
    <a class="${cls}" href="${monthUrl(m.slug)}"${coverStyle(m)}>
      <div class="num">Month ${m.id}</div>
      <div class="name">${m.name}</div>
      <div class="theme">${m.theme}</div>
    </a>`;
    })
    .join("");
}

loadMonths().then(renderHome).catch((err) => {
  console.error(err);
  document.getElementById("month-grid").innerHTML =
    '<p class="placeholder-box">Could not load course data. Check that <code>data/months.json</code> is deployed.</p>';
});
