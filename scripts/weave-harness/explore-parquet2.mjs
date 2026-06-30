// Lean into the surprise: anchor on every other cord + N bright colours TAKING TURNS in the
// bright slot → interleaved parquet-weave systems. Vary the bright set and the anchor.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

// anchor at even cords, brights cycle through the odd cords
const parquet = (anchor, brights, n = 11) => Array.from({ length: n }, (_, i) => i % 2 === 0 ? anchor : brights[((i - 1) / 2) % brights.length]);

const NAVY = '#0c0c16', BLACK = '#08080e', CREAM = '#efe6d2';
const runs = [
  { name: 'pink-lime', colors: parquet(NAVY, ['#ef3f8d', '#a6df3f']) },             // electric
  { name: 'orange-cyan', colors: parquet(NAVY, ['#ff7a3d', '#21c0c0']) },           // complementary pop
  { name: 'tri-gold-teal-magenta', colors: parquet(NAVY, ['#ffd166', '#21c0c0', '#d62bc0']) }, // 3 systems
  { name: 'quad-rainbow', colors: parquet(BLACK, ['#e5383b', '#ffd166', '#21c0c0', '#9d4edd']) }, // 4 systems
  { name: 'inverse-cream', colors: parquet(CREAM, ['#14213d', '#b3201f']) },        // light anchor, dark threads
  { name: 'teal-anchor-warm', colors: parquet('#10403b', ['#ffd166', '#f0455f']) }, // coloured anchor
];

for (const r of runs) {
  const spec = { name: `pq2-${r.name}`, rect: [44, 55], colors: r.colors, bg: '#141319' };
  fs.writeFileSync(path.join(HERE, `shapes/pq2-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/pq2-${r.name}.json`, '--out', `out/pq2-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
