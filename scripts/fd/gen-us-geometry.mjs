/**
 * Generates src/fd/data/us-state-paths.json from us-atlas (devDependency).
 *
 * - Decodes the pre-projected (d3.geoAlbersUsa, 975×610) states TopoJSON.
 * - Douglas–Peucker simplification (tolerance ~1.6px) to keep the client
 *   payload small without losing recognizability.
 * - Emits SVG path data + per-state bbox/centroid and inset affine fits for
 *   AK/HI/PR so the client can place lat/lon station coordinates inside the
 *   same space using one pure function (see src/fd/lib/projection.ts).
 *
 * Run: node scripts/fd/gen-us-geometry.mjs   (re-run after updating us-atlas)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const topo = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules", "us-atlas", "states-albers-10m.json"), "utf8"));

const { scale, translate } = topo.transform;
const arcsSrc = topo.arcs;

// decode delta-quantized arcs
const arcs = arcsSrc.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});

function ringFromArcs(idx) {
  const pts = [];
  for (const i of idx) {
    const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]);
  }
  return pts;
}

function dp(points, tol) {
  if (points.length < 3) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = points[i], [bx, by] = points[j];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = -1, maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const [px, py] = points[k];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; maxK = k; }
    }
    if (maxD > tol && maxK > 0) { keep[maxK] = true; stack.push([i, maxK], [maxK, j]); }
  }
  return points.filter((_, k) => keep[k]);
}

function toPath(rings) {
  return rings.map((ring) => {
    const pts = dp(ring, 1.6);
    if (pts.length < 3) return "";
    let d = "";
    pts.forEach(([x, y], i) => { d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); });
    return d + "Z";
  }).filter(Boolean).join("");
}

const states = [];
for (const g of topo.objects.states.geometries) {
  const rings = g.type === "Polygon" ? g.arcs.map((r) => ringFromArcs(r)) : g.arcs.flatMap((poly) => poly.map((r) => ringFromArcs(r)));
  const flatRings = rings.map((r) => r.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const r of flatRings) for (const [x, y] of r) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  states.push({
    id: String(g.id).padStart(2, "0"),
    name: g.properties?.name || "",
    d: toPath(flatRings),
    bbox: [minX, minY, maxX, maxY].map((v) => Math.round(v * 10) / 10),
  });
}

function find(name) { return states.find((s) => s.name === name); }
const AK = find("Alaska"), HI = find("Hawaii"), PR = find("Puerto Rico");

// Inset affine fits: map [lonMin,lonMax]×[latMin,latMax] (true geography) to
// the inset pixel bbox. Stations in those states use the same fit, so pins
// land consistently inside the drawn shape at inset scale.
const insets = {};
if (AK) insets.AK = { bbox: AK.bbox, lon: [-170, -129], lat: [51, 72] };
if (HI) insets.HI = { bbox: HI.bbox, lon: [-161, -154.5], lat: [18.5, 22.5] };
if (PR) insets.PR = { bbox: PR.bbox, lon: [-67.3, -65.2], lat: [17.7, 18.6] };

const out = {
  note: "Pre-projected US state outlines (d3.geoAlbersUsa 975×610) from us-atlas, Douglas–Peucker simplified by scripts/fd/gen-us-geometry.mjs. Regenerate with node scripts/fd/gen-us-geometry.mjs.",
  viewBox: [975, 610],
  // d3.geoAlbers lower-48 parameters mirrored in src/fd/lib/projection.ts
  albers: { parallels: [29.5, 45.5], rotate: 96, center: [-0.6, 38.7], scale: 1070, translate: [480, 250] },
  states,
  insets,
};

const dest = path.join(ROOT, "src", "fd", "data", "us-state-paths.json");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`wrote ${path.relative(ROOT, dest)} — ${states.length} states (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
