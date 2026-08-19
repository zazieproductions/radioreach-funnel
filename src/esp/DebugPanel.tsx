/* ─────────────────────────────────────────────────────────────
   DEBUG PANEL — dev-only overlay, never shown to real visitors
   ─────────────────────────────────────────────────────────────
   Appears only when the page is opened with ?esp=debug (or
   localStorage["esp.debug"]="1"). Lets you watch detection live,
   force modes to review copy variants, and see what's logged.
───────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { espStore } from "./store";
import { getBrainState } from "./brain";
import { getMemoryLog, getStoredEvents, getSessionId } from "./log";
import { killEsp } from "./flag";
import type { EmotionalMode } from "./types";

const MODE_DOTS: Record<EmotionalMode, string> = {
  default: "bg-white/40",
  calm: "bg-sky-400",
  aspire: "bg-violet-400",
  urgency: "bg-blood",
};

function fmt(n: number) {
  return n >= 10 ? n.toFixed(1) : n.toFixed(2);
}

export function DebugPanel() {
  const [mode, setMode] = useState<EmotionalMode>(espStore.getMode());
  const [open, setOpen] = useState(false);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const unsub = espStore.subscribe(() => {
      setMode(espStore.getMode());
    });
    const iv = window.setInterval(() => forceRender((n) => n + 1), 500);
    return () => {
      unsub();
      window.clearInterval(iv);
    };
  }, []);

  const brain = getBrainState();
  const signals = getMemoryLog();
  const events = getStoredEvents();
  const forced = espStore.getForced();

  const force = (m: EmotionalMode | null) => {
    espStore.setForced(m);
    if (m) espStore.setMode(m);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] select-none text-left print:hidden">
      {open && (
        <div className="fade-in mb-2 w-72 rounded-xl border border-white/15 bg-black/95 p-3 text-[11px] leading-relaxed text-white/80 shadow-2xl backdrop-blur">
          <p className="mb-1 flex items-center justify-between">
            <b className="uppercase tracking-widest text-white/50">ESP debug</b>
            <span className="font-mono text-white/35">{getSessionId().slice(0, 8)}</span>
          </p>

          <div className="mb-2 space-y-0.5 font-mono">
            {(["calm", "aspire", "urgency"] as const).map((m) => (
              <p key={m} className="flex justify-between gap-3">
                <span className="text-white/55">{m}</span>
                <span>{fmt(brain.scores[m] ?? 0)}</span>
              </p>
            ))}
          </div>

          <div className="mb-2 flex flex-wrap gap-1">
            {(["default", "calm", "aspire", "urgency"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => force(m === "default" ? null : m)}
                className={`pressable rounded px-2 py-1 font-bold uppercase tracking-wide ${
                  forced === (m === "default" ? null : m)
                    ? "bg-acid text-ink"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <p className="mb-1 text-white/45">
            signals (live):{" "}
            {signals.length === 0
              ? "—"
              : signals
                  .slice(-4)
                  .map((s) => String(s.data?.kind))
                  .join(" · ")}
          </p>
          <p className="mb-2 text-white/45">
            logged events: {events.length} · mode changes:{" "}
            {events.filter((e) => e.type === "mode_change").length} · conversions:{" "}
            {events.filter((e) => e.type === "conversion").length}
          </p>
          <button
            type="button"
            onClick={() => {
              killEsp();
              force(null);
              espStore.setMode("default");
            }}
            className="pressable rounded bg-blood/20 px-2 py-1 font-bold uppercase tracking-wide text-blood hover:bg-blood/40"
          >
            Kill switch (this browser)
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="ESP debug panel"
        className="pressable flex items-center gap-2 rounded-full border border-white/20 bg-black/90 px-3 py-1.5 font-mono text-[11px] text-white/80 backdrop-blur hover:border-acid"
      >
        <span className={`h-2 w-2 rounded-full ${MODE_DOTS[mode]}`} />
        <span>esp</span>
        <span className="text-acid">{forced ? `${mode} (forced)` : mode}</span>
      </button>
    </div>
  );
}
