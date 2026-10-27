/** Load stages.json + the asset manifest. Paths stay relative to this folder. */

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
  const faces = await fetchJson(new URL(manifest.faces || "faces.json", assetBase));
  return { spec, manifest, faces, assetBase };
}

export function transitionUrl(assetBase, manifest, id) {
  const rel = manifest.transitions && manifest.transitions[id];
  if (!rel) return "";
  return new URL(rel, assetBase).href;
}
