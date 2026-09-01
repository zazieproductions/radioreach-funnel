/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — app shell
   ─────────────────────────────────────────────────────────────
   Mounted only by experiments/darkfunnel/index.html, which is a
   separate Vite entry that `npm run build` never touches. This
   code cannot reach the production bundle: nothing in src/App.tsx
   imports it, and there is no route to it on the live site.

   The shell adds three things the replica itself would never
   have: a standing disclosure strip, the x-ray toggle, and the
   pattern inspector.
───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from "react";
import Checkout from "./pages/Checkout";
import Downsell from "./pages/Downsell";
import Hook from "./pages/Hook";
import Oto from "./pages/Oto";
import Qualify from "./pages/Qualify";
import Reveal from "./pages/Reveal";
import Teardown from "./pages/Teardown";
import ThankYou from "./pages/ThankYou";
import { PATTERNS_BY_ID, RISK_COLOR, RISK_LABEL } from "./annotations";
import { STAGE_NAME, useRoute, type Route } from "./router";
import { FunnelProvider, useFunnel } from "./state";
import { useInspectListener } from "./xray";

const SCREENS: Record<Route, () => React.ReactElement> = {
  "/hook": Hook,
  "/reveal": Reveal,
  "/qualify": Qualify,
  "/checkout": Checkout,
  "/oto": Oto,
  "/downsell": Downsell,
  "/thanks": ThankYou,
  "/teardown": Teardown,
};

export default function DarkFunnelApp() {
  return (
    <FunnelProvider>
      <Shell />
    </FunnelProvider>
  );
}

function Shell() {
  const [route, go] = useRoute();
  const Screen = SCREENS[route];

  return (
    <>
      <DisclosureBar route={route} go={go} />
      <main>
        <Screen />
      </main>
      <Inspector />
    </>
  );
}

/* ── the strip the real thing would never have ──────────── */

function DisclosureBar({ route, go }: { route: Route; go: (r: Route) => void }) {
  const { teardown, setTeardown, reset, exposures } = useFunnel();
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // The replica's own scarcity rail is also sticky. Publish this bar's
  // height so the rail can stick *below* the disclosure instead of
  // sliding underneath it — the honest layer always stays visible.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        "--df-bar-h",
        `${el.offsetHeight}px`,
      );
    };
    publish();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(publish);
      ro.observe(el);
    }
    window.addEventListener("resize", publish);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, [open]);

  const stages: Route[] = [
    "/hook",
    "/reveal",
    "/qualify",
    "/checkout",
    "/oto",
    "/downsell",
    "/thanks",
    "/teardown",
  ];

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-[80] border-b border-xray/25 bg-[#04101a]"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-xray">
          <span className="h-1.5 w-1.5 rounded-full bg-xray df-pulse" />
          Research replica
        </span>
        <span className="hidden font-mono text-[10px] text-white/35 sm:inline">
          nothing is for sale · no payment path exists · not deployed
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden font-mono text-[10px] text-white/30 md:inline">
            {exposures.length} patterns seen
          </span>
          <button
            type="button"
            onClick={() => setTeardown(!teardown)}
            className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition ${
              teardown
                ? "bg-xray text-[#04141a]"
                : "border border-xray/40 text-xray hover:bg-xray/10"
            }`}
            title="Toggle the annotation overlay (keyboard: x)"
          >
            {teardown ? "X-ray on" : "X-ray"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-white/60 hover:text-white"
          >
            {STAGE_NAME[route]} ▾
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#04101a]">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-1.5 px-3 py-2">
            {stages.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  go(s);
                  setOpen(false);
                }}
                className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition ${
                  route === s
                    ? "bg-white text-ink"
                    : "border border-white/12 text-white/55 hover:text-white"
                }`}
              >
                {i < 7 ? `${i + 1} · ` : ""}
                {STAGE_NAME[s]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                reset();
                go("/hook");
                setOpen(false);
              }}
              className="rounded border border-blood/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-blood hover:bg-blood/10"
            >
              Reset session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── the inspector ──────────────────────────────────────── */

function Inspector() {
  const [id, setId] = useState<string | null>(null);
  useInspectListener(useCallback((next: string) => setId(next), []));

  if (!id) return null;
  const p = PATTERNS_BY_ID[id];
  if (!p) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/60"
      onClick={() => setId(null)}
    >
      <aside
        className="df-rise h-full w-full max-w-md overflow-y-auto border-l border-xray/30 bg-[#06121a] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
              {p.stage}
            </p>
            <h2 className="mt-1 font-display text-2xl uppercase leading-none text-white">
              {p.label}
            </h2>
            <p className="mt-1.5 font-mono text-[11px] text-xray">{p.principle}</p>
          </div>
          <button
            type="button"
            onClick={() => setId(null)}
            aria-label="Close inspector"
            className="rounded px-2 py-1 text-white/45 hover:text-white"
          >
            ✕
          </button>
        </div>

        <span
          className="mt-4 inline-block rounded-sm px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink"
          style={{ background: RISK_COLOR[p.risk] }}
        >
          {RISK_LABEL[p.risk]}
        </span>

        <Section title="How it works">{p.mechanism}</Section>
        <Section title="What it extracts">{p.cost}</Section>
        <Section title="Reading">{p.citation}</Section>

        <p className="mt-6 border-t border-white/10 pt-3 font-mono text-[10px] leading-relaxed text-white/25">
          Press <kbd className="text-xray">x</kbd> to toggle the overlay on the
          live page and watch this element work while you read the note.
        </p>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
        {title}
      </h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-white/75">{children}</p>
    </section>
  );
}
