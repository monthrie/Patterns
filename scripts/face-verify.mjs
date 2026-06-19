#!/usr/bin/env node
// face-verify.mjs — proves the animation (src/face-trace.js) is correct.
// Loads the SAME browser module the page uses, runs it under Node, and checks, for
// several boards, every property the animation depends on:
//   1. COVERAGE  — every nail/face pair belongs to exactly one cord (nothing missed/double).
//   2. CLOSURE   — every cord returns to its own start (no loose ends).
//   3. CONTINUITY— the drawn pieces join up (each piece ends where the next begins; last == first).
//   4. THE RULE  — every CROSS sits on a TIED edge, every TURN on an OPEN edge (recomputed from scratch).
//   5. NAILS     — every turning point is a real boundary nail (gap).
//   6. COUNT     — matches independently-known values (gcd for plain rects; the pouch table; L cuff = 8).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
(0, eval)(readFileSync(path.join(ROOT, 'src', 'engine.js'), 'utf8'));        // sets globalThis.TearEngine
(0, eval)(readFileSync(path.join(ROOT, 'src', 'face-trace.js'), 'utf8'));    // sets globalThis.FaceTrace (the page's module)
const TE = globalThis.TearEngine, FT = globalThis.FaceTrace;

// re-trace a cord from its seed, recording the TRUE billiard state at each nail: (nail, face, direction)
function traceSlots(shape, openSet, g0, f0) {
  const { gaps, edges, eAt } = shape;
  const sc = gaps[g0]; let { dx, dy } = TE.getInitialDir(sc);
  let x = sc.x, y = sc.y, face = f0; const start = `${x}|${y}|${dx}|${dy}|${face}`;
  const keys = new Set([`${g0}:${face}:${dx}:${dy}`]);
  for (let it = 0; it < edges.length * 400 + gaps.length * 8 + 4000; it++) {
    let minT = Infinity, hitH = false, hitV = false;
    for (const e of edges) { let t;
      if (e.type === 'h') { if (Math.abs(dy) < 1e-9) continue; t = (e.y - y) / dy; if (t < 1e-9) continue; const hx = x + dx * t; if (hx < e.x0 - 1e-9 || hx > e.x1 + 1e-9) continue; }
      else { if (Math.abs(dx) < 1e-9) continue; t = (e.x - x) / dx; if (t < 1e-9) continue; const hy = y + dy * t; if (hy < e.y0 - 1e-9 || hy > e.y1 + 1e-9) continue; }
      if (t < minT - 1e-9) { minT = t; hitH = e.type === 'h'; hitV = e.type === 'v'; } else if (Math.abs(t - minT) < 1e-7) { if (e.type === 'h') hitH = true; if (e.type === 'v') hitV = true; } }
    if (minT === Infinity) break;
    x = Math.round((x + dx * minT) * 1e6) / 1e6; y = Math.round((y + dy * minT) * 1e6) / 1e6;
    let tied = 0; for (const e of eAt(x, y)) if (!openSet.has(e.id)) tied++;
    if (hitH && hitV) { dx = -dx; dy = -dy; } else if (hitH) { dy = -dy; } else { dx = -dx; }
    if ((tied % 2) === 1) face ^= 1;
    const gi = TE.pointToGapIdx(x, y, gaps);
    if (gi >= 0) keys.add(`${gi}:${face}:${dx}:${dy}`);
    if (`${x}|${y}|${dx}|${dy}|${face}` === start) break;
  }
  return keys;
}
const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
let allPass = true;
const mark = ok => { if (!ok) allPass = false; return ok ? 'PASS' : 'FAIL <<<'; };

function audit(label, cells, openNames, expectCount) {
  const shape = FT.build(cells);
  const openSet = FT.namedEdges(shape, openNames);
  const { cords } = FT.traceAll(cells, openSet);
  const G = shape.gaps;

  // 1a. coverage: every nail/face is laid by some cord (nothing missed).
  const owner = new Map();
  cords.forEach((c, ci) => { for (const s of new Set(c.states)) { if (!owner.has(s)) owner.set(s, new Set()); owner.get(s).add(ci); } });
  const fullCoverage = owner.size === 2 * G.length;
  // 1b. disjoint orbits: in the TRUE state (nail, face, direction), the cords partition the
  //     space with no overlap; shared nails are interlaces, not branch points.
  const slotOf = new Set(); let disjoint = true, slotTotal = 0;
  for (const c of cords) {
    const [g0, f0] = c.states[0].split(':').map(Number);
    const ks = traceSlots(shape, openSet, g0, f0);
    slotTotal += ks.size;
    for (const k of ks) { if (slotOf.has(k)) disjoint = false; slotOf.add(k); }
  }
  const coverage = fullCoverage && disjoint && slotTotal === slotOf.size;
  const seen = owner;

  // 2. closure
  const closure = cords.every(c => c.closed);

  // 3. continuity of the pieces (what the animation draws)
  let continuity = true;
  const same = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;
  for (const c of cords) {
    const ps = c.pieces.filter(p => p.pts.length);
    for (let i = 0; i < ps.length - 1; i++) {
      const end = ps[i].pts[ps[i].pts.length - 1], nxt = ps[i + 1].pts[0];
      if (!same(end, nxt)) continuity = false;          // hand-off point must match
    }
    const first = ps[0].pts[0], last = ps[ps.length - 1].pts[ps[ps.length - 1].pts.length - 1];
    if (!same(first, last)) continuity = false;          // closes back on itself
  }

  // 4. the rule + 5. nails: recompute cross/turn from scratch at every event
  let ruleOK = true, nailsOK = true;
  for (const c of cords) {
    for (const ev of c.events) {
      if (TE.pointToGapIdx(ev.x, ev.y, G) < 0) nailsOK = false;      // every event is on a nail
      if (ev.kind === 'start') continue;
      let tied = 0; for (const e of shape.eAt(ev.x, ev.y)) if (!openSet.has(e.id)) tied++;
      const shouldCross = (tied % 2) === 1;
      if ((ev.kind === 'cross') !== shouldCross) ruleOK = false;     // cross<->tied, turn<->open
    }
  }

  // 6. count vs independently-known value
  const countOK = expectCount == null ? true : cords.length === expectCount;

  console.log(`\n${label}   open=[${openNames}]   ->  ${cords.length} cords`);
  console.log(`   coverage + disjoint orbits      : ${mark(coverage)}  (${seen.size}/${2 * G.length} nail-faces, orbits disjoint=${disjoint})`);
  console.log(`   closure  (returns to start)     : ${mark(closure)}`);
  console.log(`   continuity (pieces join up)     : ${mark(continuity)}`);
  console.log(`   the rule (cross=tied, turn=open): ${mark(ruleOK)}`);
  console.log(`   nails    (turns on boundary)    : ${mark(nailsOK)}`);
  if (expectCount != null) console.log(`   count == known value ${expectCount}        : ${mark(countOK)}`);
}

const rect = (w, h) => FT.rect(w, h);
const L = FT.Lpanel(19, 11, 11, 3);

// pouch counts (top open) are the verified values from cords.mjs selftest; gcd is the plain-billiard law
audit('rect 6x4', rect(6, 4), ['top'], 2);
audit('rect 8x12', rect(8, 12), ['top'], 8);
audit('rect 4x6', rect(4, 6), ['top'], 4);
audit('rect 3x4', rect(3, 4), ['top'], 1);
audit('L boot panel', L, ['cuff'], 8);
audit('L boot panel', L, ['sole'], 13);

// independent sanity: with NO open edge the plain flat billiard count must equal gcd for a full rect
for (const [w, h] of [[6, 4], [8, 12], [5, 5]]) {
  const n = TE.getAllCycles(rect(w, h), w, h).cycles.length;
  console.log(`\nflat billiard ${w}x${h}: ${n} cycles vs gcd(${w},${h})=${gcd(w, h)}  : ${mark(n === gcd(w, h))}`);
}

console.log(`\n================  ${allPass ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'}  ================`);
process.exit(allPass ? 0 : 1);
