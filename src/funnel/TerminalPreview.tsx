import { useEffect, useState } from "react";

const ROWS = [
  { city: "Chicago, IL",       station: "WGCI-FM",         name: "Derrick Monroe",   title: "Music Director",   email: "d.monroe@wgci.com" },
  { city: "Austin, TX",        station: "KUTX 98.9",       name: "Shelby Harmon",    title: "Program Director", email: "sharmon@kutx.org" },
  { city: "Atlanta, GA",       station: "WRAS-FM",         name: "Marcus Webb",      title: "Music Director",   email: "m.webb@wras.gsu.edu" },
  { city: "Nashville, TN",     station: "Lightning 100",   name: "Cara Finley",      title: "Prog. Director",   email: "cara@lightning100.com" },
  { city: "Portland, OR",      station: "KEXP 90.3",       name: "Tanya Okonkwo",    title: "Music Director",   email: "t.okonkwo@kexp.org" },
  { city: "Detroit, MI",       station: "WDET 101.9",      name: "Jerome Hill",      title: "Program Director", email: "jhill@wdet.org" },
  { city: "Miami, FL",         station: "WLRN 91.3",       name: "Lisette Prado",    title: "Music Director",   email: "lprado@wlrn.org" },
  { city: "Denver, CO",        station: "KVCU Radio 1190", name: "Blake Sorrento",   title: "Prog. Director",   email: "bsorrento@kvcu.edu" },
  { city: "Brooklyn, NY",      station: "BRIC Arts Radio", name: "Zoe Achterberg",   title: "Music Director",   email: "z.achterberg@bricmedia.org" },
  { city: "Los Angeles, CA",   station: "KCRW 89.9",       name: "Travis Nguyen",    title: "Music Director",   email: "tnguyen@kcrw.com" },
  { city: "Seattle, WA",       station: "KBCS 91.3",       name: "Amara Diallo",     title: "Program Director", email: "adiallo@kbcs.fm" },
  { city: "New Orleans, LA",   station: "WWOZ 90.7",       name: "Celeste Boudreau", title: "Music Director",   email: "cboudreau@wwoz.org" },
];

const VISIBLE = 7;

export default function TerminalPreview({
  onCta,
  onOpenPdf,
}: {
  onCta: () => void;
  onOpenPdf?: () => void;
}) {
  const [typed, setTyped] = useState(0);

  // Progressive reveal. No scrollIntoView; the page never moves on its own.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(VISIBLE);
      return;
    }
    if (typed >= VISIBLE) return;
    const t = setTimeout(() => setTyped((v) => v + 1), typed === 0 ? 260 : 150);
    return () => clearTimeout(t);
  }, [typed]);

  const Cell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <td className={`whitespace-nowrap px-3 py-2 ${className}`}>{children}</td>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0f0b]">
      {/* chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#111411] px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 truncate font-mono text-[11px] tracking-wide text-white/35">
          radio_reach_vault.csv
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] text-green-400/70">18,000+ rows</span>
      </div>

      {/* prompt */}
      <p className="border-b border-white/5 px-4 py-2 font-mono text-[11px] text-green-400/70">
        <span className="text-white/25">$ </span>head -7 radio_reach_vault.csv
      </p>

      {/* table; scrolls inside itself, never the page */}
      <div className="scroll-x" role="region" aria-label="Scrollable contact sample" tabIndex={0}>
        <table className="w-full min-w-[540px] font-mono text-[12px] sm:min-w-[560px]">
          <caption className="sr-only">
            Sample of 7 radio station contacts from the 18,000+-entry database
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-[#0d110d] text-left">
              <th scope="col" className="w-12 px-3 py-2 text-[10px] tracking-widest text-white/20">#</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">CITY</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">STATION</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">CONTACT</th>
              <th scope="col" className="hidden px-3 py-2 text-[10px] tracking-widest text-green-400/60 sm:table-cell">ROLE</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">EMAIL</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.slice(0, typed).map((row, i) => (
              <tr key={row.email} className={`fade-up border-b border-white/5 ${i % 2 ? "bg-[#0d120d]" : ""}`}>
                <Cell className="tnum text-white/20">{String(i + 1).padStart(4, "0")}</Cell>
                <Cell className="text-white/50">{row.city}</Cell>
                <Cell className="text-white/70">{row.station}</Cell>
                <Cell className="text-green-300">{row.name}</Cell>
                <Cell className="hidden text-white/50 sm:table-cell">{row.title}</Cell>
                <Cell className="text-acid/90">{row.email}</Cell>
              </tr>
            ))}

            {typed >= VISIBLE &&
              ROWS.slice(VISIBLE).map((row, i) => (
                <tr
                  key={row.email}
                  aria-hidden
                  className={`border-b border-white/5 select-none ${i % 2 ? "bg-[#0d120d]" : ""}`}
                  style={{ filter: "blur(4px)", opacity: 0.4 }}
                >
                  <Cell className="tnum text-white/20">{String(VISIBLE + i + 1).padStart(4, "0")}</Cell>
                  <Cell className="text-white/50">{row.city}</Cell>
                  <Cell className="text-white/70">{row.station}</Cell>
                  <Cell className="text-green-300">{row.name}</Cell>
                  <Cell className="hidden text-white/50 sm:table-cell">{row.title}</Cell>
                  <Cell className="text-acid/90">{row.email}</Cell>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-white/5 px-4 py-1.5 text-right font-mono text-[9px] uppercase tracking-wider text-white/30 sm:hidden">
        Swipe table to explore →
      </p>

      {/* unlock gate; in flow, so it can never overlap content */}
      <div className="border-t border-white/10 bg-[#0b0f0b] px-3 py-4 text-center sm:px-4 sm:py-5">
        <p className="tnum font-mono text-[11px] tracking-wide text-green-400/60">
          <span className="text-white/30">showing</span> 7 / 18,000+
          <span className="ml-2 text-acid">· rest locked</span>
        </p>

        <p className="mt-3 font-display text-[1.15rem] uppercase leading-tight sm:text-2xl">
          Unlock the remaining <span className="text-acid">18,000+ contacts</span>
        </p>
        <p className="mt-1 font-mono text-[11px] leading-snug text-white/50 sm:text-[12px]">
          Organized by station, location, role, phone, and email
        </p>

        <div className="mt-4 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCta}
            className="cta min-h-12 w-full rounded-lg bg-acid px-5 py-3 font-display text-base uppercase tracking-wide text-ink sm:w-auto sm:px-7 sm:text-lg"
          >
            Get full access; $25
          </button>
          {onOpenPdf && (
            <button
              type="button"
              onClick={onOpenPdf}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 font-mono text-xs font-bold text-white/85 transition hover:border-acid hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <span>📄</span>
              <span>Preview 400+ Page PDF Sample →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
