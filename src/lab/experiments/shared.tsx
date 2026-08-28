/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — prototype primitives
   ─────────────────────────────────────────────────────────────
   Every prototype lives inside a <LabFrame>: a dark card with the
   experiment's title, a variant switcher, and a live event badge.
   The frame renders in the gallery (#/lab) — nothing here touches
   the production funnel.

   Variant resolution order:
     1. QA switcher (this session, persisted in sessionStorage)
     2. URL override   ?lab=<experiment>:<variant>
     3. Deterministic assignment (visitor bucketing)
     4. control
───────────────────────────────────────────────────────────── */

import { useSyncExternalStore } from "react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LabPrinciple } from "../types";
import { PRINCIPLE_LABELS } from "../catalog";
import {
  assignVariant,
  getVisitorId,
} from "../core";
import {
  getStoredEvents,
  labLog,
  labLogAction,
  labLogConversion,
  registerExperiment,
  subscribeLab,
} from "../log";
import { readLabFlag } from "../flag";

/* — variant resolution hook — */

const QA_KEY = "lab.qa.variants.v1";

function loadQaVariants(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(QA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveQaVariants(next: Record<string, string>) {
  try {
    sessionStorage.setItem(QA_KEY, JSON.stringify(next));
  } catch {
    /* best effort */
  }
}

export function useLabVariant(experiment: string, variants: readonly string[]): [string, (v: string) => void] {
  const flag = useMemo(() => readLabFlag(), []);
  // Callers pass inline array literals, so effects must key on the
  // joined string — otherwise a new array identity every render
  // would re-fire the logging effect and loop forever.
  const variantsKey = variants.join("|");
  const assigned = useMemo(
    () =>
      flag.overrides[experiment] ??
      assignVariant(experiment, getVisitorId(), variants),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [experiment, variantsKey, flag.overrides[experiment]]
  );
  const [qa, setQa] = useState<string | null>(() => loadQaVariants()[experiment] ?? null);
  const variant = qa ?? assigned;

  useEffect(() => {
    registerExperiment(experiment, variants);
    labLog(experiment, variant, "assignment", { source: qa ? "qa" : "bucket" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment, variant, variantsKey]);

  useEffect(() => {
    labLog(experiment, variant, "exposure", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiment, variant]);

  const setVariant = (next: string) => {
    if (!variants.includes(next)) return;
    const all = loadQaVariants();
    all[experiment] = next;
    saveQaVariants(all);
    setQa(next);
    labLog(experiment, next, "variant_switch", { from: variant });
  };

  return [variant, setVariant];
}

/* — live event counter for the frame badge — */

export function useLabEventCount(experiment?: string): number {
  return useSyncExternalStore(
    (cb) => subscribeLab(() => cb()),
    () => {
      let count = 0;
      for (const e of getStoredEvents()) {
        if (!experiment || e.experiment === experiment) count++;
      }
      return count;
    }
  );
}

/* — frame chrome — */

export function LabFrame({
  experiment,
  title,
  principles,
  variants,
  children,
  footer,
}: {
  experiment: string;
  title: string;
  principles: LabPrinciple[];
  variants: readonly string[];
  children: (variant: string) => ReactNode;
  footer?: ReactNode;
}) {
  const [variant, setVariant] = useLabVariant(experiment, variants);
  const count = useLabEventCount(experiment);

  return (
    <div
      data-lab-experiment={experiment}
      className="overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
        <p className="font-display text-sm uppercase tracking-wide text-white sm:text-base">
          {title}
        </p>
        <span className="ml-auto rounded-full border border-acid/30 bg-acid/10 px-2 py-0.5 font-mono text-[10px] text-acid">
          {count} events
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        {principles.map((p) => (
          <span
            key={p}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/55"
          >
            {PRINCIPLE_LABELS[p]}
          </span>
        ))}
        <div className="ml-auto flex max-w-full flex-wrap items-center gap-1" role="group" aria-label="Variant">
          {variants.map((v) => (
            <button
              key={v}
              type="button"
              data-lab-variant={v}
              onClick={() => setVariant(v)}
              aria-pressed={variant === v}
              className={`pressable rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                variant === v
                  ? "bg-acid text-ink"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {v === variants[0] ? "control" : v}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">{children(variant)}</div>
      {footer ? (
        <div className="border-t border-white/10 bg-black/20 px-4 py-2.5 text-[11px] leading-relaxed text-white/45">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/* — shared CTA that logs a conversion — */

export function LabCta({
  experiment,
  variant,
  label = "Claim the Vault — $25",
  sub,
  onClick,
  className = "",
}: {
  experiment: string;
  variant: string;
  label?: string;
  sub?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          labLogConversion(experiment, variant, "cta_click");
          onClick?.();
        }}
        className={`cta w-full rounded-lg bg-acid px-4 py-3.5 font-display text-lg uppercase leading-tight tracking-wide text-ink sm:py-4 sm:text-xl ${className}`}
      >
        {label}
        {sub ? (
          <span className="mt-0.5 block text-[10px] font-sans font-bold tracking-normal opacity-60">
            {sub}
          </span>
        ) : null}
      </button>
    </div>
  );
}

/* — small helpers — */

export function LabAction({
  experiment,
  variant,
  action,
  label,
  data,
  className = "",
  disabled = false,
}: {
  experiment: string;
  variant: string;
  action: string;
  label: string;
  data?: Record<string, unknown>;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => labLogAction(experiment, variant, action, data)}
      className={`pressable rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-white/75 transition hover:border-acid/50 hover:bg-acid/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  );
}

/** Honest numeric progress label + eased bar width (goal gradient). */
export function GoalBar({
  pct,
  label,
}: {
  pct: number; // 0..1
  label: string;
}) {
  const eased = goalEaseSafe(pct);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wider">
        <span className="text-white/55">{label}</span>
        <span className="tnum font-mono text-acid">{Math.round(pct * 100)}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
      >
        <div
          className="h-full rounded-full bg-acid shadow-[0_0_14px_rgba(255,230,0,0.45)] transition-[width] duration-700 ease-out"
          style={{ width: `${eased * 100}%` }}
        />
      </div>
    </div>
  );
}

function goalEaseSafe(p: number): number {
  // local mirror of core.goalGradientEase to avoid an import cycle in JSX helpers
  const x = Math.min(1, Math.max(0, p));
  return x + 0.22 * Math.pow(x, 3) * (1 - x);
}

/** Countdown display — mm:ss, no re-render storms. */
export function Countdown({ seconds, onDone }: { seconds: number; onDone?: () => void }) {
  const [left, setLeft] = useState(seconds);
  const doneRef = useRef(false);
  useEffect(() => {
    if (left <= 0) return;
    const t = window.setInterval(() => {
      setLeft((l) => {
        const next = l - 1;
        if (next <= 0 && !doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className="tnum inline-flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 font-mono text-sm font-bold text-acid">
      ⏳ {mm}:{ss}
    </span>
  );
}

/** Simple flip reveal hook: false → true after `delayMs`. */
export function useReveal(delayMs: number, disabled = false): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (disabled || delayMs <= 0) {
      setOn(true);
      return;
    }
    const t = window.setTimeout(() => setOn(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, disabled]);
  return on;
}
