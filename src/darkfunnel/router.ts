/* ─────────────────────────────────────────────────────────────
   DARK FUNNEL TEARDOWN — router
   ─────────────────────────────────────────────────────────────
   A 60-line hash router so the replica can live at its own
   entry point without pulling a routing dependency into the
   repo. Paths are written the way the funnel spec describes
   them — nav('/reveal') — and stored as `#/reveal`.

   Funnels use client routing for a reason worth noting: no
   navigation ever leaves the document, so the countdown, the
   seat counter and the viewer count never reset. Persuasion
   state survives every "page change".
───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useState } from "react";

export const ROUTES = [
  "/hook",
  "/reveal",
  "/qualify",
  "/checkout",
  "/oto",
  "/downsell",
  "/thanks",
  "/teardown",
] as const;

export type Route = (typeof ROUTES)[number];

export const DEFAULT_ROUTE: Route = "/hook";

export function currentRoute(): Route {
  const raw = (window.location.hash || "").replace(/^#/, "");
  const path = raw.split("?")[0] || DEFAULT_ROUTE;
  return (ROUTES as readonly string[]).includes(path)
    ? (path as Route)
    : DEFAULT_ROUTE;
}

/** nav('/reveal') — the call sites in the spec. */
export function nav(path: Route): void {
  if (currentRoute() === path) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  window.location.hash = path;
}

export function useRoute(): [Route, (p: Route) => void] {
  const [route, setRoute] = useState<Route>(() => {
    try {
      return currentRoute();
    } catch {
      return DEFAULT_ROUTE;
    }
  });

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener("hashchange", onChange);
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  // Every stage change scrolls to top: the visitor never sees the
  // seam between "article" and "sales page".
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route]);

  const go = useCallback((p: Route) => nav(p), []);
  return [route, go];
}

export const STAGE_ORDER: Record<Route, number> = {
  "/hook": 1,
  "/reveal": 2,
  "/qualify": 3,
  "/checkout": 4,
  "/oto": 5,
  "/downsell": 6,
  "/thanks": 7,
  "/teardown": 8,
};

export const STAGE_NAME: Record<Route, string> = {
  "/hook": "Hook",
  "/reveal": "Reveal",
  "/qualify": "Qualify",
  "/checkout": "Checkout",
  "/oto": "Upsell",
  "/downsell": "Downsell",
  "/thanks": "Thank you",
  "/teardown": "Teardown",
};
