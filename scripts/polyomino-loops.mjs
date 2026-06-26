/*
 * Polyomino loop-number census — empirical data on Matthew Yuan's Question 2
 * ("Polyomino Loops", Medium 2020): the distribution of L(P) over all free
 * n-cell polyominoes, computed with João's verified billiard engine.
 *
 *   node scripts/polyomino-loops.mjs [maxN]   (default 12)
 *
 * Method: Redelmeier enumeration of fixed polyominoes (each visited exactly
 * once), canonicalized over the 8 symmetries to free polyominoes; for each
 * new free shape, L(P) = TearEngine.getAllCycles(...).cycles.length.
 * L is symmetry-invariant, so deduping to free shapes is sound.
 *
 * Validation baked in:
 *   - free/fixed counts must match OEIS A000105 / A001168
 *   - L(m×n rectangle) must equal gcd(m,n) for all rectangles encountered
 *   - scaling law spot-check: L(2P) = 2·L(P) for all free shapes with n ≤ 6
 *
 * Output: table to stdout + scripts/artifacts/polyomino-loops-<maxN>.json
 */
import '../src/engine.js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const E = globalThis.TearEngine;
const MAXN = Math.max(1, Math.min(20, parseInt(process.argv[2] || '12', 10)));

// Validation targets. Extend these (from OEIS A000105 / A001168 b-files) before
// trusting any n beyond the last entry; counts at unverified n print "(unverified)".
const A000105 = [0, 1, 1, 2, 5, 12, 35, 108, 369, 1285, 4655, 17073, 63600, 238591, 901971, 3426576, 13079255, 50107909];
const A001168 = [0, 1, 2, 6, 19, 63, 216, 760, 2725, 9910, 36446, 135268, 505861, 1903890, 7204874, 27394666, 104592937, 406604565];

function loopNumber(points) {
  const maxx = Math.max(...points.map(p => p[0]));
  const maxy = Math.max(...points.map(p => p[1]));
  const gw = maxx + 1, gh = maxy + 1;
  const cells = Array.from({ length: gh }, () => Array(gw).fill(false));
  for (const [x, y] of points) cells[y][x] = true;
  return E.getAllCycles(cells, gw, gh).cycles.length;
}

const TRANSFORMS = [
  (x, y) => [x, y], (x, y) => [-x, y], (x, y) => [x, -y], (x, y) => [-x, -y],
  (x, y) => [y, x], (x, y) => [-y, x], (x, y) => [y, -x], (x, y) => [-y, -x],
];

function canonicalKey(points) {
  let best = null;
  for (const t of TRANSFORMS) {
    const mapped = points.map(([x, y]) => t(x, y));
    let mx = Infinity, my = Infinity;
    for (const [x, y] of mapped) { if (x < mx) mx = x; if (y < my) my = y; }
    const norm = mapped.map(([x, y]) => (x - mx) * 64 + (y - my)).sort((a, b) => a - b);
    const key = String.fromCharCode(...norm);
    if (best === null || key < best) best = key;
  }
  return best;
}

function keyToPoints(key) {
  return [...key].map(c => { const v = c.charCodeAt(0); return [(v / 64) | 0, v % 64]; });
}

// Identity-transform key (same encoding as canonicalKey, no symmetry search).
// A fixed polyomino is the canonical representative of its free class iff its own
// key equals the minimum over all 8 transforms. Tallying only on that match counts
// each free shape exactly once and stores nothing (O(1) memory, unlike a global Set).
function keyOf(points) {
  let mx = Infinity, my = Infinity;
  for (const [x, y] of points) { if (x < mx) mx = x; if (y < my) my = y; }
  const norm = points.map(([x, y]) => (x - mx) * 64 + (y - my)).sort((a, b) => a - b);
  return String.fromCharCode(...norm);
}

// per-size stats
const freeCount = new Array(MAXN + 1).fill(0);
const freeSeen = Array.from({ length: MAXN + 1 }, () => new Set()); // populated only for n<=6 (scaling-law check)
const dist = Array.from({ length: MAXN + 1 }, () => new Map());
const fixedCount = new Array(MAXN + 1).fill(0);
const witness = new Array(MAXN + 1).fill(null); // first shape achieving the max L seen at size n
let rectChecks = 0, rectFails = 0;

function isRect(points, n) {
  let mx = 0, my = 0;
  for (const [x, y] of points) { if (x > mx) mx = x; if (y > my) my = y; }
  return (mx + 1) * (my + 1) === n ? [mx + 1, my + 1] : null;
}
const gcd = (a, b) => b ? gcd(b, a % b) : a;

function visit(currentIdx, n, W, originX) {
  fixedCount[n]++;
  const points = currentIdx.map(idx => [(idx % W) - originX, (idx / W) | 0]);
  let mx = Infinity, my = Infinity;
  for (const p of points) { if (p[0] < mx) mx = p[0]; if (p[1] < my) my = p[1]; }
  const norm = points.map(([x, y]) => [x - mx, y - my]);
  const canon = canonicalKey(norm);
  if (keyOf(norm) !== canon) return; // skip non-canonical orientations; each free shape tallied once
  freeCount[n]++;
  if (n <= 6) freeSeen[n].add(canon); // retained only for the scaling-law spot check
  const L = loopNumber(norm);
  dist[n].set(L, (dist[n].get(L) || 0) + 1);
  if (!witness[n] || L > witness[n].L) witness[n] = { L, key: canon };
  const r = isRect(norm, n);
  if (r) {
    rectChecks++;
    if (L !== gcd(r[0], r[1])) { rectFails++; console.error(`GCD THEOREM VIOLATION at ${r[0]}x${r[1]}: L=${L}`); }
  }
}

function enumerate(maxN) {
  const W = 2 * maxN, H = maxN + 1, originX = maxN - 1;
  const origin = originX; // y=0 row
  const occupied = new Uint8Array(W * H);
  const reached = new Uint8Array(W * H);
  const current = [];
  function rec(untried, size) {
    let i = untried.length;
    while (i > 0) {
      const c = untried[--i];
      occupied[c] = 1; current.push(c);
      visit(current, size + 1, W, originX);
      if (size + 1 < maxN) {
        const x = c % W, y = (c / W) | 0;
        const cand = [];
        if (x + 1 < W) cand.push(c + 1);
        if (x - 1 >= 0) cand.push(c - 1);
        if (y + 1 < H) cand.push(c + W);
        if (y - 1 >= 0) cand.push(c - W);
        const added = [];
        const next = untried.slice(0, i);
        for (const nb of cand) {
          const nx = nb % W, ny = (nb / W) | 0;
          if (reached[nb] || occupied[nb]) continue;
          if (ny === 0 && nx < originX) continue; // half-plane restriction
          reached[nb] = 1; added.push(nb); next.push(nb);
        }
        rec(next, size + 1);
        for (const a of added) reached[a] = 0;
      }
      occupied[c] = 0; current.pop();
    }
  }
  reached[origin] = 1;
  rec([origin], 0);
}

console.error(`Enumerating polyominoes up to n=${MAXN} ...`);
const t0 = Date.now();
enumerate(MAXN);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.error(`Done in ${elapsed}s. Rectangles gcd-checked: ${rectChecks}, violations: ${rectFails}`);

// scaling-law spot check: L(2P) = 2·L(P) for all free shapes n ≤ 6
let scaleChecks = 0, scaleFails = 0;
for (let n = 1; n <= Math.min(6, MAXN); n++) {
  for (const key of freeSeen[n]) {
    const pts = keyToPoints(key);
    const L1 = loopNumber(pts);
    const doubled = [];
    for (const [x, y] of pts)
      for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) doubled.push([2 * x + dx, 2 * y + dy]);
    const L2 = loopNumber(doubled);
    scaleChecks++;
    if (L2 !== 2 * L1) { scaleFails++; console.error(`SCALING LAW VIOLATION: n=${n} L=${L1} L(2P)=${L2} key=${[...key].map(c=>c.charCodeAt(0)).join(',')}`); }
  }
}
console.error(`Scaling law L(2P)=2L(P): checked ${scaleChecks} shapes, violations: ${scaleFails}`);

// report
const result = { maxN: MAXN, elapsedSeconds: +elapsed, rectChecks, rectFails, scaleChecks, scaleFails, sizes: {} };
let countsOk = true;
console.log(`\nn | free polyominoes (OEIS ok?) | fixed (ok?) | L distribution L:count | prime % (L=1) | mean L | max L`);
console.log(`--|--|--|--|--|--|--`);
for (let n = 1; n <= MAXN; n++) {
  const free = freeCount[n], fixed = fixedCount[n];
  const expF = A000105[n], expX = A001168[n];
  const okF = expF === undefined ? null : free === expF;
  const okX = expX === undefined ? null : fixed === expX;
  if (okF === false || okX === false) countsOk = false;
  const fMark = okF === null ? '(unverified)' : okF ? '✓' : '✗ EXPECTED ' + expF;
  const xMark = okX === null ? '(unverified)' : okX ? '✓' : '✗ EXPECTED ' + expX;
  const d = [...dist[n].entries()].sort((a, b) => a[0] - b[0]);
  const total = d.reduce((s, [, c]) => s + c, 0);
  const prime = (dist[n].get(1) || 0);
  const meanL = d.reduce((s, [L, c]) => s + L * c, 0) / total;
  const maxL = d.length ? d[d.length - 1][0] : 0;
  console.log(`${n} | ${free} ${fMark} | ${fixed} ${xMark} | ${d.map(([L, c]) => `${L}:${c}`).join(' ')} | ${(100 * prime / total).toFixed(2)}% | ${meanL.toFixed(3)} | ${maxL}`);
  result.sizes[n] = { free, fixed, freeOk: okF, fixedOk: okX, distribution: Object.fromEntries(d), primeFraction: prime / total, meanL, maxL };
}
console.error(countsOk ? 'All OEIS counts match.' : 'COUNT MISMATCH — data invalid, do not publish.');

console.log(`\nMax-L witness shapes (first found per size):`);
result.witnesses = {};
for (let n = 1; n <= MAXN; n++) {
  if (!witness[n]) continue;
  const pts = keyToPoints(witness[n].key);
  const mx = Math.max(...pts.map(p => p[0])), my = Math.max(...pts.map(p => p[1]));
  const grid = Array.from({ length: my + 1 }, () => Array(mx + 1).fill('.'));
  for (const [x, y] of pts) grid[y][x] = '#';
  result.witnesses[n] = { L: witness[n].L, cells: pts };
  console.log(`n=${n} L=${witness[n].L}\n${grid.map(r => r.join('')).join('\n')}`);
}

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'artifacts'), { recursive: true });
writeFileSync(join(here, 'artifacts', `polyomino-loops-${MAXN}.json`), JSON.stringify(result, null, 2));
console.error(`Wrote scripts/artifacts/polyomino-loops-${MAXN}.json`);
