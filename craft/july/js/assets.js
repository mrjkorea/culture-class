/** Load stages.json + manifest. Robot host audio only. */

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url.pathname || url.href}`);
  return res.json();
}

export async function loadCraft() {
  const root = new URL("../", import.meta.url);
  const spec = await fetchJson(new URL("stages.json", root));
  const manifest = await fetchJson(new URL("assets/manifest.json", root));
  const assetBase = new URL("assets/", root);
  return { spec, manifest, assetBase };
}

export function transitionUrl(assetBase, manifest, id) {
  const rel = manifest.transitions?.[id];
  if (!rel) return "";
  return new URL(rel, assetBase).href;
}

export function transitionVideoUrl(assetBase, manifest, id) {
  const rel = manifest.transitionVideos?.[id];
  if (!rel) return "";
  return new URL(rel, assetBase).href;
}
