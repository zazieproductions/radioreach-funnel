/* ─────────────────────────────────────────────────────────────
   ESP integration test — mounts the real SalesPage in jsdom and
   drives real scroll / click / zone events through the signal
   layer, then asserts the copy that ends up visible.

   Run via:  npm run test:esp   (see scripts/run-esp-tests.mjs)

   One scenario per process (module state is a singleton):
     SCENARIO=A  default → urgency   (zone revisits)
     SCENARIO=B  default → calm      (rage clicks + fast scroll)
     SCENARIO=C  flag: forced modes + esp=off kill switch
     SCENARIO=D  decision-point focus (quiet on load, force cluster)
───────────────────────────────────────────────────────────── */

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const SCENARIO = process.env.SCENARIO ?? "A";
const QUERY: Record<string, string> = { A: "", B: "", C: "?esp=calm", D: "" };
const OFF_QUERY = "?esp=off";
const FOCUS_OFF_QUERY = "?focus=off";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: `https://radioreach.test/${QUERY[SCENARIO]}`,
  pretendToBeVisual: true,
});

/* — globals React + the ESP code expect — */
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
// App code calls these as bare globals (browsers expose them globally).
define("requestAnimationFrame", dom.window.requestAnimationFrame.bind(dom.window));
define("cancelAnimationFrame", dom.window.cancelAnimationFrame.bind(dom.window));

const w = dom.window as unknown as Record<string, unknown>;

/* Scroll position is not scrollable in jsdom — fake it. */
const scrollState = { y: 0 };
Object.defineProperty(w.window, "scrollY", {
  get: () => scrollState.y,
  configurable: true,
});

/* ExitIntent / TerminalPreview probe prefers-reduced-motion. */
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

/* Controllable IntersectionObserver. */
type FakeEntry = {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
  time: number;
};
class FakeIO {
  static instances: FakeIO[] = [];
  cb: (entries: FakeEntry[], self: FakeIO) => void;
  targets = new Map<Element, boolean>();
  constructor(cb: (entries: FakeEntry[], self: FakeIO) => void) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  observe(el: Element) {
    if (this.targets.has(el)) return;
    // ESP zones start visible (tests drive revisits from there).
    // Focus clusters must NOT all start intersecting — in a real
    // browser hero/stack/final are never on screen at once.
    const auto = !!(el as HTMLElement).dataset.espZone;
    this.targets.set(el, auto);
    if (auto) this.cb([this.entry(el, true)], this);
  }
  disconnect() {
    this.targets.clear();
  }
  unobserve() {}
  takeRecords(): FakeEntry[] {
    return [];
  }
  entry(el: Element, isIntersecting: boolean): FakeEntry {
    return { target: el, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, time: performance.now() };
  }
  emit(el: Element, isIntersecting: boolean) {
    this.targets.set(el, isIntersecting);
    this.cb([this.entry(el, isIntersecting)], this);
  }
}
w.window.IntersectionObserver = FakeIO;
// The ESP references IntersectionObserver as a bare global.
define("IntersectionObserver", FakeIO);

class FakeRO {
  observe() {}
  disconnect() {}
  unobserve() {}
}
w.window.ResizeObserver = FakeRO;
define("ResizeObserver", FakeRO);

/* Other app features (e.g. the momentum sequence) create their own
   IntersectionObservers; find the ESP engine's — the one observing
   elements carrying data-esp-zone. */
function espObserver(): FakeIO {
  const io = FakeIO.instances.find((instance) =>
    Array.from(instance.targets.keys()).some(
      (el) => (el as HTMLElement).dataset.espZone
    )
  );
  if (!io) throw new Error("ESP IntersectionObserver not found");
  return io;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
}

/* — load app code only after globals exist — */
const { default: SalesPage } = await import("../src/funnel/SalesPage");
const { espStore } = await import("../src/esp/store");

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);

const ctaClicks: string[] = [];
await act(async () => {
  root.render(<SalesPage onCta={() => ctaClicks.push("checkout")} />);
});

function slotMode(slot: string): string {
  return (
    document
      .querySelector(`[data-esp-slot="${slot}"]`)
      ?.getAttribute("data-esp-mode") ?? "?"
  );
}
function activeText(slot: string): string {
  const slotEl = document.querySelector(`[data-esp-slot="${slot}"]`);
  const active = slotEl?.querySelector(".esp-variant--active");
  return (active?.textContent ?? "").replace(/\s+/g, " ").trim();
}
function variantCount(slot: string): number {
  return document.querySelectorAll(`[data-esp-slot="${slot}"] > .esp-variant`).length;
}

/* Every slot must render its full variant stack on load. */
check("heroSub stacks all variants", variantCount("heroSub") >= 3, `got ${variantCount("heroSub")}`);
check("alertBar stacks all variants", variantCount("alertBar") >= 3, `got ${variantCount("alertBar")}`);

if (SCENARIO === "A") {
  /* ── default → urgency via repeated returns to pricing/scarcity ── */
  check("starts on default copy", activeText("heroSub").includes("You finished the record"), activeText("heroSub").slice(0, 60));
  check("body not yet tagged", !document.body.dataset.espMode);

  const io = espObserver();
  const pricing = document.querySelectorAll('[data-esp-zone="pricing"]');
  const scarcity = document.querySelectorAll('[data-esp-zone="scarcity"]');
  check("zones registered", pricing.length === 2 && scarcity.length === 1, `pricing=${pricing.length} scarcity=${scarcity.length}`);

  // Leave the pricing + scarcity zones…
  pricing.forEach((el) => io.emit(el, false));
  scarcity.forEach((el) => io.emit(el, false));
  await sleep(3200); // ≥ 3s away so the return counts as a revisit
  // …then come back.
  pricing.forEach((el) => io.emit(el, true));
  scarcity.forEach((el) => io.emit(el, true));
  await sleep(2000); // confirm window + ticks

  check("flipped to urgency", slotMode("heroSub") === "urgency", `got ${slotMode("heroSub")}`);
  check("body tagged urgency", document.body.dataset.espMode === "urgency");
  check("urgency copy visible", activeText("heroSub").includes("Every week the record sits"), activeText("heroSub").slice(0, 60));
  check("alert bar urgency copy", activeText("alertBar").includes("then it's $49"), activeText("alertBar"));
  check("price facts untouched", activeText("heroSub").includes("18,000+ radio station contacts"));
  const heroCta = Array.from(document.querySelectorAll(".cta")).find((b) =>
    b.textContent?.includes("Yes — Give Me The Contacts")
  );
  check("core CTA label untouched", !!heroCta);
  check("focus stays off without decision intent", !document.body.dataset.decisionFocus);

  const events = JSON.parse(sessionStorage.getItem("esp.events.v1") ?? "[]");
  check("mode change logged", events.some((e: { type: string; data?: { to?: string } }) => e.type === "mode_change" && e.data?.to === "urgency"));
  check("scores attached to log", events.some((e: { type: string; data?: { scores?: object } }) => e.type === "mode_change" && e.data?.scores?.urgency && (e.data.scores.urgency as number) >= 4));
}

if (SCENARIO === "B") {
  /* ── default → calm via rage clicks + aggressive scrolling ── */
  check("starts on default copy", activeText("heroSub").includes("You finished the record"));

  const cta = document.querySelector(".cta") as HTMLElement;
  for (let i = 0; i < 4; i++) {
    cta.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 40, clientY: 40 }));
    await sleep(120);
  }
  check("rage clicks reached the CTA", ctaClicks.length === 4, `got ${ctaClicks.length}`);

  // Aggressive scroll: 500px steps, fast.
  for (let i = 0; i < 8; i++) {
    scrollState.y += 500;
    w.window.dispatchEvent(new Event("scroll"));
    await sleep(30);
  }
  await sleep(2000); // evaluate window + confirm + ticks

  check("flipped to calm", slotMode("heroSub") === "calm", `got ${slotMode("heroSub")}`);
  check("body tagged calm", document.body.dataset.espMode === "calm");
  check("calm copy visible", activeText("heroSub").includes("No platforms"), activeText("heroSub").slice(0, 60));
  check("calm CTA label", activeText("ctaLabel").includes("One-time price"), activeText("ctaLabel"));
  check("calm alert bar", activeText("alertBar").includes("take your time"), activeText("alertBar"));

  const events = JSON.parse(sessionStorage.getItem("esp.events.v1") ?? "[]");
  check("conversion logged with snapshot", events.some((e: { type: string; data?: { name?: string; snapshot?: object } }) => e.type === "conversion" && e.data?.name === "cta_click" && e.data?.snapshot && typeof (e.data.snapshot as { mode?: string }).mode === "string"));
}

if (SCENARIO === "C") {
  /* ── feature flag: forced mode via URL, override, kill switch ── */
  await sleep(700); // first brain ticks
  check("?esp=calm forces calm", slotMode("heroSub") === "calm", `got ${slotMode("heroSub")}`);
  check("calm hero visible", activeText("heroSub").includes("No platforms"));

  // Debug-panel style override.
  act(() => {
    espStore.setForced("aspire");
    espStore.setMode("aspire");
  });
  check("forced aspire", slotMode("heroSub") === "aspire", `got ${slotMode("heroSub")}`);
  check("aspire eyebrow", activeText("heroEyebrow").includes("serious about being heard"), activeText("heroEyebrow"));
  check("aspire proof headline", activeText("proofHeadline").includes("ARTISTS WHO GOT HEARD"), activeText("proofHeadline"));
  check("aspire sticky label", activeText("stickyLabel").includes("Join The Vault"), activeText("stickyLabel"));

  act(() => {
    espStore.setForced(null);
    espStore.setMode("default");
  });
  check("override cleared → default", slotMode("heroSub") === "default", `got ${slotMode("heroSub")}`);
}

if (SCENARIO === "D") {
  /* ── decision-point focus: quiet on load, force via store ── */
  const { focusStore } = await import("../src/esp/focus");
  check("clusters mounted", document.querySelectorAll("[data-focus-cluster]").length >= 3);
  check("no cluster active on load", document.querySelectorAll('[data-focus-active="true"]').length === 0);
  check("body not tagged on load", !document.body.dataset.decisionFocus);
  check("veil off on load", !document.querySelector(".decision-veil--on"));
  check("idle hero subtitle visible", !!Array.from(document.querySelectorAll(".cta")).find((b) =>
    b.textContent?.includes("Instant download")
  ));
  check("hero cluster present", !!document.querySelector('[data-focus-cluster="hero"]'));

  await act(async () => {
    focusStore.setForced("hero");
    await sleep(400);
  });

  const hero = document.querySelector('[data-focus-cluster="hero"]') as HTMLElement;
  check("forced hero is active", hero?.getAttribute("data-focus-active") === "true", `got ${hero?.getAttribute("data-focus-active")}`);
  check("body tagged hero", document.body.dataset.decisionFocus === "hero");
  check("cluster has focus class", !!hero?.className.includes("decision-focus--active"));
  check("focus hint slot stacked", (hero?.querySelectorAll(".focus-copy .esp-variant").length ?? 0) >= 2);

  const events = JSON.parse(sessionStorage.getItem("esp.events.v1") ?? "[]");
  check(
    "focus enter logged",
    events.some((e: { type: string; data?: { cluster?: string } }) => e.type === "focus" && e.data?.cluster === "hero")
  );

  await act(async () => {
    focusStore.setForced(null);
    focusStore.reset();
  });
}

/* ── kill switch: a fresh page with ?esp=off must be stock ── */
{
  await act(async () => {
    root.unmount();
  });
  dom.window.history.replaceState(null, "", `https://radioreach.test/${OFF_QUERY}`);
  // Fresh process in production would start at default; mirror that.
  espStore.setForced(null);
  espStore.setMode("default");
  const offContainer = document.createElement("div");
  document.body.appendChild(offContainer);
  const offRoot = createRoot(offContainer);
  // A new mount re-reads the flag inside initEsp().
  await act(async () => {
    offRoot.render(<SalesPage onCta={() => {}} />);
  });
  await sleep(700);
  const bodyMode = document.body.dataset.espMode ?? "default";
  check("?esp=off → default copy only", slotMode("heroSub") === "default" && bodyMode === "default", `mode=${slotMode("heroSub")} body=${bodyMode}`);
  check("?esp=off → original hero text", activeText("heroSub").includes("You finished the record"));
  await act(async () => {
    offRoot.unmount();
  });
}

if (SCENARIO === "D") {
  const { focusStore } = await import("../src/esp/focus");
  focusStore.reset();
  dom.window.history.replaceState(null, "", `https://radioreach.test/${FOCUS_OFF_QUERY}`);
  const focusOffContainer = document.createElement("div");
  document.body.appendChild(focusOffContainer);
  const focusOffRoot = createRoot(focusOffContainer);
  await act(async () => {
    focusOffRoot.render(<SalesPage onCta={() => {}} />);
  });
  await act(async () => {
    focusStore.setForced("hero");
    await sleep(400);
  });
  check("?focus=off ignores force", document.querySelectorAll('[data-focus-active="true"]').length === 0);
  await act(async () => {
    focusOffRoot.unmount();
  });
}

console.log(failures === 0 ? `\nScenario ${SCENARIO}: all integration checks passed.` : `\nScenario ${SCENARIO}: ${failures} check(s) FAILED.`);
dom.window.close();
// jsdom can leave the event loop alive — exit explicitly.
process.exit(failures > 0 ? 1 : 0);
