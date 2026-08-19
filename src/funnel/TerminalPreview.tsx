import { useEffect, useState } from "react";

// STRUCTURAL PREVIEW - deliberately contains no real person.
//
// This block previously listed invented individuals ("Music Director" names)
// against real call signs (WGCI, KUTX, KEXP...) with plausible real-domain
// email addresses. That fabricates contacts, implies an affiliation with
// stations that does not exist, and would be read by both buyers and AI
// retrieval systems as a factual claim about who works where.
//
// It now shows the SHAPE of a row - the fields, the role vocabulary, the
// geographic spread and the email-pattern format - which is what a buyer
// actually needs to evaluate before purchase. Roles and cities are real
// categories used in the file; the contact column shows the field format,
// not a named human. The crawlable structural sample lives at /sample/.
const ROWS = [
  { city: "Chicago, IL",     station: "Commercial · Urban AC",     title: "Music Director",     email: "first.last@ station domain" },
  { city: "Austin, TX",      station: "Public · AAA",              title: "Program Director",   email: "initial+last@ station domain" },
  { city: "Atlanta, GA",     station: "College · Alternative",     title: "Music Director",     email: "music@ station domain" },
  { city: "Nashville, TN",   station: "Independent · AAA",         title: "Program Director",   email: "first@ station domain" },
  { city: "Portland, OR",    station: "Public · Eclectic",         title: "Music Director",     email: "first.last@ station domain" },
  { city: "Detroit, MI",     station: "Public · Triple A",         title: "Program Director",   email: "programming@ station domain" },
  { city: "Miami, FL",       station: "Public · Jazz/Latin",       title: "Music Director",     email: "first.last@ station domain" },
  { city: "Denver, CO",      station: "College · Freeform",        title: "Program Director",   email: "gm@ station domain" },
  { city: "Brooklyn, NY",    station: "Community · Arts",          title: "Music Director",     email: "music@ station domain" },
  { city: "Los Angeles, CA", station: "Public · Eclectic",         title: "Music Director",     email: "first.last@ station domain" },
  { city: "Seattle, WA",     station: "Community · Variety",       title: "Program Director",   email: "info@ station domain" },
  { city: "New Orleans, LA", station: "Community · Jazz/Heritage", title: "Music Director",     email: "first@ station domain" },
];

const VISIBLE = 7;

export default function TerminalPreview({ onCta }: { onCta: () => void }) {
  const [typed, setTyped] = useState(0);

  // Progressive reveal. No scrollIntoView — the page never moves on its own.
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
        <span className="text-white/25">$ </span>head -7 radio_reach_vault.csv --fields-only
      </p>

      {/* table — scrolls inside itself, never the page */}
      <div className="scroll-x" role="region" aria-label="Scrollable contact sample" tabIndex={0}>
        <table className="w-full min-w-[540px] font-mono text-[12px] sm:min-w-[560px]">
          <caption className="sr-only">
            Structural preview showing the fields in each row: market, station type, contact role and email format. No individual contact details are shown before purchase.
          </caption>
          <thead>
            <tr className="border-b border-white/10 bg-[#0d110d] text-left">
              <th scope="col" className="w-12 px-3 py-2 text-[10px] tracking-widest text-white/20">#</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">CITY</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">STATION TYPE</th>
              <th scope="col" className="hidden px-3 py-2 text-[10px] tracking-widest text-green-400/60 sm:table-cell">ROLE</th>
              <th scope="col" className="px-3 py-2 text-[10px] tracking-widest text-green-400/60">EMAIL</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.slice(0, typed).map((row, i) => (
              <tr key={`${row.city}-${i}`} className={`fade-up border-b border-white/5 ${i % 2 ? "bg-[#0d120d]" : ""}`}>
                <Cell className="tnum text-white/20">{String(i + 1).padStart(4, "0")}</Cell>
                <Cell className="text-white/50">{row.city}</Cell>
                <Cell className="text-green-300">{row.station}</Cell>
                <Cell className="hidden text-white/50 sm:table-cell">{row.title}</Cell>
                <Cell className="text-acid/90">{row.email}</Cell>
              </tr>
            ))}

            {typed >= VISIBLE &&
              ROWS.slice(VISIBLE).map((row, i) => (
                <tr
                  key={`${row.city}-locked-${i}`}
                  aria-hidden
                  className={`border-b border-white/5 select-none ${i % 2 ? "bg-[#0d120d]" : ""}`}
                  style={{ filter: "blur(4px)", opacity: 0.4 }}
                >
                  <Cell className="tnum text-white/20">{String(VISIBLE + i + 1).padStart(4, "0")}</Cell>
                  <Cell className="text-white/50">{row.city}</Cell>
                  <Cell className="text-green-300">{row.station}</Cell>
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

      {/* unlock gate — in flow, so it can never overlap content */}
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
        <p className="mx-auto mt-2 max-w-md font-mono text-[10px] leading-snug text-white/35">
          Preview shows row structure only - names and addresses are not
          displayed before purchase. RadioReach is not affiliated with any
          station listed and does not guarantee airplay.
        </p>

        <button
          type="button"
          onClick={onCta}
          className="cta mt-4 min-h-14 w-full rounded-lg bg-acid px-5 py-3.5 font-display text-base uppercase tracking-wide text-ink sm:w-auto sm:px-7 sm:py-4 sm:text-lg"
        >
          Get full access — $20
        </button>
      </div>
    </div>
  );
}
