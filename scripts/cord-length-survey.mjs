/*
 * Cord-length survey: distribution of cord (cord = closed mirror-curve loop)
 * lengths over free polyominoes, computed with João's verified billiard engine.
 *
 *   node scripts/cord-length-survey.mjs [maxN]      (default 10)
 *
 * Length unit = cell-diagonal: arcLen(points)/sqrt(2). Total over all cords on
 * any board = 2n (re-verified per board). The object of study is the PARTITION
 * of 2n among the L cords.
 *
 * Reuses the Redelmeier enumerator + canonicalisation from polyomino-loops.mjs,
 * whose OEIS-count and gcd/scaling self-checks are already trusted.
 *
 * Emits: scripts/artifacts/cord-length-survey-<maxN>.json + a stdout report.
 *   - per-n: multi-cord count, balanced count, unbalanced count
 *   - every NON-RECTANGLE balanced witness (cells + length multiset)
 *   - longest cord, max imbalance, length-multiset stats
 */
import '../src/engine.js';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const E = globalThis.TearEngine;
const SQRT2 = Math.SQRT2;
const MAXN = Math.max(1, Math.min(13, parseInt(process.argv[2] || '10', 10)));

const A000105 = [0, 1, 1, 2, 5, 12, 35, 108, 369, 1285, 4655, 17073, 63600, 238591];
const A001168 = [0, 1, 2, 6, 19, 63, 216, 760, 2725, 9910, 36446, 135268, 505861, 1903890];

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
    best = best === null ? String.fromCharCode(...norm)
                         : (String.fromCharCode(...norm) < best ? String.fromCharCode(...norm) : best);
  }
  return best;
}
function keyToPoints(key) {
  return [...key].map(c => { const v = c.charCodeAt(0); return [(v / 64) | 0, v % 64]; });
}

// ---- cord lengths for a free shape given as [x,y] points ----
function cordData(points, n) {
  const maxx = Math.max(...points.map(p => p[0]));
  const maxy = Math.max(...points.map(p => p[1]));
  const gw = maxx + 1, gh = maxy + 1;
  const cells = Array.from({ length: gh }, () => Array(gw).fill(false));
  for (const [x, y] of points) cells[y][x] = true;
  const { cycles } = E.getAllCycles(cells, gw, gh);
  const lens = cycles.map(c => E.arcLen(c.points) / SQRT2);
  // integrality + total sanity
  let total = 0, maxErr = 0;
  const ints = lens.map(L => {
    const r = Math.round(L);
    maxErr = Math.max(maxErr, Math.abs(L - r));
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
  return e; // orthogonal adjacent pairs
}

// ---- aggregation ----
const freeSeen = Array.from({ length: MAXN + 1 }, () => new Set());
const fixedCount = new Array(MAXN + 1).fill(0);
const stats = Array.from({ length: MAXN + 1 }, () => ({
  multi: 0, balanced: 0, unbalanced: 0,
  longestAny: 0,          // max cord over ALL boards
  longestMulti: 0,        // max cord over boards with L>=2
  maxImbalance: 1,        // max (maxcord/mincord) over L>=2 boards
  maxImbalanceShape: null,
  longestMultiShape: null,
}));
const balancedWitnesses = Array.from({ length: MAXN + 1 }, () => []); // non-rect balanced
const balancedRectCount = new Array(MAXN + 1).fill(0);
let totalFails = 0, intFails = 0, rectFails = 0;

function visit(currentIdx, n, W, originX) {
  fixedCount[n]++;
  const points = currentIdx.map(idx => [(idx % W) - originX, (idx / W) | 0]);
  let mx = Infinity, my = Infinity;
  for (const p of points) { if (p[0] < mx) mx = p[0]; if (p[1] < my) my = p[1]; }
  const norm = points.map(([x, y]) => [x - mx, y - my]);
  const key = canonicalKey(norm);
  if (freeSeen[n].has(key)) return;
  freeSeen[n].add(key);

  const cn = keyToPoints(key);
  const { L, lens, total, maxErr } = cordData(cn, n);
  if (total !== 2 * n) totalFails++;
  if (maxErr > 1e-6) intFails++;

  const r = isRect(cn, n);
  const lo = lens[0], hi = lens[lens.length - 1];
  const s = stats[n];
  if (hi > s.longestAny) s.longestAny = hi;

  if (L >= 2) {
    s.multi++;
    const balanced = lo === hi;
    if (balanced) {
      s.balanced++;
      if (r) {
        balancedRectCount[n]++;
        // gcd theorem self-check: rect cords all equal to 2mn/gcd
        const g = gcd(r[0], r[1]);
        if (L !== g || hi !== 2 * r[0] * r[1] / g) rectFails++;
      } else {
        balancedWitnesses[n].push({ key, cells: cn, L, len: hi, lens, adj: countAdj(cn) });
      }
    } else {
      s.unbalanced++;
    }
    if (hi > s.longestMulti) { s.longestMulti = hi; s.longestMultiShape = key; }
    const imb = hi / lo;
    if (imb > s.maxImbalance) { s.maxImbalance = imb; s.maxImbalanceShape = { key, lens }; }
  }
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

console.error(`Cord-length survey up to n=${MAXN} ...`);
const t0 = Date.now();
enumerate(MAXN);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.error(`Done in ${elapsed}s. total=2n fails:${totalFails} integrality fails:${intFails} rect-gcd fails:${rectFails}`);

// validate free counts
let countsOk = true;
for (let n = 1; n <= MAXN; n++) if (freeSeen[n].size !== A000105[n] || fixedCount[n] !== A001168[n]) countsOk = false;
console.error(countsOk ? 'OEIS free/fixed counts match (enumeration sound).' : 'COUNT MISMATCH (data invalid).');

// ---- report ----
const ascii = (cells) => {
  const mx = Math.max(...cells.map(p => p[0])), my = Math.max(...cells.map(p => p[1]));
  const g = Array.from({ length: my + 1 }, () => Array(mx + 1).fill('.'));
  for (const [x, y] of cells) g[y][x] = '#';
  return g.map(r => r.join('')).join('\n');
};

console.log(`\n=== Spectrum ===`);
console.log(`n | free | multi-cord | balanced | unbalanced | bal-rect | bal-nonrect | longestMulti | maxImbalance`);
console.log(`--|------|-----------|----------|------------|----------|-------------|--------------|-------------`);
const balancedSeq = [], balancedNonRectSeq = [], longestMultiSeq = [], maxImbSeq = [];
for (let n = 1; n <= MAXN; n++) {
  const s = stats[n];
  const bnr = balancedWitnesses[n].length;
  balancedSeq.push(s.balanced);
  balancedNonRectSeq.push(bnr);
  longestMultiSeq.push(s.longestMulti);
  maxImbSeq.push(+s.maxImbalance.toFixed(3));
  console.log(`${n} | ${freeSeen[n].size} | ${s.multi} | ${s.balanced} | ${s.unbalanced} | ${balancedRectCount[n]} | ${bnr} | ${s.longestMulti} | ${s.maxImbalance.toFixed(3)}`);
}

console.log(`\nbalanced multi-cord count (n=1..${MAXN}):      ${balancedSeq.join(', ')}`);
console.log(`balanced NON-rect count (n=1..${MAXN}):         ${balancedNonRectSeq.join(', ')}`);
console.log(`longest cord on a multi-cord board (n=1..${MAXN}): ${longestMultiSeq.join(', ')}`);
console.log(`max imbalance (maxcord/mincord) (n=1..${MAXN}):    ${maxImbSeq.join(', ')}`);

console.log(`\n=== Non-rectangle balanced witnesses ===`);
for (let n = 1; n <= MAXN; n++) {
  if (!balancedWitnesses[n].length) continue;
  console.log(`\n--- n=${n}: ${balancedWitnesses[n].length} non-rect balanced ---`);
  for (const w of balancedWitnesses[n]) {
    const isTree = w.adj === n - 1;
    console.log(`L=${w.L} each cord=${w.len} (lens ${w.lens.join(',')}) tree=${isTree}`);
    console.log(ascii(w.cells));
  }
}

const result = {
  maxN: MAXN, elapsedSeconds: +elapsed, countsOk, totalFails, intFails, rectFails,
  balancedSeq, balancedNonRectSeq, longestMultiSeq, maxImbSeq,
  perN: {}, balancedWitnesses: {},
};
for (let n = 1; n <= MAXN; n++) {
  const s = stats[n];
  result.perN[n] = {
    free: freeSeen[n].size, multi: s.multi, balanced: s.balanced, unbalanced: s.unbalanced,
    balancedRect: balancedRectCount[n], balancedNonRect: balancedWitnesses[n].length,
    longestMulti: s.longestMulti, maxImbalance: +s.maxImbalance.toFixed(4),
    maxImbalanceShape: s.maxImbalanceShape ? s.maxImbalanceShape.lens : null,
  };
  result.balancedWitnesses[n] = balancedWitnesses[n].map(w => ({ cells: w.cells, L: w.L, len: w.len, lens: w.lens, tree: w.adj === n - 1 }));
}

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'artifacts'), { recursive: true });
writeFileSync(join(here, 'artifacts', `cord-length-survey-${MAXN}.json`), JSON.stringify(result, null, 2));
console.error(`\nWrote scripts/artifacts/cord-length-survey-${MAXN}.json`);
