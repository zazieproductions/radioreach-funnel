/**
 * Frequency Dominion classroom + curriculum tests (jsdom + React act).
 *
 * Renders the real CourseClassroom and CourseSalesPage and verifies the
 * $97-deliverable contract:
 *   - START HERE screen renders before m1l1
 *   - every lesson script is deep (≥1000 words) with beats/drill/doneWhen/failure
 *   - worked example exists for every lesson id, and the drawer renders it
 *   - module 02 is drill-gated; completing module 01's 4 drills unlocks it
 *   - the "I'm reviewing" toggle unlocks everything
 *   - day-of-campaign mode points to the right lessons
 *   - sales page stack counts match the real FD_FILES registry
 *
 * Run with:
 *   node --import tsx --test scripts/test-course.ts
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { pathToFileURL } from "node:url";
import path from "node:path";

/* ── jsdom environment ──────────────────────────────────────────────────── */

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:8788/#/course/classroom",
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

/* ── modules under test ─────────────────────────────────────────────────── */

const repoRoot = path.resolve(import.meta.dirname, "..");
const fileUrl = (p: string) => pathToFileURL(path.join(repoRoot, p)).href;

const React = (await import("react")) as typeof import("react");
const { createRoot } = await import("react-dom/client");
const { act } = React;
const { default: CourseClassroom } = await import("../src/course/CourseClassroom");
const { default: CourseSalesPage } = await import("../src/course/CourseSalesPage");
const { MODULES, CAMPAIGN_DAY_PLAN, courseStats } = await import("../src/course/curriculum");
const { EXAMPLE_SECTIONS, WAR_ROOM, LOG, EXAMPLE_DISCLAIMER, PITCH_90 } = await import(
  "../src/course/workedExample"
);
const { FD_FILES } = await import("../src/course/assets");

let container: HTMLElement;
let root: import("react-dom/client").Root;

function text() {
  return container.textContent || "";
}

function renderClassroom() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(React.createElement(CourseClassroom, { onBack: () => {}, onBuy: () => {} }));
  });
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new Event("click", { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
});

/* ── curriculum depth contract ──────────────────────────────────────────── */

test("24 lessons, 6 modules, every script ≥1000 words with full scaffolding", () => {
  const lessons = MODULES.flatMap((m) => m.lessons);
  assert.equal(MODULES.length, 6);
  assert.equal(lessons.length, 24);
  for (const l of lessons) {
    const words = l.script.split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 1000, `${l.id} script too thin: ${words} words`);
    assert.ok(l.beats.length >= 4, `${l.id} missing on-screen beats`);
    assert.ok(l.drill.length > 10 && l.doneWhen.length > 10, `${l.id} missing drill/doneWhen`);
    assert.ok(l.failure.fail.length > 10 && l.failure.fix.length > 10, `${l.id} missing failure/fix`);
    assert.ok(EXAMPLE_SECTIONS[l.id], `${l.id} has no worked-example section`);
  }
});

test("worked example is complete: 20-station war room, 21-day log, 88-word pitch, disclaimer", () => {
  assert.equal(WAR_ROOM.length, 20);
  for (const r of WAR_ROOM) assert.ok(r.contact && r.role && r.score >= 0 && r.score <= 5);
  assert.equal(LOG.length, 21);
  const kinds = new Set(LOG.map((l) => l.kind));
  for (const k of ["silence", "reply", "no", "add", "interview"]) assert.ok(kinds.has(k), `log missing ${k}`);
  assert.equal(PITCH_90.wordCount, 88);
  assert.ok(EXAMPLE_DISCLAIMER.includes("fictional"));
});

/* ── classroom behavior ─────────────────────────────────────────────────── */

test("START HERE screen renders before m1l1 and shows the example", () => {
  renderClassroom();
  const t = text();
  assert.ok(t.includes("START HERE"));
  assert.ok(t.includes("Marisol Vega"));
  assert.ok(t.includes("20 stations, not 2,000"));
  // module 1 lesson button is present and enabled
  const m1 = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("The unheard tax"));
  assert.ok(m1 && !(m1 as HTMLButtonElement).disabled);
});

test("module 02 is locked until module 01's drills are complete, then unlocks", () => {
  renderClassroom();
  const heatMap = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Hometown heat map")
  );
  assert.ok(heatMap, "m2 lesson button rendered");
  assert.ok((heatMap as HTMLButtonElement).disabled, "m2 should be locked before m1 drills");
  assert.ok(text().includes("locked"));

  // Complete all four module-01 drills via the lesson screens.
  const m1Ids = MODULES[0].lessons.map((l) => l.id);
  const lessonTitles = MODULES[0].lessons.map((l) => l.title);
  for (const title of lessonTitles) {
    const btn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(title));
    click(btn!);
    const mark = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Mark drill complete")
    );
    assert.ok(mark, `mark button for ${title}`);
    click(mark);
  }
  const doneMap = JSON.parse(localStorage.getItem("rr:fd:done") || "{}");
  for (const id of m1Ids) assert.ok(doneMap[id], `${id} not persisted`);

  const heatMapAfter = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Hometown heat map")
  );
  assert.ok(!(heatMapAfter as HTMLButtonElement).disabled, "m2 should unlock after m1 drills");
});

test("'I'm reviewing' toggle unlocks all modules without drills", () => {
  renderClassroom();
  const toggle = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("I'm reviewing"));
  click(toggle!);
  const empireLoopLesson = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("The 90-day dominion review")
  );
  assert.ok(!(empireLoopLesson as HTMLButtonElement).disabled);
  assert.equal(JSON.parse(localStorage.getItem("rr:fd:review") || "false"), true);
});

test("lesson view shows script, drill, failure→fix, files, and the worked-example drawer", () => {
  renderClassroom();
  const review = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("I'm reviewing"));
  click(review!); // unlock all modules for the lesson view
  const btn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("The 90-word pitch"));
  click(btn!);
  const t = text();
  assert.ok(t.includes("Ninety words"), "script body");
  assert.ok(t.includes("Done when:"), "done definition");
  assert.ok(t.includes("Common failure → fix"), "failure card");
  assert.ok(t.includes("On screen"), "beats");
  assert.ok(t.includes("90-word pitch"), "file chips");
  // open the drawer
  const drawerBtn = [...container.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("tap to open")
  );
  if (!drawerBtn) {
    // desktop: drawer opens on lesson select when already open; toggle via the example header button
    const exBtn = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Worked example"));
    click(exBtn!);
  } else {
    click(drawerBtn);
  }
  assert.ok(text().includes("The filled 90-word pitch"), "drawer content");
});

test("day-of-campaign mode maps days to lessons and actions", () => {
  renderClassroom();
  const select = container.querySelector("select");
  assert.ok(select, "day selector rendered");
  act(() => {
    select!.value = "8";
    select!.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const t = text();
  assert.ok(t.includes("Day-of-campaign mode"));
  assert.ok(t.includes("30-second hook to non-responders"));
  assert.ok(t.includes("Open m4l3"));
  // full plan sanity: 0..21 present with actions
  assert.equal(CAMPAIGN_DAY_PLAN.length, 12);
  for (const p of CAMPAIGN_DAY_PLAN) assert.ok(p.actions.length >= 2 && p.lessonIds.length >= 1);
});

/* ── sales page contract ────────────────────────────────────────────────── */

test("sales page stack lists concrete counts from the real file registry", () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(CourseSalesPage, { onCta: () => {}, onClassroom: () => {}, onVault: () => {} })
    );
  });
  const t = text();
  const stats = courseStats();
  assert.ok(t.includes(`${stats.lessonCount} spoken lesson scripts`));
  assert.ok(t.includes(stats.scriptWords.toLocaleString("en-US")));
  assert.ok(t.includes(`${FD_FILES.filter((f) => f.path.startsWith("swipe-file/")).length}-piece swipe file`));
  assert.ok(t.includes("1 complete worked example"));
  assert.ok(t.includes("no guaranteed spins"));
  // image referenced from public/
  assert.ok(container.querySelector('img[src="/images/frequency-dominion-cover.jpg"]'));
});
