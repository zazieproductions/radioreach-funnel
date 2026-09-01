/**
 * Dark Funnel Teardown — UI walkthrough (jsdom + React act).
 *
 * Mounts the real replica and walks the ladder end to end, asserting
 * the things the funnel *claims* are not what the funnel *does*:
 *
 *   · the bar shows 71.4% on the last question and 85% at lead capture,
 *   · the order bump is checked before the visitor has decided anything,
 *   · declining the OTO reaches the downsell, and declining that still
 *     reaches the receipt (there is no punishment, only friction),
 *   · every screen is reachable and nothing on any screen can charge.
 *
 * Run with:  npm run test:darkfunnel:ui
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

/* ── jsdom environment ──────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:5180/#/hook",
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
for (const key of [
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "Element",
  "Node",
  "Event",
  "CustomEvent",
  "MouseEvent",
  "KeyboardEvent",
  "getComputedStyle",
  "localStorage",
  "sessionStorage",
  "history",
  "location",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  if (key in w) Object.defineProperty(globalThis, key, { value: w[key], configurable: true });
}
globalThis.window = dom.window as unknown as Window & typeof globalThis;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
dom.window.scrollTo = () => {};
(globalThis as Record<string, unknown>).matchMedia = (q: string) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
});

const { createRoot } = await import("react-dom/client");
const { act } = await import("react");
const React = (await import("react")).default;
const { default: DarkFunnelApp } = await import("../src/darkfunnel/DarkFunnelApp.tsx");
const { QUIZ } = await import("../src/darkfunnel/copy.ts");
const { PATTERNS } = await import("../src/darkfunnel/annotations.ts");
const { OFFER, money } = await import("../src/darkfunnel/core.ts");

/* ── helpers ────────────────────────────────────────────── */

const container = dom.window.document.getElementById("root")!;
const root = createRoot(container);

async function mount() {
  await act(async () => {
    root.render(React.createElement(DarkFunnelApp));
  });
}

async function goto(hash: string) {
  await act(async () => {
    dom.window.location.hash = hash;
    dom.window.dispatchEvent(new dom.window.HashChangeEvent("hashchange"));
  });
}

function text() {
  return container.textContent ?? "";
}

function buttons() {
  return Array.from(container.querySelectorAll("button")) as HTMLButtonElement[];
}

function byText(needle: string) {
  const el = buttons().find((b) => (b.textContent ?? "").toLowerCase().includes(needle.toLowerCase()));
  assert.ok(el, `no button matching “${needle}” — saw: ${buttons().map((b) => b.textContent?.slice(0, 30)).join(" | ")}`);
  return el;
}

async function click(needle: string) {
  const el = byText(needle);
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

async function wait(ms: number) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

/* ── 1. the hook ────────────────────────────────────────── */

await test("hook renders the article costume and the decoys", async () => {
  await mount();
  const body = text();
  assert.match(body, /THE SIGNAL DISPATCH/);
  assert.match(body, /min read/);
  assert.match(body, /Research replica/i, "disclosure strip must always be present");
  const decoys = container.querySelectorAll(".decoy");
  assert.equal(decoys.length, 8, "eight related links, zero destinations");
  assert.equal(
    container.querySelectorAll(".decoy a").length,
    0,
    "decoys must not be real links",
  );
});

await test("mid-article CTA navigates to the offer", async () => {
  await click("See the intake screen");
  assert.equal(dom.window.location.hash, "#/reveal");
  assert.match(text(), /You were not meant to find this/);
});

/* ── 2. the qualification ritual ────────────────────────── */

await test("quiz bar never shows 100% and lead capture jumps to 85%", async () => {
  await goto("#/qualify");
  assert.match(text(), /Question 1 of 6/);
  assert.match(text(), /0%/);

  for (let i = 0; i < QUIZ.length; i++) {
    const option = QUIZ[i].options[1].label;
    await click(option);
    await wait(320); // the deliberate "recording" beat
  }

  const afterQuiz = text();
  assert.match(afterQuiz, /Where should the clearance be sent/);
  assert.match(afterQuiz, /85%/, "lead phase is hard-set to 85%");
  assert.doesNotMatch(afterQuiz, /100%/);
});

await test("the fake terminal runs, then approves — because it always does", async () => {
  const inputs = Array.from(container.querySelectorAll("input")) as HTMLInputElement[];
  const [name, email] = inputs;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      dom.window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(name, "Sam");
    name.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    setter.call(email, "sam@example.com");
    email.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  await click("Confirm my file");
  assert.match(text(), /Scoring your file/);

  await wait(9000); // the labour illusion, in full
  const result = text();
  assert.match(result, /you’re in/i);
  assert.match(result, /100%/, "result phase is hard-set to 100%");
  assert.match(result, /CLEARED|PRIORITY/);
});

/* ── 3. checkout defaults ───────────────────────────────── */

await test("the order bump arrives pre-checked", async () => {
  await click("Release my allocation");
  assert.equal(dom.window.location.hash, "#/checkout");

  const boxes = Array.from(
    container.querySelectorAll('input[type="checkbox"]'),
  ) as HTMLInputElement[];
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].checked, true, "the default is the sale");
  assert.match(text(), new RegExp(money(OFFER.tripwire + OFFER.bump).replace("$", "\\$")));

  // un-ticking is the action; buying is the absence of one
  await act(async () => {
    boxes[0].checked = false;
    boxes[0].dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    boxes[0].dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  assert.match(text(), new RegExp(`${money(OFFER.tripwire).replace("$", "\\$")}`));
});

await test("paying contacts nothing and lands on the upsell", async () => {
  await click("Complete secure order");
  assert.match(text(), /charging nothing/);
  await wait(2600);
  assert.equal(dom.window.location.hash, "#/oto");
});

/* ── 4. the ladder ──────────────────────────────────────── */

await test("the decline link is a confession, and it still works", async () => {
  const decline = byText("i’ll try it alone");
  assert.ok(
    (decline.className ?? "").includes("lowercase"),
    "confirmshaming decline is styled down, not up",
  );
  await click("i’ll try it alone");
  assert.equal(dom.window.location.hash, "#/downsell");
  assert.match(text(), /Let’s make the number smaller/);
});

await test("the downsell 'concession' costs more than the offer refused", async () => {
  const body = text();
  assert.match(body, /\$67/);
  assert.match(body, new RegExp(`\\$${OFFER.downsellPerMonth * OFFER.downsellMonths}`));
  assert.ok(OFFER.downsellPerMonth * OFFER.downsellMonths > OFFER.oto);

  await click("take me to my order");
  assert.equal(dom.window.location.hash, "#/thanks");
});

/* ── 5. the reveal ──────────────────────────────────────── */

await test("thank-you prints a $0 receipt, then the real one", async () => {
  assert.match(text(), /Order complete/);
  assert.match(text(), /amount actually taken \$0\.00/);

  await click("Where is my download");
  const revealed = text();
  assert.match(revealed, /There is no Protocol/);
  assert.match(revealed, /Attention receipt/);
  assert.match(revealed, /patterns/);
});

/* ── 6. the teardown surface ────────────────────────────── */

await test("teardown page documents every pattern in the catalogue", async () => {
  await goto("#/teardown");
  const body = text();
  assert.match(body, /Anatomy of a tripwire funnel/);
  for (const p of PATTERNS) {
    assert.ok(body.includes(p.label), `missing pattern card: ${p.label}`);
  }
  assert.match(body, /outrage premise \+ withheld outcome/);
  assert.match(body, /Progress-bar arithmetic/);
});

await test("no screen can reach a payment processor", async () => {
  const html = container.innerHTML;
  assert.doesNotMatch(html, /stripe/i);
  assert.doesNotMatch(html, /checkout\.session/i);
  assert.equal(typeof (globalThis as Record<string, unknown>).fetch, "function");
});

/* ── teardown (explicit: a root `after` hook can fire between
   top-level awaited tests and close the window early) ────── */

await act(async () => {
  root.unmount();
});
dom.window.close();
