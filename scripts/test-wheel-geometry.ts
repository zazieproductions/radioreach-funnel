// Wheel geometry regression tests.
//
// Root cause these guard against (shipped bug, 2026-08-18): the wheel face
// was drawn with `conic-gradient(from -11.25deg, …)`, shifting every color
// band a quarter-slice counter-clockwise of its label and divider line. The
// spin targets are computed from label centers, so the wheel stopped with the
// pointer +11.25° past the winning slice's center — sitting on the edge of
// the neighboring color while claiming the jackpot/secret prize.
//
// The contract: band i == label i == divider boundaries, and every spin
// target lands the intended segment dead-center under the pointer.

import {
  SEGMENTS,
  SEGMENT_ANGLE,
  SEGMENT_COUNT,
  JACKPOT_INDEX,
  SECRET_INDEX,
  wheelFaceGradient,
  rotationToLandOn,
  clockwiseNudge,
  segmentUnderPointer,
} from "../src/lib/wheel";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}${detail ? " — " + detail : ""}`);
  }
}

// 1. The wheel face must start at 0deg — anything else misaligns colors from
//    labels/dividers (this is the exact shipped bug).
const gradient = wheelFaceGradient();
check("wheel face gradient starts at 0deg", /from 0deg/.test(gradient), gradient.slice(0, 40));
check(
  "every segment color is placed at its own band",
  SEGMENTS.every((s, i) =>
    gradient.includes(`${s.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`)
  )
);
check("no stray -11.25deg offset anywhere", !gradient.includes("-11.25"), "old bug present");

// 2. Unique special segments exist where the choreography expects them.
check("exactly one jackpot segment", SEGMENTS.filter((s) => s.isJackpot).length === 1);
check("exactly one secret segment", SEGMENTS.filter((s) => s.isSecret).length === 1);
check("jackpot is the counter-clockwise neighbor of the near-miss (idx 0)", JACKPOT_INDEX === SEGMENT_COUNT - 1);

// 3. Landing math: for every segment, spins count, and allowed jitter, the
//    intended segment must end up under the pointer — and dead-center when
//    jitter is 0.
const JITTERS = [0, 1.5, -1.5, 1.25, -1.25, 0.01];
let landingOk = true;
let centeredOk = true;
for (let i = 0; i < SEGMENT_COUNT; i++) {
  for (let spins = 1; spins <= 8; spins++) {
    for (const j of JITTERS) {
      const rot = rotationToLandOn(i, spins, j);
      if (segmentUnderPointer(rot) !== i) landingOk = false;
    }
    const rot = rotationToLandOn(i, spins, 0);
    if (segmentUnderPointer(rot) !== i) centeredOk = false;
  }
}
check("rotationToLandOn lands the intended segment (all indices × spins × jitter)", landingOk);
check("rotationToLandOn(…, jitter 0) is exactly centered", centeredOk);

// 4. First-wheel choreography: big spin → near-miss (10% OFF), hesitation,
//    one-notch nudge → JACKPOT. Both stops must be visually correct.
const spins1 = 5.3;
const jitter1 = 1.2;
const nearMiss = rotationToLandOn(0, spins1, jitter1);
const jackpot = nearMiss + clockwiseNudge(0, JACKPOT_INDEX);
check("first stop lands on the near-miss slice (10% OFF)", segmentUnderPointer(nearMiss) === 0);
check("nudge after near-miss lands on JACKPOT", segmentUnderPointer(jackpot) === JACKPOT_INDEX);
check("nudge is one slice (45°), not a wrap-around", clockwiseNudge(0, JACKPOT_INDEX) === SEGMENT_ANGLE);

// 5. Second-wheel choreography: spin lands on SECRET.
const spins2 = 5.6;
const jitter2 = -1.4;
check("second-wheel spin lands on SECRET", segmentUnderPointer(rotationToLandOn(SECRET_INDEX, spins2, jitter2)) === SECRET_INDEX);

// 6. Pointer offset sanity: with the max jitter the component ever applies,
//    the pointer stays inside the winning slice (band spans ±22.5°).
const maxJitter = 1.5;
let offsetOk = true;
for (const j of [maxJitter, -maxJitter]) {
  const rot = rotationToLandOn(JACKPOT_INDEX, 6, j);
  if (segmentUnderPointer(rot) !== JACKPOT_INDEX) offsetOk = false;
}
check("max component jitter keeps pointer inside winning slice", offsetOk);

if (failures > 0) {
  console.error(`\n${failures} wheel geometry test(s) failed.`);
  process.exit(1);
}
console.log("\n✔ All wheel geometry tests passed.");
