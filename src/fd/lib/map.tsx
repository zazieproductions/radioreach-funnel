/** SVG US map canvas: pre-projected state paths + station pins, pan/zoom,
 *  grid clustering at low zoom, keyboard accessible, table twin on request.
 *  Offline: no tiles, no external map provider (see docs/FD-IMPLEMENTATION-PLAN). */
import { useMemo, useRef, useState } from "react";
import { MAP_VIEWBOX, STATE_PATHS, projectPoint } from "./projection";
import type { GeoStation } from "../pages/types";

export type MapPoint = {
  id: number; x: number; y: number; callsign: string; name: string; city: string; state: string;
  color?: string; r?: number; label?: string; title?: string;
};

type Props = {
  points: MapPoint[];
  stateColors?: Record<string, string | undefined>;
  selected?: number | null;
  onSelect?: (id: number) => void;
  rings?: { x: number; y: number; rPx: number; name: string; color?: string }[];
  compact?: boolean;
};

const W = MAP_VIEWBOX.w, H = MAP_VIEWBOX.h;
const MIN_K = 1, MAX_K = 9;

export function MapCanvas({ points, stateColors, selected, onSelect, rings = [], compact }: Props) {
  const [k, setK] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const clampT = (t: number, size: number, kk: number) => Math.min(0, Math.max(W - W * kk, t));

  function zoomTo(nk: number, cx?: number, cy?: number) {
    const nk2 = Math.max(MIN_K, Math.min(MAX_K, nk));
    if (cx != null && cy != null) {
      // keep cursor point stationary
      setTx(clampT(cx - ((cx - tx) * nk2) / k, W, nk2));
      setTy(clampT(cy - ((cy - ty) * nk2) / k, H, nk2));
    } else {
      setTx(clampT(W / 2 - ((W / 2 - tx) * nk2) / k, W, nk2));
      setTy(clampT(H / 2 - ((H / 2 - ty) * nk2) / k, H, nk2));
    }
    setK(nk2);
  }
  const toLocal = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  // grid clustering when zoomed out (<1.8x): bin by 16px cells in scaled space
  const { clusters, singles } = useMemo(() => {
    if (k >= 1.8 || points.length < 90) return { clusters: [] as (MapPoint & { n: number; ids: number[] })[], singles: points };
    const cell = 16;
    const map = new Map<string, { sx: number; sy: number; pts: MapPoint[] }>();
    for (const p of points) {
      const sx = p.x * k + tx, sy = p.y * k + ty;
      const key = `${Math.floor(sx / cell)}:${Math.floor(sy / cell)}`;
      const e = map.get(key) || { sx: 0, sy: 0, pts: [] };
      e.pts.push(p);
      map.set(key, e);
    }
    const cl: (MapPoint & { n: number; ids: number[] })[] = [];
    const si: MapPoint[] = [];
    for (const { pts } of map.values()) {
      if (pts.length < 3) si.push(...pts);
      else {
        const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        cl.push({ id: pts[0].id, x, y, callsign: `${pts.length}`, name: "", city: "", state: "", n: pts.length, ids: pts.map((p) => p.id), label: `${pts.length} stations`, color: pts[0].color });
      }
    }
    return { clusters: cl, singles: si };
  }, [points, k, tx, ty]);

  return (
    <div className="fd-map" style={compact ? { maxHeight: "58dvh" } : undefined}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`US heat map with ${points.length} catalogued stations. Use the station table for the same data as a list; map controls support zoom and pan.`}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = 40 / k;
          if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomTo(k * 1.35); }
          else if (e.key === "-") { e.preventDefault(); zoomTo(k / 1.35); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); setTx((t) => clampT(t + step, W, k)); }
          else if (e.key === "ArrowRight") { e.preventDefault(); setTx((t) => clampT(t - step, W, k)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setTy((t) => clampT(t + step, H, k)); }
          else if (e.key === "ArrowDown") { e.preventDefault(); setTy((t) => clampT(t - step, H, k)); }
          else if (e.key === "0") { setK(1); setTx(0); setTy(0); }
        }}
        onWheel={(e) => {
          const p = toLocal(e);
          zoomTo(k * (e.deltaY < 0 ? 1.18 : 1 / 1.18), p.x, p.y);
        }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, tx, ty };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const r = svgRef.current?.getBoundingClientRect();
          if (!r) return;
          const sx = W / r.width, sy = H / r.height;
          setTx(clampT(drag.current.tx + (e.clientX - drag.current.x) * sx, W, k));
          setTy(clampT(drag.current.ty + (e.clientY - drag.current.y) * sy, H, k));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
      >
        <g transform={`translate(${tx},${ty}) scale(${k})`}>
          {STATE_PATHS.map((s) => (
            <path key={s.id} d={s.d} className="state" fill={stateColors?.[s.name] || undefined} aria-hidden="true">
              <title>{s.name}</title>
            </path>
          ))}
          {rings.map((rg) => (
            <g key={rg.name} aria-hidden="true">
              <circle cx={rg.x} cy={rg.y} r={rg.rPx} className="ring-fill" fill={rg.color ? rg.color + "22" : undefined} />
              <circle cx={rg.x} cy={rg.y} r={rg.rPx} className="ring" stroke={rg.color} strokeWidth={1.1 / k} />
            </g>
          ))}
          {clusters.map((c) => (
            <g key={`c${c.id}-${c.n}`} className="cluster" onClick={() => zoomTo(Math.min(MAX_K, k * 1.9), c.x * k + tx, c.y * k + ty)} role="button" aria-label={`Cluster of ${c.n} stations near ${c.city} ${c.state} — zoom in`}>
              <circle cx={c.x} cy={c.y} r={(9 + Math.min(9, c.n)) / k} fill="#f4c21dcc" stroke="#0b0b0b" strokeWidth={1 / k} />
              <text x={c.x} y={c.y + 3.4 / k} textAnchor="middle" fontSize={11 / k} fontWeight={900} fill="#0b0b0b" style={{ pointerEvents: "none" }}>{c.n}</text>
            </g>
          ))}
          {singles.map((p) => (
            <g
              key={p.id}
              className="station"
              tabIndex={0}
              role="button"
              aria-label={`${p.callsign} ${p.name} — ${p.city}, ${p.state}${p.title ? `. ${p.title}` : ""}`}
              onClick={(e) => { e.stopPropagation(); onSelect?.(p.id); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(p.id); } }}
            >
              <circle cx={p.x} cy={p.y} r={(selected === p.id ? 7 : 4.4) / k} fill={p.color || "#f4c21d"} stroke={selected === p.id ? "#fff" : "#0b0b0b"} strokeWidth={1.2 / k} />
              {selected === p.id && <title>{`${p.callsign} — ${p.name} · ${p.city}, ${p.state}${p.label ? " · " + p.label : ""}`}</title>}
            </g>
          ))}
        </g>
      </svg>
      <div className="fd-no-print absolute right-2 top-2 flex flex-col gap-1">
        <button type="button" className="fd-btn fd-btn--sm !min-h-[32px] !px-2" onClick={() => zoomTo(k * 1.5)} aria-label="Zoom in">＋</button>
        <button type="button" className="fd-btn fd-btn--sm !min-h-[32px] !px-2" onClick={() => zoomTo(k / 1.5)} aria-label="Zoom out">－</button>
        <button type="button" className="fd-btn fd-btn--sm !min-h-[32px] !px-2" onClick={() => { setK(1); setTx(0); setTy(0); }} aria-label="Reset view">⌂</button>
      </div>
      <p className="fd-no-print absolute bottom-1.5 left-2 text-[0.62rem] text-white/40">scroll/±: zoom · drag/arrows: pan · {k.toFixed(1)}× · pins = curated rows, not market size</p>
    </div>
  );
}

export function projectStation(s: Pick<GeoStation, "lat" | "lon">): [number, number] {
  return projectPoint(Number(s.lon), Number(s.lat));
}

/** px-per-mile at a given projected point (for ring drawing). */
export function pxPerMileAt(lat: number, lon: number): number {
  const [x1, y1] = projectPoint(lon, lat);
  const [x2, y2] = projectPoint(lon + 1, lat);
  const degMiles = 69 * Math.cos((lat * Math.PI) / 180);
  return Math.hypot(x2 - x1, y2 - y1) / Math.max(1, degMiles);
}
