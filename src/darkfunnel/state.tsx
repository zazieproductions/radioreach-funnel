/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — session state
   ─────────────────────────────────────────────────────────────
   One provider holds everything the funnel accumulates about the
   visitor, plus the exposure ledger: every manipulative element
   that actually rendered in front of them, timestamped. The
   ledger is what the thank-you page prints back as a receipt.

   All of it is sessionStorage-scoped and dies with the tab.
   Nothing is transmitted; there is no endpoint to transmit to.
───────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CART,
  SESSION_KEY,
  sessionSeed,
  type Cart,
  type Verdict,
} from "./core";

export type Exposure = { id: string; at: number; count: number };

export type FunnelState = {
  /** stable per tab — seeds every "live" fiction on the page */
  sessionId: string;
  seed: number;
  startedAt: number;
  cart: Cart;
  lead: { firstName: string; email: string } | null;
  answers: Record<string, string>;
  verdict: Verdict | null;
  declinedOto: boolean;
  declinedDownsell: boolean;
  orderRef: string | null;
};

type Ctx = FunnelState & {
  patch: (p: Partial<FunnelState>) => void;
  reset: () => void;
  /** record that a dark pattern rendered in front of the visitor */
  expose: (patternId: string) => void;
  exposures: Exposure[];
  teardown: boolean;
  setTeardown: (v: boolean) => void;
  /** wall-clock ms the visitor has been inside the funnel */
  elapsed: number;
};

const FunnelContext = createContext<Ctx | null>(null);

function makeSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
  } catch {
    /* ignore */
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s-${Math.random().toString(36).slice(2, 12)}`;
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
  return id;
}

function initialState(): FunnelState {
  const sessionId = makeSessionId();
  return {
    sessionId,
    seed: sessionSeed(sessionId),
    startedAt: Date.now(),
    cart: { ...EMPTY_CART },
    lead: null,
    answers: {},
    verdict: null,
    declinedOto: false,
    declinedDownsell: false,
    orderRef: null,
  };
}

export function FunnelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FunnelState>(initialState);
  const [exposureMap, setExposureMap] = useState<Record<string, Exposure>>({});
  const [teardown, setTeardown] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // `x` toggles the teardown overlay from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;
      if (e.key === "x" || e.key === "X") setTeardown((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const patch = useCallback((p: Partial<FunnelState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const expose = useCallback((patternId: string) => {
    setExposureMap((m) => {
      const prev = m[patternId];
      if (prev) return { ...m, [patternId]: { ...prev, count: prev.count + 1 } };
      return { ...m, [patternId]: { id: patternId, at: Date.now(), count: 1 } };
    });
    seen.current.add(patternId);
  }, []);

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setExposureMap({});
    seen.current.clear();
    setState(initialState());
  }, []);

  const exposures = useMemo(
    () => Object.values(exposureMap).sort((a, b) => a.at - b.at),
    [exposureMap],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      patch,
      reset,
      expose,
      exposures,
      teardown,
      setTeardown,
      elapsed: now - state.startedAt,
    }),
    [state, patch, reset, expose, exposures, teardown, now],
  );

  return (
    <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>
  );
}

export function useFunnel(): Ctx {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error("useFunnel must be used inside <FunnelProvider>");
  return ctx;
}

/** Declare that a pattern is on screen. Records it once per mount. */
export function useExposure(...patternIds: string[]) {
  const { expose } = useFunnel();
  const key = patternIds.join("|");
  useEffect(() => {
    for (const id of key.split("|")) if (id) expose(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
