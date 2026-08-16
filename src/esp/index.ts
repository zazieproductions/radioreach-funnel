/* ─────────────────────────────────────────────────────────────
   EMOTIONAL STATE PROXY — entry point
   ─────────────────────────────────────────────────────────────
   Usage:

     useEffect(() => initEsp(), []);   // once, e.g. in SalesPage
     <EmotiveText slot="heroSub" />    // adaptive copy
     espLogConversion("cta_click")     // conversion attribution

   The whole system is client-side. When the flag is off, initEsp
   is a no-op, EmotiveText shows the default copy, and nothing
   else about the page changes.

   Signals → brain (scoring + hysteresis) → store → EmotiveText.
   Every mode change and conversion is logged to sessionStorage.
───────────────────────────────────────────────────────────── */

import { readEspFlag } from "./flag";
import { createSignalEngine } from "./signals";
import { ingest, tick } from "./brain";
import { espStore } from "./store";
import {
  espLog,
  espLogSignal,
  setDebugEnabled,
  getSessionId,
} from "./log";
import type { EspSignal } from "./types";

export { useEspMode, EmotiveText } from "./EmotiveText";
export { DebugPanel } from "./DebugPanel";
export { killEsp, readEspFlag } from "./flag";
export {
  espLogConversion,
  getEspSnapshot,
  getPersistedMode,
  getStoredEvents,
} from "./log";
export { espStore } from "./store";
export { getBrainState } from "./brain";
export type { EmotionalMode, EspSnapshot, SignalKind, ZoneId } from "./types";
export { SLOT_COPY, copyFor, type SlotKey } from "./copy";

const BRAIN_TICK_MS = 500;

let sessionLogged = false;
let lastTick = 0;

/** Start observing. Returns a cleanup that fully tears the system down. */
export function initEsp(): () => void {
  if (typeof window === "undefined") return () => {};

  const flag = readEspFlag();
  if (!flag.enabled) return () => {};

  setDebugEnabled(flag.debug);
  espStore.setForced(flag.forced);

  if (!sessionLogged) {
    sessionLogged = true;
    espLog("session", { sessionId: getSessionId(), flag: { ...flag } });
  }

  const handleSignal = (signal: EspSignal) => {
    espLogSignal({
      kind: signal.kind,
      zone: signal.zone ?? null,
      mode: espStore.getMode(),
      ...signal.meta,
    });
    ingest(signal);
  };

  const destroySignals = createSignalEngine(handleSignal);

  lastTick = performance.now();
  const interval = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    const at = performance.now();
    tick(at, at - lastTick);
    lastTick = at;
  }, BRAIN_TICK_MS);

  return () => {
    window.clearInterval(interval);
    destroySignals();
  };
}
