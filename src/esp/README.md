# Emotional State Proxy (ESP)

A lightweight, client-side system that watches how a visitor behaves on the
RadioReach sales page and gently adapts the *tone* of the copy — never the
price, the offer, or the product facts. Most visitors never notice it; they
just feel like the page "gets" them.

## How it works

```
behavior ──▶ signals.ts ──▶ brain.ts ──▶ store ──▶ EmotiveText (crossfade)
              (detect)      (decide)      (mode)        (render)
                                  └────────▶ log.ts (sessionStorage)
```

- **signals.ts** — the eyes. Passive listeners + one 500ms heartbeat turn raw
  scroll / click / hover / idle / section-visibility behavior into normalized
  signals. It never decides anything.
- **brain.ts** — the judgment. Each signal adds weight to one of three
  emotional modes; all weights decay (20s half-life). A mode must clear a
  minimum score, lead the runner-up by a margin, hold for 500ms, and respect
  an 8s switch cooldown. Noisy or contradictory signals fall back to
  `default`. `decideMode` is a pure function (unit-tested).
- **store.ts** — a tiny pub/sub that React subscribes to via
  `useSyncExternalStore`. Also mirrors scores/counts for snapshots.
- **copy.tsx** — one variant per mode per page slot. `default` is the
  original copy, verbatim — the flag-off experience.
- **EmotiveText.tsx** — renders every variant for a slot stacked in one grid
  cell, sized by the largest, so copy swaps **never shift the layout**; the
  active variant just crossfades in (300ms opacity, killed automatically by
  the existing `prefers-reduced-motion` rule).
- **log.ts** — mode changes + conversion events land in
  `sessionStorage["esp.events.v1"]` (capped ring buffer). Raw signals live in
  an in-memory ring for the debug overlay only. To ship events to a backend
  later, replace the body of `sink()` in `log.ts` with a `sendBeacon`/`fetch`.

## The three modes

| Mode | Trigger behavior | Tone |
| --- | --- | --- |
| `calm` | fast/aggressive scrolling, direction flips, rage clicks, long idle | soften, simplify, de-pressure. "No BS, take your time." |
| `aspire` | slow deliberate reading with pauses, dwelling on proof | identity + future. "You're the serious artist; this is how the serious ones got heard." |
| `urgency` | repeated returns to pricing/scarcity/CTA, lingering on CTAs, idle while looking at price | the cost of waiting. Classy, heavy — never desperate. |

Signal → weight map lives in `brain.ts` (SIGNAL_WEIGHTS, ZONE_REVISIT_WEIGHTS,
ZONE_DWELL_WEIGHTS). Zones are plain `data-esp-zone` attributes on page
sections (`pricing`, `scarcity`, `cta`, `proof`, `safety`).

## Feature flag — kill it instantly

The whole system checks one flag (`src/esp/flag.ts`) at init. Four ways off:

1. **URL** — `?esp=off` (ad-hoc, per visit)
2. **localStorage** — `localStorage.setItem("esp.disabled", "1")` (this browser;
   the debug panel's kill button does this)
3. **Env** — build with `VITE_ESP_ENABLED=false` (per deploy)
4. **Source** — delete the `<EmotiveText>` usages / the `initEsp()` call

When off: no observers, no listeners, no logging, and every slot renders the
original copy. Zero behavior change.

## QA helpers (URL params)

- `?esp=debug` — dev overlay (bottom-right): live scores, signal feed,
  logged events, force-mode buttons, kill switch.
- `?esp=calm` / `?esp=aspire` / `?esp=urgency` — force a mode so copy
  variants can be reviewed; detection still runs and logs underneath.

## Measuring what converts

Every CTA on the sales page routes through `SalesPage.handleCta`, which logs
a `conversion` event (`cta_click`) with a snapshot: current mode, scores,
signal counts, session id. `SuccessPage` logs `purchase_completed` with the
last persisted mode. Correlate in `sessionStorage["esp.events.v1"]`.

## Extending

- **New signal** — add a `SignalKind`, a detector block in `signals.ts`, a
  weight in `brain.ts`. Done.
- **New zone** — add the `ZoneId`, a `data-esp-zone` attribute, weights.
- **New copy slot** — add a `SlotKey` + variants in `copy.tsx`, drop
  `<EmotiveText slot="…" />` where the copy lives.
- **New mode** — add to `EmotionalMode`/`MODES`, weights, variants.

## Tests

```
npm run test:esp
```

Runs the pure brain-logic suite (`scripts/esp-smoke.ts`) plus jsdom
integration scenarios (`scripts/esp-integration.tsx`) that mount the real
sales page and drive real events: zone revisits → urgency, rage clicks +
fast scroll → calm, forced modes, and the `esp=off` kill switch.
