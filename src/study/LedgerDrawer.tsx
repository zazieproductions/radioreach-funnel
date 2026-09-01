/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — the ledger drawer
   ─────────────────────────────────────────────────────────────
   A reference panel available from any stage: filter the pattern
   catalogue by family, stage, or severity, and see which ones
   have already fired on the current session.

   This is the SEO/research surface — the copy here is the part
   worth quoting in an article, and it stays reachable without
   forcing anyone to walk the whole funnel again.
───────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react";
import {
  FAMILY_LABELS,
  PATTERNS,
  STAGE_LABELS,
  type PatternFamily,
  type PatternStage,
} from "./annotations";
import { FAMILY_COLOR, PatternBody, SeverityDots } from "./Annotate";
import { useStudy } from "./state";

type Filter = "all" | PatternFamily;

export default function LedgerDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const s = useStudy();
  const [filter, setFilter] = useState<Filter>("all");
  const [minSeverity, setMinSeverity] = useState(1);

  const tripped = useMemo(
    () => new Set(s.trips.map((t) => t.pattern)),
    [s.trips]
  );

  const shown = PATTERNS.filter(
    (p) => (filter === "all" || p.family === filter) && p.severity >= minSeverity
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pattern ledger"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col border-l border-white/15 bg-ink"
      >
        <div className="flex items-center gap-3 border-b border-white/10 bg-panel px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight">PATTERN LEDGER</p>
            <p className="text-[10px] uppercase tracking-wider text-white/35">
              {PATTERNS.length} mechanics · {tripped.size} fired this session
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close ledger"
            className="ml-auto rounded-full border border-white/15 px-2 text-white/50"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                filter === "all" ? "bg-acid text-ink" : "bg-white/5 text-white/50"
              }`}
            >
              All
            </button>
            {(Object.keys(FAMILY_LABELS) as PatternFamily[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                style={
                  filter === f
                    ? { background: FAMILY_COLOR[f], color: "#08080a" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }
                }
              >
                {FAMILY_LABELS[f]}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40">
            Min severity
            <input
              type="range"
              min={1}
              max={5}
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="flex-1 accent-[#e01b24]"
            />
            <SeverityDots n={minSeverity} />
          </label>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {shown.map((p) => (
            <details
              key={p.id}
              className="rounded-lg border border-white/10 bg-panel px-4 py-3"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 marker:hidden">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: FAMILY_COLOR[p.family] }}
                />
                <span className="text-[14px] font-bold text-white/85">{p.label}</span>
                <SeverityDots n={p.severity} />
                {tripped.has(p.id) && (
                  <span className="rounded-full bg-blood/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-blood">
                    fired
                  </span>
                )}
              </summary>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-white/30">
                {p.stages.map((st) => STAGE_LABELS[st as PatternStage]).join(" · ")}
              </p>
              <div className="mt-3">
                <PatternBody meta={p} />
              </div>
            </details>
          ))}
          {!shown.length && (
            <p className="py-8 text-center text-[13px] text-white/40">
              No patterns match that filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
