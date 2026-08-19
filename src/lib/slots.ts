// Pure slot-machine geometry + data for the Secret Slots affiliate reveal.
// No React, no DOM — importable by the component AND by the Node test suite
// (scripts/test-slots.ts).
//
// GEOMETRY CONTRACT (mirrors the lucky wheel's "whole turns only" rule):
//   - Each reel is a vertical strip of symbols that repeats every REEL_LENGTH
//     rows (row r shows REEL_SYMBOLS[r mod REEL_LENGTH]).
//   - The window shows VISIBLE_ROWS (3) rows; the payline is the middle row
//     (PAYLINE_INDEX = 1).
//   - `offset` = the strip row currently at the TOP of the visible window, so
//     symbolsAtWindow(offset) = rows [offset, offset+1, offset+2] and the
//     payline symbol is row offset + PAYLINE_INDEX.
//   - Stops are WHOLE rows only — never fractional. Fractional offsets would
//     leave symbols half-out of the window (the same bug class the wheel
//     module exists to prevent). Randomness comes from the rotation count,
//     exactly like the wheel's turn count.
//   - The secret symbol and its near-miss neighbour are ADJACENT rows in the
//     reel (LOCK at SECRET_INDEX-1), so the win choreography — third reel
//     stops "locked", hesitates, clicks one row to the key — is one row.

export const REEL_SYMBOLS = ["note", "disc", "mic", "star", "tower", "headphones", "lock", "key"] as const;
export type ReelSymbol = (typeof REEL_SYMBOLS)[number];

// Tile accent per symbol — the machine renders line-art glyphs and each one
// gets its own vivid hue (with the key in brand gold) so the reels read
// vibrant and juicy instead of grey.
export const SYMBOL_STYLE: Record<ReelSymbol, { glow: string; tint: string }> = {
  note: { glow: "rgba(167,139,250,0.75)", tint: "#a78bfa" },
  disc: { glow: "rgba(212,212,216,0.6)", tint: "#d4d4d8" },
  mic: { glow: "rgba(244,114,182,0.75)", tint: "#f472b6" },
  star: { glow: "rgba(250,204,21,0.8)", tint: "#facc15" },
  tower: { glow: "rgba(251,146,60,0.75)", tint: "#fb923c" },
  headphones: { glow: "rgba(34,211,238,0.75)", tint: "#22d3ee" },
  lock: { glow: "rgba(248,113,113,0.75)", tint: "#f87171" },
  key: { glow: "rgba(255,230,0,0.9)", tint: "#ffe600" },
};

export const REEL_LENGTH = REEL_SYMBOLS.length; // 8
export const REEL_COUNT = 3;
export const VISIBLE_ROWS = 3;
export const PAYLINE_INDEX = 1; // middle row of the window

export const SECRET_SYMBOL = "key"; // "you found the key"
export const NEAR_MISS_SYMBOL = "lock"; // "still locked…"

export const SECRET_INDEX = REEL_SYMBOLS.indexOf(SECRET_SYMBOL);
export const NEAR_MISS_INDEX = REEL_SYMBOLS.indexOf(NEAR_MISS_SYMBOL);

// Odds framing for the machine face: three reels × 8 symbols.
export const SECRET_ODDS = REEL_LENGTH ** REEL_COUNT; // 512 → "1 in 512"

// Extra full rotations (0-3) a spin may add on top of its minimum.
export const MAX_EXTRA_TURNS = 3;

/** Symbol shown at strip row `row` (rows are periodic with REEL_LENGTH). */
export function symbolAtRow(row: number): ReelSymbol {
  return REEL_SYMBOLS[((row % REEL_LENGTH) + REEL_LENGTH) % REEL_LENGTH];
}

/** The VISIBLE_ROWS symbols shown in the window when `offset` is at the top. */
export function symbolsAtWindow(offset: number): ReelSymbol[] {
  const out: ReelSymbol[] = [];
  for (let i = 0; i < VISIBLE_ROWS; i++) out.push(symbolAtRow(offset + i));
  return out;
}

/** The symbol sitting on the payline (middle row) for a given offset. */
export function paylineSymbol(offset: number): ReelSymbol {
  return symbolAtRow(offset + PAYLINE_INDEX);
}

/**
 * Stop offset that puts `symbolIndex` dead-center on the payline after
 * `minTurns` full rotations plus 0..MAX_EXTRA_TURNS random extra rotations.
 * Always a whole number of rows; the random extra turns are the only
 * randomness (fractional rows would break payline alignment).
 */
export function reelStopForSymbol(
  symbolIndex: number,
  minTurns: number,
  random: () => number = Math.random
): number {
  const turns = Math.max(1, Math.round(minTurns)) + Math.floor(random() * (MAX_EXTRA_TURNS + 1));
  // Row whose symbol sits on the payline (middle of the window).
  const paylineRow = ((symbolIndex - PAYLINE_INDEX) % REEL_LENGTH + REEL_LENGTH) % REEL_LENGTH;
  return turns * REEL_LENGTH + paylineRow;
}

/**
 * Smallest forward (clockwise-down) nudge, in whole rows, that moves the
 * payline from whatever it currently shows to `symbolIndex`. For the
 * near-miss → win choreography this is exactly +1 row (LOCK → KEY are
 * adjacent), but the function is correct for any pair.
 */
export function nudgeToPayline(fromOffset: number, symbolIndex: number): number {
  const currentIndex = REEL_SYMBOLS.indexOf(paylineSymbol(fromOffset));
  const d = ((symbolIndex - currentIndex) % REEL_LENGTH + REEL_LENGTH) % REEL_LENGTH;
  return fromOffset + d;
}

/** True when every reel shows the secret symbol on its payline. */
export function isSecretCombo(offsets: readonly number[]): boolean {
  return (
    offsets.length === REEL_COUNT &&
    offsets.every((o) => paylineSymbol(o) === SECRET_SYMBOL)
  );
}

/**
 * Rewind `offset` by whole reel cycles. Because the strip is periodic in
 * REEL_LENGTH rows, subtracting cycles*REEL_LENGTH is visually invisible
 * (identical symbols) and keeps the payline symbol identical — this is how
 * the component keeps the translate distance inside the strip's finite
 * content between spins.
 */
export function rewindOffset(offset: number, cycles: number): number {
  return offset - Math.max(1, Math.round(cycles)) * REEL_LENGTH;
}
