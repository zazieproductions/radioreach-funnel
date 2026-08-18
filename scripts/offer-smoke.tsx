/* ─────────────────────────────────────────────────────────────
   OFFER v2 — flag + render smoke tests
   ─────────────────────────────────────────────────────────────
   Guards the three things that would quietly cost money if they
   broke:

     1. The A/B split is sticky. A visitor must never see the v2
        offer, bounce to checkout, and come back to the control.
     2. Every kill switch actually kills. Build env, URL param,
        runtime flag and localStorage each have to work, in the
        documented precedence order.
     3. Flagged blocks render in v2 and are absent in control —
        including the guarantee swap, which replaces rather than
        appends.

   Run:  npm run test:offer
───────────────────────────────────────────────────────────── */

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
}

/* ── jsdom environment ─────────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://radioreach.test/",
  pretendToBeVisual: true,
});

const define = (name: string, value: unknown) =>
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });

define("window", dom.window);
define("document", dom.window.document);
define("navigator", dom.window.navigator);
define("HTMLElement", dom.window.HTMLElement);
define("Element", dom.window.Element);
define("Node", dom.window.Node);
define("MouseEvent", dom.window.MouseEvent);
define("PointerEvent", dom.window.PointerEvent);
define("CustomEvent", dom.window.CustomEvent);
define("Event", dom.window.Event);
define("sessionStorage", dom.window.sessionStorage);
define("localStorage", dom.window.localStorage);
define("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
define("IS_REACT_ACT_ENVIRONMENT", true);
define("requestAnimationFrame", dom.window.requestAnimationFrame.bind(dom.window));
define("cancelAnimationFrame", dom.window.cancelAnimationFrame.bind(dom.window));

const w = dom.window as unknown as Record<string, unknown>;

const scrollState = { y: 0 };
Object.defineProperty(w.window, "scrollY", {
  get: () => scrollState.y,
  configurable: true,
});

w.window.matchMedia = (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

class FakeIO {
  constructor(_cb: unknown) {}
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}
w.window.IntersectionObserver = FakeIO;
define("IntersectionObserver", FakeIO);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* The variant is cached per process by design (a visitor must never see it
   flip mid-scroll), so each case points the URL somewhere new and clears
   that cache through the test-only reset hook. */
import * as offerModule from "../src/config/offer";

type OfferModule = typeof offerModule;

async function loadOffer(search: string, _nonce: string): Promise<OfferModule> {
  dom.window.history.replaceState(null, "", `https://radioreach.test/${search}`);
  offerModule.__resetOfferVariantCacheForTests();
  return offerModule;
}

/* ═══════════════════════════════════════════════════════════
   1. URL PARAM OVERRIDES
═══════════════════════════════════════════════════════════ */

console.log("\n── Flag resolution ──");

{
  dom.window.localStorage.clear();
  const m = await loadOffer("?offer=v2", "url-v2");
  check("?offer=v2 → v2 arm", m.getOfferVariant() === "v2", m.getOfferVariant());
  check("?offer=v2 → master flag on", m.isOfferFlagEnabled("offerV2"));
  check(
    "?offer=v2 → sub-flags default on",
    m.isOfferFlagEnabled("bonusStack") && m.isOfferFlagEnabled("guaranteeV2")
  );
  check(
    "?offer=v2 persists the bucket",
    dom.window.localStorage.getItem("rr.offer.variant") === "v2"
  );
}

{
  dom.window.localStorage.clear();
  const m = await loadOffer("?offer=v1", "url-v1");
  check("?offer=v1 → control arm", m.getOfferVariant() === "control", m.getOfferVariant());
  check("?offer=v1 → master flag off", !m.isOfferFlagEnabled("offerV2"));
  check(
    "control suppresses every sub-flag",
    !m.isOfferFlagEnabled("bonusStack") &&
      !m.isOfferFlagEnabled("dreamOutcome") &&
      !m.isOfferFlagEnabled("ctaV2")
  );
}

/* ═══════════════════════════════════════════════════════════
   2. STICKINESS — the money case
═══════════════════════════════════════════════════════════ */

{
  dom.window.localStorage.clear();
  dom.window.localStorage.setItem("rr.offer.variant", "v2");
  const m = await loadOffer("", "sticky-v2");
  check("stored bucket v2 is honoured on a clean URL", m.getOfferVariant() === "v2");
}

{
  dom.window.localStorage.clear();
  dom.window.localStorage.setItem("rr.offer.variant", "control");
  const m = await loadOffer("", "sticky-control");
  check("stored bucket control is honoured", m.getOfferVariant() === "control");
}

{
  dom.window.localStorage.clear();
  const m = await loadOffer("", "fresh-assign");
  const first = m.getOfferVariant();
  const persisted = dom.window.localStorage.getItem("rr.offer.variant");
  check("fresh visitor gets one of the two arms", first === "v2" || first === "control", first);
  check("fresh assignment is persisted", persisted === first, `${persisted} vs ${first}`);
  check(
    "repeat calls in-process never flip",
    m.getOfferVariant() === first && m.getOfferVariant() === first
  );
}

/* ═══════════════════════════════════════════════════════════
   3. KILL SWITCHES
═══════════════════════════════════════════════════════════ */

{
  dom.window.localStorage.clear();
  dom.window.localStorage.setItem("rr.offer.variant", "v2");
  (dom.window as unknown as { __RADIOREACH_FLAGS__?: unknown }).__RADIOREACH_FLAGS__ = {
    offer: { offerV2: false },
  };
  const m = await loadOffer("", "runtime-kill");
  check("runtime offerV2:false overrides a stored v2 bucket", m.getOfferVariant() === "control");
  delete (dom.window as unknown as { __RADIOREACH_FLAGS__?: unknown }).__RADIOREACH_FLAGS__;
}

{
  dom.window.localStorage.clear();
  (dom.window as unknown as { __RADIOREACH_FLAGS__?: unknown }).__RADIOREACH_FLAGS__ = {
    offer: { bonusStack: false },
  };
  const m = await loadOffer("?offer=v2", "runtime-sub-kill");
  check("runtime sub-flag disables just that block", !m.isOfferFlagEnabled("bonusStack"));
  check(
    "…and leaves the others alone",
    m.isOfferFlagEnabled("dreamOutcome") && m.isOfferFlagEnabled("guaranteeV2")
  );
  delete (dom.window as unknown as { __RADIOREACH_FLAGS__?: unknown }).__RADIOREACH_FLAGS__;
}

{
  dom.window.localStorage.clear();
  const m = await loadOffer("?offer=v2&offer.bonusStack=off", "url-sub-kill");
  check("?offer.bonusStack=off disables the bonus block", !m.isOfferFlagEnabled("bonusStack"));
  check("…while v2 stays on", m.isOfferFlagEnabled("offerV2"));
}

{
  dom.window.localStorage.clear();
  const m = await loadOffer("?offer=v2", "attribution");
  const attr = m.getOfferAttribution();
  check("attribution reports the variant", attr.offer_variant === "v2", JSON.stringify(attr));
  const snap = m.getOfferFlagSnapshot();
  check(
    "snapshot covers every flag key",
    m.OFFER_FLAG_KEYS.every((k) => typeof snap[k] === "boolean"),
    JSON.stringify(snap)
  );
}

/* ═══════════════════════════════════════════════════════════
   4. RENDER — v2 vs control
═══════════════════════════════════════════════════════════ */

console.log("\n── Sales page render ──");

const { default: SalesPage } = await import("../src/funnel/SalesPage");

async function renderAt(search: string) {
  dom.window.history.replaceState(null, "", `https://radioreach.test/${search}`);
  offerModule.__resetOfferVariantCacheForTests();
  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<SalesPage onCta={() => {}} />);
  });
  await sleep(120);
  return {
    text: container.textContent ?? "",
    container,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

{
  dom.window.localStorage.clear();
  dom.window.localStorage.setItem("rr.offer.variant", "v2");
  const v2 = await renderAt("?offer=v2");

  check("v2 renders the dream-outcome block", v2.text.includes("YOU'RE BUYING THE REPLY"));
  check("v2 renders the proof stack", v2.text.includes("SPECIFICS, NOT"));
  check("v2 renders the speed stack", v2.text.includes("NOT SIX MONTHS"));
  check("v2 renders all three bonuses", v2.text.includes("First-Contact Swipe Pack") &&
    v2.text.includes("3-Touch Follow-Up System") &&
    v2.text.includes("Station-Fit Filter"));
  check("v2 renders the new guarantee", v2.text.includes("MORE USEFUL THAN A SUBMISSION FORM"));
  check(
    "v2 REPLACES the old guarantee (not both)",
    !v2.text.includes("I'LL EAT THE COST")
  );
  check("v2 keeps the founder price", v2.text.includes("$20"));
  check("v2 keeps the $49 anchor", v2.text.includes("$49"));
  check("v2 keeps scarcity — licenses left", v2.text.includes("Licenses left at this price"));
  check("v2 keeps the countdown", !!v2.container.querySelector('[role="timer"]'));
  check(
    "v2 totals include the bonus value",
    v2.text.includes("$857"),
    "expected stacked total $857"
  );

  const yellowCtas = Array.from(v2.container.querySelectorAll(".cta.bg-acid"));
  check("v2 keeps yellow CTAs", yellowCtas.length >= 4, `found ${yellowCtas.length}`);

  await v2.cleanup();
}

{
  dom.window.localStorage.clear();
  dom.window.localStorage.setItem("rr.offer.variant", "control");
  const v1 = await renderAt("?offer=v1");

  check("control hides the dream-outcome block", !v1.text.includes("YOU'RE BUYING THE REPLY"));
  check("control hides the proof stack", !v1.text.includes("SPECIFICS, NOT"));
  check("control hides the speed stack", !v1.text.includes("NOT SIX MONTHS"));
  check("control hides the bonuses", !v1.text.includes("First-Contact Swipe Pack"));
  check("control keeps the original guarantee", v1.text.includes("I'LL EAT THE COST"));
  check("control shows the original stack total", v1.text.includes("$742"));
  check("control keeps scarcity", v1.text.includes("Licenses left at this price"));
  check("control keeps the founder price", v1.text.includes("$20"));

  await v1.cleanup();
}

{
  dom.window.localStorage.clear();
  const partial = await renderAt("?offer=v2&offer.bonusStack=off&offer.dreamOutcome=off");
  check("per-block kill removes the bonus stack", !partial.text.includes("First-Contact Swipe Pack"));
  check("per-block kill removes the dream block", !partial.text.includes("YOU'RE BUYING THE REPLY"));
  check("…and leaves the rest of v2 intact", partial.text.includes("MORE USEFUL THAN A SUBMISSION FORM"));
  check(
    "…and reverts the stack total to $742",
    partial.text.includes("$742") && !partial.text.includes("$857")
  );
  await partial.cleanup();
}

console.log(
  failures === 0
    ? "\n✔ Offer v2: all checks passed."
    : `\n✖ Offer v2: ${failures} check(s) FAILED.`
);
dom.window.close();
process.exit(failures === 0 ? 0 : 1);
