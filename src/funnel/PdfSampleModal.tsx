import { useEffect, useRef, useState } from "react";

export interface ContactEntry {
  city: string;
  station: string;
  frequency: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  format: string;
  notes: string;
}

export const SAMPLE_CONTACTS: ContactEntry[] = [
  {
    city: "Chicago, IL",
    station: "WGCI-FM",
    frequency: "107.5 FM",
    name: "Derrick Monroe",
    title: "Music Director",
    email: "d.monroe@wgci.com",
    phone: "(312) 555-0144",
    format: "Hip-Hop / R&B",
    notes: "Accepts digital EPK; weekly music meetings Monday mornings",
  },
  {
    city: "Austin, TX",
    station: "KUTX",
    frequency: "98.9 FM",
    name: "Shelby Harmon",
    title: "Program Director",
    email: "sharmon@kutx.org",
    phone: "(512) 555-0192",
    format: "Indie / AAA / Eclectic",
    notes: "Prefers streaming links (SoundCloud/Bandcamp); local act focus",
  },
  {
    city: "Atlanta, GA",
    station: "WRAS-FM",
    frequency: "88.5 FM",
    name: "Marcus Webb",
    title: "Music Director",
    email: "m.webb@wras.gsu.edu",
    phone: "(404) 555-0173",
    format: "College / Alternative",
    notes: "College specialty shows; open submission window",
  },
  {
    city: "Nashville, TN",
    station: "Lightning 100",
    frequency: "100.1 FM",
    name: "Cara Finley",
    title: "Prog. Director",
    email: "cara@lightning100.com",
    phone: "(615) 555-0118",
    format: "AAA / Indie Rock",
    notes: "Local Sunday night spotlight; accepts WAV links + 1-sheet",
  },
  {
    city: "Portland, OR",
    station: "KEXP",
    frequency: "90.3 FM",
    name: "Tanya Okonkwo",
    title: "Music Director",
    email: "t.okonkwo@kexp.org",
    phone: "(206) 555-0182",
    format: "Non-Comm Indie / Variety",
    notes: "Active champion of DIY acts; rotation adds updated weekly",
  },
  {
    city: "Detroit, MI",
    station: "WDET",
    frequency: "101.9 FM",
    name: "Jerome Hill",
    title: "Program Director",
    email: "jhill@wdet.org",
    phone: "(313) 555-0165",
    format: "Public / Eclectic / Soul",
    notes: "Midwest regional focus; short bio + clean streaming link",
  },
  {
    city: "Miami, FL",
    station: "WLRN",
    frequency: "91.3 FM",
    name: "Lisette Prado",
    title: "Music Director",
    email: "lprado@wlrn.org",
    phone: "(305) 555-0139",
    format: "Public / Jazz / World",
    notes: "Evening specialty blocks; bilingual crossover submissions",
  },
  {
    city: "Denver, CO",
    station: "KVCU Radio 1190",
    frequency: "1190 AM",
    name: "Blake Sorrento",
    title: "Prog. Director",
    email: "bsorrento@kvcu.edu",
    phone: "(303) 555-0127",
    format: "College Indie / Punk",
    notes: "NACC reporting station; reviews digital tracks on Fridays",
  },
  {
    city: "Brooklyn, NY",
    station: "BRIC Arts Radio",
    frequency: "Online / DAB",
    name: "Zoe Achterberg",
    title: "Music Director",
    email: "z.achterberg@bricmedia.org",
    phone: "(718) 555-0188",
    format: "Community Arts / Indie",
    notes: "Features emerging artists; live in-studio session booking",
  },
  {
    city: "Los Angeles, CA",
    station: "KCRW",
    frequency: "89.9 FM",
    name: "Travis Nguyen",
    title: "Music Director",
    email: "tnguyen@kcrw.com",
    phone: "(310) 555-0150",
    format: "Triple-A / Eclectic",
    notes: "Morning Becomes Eclectic team; include lyrics + bio",
  },
  {
    city: "Seattle, WA",
    station: "KBCS",
    frequency: "91.3 FM",
    name: "Amara Diallo",
    title: "Program Director",
    email: "adiallo@kbcs.fm",
    phone: "(425) 555-0199",
    format: "Community / Roots / World",
    notes: "Volunteer DJ rotation; open specialty submission queue",
  },
  {
    city: "New Orleans, LA",
    station: "WWOZ",
    frequency: "90.7 FM",
    name: "Celeste Boudreau",
    title: "Music Director",
    email: "cboudreau@wwoz.org",
    phone: "(504) 555-0141",
    format: "Jazz / Blues / Roots",
    notes: "Gulf Coast roots / funk / brass; accepts direct MP3/WAV links",
  },
];

const BLURRED_PAGE_SECTIONS = [
  {
    page: 2,
    section: "SECTION 02: CALIFORNIA & PACIFIC NORTHWEST",
    subtitle: "Los Angeles, San Francisco, San Diego, Sacramento, Seattle, Portland",
    stats: "2,410 verified contacts · 48 pages",
    sampleRows: [
      ["Los Angeles, CA", "KROQ 106.7", "Dave Richards", "Operations Mgr", "d.richards@audacy.com", "(323) 555-0120", "Alternative Rock"],
      ["San Francisco, CA", "KPOO 89.5", "Marcus Harrison", "Music Director", "submissions@kpoo.com", "(415) 555-0184", "Urban / Community"],
      ["San Diego, CA", "KBZT 94.9", "Karen Ortiz", "Prog Director", "kortiz@audacy.com", "(619) 555-0193", "Alt / Indie"],
      ["Sacramento, CA", "KDVS 90.3", "Liam Chang", "Music Director", "music@kdvs.org", "(530) 555-0111", "Freeform College"],
      ["San Jose, CA", "KSJS 90.5", "Erica Vance", "Program Director", "pd@ksjs.org", "(408) 555-0177", "College / Specialty"],
      ["Portland, OR", "OPB Music", "Brian Palmer", "Content Director", "bpalmer@opb.org", "(503) 555-0138", "Public / Indie AAA"],
      ["Seattle, WA", "KNDD 107.7", "Leslie Adams", "Program Director", "ladams@audacy.com", "(206) 555-0162", "Alternative"],
      ["Eugene, OR", "KWVA 88.1", "Tarek Mansour", "Music Director", "music@kwva.uoregon.edu", "(541) 555-0149", "College / Rock"],
    ],
  },
  {
    page: 3,
    section: "SECTION 03: TEXAS, SOUTHEAST & GULF COAST",
    subtitle: "Dallas, Houston, Austin, San Antonio, Atlanta, Nashville, Miami, New Orleans",
    stats: "3,120 verified contacts · 52 pages",
    sampleRows: [
      ["Dallas, TX", "KXT 91.7", "Amy Miller", "Program Director", "amiller@kera.org", "(214) 555-0115", "Triple-A"],
      ["Houston, TX", "KPFT 90.1", "Robert Daniels", "Music Director", "rdaniels@kpft.org", "(713) 555-0182", "Community / Roots"],
      ["San Antonio, TX", "KRTU 91.7", "JJ Lopez", "General Manager", "jjlopez@trinity.edu", "(210) 555-0144", "Jazz / Indie Night"],
      ["Atlanta, GA", "WABE 90.1", "Gabriel Scott", "Music Coordinator", "gscott@wabe.org", "(404) 555-0177", "NPR / Arts"],
      ["Nashville, TN", "WNXP 91.1", "Jason Moon Wilkins", "Program Director", "jwilkins@wnxp.org", "(615) 555-0130", "Nashville Indie AAA"],
      ["Charlotte, NC", "WEND 106.5", "Chuck Taylor", "Prog Director", "ctaylor@iheartmedia.com", "(704) 555-0196", "Alt Rock"],
      ["Orlando, FL", "WPRK 91.5", "Nadia Ramos", "Music Director", "wprkmusic@rollins.edu", "(407) 555-0158", "College / Freeform"],
      ["Tampa, FL", "WMNF 88.5", "Randy Wynne", "Program Director", "randy@wmnf.org", "(813) 555-0125", "Community / Americana"],
    ],
  },
  {
    page: 4,
    section: "SECTION 04: NORTHEAST & MID-ATLANTIC",
    subtitle: "New York City, Boston, Philadelphia, Washington DC, Baltimore, Pittsburgh",
    stats: "2,890 verified contacts · 46 pages",
    sampleRows: [
      ["New York, NY", "WFUV 90.7", "Rita Houston", "Music Director", "rhouston@wfuv.org", "(718) 555-0110", "Public / AAA"],
      ["Philadelphia, PA", "WXPN 88.5", "Bruce Warren", "Assistant GM / Prog", "bruce@xpn.org", "(215) 555-0148", "Adult Album Alt"],
      ["Boston, MA", "WERS 88.9", "Ken West", "Program Director", "kwest@wers.org", "(617) 555-0185", "College / AAA"],
      ["Washington, DC", "WPFW 89.3", "Katea Stitt", "Program Director", "kstitt@wpfw.org", "(202) 555-0133", "Jazz / Justice"],
      ["Baltimore, MD", "WTMD 89.7", "Scott Mullins", "Program Director", "smullins@wtmd.org", "(410) 555-0174", "Total Music AAA"],
      ["Pittsburgh, PA", "WYEP 91.3", "Liz Felix", "Program Director", "liz@wyep.org", "(412) 555-0190", "Indie / Singer-Songwriter"],
      ["Providence, RI", "WBRU Online", "Tyler Reed", "Music Director", "treed@wbru.com", "(401) 555-0122", "Modern Rock / Hip-Hop"],
      ["Hartford, CT", "WWUH 91.3", "John Ramsey", "General Manager", "gm@wwuh.org", "(860) 555-0166", "Public Alternative"],
    ],
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCta: () => void;
};

export default function PdfSampleModal({ isOpen, onClose, onCta }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [scrolledIntoLocked, setScrolledIntoLocked] = useState(false);
  const [lockPulse, setLockPulse] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap / keyboard escape handler
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle scroll inside PDF document viewer to detect scrolling past page 1
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    // Page 1 is roughly 650-800px tall depending on zoom
    if (scrollTop > 380) {
      setScrolledIntoLocked(true);
      const estPage = Math.min(412, Math.max(1, Math.floor(scrollTop / 550) + 1));
      setCurrentPage(estPage);
    } else {
      setScrolledIntoLocked(false);
      setCurrentPage(1);
    }
  };

  const handleCopy = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard?.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {}
  };

  const handleLockedClick = () => {
    setLockPulse(true);
    setTimeout(() => setLockPulse(false), 800);
    // Smooth scroll down to lock card if not fully visible
    const el = scrollContainerRef.current;
    if (el && el.scrollTop < 420) {
      el.scrollTo({ top: 480, behavior: "smooth" });
    }
  };

  const handleUnlockClick = () => {
    onClose();
    onCta();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes lockShake {
          0%, 100% { transform: scale(1); }
          20%, 60% { transform: scale(1.03) rotate(-1deg); }
          40%, 80% { transform: scale(1.03) rotate(1deg); }
        }
      `}</style>

      {/* TOP PDF VIEWER TOOLBAR (Adobe / Chrome PDF Style) */}
      <header className="shrink-0 border-b border-white/10 bg-[#15171c] px-3 py-2 text-white sm:px-5 sm:py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          {/* File Name & Badges */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-red-600 font-bold text-xs text-white shadow-sm">
              PDF
            </span>
            <div className="min-w-0">
              <h2
                id="pdf-viewer-title"
                className="truncate font-mono text-xs font-bold text-white sm:text-sm"
              >
                RadioReach_Vault_2026_Master_Directory.pdf
              </h2>
              <p className="hidden truncate text-[10px] text-white/50 sm:block">
                412 Pages · 18,000+ Contacts · Sample Extract (Page 1 Free)
              </p>
            </div>
          </div>

          {/* Page Counter & Controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Page indicator */}
            <div className="flex items-center gap-1 rounded bg-black/50 px-2 py-1 font-mono text-xs text-white/80 border border-white/10">
              <span>Page</span>
              <span className="font-bold text-acid">{currentPage}</span>
              <span className="text-white/40">/ 412</span>
            </div>

            {/* Zoom Controls */}
            <div className="hidden items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 border border-white/10 md:flex">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(80, z - 10))}
                className="px-1.5 py-0.5 text-xs text-white/70 hover:text-white"
                title="Zoom Out"
              >
                −
              </button>
              <span className="font-mono text-[11px] text-white/60 w-9 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="px-1.5 py-0.5 text-xs text-white/70 hover:text-white"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Header Unlock CTA */}
            <button
              type="button"
              onClick={handleUnlockClick}
              className="cta hidden sm:inline-flex items-center gap-1.5 rounded-md bg-acid px-3 py-1.5 font-display text-xs uppercase tracking-wider text-ink hover:brightness-110"
            >
              <span>🔒 Unlock 412 Pages · $20</span>
            </button>

            {/* Close Button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close PDF Viewer"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DOCUMENT VIEWPORT (Interactive Scrollable Viewer) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto overflow-x-auto bg-[#2b2d35] p-3 sm:p-6 md:p-8"
        tabIndex={0}
      >
        <div
          className="mx-auto flex flex-col items-center gap-8 transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoom / 100})`, width: "100%", maxWidth: "860px" }}
        >
          {/* ================= PAGE 1 (FREE SAMPLE — 100% UNLOCKED) ================= */}
          <div className="relative w-full rounded-sm bg-white text-[#1a1f2c] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.1)] p-5 sm:p-8 md:p-10 font-sans border-t-8 border-acid">
            {/* Page 1 Header Banner */}
            <div className="border-b-2 border-[#1a1f2c] pb-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded bg-[#1a1f2c] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-acid">
                    <span>RADIOREACH VAULT</span>
                    <span>•</span>
                    <span>2026 MASTER DIRECTORY</span>
                  </div>
                  <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight text-[#0f141e] sm:text-3xl">
                    18,000 Radio Station Contacts
                  </h1>
                  <p className="text-xs font-semibold text-[#4a5568]">
                    U.S. Commercial, Public & College Stations · Music Directors & Program Directors
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded border border-green-600 bg-green-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">
                    ✓ Sample Page (Unlocked)
                  </span>
                  <p className="mt-1 font-mono text-[10px] text-[#718096]">
                    Page 1 of 412 · 2026 Edition
                  </p>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="mt-3.5 flex items-center justify-between gap-3 rounded bg-[#f7fafc] border border-[#e2e8f0] px-3 py-2 text-[11px] text-[#4a5568]">
                <span>
                  <b>Section 01: Top Major & Regional Markets</b> — Direct deliverable contacts for independent artist promotion.
                </span>
                <span className="shrink-0 font-mono text-[10px] text-green-700 font-bold">
                  12 Sample Rows Shown
                </span>
              </div>
            </div>

            {/* PAGE 1 TABLE OF ACTUAL CONTACTS */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left text-[11px] sm:text-xs">
                <thead>
                  <tr className="border-b-2 border-[#cbd5e1] bg-[#edf2f7] text-[10px] font-black uppercase tracking-wider text-[#2d3748]">
                    <th scope="col" className="p-2 w-8 text-center text-[#718096]">#</th>
                    <th scope="col" className="p-2">City / Market</th>
                    <th scope="col" className="p-2">Station & Freq</th>
                    <th scope="col" className="p-2">Decision-Maker</th>
                    <th scope="col" className="p-2">Role</th>
                    <th scope="col" className="p-2">Direct Email</th>
                    <th scope="col" className="p-2">Direct Phone</th>
                    <th scope="col" className="p-2 hidden md:table-cell">Format</th>
                    <th scope="col" className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {SAMPLE_CONTACTS.map((c, i) => (
                    <tr
                      key={c.email}
                      className={`hover:bg-amber-50/60 transition ${i % 2 === 1 ? "bg-[#f8fafc]" : "bg-white"}`}
                    >
                      <td className="p-2 text-center font-mono text-[10px] text-[#a0aec0]">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="p-2 font-semibold text-[#1a202c]">
                        {c.city}
                      </td>
                      <td className="p-2">
                        <span className="font-bold text-[#0f172a]">{c.station}</span>
                        <span className="block text-[10px] text-[#64748b]">{c.frequency}</span>
                      </td>
                      <td className="p-2 font-bold text-green-800">
                        {c.name}
                      </td>
                      <td className="p-2 text-[#475569]">
                        <span className="inline-block rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#334155]">
                          {c.title}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[11px] text-[#0369a1]">
                        {c.email}
                      </td>
                      <td className="p-2 font-mono text-[11px] text-[#166534]">
                        {c.phone}
                      </td>
                      <td className="p-2 text-[10px] text-[#475569] hidden md:table-cell">
                        {c.format}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleCopy(c.email, e)}
                          title="Copy Email"
                          className="rounded bg-[#f1f5f9] hover:bg-acid hover:text-ink px-2 py-1 font-mono text-[10px] font-bold text-[#334155] border border-[#cbd5e1] transition"
                        >
                          {copiedEmail === c.email ? "✓ Copied" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Page 1 Bottom Footer Bar */}
            <div className="mt-5 flex items-center justify-between border-t border-[#e2e8f0] pt-3 text-[10px] text-[#718096]">
              <span className="font-mono">RadioReach Vault · 2026 Directory Edition</span>
              <span className="font-bold uppercase tracking-wider text-amber-700">
                ↓ Scroll to preview locked directory pages
              </span>
              <span className="font-mono font-bold text-[#1a202c]">Page 1 / 412</span>
            </div>
          </div>

          {/* ================= LOCKED & BLURRED PAGES (PAGES 2–412) ================= */}
          <div
            className="relative w-full cursor-pointer select-none"
            onClick={handleLockedClick}
          >
            {/* FLOATING / EMBEDDED UNLOCK PAYWALL CARD */}
            <div
              className={`sticky top-8 z-30 mx-auto -mb-32 max-w-xl rounded-2xl border-2 border-acid bg-[#0f1117]/95 p-6 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all sm:p-8 ${
                lockPulse ? "animate-[lockShake_0.6s_ease-in-out]" : ""
              }`}
            >
              {/* Lock Badge */}
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-2 border-acid bg-acid/15 text-2xl shadow-[0_0_20px_rgba(234,255,0,0.3)]">
                🔒
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-acid/20 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-acid">
                PAGES 2–412 LOCKED
              </span>

              <h3 className="mt-3 font-display text-2xl uppercase leading-tight sm:text-3xl">
                Unlock All <span className="text-acid">18,000+ Contacts</span>
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/70 sm:text-sm">
                You're previewing Page 1 (Sample). The full 400+ page PDF directory contains 18,000+ verified radio station contacts across all 50 states, sorted city by city.
              </p>

              {/* Feature Pills */}
              <div className="my-4 grid grid-cols-2 gap-2 text-left text-[11px] sm:text-xs">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
                  <span className="text-acid font-bold">✓</span>
                  <span>412-Page Complete PDF</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
                  <span className="text-acid font-bold">✓</span>
                  <span>10,372 Direct Named Emails</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
                  <span className="text-acid font-bold">✓</span>
                  <span>City-Sorted Spreadsheets</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2">
                  <span className="text-acid font-bold">✓</span>
                  <span>30-Day Money-Back Guarantee</span>
                </div>
              </div>

              {/* Price & Primary CTA Button */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-white/40 line-through font-bold">Normally $55</span>
                  <span className="font-display text-3xl font-black text-acid">$20</span>
                  <span className="text-xs font-bold text-white/70">One-Time · Instant Access</span>
                </div>

                <button
                  type="button"
                  onClick={handleUnlockClick}
                  className="cta mt-2 w-full rounded-xl bg-acid px-6 py-4 font-display text-lg uppercase tracking-wide text-ink hover:scale-[1.02] active:scale-[0.98] transition shadow-[0_6px_25px_rgba(234,255,0,0.35)]"
                >
                  Unlock Full PDF Directory Now — $20 →
                </button>

                <p className="mt-1 text-[11px] text-white/50">
                  Instant download after secure checkout · No subscriptions · Lifetime file access
                </p>
              </div>
            </div>

            {/* BLURRED PAGES STREAM (Pages 2, 3, 4) */}
            <div className="space-y-8 opacity-75">
              {BLURRED_PAGE_SECTIONS.map((section) => (
                <div
                  key={section.page}
                  className="relative rounded-sm bg-white p-5 sm:p-8 md:p-10 font-sans shadow-md"
                  style={{ filter: "blur(6px)", pointerEvents: "none" }}
                  aria-hidden="true"
                >
                  {/* Fake Page Header */}
                  <div className="border-b-2 border-[#1a1f2c] pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-[#1a1f2c] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-acid">
                          RADIOREACH VAULT 2026
                        </span>
                        <h4 className="mt-1 font-display text-xl font-bold text-[#0f141e]">
                          {section.section}
                        </h4>
                        <p className="text-xs text-[#4a5568]">{section.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                          🔒 LOCKED
                        </span>
                        <p className="mt-1 font-mono text-[10px] text-[#718096]">
                          Page {section.page} of 412
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fake Page Rows */}
                  <div className="mt-4">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#cbd5e1] bg-[#edf2f7] text-[10px] uppercase font-bold text-[#475569]">
                          <th className="p-2">City / Market</th>
                          <th className="p-2">Station</th>
                          <th className="p-2">Contact Name</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Format</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.sampleRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-[#e2e8f0]">
                            <td className="p-2 font-semibold">{row[0]}</td>
                            <td className="p-2 font-bold">{row[1]}</td>
                            <td className="p-2 text-green-800">{row[2]}</td>
                            <td className="p-2">{row[3]}</td>
                            <td className="p-2 font-mono text-blue-700">{row[4]}</td>
                            <td className="p-2 font-mono">{row[5]}</td>
                            <td className="p-2">{row[6]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Fake Page Footer */}
                  <div className="mt-4 flex justify-between border-t border-[#e2e8f0] pt-2 text-[10px] text-[#718096]">
                    <span>RadioReach Vault Directory · Confidential Data</span>
                    <span>Page {section.page} / 412</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM UNLOCK BAR */}
      <footer className="shrink-0 border-t border-white/10 bg-[#121318] px-4 py-2.5 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-acid animate-pulse" />
            <span className="text-xs font-bold text-white/90">
              {scrolledIntoLocked ? "Viewing Locked Pages (2–412)" : "Viewing Page 1 Sample"}
            </span>
            <span className="hidden text-xs text-white/50 sm:inline">
              · Complete 412-page PDF unlocked immediately after purchase
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-white/60 hover:text-white transition"
            >
              Close Viewer
            </button>
            <button
              type="button"
              onClick={handleUnlockClick}
              className="cta rounded-lg bg-acid px-4 py-2 font-display text-xs uppercase tracking-wider text-ink hover:brightness-110 shadow-md"
            >
              Get Full Access ($20) →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
