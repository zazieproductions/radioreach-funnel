/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — event log + store
   ─────────────────────────────────────────────────────────────
   Mirrors esp/log.ts + esp/store.ts:

   • sessionStorage["lab.events.v1"] — capped ring of assignment,
     exposure, action, milestone, and conversion events.
   • an in-memory subscriber store so the gallery can show a live
     event feed and a per-experiment action counter.

   To ship events to Cloudflare Analytics / a backend later, swap
   the body of `sink()` for a sendBeacon/fetch call — call sites
   don't change. Every conversion snapshot carries the visitor's
   full assignment map, so purchase events can be attributed per
   variant even across funnel stages (mirrors getMomentumAttribution).
───────────────────────────────────────────────────────────── */

import type { LabEvent, LabSnapshot } from "./types";
import { assignVariant, getVisitorId } from "./core";

const EVENTS_KEY = "lab.events.v1";
const MAX_STORED = 300;

/* — persistence — */

let events: LabEvent[] = loadStored();

function loadStored(): LabEvent[] {
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
    /* storage full/blocked — best-effort */
  }
}

/** Sink for one event. Replace with a network call to ship remotely. */
function sink(event: LabEvent) {
  events.push(event);
  if (events.length > MAX_STORED) events.splice(0, events.length - MAX_STORED);
  persist();
  listeners.forEach((l) => l(event));
  if (debugEnabled) {
    console.debug("[lab]", event.experiment, event.type, event.variant, event.data ?? "");
  }
}

/* — tiny pub/sub for the gallery feed — */

type Listener = (e: LabEvent) => void;
const listeners = new Set<Listener>();
let debugEnabled = false;

export function setLabDebug(on: boolean) {
  debugEnabled = on;
}

export function subscribeLab(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* — public logging API — */

export function labLog(
  experiment: string,
  variant: string,
  type: LabEvent["type"],
  data?: Record<string, unknown>
): void {
  sink({ at: Date.now(), experiment, variant, type, data });
}

export function labLogAction(
  experiment: string,
  variant: string,
  action: string,
  data?: Record<string, unknown>
): void {
  labLog(experiment, variant, "action", { action, ...data });
}

export function labLogMilestone(
  experiment: string,
  variant: string,
  milestone: string,
  data?: Record<string, unknown>
): void {
  labLog(experiment, variant, "milestone", { milestone, ...data });
}

export function labLogConversion(
  experiment: string,
  variant: string,
  name: string,
  extra?: Record<string, unknown>
): void {
  labLog(experiment, variant, "conversion", {
    name,
    ...extra,
    snapshot: getLabSnapshot(),
  });
}

export function getStoredEvents(): readonly LabEvent[] {
  return events;
}

/* — assignment snapshot for attribution (checkout / Stripe metadata) — */

const KNOWN_EXPERIMENTS = new Map<string, { variants: readonly string[]; weights?: readonly number[] }>();

/** Register an experiment so its assignment shows up in snapshots. */
export function registerExperiment(
  id: string,
  variants: readonly string[],
  weights?: readonly number[]
): void {
  KNOWN_EXPERIMENTS.set(id, { variants, weights });
}

export function getLabSnapshot(): LabSnapshot {
  const assignments: Record<string, string> = {};
  const visitorId = getVisitorId();
  for (const [id, spec] of KNOWN_EXPERIMENTS) {
    assignments[id] = assignVariant(id, visitorId, spec.variants, spec.weights);
  }
  return { visitorId, assignments };
}

/** Low-cardinality attribution map for analytics + Stripe metadata.
 *  Attach at checkout the same way getMomentumAttribution() is used. */
export function getLabAttribution(): Record<string, string> {
  const { visitorId, assignments } = getLabSnapshot();
  return {
    lab_visitor: visitorId.slice(0, 12),
    ...Object.fromEntries(
      Object.entries(assignments).map(([id, variant]) => [`lab_${id}`, variant])
    ),
  };
}
