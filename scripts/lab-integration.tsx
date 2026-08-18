/* ─────────────────────────────────────────────────────────────
   Conversion Lab — jsdom integration scenarios
   ─────────────────────────────────────────────────────────────
   Mounts the real LabGallery and drives real interactions:

     SCENARIO=A  gallery renders every prototype + variant QA
     SCENARIO=B  URL override forces a variant (?lab=lab_anchoring:…)
     SCENARIO=C  kill switch (?lab=off) renders the off screen

   Run via:  npm run test:lab  (see scripts/run-lab-tests.mjs)
───────────────────────────────────────────────────────────── */

import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const SCENARIO = process.env.SCENARIO ?? "A";
const QUERY: Record<string, string> = {
  A: "",
  B: "?lab=lab_anchoring:decoy%20tiers",
  C: "?lab=off",
};

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: `https://radioreach.test/${QUERY[SCENARIO]}`,
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

import assert from "node:assert/strict";
import LabGallery from "../src/lab/LabGallery";

const root = createRoot(dom.window.document.body);

async function main() {
  await act(async () => {
    root.render(<LabGallery />);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });

  if (SCENARIO === "C") {
    const body = dom.window.document.body.textContent ?? "";
    assert.ok(body.includes("Conversion Lab is off"), "kill screen should render");
    assert.equal(dom.window.document.querySelectorAll("[data-lab-experiment]").length, 0);
    console.log("  ✓ ?lab=off renders the off screen, zero prototypes mounted");
    console.log("\n✔ Integration scenario C passed.\n");
    return 0;
  }

  const frames = dom.window.document.querySelectorAll("[data-lab-experiment]");
  assert.ok(frames.length >= 14, `expected ≥14 prototype frames, got ${frames.length}`);
  console.log(`  ✓ gallery mounted ${frames.length} prototype frames`);

  if (SCENARIO === "B") {
    // The override should land on the anchoring experiment's active button.
    const anchorFrame = dom.window.document.querySelector(
      '[data-lab-experiment="lab_anchoring"]'
    );
    assert.ok(anchorFrame, "lab_anchoring frame should exist");
    const active = anchorFrame.querySelector('[data-lab-variant][aria-pressed="true"]');
    assert.ok(active, "an active variant should exist");
    assert.equal(
      active.getAttribute("data-lab-variant"),
      "decoy tiers",
      "URL override should force the decoy tiers variant"
    );
    console.log("  ✓ ?lab=lab_anchoring:decoy tiers forced the right variant");
  }

  if (SCENARIO === "A") {
    // Switch a variant via the QA switcher and verify it sticks.
    const frame = dom.window.document.querySelector(
      '[data-lab-experiment="lab_collection_kit"]'
    );
    assert.ok(frame, "lab_collection_kit frame should exist");
    const buttons = Array.from(
      frame.querySelectorAll("[data-lab-variant]")
    ) as HTMLButtonElement[];
    assert.equal(buttons.length, 3, "collection kit should expose 3 variants");
    const treatment = buttons.find((b) => b.getAttribute("data-lab-variant") === "kit grid, 1 pre-stamped");
    assert.ok(treatment, "treatment variant button should exist");
    await act(async () => {
      treatment.click();
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    assert.equal(treatment.getAttribute("aria-pressed"), "true");
    console.log("  ✓ QA variant switcher updates the active treatment");

    // The CTA inside a prototype should log a conversion with the variant.
    const cta = frame.querySelector(".cta") as HTMLButtonElement;
    assert.ok(cta, "prototype CTA should exist");
    await act(async () => {
      cta.click();
    });
    const events = JSON.parse(dom.window.sessionStorage.getItem("lab.events.v1") ?? "[]");
    const conversion = events.find((e: { type: string }) => e.type === "conversion");
    assert.ok(conversion, "conversion event should be logged");
    assert.equal(conversion.experiment, "lab_collection_kit");
    assert.equal(conversion.variant, "kit grid, 1 pre-stamped");
    assert.ok(conversion.data?.snapshot?.visitorId, "snapshot should carry the visitor id");
    console.log("  ✓ CTA click logged a conversion with variant + snapshot");

    // Assignment events landed for every experiment.
    const assigned = new Set(
      events
        .filter((e: { type: string }) => e.type === "assignment")
        .map((e: { experiment: string }) => e.experiment)
    );
    assert.ok(assigned.size >= 14, `expected ≥14 assignments, got ${assigned.size}`);
    console.log(`  ✓ ${assigned.size} experiments registered deterministic assignments`);
  }

  console.log(`\n✔ Integration scenario ${SCENARIO} passed.\n`);
  root.unmount();
  return 0;
}

main()
  .then((code) => {
    // jsdom + React's scheduler can leave the event loop alive —
    // close the window and exit explicitly (same contract as the
    // ESP integration test).
    dom.window.close();
    process.exit(code ?? 0);
  })
  .catch((err) => {
    console.error(err);
    dom.window.close();
    process.exit(1);
  });
