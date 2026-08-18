/* ─────────────────────────────────────────────────────────────
   CONVERSION LAB — feature flag (the kill switch)
   ─────────────────────────────────────────────────────────────
   Same four-way off switch as the ESP, one namespace over:

     1. URL param     ?lab=off                       (per visit)
     2. localStorage  lab.disabled=1                 (this browser)
     3. Build env     VITE_LAB_ENABLED=false         (per deploy)
     4. Source        remove the <LabGallery> route / prototypes

   Plus per-experiment overrides for QA:
     ?lab=lab_anchoring:treatment,lab_streak_calendar:control
   and a debug feed:
     ?lab=debug
───────────────────────────────────────────────────────────── */

import type { LabFlag } from "./types";

const FLAG_PARAM = "lab";
const KILL_KEY = "lab.disabled";
const DEBUG_KEY = "lab.debug";

function readSearch(): string {
  try {
    return typeof window !== "undefined" ? window.location.search : "";
  } catch {
    return "";
  }
}

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

export function readLabFlag(): LabFlag {
  const search = readSearch();
  let raw = "";
  try {
    raw = new URLSearchParams(search).get(FLAG_PARAM)?.trim().toLowerCase() ?? "";
  } catch {
    raw = "";
  }

  const killedByEnv = import.meta.env?.VITE_LAB_ENABLED === "false";
  const killedByUrl = raw === "off";

  const overrides: Record<string, string> = {};
  if (!killedByUrl && raw && raw !== "off") {
    // "exp:variant,exp2:variant" — invalid entries are dropped.
    for (const chunk of raw.split(",")) {
      const [id, ...rest] = chunk.split(":");
      const variant = rest.join(":").trim();
      if (id && variant) overrides[id.trim()] = variant;
    }
  }

  return {
    enabled: !killedByEnv && !killedByUrl && !isKilledLocally(),
    debug: raw === "debug" || isDebugLocal(),
    overrides,
  };
}

/** Console/Ops kill switch — persists in this browser. */
export function killLab(): void {
  try {
    localStorage.setItem(KILL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function reviveLab(): void {
  try {
    localStorage.removeItem(KILL_KEY);
  } catch {
    /* ignore */
  }
}

export { KILL_KEY, DEBUG_KEY };
