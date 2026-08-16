/**
 * Builds the RadioReach favicon / app-icon set.
 *
 * The RadioReach mark (black disc, gold broadcast waves, mirrored double-R,
 * white lattice tower) is defined here as vector geometry so every icon size
 * is rendered crisply from the same source instead of resampling a JPG.
 *
 * Two variants are produced:
 *   - "full"    : the complete mark, used at 96px and above
 *   - "compact" : waves + tower only (the double-R turns to mush below ~48px),
 *                 used for favicon.svg and the .ico sizes
 *
 * Run: node scripts/build-favicon.mjs
 */
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const GOLD = '#FFC20E';
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const SIZE = 512;
const C = SIZE / 2;

/* ------------------------------------------------------------------ helpers */
const polar = (cx, cy, r, deg) => {
  const t = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy - r * Math.sin(t)];
};

const waveArc = (hub, r, a0, a1, w) => {
  const [x0, y0] = polar(hub.x, hub.y, r, a0);
  const [x1, y1] = polar(hub.x, hub.y, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 0 : 1;
  return `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="${GOLD}" stroke-width="${w}"/>`;
};

/** Lattice transmitter tower, drawn twice: black knockout, then white on top. */
const tower = ({ top, base, topHW, baseHW, tiers, legW, webW, haloLeg, haloWeb }) => {
  const hw = (y) => topHW + ((y - top) / (base - top)) * (baseHW - topHW);
  const zig = (startLeft) =>
    'M' +
    tiers
      .map((y, i) => {
        const left = startLeft ? i % 2 === 0 : i % 2 === 1;
        return `${(left ? C - hw(y) : C + hw(y)).toFixed(1)},${y}`;
      })
      .join(' L');
  const layer = (stroke, lw, ww) => `
    <g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path stroke-width="${lw}" d="M${(C - hw(top)).toFixed(1)},${top} L${(C - hw(base)).toFixed(1)},${base}"/>
      <path stroke-width="${lw}" d="M${(C + hw(top)).toFixed(1)},${top} L${(C + hw(base)).toFixed(1)},${base}"/>
      <path stroke-width="${ww}" d="${zig(true)}"/>
      <path stroke-width="${ww}" d="${zig(false)}"/>
    </g>`;
  return layer(BLACK, haloLeg, haloWeb) + layer(WHITE, legW, webW);
};

/* ------------------------------------------------------------- full variant */
const R_OUTER = 'M0,0 H100 C132,0 156,23 156,52 C156,81 132,104 100,104 H42 V165 H0 Z';
const R_COUNTER = 'M42,36 H96 C110,36 118,43 118,52 C118,61 110,68 96,68 H42 Z';
const R_LEG = 'M60,104 H108 L160,165 H106 Z';
const letterR = (fill, transform) => `
  <g transform="${transform}" fill="${fill}">
    <path fill-rule="evenodd" d="${R_OUTER} ${R_COUNTER}"/>
    <path d="${R_LEG}"/>
  </g>`;

const fullMark = () => {
  const hub = { x: C, y: 200, r: 18 };
  return `
  ${waveArc(hub, 43, -26, 206, 11)}
  ${waveArc(hub, 72, -30, 210, 12)}
  ${waveArc(hub, 112, -18, 198, 12)}
  ${waveArc(hub, 159, 147, 216, 13)}
  ${waveArc(hub, 159, 33, -36, 13)}
  <circle cx="${hub.x}" cy="${hub.y}" r="${hub.r}" fill="${GOLD}"/>
  ${letterR(GOLD, 'translate(227,222)')}
  ${letterR(WHITE, 'translate(285,222) scale(-1,1)')}
  ${tower({ top: 206, base: 387, topHW: 7, baseHW: 46, tiers: [206, 246, 283, 319, 354, 387], legW: 9, webW: 6, haloLeg: 20, haloWeb: 17 })}`;
};

/* ---------------------------------------------------------- compact variant */
const compactMark = () => {
  const hub = { x: C, y: 196, r: 26 };
  return `
  ${waveArc(hub, 66, -20, 200, 20)}
  ${waveArc(hub, 118, -14, 194, 20)}
  ${waveArc(hub, 172, 150, 215, 20)}
  ${waveArc(hub, 172, 30, -35, 20)}
  <circle cx="${hub.x}" cy="${hub.y}" r="${hub.r}" fill="${GOLD}"/>
  ${tower({ top: 210, base: 418, topHW: 10, baseHW: 86, tiers: [210, 262, 314, 366, 418], legW: 16, webW: 11, haloLeg: 30, haloWeb: 26 })}`;
};

/**
 * @param {'full'|'compact'} variant
 * @param {'disc'|'square'} shape  disc = transparent corners, square = solid tile
 */
const svg = (variant, shape = 'disc') => {
  const bg =
    shape === 'square'
      ? `<rect width="${SIZE}" height="${SIZE}" fill="${BLACK}"/>`
      : `<circle cx="${C}" cy="${C}" r="${C}" fill="${BLACK}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>RadioReach</title>
  ${bg}
  ${variant === 'full' ? fullMark() : compactMark()}
</svg>
`;
};

/* ------------------------------------------------------------------- output */
const png = (source, size, out) =>
  sharp(Buffer.from(source)).resize(size, size).png({ compressionLevel: 9 }).toFile(join(PUBLIC_DIR, out));

writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), svg('compact'));

await png(svg('compact'), 48, 'favicon-48.png');
await png(svg('compact'), 32, 'favicon-32.png');
await png(svg('compact'), 16, 'favicon-16.png');
await png(svg('full'), 96, 'favicon-96.png');
await png(svg('full', 'square'), 180, 'apple-touch-icon.png');
await png(svg('full', 'square'), 192, 'icon-192.png');
await png(svg('full', 'square'), 512, 'icon-512.png');

// multi-resolution .ico (16 / 32 / 48) for legacy browsers and search crawlers
execFileSync('convert', [
  join(PUBLIC_DIR, 'favicon-16.png'),
  join(PUBLIC_DIR, 'favicon-32.png'),
  join(PUBLIC_DIR, 'favicon-48.png'),
  join(PUBLIC_DIR, 'favicon.ico'),
]);

console.log('favicon set written to public/');
