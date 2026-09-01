/** Station database browser — the War Room's raw material: filter, sort by
 *  what the row actually contains, add to any campaign. */
import { useCallback, useEffect, useState } from "react";
import { fdApi } from "../lib/api";
import { useFd } from "../lib/store";
import { Card, EmptyState, Spinner } from "../lib/ui";
import type { GeoStation } from "./types";

type Page = { rows: GeoStation[]; total: number; page: number; limit: number; note: string };

export function StationsPage() {
  const { me, toast } = useFd();
  const [page, setPage] = useState<Page | null>(null);
  const [f, setF] = useState({ q: "", state: "", format: "", ring: "", page: 1 });
  const [sel, setSel] = useState<GeoStation | null>(null);
  const [campaignId, setCampaignId] = useState(me?.campaign?.id || "");

  const load = useCallback(async () => {
    setPage(null);
    const r = await fdApi.get<Page>("stations", { q: f.q, state: f.state, format: f.format, ring: f.ring, page: f.page, limit: 25 });
    setPage(r);
  }, [f]);
  useEffect(() => { void load().catch(() => setPage({ rows: [], total: 0, page: 1, limit: 25, note: "" })); }, [load]);

  const pages = page ? Math.max(1, Math.ceil(page.total / page.limit)) : 1;

  return (
    <div className="grid gap-4">
      <header>
        <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.28em] text-[#f4c21d]">Station war-room database</p>
        <h1 className="fd-display mt-1 text-3xl">Research before you reach</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-white/55">{page?.note || "Curated rows — a starting set, not a master list. The field exercises expand it yourself."}</p>
      </header>

      <form className="fd-card grid gap-3 p-3 sm:grid-cols-[1fr_110px_1fr_110px_auto]" onSubmit={(e) => { e.preventDefault(); setF({ ...f, page: 1 }); void load(); }}>
        <label><span className="fd-label">Search</span><input className="fd-input" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="KCMU, Asheville, specialty…" /></label>
        <label><span className="fd-label">State</span><input className="fd-input" maxLength={2} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value.toUpperCase() })} placeholder="WA" /></label>
        <label><span className="fd-label">Format contains</span><input className="fd-input" value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })} placeholder="college" /></label>
        <label><span className="fd-label">Ring</span>
          <select className="fd-select" value={f.ring} onChange={(e) => setF({ ...f, ring: e.target.value })}>
            <option value="">any</option><option value="1">Ring 1</option><option value="2">Ring 2</option><option value="3">Ring 3</option><option value="4">Ring 4</option>
          </select>
        </label>
        <div className="flex items-end gap-2"><button type="submit" className="fd-btn fd-btn--gold">Filter</button>{(f.q || f.state || f.format || f.ring) && <button type="button" className="fd-btn" onClick={() => setF({ q: "", state: "", format: "", ring: "", page: 1 })}>Clear</button>}</div>
      </form>

      {!page ? <Spinner /> : page.rows.length === 0 ? (
        <EmptyState icon="🔍" title="Nothing matches" body="Loosen the filters — or use the heat map's bulk add for your campaign's composition instead." />
      ) : (
        <Card title={`${page.total} stations match`} right={
          <div className="flex items-center gap-2 text-xs">
            <button type="button" className="fd-btn fd-btn--sm" disabled={f.page <= 1} onClick={() => setF({ ...f, page: f.page - 1 })}>←</button>
            <span>{f.page} / {pages}</span>
            <button type="button" className="fd-btn fd-btn--sm" disabled={f.page >= pages} onClick={() => setF({ ...f, page: f.page + 1 })}>→</button>
          </div>
        }>
          <div className="scroll-x">
            <table className="fd-table min-w-[860px]">
              <thead><tr><th>Call / dial</th><th>Station</th><th>City, ST</th><th>Format</th><th>Ring</th><th>Gatekeeper</th><th>Verified</th><th>Data risk</th><th aria-label="actions"></th></tr></thead>
              <tbody>
                {page.rows.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap font-bold">{s.callsign} <span className="font-normal text-white/50">{s.dial}</span></td>
                    <td>{s.name}</td>
                    <td className="whitespace-nowrap">{s.city}, {s.state}{s.coord_basis === "state" && <span className="fd-chip !py-0 ml-1 basis-estimate" title="State-level coordinates — pin is approximate">≈</span>}</td>
                    <td>{s.format}</td>
                    <td className="text-white/60">{s.ring}</td>
                    <td>{s.gatekeeper_name || <span className="text-white/35">—</span>}</td>
                    <td className="whitespace-nowrap text-xs text-white/55">{s.verified_at}</td>
                    <td>{Number(s.data_risk) >= 10 ? <span className="fd-chip !py-0 text-[#f0564f]">re-verify</span> : Number(s.data_risk)}</td>
                    <td><button type="button" className="fd-btn fd-btn--sm" onClick={() => setSel(s)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {sel && (
        <Card title={`${sel.callsign} — full row`} right={<button type="button" className="fd-btn fd-btn--sm fd-btn--ghost" onClick={() => setSel(null)}>Close</button>}>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[["City", `${sel.city}, ${sel.state}`], ["Dial", sel.dial || "—"], ["Format", sel.format], ["Ring plan", sel.ring || "—"],
              ["Specialty programming", sel.specialty_program || "—"], ["Gatekeeper", `${sel.gatekeeper_name || "unknown"} ${sel.gatekeeper_role ? `(${sel.gatekeeper_role})` : ""}`],
              ["Contact route", sel.contact_route || "—"], ["Source", sel.source_url || "—"], ["Verified at", sel.verified_at || "never"],
              ["Coordinate basis", sel.coord_basis === "city" ? "city-matched (fact for pin)" : "state-level (estimate for pin)"], ["Import batch", sel.import_batch]].map(([dt, dd]) => (
              <div key={dt}><dt className="fd-label !mb-0">{dt}</dt><dd className="break-words text-white/85">{dd}</dd></div>
            ))}
          </dl>
          {sel.angle && <p className="mt-3 rounded-lg border-l-2 border-[#f4c21d] bg-black/25 px-3 py-2 text-sm">Catalogued angle: {sel.angle}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <label className="flex items-center gap-2 text-xs"><span className="fd-label !mb-0">Campaign</span>
              <select className="fd-select !w-auto !min-h-[38px]" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">select…</option>
                {me?.campaign ? <option value={me.campaign.id}>{me.campaign.name}</option> : null}
              </select>
            </label>
            <button
              type="button" className="fd-btn fd-btn--gold fd-btn--sm" disabled={!campaignId}
              onClick={async () => {
                try {
                  const r = await fdApi.post<{ added: number; skippedSuppressed: number }>(`campaigns/${campaignId}/targets`, { stationIds: [sel.id] });
                  toast(r.added ? "Added — auto-score is a RECOMMENDATION; verify contact before any send." : "Already there or suppressed.", r.added ? "ok" : "warn");
                  setSel(null);
                } catch (e) { toast("Add failed", "err"); }
              }}
            >+ Add to war room</button>
            {!me?.campaign && <span className="text-xs text-[#f5a623]">No active campaign yet — the builder comes first.</span>}
          </div>
        </Card>
      )}
    </div>
  );
}
