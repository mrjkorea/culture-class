import { dataUrl, monthUrl } from "./paths.js";

async function loadMonths() {
  const res = await fetch(dataUrl("months.json"));
  if (!res.ok) throw new Error("Could not load months.json");
  return res.json();
}

function renderHome(data) {
  const titleEl = document.getElementById("site-title");
  const subEl = document.getElementById("site-subtitle");
  const grid = document.getElementById("month-grid");

  if (titleEl) titleEl.textContent = data.siteTitle;
  if (subEl) subEl.textContent = data.siteSubtitle;

  grid.innerHTML = data.months
    .map(
      (m) => `
    <a class="month-card" href="${monthUrl(m.slug)}">
      <div class="num">Month ${m.id}</div>
      <div class="name">${m.name}</div>
      <div class="theme">${m.theme}</div>
    </a>`
    )
    .join("");
}

loadMonths().then(renderHome).catch((err) => {
  console.error(err);
  document.getElementById("month-grid").innerHTML =
    '<p class="placeholder-box">Could not load course data. Check that <code>data/months.json</code> is deployed.</p>';
});
