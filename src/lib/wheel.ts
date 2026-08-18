// Pure geometry + data for the lucky wheel. No React, no DOM — importable by
// the component AND by the Node test suite (scripts/test-wheel-geometry.ts).
//
// GEOMETRY CONTRACT (all angles clockwise from 12 o'clock, matching CSS
// `conic-gradient` and `rotate()`):
//   - Segment i spans [i*SEGMENT_ANGLE, (i+1)*SEGMENT_ANGLE).
//   - Its label is drawn at rotate(i*SEGMENT_ANGLE + SEGMENT_ANGLE/2).
//   - Its divider lines are drawn at i*SEGMENT_ANGLE.
//   - The pointer sits at 0deg (12 o'clock).
// The wheel-face gradient MUST therefore start `from 0deg` — any other start
// angle shifts the color bands out from under their labels and dividers, and
// the wheel stops with the pointer near a slice boundary instead of centered
// on the winning slice (the bug this module exists to prevent).

export type WheelSegment = {
  label: string;
  sub?: string;
  color: string;
  textColor: string;
  isJackpot?: boolean;
  isSecret?: boolean;
};

// 8-slice carnival — vivid rainbow, not cluttered
export const SEGMENTS: WheelSegment[] = [
  { label: "10% OFF", color: "#FACC15", textColor: "#111" }, // yellow — near-miss
  { label: "$100", sub: "GUITAR CENTER", color: "#FB923C", textColor: "#fff" },
  { label: "TRY AGAIN", color: "#F87171", textColor: "#fff" },
  { label: "FREE MIX", color: "#F472B6", textColor: "#fff" },
  { label: "NO LUCK", color: "#A78BFA", textColor: "#fff" },
  { label: "SECRET", sub: "CODE", color: "#22D3EE", textColor: "#fff", isSecret: true },
  { label: "5% OFF", color: "#38BDF8", textColor: "#fff" },
  { label: "JACKPOT", sub: "AU+KIT", color: "#34D399", textColor: "#fff", isJackpot: true },
];

export const SEGMENT_COUNT = SEGMENTS.length;
export const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
export const JACKPOT_INDEX = SEGMENTS.findIndex((s) => s.isJackpot);
export const SECRET_INDEX = SEGMENTS.findIndex((s) => s.isSecret);

/** Start angle (deg) of segment i's color band. */
export function segmentStart(i: number): number {
  return i * SEGMENT_ANGLE;
}

/** Center angle (deg) of segment i — where its label is drawn. */
export function segmentCenter(i: number): number {
  return i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
}

/**
 * CSS conic-gradient for the wheel face. Segment i's color covers exactly
 * [segmentStart(i), segmentStart(i+1)) — aligned with its label and divider.
 */
export function wheelFaceGradient(): string {
  let stops = "";
  SEGMENTS.forEach((seg, i) => {
    const start = segmentStart(i);
    const end = segmentStart(i + 1);
    stops += `${seg.color} ${start}deg ${end}deg${i < SEGMENTS.length - 1 ? ", " : ""}`;
  });
  return `conic-gradient(from 0deg, ${stops})`;
}

/**
 * Wheel rotation (deg, clockwise) that brings the CENTER of `index` under the
 * pointer at 12 o'clock, prefixed by `spins` full turns plus optional jitter
 * (keep |jitter| < SEGMENT_ANGLE/2 so the pointer stays inside the slice).
 *
 * `spins` is rounded to a whole number of turns. Fractional turns would leak
 * `frac × 360°` into the resting angle and land a random slice under the
 * pointer — the exact bug that shipped with this wheel. Randomizing the feel
 * is what the turn count and jitter are for.
 */
export function rotationToLandOn(index: number, spins: number, jitterDeg = 0): number {
  const turns = Math.max(1, Math.round(spins));
  return turns * 360 + (360 - segmentCenter(index)) + jitterDeg;
}

/**
 * Clockwise rotation delta (deg) that moves the pointer from the center of
 * slice `fromIndex` to the center of slice `toIndex`. The wheel turns
 * clockwise, so the slice that arrives at the pointer is the one sitting
 * `delta` degrees counter-clockwise of the current winner.
 */
export function clockwiseNudge(fromIndex: number, toIndex: number): number {
  const d = (fromIndex - toIndex) * SEGMENT_ANGLE;
  return ((d % 360) + 360) % 360;
}

/**
 * Which segment ends up under the pointer after rotating the wheel by
 * `rotation` degrees? Returns the index whose band contains 0deg, or -1 if
 * nothing matches (should be impossible for in-range input).
 */
export function segmentUnderPointer(rotation: number): number {
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    // Signed distance from the pointer (0deg) to this segment's center.
    let d = (-(segmentCenter(i) + rotation)) % 360;
    d = ((d + 540) % 360) - 180; // normalize to (-180, 180]
    if (Math.abs(d) <= SEGMENT_ANGLE / 2) return i;
  }
  return -1;
}
