// Slot machine geometry regression tests.
//
// The contract (see src/lib/slots.ts): stops are whole rows only — never
// fractional — and the payline is the middle of a 3-row window. Every stop
// must land the requested symbol dead-center on the payline, and the
// near-miss → win choreography must be exactly one row (LOCK → KEY are
// adjacent in the reel).

import {
  REEL_SYMBOLS,
  REEL_LENGTH,
  REEL_COUNT,
  VISIBLE_ROWS,
  PAYLINE_INDEX,
  SECRET_SYMBOL,
  NEAR_MISS_SYMBOL,
  SECRET_INDEX,
  NEAR_MISS_INDEX,
  SECRET_ODDS,
  MAX_EXTRA_TURNS,
  SYMBOL_STYLE,
  symbolAtRow,
  symbolsAtWindow,
  paylineSymbol,
  reelStopForSymbol,
  nudgeToPayline,
  isSecretCombo,
  rewindOffset,
} from "../src/lib/slots";

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}${detail ? " — " + detail : ""}`);
  }
}

// 1. The reel contract: 8 symbols × 3 reels, window shows exactly
//    VISIBLE_ROWS, payline is the middle row.
check("reel has 8 symbols", REEL_LENGTH === 8, `got ${REEL_LENGTH}`);
check("3 reels, 3 visible rows, middle payline", REEL_COUNT === 3 && VISIBLE_ROWS === 3 && PAYLINE_INDEX === 1);
check("secret odds are 8³ = 512", SECRET_ODDS === 512, `got ${SECRET_ODDS}`);
check("exactly one secret symbol in the reel", REEL_SYMBOLS.filter((s) => s === SECRET_SYMBOL).length === 1);
check("near-miss symbol exists", NEAR_MISS_INDEX >= 0);
check(
  "every symbol has a tile style (glow + tint)",
  REEL_SYMBOLS.every((s) => SYMBOL_STYLE[s] && SYMBOL_STYLE[s].glow && SYMBOL_STYLE[s].tint)
);
check(
  "LOCK is the row directly before KEY (one-row nudge choreography)",
  NEAR_MISS_INDEX + 1 === SECRET_INDEX,
  `lock=${NEAR_MISS_INDEX} key=${SECRET_INDEX}`
);

// 2. symbolsAtWindow: rows are the three consecutive reel symbols, and the
//    payline (middle) row matches paylineSymbol.
let windowOk = true;
for (let offset = -20; offset <= 60; offset++) {
  const win = symbolsAtWindow(offset);
  if (win.length !== VISIBLE_ROWS) windowOk = false;
  if (win[0] !== symbolAtRow(offset)) windowOk = false;
  if (win[1] !== symbolAtRow(offset + 1)) windowOk = false;
  if (win[2] !== symbolAtRow(offset + 2)) windowOk = false;
  if (win[PAYLINE_INDEX] !== paylineSymbol(offset)) windowOk = false;
}
check("symbolsAtWindow shows consecutive symbols with the payline centered", windowOk);

// 3. reelStopForSymbol: every symbol × minTurns × random value lands the
//    requested symbol dead-center on the payline, at a whole row, after at
//    least minTurns full rotations.
const RANDOMS = [() => 0, () => 0.999999, () => 0.5, () => Math.random()];
let landsOk = true;
let wholeRowsOk = true;
let minTurnsOk = true;
let paylineRowOk = true;
for (let s = 0; s < REEL_LENGTH; s++) {
  for (let minTurns = 1; minTurns <= 8; minTurns++) {
    for (const rnd of RANDOMS) {
      const stop = reelStopForSymbol(s, minTurns, rnd);
      if (paylineSymbol(stop) !== REEL_SYMBOLS[s]) landsOk = false;
      if (!Number.isInteger(stop)) wholeRowsOk = false;
      if (stop < minTurns * REEL_LENGTH) minTurnsOk = false;
      // payline row must be the row whose symbol sits on the middle row
      if (stop % REEL_LENGTH !== ((s - PAYLINE_INDEX) % REEL_LENGTH + REEL_LENGTH) % REEL_LENGTH) {
        paylineRowOk = false;
      }
    }
  }
}
check("reelStopForSymbol lands the requested symbol on the payline (all symbols × turns × randoms)", landsOk);
check("stops are whole rows only", wholeRowsOk);
check("stops respect the minimum full rotations", minTurnsOk);
check("stop row mod length is the payline row of the symbol", paylineRowOk);

// 4. Extra-turn randomness stays inside its bound (0..MAX_EXTRA_TURNS).
let boundsOk = true;
for (let i = 0; i < 200; i++) {
  const stop = reelStopForSymbol(SECRET_INDEX, 2, Math.random);
  const extra = Math.floor((stop - 2 * REEL_LENGTH) / REEL_LENGTH);
  if (extra < 0 || extra > MAX_EXTRA_TURNS) boundsOk = false;
}
check("random extra rotations stay within 0..MAX_EXTRA_TURNS", boundsOk);

// 5. Choreography: two reels rest on KEY, the third rests on LOCK (near
//    miss), then a one-row nudge lands the secret combo.
const near = reelStopForSymbol(NEAR_MISS_INDEX, 3, () => 0.4);
const key = nudgeToPayline(near, SECRET_INDEX);
check("near-miss stop rests on LOCK", paylineSymbol(near) === NEAR_MISS_SYMBOL);
check("near-miss is NOT the secret combo", !isSecretCombo([near, near, near]));
check(
  "nudge from LOCK to KEY is exactly +1 row",
  key === near + 1,
  `nudge ${key - near} row(s)`
);
check("nudged stop rests on KEY", paylineSymbol(key) === SECRET_SYMBOL);
check(
  "the full choreography lands the secret combo",
  isSecretCombo([
    reelStopForSymbol(SECRET_INDEX, 2, () => 0.1),
    reelStopForSymbol(SECRET_INDEX, 3, () => 0.2),
    key,
  ])
);

// 6. nudgeToPayline is correct for every pair of symbols, including wraps.
let nudgeOk = true;
for (let from = 0; from < REEL_LENGTH; from++) {
  for (let to = 0; to < REEL_LENGTH; to++) {
    const base = 5 * REEL_LENGTH + ((from - PAYLINE_INDEX) % REEL_LENGTH + REEL_LENGTH) % REEL_LENGTH;
    const nudged = nudgeToPayline(base, to);
    if (paylineSymbol(nudged) !== REEL_SYMBOLS[to]) nudgeOk = false;
    if (nudged < base) nudgeOk = false; // always moves forward, never backward
  }
}
check("nudgeToPayline lands any target symbol and never moves backward", nudgeOk);

// 7. rewindOffset: subtracting whole cycles keeps the payline symbol
//    identical (visually invisible rewind between spins).
let rewindOk = true;
for (let offset = 10; offset < 60; offset++) {
  for (const cycles of [1, 2, 3, 5]) {
    const rewound = rewindOffset(offset, cycles);
    if (rewound >= offset) rewindOk = false;
    if (paylineSymbol(rewound) !== paylineSymbol(offset)) rewindOk = false;
    if ((rewound - offset) % REEL_LENGTH !== 0) rewindOk = false;
  }
}
check("rewindOffset keeps payline symbol identical (whole cycles only)", rewindOk);

// 8. isSecretCombo rejects wrong lengths and non-secret paylines.
check(
  "isSecretCombo requires exactly three secret paylines",
  isSecretCombo([key, key, key]) &&
    !isSecretCombo([key, key]) &&
    !isSecretCombo([key, key, key, key]) &&
    !isSecretCombo([key, key, near])
);

if (failures > 0) {
  console.error(`\n${failures} slot test(s) failed.`);
  process.exit(1);
}
console.log("\n✔ All slot machine tests passed.");
