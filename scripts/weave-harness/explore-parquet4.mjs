// Keep the c02-alt "parquet basket" (strict dark/light alternation every string) but with
// 4 colours. Four strategies — the key is preserving the every-other-string contrast.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const navy = '#0d1b2a', aub = '#2b1840', red = '#e5383b', gold = '#f4b942', teal = '#3ec9b0', cream = '#f6e7c1';
const fit = (a, n) => Array.from({ length: n }, (_, i) => a[i % a.length]);
const grp = (...pairs) => pairs.flatMap(([c, k]) => Array(k).fill(c));

const runs = [
  // A) ONE dark anchor, bright thread rotates through 3 → multicolour parquet on navy
  { name: 'A-anchor-3bright', colors: fit([navy, red, navy, gold, navy, teal], 28) },
  // B) TWO darks + TWO lights, strict D-L-D-L → hue blocks but contrast preserved
  { name: 'B-2dark-2light', colors: fit([navy, red, aub, gold], 28) },
  // C) TWO parquet zones: first half navy/red, second half aubergine/teal
  { name: 'C-two-zones', colors: [...fit([navy, red], 14), ...fit([aub, teal], 14)] },
  // D) naive 4-cycle alternation (the control — expected to muddy)
  { name: 'D-naive-4alt', colors: fit([navy, red, teal, gold], 28) },
];

for (const r of runs) {
  const spec = { name: `pq4-${r.name}`, rect: [56, 84], colors: r.colors, bg: '#11141b' };
  fs.writeFileSync(path.join(HERE, `shapes/pq4-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/pq4-${r.name}.json`, '--out', `out/pq4-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
