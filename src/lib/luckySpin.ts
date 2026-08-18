import { PRODUCTS } from "../config/storefront";

export const LUCKY_SPIN_STORAGE_KEY = "radioreach:lucky-spin:v1";
export const LUCKY_SPIN_EVENT = "radioreach:lucky-spin";
export const LUCKY_SPIN_VARIANT = "lucky_spin_v1";

export type LuckySpinStatus = "idle" | "won" | "skipped";

export type LuckySpinState = {
  version: 1;
  variant: typeof LUCKY_SPIN_VARIANT;
  status: LuckySpinStatus;
  wonAt?: string;
  skippedAt?: string;
  updatedAt: string;
};

export type LuckyPrizeItem = {
  key: "contract_bundle" | "australia_addon";
  name: string;
  shortName: string;
  price: number;
  compareAt: number;
  saved: number;
};

/** The two checkout add-ons, already at session prices. The wheel just awards them. */
export function getLuckyPrizeItems(): LuckyPrizeItem[] {
  const contracts = PRODUCTS.contract_bundle;
  const au = PRODUCTS.australia_addon;
  return [
    {
      key: "contract_bundle",
      name: contracts.name,
      shortName: contracts.shortName,
      price: contracts.price,
      compareAt: contracts.compareAt ?? contracts.price,
      saved: (contracts.compareAt ?? contracts.price) - contracts.price,
    },
    {
      key: "australia_addon",
      name: au.name,
      shortName: au.shortName,
      price: au.price,
      compareAt: au.compareAt ?? au.price,
      saved: (au.compareAt ?? au.price) - au.price,
    },
  ];
}

export function getLuckyPrizeTotal() {
  const items = getLuckyPrizeItems();
  return {
    items,
    compareAt: items.reduce((sum, item) => sum + item.compareAt, 0),
    price: items.reduce((sum, item) => sum + item.price, 0),
    saved: items.reduce((sum, item) => sum + item.saved, 0),
  };
}

function now() {
  return new Date().toISOString();
}

function emptyState(): LuckySpinState {
  return {
    version: 1,
    variant: LUCKY_SPIN_VARIANT,
    status: "idle",
    updatedAt: now(),
  };
}

function validStatus(value: unknown): LuckySpinStatus {
  return value === "won" || value === "skipped" ? value : "idle";
}

export function loadLuckySpinState(): LuckySpinState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.sessionStorage.getItem(LUCKY_SPIN_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<LuckySpinState>;
    return {
      version: 1,
      variant: LUCKY_SPIN_VARIANT,
      status: validStatus(parsed.status),
      ...(typeof parsed.wonAt === "string" ? { wonAt: parsed.wonAt } : {}),
      ...(typeof parsed.skippedAt === "string" ? { skippedAt: parsed.skippedAt } : {}),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : now(),
    };
  } catch {
    return emptyState();
  }
}

export function saveLuckySpinState(state: LuckySpinState) {
  try {
    window.sessionStorage.setItem(LUCKY_SPIN_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(LUCKY_SPIN_EVENT, { detail: state }));
  } catch {
    // Persistence is best-effort in private browsing or locked-down contexts.
  }
}

export function getLuckySpinStatus(): LuckySpinStatus {
  return loadLuckySpinState().status;
}

export function hasWonLuckySpin() {
  return getLuckySpinStatus() === "won";
}

export function hasResolvedLuckySpin() {
  const status = getLuckySpinStatus();
  return status === "won" || status === "skipped";
}

export function markLuckySpinWon() {
  const current = loadLuckySpinState();
  if (current.status === "won") return current;
  const timestamp = now();
  const next: LuckySpinState = {
    ...current,
    status: "won",
    wonAt: current.wonAt || timestamp,
    updatedAt: timestamp,
  };
  saveLuckySpinState(next);
  return next;
}

export function markLuckySpinSkipped() {
  const current = loadLuckySpinState();
  if (current.status !== "idle") return current;
  const timestamp = now();
  const next: LuckySpinState = {
    ...current,
    status: "skipped",
    skippedAt: timestamp,
    updatedAt: timestamp,
  };
  saveLuckySpinState(next);
  return next;
}

export function resetLuckySpinState() {
  try {
    window.sessionStorage.removeItem(LUCKY_SPIN_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(LUCKY_SPIN_EVENT, { detail: emptyState() }));
  } catch {
    // Best effort only.
  }
}
