/* ─────────────────────────────────────────────────────────────
   SIGNAL LAYER — observes raw behavior, emits normalized signals
   ─────────────────────────────────────────────────────────────
   This module is deliberately dumb: it never decides anything.
   It turns scroll / click / hover / idle / zone behavior into
   `EspSignal`s; the brain does the thinking.

   Performance notes:
     • every listener is passive; no preventDefault anywhere
     • scroll work is sampled, never layout-thrashed
       (IntersectionObserver does zone detection, not rect reads)
     • one shared 500ms interval evaluates all time windows
     • everything pauses while the tab is hidden

   Extending: add a detector function, a SignalKind, and a weight
   in brain.ts. Nothing else needs to change.
───────────────────────────────────────────────────────────── */

import type { EspSignal, SignalKind, ZoneId } from "./types";

type Emit = (signal: EspSignal) => void;

const INTERACTIVE_SELECTOR =
  "button, a, [role='button'], .cta, input, select, summary, label";

const now = () => performance.now();

/* Cooldowns per signal kind, so one behavior can't spam the brain. */
const COOLDOWNS: Record<SignalKind, number> = {
  fast_scroll: 6_000,
  scroll_reversal: 8_000,
  rage_click: 6_000,
  deliberate_read: 20_000,
  idle: 30_000,
  zone_revisit: 10_000,
  zone_dwell: 15_000,
  cta_hover: 12_000,
};

interface ScrollSample {
  y: number;
  t: number;
}

export function createSignalEngine(emit: Emit): () => void {
  const disposers: Array<() => void> = [];
  const lastEmitted = new Map<string, number>(); // "kind" or "kind:zone"

  function emitThrottled(
    key: string,
    cooldown: number,
    signal: EspSignal
  ): void {
    // -Infinity (not 0) so a signal is never swallowed merely for
    // happening within `cooldown` ms of page load.
    const last = lastEmitted.get(key) ?? -Infinity;
    if (signal.at - last < cooldown) return;
    lastEmitted.set(key, signal.at);
    emit(signal);
  }

  /* ────────────────────────────────
     SCROLL — velocity, reversals, pauses
  ──────────────────────────────── */
  const samples: ScrollSample[] = [];
  let lastY = window.scrollY;

  const onScroll = () => {
    const y = window.scrollY;
    if (y === lastY) return;
    samples.push({ y, t: now() });
    if (samples.length > 40) samples.splice(0, samples.length - 40);
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  disposers.push(() => window.removeEventListener("scroll", onScroll));

  function evaluateScroll(at: number) {
    // Trim to a 12s window (deliberate-read lookback).
    while (samples.length && at - samples[0].t > 12_000) samples.shift();
    if (samples.length < 2) return;

    // 1) Fast / aggressive scrolling (impatient, overwhelmed).
    const recent = samples.filter((s) => at - s.t <= 700);
    if (recent.length >= 5) {
      let dist = 0;
      for (let i = 1; i < recent.length; i++) dist += Math.abs(recent[i].y - recent[i - 1].y);
      const meanSpeed = dist / Math.max(1, recent[recent.length - 1].t - recent[0].t);
      if (dist >= 600 && meanSpeed >= 2.0 /* px/ms ≈ 2000px/s */) {
        emitThrottled("fast_scroll", COOLDOWNS.fast_scroll, {
          kind: "fast_scroll",
          at,
          meta: { meanSpeedPxMs: round2(meanSpeed), distancePx: Math.round(dist) },
        });
      }
    }

    // 2) Rapid direction changes (hunting for something).
    let changes = 0;
    let lastDir = 0;
    for (let i = 1; i < samples.length; i++) {
      const s = samples[i];
      if (at - s.t > 3_000) continue;
      const delta = s.y - samples[i - 1].y;
      if (Math.abs(delta) < 60) continue; // ignore micro-jitter
      const dir = Math.sign(delta);
      if (lastDir !== 0 && dir !== lastDir) changes++;
      lastDir = dir;
    }
    if (changes >= 4) {
      emitThrottled("scroll_reversal", COOLDOWNS.scroll_reversal, {
        kind: "scroll_reversal",
        at,
        meta: { changesIn3s: changes },
      });
    }

    // 3) Slow, deliberate reading with pauses (thoughtful, aspirational).
    const windowSamples = samples.filter((s) => at - s.t <= 12_000);
    if (windowSamples.length >= 6) {
      let dist = 0;
      let pauses = 0;
      let maxSpeed = 0;
      for (let i = 1; i < windowSamples.length; i++) {
        const dt = windowSamples[i].t - windowSamples[i - 1].t;
        const d = Math.abs(windowSamples[i].y - windowSamples[i - 1].y);
        dist += d;
        maxSpeed = Math.max(maxSpeed, d / Math.max(1, dt));
        if (dt >= 1_200) pauses++;
      }
      if (dist >= 400 && maxSpeed <= 0.5 && pauses >= 3) {
        emitThrottled("deliberate_read", COOLDOWNS.deliberate_read, {
          kind: "deliberate_read",
          at,
          meta: { distancePx: Math.round(dist), pauses, maxSpeedPxMs: round2(maxSpeed) },
        });
      }
    }
  }

  /* ────────────────────────────────
     CLICKS — rage-click clusters
  ──────────────────────────────── */
  let cluster = { count: 0, x: 0, y: 0, lastAt: -Infinity };

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target || !target.closest?.(INTERACTIVE_SELECTOR)) return;
    const t = e.timeStamp;
    const withinTime = t - cluster.lastAt < 600;
    const withinDist =
      cluster.count === 0 ||
      Math.hypot(e.clientX - cluster.x, e.clientY - cluster.y) < 60;
    if (!(withinTime && withinDist)) {
      cluster = { count: 0, x: e.clientX, y: e.clientY, lastAt: t };
    }
    cluster.count++;
    cluster.x = e.clientX;
    cluster.y = e.clientY;
    cluster.lastAt = t;
    if (cluster.count >= 3) {
      cluster = { count: 0, x: 0, y: 0, lastAt: -Infinity };
      emitThrottled("rage_click", COOLDOWNS.rage_click, {
        kind: "rage_click",
        at: now(),
        meta: { target: describeTarget(target) },
      });
    }
  };
  document.addEventListener("click", onClick, true);
  disposers.push(() => document.removeEventListener("click", onClick, true));

  /* ────────────────────────────────
     HOVER — lingering on a CTA without committing
  ──────────────────────────────── */
  let hoverTimer = 0;
  let hoverEl: Element | null = null;

  const cancelHover = () => {
    if (hoverTimer) window.clearTimeout(hoverTimer);
    hoverTimer = 0;
    hoverEl = null;
  };
  const onPointerOver = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.(".cta");
    if (!el) return;
    cancelHover();
    hoverEl = el;
    hoverTimer = window.setTimeout(() => {
      emitThrottled(`cta_hover`, COOLDOWNS.cta_hover, {
        kind: "cta_hover",
        at: now(),
        meta: { target: describeTarget(el) },
      });
      hoverTimer = 0;
      hoverEl = null;
    }, 1_600);
  };
  const onPointerOut = (e: PointerEvent) => {
    if (hoverEl && e.target === hoverEl) cancelHover();
  };
  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  document.addEventListener("pointerdown", cancelHover, { passive: true });
  disposers.push(() => {
    cancelHover();
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
    document.removeEventListener("pointerdown", cancelHover);
  });

  /* ────────────────────────────────
     ZONES — dwell + revisits via IntersectionObserver
  ──────────────────────────────── */
  interface ZoneState {
    el: Element;
    enters: number;
    enterAt: number;
    exitAt: number;
  }
  const zones = new Map<ZoneId, ZoneState>();
  const visible = new Set<ZoneId>();

  for (const el of Array.from(
    document.querySelectorAll<HTMLElement>("[data-esp-zone]")
  )) {
    const zone = el.dataset.espZone as ZoneId;
    if (zone) zones.set(zone, { el, enters: 0, enterAt: 0, exitAt: 0 });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const at = now();
      for (const entry of entries) {
        const zone = (entry.target as HTMLElement).dataset.espZone as ZoneId;
        const st = zones.get(zone);
        if (!st) continue;

        if (entry.isIntersecting) {
          visible.add(zone);
          // A genuine return: left the zone, then came back after 3s.
          const isRevisit = st.enters > 0 && at - st.exitAt >= 3_000;
          if (isRevisit) {
            emitThrottled(`zone_revisit:${zone}`, COOLDOWNS.zone_revisit, {
              kind: "zone_revisit",
              zone,
              at,
              meta: { visits: st.enters + 1 },
            });
          }
          st.enters++;
          st.enterAt = at;
        } else {
          visible.delete(zone);
          const dwell = at - st.enterAt;
          st.exitAt = at;
          if (dwell >= 8_000) {
            emitThrottled(`zone_dwell:${zone}`, COOLDOWNS.zone_dwell, {
              kind: "zone_dwell",
              zone,
              at,
              meta: { dwellMs: Math.round(dwell) },
            });
          }
        }
      }
    },
    { threshold: 0 }
  );
  for (const st of zones.values()) observer.observe(st.el);
  disposers.push(() => observer.disconnect());

  /** Zone the visitor is currently looking at (for idle context). */
  function primaryVisibleZone(): ZoneId | undefined {
    let best: ZoneId | undefined;
    let bestAt = -Infinity;
    for (const z of visible) {
      const st = zones.get(z);
      if (st && st.enterAt > bestAt) {
        best = z;
        bestAt = st.enterAt;
      }
    }
    return best;
  }

  /* ────────────────────────────────
     IDLE — long pause after reading = internal debate
  ──────────────────────────────── */
  let lastActivity = now();
  // Idle only counts after the visitor has actually interacted —
  // a page left open in a foreground tab shouldn't read as "debate".
  let armed = false;

  const onActivity = () => {
    lastActivity = now();
    armed = true;
  };
  const activityEvents = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
  for (const evt of activityEvents) {
    window.addEventListener(evt, onActivity, { passive: true });
  }
  disposers.push(() =>
    activityEvents.forEach((evt) => window.removeEventListener(evt, onActivity))
  );

  function evaluateIdle(at: number) {
    if (document.visibilityState !== "visible") return;
    if (!armed || at - lastActivity < 15_000) return;
    armed = false; // re-arms on the next activity
    emitThrottled("idle", COOLDOWNS.idle, {
      kind: "idle",
      zone: primaryVisibleZone(),
      at,
      meta: { idleMs: Math.round(at - lastActivity) },
    });
  }

  /* ────────────────────────────────
     HEARTBEAT — one interval evaluates everything
  ──────────────────────────────── */
  const interval = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    const at = now();
    evaluateScroll(at);
    evaluateIdle(at);
  }, 500);
  disposers.push(() => window.clearInterval(interval));

  return () => disposers.forEach((d) => d());
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function describeTarget(el: Element): string {
  const label =
    el.getAttribute("aria-label") ||
    (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 48);
  return label || el.tagName.toLowerCase();
}
