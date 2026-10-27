/** Turn face parts into the exact pin/carve click samples. Geometry stays in assets/faces.json. */

export function partToPolyline(part) {
  if (part.type === "ellipse") {
    const steps = 32;
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      pts.push([
        part.cx + Math.cos(angle) * part.rx,
        part.cy + Math.sin(angle) * part.ry,
      ]);
    }
    return pts;
  }
  const pts = (part.points || []).map((p) => [Number(p[0]), Number(p[1])]);
  if (!pts.length || part.closed === false) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) pts.push([first[0], first[1]]);
  return pts;
}

/** Spread `count` points evenly along the polylines. Length is always `count`. */
export function resample(polylines, count) {
  const segs = [];
  let total = 0;
  for (const line of polylines) {
    for (let i = 1; i < line.length; i += 1) {
      const a = line[i - 1];
      const b = line[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d < 1e-6) continue;
      segs.push({ a, b, d, start: total });
      total += d;
    }
  }
  if (!segs.length || count <= 0) return [];
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const target = ((i + 0.5) / count) * total;
    let seg = segs[segs.length - 1];
    for (const candidate of segs) {
      if (target <= candidate.start + candidate.d + 1e-8) {
        seg = candidate;
        break;
      }
    }
    const t = Math.min(1, Math.max(0, (target - seg.start) / seg.d));
    pts.push({
      x: seg.a[0] + (seg.b[0] - seg.a[0]) * t,
      y: seg.a[1] + (seg.b[1] - seg.a[1]) * t,
    });
  }
  return pts;
}

export function partMarkup(part) {
  if (part.type === "ellipse") {
    return `<ellipse class="face-shape" cx="${part.cx}" cy="${part.cy}" rx="${part.rx}" ry="${part.ry}"/>`;
  }
  const points = (part.points || []).map((p) => `${p[0]},${p[1]}`).join(" ");
  if (part.closed === false) return `<polyline class="face-line" points="${points}"/>`;
  return `<polygon class="face-shape" points="${points}"/>`;
}

export function faceSvgMarkup(face) {
  const body = face.parts.map(partMarkup).join("");
  return `<svg class="face-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${body}<g data-ghosts></g><g data-done></g></svg>`;
}

export function prepareFaces(faceList, pinClicks, carveClicks) {
  return faceList.map((face) => {
    const lines = face.parts.map(partToPolyline);
    const pin = resample(lines, pinClicks);
    const carve = resample(lines, carveClicks);
    if (pin.length !== pinClicks || carve.length !== carveClicks) {
      throw new Error(`Face "${face.id}" did not sample to the stage click totals`);
    }
    return { ...face, pin, carve };
  });
}
