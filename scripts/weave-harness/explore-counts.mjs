// Vary colour COUNT (2,3,8,12) against two arrangements: blocks (big groups → diamonds)
// and alternate (1 string each, cycled → fine tweed). 28 cycles, 56×84, shared palette.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const PAL = ['#0d1b2a', '#e5383b', '#f4a259', '#3ec9b0', '#f6e7c1', '#9d4edd',
  '#1d3ad0', '#a6df3f', '#ef3f8d', '#f7a01a', '#2a9d8f', '#6d597a'];
const fit = (a, n) => Array.from({ length: n }, (_, i) => a[i % a.length]);
const evenGroups = (n, k) => { const b = Math.floor(n / k), r = n - b * k; return Array.from({ length: k }, (_, i) => b + (i < r ? 1 : 0)); };
const blocks = (k) => evenGroups(28, k).flatMap((s, i) => Array(s).fill(PAL[i]));
const alternate = (k) => fit(PAL.slice(0, k), 28);

const runs = [];
for (const k of [2, 3, 8, 12]) {
  runs.push({ name: `c${String(k).padStart(2, '0')}-blocks`, colors: blocks(k) });
  runs.push({ name: `c${String(k).padStart(2, '0')}-alt`, colors: alternate(k) });
}

for (const r of runs) {
  const spec = { name: `cnt-${r.name}`, rect: [56, 84], colors: r.colors, bg: '#15181f' };
  fs.writeFileSync(path.join(HERE, `shapes/cnt-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} (${new Set(r.colors).size} colours) ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/cnt-${r.name}.json`, '--out', `out/cnt-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
