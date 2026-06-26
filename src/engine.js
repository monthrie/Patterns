/*
 * TearEngine — the pure billiard-weaving engine, shared by:
 *   - the Knot Maker app (src/app.js keeps its own inline copy for now — do not diverge logic)
 *   - the embeddable trace-player (src/player.js)
 *   - the future Toy app and website embeds
 * Verbatim port of the verified engine functions. Change with extreme care.
 */
(function (global) {
  'use strict';

  function buildEdges(cells, gw, gh) {
    const hUnits = [];
    const vUnits = [];
    for (let y = 0; y <= gh; y++)
      for (let x = 0; x < gw; x++) {
        const above = y > 0 ? cells[y - 1][x] : false;
        const below = y < gh ? cells[y][x] : false;
        if (above !== below) hUnits.push({ y, x });
      }
    for (let x = 0; x <= gw; x++)
      for (let y = 0; y < gh; y++) {
        const left = x > 0 ? cells[y][x - 1] : false;
        const right = x < gw ? cells[y][x] : false;
        if (left !== right) vUnits.push({ x, y });
      }
    const edges = [];
    const hByY = {};
    for (const e of hUnits) { if (!hByY[e.y]) hByY[e.y] = []; hByY[e.y].push(e.x); }
    for (const y in hByY) {
      const xs = hByY[y].sort((a, b) => a - b);
      let start = xs[0];
      for (let i = 1; i <= xs.length; i++) {
        if (i < xs.length && xs[i] === xs[i - 1] + 1) continue;
        edges.push({ y: +y, x0: start, x1: xs[i - 1] + 1, type: 'h' });
        if (i < xs.length) start = xs[i];
      }
    }
    const vByX = {};
    for (const e of vUnits) { if (!vByX[e.x]) vByX[e.x] = []; vByX[e.x].push(e.y); }
    for (const x in vByX) {
      const ys = vByX[x].sort((a, b) => a - b);
      let start = ys[0];
      for (let i = 1; i <= ys.length; i++) {
        if (i < ys.length && ys[i] === ys[i - 1] + 1) continue;
        edges.push({ x: +x, y0: start, y1: ys[i - 1] + 1, type: 'v' });
        if (i < ys.length) start = ys[i];
      }
    }
    return edges;
  }

  function buildGaps(cells, gw, gh) {
    const gaps = [];
    for (let y = 0; y <= gh; y++)
      for (let x = 0; x < gw; x++) {
        const above = y > 0 ? cells[y - 1][x] : false;
        const below = y < gh ? cells[y][x] : false;
        if (above !== below) gaps.push({ x: x + 0.5, y, isH: true, interiorBelow: !!below });
      }
    for (let x = 0; x <= gw; x++)
      for (let y = 0; y < gh; y++) {
        const left = x > 0 ? cells[y][x - 1] : false;
        const right = x < gw ? cells[y][x] : false;
        if (left !== right) gaps.push({ x, y: y + 0.5, isH: false, interiorRight: !!right });
      }
    return gaps;
  }

  function getInitialDir(gap) {
    if (gap.isH) {
      return gap.interiorBelow ? { dx: 1, dy: 1 } : { dx: -1, dy: -1 };
    }
    return gap.interiorRight ? { dx: 1, dy: -1 } : { dx: -1, dy: 1 };
  }

  function pointToGapIdx(px, py, gaps) {
    for (let i = 0; i < gaps.length; i++)
      if (Math.abs(px - gaps[i].x) < 0.1 && Math.abs(py - gaps[i].y) < 0.1) return i;
    return -1;
  }

  function isOnBoundary(px, py, cells, gw, gh) {
    const E = 0.01;
    const iy = Math.round(py), ix = Math.round(px);
    if (Math.abs(py - iy) < E) {
      const cx = Math.floor(px);
      if (cx >= 0 && cx < gw) {
        const above = iy > 0 ? !!(cells[iy - 1] && cells[iy - 1][cx]) : false;
        const below = iy < gh ? !!(cells[iy] && cells[iy][cx]) : false;
        if (above !== below) return true;
      }
    }
    if (Math.abs(px - ix) < E) {
      const cy = Math.floor(py);
      if (cy >= 0 && cy < gh) {
        const left = ix > 0 ? !!(cells[cy] && cells[cy][ix - 1]) : false;
        const right = ix < gw ? !!(cells[cy] && cells[cy][ix]) : false;
        if (left !== right) return true;
      }
    }
    return false;
  }

  function tracePath(startIdx, gaps, edges) {
    const EPS = 1e-9;
    const sc = gaps[startIdx];
    const pts = [{ x: sc.x, y: sc.y }];
    let { dx, dy } = getInitialDir(sc);
    let x = sc.x, y = sc.y;
    const maxIter = edges.length * 200 + 2000;
    for (let iter = 0; iter < maxIter; iter++) {
      let minT = Infinity, hitH = false, hitV = false;
      for (const edge of edges) {
        let t;
        if (edge.type === 'h') {
          if (Math.abs(dy) < EPS) continue;
          t = (edge.y - y) / dy;
          if (t < EPS) continue;
          const hx = x + dx * t;
          if (hx < edge.x0 - EPS || hx > edge.x1 + EPS) continue;
        } else {
          if (Math.abs(dx) < EPS) continue;
          t = (edge.x - x) / dx;
          if (t < EPS) continue;
          const hy = y + dy * t;
          if (hy < edge.y0 - EPS || hy > edge.y1 + EPS) continue;
        }
        if (t < minT - EPS) {
          minT = t; hitH = edge.type === 'h'; hitV = edge.type === 'v';
        } else if (Math.abs(t - minT) < EPS * 100) {
          if (edge.type === 'h') hitH = true;
          if (edge.type === 'v') hitV = true;
        }
      }
      if (minT === Infinity || minT > 1e6) break;
      x += dx * minT; y += dy * minT;
      x = Math.round(x * 1e6) / 1e6;
      y = Math.round(y * 1e6) / 1e6;
      pts.push({ x, y });
      if (pts.length > 2 && Math.abs(x - sc.x) < 0.01 && Math.abs(y - sc.y) < 0.01) break;
      if (hitH && hitV) { dx = -dx; dy = -dy; }
      else if (hitH) dy = -dy;
      else if (hitV) dx = -dx;
    }
    return pts;
  }

  function getAllCycles(cells, gw, gh) {
    const edges = buildEdges(cells, gw, gh);
    const gaps = buildGaps(cells, gw, gh);
    if (gaps.length === 0) return { cycles: [], gaps, edges };
    const vis = new Set(), cycles = [];
    for (let g = 0; g < gaps.length; g++) {
      if (vis.has(g)) continue;
      const pts = tracePath(g, gaps, edges);
      const gapSet = new Set();
      for (const p of pts) {
        const gi = pointToGapIdx(p.x, p.y, gaps);
        if (gi >= 0) { gapSet.add(gi); vis.add(gi); }
      }
      cycles.push({ startGap: g, points: pts, gaps: gapSet });
    }
    return { cycles, gaps, edges };
  }

  // ---- path measurement helpers ----
  function arcLen(pts) {
    let t = 0;
    for (let s = 0; s < pts.length - 1; s++)
      t += Math.hypot(pts[s + 1].x - pts[s].x, pts[s + 1].y - pts[s].y);
    return t;
  }
  function cumLens(pts) {
    const out = [0];
    for (let s = 0; s < pts.length - 1; s++)
      out.push(out[s] + Math.hypot(pts[s + 1].x - pts[s].x, pts[s + 1].y - pts[s].y));
    return out;
  }
  function pointAtArc(pts, cums, t) {
    if (t <= 0) return { x: pts[0].x, y: pts[0].y, seg: 0 };
    for (let i = 1; i < cums.length; i++) {
      if (cums[i] >= t) {
        const f = (t - cums[i - 1]) / (cums[i] - cums[i - 1] || 1);
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
          seg: i - 1,
        };
      }
    }
    const n = pts.length - 1;
    return { x: pts[n].x, y: pts[n].y, seg: n - 1 };
  }

  // ---- shape helpers ----
  function rectCells(w, h) {
    return Array.from({ length: h }, () => Array(w).fill(true));
  }

  // ---- João's physical yarn palette ----
  const JOAO = [
    { name: 'Branco', hex: '#f4f1e8' }, { name: 'Creme', hex: '#ecdcb0' },
    { name: 'Amarelo', hex: '#e8c838' }, { name: 'Âmbar', hex: '#e8a020' },
    { name: 'Coral', hex: '#e84030' }, { name: 'Vermelho', hex: '#d4242c' },
    { name: 'Rosa Claro', hex: '#e68a96' }, { name: 'Rosa Choque', hex: '#e4287c' },
    { name: 'Magenta', hex: '#c41878' }, { name: 'Roxo', hex: '#6a2aa0' },
    { name: 'Verde Neon', hex: '#8ab840' }, { name: 'Verde Mar', hex: '#2e9a5e' },
    { name: 'Turquesa', hex: '#2aa0b4' }, { name: 'Azul', hex: '#1e40c8' },
    { name: 'Preto', hex: '#1a1c28' },
  ];
  const COLORS = ['#d4242c', '#2aa0b4', '#ecdcb0', '#e4287c', '#2e9a5e', '#e8a020', '#1e40c8', '#6a2aa0', '#e84030', '#8ab840', '#c41878', '#e68a96', '#e8c838', '#f4f1e8'];

  global.TearEngine = {
    buildEdges, buildGaps, getInitialDir, pointToGapIdx, isOnBoundary,
    tracePath, getAllCycles,
    arcLen, cumLens, pointAtArc, rectCells,
    JOAO, COLORS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
