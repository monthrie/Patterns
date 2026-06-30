// Confetti sweep: one dominant ANCHOR colour + isolated single-string ACCENTS → the accents
// render as thin diagonal lines, giving glowing diamond line-art instead of plaid.
// Vary: anchor colour, anchor density p (sparser lines as p↑), and the accent palette.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const RAINBOW = ['#e5383b', '#f4a259', '#3ec9b0', '#9d4edd', '#1d3ad0', '#a6df3f', '#ef3f8d', '#f7a01a'];
const WARM = ['#e5383b', '#f4a259', '#ef3f8d', '#f7a01a', '#ffd23f'];
const COOL = ['#3ec9b0', '#1d3ad0', '#9d4edd', '#a6df3f', '#2a9d8f'];
const JEWEL = ['#9b1d2e', '#1d4e89', '#176b54', '#6a2c70', '#b8860b'];   // dark/saturated for a light field
const mk = (s) => { let x = s; return () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const confetti = (anchor, p, accents, seed) => { const r = mk(seed); return Array.from({ length: 28 }, () => r() < p ? anchor : pick(r, accents)); };

const NAVY = '#0d1b2a', BLACK = '#050507', CREAM = '#f6e7c1', TEAL = '#10403b';
const runs = [
  { name: '1-navy-p50-rainbow', colors: confetti(NAVY, 0.50, RAINBOW, 11), bg: '#11141b' },
  { name: '2-navy-p70-rainbow', colors: confetti(NAVY, 0.70, RAINBOW, 12), bg: '#11141b' }, // sparse lines
  { name: '3-navy-p38-rainbow', colors: confetti(NAVY, 0.38, RAINBOW, 13), bg: '#11141b' }, // dense
  { name: '4-black-p60-rainbow', colors: confetti(BLACK, 0.60, RAINBOW, 14), bg: '#050507' },
  { name: '5-cream-p60-jewel', colors: confetti(CREAM, 0.60, JEWEL, 15), bg: '#efe6cf' },    // inverse: dark lines on light
  { name: '6-teal-p60-rainbow', colors: confetti(TEAL, 0.60, RAINBOW, 16), bg: '#0a2420' },
  { name: '7-navy-p60-warm', colors: confetti(NAVY, 0.60, WARM, 17), bg: '#11141b' },
  { name: '8-navy-p60-cool', colors: confetti(NAVY, 0.60, COOL, 18), bg: '#11141b' },
  { name: '9-navy-p60-2accent', colors: confetti(NAVY, 0.60, ['#a6df3f', '#ef3f8d'], 19), bg: '#11141b' }, // lime+pink only
];

for (const r of runs) {
  const spec = { name: `conf-${r.name}`, rect: [56, 84], colors: r.colors, bg: r.bg };
  fs.writeFileSync(path.join(HERE, `shapes/conf-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/conf-${r.name}.json`, '--out', `out/conf-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
