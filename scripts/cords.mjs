#!/usr/bin/env node
// ============================================================================
// cords.mjs — one reliable tool for two-faced billiard cords.
//
// THE RULE (the whole thing):
//   A cord is a 45-degree path that REFLECTS at every wall.
//   - at a TIED wall  -> it SWITCHES face (front <-> back).
//   - at an OPEN wall  -> it STAYS on the same face.
//   Every cord closes back on its own start ("returns to pappa").
//
// USAGE
//   node scripts/cords.mjs 6x4 --open top                      counts + closure check
//   node scripts/cords.mjs 6x4 --open top --out a.svg          draw all cords, front+back
//   node scripts/cords.mjs 6x4 --open top --cord 0 --out a.svg draw just cord 0
//   node scripts/cords.mjs 6x4 --open top --weave --out a.svg  basket weave (under/over)
//   node scripts/cords.mjs L   --open cuff --out a.svg         the boot L (19x11 notch 11x3)
//   flags: --number  --thick 0.5  --flipback  --test
//
// Shapes:  WxH  (rectangle)   |   L  (=19x11 notch 11x3)   |   L:W,H,nw,nh
// Open edges (comma list): top bottom left right  (rect)  /  cuff sole ...  (named below)
// To turn the .svg into a .png:  qlmanage -t -s 1600 -o . a.svg   (macOS)
// ============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
(0, eval)(readFileSync(path.join(ROOT, 'src', 'engine.js'), 'utf8'));
const TE = globalThis.TearEngine;
const EPS = 1e-9;
const PALETTE = ['#e0556b', '#3aa6b8', '#f2c14e', '#5ad18a', '#f2914e', '#4a7af2', '#9a6ae0', '#e06ab0', '#8ab840', '#2e9a5e', '#c41878', '#e8a020'];

// ---- shapes ----------------------------------------------------------------
const rect = (w, h) => Array.from({ length: h }, () => Array(w).fill(true));
const Lpanel = (W, H, nw, nh) => Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !(y < nh && x < nw)));
function parseShape(s) {
  if (/^\d+x\d+$/.test(s)) { const [w, h] = s.split('x').map(Number); return { cells: rect(w, h), kind: 'rect' }; }
  if (s === 'L') return { cells: Lpanel(19, 11, 11, 3), kind: 'L' };
  if (s.startsWith('L:')) { const [W, H, nw, nh] = s.slice(2).split(',').map(Number); return { cells: Lpanel(W, H, nw, nh), kind: 'L' }; }
  throw new Error('shape must be WxH, L, or L:W,H,nw,nh');
}
function build(cells) {
  const gh = cells.length, gw = cells[0].length;
  const edges = TE.buildEdges(cells, gw, gh).map((e, i) => ({ ...e, id: i }));
  const gaps = TE.buildGaps(cells, gw, gh);
  const eAt = (px, py) => edges.filter(e => e.type === 'h'
    ? (Math.abs(py - e.y) < 1e-6 && px > e.x0 - 1e-6 && px < e.x1 + 1e-6)
    : (Math.abs(px - e.x) < 1e-6 && py > e.y0 - 1e-6 && py < e.y1 + 1e-6));
  return { gw, gh, cells, edges, gaps, eAt };
}
// friendly edge names -> edge ids
function namedEdges(shape, names) {
  const set = new Set();
  for (const nm of names) {
    let e;
    if (nm === 'top' || nm === 'cuff') e = shape.edges.filter(e => e.type === 'h').sort((a, b) => a.y - b.y)[0];
    else if (nm === 'bottom' || nm === 'sole') e = shape.edges.filter(e => e.type === 'h').sort((a, b) => b.y - a.y)[0];
    else if (nm === 'left') e = shape.edges.filter(e => e.type === 'v').sort((a, b) => a.x - b.x)[0];
    else if (nm === 'right') e = shape.edges.filter(e => e.type === 'v').sort((a, b) => b.x - a.x)[0];
    if (e) set.add(e.id);
  }
  return set;
}

// ---- the trace (THE RULE) --------------------------------------------------
function traceCord(shape, g0, f0, openSet) {
  const { gaps, edges, eAt } = shape;
  const sc = gaps[g0];
  let { dx, dy } = TE.getInitialDir(sc);
  let x = sc.x, y = sc.y, face = f0;
  const startKey = `${x}|${y}|${dx}|${dy}|${face}`;
  const pieces = [{ face, pts: [{ x, y }] }];
  const states = [`${g0}:${face}`];
  const events = [{ x, y, face, kind: 'start' }];
  let closed = false;
  for (let it = 0; it < edges.length * 400 + gaps.length * 8 + 4000; it++) {
    let minT = Infinity, hitH = false, hitV = false;
    for (const e of edges) {
      let t;
      if (e.type === 'h') { if (Math.abs(dy) < EPS) continue; t = (e.y - y) / dy; if (t < EPS) continue; const hx = x + dx * t; if (hx < e.x0 - EPS || hx > e.x1 + EPS) continue; }
      else { if (Math.abs(dx) < EPS) continue; t = (e.x - x) / dx; if (t < EPS) continue; const hy = y + dy * t; if (hy < e.y0 - EPS || hy > e.y1 + EPS) continue; }
      if (t < minT - EPS) { minT = t; hitH = e.type === 'h'; hitV = e.type === 'v'; }
      else if (Math.abs(t - minT) < EPS * 100) { if (e.type === 'h') hitH = true; if (e.type === 'v') hitV = true; }
    }
    if (minT === Infinity || minT > 1e6) break;
    x = Math.round((x + dx * minT) * 1e6) / 1e6; y = Math.round((y + dy * minT) * 1e6) / 1e6;
    pieces[pieces.length - 1].pts.push({ x, y });
    const here = eAt(x, y);
    let tied = 0; for (const e of here) if (!openSet.has(e.id)) tied++;
    if (hitH && hitV) { dx = -dx; dy = -dy; } else if (hitH) { dy = -dy; } else { dx = -dx; }   // REFLECT (always)
    const gi = TE.pointToGapIdx(x, y, gaps);
    const cross = (tied % 2) === 1;                                                              // SWITCH face iff tied
    if (gi >= 0) { events.push({ x, y, face, kind: cross ? 'cross' : 'turn', to: face ^ 1 }); states.push(`${gi}:${face}`); }
    if (cross) { face ^= 1; pieces.push({ face, pts: [{ x, y }] }); if (gi >= 0) states.push(`${gi}:${face}`); }
    if (`${x}|${y}|${dx}|${dy}|${face}` === startKey) { closed = true; break; }
  }
  return { pieces, states, events, closed, faces: new Set(states.map(s => +s.split(':')[1])) };
}
function traceAll(cells, openSet) {
  const shape = build(cells);
  const seen = new Set(), cords = [];
  for (let f = 0; f < 2; f++) for (let g = 0; g < shape.gaps.length; g++) {
    if (seen.has(`${g}:${f}`)) continue;
    const c = traceCord(shape, g, f, openSet);
    c.states.forEach(s => seen.add(s));
    cords.push(c);
  }
  return { shape, cords };
}

// ---- weave (under/over) ----------------------------------------------------
// cut a strand where it dives UNDER at a crossing (checkerboard parity). flip = the other face.
function weaveSegments(W, H, pts, g, flip) {
  const out = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const p1 = pts[s], p2 = pts[s + 1];
    const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
    if (sdx === 0 || sdy === 0) { out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }); continue; }
    const ux = p2.x - p1.x, uy = p2.y - p1.y, len = Math.hypot(ux, uy), nx = ux / len, ny = uy / len;
    const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
    const cuts = [];
    if (sdx === sdy) { const kVal = p1.y - p1.x, ki = Math.round(kVal - 0.5);
      for (let mi = -1; mi <= W + H; mi++) { const mVal = mi + 0.5, ix = (mVal - kVal) / 2, iy = (mVal + kVal) / 2;
        if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01 && (((ki + mi + W) % 2) === (flip ? 0 : 1))) cuts.push({ ix, iy }); } }
    else { const mVal = p1.y + p1.x, mi = Math.round(mVal - 0.5);
      for (let ki = -W; ki <= H; ki++) { const kVal2 = ki + 0.5, ix = (mVal - kVal2) / 2, iy = (mVal + kVal2) / 2;
        if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01 && (((ki + mi + W) % 2) === (flip ? 1 : 0))) cuts.push({ ix, iy }); } }
    cuts.sort((a, b) => ((a.ix - p1.x) * nx + (a.iy - p1.y) * ny) - ((b.ix - p1.x) * nx + (b.iy - p1.y) * ny));
    let cx = p1.x, cy = p1.y;
    for (const c of cuts) { const gsx = c.ix - nx * g, gsy = c.iy - ny * g;
      if ((gsx - cx) * nx + (gsy - cy) * ny > 0.02) out.push({ x1: cx, y1: cy, x2: gsx, y2: gsy }); cx = c.ix + nx * g; cy = c.iy + ny * g; }
    if ((p2.x - cx) * nx + (p2.y - cy) * ny > 0.02) out.push({ x1: cx, y1: cy, x2: p2.x, y2: p2.y });
  }
  return out;
}

// ---- render ----------------------------------------------------------------
function render(shape, cords, opts) {
  const { gw: W, gh: H } = shape;
  const CS = Math.max(26, Math.min(60, Math.round(680 / Math.max(W, H))));
  const PAD = Math.round(CS * 0.8), FW = W * CS + 2 * PAD, FH = H * CS + 2 * PAD, GX = 70;
  const ox0 = 0, ox1 = FW + GX;
  const fx = (o, x) => (o + PAD + x * CS).toFixed(1), fy = y => (PAD + y * CS).toFixed(1);
  const thick = (opts.thick != null ? opts.thick : (opts.weave ? 0.7 : 0.18)) * CS;
  const which = opts.cord != null ? [cords[opts.cord]] : cords;
  const P = [`<svg viewBox="0 0 ${2 * FW + GX} ${FH + 50}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0c0f13"/>`];
  for (const [o, lbl] of [[ox0, 'FRONT'], [ox1, 'BACK']]) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (shape.cells[y][x]) P.push(`<rect x="${fx(o, x)}" y="${fy(y)}" width="${CS}" height="${CS}" fill="#11161c" stroke="#1a232c" stroke-width="0.5"/>`);
    for (const e of shape.edges) { const open = opts.openSet.has(e.id), col = open ? '#e0556b' : '#3a4a55', d = open ? 'stroke-dasharray="7 5"' : '';
      if (e.type === 'h') P.push(`<line x1="${fx(o, e.x0)}" y1="${fy(e.y)}" x2="${fx(o, e.x1)}" y2="${fy(e.y)}" stroke="${col}" stroke-width="4" ${d}/>`);
      else P.push(`<line x1="${fx(o, e.x)}" y1="${fy(e.y0)}" x2="${fx(o, e.x)}" y2="${fy(e.y1)}" stroke="${col}" stroke-width="4" ${d}/>`); }
    P.push(`<text x="${fx(o, W / 2)}" y="${PAD - 12}" fill="#cfe3ea" font-family="monospace" font-size="16" text-anchor="middle">${lbl}</text>`);
  }
  // draw a chosen set of cords (default: all). each its own colour. weave = under/over.
  const drawIdx = opts.cordList || cords.map((_, i) => i);
  drawIdx.forEach((ci) => {
    const c = cords[ci]; if (!c) return;
    const col = (drawIdx.length === 1 && opts.color) ? opts.color : PALETTE[ci % PALETTE.length];
    for (const pc of c.pieces) {
      if (pc.pts.length < 2) continue;
      const o = pc.face === 0 ? ox0 : ox1;
      if (opts.weave) {
        for (const s of weaveSegments(W, H, pc.pts, 0.36, opts.flipback && pc.face === 1))
          P.push(`<line x1="${fx(o, s.x1)}" y1="${fy(s.y1)}" x2="${fx(o, s.x2)}" y2="${fy(s.y2)}" stroke="${col}" stroke-width="${thick.toFixed(1)}" stroke-linecap="butt"/>`);
        for (const p of pc.pts) if (TE.pointToGapIdx(p.x, p.y, shape.gaps) >= 0) P.push(`<circle cx="${fx(o, p.x)}" cy="${fy(p.y)}" r="${(thick / 2).toFixed(1)}" fill="${col}"/>`);
      } else {
        P.push(`<polyline points="${pc.pts.map(p => `${fx(o, p.x)},${fy(p.y)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${thick.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
    }
  });
  if (opts.number && drawIdx.length === 1) {
    let n = 0;
    for (const e of cords[drawIdx[0]].events) {
      const o = e.face === 0 ? ox0 : ox1;
      if (e.kind === 'start') { P.push(`<circle cx="${fx(o, e.x)}" cy="${fy(e.y)}" r="11" fill="#fff"/><text x="${fx(o, e.x)}" y="${(+fy(e.y) + 4)}" fill="#000" font-family="monospace" font-size="13" text-anchor="middle">S</text>`); continue; }
      n++;
      P.push(`<circle cx="${fx(o, e.x)}" cy="${fy(e.y)}" r="10" fill="#0c0f13" stroke="${e.kind === 'cross' ? '#fff' : '#5ad18a'}" stroke-width="2.5"/><text x="${fx(o, e.x)}" y="${(+fy(e.y) + 4)}" fill="${e.kind === 'cross' ? '#fff' : '#5ad18a'}" font-family="monospace" font-size="11" text-anchor="middle">${n}</text>`);
    }
  }
  P.push('</svg>');
  return P.join('');
}

// ---- CLI -------------------------------------------------------------------
function main(argv) {
  if (argv.includes('--test')) return selftest();
  const shapeArg = argv[2];
  const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const has = n => argv.includes(n);
  const { cells } = parseShape(shapeArg);
  const shape0 = build(cells);
  const openNames = (flag('--open') || 'top').split(',');
  const openSet = namedEdges(shape0, openNames);
  const { shape, cords } = traceAll(cells, openSet);
  const allClosed = cords.every(c => c.closed);
  console.log(`${shapeArg}  open=[${openNames}]  ->  ${cords.length} cords  (all return to start: ${allClosed ? 'YES' : 'NO!!'})`);
  cords.forEach((c, i) => console.log(`  cord ${i}: ${c.faces.size === 2 ? 'both faces' : 'one face'}, ${c.events.filter(e => e.kind === 'cross').length} crosses, ${c.events.filter(e => e.kind === 'turn').length} turns, closed=${c.closed}`));
  const out = flag('--out');
  if (out) {
    const opts = { openSet, cordList: flag('--cord') != null ? flag('--cord').split(',').map(Number) : null, color: flag('--color'), weave: has('--weave'), number: has('--number'), flipback: has('--flipback'), thick: flag('--thick') != null ? +flag('--thick') : null };
    writeFileSync(out, render(shape, cords, opts));
    console.log(`wrote ${out}`);
  }
}
function selftest() {
  const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
  console.log('flat billiard vs gcd:');
  for (const [w, h] of [[8, 12], [6, 4], [5, 5], [3, 12]]) { const n = TE.getAllCycles(rect(w, h), w, h).cycles.length; console.log(`  ${w}x${h}: ${n} vs gcd ${gcd(w, h)} ${n === gcd(w, h) ? 'OK' : 'DIFF'}`); }
  console.log('pouch (top open) counts + closure:');
  for (const [w, h, exp] of [[8, 12, 8], [4, 6, 4], [6, 4, 2], [3, 4, 1]]) {
    const s = build(rect(w, h)); const open = namedEdges(s, ['top']);
    const { cords } = traceAll(rect(w, h), open);
    console.log(`  ${w}x${h}: ${cords.length} (expect ${exp}) ${cords.length === exp ? 'OK' : 'DIFF'} · all closed: ${cords.every(c => c.closed)}`);
  }
}
main(process.argv);
