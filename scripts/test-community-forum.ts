/**
 * Community forum UI tests (jsdom + React act).
 *
 * Renders the real CommunityForum component (concept build) and verifies:
 * archive stats, thread list with pinned-first ordering, thread detail,
 * the persistent upvote system, locked-thread behavior, search filtering,
 * category filters, sort modes, quote prefill, and the guest reply
 * composer (with localStorage persistence). Plus source-level checks that
 * the sales page teaser section and the #/community route are wired up.
 *
 * Run with:
 *   node --import tsx --test scripts/test-community-forum.ts
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

/* ── jsdom environment ──────────────────────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:8788/#/community",
  pretendToBeVisual: true,
});

const w = dom.window as unknown as Record<string, unknown>;
for (const key of [
  "document",
  "navigator",
  "HTMLElement",
  "Element",
  "Node",
  "Event",
  "CustomEvent",
  "getComputedStyle",
  "localStorage",
  "sessionStorage",
  "requestAnimationFrame",
  "cancelAnimationFrame",
]) {
  if (key in w) Object.defineProperty(globalThis, key, { value: w[key], configurable: true });
}
globalThis.window = dom.window;
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
w.scrollTo = () => {};
(globalThis.window as unknown as Record<string, unknown>).scrollTo = () => {};
// jsdom lacks Element.scrollIntoView (used by the quote button).
(globalThis.Element as unknown as { prototype: Record<string, unknown> }).prototype.scrollIntoView =
  () => {};

/* ── component under test ───────────────────────────────────────────────── */

const repoRoot = path.resolve(import.meta.dirname, "..");
const fileUrl = (p: string) => pathToFileURL(path.join(repoRoot, p)).href;

const React = (await import("react")) as typeof import("react");
const { createRoot } = await import("react-dom/client");
const { act } = React;
const { default: CommunityForum } = await import("../src/funnel/CommunityForum");
const { THREADS, USERS } = await import("../src/funnel/forumData");

let container: HTMLElement;
let root: import("react-dom/client").Root;

function text() {
  return container.textContent || "";
}

function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

/* ── helpers ────────────────────────────────────────────────────────────── */

/** Click a thread row by matching its title text. */
async function openThread(titlePart: string) {
  const row = [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes(titlePart),
  );
  assert.ok(row, `thread row containing "${titlePart}" not found`);
  await act(async () => {
    row.dispatchEvent(new w.Event("click", { bubbles: true, cancelable: true }));
  });
}

/** The upvote button of the post with id `post-N`. */
function voteButton(postIndex: number) {
  const post = container.querySelector(`#post-${postIndex}`);
  assert.ok(post, `post-${postIndex} not found`);
  const btn = [...post.querySelectorAll("button")].find((b) =>
    b.getAttribute("aria-label")?.startsWith("Upvote"),
  );
  assert.ok(btn, `vote button on post-${postIndex} not found`);
  return btn as HTMLButtonElement;
}

/** Set an input/textarea value bypassing React's value tracker. */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = Object.getPrototypeOf(el); // HTMLInputElement/HTMLTextAreaElement prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new w.Event("input", { bubbles: true }));
  });
}

/* ── tests ──────────────────────────────────────────────────────────────── */

test("renders archive chrome, stats, and every thread", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  assert.match(text(), /THE COMMUNITY/);
  // No fabricated aggregate claims: the stats strip shows a New thread CTA
  // instead of member/thread/post totals or a board age.
  const newBtn = [...container.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "") === "＋ New thread",
  );
  assert.ok(newBtn, "new thread CTA present");
  assert.ok(!/\d{1,3},\d{3}\s+(members|threads|posts)/i.test(text()), "no volume claims");
  for (const t of THREADS) {
    assert.ok(text().includes(t.title.slice(0, 40)), `missing thread: ${t.title.slice(0, 40)}`);
  }
});

test("pinned threads sort before the rest regardless of mode", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  const titles = [...container.querySelectorAll("li > button")].map(
    (b) => (b.querySelector("p.font-serif") as HTMLElement)?.textContent ?? "",
  );
  const firstPinned = titles.findIndex((t) => t.startsWith("READ FIRST"));
  const welcomeIdx = titles.findIndex((t) => t.startsWith("The one-pitch rule"));
  const skepticIdx = titles.findIndex((t) => t.startsWith("Color me unconvinced"));
  // Both pinned threads precede every non-pinned thread.
  assert.ok(firstPinned !== -1 && welcomeIdx !== -1 && skepticIdx !== -1);
  assert.ok(Math.max(firstPinned, welcomeIdx) < skepticIdx);
});

test("thread detail renders posts, voices, and metadata", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  await openThread("I'm a music director. Here's what makes me delete");
  assert.match(text(), /delete your email/i);
  assert.match(text(), /Started by BeccaNoncomm/);
  assert.match(text(), /Joined Feb 2018/);
  assert.match(text(), /Music Director, 3kW non-comm FM/);
  // A quoted line from the thread body is rendered.
  assert.match(text(), /Dear Sir\/Madam/);
});

test("upvote toggles, adjusts the count, and persists to localStorage", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  // Pick a thread whose OP count (84) visibly changes when upvoted (→ 85).
  await openThread("Week one with the 18k edition");

  const btn = voteButton(0);
  const before = container.querySelector("#post-0")!.textContent ?? "";
  await act(async () => {
    btn.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  assert.equal(btn.getAttribute("aria-pressed"), "true");
  const after = container.querySelector("#post-0")!.textContent ?? "";
  assert.ok(after.includes("85"), `vote count should read 85 after upvote (was 84): ${before}`);

  const stored = JSON.parse(localStorage.getItem("rr_forum_votes_v1") ?? "{}");
  assert.ok(Object.keys(stored).length === 1, "vote should persist");

  // Toggle off restores the original count and clears storage.
  await act(async () => {
    btn.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  assert.equal(btn.getAttribute("aria-pressed"), "false");
  assert.equal(
    JSON.parse(localStorage.getItem("rr_forum_votes_v1") ?? "{}") &&
      Object.keys(JSON.parse(localStorage.getItem("rr_forum_votes_v1")!)).length,
    0,
  );
});

test("locked thread shows the lock notice and disables the composer", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  await openThread("Is radio promo even worth it right now");
  assert.match(text(), /Thread locked/i);
  assert.match(text(), /Replies are disabled/i);
  assert.equal(container.querySelector("#reply-box"), null);
  // The moderator's removal placeholder renders.
  assert.match(text(), /removed by moderator/);
});

test("search narrows the list and reset restores it", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  const input = container.querySelector('input[type="search"]') as HTMLInputElement;
  assert.ok(input);
  await typeInto(input, "mail merge");
  assert.match(text(), /regrettable events/);
  assert.ok(!text().includes("Week one with the 18k edition"));

  await typeInto(input, "zzzz-no-match-zzzz");
  assert.match(text(), /NO THREADS MATCH/);
});

test("category chips filter to a single board", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  const chip = [...container.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "") === "From the other inbox",
  );
  assert.ok(chip, "stations category chip not found");
  await act(async () => {
    chip!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  const rows = [...container.querySelectorAll("li > button p.font-serif")];
  assert.ok(rows.length >= 2, "station threads visible");
  assert.ok(text().includes("AI-written pitches"));
  assert.ok(!text().includes("Color me unconvinced"), "other boards hidden");
});

test("guest reply appends a post and persists it across remounts", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  await openThread("Week one with the 18k edition");
  const box = container.querySelector("#reply-box") as HTMLTextAreaElement;
  assert.ok(box, "composer present on unlocked thread");
  assert.match(text(), /Posting as guest_\d{4}/);

  await typeInto(
    box,
    "testing from the fake internet: 40 sent, 2 spins, still shaking",
  );
  const postBtn = [...container.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "").includes("Post reply"),
  );
  assert.ok(postBtn);
  await act(async () => {
    postBtn!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  assert.match(text(), /still shaking/);
  assert.match(text(), /Posted\./);

  // Remount: the reply survived localStorage.
  await act(async () => root.unmount());
  container.remove();
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  await openThread("Week one with the 18k edition");
  assert.match(text(), /still shaking/);
  assert.ok(USERS.guest, "guest persona exists for posted replies");
});

test("quote button prefills the composer with attribution", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  await openThread("Charting on NACC");
  const post = container.querySelector("#post-0")!;
  const quoteBtn = [...post.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "") === "Quote",
  );
  assert.ok(quoteBtn);
  await act(async () => {
    quoteBtn!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  const box = container.querySelector("#reply-box") as HTMLTextAreaElement;
  assert.match(box.value, /^> quietframe wrote:/);
});

test("sales page teaser section and #/community route are wired into the app", () => {
  const sales = fs.readFileSync(path.join(repoRoot, "src/funnel/SalesPage.tsx"), "utf8");
  assert.ok(sales.includes('id="community"'), "teaser section anchor exists");
  assert.ok(sales.includes('href="#/community"'), "teaser CTA links to the forum");
  assert.ok(sales.includes("ASKED. ARGUED."), "teaser headline renders");
  assert.ok(!/NINE YEARS/i.test(sales), "no board-age claims on the sales page");
  assert.ok(!/\b51,000 posts\b/.test(sales), "no post-volume claims on the sales page");

  const app = fs.readFileSync(path.join(repoRoot, "src/App.tsx"), "utf8");
  assert.ok(app.includes('hash.startsWith("#/community")'), "route branch exists");
  assert.ok(app.includes("CommunityForum"), "lazy import exists");

  const nav = fs.readFileSync(path.join(repoRoot, "src/funnel/ui.tsx"), "utf8");
  assert.ok(nav.includes('href: "#/community"'), "top nav link exists");
});

/* ── new-thread composer + simulated replies ────────────────────────────── */

/** Poll until cond() is true (sim replies arrive on real timers). */
async function waitFor(cond: () => boolean, ms = 12000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return cond();
}

test("guest threads persist to localStorage and join the real list", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });

  const open = [...container.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "") === "＋ New thread",
  );
  assert.ok(open, "composer toggle present");
  await act(async () => {
    open!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });

  const titleInput = container.querySelector(
    'input[aria-label="Thread title"]',
  ) as HTMLInputElement;
  const bodyInput = container.querySelector(
    'textarea[aria-label="Thread body"]',
  ) as HTMLTextAreaElement;
  assert.ok(titleInput && bodyInput, "composer fields render");

  await typeInto(titleInput, "how long should my subject line be for country stations?");
  await typeInto(bodyInput, "testing thread creation: subject line question, genre is alt-country");

  const post = [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("Post thread"),
  );
  assert.ok(post, "post thread button present");
  await act(async () => {
    post!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });

  // Landed inside the new thread, posted as the guest handle.
  assert.match(text(), /how long should my subject line be/i);
  assert.match(text(), new RegExp(`Started by guest_\\d{4}`));

  const stored = JSON.parse(localStorage.getItem("rr_forum_threads_v1") ?? "[]");
  assert.equal(stored.length, 1, "thread persisted");
  assert.match(stored[0].title, /subject line/i);
});

test("a regular types and answers the new thread (simulated reply, persisted)", async () => {
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });

  const open = [...container.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "") === "＋ New thread",
  );
  await act(async () => {
    open!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  const titleInput = container.querySelector('input[aria-label="Thread title"]') as HTMLInputElement;
  const bodyInput = container.querySelector('textarea[aria-label="Thread body"]') as HTMLTextAreaElement;
  await typeInto(titleInput, "follow up question: how many times should i nudge");
  await typeInto(bodyInput, "wondering about the follow up etiquette");
  const post = [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("Post thread"),
  );
  await act(async () => {
    post!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });

  // Outside act(): the sim reply lands on a timer. Quiet the act env for polling.
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = false;
  try {
    // Wait on persisted state, not DOM text: the typing indicator also
    // shows the persona name before the reply lands.
    const simArrived = () => {
      const replies = JSON.parse(localStorage.getItem("rr_forum_replies_v1") ?? "[]");
      return replies.some(
        (r: { author?: string; body: string }) =>
          r.author && /follow-up|nudge|stop|ten days/i.test(r.body),
      );
    };
    const arrived = await waitFor(simArrived, 12000);
    assert.ok(arrived, "a simulated regular replied");
    const replies = JSON.parse(localStorage.getItem("rr_forum_replies_v1") ?? "[]");
    const sim = replies.find((r: { author?: string }) => r.author);
    assert.ok(sim?.author, "sim reply persisted with its author");
    assert.match(sim.body, /follow-up|nudge|stop/i);
  } finally {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  }

  // The reply survives a remount like any other post.
  await act(async () => root.unmount());
  container.remove();
  render();
  await act(async () => {
    root.render(React.createElement(CommunityForum, { onBack: () => {} }));
  });
  const row = [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").includes("how many times should i nudge"),
  );
  assert.ok(row, "guest thread listed after remount");
  await act(async () => {
    row!.dispatchEvent(new w.Event("click", { bubbles: true }));
  });
  assert.match(text(), /quietframe|vinylghost/);
});
