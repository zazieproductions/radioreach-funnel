import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   SPREADSHEET SAMPLE — first page readable, rest blurs on scroll
   7 columns matching the real Vault PDF
────────────────────────────────────────────────────────────── */

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
  // gate starts here
  { n: 2408, tier: "A0", location: "FL / Winter Park / United States", station: "WPRK / Voice of Rollins College", role: "Programming Director - Brandon Schuman", email: "wprkprogramming@rollins.edu", route: "Music / artist outreach" },
  { n: 2423, tier: "A0", location: "GA / Athens / United States", station: "WUOG 90.5 FM", role: "Music Directors", email: "tempugamd@gmail.com", route: "Current music/programming route" },
  { n: 2429, tier: "A0", location: "GA / Atlanta / United States", station: "Di-VerZe Hitz Radio", role: "Music submissions and airplay inquiries", email: "info@diverzeent.com", route: "Official music submission route" },
  { n: 2430, tier: "A0", location: "GA / Atlanta / United States", station: "WREK 91.1 FM", role: "Music Director", email: "music.director@wrek.org", route: "Music submission" },
  { n: 2587, tier: "A0", location: "GA / Milledgeville / United States", station: "WSTY 89.3 The Star FM", role: "Music Director / Programming / Digital music submissions - Programming Department", email: "programming@thestarfm.com", route: "Music submission" },
  { n: 2726, tier: "A0", location: "IA / Cedar Falls / United States", station: "Iowa Public Radio - Studio One", role: "Artist submissions / Studio One", email: "studioone@iowapublicradio.org", route: "Music submission" },
  { n: 2948, tier: "A0", location: "ID / Boise / United States", station: "Radio Boise KRBX 89.9 / 93.5 FM", role: "Music Submissions", email: "music@radioboise.org", route: "Current music/programming route" },
  { n: 2994, tier: "A0", location: "ID / Moscow / United States", station: "KRFP / Radio Free Moscow", role: "Music Director - Bex McBee", email: "musicdirector@krfp.org", route: "Music / artist outreach" },
  { n: 3044, tier: "B2", location: "IL / United States", station: "College / independent radio listing", role: "DJ, music, programming, or station contact", email: "blues@weft.org", route: "College / independent" },
  { n: 3086, tier: "A0", location: "IL / Carbondale / United States", station: "WDBX Community Radio for Southern Illinois", role: "Music submissions / Music Director", email: "musicdirector@wdbx.org", route: "Music / artist outreach" },
  { n: 3105, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Ambient / experimental Genre Director", email: "experimental@weft.org", route: "Official music submission route" },
  { n: 3106, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Folk, country, and bluegrass music contact - Kevin Elliott", email: "folk@weft.org", route: "Music submission" },
  { n: 3107, tier: "A0", location: "IL / Champaign / United States", station: "WEFT 90.1 FM", role: "Gospel Genre Director mailbox", email: "gospel@weft.org", route: "Official music submission route" },
  { n: 3154, tier: "A0", location: "AL / Birmingham / United States", station: "WAYE-AM", role: "News Director / Program Director", email: "wayepd@bellsouth.net", route: "U.S. station" },
  { n: 3156, tier: "A0", location: "AL / Birmingham / United States", station: "WATV 900 AM", role: "Program Director - Tony Curry", email: "tony@watv900.com", route: "Music submission" },
  { n: 3181, tier: "A0", location: "AL / Montgomery / United States", station: "WVAS 90.7 FM", role: "Music Director", email: "wvasmusic@alasu.edu", route: "Music submission" },
  { n: 3204, tier: "B2", location: "AL / United States", station: "College / independent radio listing", role: "Station manager / music contact", email: "music@troy.edu", route: "College / independent" },
];

const CLEAR_ROWS = 10;

function blurForIndex(i: number): number {
  if (i < CLEAR_ROWS) return 0;
  const d = i - CLEAR_ROWS;
  // gentle at top of gate, heavy at bottom — so user SEES the progression
  if (d === 0) return 2;
  if (d === 1) return 3.2;
  if (d === 2) return 4.8;
  if (d === 3) return 6.2;
  if (d === 4) return 8;
  return Math.min(13, 8 + (d - 4) * 1.4);
}

export function SpreadsheetPreviewButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-acid/40 bg-black/60 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-acid hover:border-acid hover:bg-acid/10 sm:text-[13px] ${className}`}
    >
      <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md border border-acid/50 bg-acid/15 text-sm leading-none">
        ⇥
      </span>
      Click to preview the actual spreadsheet
    </button>
  );
}

export default function SpreadsheetPreview({ onCta, onClose }: { onCta: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[80] grid place-items-center bg-[#050507]/82 p-2 backdrop-blur-[4px] sm:p-4"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-[1060px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e0b] shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
      >
        {/* chrome */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#141814] px-3 py-2.5 sm:px-4">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 truncate font-mono text-[11px] tracking-wide text-white/45">
            18,000 Radio Station Contacts (2026 Version).pdf — free sample
          </span>
          <span className="ml-auto hidden shrink-0 rounded-full bg-[#1a241c] px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-acid sm:inline-flex">
            FIRST {CLEAR_ROWS} ROWS READABLE
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="pressable -mr-1 grid h-8 w-8 place-items-center rounded-full text-lg text-white/55 hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>

        {/* title */}
        <div className="shrink-0 border-b border-white/5 bg-[#0f1210] px-3 py-3 sm:px-4">
          <h2 id="sheet-title" className="font-display text-[1.1rem] uppercase leading-none text-white sm:text-[1.2rem]">
            Live sheet sample — <span className="text-acid">first page unlocked</span>
          </h2>
          <p className="mt-1 font-mono text-[11px] leading-snug text-white/50">
            This is the real file, page 5 of 650. The top {CLEAR_ROWS} rows are crystal clear — scroll and watch the rest melt.
          </p>
        </div>

        {/* sheet */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#f7faf7]">
          {/* horizontal + vertical scroll */}
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain" role="region" aria-label="Spreadsheet sample — first page readable, scroll for blurred rows" tabIndex={0}>
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0f2e4d] text-left text-[10px] font-black uppercase tracking-[0.085em] text-white">
                  <th className="w-[54px] border-r border-white/10 px-2 py-[10px] text-center">#</th>
                  <th className="w-[52px] border-r border-white/10 px-2 py-[10px] text-center">TIER</th>
                  <th className="min-w-[185px] border-r border-white/10 px-3 py-[10px]">LOCATION</th>
                  <th className="min-w-[220px] border-r border-white/10 px-3 py-[10px]">STATION / CONTACT</th>
                  <th className="min-w-[265px] border-r border-white/10 px-3 py-[10px]">CONTACT / ROLE</th>
                  <th className="min-w-[215px] border-r border-white/10 px-3 py-[10px]">EMAIL</th>
                  <th className="min-w-[200px] px-3 py-[10px]">ROUTE</th>
                </tr>
              </thead>

              <tbody className="align-top text-[13px] leading-[1.4]">
                {SAMPLE_ROWS.map((row, i) => {
                  const clear = i < CLEAR_ROWS;
                  const isB2 = row.tier === "B2";
                  const blur = blurForIndex(i);

                  // Clear rows: pure white, high-contrast, no blur ever
                  if (clear) {
                    const bg = isB2 ? "bg-[#fff6d5]" : i % 2 === 0 ? "bg-white" : "bg-[#f3f8f3]";
                    return (
                      <tr key={`${row.n}-${row.email}`} className={`border-b border-[#d8e4d8] ${bg}`}>
                        <td className="border-r border-[#d8e4d8] px-2 py-[8px] text-center font-mono text-[12px] font-bold text-[#122a1c]">{row.n}</td>
                        <td className="border-r border-[#d8e4d8] px-2 py-[8px] text-center">
                          <span className={`inline-flex min-w-[30px] justify-center rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-black tracking-wide ${isB2 ? "bg-amber-500 text-white" : "bg-[#0f2e4d] text-white"}`}>
                            {row.tier}
                          </span>
                        </td>
                        <td className="border-r border-[#dbe6db] px-3 py-[8px] font-medium text-[#14261c] whitespace-nowrap">{row.location}</td>
                        <td className="border-r border-[#dbe6db] px-3 py-[8px] font-bold text-[#0b1d12] whitespace-nowrap">{row.station}</td>
                        <td className={`border-r border-[#dbe6db] px-3 py-[8px] ${isB2 ? "text-[#6b4a00] font-medium" : "text-[#1a3424]"}`} style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                          {row.role}
                        </td>
                        <td className="border-r border-[#dbe6db] px-3 py-[8px] font-mono text-[12.5px] font-medium text-[#0b4fd8] whitespace-nowrap underline decoration-[#0b4fd8]/20 underline-offset-2">
                          {row.email}
                        </td>
                        <td className={`px-3 py-[8px] whitespace-nowrap ${isB2 ? "text-[#6b4a00] font-semibold" : "text-[#1f3a2a] font-medium"}`}>{row.route}</td>
                      </tr>
                    );
                  }

                  // divider row — always sharp, marks the gate
                  if (i === CLEAR_ROWS) {
                    return (
                      <>
                        <tr key="gate-divider" className="bg-[#0f2e4d]">
                          <td colSpan={7} className="px-3 py-[7px] text-center font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-acid">
                            ↓ Free sample ends — everything below is blurred — keep scrolling to feel the gate ↓
                          </td>
                        </tr>
                        <tr
                          key={`${row.n}-${row.email}-blurred`}
                          aria-hidden="true"
                          className={`border-b border-[#cfe0d6] ${isB2 ? "bg-[#fff1c0]" : "bg-[#eef5ef]"}`}
                          style={{
                            filter: `blur(${blur}px)`,
                            opacity: 0.9,
                          }}
                        >
                          <td className="border-r border-[#cfe0d6] px-2 py-[8px] text-center font-mono text-[12px] font-bold text-[#122a1c]">{row.n}</td>
                          <td className="border-r border-[#cfe0d6] px-2 py-[8px] text-center">
                            <span className={`inline-flex min-w-[30px] justify-center rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-black ${isB2 ? "bg-amber-500 text-white" : "bg-[#0f2e4d] text-white"}`}>{row.tier}</span>
                          </td>
                          <td className="border-r border-[#dbe6db] px-3 py-[8px] font-medium text-[#14261c] whitespace-nowrap">{row.location}</td>
                          <td className="border-r border-[#dbe6db] px-3 py-[8px] font-bold text-[#0b1d12] whitespace-nowrap">{row.station}</td>
                          <td className="border-r border-[#dbe6db] px-3 py-[8px] text-[#1a3424]" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                          <td className="border-r border-[#dbe6db] px-3 py-[8px] font-mono text-[12.5px] font-medium text-[#0b4fd8] whitespace-nowrap">{row.email}</td>
                          <td className="px-3 py-[8px] whitespace-nowrap text-[#1f3a2a] font-medium">{row.route}</td>
                        </tr>
                      </>
                    );
                  }

                  // Blurred rows — progressively heavier
                  const bg = isB2 ? "bg-[#fff1c0]" : i % 2 === 0 ? "bg-[#eef5ef]" : "bg-[#e6f0eb]";
                  const op = Math.max(0.16, 0.92 - (i - CLEAR_ROWS) * 0.062);
                  return (
                    <tr
                      key={`${row.n}-${row.email}`}
                      aria-hidden="true"
                      className={`border-b border-[#cfe0d6] ${bg} select-none`}
                      style={{
                        filter: `blur(${blur}px)`,
                        opacity: op,
                      }}
                    >
                      <td className="border-r border-[#cfe0d6] px-2 py-[8px] text-center font-mono text-[12px] font-bold text-[#122a1c]">{row.n}</td>
                      <td className="border-r border-[#cfe0d6] px-2 py-[8px] text-center">
                        <span className={`inline-flex min-w-[30px] justify-center rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-black ${isB2 ? "bg-amber-500 text-white" : "bg-[#0f2e4d] text-white"}`}>{row.tier}</span>
                      </td>
                      <td className="border-r border-[#dbe6db] px-3 py-[8px] font-medium text-[#14261c] whitespace-nowrap">{row.location}</td>
                      <td className="border-r border-[#dbe6db] px-3 py-[8px] font-bold text-[#0b1d12] whitespace-nowrap">{row.station}</td>
                      <td className="border-r border-[#dbe6db] px-3 py-[8px] text-[#1a3424]" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                      <td className="border-r border-[#dbe6db] px-3 py-[8px] font-mono text-[12.5px] font-medium text-[#0b4fd8] whitespace-nowrap">{row.email}</td>
                      <td className="px-3 py-[8px] whitespace-nowrap text-[#1f3a2a] font-medium">{row.route}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* gate card — sits at bottom of scroll, not covering readable rows */}
            <div className="sticky bottom-0 z-10 mt-0 border-t border-[#cfe0d6] bg-gradient-to-t from-[#0b0e0b] via-[#0b0e0b]/92 to-transparent px-4 pb-5 pt-10 sm:px-6">
              <div className="mx-auto max-w-[520px] rounded-2xl border border-white/10 bg-[#101412] p-5 text-center shadow-[0_16px_48px_rgba(0,0,0,0.55)] sm:p-6">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/40 text-[18px]">🔒</div>
                <p className="mt-3 font-display text-[1.3rem] uppercase leading-none text-white">
                  That&apos;s the <span className="text-acid">first page</span>
                </p>
                <p className="mx-auto mt-2 max-w-[36ch] font-mono text-[11px] leading-relaxed text-white/55">
                  650 pages total — same 7 columns, same verified contacts. The blur gets
                  heavier every row you scroll.
                </p>
                <button type="button" onClick={onCta} className="cta mt-4 min-h-14 w-full rounded-lg bg-acid px-5 py-3.5 font-display text-[15px] uppercase tracking-wide text-ink sm:text-base">
                  Unlock all 18,000+ — $20
                </button>
                <p className="mt-2 font-mono text-[11px] text-white/35">Instant PDF download · 30-day refund</p>
                <button type="button" onClick={() => setOpen(false)} className="tap-sm mt-1 text-[12px] text-white/45 underline underline-offset-4 hover:text-white/75">
                  No thanks, keep browsing
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#d1ded1] bg-[#eef5ef] px-3 py-1.5 font-mono text-[10px] text-[#5a6f62]">
              <span>18,000 Radio Station Contacts (2026 Version) — free sample preview</span>
              <span className="tabular-nums">Page 5 of 650</span>
            </div>
          </div>

          {/* scroll hint — always visible */}
          <div className="pointer-events-none absolute bottom-[152px] left-1/2 z-20 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#0f2e4d]/15 bg-white px-3 py-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.12)] sm:flex">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#0f2e4d]">Scroll for blur gate →</span>
            <span className="text-[12px] text-[#0f2e4d]">↕</span>
          </div>
        </div>
      </div>
    </div>
  );
}
