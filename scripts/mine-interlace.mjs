/*
 * Mine the polyomino space for BEAUTIFUL boards — the anti-staircases.
 * The staircase maximizes loop count by preventing all interlacing (its loops
 * never cross). Here we hunt the opposite: shapes whose loops are maximally
 * woven through each other.
 *
 * Per shape: every cell center is the crossing of exactly two diagonal strands.
 * interCross = number of cells whose two diagonals belong to DIFFERENT loops.
 * Leaderboards at n=12 (63,600 free shapes):
 *   A) max interCross for L = 2, 3, 4
 *   B) L >= 3 where every pair of loops crosses ("mutually woven"), max total
 *   C) non-rectangles where all loops have equal length (balance!)
 *
 *   node scripts/mine-interlace.mjs [n]   (default 12)
 */
import '../src/engine.js';
const E = globalThis.TearEngine;
const N = Math.max(4, Math.min(14, parseInt(process.argv[2] || '12', 10)));

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

function analyze(points) {
  const mx = Math.max(...points.map(p => p[0])), my = Math.max(...points.map(p => p[1]));
  const gw = mx + 1, gh = my + 1;
  const cells = Array.from({ length: gh }, () => Array(gw).fill(false));
  for (const [x, y] of points) cells[y][x] = true;
  const { cycles } = E.getAllCycles(cells, gw, gh);
  const L = cycles.length;
  if (L < 2) return { L };
  // diagonal ownership per cell center
  const own = new Map(); // "cx,cy" -> {bs:ci, fs:ci}
  cycles.forEach((cd, ci) => {
    const pts = cd.points;
    for (let s = 0; s < pts.length - 1; s++) {
      const p1 = pts[s], p2 = pts[s + 1];
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      if (sdx === 0 || sdy === 0) continue;
      const len = Math.round(Math.abs(p2.x - p1.x));
      const axis = sdx === sdy ? 'bs' : 'fs';
      for (let t = 0; t < len; t++) {
        const cx = p1.x + sdx * (t + 0.5), cy = p1.y + sdy * (t + 0.5);
        const key = cx.toFixed(1) + ',' + cy.toFixed(1);
        let e = own.get(key);
        if (!e) { e = {}; own.set(key, e); }
        e[axis] = ci;
      }
    }
  });
  let interCross = 0;
  const pair = new Map(); // "i-j" -> count
  for (const e of own.values()) {
    if (e.bs === undefined || e.fs === undefined) continue;
    if (e.bs !== e.fs) {
      interCross++;
      const k = Math.min(e.bs, e.fs) + '-' + Math.max(e.bs, e.fs);
      pair.set(k, (pair.get(k) || 0) + 1);
    }
  }
  const allPairsCross = pair.size === (L * (L - 1)) / 2;
  const lens = cycles.map(cd => Math.round(E.arcLen(cd.points) * 100) / 100);
  const equalLens = lens.every(l => Math.abs(l - lens[0]) < 0.01);
  const isRect = points.length === gw * gh;
  return { L, interCross, allPairsCross, equalLens, isRect, lens, minPair: Math.min(...pair.values()) };
}

function ascii(points) {
  const mx = Math.max(...points.map(p => p[0])), my = Math.max(...points.map(p => p[1]));
  const g = Array.from({ length: my + 1 }, () => Array(mx + 1).fill('.'));
  for (const [x, y] of points) g[y][x] = '#';
  return g.map(r => r.join('')).join('\n');
}

const best = { 2: null, 3: null, 4: null };
let bestWoven = null; // L>=3, all pairs cross, max (minPair, interCross)
const equalNonRect = []; // examples
const seen = new Set();
let count = 0;

function enumerate(maxN) {
  const W = 2 * maxN, H = maxN + 1, originX = maxN - 1;
  const occupied = new Uint8Array(W * H), reached = new Uint8Array(W * H);
  const current = [];
  function rec(untried, size) {
    let i = untried.length;
    while (i > 0) {
      const c = untried[--i];
      occupied[c] = 1; current.push(c);
      if (size + 1 === maxN) {
        const pts0 = current.map(idx => [(idx % W) - originX, (idx / W) | 0]);
        let mx = Infinity, my = Infinity;
        for (const p of pts0) { if (p[0] < mx) mx = p[0]; if (p[1] < my) my = p[1]; }
        const pts = pts0.map(([x, y]) => [x - mx, y - my]);
        const key = canonicalKey(pts);
        if (!seen.has(key)) {
          seen.add(key); count++;
          const a = analyze(pts);
          if (a.L >= 2 && a.L <= 4) {
            if (!best[a.L] || a.interCross > best[a.L].interCross) best[a.L] = { ...a, pts };
          }
          if (a.L >= 3 && a.allPairsCross) {
            const score = a.minPair * 1000 + a.interCross;
            if (!bestWoven || score > (bestWoven.minPair * 1000 + bestWoven.interCross)) bestWoven = { ...a, pts };
          }
          if (a.L >= 2 && a.equalLens && !a.isRect && equalNonRect.length < 3) equalNonRect.push({ ...a, pts });
        }
      } else {
        const x = c % W, y = (c / W) | 0;
        const added = [], next = untried.slice(0, i);
        for (const nb of [x + 1 < W ? c + 1 : -1, x - 1 >= 0 ? c - 1 : -1, y + 1 < H ? c + W : -1, y - 1 >= 0 ? c - W : -1]) {
          if (nb < 0) continue;
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
  reached[originX] = 1;
  rec([originX], 0);
}

console.error(`Mining all free ${N}-cell polyominoes for interlacing...`);
const t0 = Date.now();
enumerate(N);
console.error(`Scanned ${count} shapes in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

for (const L of [2, 3, 4]) {
  if (!best[L]) continue;
  const b = best[L];
  console.log(`MOST INTERLACED with L=${L}: ${b.interCross}/${N} cells are between-loop crossings; loop lengths ${b.lens.join(', ')}${b.equalLens ? ' (EQUAL!)' : ''}${b.allPairsCross ? ' — every pair crosses' : ''}`);
  console.log(ascii(b.pts) + '\n');
}
if (bestWoven) {
  console.log(`BEST MUTUALLY-WOVEN (L=${bestWoven.L}, every pair crosses, weakest pair ${bestWoven.minPair}×, total ${bestWoven.interCross}):`);
  console.log(ascii(bestWoven.pts) + '\n');
}
for (const e of equalNonRect) {
  console.log(`EQUAL-LENGTH NON-RECTANGLE (L=${e.L}, each loop ${e.lens[0]}, ${e.interCross} inter-loop crossings):`);
  console.log(ascii(e.pts) + '\n');
}
