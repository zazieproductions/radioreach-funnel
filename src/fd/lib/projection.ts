import { projectAlbers } from "@/../shared/fd-core";
import geom from "../data/us-state-paths.json";

type Geom = typeof geom;
const G = geom as Geom;

/** Project lon/lat → px in the 975×610 albers viewBox, with AK/HI/PR inset
 *  linear fits matching the pre-projected outlines. Pure + deterministic. */
export function projectPoint(lon: number, lat: number): [number, number] {
  const { albers } = G;
  const contus =
    lat >= 24.4 && lat <= 49.5 && lon >= -125.1 && lon <= -66.9;
  if (contus) return albersProj(lon, lat, albers);
  for (const inset of Object.values(G.insets as Record<string, { bbox: number[]; lon: number[]; lat: number[] }>)) {
    if (lon >= inset.lon[0] && lon <= inset.lon[1] && lat >= inset.lat[0] && lat <= inset.lat[1]) {
      const [x0, y0, x1, y1] = inset.bbox;
      const fx = (lon - inset.lon[0]) / (inset.lon[1] - inset.lon[0]);
      const fy = (lat - inset.lat[1]) / (inset.lat[0] - inset.lat[1]);
      return [x0 + fx * (x1 - x0), y0 + fy * (y1 - y0)];
    }
  }
  // Fallback: raw albers clamped into view (off-CONUS, e.g. PR)
  const [x, y] = albersProj(lon, lat, albers);
  return [Math.max(2, Math.min(G.viewBox[0] - 2, x)), Math.max(2, Math.min(G.viewBox[1] - 2, y))];
}

function albersProj(lon: number, lat: number, p: Geom["albers"]): [number, number] {
  const rad = Math.PI / 180;
  const n = (Math.sin(p.parallels[0] * rad) + Math.sin(p.parallels[1] * rad)) / 2;
  const C = Math.cos(p.parallels[0] * rad) ** 2 + 2 * n * Math.sin(p.parallels[0] * rad);
  const rho = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(lat * rad))) / n;
  const rho0 = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(p.center[1] * rad))) / n;
  const theta = n * ((lon + p.rotate) * rad - p.center[0] * rad);
  const x = rho * Math.sin(theta);
  const y = rho0 - rho * Math.cos(theta);
  return [p.translate[0] + x * p.scale, p.translate[1] - y * p.scale];
}

/** Great-circle miles — used for ring membership only, never for reach. */
export function milesBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const MAP_VIEWBOX = { w: G.viewBox[0], h: G.viewBox[1] } as const;
export const STATE_PATHS = G.states as { id: string; name: string; d: string; bbox: number[] }[];
export { projectAlbers };
