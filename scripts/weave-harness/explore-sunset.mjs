// Sunset series: 5, 7, 11 cycles — 3 examples each. All sunset, each slightly different,
// with cool-colour curveballs. One (11a) repeats NO colour (11 distinct hues).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

// sunset palette
const I = '#2b1a4a', PL = '#5a2a6e', M = '#9b2d6f', Ra = '#d72660', Co = '#f0455f',
  O = '#ff7a3d', A = '#ffab3b', Gd = '#ffd166', Pe = '#ffe3b0';
const Te = '#2a9d8f', Du = '#1d6f8f';                 // cool curveballs
const NOREPEAT11 = ['#241341', '#46205f', '#6a2470', '#8f2a6e', '#b32a66', '#d42a5b', '#ef4a4a', '#ff6f3c', '#ff9b34', '#ffc24d', '#ffe39a'];
const bg = '#17161d';

const runs = [
  // 5 cycles — board 25×40 (gcd 5), bold & graphic
  { name: '5a-gradient', rect: [25, 40], colors: [I, M, Co, O, Gd] },
  { name: '5b-emberglow', rect: [25, 40], colors: [PL, Ra, Co, A, Pe] },
  { name: '5c-curveball-teal', rect: [25, 40], colors: [I, Co, O, Gd, Te] },       // cool teal pop
  // 7 cycles — board 21×28 (gcd 7)
  { name: '7a-gradient', rect: [21, 28], colors: [I, PL, M, Co, O, A, Gd] },
  { name: '7b-banded', rect: [21, 28], colors: [I, I, Co, Co, Gd, Gd, Pe] },       // repeats → bold bands
  { name: '7c-dusk-core', rect: [21, 28], colors: [Gd, O, Co, Du, Co, O, Gd] },    // palindrome, cool core
  // 11 cycles — board 33×44 (gcd 11)
  { name: '11a-norepeat', rect: [33, 44], colors: NOREPEAT11 },                    // NO repeated colour
  { name: '11b-grouped', rect: [33, 44], colors: [I, I, M, M, Co, Co, O, O, Gd, Gd, Pe] },
  { name: '11c-cool-rivers', rect: [33, 44], colors: [I, PL, Du, M, Ra, Te, Co, O, A, Gd, Pe] }, // cool seams through warmth
];

for (const r of runs) {
  const spec = { name: `sunset-${r.name}`, rect: r.rect, colors: r.colors, bg };
  fs.writeFileSync(path.join(HERE, `shapes/sunset-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} (${new Set(r.colors).size} distinct of ${r.colors.length}) ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/sunset-${r.name}.json`, '--out', `out/sunset-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
