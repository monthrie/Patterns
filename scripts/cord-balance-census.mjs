/*
 * Balanced-cord census (memory-fixed extension of cord-length-survey.mjs).
 *
 *   node scripts/cord-balance-census.mjs [maxN]      (default 12)
 *
 * A "cord" is a closed mirror-curve loop; its length is in cell-diagonal units
 * (arcLen(points)/sqrt(2)). The L cords of an n-cell board partition the total
 * length 2n. A board is BALANCED if it has L >= 2 cords all of equal length
 * (c_1 = c_2 = ... = c_L = 2n/L). Monolinear boards (L = 1) are trivially
 * "balanced" and are tallied separately, not in the balanced count.
 *
 * Memory: O(1). Like polyomino-loops.mjs, each free shape is tallied only on its
 * canonical orientation (keyOf(norm) === canonicalKey(norm)); no global Set, so
 * it scales past the n<=12 wall of the original survey.
 *
 * Validation baked in (same trusted path as the monolinear census):
 *   - free/fixed counts must match OEIS A000105 / A001168,
 *   - total cord length = 2n on every board,
 *   - every cord length integer (in fact even),
 *   - rectangle cords obey gcd theorem: gcd(m,n) cords each 2mn/gcd(m,n).
 *
 * Output: table to stdout + scripts/artifacts/cord-balance-census-<maxN>.json
 */
import '../src/engine.js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const E = globalThis.TearEngine;
const SQRT2 = Math.SQRT2;
const MAXN = Math.max(1, Math.min(20, parseInt(process.argv[2] || '12', 10)));
const WITNESS_CAP = 60; // store at most this many non-rect balanced witnesses per n (counts stay exact)

// Validation targets (OEIS A000105 free / A001168 fixed). A001168(17)=400795844
// (verified against the OEIS b-file; not the typo'd 406604565).
const A000105 = [0, 1, 1, 2, 5, 12, 35, 108, 369, 1285, 4655, 17073, 63600, 238591, 901971, 3426576, 13079255, 50107909];
const A001168 = [0, 1, 2, 6, 19, 63, 216, 760, 2725, 9910, 36446, 135268, 505861, 1903890, 7204874, 27394666, 104592937, 400795844];

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
// identity-transform key, same encoding as canonicalKey (no symmetry search)
function keyOf(points) {
  let mx = Infinity, my = Infinity;
  for (const [x, y] of points) { if (x < mx) mx = x; if (y < my) my = y; }
  const norm = points.map(([x, y]) => (x - mx) * 64 + (y - my)).sort((a, b) => a - b);
  return String.fromCharCode(...norm);
}

// cord lengths (cell-diagonal units) for a free shape given as [x,y] points
function cordData(points) {
  const maxx = Math.max(...points.map(p => p[0]));
  const maxy = Math.max(...points.map(p => p[1]));
  const gw = maxx + 1, gh = maxy + 1;
  const cells = Array.from({ length: gh }, () => Array(gw).fill(false));
  for (const [x, y] of points) cells[y][x] = true;
  const { cycles } = E.getAllCycles(cells, gw, gh);
  let total = 0, maxErr = 0;
  const ints = cycles.map(c => {
    const len = E.arcLen(c.points) / SQRT2;
    const r = Math.round(len);
    maxErr = Math.max(maxErr, Math.abs(len - r));
    total += r;
    return r;
  });
  ints.sort((a, b) => a - b);
  return { L: cycles.length, lens: ints, total, maxErr };
}

const gcd = (a, b) => b ? gcd(b, a % b) : a;
function isRect(points, n) {
  let mx = 0, my = 0;
  for (const [x, y] of points) { if (x > mx) mx = x; if (y > my) my = y; }
  return (mx + 1) * (my + 1) === n ? [mx + 1, my + 1] : null;
}
function countAdj(points) {
  const set = new Set(points.map(([x, y]) => x * 1000 + y));
  let e = 0;
  for (const [x, y] of points) {
    if (set.has((x + 1) * 1000 + y)) e++;
    if (set.has(x * 1000 + (y + 1))) e++;
  }
  return e; // orthogonal adjacent pairs (tree iff e === n-1)
}

// ---- aggregation (O(1) memory) ----
const freeCount = new Array(MAXN + 1).fill(0);
const fixedCount = new Array(MAXN + 1).fill(0);
const monolinear = new Array(MAXN + 1).fill(0); // L === 1 (trivially balanced), tallied separately
const stats = Array.from({ length: MAXN + 1 }, () => ({
  multi: 0, balanced: 0, unbalanced: 0,
  longestMulti: 0, maxImbalance: 1, maxImbalanceLens: null,
}));
const balancedRectCount = new Array(MAXN + 1).fill(0);
const balancedNonRectCount = new Array(MAXN + 1).fill(0);
const balancedByL = Array.from({ length: MAXN + 1 }, () => new Map()); // balanced boards by loop count L
const balancedWitnesses = Array.from({ length: MAXN + 1 }, () => []); // capped sample
let totalFails = 0, intFails = 0, rectFails = 0;

function visit(currentIdx, n, W, originX) {
  fixedCount[n]++;
  const points = currentIdx.map(idx => [(idx % W) - originX, (idx / W) | 0]);
  let mx = Infinity, my = Infinity;
  for (const p of points) { if (p[0] < mx) mx = p[0]; if (p[1] < my) my = p[1]; }
  const norm = points.map(([x, y]) => [x - mx, y - my]);
  const canon = canonicalKey(norm);
  if (keyOf(norm) !== canon) return; // tally each free shape once, on its canonical orientation
  freeCount[n]++;

  const cn = keyToPoints(canon);
  const { L, lens, total, maxErr } = cordData(cn);
  if (total !== 2 * n) totalFails++;
  if (maxErr > 1e-6) intFails++;

  if (L === 1) { monolinear[n]++; return; }

  const s = stats[n];
  s.multi++;
  const lo = lens[0], hi = lens[lens.length - 1];
  if (lo === hi) {
    s.balanced++;
    balancedByL[n].set(L, (balancedByL[n].get(L) || 0) + 1);
    const r = isRect(cn, n);
    if (r) {
      balancedRectCount[n]++;
      const g = gcd(r[0], r[1]);
      if (L !== g || hi !== 2 * r[0] * r[1] / g) rectFails++;
    } else {
      balancedNonRectCount[n]++;
      if (balancedWitnesses[n].length < WITNESS_CAP)
        balancedWitnesses[n].push({ cells: cn, L, len: hi, lens, tree: countAdj(cn) === n - 1 });
    }
  } else {
    s.unbalanced++;
  }
  if (hi > s.longestMulti) s.longestMulti = hi;
  const imb = hi / lo;
  if (imb > s.maxImbalance) { s.maxImbalance = imb; s.maxImbalanceLens = lens; }
}

function enumerate(maxN) {
  const W = 2 * maxN, H = maxN + 1, originX = maxN - 1;
  const origin = originX;
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
          if (ny === 0 && nx < originX) continue;
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

console.error(`Balanced-cord census up to n=${MAXN} ...`);
const t0 = Date.now();
enumerate(MAXN);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.error(`Done in ${elapsed}s. total=2n fails:${totalFails} integrality fails:${intFails} rect-gcd fails:${rectFails}`);

let countsOk = true;
for (let n = 1; n <= MAXN; n++) {
  if (A000105[n] !== undefined && freeCount[n] !== A000105[n]) countsOk = false;
  if (A001168[n] !== undefined && fixedCount[n] !== A001168[n]) countsOk = false;
}
console.error(countsOk ? 'All OEIS counts match (enumeration sound).' : 'COUNT MISMATCH — data invalid, do not publish.');

const ascii = (cells) => {
  const mx = Math.max(...cells.map(p => p[0])), my = Math.max(...cells.map(p => p[1]));
  const g = Array.from({ length: my + 1 }, () => Array(mx + 1).fill('.'));
  for (const [x, y] of cells) g[y][x] = '#';
  return g.map(r => r.join('')).join('\n');
};

console.log(`\n=== Balanced-cord spectrum ===`);
console.log(`n | free (ok?) | fixed (ok?) | monolinear | multi-cord | balanced | bal-rect | bal-nonrect | longestMulti | maxImbalance`);
console.log(`--|--|--|--|--|--|--|--|--|--`);
const balancedSeq = [], balancedNonRectSeq = [], longestMultiSeq = [], maxImbSeq = [];
for (let n = 1; n <= MAXN; n++) {
  const s = stats[n];
  balancedSeq.push(s.balanced);
  balancedNonRectSeq.push(balancedNonRectCount[n]);
  longestMultiSeq.push(s.longestMulti);
  maxImbSeq.push(+s.maxImbalance.toFixed(3));
  const okF = A000105[n] === undefined ? '(unv)' : freeCount[n] === A000105[n] ? '✓' : '✗' + A000105[n];
  const okX = A001168[n] === undefined ? '(unv)' : fixedCount[n] === A001168[n] ? '✓' : '✗' + A001168[n];
  console.log(`${n} | ${freeCount[n]} ${okF} | ${fixedCount[n]} ${okX} | ${monolinear[n]} | ${s.multi} | ${s.balanced} | ${balancedRectCount[n]} | ${balancedNonRectCount[n]} | ${s.longestMulti} | ${s.maxImbalance.toFixed(3)}`);
}

console.log(`\nbalanced multi-cord count (n=1..${MAXN}):  ${balancedSeq.join(', ')}`);
console.log(`balanced NON-rect count   (n=1..${MAXN}):  ${balancedNonRectSeq.join(', ')}`);
console.log(`longest cord (multi-cord) (n=1..${MAXN}):  ${longestMultiSeq.join(', ')}`);
console.log(`max imbalance hi/lo       (n=1..${MAXN}):  ${maxImbSeq.join(', ')}`);

console.log(`\n=== Balanced boards by loop count L ===`);
for (let n = 1; n <= MAXN; n++) {
  if (!balancedByL[n].size) continue;
  const parts = [...balancedByL[n].entries()].sort((a, b) => a[0] - b[0]).map(([L, c]) => `L=${L}:${c}`);
  console.log(`n=${n}: ${parts.join('  ')}`);
}

console.log(`\n=== Sample non-rect balanced witnesses (capped ${WITNESS_CAP}/n) ===`);
for (let n = 1; n <= MAXN; n++) {
  if (!balancedWitnesses[n].length) continue;
  const w = balancedWitnesses[n][0];
  console.log(`\nn=${n} (${balancedNonRectCount[n]} total) e.g. L=${w.L} cords ${w.lens.join(',')} tree=${w.tree}`);
  console.log(ascii(w.cells));
}

const result = {
  maxN: MAXN, elapsedSeconds: +elapsed, countsOk, totalFails, intFails, rectFails,
  balancedSeq, balancedNonRectSeq, longestMultiSeq, maxImbSeq,
  perN: {},
};
for (let n = 1; n <= MAXN; n++) {
  const s = stats[n];
  result.perN[n] = {
    free: freeCount[n], fixed: fixedCount[n],
    freeOk: A000105[n] === undefined ? null : freeCount[n] === A000105[n],
    fixedOk: A001168[n] === undefined ? null : fixedCount[n] === A001168[n],
    monolinear: monolinear[n], multi: s.multi, balanced: s.balanced,
    balancedRect: balancedRectCount[n], balancedNonRect: balancedNonRectCount[n],
    longestMulti: s.longestMulti, maxImbalance: +s.maxImbalance.toFixed(4),
    maxImbalanceLens: s.maxImbalanceLens,
    balancedByL: Object.fromEntries([...balancedByL[n].entries()].sort((a, b) => a[0] - b[0])),
    witnesses: balancedWitnesses[n].map(w => ({ cells: w.cells, L: w.L, len: w.len, lens: w.lens, tree: w.tree })),
  };
}

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'artifacts'), { recursive: true });
writeFileSync(join(here, 'artifacts', `cord-balance-census-${MAXN}.json`), JSON.stringify(result, null, 2));
console.error(`\nWrote scripts/artifacts/cord-balance-census-${MAXN}.json`);
