#!/usr/bin/env node
// render-12.mjs — the shoe drawn like the original tool: thick, INTERWOVEN (over/under),
// front + back, with the maker's 12-cycle corner action: GO THROUGH at every corner
// (come back at none). Prints the cord count the model produces.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
(0, eval)(readFileSync(path.join(ROOT, 'src', 'engine.js'), 'utf8'));
const TE = globalThis.TearEngine;
const Lpanel = (W, H, nw, nh) => Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !(y < nh && x < nw)));
const PALETTE = ['#e0556b', '#3aa6b8', '#f2c14e', '#5ad18a', '#f2914e', '#4a7af2', '#9a6ae0', '#e06ab0', '#8ab840', '#2e9a5e', '#c41878', '#e8a020', '#f4f1e8', '#d4242c'];

function build(cells) {
  const gh = cells.length, gw = cells[0].length;
  const edges = TE.buildEdges(cells, gw, gh).map((e, i) => ({ ...e, id: i }));
  const gaps = TE.buildGaps(cells, gw, gh);
  const eAt = (px, py) => edges.filter(e => e.type === 'h'
    ? (Math.abs(py - e.y) < 1e-6 && px > e.x0 - 1e-6 && px < e.x1 + 1e-6)
    : (Math.abs(px - e.x) < 1e-6 && py > e.y0 - 1e-6 && py < e.y1 + 1e-6));
  const inside = (x, y) => x >= 0 && y >= 0 && x < gw && y < gh && cells[y][x];
  const corners = [], phantoms = [];
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const p = inside(vx - 1, vy - 1) + inside(vx, vy - 1) + inside(vx - 1, vy) + inside(vx, vy);
    if (p === 3) { phantoms.push({ vx, vy }); continue; }
    if (p !== 1) continue;
    const cand = [[vx - 0.5, vy], [vx + 0.5, vy], [vx, vy - 0.5], [vx, vy + 0.5]];
    const gi = cand.map(([x, y]) => gaps.findIndex(g => Math.abs(g.x - x) < 1e-6 && Math.abs(g.y - y) < 1e-6)).filter(i => i >= 0);
    if (gi.length === 2) corners.push({ vx, vy, gi });
  }
  return { gw, gh, cells, edges, gaps, eAt, corners, phantoms };
}
const pk = (a, b) => a < b ? `${a}|${b}` : `${b}|${a}`;

function traceAll(shape, openSet, behaviorByVk) {
  const { gaps, edges, eAt, corners } = shape;
  const cByKey = new Map();
  for (const c of corners) {
    let tied = 0; for (const k of c.gi) { const g = gaps[k]; for (const e of eAt(g.x, g.y)) if (!openSet.has(e.id)) tied++; }
    const vk = `${c.vx},${c.vy}`, normalNet = tied % 2;
    cByKey.set(pk(c.gi[0], c.gi[1]), { normalNet, behavior: behaviorByVk[vk] ?? (normalNet === 1 ? 'through' : 'same') });
  }
  const seen = new Set(), cords = [];
  function trace(g0, f0) {
    const sc = gaps[g0]; let { dx, dy } = TE.getInitialDir(sc);
    let x = sc.x, y = sc.y, face = f0; const startKey = `${x}|${y}|${dx}|${dy}|${face}`;
    const pieces = [{ face, pts: [{ x, y }] }], states = [`${g0}:${face}`]; let closed = false, prevGi = g0;
    for (let it = 0; it < edges.length * 400 + gaps.length * 8 + 4000; it++) {
      let minT = Infinity, hitH = false, hitV = false;
      for (const e of edges) { let t;
        if (e.type === 'h') { if (Math.abs(dy) < 1e-9) continue; t = (e.y - y) / dy; if (t < 1e-9) continue; const hx = x + dx * t; if (hx < e.x0 - 1e-9 || hx > e.x1 + 1e-9) continue; }
        else { if (Math.abs(dx) < 1e-9) continue; t = (e.x - x) / dx; if (t < 1e-9) continue; const hy = y + dy * t; if (hy < e.y0 - 1e-9 || hy > e.y1 + 1e-9) continue; }
        if (t < minT - 1e-9) { minT = t; hitH = e.type === 'h'; hitV = e.type === 'v'; } else if (Math.abs(t - minT) < 1e-7) { if (e.type === 'h') hitH = true; if (e.type === 'v') hitV = true; } }
      if (minT === Infinity || minT > 1e6) break;
      x = Math.round((x + dx * minT) * 1e6) / 1e6; y = Math.round((y + dy * minT) * 1e6) / 1e6;
      pieces[pieces.length - 1].pts.push({ x, y });
      let tied = 0; for (const e of eAt(x, y)) if (!openSet.has(e.id)) tied++;
      if (hitH && hitV) { dx = -dx; dy = -dy; } else if (hitH) { dy = -dy; } else { dx = -dx; }
      const gi = TE.pointToGapIdx(x, y, gaps);
      if (gi >= 0) {
        let net = tied % 2; const ck = cByKey.get(pk(prevGi, gi));
        if (ck) net ^= (ck.normalNet ^ (ck.behavior === 'through' ? 1 : 0)) & 1;
        states.push(`${gi}:${face}`);
        if (net) { face ^= 1; pieces.push({ face, pts: [{ x, y }] }); states.push(`${gi}:${face}`); }
        prevGi = gi;
      }
      if (`${x}|${y}|${dx}|${dy}|${face}` === startKey) { closed = true; break; }
    }
    return { pieces, states, closed };
  }
  for (let f = 0; f < 2; f++) for (let g = 0; g < gaps.length; g++) {
    if (seen.has(`${g}:${f}`)) continue;
    const c = trace(g, f); c.states.forEach(s => seen.add(s)); cords.push(c);
  }
  return cords;
}

// over/under: cut a strand where it dives UNDER at a crossing (checkerboard parity). (from cords.mjs)
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

function render(shape, cords, openSet, behaviorByVk) {
  const { gw: W, gh: H } = shape;
  const CS = 46, PAD = 36, FW = W * CS + 2 * PAD, FH = H * CS + 2 * PAD, GX = 80;
  const ox0 = 0, ox1 = FW + GX, thick = CS * 0.66;
  const fx = (o, x) => (o + PAD + x * CS).toFixed(1), fy = y => (PAD + y * CS).toFixed(1);
  const P = [`<svg viewBox="0 0 ${2 * FW + GX} ${FH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0c0f13"/>`];
  for (const [o, lbl] of [[ox0, 'FRONT'], [ox1, 'BACK']]) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (shape.cells[y][x]) P.push(`<rect x="${fx(o, x)}" y="${fy(y)}" width="${CS}" height="${CS}" fill="#11161c" stroke="#1a232c" stroke-width="0.5"/>`);
    for (const e of shape.edges) { const open = openSet.has(e.id), col = open ? '#e0556b' : '#3a4a55', d = open ? 'stroke-dasharray="7 5"' : '';
      if (e.type === 'h') P.push(`<line x1="${fx(o, e.x0)}" y1="${fy(e.y)}" x2="${fx(o, e.x1)}" y2="${fy(e.y)}" stroke="${col}" stroke-width="3" ${d}/>`);
      else P.push(`<line x1="${fx(o, e.x)}" y1="${fy(e.y0)}" x2="${fx(o, e.x)}" y2="${fy(e.y1)}" stroke="${col}" stroke-width="3" ${d}/>`); }
    P.push(`<text x="${fx(o, W / 2)}" y="${PAD - 12}" fill="#cfe3ea" font-family="monospace" font-size="17" text-anchor="middle" letter-spacing="2">${lbl}</text>`);
  }
  cords.forEach((c, ci) => {
    const col = PALETTE[ci % PALETTE.length];
    for (const pc of c.pieces) {
      if (pc.pts.length < 2) continue;
      const o = pc.face === 0 ? ox0 : ox1;
      for (const s of weaveSegments(W, H, pc.pts, 0.34, pc.face === 1))
        P.push(`<line x1="${fx(o, s.x1)}" y1="${fy(s.y1)}" x2="${fx(o, s.x2)}" y2="${fy(s.y2)}" stroke="${col}" stroke-width="${thick.toFixed(1)}" stroke-linecap="butt"/>`);
      for (const p of pc.pts) if (TE.pointToGapIdx(p.x, p.y, shape.gaps) >= 0) P.push(`<circle cx="${fx(o, p.x)}" cy="${fy(p.y)}" r="${(thick / 2).toFixed(1)}" fill="${col}"/>`);
    }
  });
  for (const o of [ox0, ox1]) {
    for (const c of shape.corners) P.push(`<circle cx="${fx(o, c.vx)}" cy="${fy(c.vy)}" r="8" fill="#e0556b" stroke="#fff" stroke-width="1.6"/>`);
    for (const ph of shape.phantoms) P.push(`<circle cx="${fx(o, ph.vx)}" cy="${fy(ph.vy)}" r="9" fill="none" stroke="#7c8a96" stroke-width="1.8" stroke-dasharray="3 3"/>`);
  }
  P.push('</svg>');
  return P.join('');
}

const shape = build(Lpanel(19, 11, 11, 3));
const openSet = new Set([shape.edges.filter(e => e.type === 'h').sort((a, b) => a.y - b.y)[0].id]);
const cfg = { '11,0': 'through', '19,0': 'through', '0,3': 'through', '0,11': 'through', '19,11': 'through' };  // go through at EVERY corner
const cords = traceAll(shape, openSet, cfg);
console.log(`all corners THROUGH -> ${cords.length} cords, all closed: ${cords.every(c => c.closed)}`);
writeFileSync('/tmp/shoe12.svg', render(shape, cords, openSet, cfg));
console.log('wrote /tmp/shoe12.svg');
