/* ─────────────────────────────────────────────────────────────
   DECISION-POINT FOCUS — the visual surface
   ─────────────────────────────────────────────────────────────
   When a visitor is at the actual moment of choice (near a
   primary CTA, lingering on one, returning to one, or sitting
   in high-intent), we:

     1. Soft-dim the rest of the page with a spotlight hole
     2. Swap the micro-copy on / under that button
     3. Give the yellow CTA a slow glow pulse

   This is not a modal. The veil is pointer-events: none, the
   page never auto-scrolls, and the hero offer does not dim
   itself on first paint. Reduced-motion keeps the dim + copy
   change and drops the pulse (existing CSS rule).

   Kill switches: ?focus=off, localStorage focus.disabled=1,
   VITE_DECISION_FOCUS_ENABLED=false, runtime flag.
───────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { espStore } from "./store";
import { espLog } from "./log";
import {
  FOCUS,
  emptyHysteresis,
  focusStore,
  lingerThresholdFor,
  pickFocus,
  readFocusFlag,
  stepFocus,
  type ClusterSnapshot,
  type FocusClusterId,
  type FocusHysteresis,
  type FocusIntent,
  type FocusReason,
} from "./focus";

/* ── contexts ── */

interface FocusCtxValue {
  enabled: boolean;
  target: FocusClusterId | null;
  reason: FocusReason;
  register: (
    id: FocusClusterId,
    el: HTMLElement,
    opts?: { eager?: boolean }
  ) => () => void;
}

const FocusCtx = createContext<FocusCtxValue>({
  enabled: false,
  target: null,
  reason: null,
  register: () => () => {},
});

const ClusterIdCtx = createContext<FocusClusterId | null>(null);

export function useDecisionFocus() {
  return useContext(FocusCtx);
}

export function useClusterActive(): boolean {
  const id = useContext(ClusterIdCtx);
  const { enabled, target } = useDecisionFocus();
  return enabled && id !== null && target === id;
}

export function useFocusTarget(): FocusClusterId | null {
  return useSyncExternalStore(focusStore.subscribe, focusStore.getTarget, focusStore.getTarget);
}

/* ── copy swap (stacked, no layout shift) ── */

export function FocusCopy({
  idle,
  live,
  className,
  as: Tag = "span",
}: {
  idle: ReactNode;
  live: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const active = useClusterActive();
  if (live == null) return <Tag className={className}>{idle}</Tag>;

  return (
    <Tag className={cn("esp-slot focus-copy", className)} aria-live="polite">
      <span className={cn("esp-variant", !active && "esp-variant--active")} aria-hidden={active}>
        {idle}
      </span>
      <span className={cn("esp-variant", active && "esp-variant--active")} aria-hidden={!active}>
        {live}
      </span>
    </Tag>
  );
}

/* ── cluster wrapper ── */

export function DecisionCluster({
  id,
  children,
  className,
  eager = false,
}: {
  id: FocusClusterId;
  children: ReactNode;
  className?: string;
  /** Shorter linger — use after a commitment step (momentum complete). */
  eager?: boolean;
}) {
  const { enabled, target, register } = useDecisionFocus();
  const ref = useRef<HTMLDivElement>(null);
  const active = enabled && target === id;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return register(id, el, { eager });
  }, [id, eager, enabled, register]);

  return (
    <ClusterIdCtx.Provider value={id}>
      <div
        ref={ref}
        data-focus-cluster={id}
        data-focus-active={active ? "true" : "false"}
        className={cn("decision-focus", active && "decision-focus--active", className)}
      >
        {children}
      </div>
    </ClusterIdCtx.Provider>
  );
}

/* ── spotlight veil (portaled, tracks the active cluster) ── */

function Spotlight({ el }: { el: HTMLElement | null }) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [on, setOn] = useState(false);
  const last = useRef(box);
  if (box) last.current = box;

  useLayoutEffect(() => {
    if (!el) {
      setOn(false);
      return;
    }

    const measure = () => {
      const r = el.getBoundingClientRect();
      const pad = FOCUS.padPx;
      setBox({
        x: r.left - pad,
        y: r.top - pad,
        w: r.width + pad * 2,
        h: r.height + pad * 2,
      });
    };

    measure();
    setOn(true);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [el]);

  if (typeof document === "undefined") return null;
  const shown = box ?? last.current;

  return createPortal(
    <div
      className={cn("decision-veil", on && "decision-veil--on")}
      aria-hidden
      data-focus-veil={on ? "on" : "off"}
    >
      {shown && (
        <div
          className="decision-veil__hole"
          style={{
            left: shown.x,
            top: shown.y,
            width: Math.max(shown.w, 8),
            height: Math.max(shown.h, 8),
          }}
        />
      )}
    </div>,
    document.body
  );
}

/* ── engine ── */

interface ClusterInternal {
  id: FocusClusterId;
  el: HTMLElement;
  eager: boolean;
  visibleRatio: number;
  hovered: boolean;
  hoveredAt: number;
  focused: boolean;
  near: boolean;
  nearAt: number;
  revisits: number;
  visibleMs: number;
  enterAt: number;
  exitAt: number;
  enters: number;
}

interface EngineOpts {
  forced: FocusClusterId | null;
  onChange: (target: FocusClusterId | null, reason: FocusReason, el: HTMLElement | null) => void;
}

function distanceToRect(x: number, y: number, r: DOMRect): number {
  const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
  const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
  return Math.hypot(dx, dy);
}

function readIntent(pageEngaged: boolean): FocusIntent {
  return {
    espMode: espStore.getMode(),
    urgencyScore: espStore.getScores().urgency ?? 0,
    recentCtaHover: (espStore.getSignalCounts().cta_hover ?? 0) > 0,
    pageEngaged,
  };
}

function startFocusEngine({ forced, onChange }: EngineOpts) {
  const clusters = new Map<FocusClusterId, ClusterInternal>();
  const disposers: Array<() => void> = [];
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const finePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  let pageEngaged = false;
  let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
  let lastScrollAt = 0;
  let scrollSpeed = 0;
  let pointer = { x: 0, y: 0, has: false };
  let hysteresis: FocusHysteresis = emptyHysteresis();
  let lastPublished: FocusClusterId | null = null;
  let lastReason: FocusReason = null;
  let lastTick = performance.now();
  let destroyed = false;

  const engage = () => {
    pageEngaged = true;
  };

  const snapshotOf = (c: ClusterInternal, now: number, scrolling: boolean): ClusterSnapshot => ({
    id: c.id,
    visibleRatio: c.visibleRatio,
    hovered: c.hovered,
    hoveredFor: c.hovered && c.hoveredAt ? now - c.hoveredAt : 0,
    focused: c.focused,
    near: c.near,
    nearFor: c.near && c.nearAt ? now - c.nearAt : 0,
    revisits: c.revisits,
    visibleMs: c.visibleMs,
    eager: c.eager,
    scrolling,
    lingerThreshold: lingerThresholdFor(c.id, c.eager, coarse),
  });

  const publish = (id: FocusClusterId | null, why: FocusReason) => {
    if (id === lastPublished && why === lastReason) {
      focusStore.set(id, why);
      return;
    }
    const prev = lastPublished;
    lastPublished = id;
    lastReason = why;
    const node = id ? (clusters.get(id)?.el ?? null) : null;
    focusStore.set(id, why);
    onChange(id, why, node);
    if (id !== null || prev !== null) {
      espLog("focus", { cluster: id, reason: why, engaged: pageEngaged });
    }
  };

  const decide = (now = performance.now()) => {
    if (destroyed) return;
    if (document.visibilityState && document.visibilityState !== "visible") return;

    const forcedNow = focusStore.getForced() ?? forced;
    if (forcedNow) {
      hysteresis = {
        current: forcedNow,
        reason: "forced",
        pending: null,
        pendingReason: null,
        pendingSince: 0,
      };
      publish(forcedNow, "forced");
      return;
    }

    if (document.querySelector('[aria-modal="true"]')) {
      hysteresis = stepFocus(null, null, hysteresis, now);
      publish(hysteresis.current, hysteresis.reason);
      return;
    }

    const scrolling = scrollSpeed >= 0.7 || now - lastScrollAt < 140;
    const intent = readIntent(pageEngaged);
    const snaps = Array.from(clusters.values()).map((c) => snapshotOf(c, now, scrolling));
    const picked = pickFocus(snaps, intent, hysteresis.current);
    hysteresis = stepFocus(picked.id, picked.reason, hysteresis, now);
    publish(hysteresis.current, hysteresis.reason);
  };

  const observer =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            const at = performance.now();
            for (const entry of entries) {
              const id = (entry.target as HTMLElement).dataset.focusCluster as FocusClusterId;
              const c = clusters.get(id);
              if (!c) continue;
              c.visibleRatio = entry.intersectionRatio;
              if (entry.isIntersecting) {
                const isRevisit = c.enters > 0 && c.exitAt > 0 && at - c.exitAt >= FOCUS.revisitAwayMs;
                if (isRevisit) c.revisits += 1;
                c.enters += 1;
                c.enterAt = at;
              } else {
                c.exitAt = at;
                c.visibleRatio = 0;
              }
            }
            decide(at);
          },
          { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1] }
        )
      : null;

  const register = (id: FocusClusterId, el: HTMLElement, opts?: { eager?: boolean }) => {
    const prev = clusters.get(id);
    if (prev) observer?.unobserve(prev.el);

    const rec: ClusterInternal = {
      id,
      el,
      eager: !!opts?.eager,
      visibleRatio: 0,
      hovered: false,
      hoveredAt: 0,
      focused: false,
      near: false,
      nearAt: 0,
      revisits: 0,
      visibleMs: 0,
      enterAt: 0,
      exitAt: 0,
      enters: 0,
    };
    clusters.set(id, rec);
    observer?.observe(el);
    decide();

    let hoverTimer = 0;
    const onEnter = () => {
      rec.hovered = true;
      rec.hoveredAt = performance.now();
      if (hoverTimer) window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => decide(), FOCUS.hoverArmMs);
      decide();
    };
    const onLeave = () => {
      rec.hovered = false;
      rec.hoveredAt = 0;
      rec.near = false;
      rec.nearAt = 0;
      if (hoverTimer) window.clearTimeout(hoverTimer);
      hoverTimer = 0;
      decide();
    };
    const onFocusIn = () => {
      rec.focused = true;
      decide();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return;
      rec.focused = false;
      decide();
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      if (hoverTimer) window.clearTimeout(hoverTimer);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      observer?.unobserve(el);
      if (clusters.get(id)?.el === el) clusters.delete(id);
      decide();
    };
  };

  const onScroll = () => {
    const y = window.scrollY;
    const t = performance.now();
    const dt = Math.max(1, t - lastScrollAt);
    scrollSpeed = Math.abs(y - lastScrollY) / dt;
    lastScrollY = y;
    lastScrollAt = t;
    if (Math.abs(y) > 200) engage();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  disposers.push(() => window.removeEventListener("scroll", onScroll));

  const onEngageEvent = () => engage();
  window.addEventListener("keydown", onEngageEvent, { passive: true });
  window.addEventListener("pointerdown", onEngageEvent, { passive: true });
  disposers.push(() => {
    window.removeEventListener("keydown", onEngageEvent);
    window.removeEventListener("pointerdown", onEngageEvent);
  });

  if (finePointer) {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY, has: true };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    disposers.push(() => window.removeEventListener("pointermove", onMove));
  }

  const interval = window.setInterval(() => {
    if (destroyed || document.visibilityState !== "visible") return;
    const now = performance.now();
    const dt = now - lastTick;
    lastTick = now;
    if (now - lastScrollAt > 220) scrollSpeed = 0;

    const scrolling = scrollSpeed >= 0.7 || now - lastScrollAt < 140;

    for (const c of clusters.values()) {
      if (c.visibleRatio >= FOCUS.visibleRatio && !scrolling) c.visibleMs += dt;
      else if (c.visibleRatio < FOCUS.visibleRatio) c.visibleMs = 0;

      if (finePointer && pointer.has) {
        const r = c.el.getBoundingClientRect();
        const dist = distanceToRect(pointer.x, pointer.y, r);
        const isNear = dist > 0 && dist <= FOCUS.nearPx;
        if (isNear && !c.near) {
          c.near = true;
          c.nearAt = now;
        } else if (!isNear && !c.hovered) {
          c.near = false;
          c.nearAt = 0;
        }
      }
    }

    decide(now);
  }, 180);
  disposers.push(() => window.clearInterval(interval));

  if (forced) focusStore.setForced(forced);
  decide();

  return {
    register,
    destroy() {
      destroyed = true;
      observer?.disconnect();
      disposers.forEach((d) => d());
      clusters.clear();
      focusStore.reset();
      onChange(null, null, null);
    },
  };
}

/* ── provider ── */

export function DecisionFocusProvider({ children }: { children: ReactNode }) {
  const flag = useState(() => readFocusFlag())[0];
  const [target, setTarget] = useState<FocusClusterId | null>(flag.forced);
  const [reason, setReason] = useState<FocusReason>(flag.forced ? "forced" : null);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const engineRef = useRef<ReturnType<typeof startFocusEngine> | null>(null);

  const register = useCallback(
    (id: FocusClusterId, node: HTMLElement, opts?: { eager?: boolean }) => {
      return engineRef.current?.register(id, node, opts) ?? (() => {});
    },
    []
  );

  useEffect(() => {
    if (!flag.enabled) {
      focusStore.reset();
      return;
    }
    const engine = startFocusEngine({
      forced: flag.forced,
      onChange: (next, why, node) => {
        setTarget(next);
        setReason(why);
        setEl(node);
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [flag.enabled, flag.forced]);

  return (
    <FocusCtx.Provider value={{ enabled: flag.enabled, target, reason, register }}>
      {children}
      {flag.enabled && <Spotlight el={target ? el : null} />}
    </FocusCtx.Provider>
  );
}
