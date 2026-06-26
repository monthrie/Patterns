// face-trace.js — browser twin of the verified two-faced tracer in scripts/cords.mjs.
// THE RULE: a 45-degree billiard that REFLECTS at every wall; at a TIED edge it SWITCHES
// face (front <-> back); at an OPEN edge it STAYS on the same face. Every cord closes back
// on its own start. Logic is lifted VERBATIM from scripts/cords.mjs (treat as verified).
// Depends only on the global TearEngine (src/engine.js).
(function (global) {
  const TE = global.TearEngine;
  const EPS = 1e-9;

  const rect = (w, h) => Array.from({ length: h }, () => Array(w).fill(true));
  const Lpanel = (W, H, nw, nh) => Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !(y < nh && x < nw)));

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

  // trace one cord from gap g0 on face f0. returns face-segmented pieces + boundary events.
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

  // every gap/face pair belongs to exactly one cord
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

  global.FaceTrace = { rect, Lpanel, build, namedEdges, traceCord, traceAll };
})(typeof window !== 'undefined' ? window : globalThis);
