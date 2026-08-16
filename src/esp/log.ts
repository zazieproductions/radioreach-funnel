/* ─────────────────────────────────────────────────────────────
   EVENT LOG — what the ESP remembers, and where
   ─────────────────────────────────────────────────────────────
   v1 is purely client-side, so events live in:

     • sessionStorage["esp.events.v1"] — mode changes + conversions
       (a capped ring buffer, survives the SPA funnel stages).
     • an in-memory ring — raw signals + details for the debug
       overlay (never persisted; signals are high-volume noise).

   To ship this to Cloudflare Analytics / any backend later,
   swap the body of `sink()` for a sendBeacon/fetch call — the
   call sites don't change.
───────────────────────────────────────────────────────────── */

import type { EmotionalMode, EspEvent, EspSnapshot } from "./types";
import { espStore } from "./store";

const EVENTS_KEY = "esp.events.v1";
const MODE_KEY = "esp.mode.v1";
const MAX_STORED = 200;
const MAX_MEMORY = 60;

/** Ring buffer in sessionStorage — capped, oldest first. */
let events: EspEvent[] = loadStored();

function loadStored(): EspEvent[] {
  try {
    const raw = sessionStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_STORED)));
  } catch {
    /* storage full/blocked — logging is best-effort */
  }
}

/** In-memory ring for the debug overlay (signals, detail). */
const memory: EspEvent[] = [];
let debugEnabled = false;

export function setDebugEnabled(on: boolean) {
  debugEnabled = on;
}

/** Sink for one event. Replace with a network call to ship remotely. */
function sink(event: EspEvent) {
  events.push(event);
  if (events.length > MAX_STORED) events.splice(0, events.length - MAX_STORED);
  persist();
  if (debugEnabled && event.type !== "signal") {
    console.debug("[esp]", event.type, event.mode, event.data ?? "");
  }
}

export function espLog(
  type: EspEvent["type"],
  data?: Record<string, unknown>
): void {
  sink({ at: Date.now(), type, mode: espStore.getMode(), data });
}

/** Signals are high-volume: memory ring + console only. */
export function espLogSignal(data: Record<string, unknown>): void {
  memory.push({ at: Date.now(), type: "signal", mode: espStore.getMode(), data });
  if (memory.length > MAX_MEMORY) memory.splice(0, memory.length - MAX_MEMORY);
  if (debugEnabled) console.debug("[esp:signal]", data);
}

/** Conversion events — the ones we later correlate with modes. */
export function espLogConversion(
  name: string,
  extra?: Record<string, unknown>
): void {
  espLog("conversion", { name, ...extra, snapshot: getEspSnapshot() });
}

export function getMemoryLog(): readonly EspEvent[] {
  return memory;
}

export function getStoredEvents(): readonly EspEvent[] {
  return events;
}

let sessionId = "";
export function getSessionId(): string {
  if (!sessionId) {
    sessionId =
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : "") || `s-${Math.random().toString(36).slice(2, 10)}`;
  }
  return sessionId;
}

/* Mode persistence — lets later funnel stages (checkout → success)
   attribute a purchase to the emotional state the buyer was in. */
export function getPersistedMode(): EmotionalMode {
  try {
    const m = sessionStorage.getItem(MODE_KEY);
    return (["calm", "aspire", "urgency"].includes(m ?? "")
      ? m
      : "default") as EmotionalMode;
  } catch {
    return "default";
  }
}

/** Snapshot attached to every conversion event. */
export function getEspSnapshot(partial?: Partial<EspSnapshot>): EspSnapshot {
  return {
    sessionId: getSessionId(),
    mode: espStore.getMode(),
    forced: espStore.isForced(),
    scores: espStore.getScores(),
    signalCounts: espStore.getSignalCounts(),
    ...partial,
  };
}

/** Keep the persisted mode fresh (called by the store on change). */
export function persistMode(mode: EmotionalMode) {
  try {
    sessionStorage.setItem(MODE_KEY, mode);
  } catch {
    /* best-effort */
  }
}
