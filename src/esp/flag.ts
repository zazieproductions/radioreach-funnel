/* ─────────────────────────────────────────────────────────────
   FEATURE FLAG — the single kill switch for the whole system
   ─────────────────────────────────────────────────────────────
   The ESP can be disabled instantly, in four ways (most
   immediate first):

     1. URL param        ?esp=off        (per visit, ad-hoc)
     2. localStorage     esp.disabled=1  (per browser, persistent)
        — or run in console:  localStorage.setItem("esp.disabled","1")
     3. Build-time env   VITE_ESP_ENABLED=false   (per deploy)
     4. Remove the <initEsp> call / EmotiveText slots (source)

   When disabled, the page renders the untouched default copy —
   no observers, no listeners, no logging, zero behavior change.

   Other URL params (QA helpers, ignored by real visitors):
     ?esp=calm | aspire | urgency | default   force a mode so copy
                                              can be previewed while
                                              detection still runs
     ?esp=debug                               show the dev overlay
───────────────────────────────────────────────────────────── */

import type { EmotionalMode, EspFlag } from "./types";

const FLAG_PARAM = "esp";
const KILL_KEY = "esp.disabled";
const DEBUG_KEY = "esp.debug";

const FORCED_MODES: Record<string, EmotionalMode> = {
  calm: "calm",
  aspire: "aspire",
  urgency: "urgency",
  default: "default",
};

function isKilledLocally(): boolean {
  try {
    return localStorage.getItem(KILL_KEY) === "1";
  } catch {
    return false;
  }
}

function isDebugLocal(): boolean {
  try {
    return localStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

export function readEspFlag(): EspFlag {
  const url = typeof window !== "undefined" ? window.location.search : "";

  let param = "";
  try {
    param = new URLSearchParams(url).get(FLAG_PARAM)?.trim().toLowerCase() ?? "";
  } catch {
    param = "";
  }

  // vite/client types give ImportMetaEnv an index signature, so any
  // VITE_* var compiles. Guarded for safety in odd tooling contexts.
  const killedByEnv = import.meta.env?.VITE_ESP_ENABLED === "false";

  const killedByUrl = param === "off";

  return {
    enabled: !killedByEnv && !killedByUrl && !isKilledLocally(),
    debug: param === "debug" || isDebugLocal(),
    forced: param in FORCED_MODES ? FORCED_MODES[param] : null,
  };
}

/**
 * Kill switch for anything else running in this tab (console / Ops).
 * Persists in this browser; the page returns to default copy
 * immediately and stays off on future visits until re-enabled.
 */
export function killEsp(): void {
  try {
    localStorage.setItem(KILL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export { KILL_KEY, DEBUG_KEY };
