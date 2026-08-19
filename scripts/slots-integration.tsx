/* ─────────────────────────────────────────────────────────────
   Secret Slots — jsdom integration scenario
   ─────────────────────────────────────────────────────────────
   Mounts the real SecretSlotsSection and drives a real spin with
   a controllable fake clock:

     ✓ quiet teaser row at rest (less prominent than the wheel)
     ✓ teaser expands the machine; pull → near-miss → reveal
     ✓ the reveal ALWAYS shows the PlaylistPush insider code FR2AZEF
     ✓ NO outbound affiliate link anywhere
     ✓ collapse hides the machine again; fresh visit stays hidden

   Run via:  npm run test:slots  (see scripts/run-slots-tests.mjs)
───────────────────────────────────────────────────────────── */

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import assert from "node:assert/strict";
import SecretSlotsSection from "../src/funnel/SecretSlots";
import { PLAYLISTPUSH_CODE } from "../src/lib/secretCode";

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
define("CustomEvent", dom.window.CustomEvent);
define("Event", dom.window.Event);
define("sessionStorage", dom.window.sessionStorage);
define("localStorage", dom.window.localStorage);
define("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
define("IS_REACT_ACT_ENVIRONMENT", true);
define("requestAnimationFrame", dom.window.requestAnimationFrame.bind(dom.window));
define("cancelAnimationFrame", dom.window.cancelAnimationFrame.bind(dom.window));

const w = dom.window as unknown as Record<string, unknown>;
w.matchMedia = (q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

// ── fake clock: the machine's choreography is ~4.5s of real timers.
//    We swap the window timers for a controllable queue so the test
//    runs in milliseconds instead of seconds.
type TimerEntry = { fn: () => void; at: number; interval: number | null };
let clock = 0;
let nextTimerId = 1;
const timerQueue = new Map<number, TimerEntry>();

w.setTimeout = (fn: () => void, ms: number) => {
  const id = nextTimerId++;
  timerQueue.set(id, { fn, at: clock + ms, interval: null });
  return id;
};
w.clearTimeout = (id: number) => {
  timerQueue.delete(id);
};
w.setInterval = (fn: () => void, ms: number) => {
  const id = nextTimerId++;
  timerQueue.set(id, { fn, at: clock + ms, interval: ms });
  return id;
};
w.clearInterval = (id: number) => {
  timerQueue.delete(id);
};
w.requestAnimationFrame = (fn: () => void) => {
  fn();
  return 0;
};

function advance(ms: number) {
  const target = clock + ms;
  let guard = 0;
  while (guard++ < 20000) {
    let next: { id: number; entry: TimerEntry } | null = null;
    for (const [id, entry] of timerQueue) {
      if (entry.at <= target && (!next || entry.at < next.entry.at)) next = { id, entry };
    }
    if (!next) break;
    clock = next.entry.at;
    if (next.entry.interval != null) {
      next.entry.at += next.entry.interval;
    } else {
      timerQueue.delete(next.id);
    }
    next.entry.fn();
  }
  clock = target;
}

async function main() {
  const body = dom.window.document.body;
  body.innerHTML = "";
  let root = createRoot(body);

  // ── mount: quiet teaser at rest, machine + code hidden ──
  await act(async () => {
    root.render(<SecretSlotsSection />);
  });
  const text = () => body.textContent ?? "";
  assert.ok(
    text().includes("THE OTHER HALF OF THE GAME"),
    "section headline should render"
  );
  assert.ok(
    text().includes("The code isn't public"),
    "quiet teaser row should render at rest"
  );
  assert.ok(!text().includes("Pull the lever"), "machine must be collapsed at rest");
  assert.ok(!text().includes(PLAYLISTPUSH_CODE), "code must be hidden before any spin");
  assert.ok(
    !body.querySelector('a[href*="playlistpush"], a[href*="playlist-push"]'),
    "no external affiliate link should render"
  );
  console.log("  ✓ quiet teaser renders; machine and code stay hidden");

  // ── teaser expands the machine ──
  const teaser = body.querySelector<HTMLButtonElement>("button");
  assert.ok(teaser && teaser.textContent?.includes("Spin the reels"), "teaser CTA should render");
  await act(async () => {
    teaser.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  const lever = body.querySelector<HTMLButtonElement>("button");
  assert.ok(lever && lever.textContent?.includes("Pull the lever"), "machine should expand with the lever");
  console.log("  ✓ teaser expands the machine (cabinet + lever)");

  // ── spin: near-miss beat then reveal ──
  await act(async () => {
    lever.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  assert.ok(lever.disabled, "lever disabled while spinning");
  assert.ok(text().includes("Spinning"), "spinning status announced");
  console.log("  ✓ lever click starts the spin and locks the button");

  // Advance to the near-miss moment: reels 1-2 on KEY, reel 3 on LOCK.
  await act(async () => {
    advance(3300);
  });
  assert.ok(text().includes("still locked"), "near-miss suspense announced");
  console.log("  ✓ near-miss beat announced (third reel still locked)");

  // Advance through the nudge + reveal.
  await act(async () => {
    advance(2500);
  });
  assert.ok(
    text().includes(`Code unlocked: ${PLAYLISTPUSH_CODE}`),
    "win status should announce the code"
  );
  assert.ok(text().includes(PLAYLISTPUSH_CODE), "code visible in the reveal card");
  assert.ok(text().includes("SHH"), "secret framing headline should render");
  assert.ok(
    text().includes("PlaylistPush's checkout"),
    "one actionable checkout instruction should render"
  );
  assert.ok(
    !text().includes("A genuine insider code for PlaylistPush campaigns"),
    "redundant subline must not repeat the code card's message"
  );
  assert.ok(
    !text().includes("I get a small cut"),
    "bulky affiliate disclosure must not clutter the reveal card (moved to the FTC disclaimer)"
  );
  assert.ok(
    !body.querySelector('a[href*="playlistpush"], a[href*="playlist-push"]'),
    "reveal card must not contain an affiliate link"
  );
  console.log("  ✓ spin always lands the secret combo and reveals FR2AZEF");

  // ── copy button ──
  const copyBtn = [...body.querySelectorAll("button")].find((b) => b.textContent?.includes("Copy code"));
  assert.ok(copyBtn, "copy button should render");
  await act(async () => {
    copyBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    advance(50);
  });
  assert.ok(text().includes("Copied"), "copy button should flip to Copied");
  console.log("  ✓ copy button flips to Copied");

  // ── collapse: machine and code tuck back into the teaser ──
  const hideBtn = [...body.querySelectorAll("button")].find((b) => b.textContent?.includes("Hide machine"));
  assert.ok(hideBtn, "hide control should render");
  await act(async () => {
    hideBtn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  assert.ok(!text().includes(PLAYLISTPUSH_CODE), "collapsing hides the machine and code");
  assert.ok(text().includes("View the code"), "teaser should reflect the unlocked state");
  console.log("  ✓ machine collapses back to the quiet teaser");

  // ── reopening within the same visit shows the earned code ──
  const teaser2 = body.querySelector<HTMLButtonElement>("button");
  assert.ok(teaser2 && teaser2.textContent?.includes("View the code"), "teaser should offer the code");
  await act(async () => {
    teaser2.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  assert.ok(text().includes(PLAYLISTPUSH_CODE), "reopening shows the unlocked code");
  console.log("  ✓ reopened machine shows the code earned this visit");

  // ── fresh visit: everything hidden again ──
  await act(async () => {
    root.unmount();
    body.innerHTML = "";
    root = createRoot(body);
    root.render(<SecretSlotsSection />);
  });
  assert.ok(
    !text().includes(PLAYLISTPUSH_CODE),
    "fresh visit must not reveal the code before spinning"
  );
  const teaser3 = body.querySelector<HTMLButtonElement>("button");
  assert.ok(teaser3 && teaser3.textContent?.includes("Spin the reels"), "fresh visit shows the un-spun teaser");
  await act(async () => {
    teaser3.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  const lever2 = body.querySelector<HTMLButtonElement>("button");
  assert.ok(lever2 && lever2.textContent?.includes("Pull the lever"), "fresh machine mounts idle");
  console.log("  ✓ fresh visit starts hidden — the code waits for a spin");

  await act(async () => {
    lever2.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    advance(6500);
  });
  assert.ok(
    text().includes(PLAYLISTPUSH_CODE),
    "spinning again reveals the code"
  );
  console.log("  ✓ spinning again reveals the code");

  await act(async () => {
    root.unmount();
  });
  console.log("\n✔ Secret Slots integration scenario passed.");
  return 0;
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
