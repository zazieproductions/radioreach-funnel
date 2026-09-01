/* ─────────────────────────────────────────────────────────────
   PERSUASION STUDY — feature flag (the "never ships" guard)
   ─────────────────────────────────────────────────────────────
   This module is a research artifact, not a product surface. It
   reproduces a complete manipulative funnel so the mechanics can
   be read, annotated, and cited — it must never be reachable
   from a production deploy.

   Guard order (most restrictive first):

     1. Build env  VITE_STUDY_ENABLED=true   — required in prod
     2. Dev server                            — always on locally
     3. localStorage study.enabled=1          — deliberate opt-in
     4. Source                                — delete the route

   Default in a production build: OFF. `npm run dev` (and any
   preview started from the sandbox) resolves to ON, so the
   annotated funnel is reviewable without ever being shippable.

   QA params:
     ?study=ledger   open the pattern ledger drawer on load
     ?study=fast     collapse all artificial delays to ~0
───────────────────────────────────────────────────────────── */

const OPT_IN_KEY = "study.enabled";

function search(): string {
  try {
    return typeof window === "undefined" ? "" : window.location.search;
  } catch {
    return "";
  }
}

function param(): string {
  try {
    return new URLSearchParams(search()).get("study")?.trim().toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function optedInLocally(): boolean {
  try {
    return localStorage.getItem(OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/** True only where the study is allowed to mount. */
export function isStudyEnabled(): boolean {
  const envAllows = import.meta.env?.VITE_STUDY_ENABLED === "true";
  const isDev = Boolean(import.meta.env?.DEV);
  return envAllows || isDev || optedInLocally();
}

/** Ledger drawer starts open (?study=ledger). */
export function studyLedgerAutoOpen(): boolean {
  return param() === "ledger";
}

/** Skip the theatrical waits (?study=fast) — for reading the code paths. */
export function studyFastMode(): boolean {
  return param() === "fast";
}

export { OPT_IN_KEY };
