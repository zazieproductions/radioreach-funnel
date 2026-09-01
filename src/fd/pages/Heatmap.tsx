/** Heat map: density / hometown rings / format lanes / outcome performance.
 *  All bucket math is client-side over server data; every view has a table
 *  twin, and "density" never means "market size." */
import { useEffect, useMemo, useState } from "react";
import { fdApi } from "../lib/api";
import { useFd } from "../lib/store";
import { MapCanvas, projectStation, pxPerMileAt, type MapPoint } from "../lib/map";
import { milesBetween, projectPoint } from "../lib/projection";
import { Card, EmptyState, Spinner } from "../lib/ui";
import type { GeoStation, StationOverlay } from "./types";

type View = "density" | "rings" | "formats" | "outcome";

const FORMAT_FAMILIES: { test: RegExp; label: string; color: string }[] = [
  { test: /college|nacc/i, label: "College / NACC", color: "#f4c21d" },
  { test: /community|non-?commercial|kcrx|freeform/i, label: "Community / non-commercial", color: "#46c8ac" },
  { test: /aaa|album/i, label: "AAA / Album", color: "#6ea8fe" },
  { test: /alt|rock|metal|punk/i, label: "Alternative & rock", color: "#c792ea" },
  { test: /hip|rap|r&b|urban/i, label: "Hip-hop / R&B", color: "#f0564f" },
  { test: /country|americana|roots|folk/i, label: "Country / Americana", color: "#e8a33d" },
  { test: /electro|dance|dj|club/i, label: "Electronic / dance", color: "#56d4dd" },
  { test: /jazz|blues|funk|soul/i, label: "Jazz / blues / soul", color: "#9ccc65" },
  { test: /latin|reggaeton|salsa/i, label: "Latin", color: "#ff8a65" },
];
const OTHER = { label: "Other / specialty", color: "#8d99ae" };
function familyOf(format: string) {
  return FORMAT_FAMILIES.find((f) => f.test.test(format || "")) || OTHER;
}

export function HeatmapPage() {
  const { me } = useFd();
  const [data, setData] = useState<{ stations: GeoStation[]; overlay: StationOverlay[]; outcomeMap: Record<string, number>; stateAgg: { state: string; c: number }[]; formatAgg: { format: string; c: number }[] } | null>(null);
  const [view, setView] = useState<View>("density");
  const [campaignId, setCampaignId] = useState<string>(me?.campaign?.id || "");
  const [home, setHome] = useState<string>(me?.campaign?.homeCity ? `${me.campaign.homeCity}, ${(me.campaign.homeState as string) || ""}` : "");
  const [selected, setSelected] = useState<number | null>(null);
  const [toWarRoom, setToWarRoom] = useState<number[]>([]);
  const [addMsg, setAddMsg] = useState("");
  const [asList, setAsList] = useState(false);

  useEffect(() => {
    fdApi.get<typeof data>(`heatmap${campaignId ? `?campaign=${campaignId}` : ""}`).then((r) => setData(r as never)).catch(() => setData({ stations: [], overlay: [], outcomeMap: {}, stateAgg: [], formatAgg: [] }));
  }, [campaignId]);

  const overlayByStation = useMemo(() => Object.fromEntries((data?.overlay || []).map((o) => [o.station_id, o])), [data]);

  // home coords: centroid of DB stations in the matching city (estimate) — no geocoding service
  const homePoint = useMemo(() => {
    if (!data || !home.trim()) return null;
    const [city, st] = home.split(",").map((s) => s.trim());
    const matches = data.stations.filter((s) => s.city?.toLowerCase() === city.toLowerCase() && (!st || s.state === st.toUpperCase()));
    if (!matches.length) return null;
    const lat = matches.reduce((a, m) => a + Number(m.lat), 0) / matches.length;
    const lon = matches.reduce((a, m) => a + Number(m.lon), 0) / matches.length;
    return { lat, lon, cities: matches.length, label: `${city}${st ? ", " + st.toUpperCase() : ""}` };
  }, [data, home]);

  const campaign = me?.campaign?.id === campaignId ? me.campaign : null;
  const events = ((campaign?.events as { city: string; venue: string; date: string }[]) || []).filter((e) => e.city);
  const confirmedStart = (campaign?.startDate as string) || "";

  const ringsData = useMemo(() => {
    if (!homePoint || !data) return null;
    const buckets: Record<string, GeoStation[]> = { r25: [], r90: [], r300: [], corridor: [] };
    const corridorPts = events
      .map((e) => {
        const m = data.stations.filter((s) => s.city?.toLowerCase().includes(e.city.toLowerCase()));
        if (!m.length) return null;
        return { lat: m.reduce((a, x) => a + Number(x.lat), 0) / m.length, lon: m.reduce((a, x) => a + Number(x.lon), 0) / m.length };
      })
      .filter(Boolean) as { lat: number; lon: number }[];
    for (const s of data.stations) {
      const d = milesBetween({ lat: homePoint.lat, lon: homePoint.lon }, { lat: Number(s.lat), lon: Number(s.lon) });
      if (d <= 25) buckets.r25.push(s);
      else if (d <= 90) buckets.r90.push(s);
      else if (d <= 300) buckets.r300.push(s);
      if (corridorPts.some((c) => milesBetween(c, { lat: Number(s.lat), lon: Number(s.lon) }) <= 60)) buckets.corridor.push(s);
    }
    return { buckets, corridorPts };
  }, [homePoint, data, events]);

  const visible = useMemo(() => {
    if (!data) return [];
    let rows = data.stations;
    if (view === "rings" && ringsData) {
      const ids = new Set([...ringsData.buckets.r25, ...ringsData.buckets.r90, ...ringsData.buckets.r300, ...ringsData.buckets.corridor].map((s) => s.id));
      rows = rows.filter((s) => ids.has(s.id));
    }
    if (view === "outcome" && campaignId) rows = rows.filter((s) => overlayByStation[s.id]);
    return rows;
  }, [data, view, ringsData, campaignId, overlayByStation]);

  const points: MapPoint[] = useMemo(() => {
    return visible.map((s) => {
      const [x, y] = projectStation(s);
      let color = "#f4c21d";
      let title = "";
      if (view === "formats") { color = familyOf(s.format).color; title = familyOf(s.format).label; }
      else if (view === "rings" && ringsData && homePoint) {
        const d = milesBetween({ lat: homePoint.lat, lon: homePoint.lon }, { lat: Number(s.lat), lon: Number(s.lon) });
        color = d <= 25 ? "#f4c21d" : d <= 90 ? "#46c8ac" : ringsData.buckets.corridor.includes(s) ? "#6ea8fe" : "#c792ea";
        title = d <= 25 ? `Ring 1 — ${Math.round(d)} mi` : d <= 90 ? `Ring 2 — ${Math.round(d)} mi` : d <= 300 ? `Ring 3 — ${Math.round(d)} mi` : "tour corridor";
      } else if (view === "outcome") {
        const o = overlayByStation[s.id];
        title = o ? `score ${o.total_score} · ${o.status}${o.outcomes ? ` · ${o.outcomes} verified outcomes` : ""}` : "not in campaign";
        color = o ? (o.suppressed ? "#5c5c66" : ["replied", "review", "added", "rotation"].includes(o.status) ? "#46c8ac" : o.status === "sent" || o.status === "verified" ? "#f4c21d" : o.status === "declined" || o.status === "cold" ? "#f0564f" : "#8d99ae") : "#33333c";
      } else if (view === "density") {
        const risk = Number(s.data_risk) || 0;
        title = risk >= 10 ? "row needs re-verification (data_risk)" : "row dated for this cycle";
        color = risk >= 10 ? "#e8a33d" : "#f4c21d";
      }
      return { id: s.id, x, y, callsign: s.callsign, name: s.name, city: s.city, state: s.state, color, title };
    });
  }, [visible, view, ringsData, homePoint, overlayByStation]);

  const sel = selected != null ? data?.stations.find((s) => s.id === selected) : null;
  const stateColors = useMemo(() => {
    if (view !== "density" || !data) return undefined;
    const max = Math.max(1, ...data.stateAgg.map((a) => a.c));
    const ramp = ["#16161d", "#3a2f0b", "#6b5310", "#a37c12", "#f4c21d"];
    const out: Record<string, string> = {};
    for (const a of data.stateAgg) {
      const idx = Math.min(ramp.length - 1, Math.round((a.c / max) * (ramp.length - 1)));
      out[stateNameByAbbr(a.state)] = ramp[idx + 1] ? ramp[idx + 1] : ramp[idx];
    }
    return out;
  }, [data, view]);

  if (!data) return <Spinner label="Loading heat map…" />;
  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Strategic heat map · {data.stations.length} curated rows</p>
          <h1 className="fd-display mt-1 text-3xl">Geography is strategy</h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-white/50">Density here = stations WE catalogued in each state — never a proxy for market size or audience (heat-map rule 5). Coordinates at state-level are marked as estimates; verify before routing offers.</p>
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs">
          <span className="fd-label !mb-0">Campaign overlay</span>
          <select className="fd-select !w-auto !min-h-[38px]" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">none</option>
            {me?.campaign ? <option value={me.campaign.id}>{me.campaign.name}</option> : null}
          </select>
        </label>
      </header>

      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Heat map views">
        {([["density", "Density"], ["rings", "Home rings"], ["formats", "Format lanes"], ["outcome", "Outcome performance"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} className={`fd-chip !text-[0.72rem] ${view === id ? "border-[#f4c21d] text-[#f4c21d]" : ""}`} onClick={() => setView(id)}>{label}</button>
        ))}
        <button type="button" className="fd-btn fd-btn--sm ml-auto" aria-pressed={asList} onClick={() => setAsList((v) => !v)}>{asList ? "Show map" : "Show as table (a11y twin)"}</button>
      </div>

      {view === "rings" && (
        <Card title="Home city" sub="Rings are distance from YOUR anchor city — computed over the catalogued rows" as="section">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex-1 min-w-[220px]"><span className="fd-label">City, ST — e.g. “Austin, TX”</span>
              <input className="fd-input" list="fd-city-suggest" value={home} onChange={(e) => setHome(e.target.value)} placeholder="from your campaign: type your home city" />
              <datalist id="fd-city-suggest">{Array.from(new Set(data.stations.map((s) => `${s.city}, ${s.state}`))).sort().map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            {homePoint && (
              <p className="text-xs text-white/60">
                Anchor = centroid of {homePoint.cities} catalogued station{homePoint.cities > 1 ? "s" : ""} near {homePoint.label} <span className="fd-chip !py-0 basis-estimate">estimate</span>
              </p>
            )}
          </div>
          {ringsData && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["≤25 mi · hometown", ringsData.buckets.r25.length, "#f4c21d"], ["26–90 mi · drivable", ringsData.buckets.r90.length, "#46c8ac"], ["91–300 mi · flyable", ringsData.buckets.r300.length, "#c792ea"], [`tour corridor ±60 mi${events.length ? ` (${events.length} dates)` : ""}`, ringsData.buckets.corridor.length, "#6ea8fe"]].map(([label, n, color]) => (
                <p key={String(label)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"><span className="fd-legend-swatch mr-2 align-[-2px]" style={{ background: String(color) }} /><span className="tnum font-extrabold">{n}</span> <span className="text-white/60">{label}</span></p>
              ))}
            </div>
          )}
          {!homePoint && <p className="mt-2 text-sm text-white/45">Type a supported city to draw rings. Confirmed tour dates (from the campaign) add the corridor overlay{campaignId ? "" : " — pick the campaign to use its dates"}.</p>}
        </Card>
      )}

      {asList ? (
        <Card title={`Station list — ${visible.length} rows in view`} sub="Every map point, as text. Same rows, same order.">
          <div className="scroll-x max-h-[62vh] overflow-y-auto">
            <table className="fd-table">
              <thead><tr><th>Call</th><th>Station</th><th>City</th><th>ST</th><th>Format family</th><th>Ring</th><th>Verified</th><th>Risk</th>{view === "outcome" && <th>Campaign status</th>}</tr></thead>
              <tbody>
                {visible.map((s) => {
                  const o = overlayByStation[s.id];
                  return (
                    <tr key={s.id}>
                      <td className="font-bold">{s.callsign}</td><td>{s.name}</td><td>{s.city}</td><td>{s.state}</td>
                      <td><span className="fd-legend-swatch mr-1.5 align-[-2px]" style={{ background: familyOf(s.format).color }} />{familyOf(s.format).label}</td>
                      <td className="text-white/60">{s.ring}</td>
                      <td className={s.coord_basis === "state" ? "text-[#6ea8fe]" : ""}>{s.verified_at}{s.coord_basis === "state" ? " ·≈" : ""}</td>
                      <td>{Number(s.data_risk) >= 10 ? <span className="text-[#f0564f]">re-verify</span> : s.data_risk}</td>
                      {view === "outcome" && <td>{o ? `${o.status} · ${o.total_score}` : "—"}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <MapCanvas
          points={points}
          stateColors={stateColors}
          selected={selected}
          onSelect={setSelected}
          rings={homePoint && view === "rings" ? (() => {
            const [hx, hy] = projectPoint(homePoint.lon, homePoint.lat);
            const ppm = pxPerMileAt(homePoint.lat, homePoint.lon);
            return [
              { x: hx, y: hy, rPx: 25 * ppm, name: "ring1", color: "#f4c21d" },
              { x: hx, y: hy, rPx: 90 * ppm, name: "ring2", color: "#46c8ac" },
              { x: hx, y: hy, rPx: 300 * ppm, name: "ring3", color: "#c792ea" },
            ];
          })() : []}
        />
      )}

      {view === "density" && (
        <Card title="Density legend & top states" as="section">
          <div className="flex flex-wrap gap-4 text-xs">
            <p className="flex items-center gap-2">Fewer catalogued rows <span className="flex gap-1">{["#16161d", "#3a2f0b", "#6b5310", "#a37c12", "#f4c21d"].map((c) => <span key={c} className="fd-legend-swatch" style={{ background: c }} />)}</span> more rows</p>
            <p className="text-white/55">{data.stateAgg.slice(0, 8).map((a) => `${a.state} ${a.c}`).join(" · ")}</p>
          </div>
        </Card>
      )}
      {view === "formats" && (
        <Card title="Format lanes" as="section">
          <ul className="flex flex-wrap gap-3 text-xs">
            {[...FORMAT_FAMILIES, OTHER].map((f) => {
              const n = data.stations.filter((s) => familyOf(s.format) === f).length;
              return <li key={f.label} className="flex items-center gap-1.5"><span className="fd-legend-swatch" style={{ background: f.color }} />{f.label} <span className="tnum text-white/50">({n})</span></li>;
            })}
          </ul>
        </Card>
      )}

      {sel && (
        <Card title={`${sel.callsign} — ${sel.name}`} right={
          <div className="flex gap-2">
            <button type="button" className="fd-btn fd-btn--sm" onClick={() => setToWarRoom((l) => (l.includes(sel.id) ? l : [...l, sel.id]))}>{toWarRoom.includes(sel.id) ? "Queued ✓" : "+ War room"}</button>
            <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={() => setSelected(null)}>Close</button>
          </div>
        }>
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <p><span className="fd-label !mb-0">City</span> {sel.city}, {sel.state} ({sel.dial}) <span className="fd-chip !py-0 ml-1" title={sel.coord_basis === "city" ? "Coordinates matched to the city" : "Coordinates are state-level — treat pin as approximate"}>{sel.coord_basis === "city" ? "city-precise" : "state-level ≈"}</span></p>
            <p><span className="fd-label !mb-0">Format</span> {sel.format}</p>
            <p><span className="fd-label !mb-0">Ring notes</span> {sel.ring || "—"}</p>
            <p><span className="fd-label !mb-0">Specialty shows</span> {sel.specialty_program || "—"}</p>
            <p><span className="fd-label !mb-0">Gatekeeper (as catalogued)</span> {sel.gatekeeper_name || "—"} {sel.gatekeeper_role ? `· ${sel.gatekeeper_role}` : ""} · verified {sel.verified_at}</p>
            <p><span className="fd-label !mb-0">Route</span> {sel.contact_route ? <span className="break-all">{sel.contact_route}</span> : <span className="text-[#f0564f]">no route on file — research required (Lesson 3.2)</span>}</p>
            {sel.source_url && <p className="sm:col-span-2"><span className="fd-label !mb-0">Source</span> <a className="text-[#6ea8fe] underline" href={sel.source_url} target="_blank" rel="noreferrer nofollow">{sel.source_url}</a></p>}
            {sel.angle && <p className="sm:col-span-2"><span className="fd-label !mb-0">Catalogued angle</span> {sel.angle}</p>}
            {overlayByStation[sel.id] && <p className="sm:col-span-2"><span className="fd-label !mb-0">Campaign</span> {overlayByStation[sel.id].status} · score {overlayByStation[sel.id].total_score}{Number(overlayByStation[sel.id].suppressed) ? " · SUPPRESSED — do not contact" : ""}</p>}
          </div>
          {toWarRoom.length > 0 && campaignId && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <span className="text-xs text-white/60">{toWarRoom.length} station(s) queued for “{me?.campaign?.name}”</span>
              <button type="button" className="fd-btn fd-btn--gold fd-btn--sm" onClick={async () => {
                const r = await fdApi.post<{ added: number; skippedSuppressed?: number }>(`campaigns/${campaignId}/targets`, { stationIds: toWarRoom });
                setAddMsg(`+${r.added} added${r.skippedSuppressed ? ` (${r.skippedSuppressed} suppressed skipped)` : ""} — auto-scored as RECOMMENDED; verify contacts before sending.`);
                setToWarRoom([]);
              }}>Add to war room (scored & queued)</button>
              <button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={() => setToWarRoom([])}>Clear</button>
            </div>
          )}
          {toWarRoom.length > 0 && !campaignId && <p className="mt-2 text-xs text-[#f5a623]">No active campaign to attach to — create one in the Campaign Builder first.</p>}
          {addMsg && <p className="mt-2 text-xs text-[#46c8ac]" role="status">{addMsg}</p>}
        </Card>
      )}
      {!data.stations.length && <EmptyState title="Station database empty" body="The 300-row curated table loads from D1. Run the seed migrations (or import via Admin → Stations)." />}
      {confirmedStart && view === "outcome" && <p className="text-xs text-white/45">Overlay for campaign starting {confirmedStart}. Rates on the Analytics page carry the denominators; this view is per-station status only.</p>}
    </div>
  );
}

const ABBR: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia" };
export function stateNameByAbbr(abbr: string): string {
  return ABBR[abbr?.toUpperCase()] || abbr || "";
}
