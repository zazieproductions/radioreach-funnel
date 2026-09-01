/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — the annotation layer
   ─────────────────────────────────────────────────────────────
   The bit that makes this a research artifact instead of a
   working scam.

   <Annotated pattern="prechecked_bump"> wraps any element. With
   X-ray mode off it is a transparent passthrough — the funnel
   runs exactly as a real one would, because a funnel you can see
   through doesn't teach you anything about being inside one.

   Toggle X-ray (the ⌥/Alt+X key, or the header switch) and every
   wrapped element gets a dashed outline, a family-coloured tag,
   and a click target that opens the full research card:
   mechanic, psychology, citation, legal exposure, honest
   rewrite.
───────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  FAMILY_LABELS,
  PATTERNS_BY_ID,
  type Pattern,
  type PatternFamily,
} from "./annotations";

type XrayCtx = {
  on: boolean;
  toggle: () => void;
  open: (id: string) => void;
  active: string | null;
  close: () => void;
};

const Ctx = createContext<XrayCtx>({
  on: false,
  toggle: () => {},
  open: () => {},
  active: null,
  close: () => {},
});

export const FAMILY_COLOR: Record<PatternFamily, string> = {
  attention: "#8b5cf6",
  commitment: "#e01b24",
  scarcity: "#f97316",
  social: "#22d3ee",
  friction: "#ec4899",
  checkout: "#ffe600",
  post_purchase: "#4ade80",
};

const XRAY_KEY = "study.xray";

export function XrayProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(() => {
    try {
      return sessionStorage.getItem(XRAY_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [active, setActive] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setOn((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(XRAY_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Alt+X anywhere flips the lens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "x" || e.key === "X" || e.code === "KeyX")) {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo(
    () => ({
      on,
      toggle,
      open: (id: string) => setActive(id),
      active,
      close: () => setActive(null),
    }),
    [on, toggle, active]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <PatternCard />
    </Ctx.Provider>
  );
}

export function useXray() {
  return useContext(Ctx);
}

/* ─────────────────────────────────────────────────────────── */

export function Annotated({
  pattern,
  children,
  className = "",
  as: Tag = "div",
}: {
  pattern: string;
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const { on, open } = useXray();
  const meta = PATTERNS_BY_ID[pattern];

  if (!on || !meta) {
    return <Tag className={className}>{children}</Tag>;
  }

  const color = FAMILY_COLOR[meta.family];

  return (
    <Tag
      className={`relative ${className}`}
      style={{
        outline: `1px dashed ${color}`,
        outlineOffset: "3px",
        borderRadius: "6px",
      }}
      data-study-pattern={pattern}
    >
      <button
        type="button"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          open(pattern);
        }}
        title={`${meta.label} — severity ${meta.severity}/5`}
        className="absolute -top-2 right-1 z-30 !min-h-0 !min-w-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase leading-none tracking-wider shadow-lg"
        style={{ background: color, color: "#08080a" }}
      >
        {meta.label}
      </button>
      {children}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────── */

function Row({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-white/10 pt-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">{body}</p>
    </div>
  );
}

export function SeverityDots({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Severity ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= n ? "bg-blood" : "bg-white/15"}`}
        />
      ))}
    </span>
  );
}

export function PatternBody({ meta }: { meta: Pattern }) {
  return (
    <div className="space-y-3">
      <Row title="Mechanic" body={meta.mechanic} />
      <Row title="Why it works" body={meta.psychology} />
      <Row title="Evidence" body={meta.evidence} />
      <Row title="Legal / platform exposure" body={meta.exposure} />
      <div className="rounded-lg border border-green-400/25 bg-green-400/5 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-green-400">
          The honest version
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">
          {meta.honestVersion}
        </p>
      </div>
    </div>
  );
}

function PatternCard() {
  const { active, close } = useXray();
  if (!active) return null;
  const meta = PATTERNS_BY_ID[active];
  if (!meta) return null;
  const color = FAMILY_COLOR[meta.family];

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={meta.label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/15 bg-panel p-5 shadow-[0_30px_90px_rgba(0,0,0,0.85)] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
              style={{ background: color, color: "#08080a" }}
            >
              {FAMILY_LABELS[meta.family]}
            </span>
            <h3 className="mt-2 font-display text-2xl leading-tight">{meta.label}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <SeverityDots n={meta.severity} />
              <span className="text-[10px] uppercase tracking-wider text-white/35">
                severity {meta.severity}/5
              </span>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="shrink-0 rounded-full border border-white/15 px-2 text-white/50"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <PatternBody meta={meta} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

/** The always-present header switch. */
export function XrayToggle() {
  const { on, toggle } = useXray();
  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
        on
          ? "border-acid bg-acid text-ink"
          : "border-white/20 bg-white/5 text-white/60 hover:text-white"
      }`}
      title="Alt + X"
    >
      {on ? "X-ray on" : "X-ray off"}
    </button>
  );
}
