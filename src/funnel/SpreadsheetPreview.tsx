import { useEffect, useRef, useState } from "react";

type Tier = "A0" | "B2";
type Row = {
  n: number;
  tier: Tier;
  location: string;
  station: string;
  role: string;
  email: string;
  route: string;
};

const SAMPLE_ROWS: Row[] = [
  { n: 1656, tier: "A0", location: "CO / Fort Collins / United States", station: "KCSU 90.5 FM", role: "Local music submissions", email: "local@kcsufm.com", route: "Music submission" },
  { n: 1657, tier: "A0", location: "CO / Fort Collins / United States", station: "KCSU 90.5 FM", role: "Music submissions", email: "music@kcsufm.com", route: "Music submission" },
  { n: 1706, tier: "A0", location: "CO / Greeley / United States", station: "KJAC 105.5 FM / The Colorado Sound", role: "Music submissions", email: "music@coloradosound.org", route: "Music submission" },
  { n: 1761, tier: "A0", location: "CO / Salida / United States", station: "KHEN-LP 106.9 FM", role: "The Mail-In Mix / music submissions - Zakk Byers", email: "playmymusic@khen.org", route: "Music submission" },
  { n: 1882, tier: "A0", location: "CT / New London / United States", station: "WCNI 90.9 FM", role: "Music Director", email: "wcnimusdir@gmail.com", route: "Music submission" },
  { n: 1931, tier: "A0", location: "DC / Washington / United States", station: "WEE Nation Radio", role: "Music submissions - Devin Walker", email: "music@weenationradio.com", route: "Music submission" },
  { n: 1997, tier: "A0", location: "FL / United States", station: "US 41 Radio", role: "Music submissions", email: "us41onair@gmail.com", route: "Official music submission route" },
  { n: 1998, tier: "A0", location: "FL / United States", station: "WebNetRadio Smooth Jazz Network", role: "Music submissions - Doug", email: "doug@webnetradio.com", route: "Official music submission route" },
  { n: 2001, tier: "B2", location: "FL / United States", station: "College / independent radio listing", role: "DJ, music, programming, or station contact", email: "music@wvfs.fsu.edu", route: "College / independent" },
  { n: 2407, tier: "A0", location: "FL / Winter Park / United States", station: "WPRK / Voice of Rollins College", role: "Music Director - Lilli Duong", email: "wprkmusic@rollins.edu", route: "Music / artist outreach" },
  { n: 2408, tier: "A0", location: "FL / Winter Park / United States", station: "WPRK / Voice of Rollins College", role: "Programming Director - Brandon Schuman", email: "wprkprogramming@rollins.edu", route: "Music / artist outreach" },
  { n: 2423, tier: "A0", location: "GA / Athens / United States", station: "WUOG 90.5 FM", role: "Music Directors", email: "tempugamd@gmail.com", route: "Current music/programming route" },
  { n: 2429, tier: "A0", location: "GA / Atlanta / United States", station: "Di-VerZe Hitz Radio", role: "Music submissions and airplay inquiries", email: "info@diverzeent.com", route: "Official music submission route" },
  { n: 2430, tier: "A0", location: "GA / Atlanta / United States", station: "WREK 91.1 FM", role: "Music Director", email: "music.director@wrek.org", route: "Music submission" },
  { n: 2587, tier: "A0", location: "GA / Milledgeville / United States", station: "WSTY 89.3 The Star FM", role: "Music Director / Programming / Digital music submissions", email: "programming@thestarfm.com", route: "Music submission" },
  { n: 2726, tier: "A0", location: "IA / Cedar Falls / United States", station: "Iowa Public Radio - Studio One", role: "Artist submissions / Studio One", email: "studioone@iowapublicradio.org", route: "Music submission" },
  { n: 2948, tier: "A0", location: "ID / Boise / United States", station: "Radio Boise KRBX 89.9 / 93.5 FM", role: "Music Submissions", email: "music@radioboise.org", route: "Current music/programming route" },
  { n: 2994, tier: "A0", location: "ID / Moscow / United States", station: "KRFP / Radio Free Moscow", role: "Music Director - Bex McBee", email: "musicdirector@krfp.org", route: "Music / artist outreach" },
  { n: 3044, tier: "B2", location: "IL / United States", station: "College / independent radio listing", role: "DJ, music, programming, or station contact", email: "blues@weft.org", route: "College / independent" },
  { n: 3086, tier: "A0", location: "IL / Carbondale / United States", station: "WDBX Community Radio for Southern Illinois", role: "Music submissions / Music Director", email: "musicdirector@wdbx.org", route: "Music / artist outreach" },
  { n: 3105, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Ambient / experimental Genre Director", email: "experimental@weft.org", route: "Official music submission route" },
  { n: 3106, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Folk, country, and bluegrass music contact - Kevin Elliott", email: "folk@weft.org", route: "Music submission" },
  { n: 3107, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Gospel Genre Director mailbox", email: "gospel@weft.org", route: "Official music submission route" },
];

const CLEAR_ROWS = 10;

function blurForIndex(i: number) {
  if (i < CLEAR_ROWS) return 0;
  const d = i - CLEAR_ROWS;
  // minimal, natural progression
  return Math.min(12, 1.6 + d * 1.35);
}

export function SpreadsheetPreviewButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/85 hover:bg-white/[0.07] hover:text-white hover:border-white/20 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
      Preview spreadsheet
      <span aria-hidden className="text-white/30">·</span>
      <span className="font-mono text-[11px] tracking-wide text-white/50">10 rows free</span>
      <span aria-hidden className="ml-0.5 text-[12px] leading-none text-white/40">→</span>
    </button>
  );
}

export default function SpreadsheetPreview({ onCta, onClose }: { onCta: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[3px] sm:p-6"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Spreadsheet free sample"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
      >
        {/* minimal header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-4">
          <div className="min-w-0">
            <p className="truncate font-mono text-[12px] font-medium tracking-[-0.01em] text-zinc-800">
              18,000 Radio Station Contacts — <span className="text-zinc-500">free sample</span>
            </p>
            <p className="hidden font-mono text-[11px] leading-none text-zinc-400 sm:block">Page 5 of 650 · first {CLEAR_ROWS} rows readable</p>
          </div>
          <div className="ml-3 flex items-center gap-2">
            <span className="hidden rounded-full bg-zinc-900 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white sm:inline-flex">10 free</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="pressable grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span aria-hidden className="text-[18px] leading-none">×</span>
            </button>
          </div>
        </div>

        {/* scroll area */}
        <div className="min-h-0 flex-1 overflow-auto bg-white">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0f2e4d] text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-white/95">
                <th className="w-[52px] px-2.5 py-2.5 text-center font-semibold">#</th>
                <th className="w-[48px] px-2 py-2.5 text-center font-semibold">TIER</th>
                <th className="px-3 py-2.5 font-semibold">LOCATION</th>
                <th className="px-3 py-2.5 font-semibold">STATION / CONTACT</th>
                <th className="px-3 py-2.5 font-semibold">CONTACT / ROLE</th>
                <th className="px-3 py-2.5 font-semibold">EMAIL</th>
                <th className="px-3 py-2.5 font-semibold">ROUTE</th>
              </tr>
            </thead>
            <tbody className="text-[12.5px] leading-[1.45]">
              {SAMPLE_ROWS.map((row, i) => {
                const clear = i < CLEAR_ROWS;
                const isB2 = row.tier === "B2";
                const blur = blurForIndex(i);

                if (clear) {
                  const stripe = isB2 ? "bg-[#fff8d6]" : i % 2 === 0 ? "bg-white" : "bg-zinc-50/70";
                  return (
                    <tr key={row.n} className={`border-b border-black/[0.06] ${stripe}`}>
                      <td className="px-2.5 py-2 text-center font-mono text-[11.5px] text-zinc-600 tabular-nums">{row.n}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-flex min-w-[26px] justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${isB2 ? "bg-amber-500 text-white" : "bg-zinc-900 text-white"}`}>
                          {row.tier}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-700 whitespace-nowrap">{row.location}</td>
                      <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{row.station}</td>
                      <td className="px-3 py-2 text-zinc-700" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                      <td className="px-3 py-2 font-mono text-[12px] text-[#0b4fd0] whitespace-nowrap">{row.email}</td>
                      <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{row.route}</td>
                    </tr>
                  );
                }

                if (i === CLEAR_ROWS) {
                  return (
                    <>
                      <tr key="divider" className="bg-zinc-50">
                        <td colSpan={7} className="border-y border-black/5 bg-zinc-50 px-3 py-2 text-center font-mono text-[11px] text-zinc-400">
                          — Free sample ends — remaining rows blurred —
                        </td>
                      </tr>
                      <tr key={`${row.n}-b`} aria-hidden className={`border-b border-black/[0.04] ${isB2 ? "bg-[#fff8d6]" : "bg-white"} select-none`} style={{ filter: `blur(${blur}px)`, opacity: 0.9 }}>
                        <td className="px-2.5 py-2 text-center font-mono text-[11.5px] text-zinc-600 tabular-nums">{row.n}</td>
                        <td className="px-2 py-2 text-center"><span className={`inline-flex min-w-[26px] justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${isB2 ? "bg-amber-500 text-white" : "bg-zinc-900 text-white"}`}>{row.tier}</span></td>
                        <td className="px-3 py-2 text-zinc-700 whitespace-nowrap">{row.location}</td>
                        <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{row.station}</td>
                        <td className="px-3 py-2 text-zinc-700" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                        <td className="px-3 py-2 font-mono text-[12px] text-[#0b4fd0] whitespace-nowrap">{row.email}</td>
                        <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{row.route}</td>
                      </tr>
                    </>
                  );
                }

                const op = Math.max(0.18, 0.92 - (i - CLEAR_ROWS) * 0.07);
                return (
                  <tr key={row.n} aria-hidden className={`border-b border-black/[0.04] bg-white select-none`} style={{ filter: `blur(${blur}px)`, opacity: op }}>
                    <td className="px-2.5 py-2 text-center font-mono text-[11.5px] text-zinc-600 tabular-nums">{row.n}</td>
                    <td className="px-2 py-2 text-center"><span className={`inline-flex min-w-[26px] justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${isB2 ? "bg-amber-500 text-white" : "bg-zinc-900 text-white"}`}>{row.tier}</span></td>
                    <td className="px-3 py-2 text-zinc-700 whitespace-nowrap">{row.location}</td>
                    <td className="px-3 py-2 font-medium text-zinc-900 whitespace-nowrap">{row.station}</td>
                    <td className="px-3 py-2 text-zinc-700" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-[#0b4fd0] whitespace-nowrap">{row.email}</td>
                    <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{row.route}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* minimal gate footer — not sticky, just at end */}
          <div className="border-t border-black/5 bg-zinc-50 px-4 py-6 text-center sm:py-7">
            <p className="font-display text-[1.1rem] uppercase tracking-wide text-zinc-900">More inside the vault</p>
            <p className="mx-auto mt-1 max-w-[32ch] font-mono text-[11.5px] leading-relaxed text-zinc-500">18,000+ contacts across 650 pages — same columns, fully readable.</p>
            <button type="button" onClick={onCta} className="cta mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-acid px-6 py-2.5 font-display text-[13px] uppercase tracking-wide text-ink">
              Unlock all — $20
            </button>
            <div className="mt-2 font-mono text-[11px] text-zinc-400">Instant download · 30-day refund</div>
            <button type="button" onClick={() => setOpen(false)} className="tap-sm mt-2 text-[12px] text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-800">
              Close preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
