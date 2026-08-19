import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   SPREADSHEET SAMPLE — first page readable, rest blurs on scroll
   7 columns matching the real Vault PDF. Polished document viewer.
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
  if (d === 0) return 2.2;
  if (d === 1) return 3.4;
  if (d === 2) return 5;
  if (d === 3) return 6.6;
  if (d === 4) return 8.2;
  return Math.min(14, 8.2 + (d - 4) * 1.45);
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
      className={`group pressable relative inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] p-1 pr-1.5 text-left backdrop-blur transition-colors hover:border-white/15 hover:bg-white/[0.09] ${className}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-acid text-[18px] leading-none text-ink shadow-[0_2px_10px_rgba(255,230,0,0.35)]">
        <span aria-hidden className="translate-y-[-1px]">▦</span>
      </span>
      <span className="min-w-0 pr-1">
        <span className="block text-[12.5px] font-black uppercase leading-none tracking-[0.06em] text-white">
          Preview the actual spreadsheet
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-none text-white/55">
          10 rows free — scroll to feel the blur gate →
        </span>
      </span>
      <span className="ml-2 hidden h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors group-hover:bg-acid sm:grid">
        <span aria-hidden className="text-[14px] leading-none">↗</span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink sm:hidden">↗</span>
    </button>
  );
}

export default function SpreadsheetPreview({ onCta, onClose }: { onCta: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [atGate, setAtGate] = useState(false);

  // lock background scroll + focus + esc
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  // track scroll for subtle header shadow + hint dismissal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrolled(el.scrollTop > 4);
      setAtGate(el.scrollTop > 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#050507]/75 p-2 backdrop-blur-[10px] sm:p-3 md:p-6"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      {/* card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up flex max-h-[92dvh] w-full max-w-[1070px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0e1010] shadow-[0_20px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] max-sm:rounded-[18px]"
        style={{ animationDuration: "240ms" }}
      >
        {/* top chrome */}
        <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-white/[0.06] bg-[#131615] px-3 sm:px-4">
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#ff5f57] shadow-[0_0_0_1px_rgba(0,0,0,0.2)_inset]" />
            <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#febc2e] shadow-[0_0_0_1px_rgba(0,0,0,0.2)_inset]" />
            <span aria-hidden className="h-[11px] w-[11px] rounded-full bg-[#28c840] shadow-[0_0_0_1px_rgba(0,0,0,0.2)_inset]" />
          </div>

          <div className="ml-1 hidden min-w-0 items-center gap-2 sm:flex">
            <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-[13px] text-white/60">◫</span>
            <span className="truncate font-mono text-[12px] font-medium tracking-[-0.01em] text-white/70">
              18,000 Radio Station Contacts (2026 Version).pdf
            </span>
            <span className="hidden rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white/40 lg:inline-flex">
              free sample
            </span>
          </div>

          <div className="ml-1 flex min-w-0 items-center gap-1.5 sm:hidden">
            <span className="truncate font-mono text-[11px] font-medium text-white/65">Vault.pdf — sample</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-acid px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-ink sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/70" aria-hidden />
              {CLEAR_ROWS} rows free
            </span>
            <span className="hidden font-mono text-[11px] text-white/30 sm:inline">/ 18,000+</span>

            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close preview"
              className="pressable grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[18px] leading-none text-white/70 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* title row */}
        <div className="shrink-0 border-b border-white/[0.05] bg-[#0f1110] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id="sheet-title" className="font-display text-[17px] uppercase leading-none tracking-wide text-white sm:text-[19px]">
                Peek inside the vault <span className="text-acid">— first page free</span>
              </h2>
              <p className="mt-1.5 max-w-[56ch] font-mono text-[11.5px] leading-snug text-white/50">
                Real file, page 5 of 650. The top {CLEAR_ROWS} rows are 100% readable. Keep scrolling — the gate gets heavier every row.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/60">
                <span className="hidden sm:inline">650 pages</span>
                <span className="sm:hidden">650 pgs</span>
                <span className="h-2.5 w-px bg-white/10" aria-hidden />
                <span>2026 Edition</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              </span>
            </div>
          </div>
        </div>

        {/* sheet area */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#fcfdfc]">
          {/* subtle top shadow when scrolled */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-[10px] bg-gradient-to-b from-black/10 to-transparent transition-opacity ${scrolled ? "opacity-100" : "opacity-0"}`}
          />

          {/* scroll container */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#fcfdfc] [scrollbar-width:thin] [scrollbar-color:rgba(15,46,77,0.18)_transparent]"
            role="region"
            aria-label="Spreadsheet preview — first page readable, scroll to blur"
            tabIndex={0}
          >
            {/* horizontal fade hints */}
            <div aria-hidden className="pointer-events-none sticky left-0 right-0 top-0 z-20 hidden h-0 sm:block">
              <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#fcfdfc] to-transparent opacity-0" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#fcfdfc] to-transparent" />
            </div>

            <table className="w-full min-w-[980px] border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#0f2e4d] text-left text-[10px] font-black uppercase tracking-[0.09em] text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_4px_12px_rgba(0,0,0,0.12)]">
                  <th className="w-[56px] border-r border-white/10 px-2 py-[11px] text-center">#</th>
                  <th className="w-[56px] border-r border-white/10 px-2 py-[11px] text-center">TIER</th>
                  <th className="min-w-[186px] border-r border-white/10 px-3 py-[11px]">LOCATION</th>
                  <th className="min-w-[224px] border-r border-white/10 px-3 py-[11px]">STATION / CONTACT</th>
                  <th className="min-w-[270px] border-r border-white/10 px-3 py-[11px]">CONTACT / ROLE</th>
                  <th className="min-w-[218px] border-r border-white/10 px-3 py-[11px]">EMAIL</th>
                  <th className="min-w-[196px] px-3 py-[11px]">ROUTE</th>
                </tr>
              </thead>

              <tbody className="align-top text-[12.8px] leading-[1.45]">
                {SAMPLE_ROWS.map((row, i) => {
                  const clear = i < CLEAR_ROWS;
                  const isB2 = row.tier === "B2";
                  const blur = blurForIndex(i);

                  // readable page
                  if (clear) {
                    const stripe = isB2 ? "bg-[#fff6d5]" : i % 2 === 0 ? "bg-white" : "bg-[#f4f7f4]";
                    const hover = isB2 ? "hover:bg-[#fff1c2]" : "hover:bg-[#eef4ee]";
                    return (
                      <tr
                        key={`${row.n}-${row.email}`}
                        className={`group border-b border-[#dde6de] ${stripe} ${hover} transition-colors`}
                      >
                        <td className="border-r border-[#dde6de] px-2 py-[9px] text-center font-mono text-[11.5px] font-bold tabular-nums text-[#1a3326]">{row.n}</td>
                        <td className="border-r border-[#dde6de] px-2 py-[9px] text-center">
                          <span
                            className={`inline-flex min-w-[30px] justify-center rounded-full px-2 py-0.5 font-mono text-[10px] font-black tracking-wide ${isB2 ? "bg-amber-500 text-white shadow-[0_1px_4px_rgba(245,158,11,0.35)]" : "bg-[#0f2e4d] text-white"}`}
                          >
                            {row.tier}
                          </span>
                        </td>
                        <td className="border-r border-[#e6ece6] px-3 py-[9px] font-medium tracking-[-0.01em] text-[#1e2e22] whitespace-nowrap">{row.location}</td>
                        <td className="border-r border-[#e6ece6] px-3 py-[9px] font-semibold tracking-[-0.01em] text-[#0d1f14] whitespace-nowrap">{row.station}</td>
                        <td
                          className={`border-r border-[#e6ece6] px-3 py-[9px] ${isB2 ? "font-medium text-[#6b4a00]" : "text-[#1c3626]"}`}
                          style={{ whiteSpace: "normal", wordBreak: "break-word" }}
                        >
                          {row.role}
                        </td>
                        <td className="border-r border-[#e6ece6] px-3 py-[9px] whitespace-nowrap font-mono text-[12.5px] font-medium tracking-[-0.01em] text-[#0b4fd0] underline decoration-[#0b4fd0]/15 underline-offset-2">
                          {row.email}
                        </td>
                        <td className={`px-3 py-[9px] whitespace-nowrap ${isB2 ? "font-semibold text-[#6b4a00]" : "font-medium text-[#24382c]"}`}>{row.route}</td>
                      </tr>
                    );
                  }

                  // divider — sits right after the free page
                  if (i === CLEAR_ROWS) {
                    return (
                      <>
                        <tr key="gate-divider" className="bg-[#0f2e4d]">
                          <td colSpan={7} className="px-3 py-[8px] text-center">
                            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-acid">
                              <span aria-hidden className="h-px w-6 bg-acid/40 max-sm:hidden" />
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-acid/15 text-[11px]">↓</span>
                              Free sample ends — everything below is blurred
                              <span aria-hidden className="hidden sm:inline">— keep scrolling to feel it get heavier</span>
                              <span aria-hidden className="h-px w-6 bg-acid/40 max-sm:hidden" />
                            </span>
                          </td>
                        </tr>
                        <tr
                          key={`${row.n}-${row.email}-firstblur`}
                          aria-hidden="true"
                          className={`select-none border-b border-[#d5e0d6] ${isB2 ? "bg-[#fff1c2]" : "bg-[#eef4ef]"}`}
                          style={{ filter: `blur(${blur}px)`, opacity: 0.92 }}
                        >
                          <td className="border-r border-[#d5e0d6] px-2 py-[9px] text-center font-mono text-[11.5px] font-bold tabular-nums text-[#1a3326]">{row.n}</td>
                          <td className="border-r border-[#d5e0d6] px-2 py-[9px] text-center">
                            <span className={`inline-flex min-w-[30px] justify-center rounded-full px-2 py-0.5 font-mono text-[10px] font-black ${isB2 ? "bg-amber-500 text-white" : "bg-[#0f2e4d] text-white"}`}>{row.tier}</span>
                          </td>
                          <td className="border-r border-[#e6ece6] px-3 py-[9px] font-medium text-[#1e2e22] whitespace-nowrap">{row.location}</td>
                          <td className="border-r border-[#e6ece6] px-3 py-[9px] font-semibold text-[#0d1f14] whitespace-nowrap">{row.station}</td>
                          <td className="border-r border-[#e6ece6] px-3 py-[9px] text-[#1c3626]" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                          <td className="border-r border-[#e6ece6] px-3 py-[9px] whitespace-nowrap font-mono text-[12.5px] font-medium text-[#0b4fd0]">{row.email}</td>
                          <td className="px-3 py-[9px] whitespace-nowrap font-medium text-[#24382c]">{row.route}</td>
                        </tr>
                      </>
                    );
                  }

                  // blurred tail — heavier each row
                  const bg = isB2 ? "bg-[#fff1c2]" : i % 2 === 0 ? "bg-[#eef4ef]" : "bg-[#e6eee6]";
                  const op = Math.max(0.14, 0.9 - (i - CLEAR_ROWS) * 0.065);
                  return (
                    <tr
                      key={`${row.n}-${row.email}`}
                      aria-hidden="true"
                      className={`select-none border-b border-[#d5e0d6] ${bg}`}
                      style={{ filter: `blur(${blur}px)`, opacity: op }}
                    >
                      <td className="border-r border-[#d5e0d6] px-2 py-[9px] text-center font-mono text-[11.5px] font-bold tabular-nums text-[#1a3326]">{row.n}</td>
                      <td className="border-r border-[#d5e0d6] px-2 py-[9px] text-center">
                        <span className={`inline-flex min-w-[30px] justify-center rounded-full px-2 py-0.5 font-mono text-[10px] font-black ${isB2 ? "bg-amber-500 text-white" : "bg-[#0f2e4d] text-white"}`}>{row.tier}</span>
                      </td>
                      <td className="border-r border-[#e6ece6] px-3 py-[9px] font-medium text-[#1e2e22] whitespace-nowrap">{row.location}</td>
                      <td className="border-r border-[#e6ece6] px-3 py-[9px] font-semibold text-[#0d1f14] whitespace-nowrap">{row.station}</td>
                      <td className="border-r border-[#e6ece6] px-3 py-[9px] text-[#1c3626]" style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{row.role}</td>
                      <td className="border-r border-[#e6ece6] px-3 py-[9px] whitespace-nowrap font-mono text-[12.5px] font-medium text-[#0b4fd0]">{row.email}</td>
                      <td className="px-3 py-[9px] whitespace-nowrap font-medium text-[#24382c]">{row.route}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* bottom gate — sticky so CTA is always reachable after the blur */}
            <div className="sticky bottom-0 z-20 mt-2 border-t border-[#d5e0d6] bg-gradient-to-t from-[#0b0f0b] via-[#0b0f0b]/90 to-transparent px-3 pb-4 pt-8 sm:px-5">
              <div className="mx-auto max-w-[560px] rounded-[18px] border border-white/10 bg-[#141815] p-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.55)] sm:p-6">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[16px] text-white/80">🔒</div>
                <p className="mt-3 font-display text-[1.35rem] uppercase leading-none tracking-wide text-white">
                  That&apos;s the <span className="text-acid">first page</span>
                </p>
                <p className="mx-auto mt-2 max-w-[34ch] text-pretty font-mono text-[11.5px] leading-relaxed text-white/55">
                  650 pages · 18k+ rows · same 7 columns, all verified. The blur only gets heavier from here.
                </p>
                <button
                  type="button"
                  onClick={onCta}
                  className="cta mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-acid px-6 py-3 font-display text-[15px] uppercase tracking-wide text-ink shadow-[0_6px_20px_rgba(255,230,0,0.22)] sm:text-[16px]"
                >
                  Unlock all 18,000+ — $20
                  <span aria-hidden className="text-[14px]">→</span>
                </button>
                <p className="mt-2 font-mono text-[11px] leading-none text-white/35">Instant PDF download • 30-day refund • no subscription</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="tap-sm mx-auto mt-1.5 inline-flex text-[12px] font-medium text-white/45 underline decoration-white/15 underline-offset-4 hover:text-white/75 hover:decoration-white/30"
                >
                  Keep browsing the page
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#dfe8df] bg-[#f3f7f3] px-3 py-2 font-mono text-[10px] tracking-[-0.01em] text-[#5f7260]">
              <span className="truncate pr-3">18,000 Radio Station Contacts (2026 Version) — free sample preview</span>
              <span className="shrink-0 tabular-nums">Page 5 of 650</span>
            </div>
          </div>

          {/* floating scroll cue — auto-hides after you scroll */}
          <div
            aria-hidden
            className={`pointer-events-none absolute bottom-[148px] left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border bg-white px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-all sm:flex ${atGate ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"} border-[#0f2e4d]/10`}
          >
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#0f2e4d]">Scroll — blur increases ↓</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0f2e4d] text-[11px] text-white">↕</span>
          </div>

          {/* horizontal hint on mobile */}
          <div className="pointer-events-none absolute bottom-[88px] right-3 z-20 flex items-center gap-1 rounded-full bg-[#0f2e4d] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] sm:hidden">
            <span>↔ scroll table</span>
          </div>
        </div>
      </div>
    </div>
  );
}
