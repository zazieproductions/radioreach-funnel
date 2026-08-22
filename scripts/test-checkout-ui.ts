/**
 * Checkout UI tests (jsdom + React act).
 *
 * Verifies the Contract Info Guide add-on on the real Checkout component:
 * copy, optional-by-default state, total updates on select/remove, order
 * summary rows, mobile/desktop summary markup, and the onComplete state
 * callback used by the funnel (same state system as existing add-ons).
 *
 * Run with:
 *   node --experimental-test-module-mocks --import tsx --test scripts/test-checkout-ui.ts
 */
import { test, mock, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { pathToFileURL } from "node:url";
import path from "node:path";

/* ── jsdom environment ──────────────────────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:8788/#/checkout",
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
for (const key of [
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLLabelElement",
  "Element",
  "Node",
  "Event",
  "CustomEvent",
  "getComputedStyle",
  "localStorage",
  "sessionStorage",
  "history",
  "location",
  "matchMedia",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  if (key in w) Object.defineProperty(globalThis, key, { value: w[key], configurable: true });
}
globalThis.window = dom.window;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
if (!globalThis.matchMedia) {
  (globalThis as Record<string, unknown>).matchMedia = (q: string) => ({
    matches: false,
    media: q,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
}

/* ── Module mocks (must be registered before importing Checkout) ────────── */

const repoRoot = path.resolve(import.meta.dirname, "..");
const fileUrl = (p: string) => pathToFileURL(path.join(repoRoot, p)).href;

// Stub the Stripe embed so the test never needs a publishable key or network.
function StubEmbeddedStripe() {
  return null;
}
mock.module(fileUrl("src/funnel/EmbeddedStripeCheckout.tsx"), {
  defaultExport: StubEmbeddedStripe,
});

// Stub shared UI atoms that read Vite env at module scope.
mock.module(fileUrl("src/funnel/ui.tsx"), {
  namedExports: {
    SaleTimer: function StubSaleTimer() {
      return null;
    },
    Stars: function StubStars() {
      return null;
    },
  },
});

// Stub build-flag module (reads import.meta.env at module scope).
mock.module(fileUrl("src/config/features.ts"), {
  namedExports: {
    isMomentumSequenceEnabled: () => false,
    isSecretSlotsEnabled: () => false,
  },
});

/* ── React + component under test ───────────────────────────────────────── */

const React = (await import("react")) as typeof import("react");
const { createRoot } = await import("react-dom/client");
const { act } = React;
const { default: Checkout } = await import("../src/funnel/Checkout");

type Addons = { contracts: boolean; au: boolean; contractGuide: boolean };

let container: HTMLElement;
let root: import("react-dom/client").Root;
let completed: { total: number; addons: Addons } | null = null;

function visibleText(el: HTMLElement) {
  return el.textContent || "";
}

function findGuideCheckbox(scope: HTMLElement) {
  const input = scope.querySelector<HTMLInputElement>(
    'input[type="checkbox"][aria-label="Add the RadioReach Indie Artist Contract Info Guide"]'
  );
  if (!input) throw new Error("guide checkbox not found");
  return input;
}

async function renderCheckout() {
  completed = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(
      React.createElement(Checkout, {
        onComplete: (total: number, addons: Addons) => {
          completed = { total, addons };
        },
      })
    );
  });
}

beforeEach(async () => {
  await renderCheckout();
});

after(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  dom.window.close();
});

/* ── Tests ──────────────────────────────────────────────────────────────── */

test("add-on card shows the approved copy and is not preselected", async () => {
  const text = visibleText(container);

  // Required copy
  assert.ok(text.includes("Protect Your Music Before You Sign"), "headline");
  assert.ok(
    text.includes("RadioReach Indie Artist Contract Info Guide (PDF)"),
    "product name"
  );
  assert.ok(
    text.includes(
      "Understand contracts, catch red flags, protect your rights, and negotiate with confidence."
    ),
    "description"
  );
  assert.ok(text.includes("Instant PDF Access"), "badge");
  assert.ok(text.includes("Add for $10"), "price label");
  assert.ok(
    text.includes(
      "Learn how to review label, producer, publishing, management, distribution, and collaboration agreements in plain English."
    ),
    "value line"
  );
  // Clearly optional
  assert.ok(text.includes("Optional add-ons"), "optional add-ons section");
  assert.ok(text.includes("Tap to add or remove"), "removal hint");

  const guide = findGuideCheckbox(container);
  assert.equal(guide.checked, false, "guide is not preselected");
  assert.equal(guide.disabled, false, "guide is available to all users");

  // No fake rating on the card (badge is plain text, not stars)
  const card = guide.closest("label");
  assert.ok(card, "guide sits inside a clickable label card");
  assert.ok(!card!.textContent?.includes("★"), "no star decoration on the guide card");
});

test("base total is $20.00 without the add-on", async () => {
  const text = visibleText(container);
  assert.ok(text.includes("$20.00"), "base total shown");
  assert.ok(!text.includes("$30.00"), "no $30 total before selection");

  // Order summary has no guide row initially.
  const shortNameSpans = Array.from(container.querySelectorAll("span")).filter(
    (s) => s.textContent === "Contract Info Guide"
  );
  assert.equal(shortNameSpans.length, 0, "no guide line in order summary");
});

test("selecting the add-on adds $10 to the displayed total", async () => {
  const guide = findGuideCheckbox(container);

  await act(async () => {
    guide.click();
  });

  assert.equal(guide.checked, true, "checkbox reflects selection");
  const text = visibleText(container);
  assert.ok(text.includes("$30.00"), "total updates to $30.00");
  // Mobile details + desktop summary both render the total.
  const totals = Array.from(container.querySelectorAll("span")).filter(
    (s) => s.textContent === "$30.00"
  );
  assert.ok(totals.length >= 2, "mobile and desktop totals both updated");

  // Order summary now lists the guide row.
  const shortNameSpans = Array.from(container.querySelectorAll("span")).filter(
    (s) => s.textContent === "Contract Info Guide"
  );
  assert.equal(shortNameSpans.length, 2, "guide row in mobile + desktop summaries");
});

test("removing the add-on restores the base total", async () => {
  const guide = findGuideCheckbox(container);

  await act(async () => {
    guide.click();
  });
  assert.ok(visibleText(container).includes("$30.00"), "added");

  await act(async () => {
    guide.click();
  });

  assert.equal(guide.checked, false, "removed");
  const text = visibleText(container);
  assert.ok(text.includes("$20.00"), "back to base total");
  assert.ok(!text.includes("$30.00"), "no add-on total remains");
  const shortNameSpans = Array.from(container.querySelectorAll("span")).filter(
    (s) => s.textContent === "Contract Info Guide"
  );
  assert.equal(shortNameSpans.length, 0, "guide row removed from summaries");
});

test("clicking the card label toggles the add-on", async () => {
  const guide = findGuideCheckbox(container);
  const label = guide.closest("label") as HTMLElement;

  await act(async () => {
    label.click();
  });

  assert.equal(
    guide.checked,
    true,
    "label activation selects the add-on (clickable card behavior)"
  );
  assert.ok(visibleText(container).includes("$30.00"));
});

test("onComplete passes the same add-on state used by the funnel", async () => {
  const guide = findGuideCheckbox(container);
  await act(async () => {
    guide.click();
  });

  // The hidden sync callback mirrors state into App-level funnel state.
  const sync = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === "sync"
  ) as HTMLButtonElement;
  assert.ok(sync, "state sync callback exists");

  await act(async () => {
    sync.click();
  });

  assert.deepEqual(completed, {
    total: 30,
    addons: { contracts: false, au: false, contractGuide: true },
  });

  // Removing first, then syncing, reports no guide.
  await act(async () => {
    guide.click();
    sync.click();
  });
  assert.deepEqual(completed, {
    total: 20,
    addons: { contracts: false, au: false, contractGuide: false },
  });
});

test("mobile and desktop order summaries are both present", async () => {
  // Mobile: <details> total with lg:hidden; Desktop: hidden lg:block section.
  const mobileDetails = container.querySelector('details[class*="lg:hidden"]');
  assert.ok(mobileDetails, "mobile order total present");
  assert.ok(
    mobileDetails?.textContent?.includes("Order total"),
    "mobile total label"
  );

  const desktopSummary = Array.from(container.querySelectorAll("section")).find(
    (s) => s.className.includes("hidden") && s.className.includes("lg:block")
  );
  assert.ok(desktopSummary, "desktop order summary present");
  assert.ok(desktopSummary?.textContent?.includes("Order summary"));
});

test("existing add-ons remain untouched and off by default", async () => {
  const checkboxes = Array.from(container.querySelectorAll<HTMLInputElement>("input[type=checkbox]"));
  const labels = checkboxes.map((c) => c.getAttribute("aria-label"));
  assert.ok(labels.includes("Radio Reach Vault included"), "vault checkbox present");

  // Contract Kit + AU list exist and stay disabled without a jackpot (existing behavior).
  const text = visibleText(container);
  assert.ok(text.includes("The Indie Music Contract Kit"), "contract kit present");
  assert.ok(text.includes("Australian Radio Stations Contact List"), "AU list present");

  const guide = findGuideCheckbox(container);
  assert.equal(guide.checked, false);
  const totalSpans = Array.from(container.querySelectorAll("span")).filter(
    (s) => s.textContent === "$20.00"
  );
  assert.ok(totalSpans.length >= 2, "unchanged base total");
});
