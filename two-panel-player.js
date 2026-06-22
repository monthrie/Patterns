/*
 * TwoPanelPlayer — embeddable two-panel connected-loop trace (mirror model).
 * Requires TwoPanelLoops (two-panel-loops.js).
 */
(function (global) {
  'use strict';
  const L = global.TwoPanelLoops;
  if (!L) throw new Error('TwoPanelPlayer requires TwoPanelLoops (two-panel-loops.js)');

  const DEFAULT_THEME = {
    panelFill: '#0e141b',
    wallGap: '#6d7884',
    portalGap: '#a3b8c4',
    seam: '#7e9aaa',
    head: '#eef2f5',
    weaveStroke: 'rgba(193,202,211,0.10)',
    boundaryStroke: 'rgba(193,202,211,0.10)',
  };

  function defaultWallGap(g) { return g.isH && g.y === 0; }

  function isOnBoundary(px, py, cells, gw, gh) {
    const E = 0.01;
    const iy = Math.round(py), ix = Math.round(px);
    if (Math.abs(py - iy) < E) {
      const cx = Math.floor(px);
      if (cx >= 0 && cx < gw) {
        const above = iy > 0 ? !!cells[iy - 1]?.[cx] : false;
        const below = iy < gh ? !!cells[iy]?.[cx] : false;
        if (above !== below) return true;
      }
    }
    if (Math.abs(px - ix) < E) {
      const cy = Math.floor(py);
      if (cy >= 0 && cy < gh) {
        const left = ix > 0 ? !!cells[cy]?.[ix - 1] : false;
        const right = ix < gw ? !!cells[cy]?.[ix] : false;
        if (left !== right) return true;
      }
    }
    return false;
  }

  function create(container, opts) {
    opts = opts || {};
    const cells = opts.cells;
    const gw = opts.gw;
    const gh = opts.gh;
    const isWallGap = opts.isWallGap || defaultWallGap;
    const theme = Object.assign({}, DEFAULT_THEME, opts.theme || {});

    const model = L.connectedLoopsWithCornerTable(cells, gw, gh, isWallGap, {
      concaveMode: 'cross',
      convexMode: 'cross',
    });
    if (!model || !Array.isArray(model.loops)) throw new Error('Invalid loop model');
    const loops = (model.loops || [])
      .filter(path => Array.isArray(path) && path.length > 1)
      .map(path => path.map(ev => ({ panel: ev.panel, x: ev.x, y: ev.y })));
    const gaps = model.gaps;
    const edges = model.edges || L.buildEdges(cells, gw, gh);

    let CELL = opts.cellSize || 22;
    let PAD = Math.round(CELL * 24 / 22);
    let baseCell = CELL;
    let zoomScale = opts.initialZoom != null ? opts.initialZoom : 1;
    let colors = (opts.colors || []).slice();
    let secondaryColors = (opts.secondaryColors || []).slice();
    let strandMode = opts.strandMode || 'thin';
    let showWeave = opts.showWeave !== false;
    let loopVisible = null;
    let sel = opts.selected != null ? opts.selected : -1;
    let t = 1;
    let playing = false;
    let speed = opts.speed != null ? opts.speed : 0.1;
    let raf = 0;
    let last = 0;
    let destroyed = false;

    container.innerHTML = '';
    container.style.cssText = 'width:100%;height:100%;overflow:auto;display:flex;align-items:center;justify-content:center;';
    const wrap = document.createElement('div');
    wrap.className = 'two-panel-stage';
    wrap.style.cssText = 'padding:8px;max-width:100%;max-height:100%;overflow:auto;';
    const svgHost = document.createElement('div');
    svgHost.className = 'two-panel-svg-host';
    wrap.appendChild(svgHost);
    container.appendChild(wrap);

    const sc = () => CELL / 22;
    const W = () => gw * CELL + 2 * PAD;
    const H = () => 2 * gh * CELL + 2 * PAD;
    const X = x => PAD + x * CELL;
    const Yp = (y, panel) => PAD + (panel === 'A' ? y : 2 * gh - y) * CELL;
    const lineW = () => CELL * (strandMode === 'full' ? 0.707 : strandMode === 'string' ? 0.12 : 0.45);
    const strandGap = () => strandMode === 'string' ? CELL * 0.16 : lineW() / 2;

    // Panel B is the y-mirror twin: over/under parity flips so the weave continues across the seam.
    function bsWeaveUnder(kOrKi, mOrMi, panel) {
      const under = (kOrKi + mOrMi + gw) % 2 === 1;
      return panel === 'B' ? !under : under;
    }
    function fsWeaveUnder(kOrKi, mOrMi, panel) {
      const under = (kOrKi + mOrMi + gw) % 2 === 0;
      return panel === 'B' ? !under : under;
    }

    function buildCornerArcs() {
      const arcs = [];
      for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
        const tl = vy > 0 && vx > 0 && cells[vy - 1][vx - 1];
        const tr = vy > 0 && vx < gw && cells[vy - 1][vx];
        const bl = vy < gh && vx > 0 && cells[vy][vx - 1];
        const br = vy < gh && vx < gw && cells[vy][vx];
        if ((tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0) !== 1) continue;
        let g1, g2, ox, oy, sweep;
        if (br) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; ox = -1; oy = -1; sweep = 0; }
        else if (bl) { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; ox = 1; oy = -1; sweep = 1; }
        else if (tr) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; ox = -1; oy = 1; sweep = 1; }
        else { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; ox = 1; oy = 1; sweep = 0; }
        if (vx >= gw && vy >= gh) { ox = -1; oy = 1; }
        arcs.push({ g1, g2, vx, vy, ox, oy, sweep });
      }
      return arcs;
    }
    const CORNER_ARCS = buildCornerArcs();
    const CORNER_GAP_SET = (() => {
      const set = new Set();
      for (const ca of CORNER_ARCS) {
        for (const g of [ca.g1, ca.g2]) {
          const gi = gaps.findIndex(gap => Math.abs(gap.x - g.x) < 0.05 && Math.abs(gap.y - g.y) < 0.05);
          if (gi >= 0) set.add(gi);
        }
      }
      return set;
    })();
    const NOTCH_THROATS = L.buildConcaveNotchThroats(cells, gw, gh);
    const nearG = (p, g) => Math.abs(p.x - g.x) < 0.05 && Math.abs(p.y - g.y) < 0.05;

    function matchCorner(a, b) {
      if (a.panel !== b.panel) return null;
      for (const ca of CORNER_ARCS) {
        if ((nearG(a, ca.g1) && nearG(b, ca.g2)) || (nearG(a, ca.g2) && nearG(b, ca.g1))) return ca;
      }
      return null;
    }

    function matchSideCornerArc(a, b) {
      for (const ca of CORNER_ARCS) {
        const hit = (nearG(a, ca.g1) && nearG(b, ca.g2)) || (nearG(a, ca.g2) && nearG(b, ca.g1));
        if (!hit) continue;
        const vert = g => Math.abs(g.x - Math.round(g.x)) < 0.01 && Math.abs(g.y - Math.round(g.y)) > 0.01;
        const horiz = g => Math.abs(g.y - Math.round(g.y)) < 0.01 && Math.abs(g.x - Math.round(g.x)) > 0.01;
        const v = [ca.g1, ca.g2].find(vert), h = [ca.g1, ca.g2].find(horiz);
        if (!v || !h) continue;
        if (Math.abs(v.x) < 0.01 || Math.abs(v.x - gw) < 0.01) return ca;
        // Top-wall end (e.g. shoe step at (11,0)): horizontal flank is the wall, not a side edge.
        if (Math.abs(h.y) < 0.01) return ca;
      }
      return null;
    }

    function gapAt(x, y) {
      return gaps.find(g => Math.abs(g.x - x) < 0.05 && Math.abs(g.y - y) < 0.05);
    }

    function gapIdxAt(x, y) {
      return gaps.findIndex(g => Math.abs(g.x - x) < 0.05 && Math.abs(g.y - y) < 0.05);
    }

    function matchNotchThroatCross(a, b) {
      if (a.panel === b.panel) return null;
      const g = gapAt(b.x, b.y);
      if (!g || !isWallGap(g)) return null;
      const inDx = Math.sign(b.x - a.x), inDy = Math.sign(b.y - a.y);
      if (!inDx || !inDy) return null;
      const gi = gapIdxAt(b.x, b.y);
      if (gi < 0) return null;
      return L.concaveNotchThroatCrossPoint(
        a.x, a.y, b.x, b.y, inDx, inDy, gi, gaps, isWallGap, NOTCH_THROATS);
    }

    function needsMirrorLoop(a, b) {
      if (matchSideCornerArc(a, b)) return false;
      if (a.panel === b.panel) return false;
      const g = gapAt(b.x, b.y);
      return g && !g.isH && (b.x <= 0.01 || b.x >= gw - 0.01);
    }

    function isCornerShortcut(a, b) {
      if (a.panel !== b.panel) return false;
      const ca = matchCorner(a, b);
      if (!ca) return false;
      return Math.hypot(b.x - a.x, b.y - a.y) < 1.1;
    }

    // Diagonal run on a.panel before a portal toggle — needs weave cuts like same-panel segments.
    function isDiagonalWeaveSeg(a, b) {
      const sdx = Math.sign(b.x - a.x), sdy = Math.sign(b.y - a.y);
      return sdx !== 0 && sdy !== 0;
    }

    function countsForCrossingMap(a, b) {
      if (isCornerShortcut(a, b)) return false;
      if (a.panel === b.panel) return true;
      return isDiagonalWeaveSeg(a, b);
    }

    function segmentCrossings(p1, p2) {
      const bsSet = new Set(), fsSet = new Set();
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      if (sdx === 0 || sdy === 0) return { bsSet, fsSet };
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      const isBS = sdx === sdy;
      if (isBS) {
        const kVal = p1.y - p1.x;
        for (let mi = -1; mi <= gw + gh; mi++) {
          const mVal = mi + 0.5;
          const cx = (mVal - kVal) / 2, cy = (mVal + kVal) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < gh - 0.01)
            bsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      } else {
        const mVal = p1.y + p1.x;
        for (let ki = -gw; ki <= gh; ki++) {
          const kVal2 = ki + 0.5;
          const cx = (mVal - kVal2) / 2, cy = (mVal + kVal2) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < gh - 0.01)
            fsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      }
      return { bsSet, fsSet };
    }

    const crossingMap = (() => {
      const allBS = new Set(), allFS = new Set();
      for (const path of loops) {
        for (let i = 0; i < path.length; i++) {
          const a = path[i], b = path[(i + 1) % path.length];
          if (!countsForCrossingMap(a, b)) continue;
          const panel = a.panel;
          const { bsSet, fsSet } = segmentCrossings(a, b);
          for (const k of bsSet) allBS.add(`${panel},${k}`);
          for (const k of fsSet) allFS.add(`${panel},${k}`);
        }
      }
      return { forBS: allFS, forFS: allBS };
    })();

    /** Interior crossing -> { bs: {li, arc}, fs: {li, arc} } laying order per diagonal family. */
    function buildPassMap() {
      const map = new Map();
      loops.forEach((path, li) => {
        const n = path.length;
        for (let seg = 0; seg < n; seg++) {
          const p1 = path[seg], p2 = path[(seg + 1) % n];
          if (!countsForCrossingMap(p1, p2)) continue;
          const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
          if (sdx === 0 || sdy === 0) continue;
          const axis = sdx === sdy ? 'bs' : 'fs';
          const panel = p1.panel;
          const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
          const visit = (ix, iy) => {
            if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < gh - 0.01) {
              const key = `${panel},${ix.toFixed(2)},${iy.toFixed(2)}`;
              let e = map.get(key);
              if (!e) { e = {}; map.set(key, e); }
              if (!e[axis]) e[axis] = { li, arc: seg + Math.hypot(ix - p1.x, iy - p1.y) };
            }
          };
          if (axis === 'bs') {
            const kVal = p1.y - p1.x;
            for (let mi = -1; mi <= gw + gh; mi++) {
              const mVal = mi + 0.5;
              visit((mVal - kVal) / 2, (mVal + kVal) / 2);
            }
          } else {
            const mVal = p1.y + p1.x;
            for (let ki = -gw; ki <= gh; ki++) {
              const kVal2 = ki + 0.5;
              visit((mVal - kVal2) / 2, (mVal + kVal2) / 2);
            }
          }
        }
      });
      return map;
    }
    const passMap = buildPassMap();

    function renderWeaveSegment(sx0, sy0, sx1, sy1, ux, uy, cuts, stroke, swW) {
      const gap = CELL * 0.16;
      const sorted = [...cuts].sort((a, b) => ((a.sx - sx0) * ux + (a.sy - sy0) * uy) - ((b.sx - sx0) * ux + (b.sy - sy0) * uy));
      let s = '', cx = sx0, cy = sy0;
      for (const cut of sorted) {
        const gsx = cut.sx - ux * gap, gsy = cut.sy - uy * gap;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) s += `<line x1="${cx}" y1="${cy}" x2="${gsx}" y2="${gsy}" stroke="${stroke}" stroke-width="${swW}" stroke-linecap="round"/>`;
        cx = cut.sx + ux * gap;
        cy = cut.sy + uy * gap;
      }
      const projEnd = (sx1 - cx) * ux + (sy1 - cy) * uy;
      if (projEnd > 0.5) s += `<line x1="${cx}" y1="${cy}" x2="${sx1}" y2="${sy1}" stroke="${stroke}" stroke-width="${swW}" stroke-linecap="round"/>`;
      return s;
    }

    function buildWeaveLines(panel) {
      const lines = [];
      const toY = y => Yp(y, panel);
      for (let k = -gw; k <= gh; k++) {
        const kVal = k + 0.5;
        const activeSegs = [];
        let segStart = null;
        const nMin = Math.max(0, -k), nMax = Math.min(gw - 1, gh - k - 2);
        for (let n = nMin; n <= nMax; n++) {
          const cy1 = n + k, cy2 = n + k + 1;
          if (cy1 >= 0 && cy2 < gh && n < gw && cells[cy1][n] && cells[cy2][n]) {
            if (segStart === null) segStart = n;
          } else if (segStart !== null) { activeSegs.push([segStart, n]); segStart = null; }
        }
        if (segStart !== null) activeSegs.push([segStart, nMax + 1]);
        for (const [x0, x1] of activeSegs) {
          if (x1 - x0 < 0.01) continue;
          const sx0 = X(x0), sy0 = toY(x0 + kVal);
          const sx1 = X(x1), sy1 = toY(x1 + kVal);
          const ddx = sx1 - sx0, ddy = sy1 - sy0;
          const len = Math.hypot(ddx, ddy);
          if (len < 1) continue;
          const ux = ddx / len, uy = ddy / len;
          const cuts = [];
          for (let m = -1; m <= gw + gh; m++) {
            const mVal = m + 0.5;
            const ix = (mVal - kVal) / 2, iy = (mVal + kVal) / 2;
            if (ix > x0 + 0.01 && ix < x1 - 0.01 && iy > 0.01 && iy < gh - 0.01) {
              if (bsWeaveUnder(k, m, panel)) cuts.push({ sx: X(ix), sy: toY(iy) });
            }
          }
          lines.push({ sx0, sy0, sx1, sy1, ux, uy, cuts });
        }
      }
      for (let m = 0; m <= gw + gh - 1; m++) {
        const mVal = m + 0.5;
        const activeSegs = [];
        let segStart = null;
        const nMin = Math.max(0, Math.ceil(mVal - gh)), nMax = Math.min(gw - 1, Math.floor(mVal - 1));
        for (let n = nMin; n <= nMax; n++) {
          const cy1 = m - n - 1, cy2 = m - n;
          if (cy1 >= 0 && cy2 < gh && cy1 < gh && cy2 >= 0 && n < gw && cells[cy1][n] && cells[cy2][n]) {
            if (segStart === null) segStart = n;
          } else if (segStart !== null) { activeSegs.push([segStart, n]); segStart = null; }
        }
        if (segStart !== null) activeSegs.push([segStart, nMax + 1]);
        for (const [x0, x1] of activeSegs) {
          if (x1 - x0 < 0.01) continue;
          const sx0 = X(x0), sy0 = toY(mVal - x0);
          const sx1 = X(x1), sy1 = toY(mVal - x1);
          const ddx = sx1 - sx0, ddy = sy1 - sy0;
          const len = Math.hypot(ddx, ddy);
          if (len < 1) continue;
          const ux = ddx / len, uy = ddy / len;
          const cuts = [];
          for (let k = -gw; k <= gh; k++) {
            const kVal2 = k + 0.5;
            const ix = (mVal - kVal2) / 2, iy = (mVal + kVal2) / 2;
            if (ix > x0 + 0.01 && ix < x1 - 0.01 && iy > 0.01 && iy < gh - 0.01) {
              if (fsWeaveUnder(k, m, panel)) cuts.push({ sx: X(ix), sy: toY(iy) });
            }
          }
          lines.push({ sx0, sy0, sx1, sy1, ux, uy, cuts });
        }
      }
      return lines;
    }

    function strandPiece(x1, y1, x2, y2, col, w, op, edgeStart, edgeEnd) {
      let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="butt" opacity="${op}"/>`;
      const r = w / 2;
      if (edgeStart) s += `<circle cx="${x1}" cy="${y1}" r="${r}" fill="${col}" opacity="${op}"/>`;
      if (edgeEnd) s += `<circle cx="${x2}" cy="${y2}" r="${r}" fill="${col}" opacity="${op}"/>`;
      return s;
    }

    function loopColor(i) {
      if (strandMode === 'string') return '#8fa3ad';
      return colors[i] || colors[i % colors.length] || '#a3b8c4';
    }

    function renderGridStrand(a, b, panel, col, w, op, partial, li, segIdx) {
      const p1 = { x: a.x, y: a.y }, p2 = { x: b.x, y: b.y };
      const p1gi = gapIdxAt(p1.x, p1.y), p2gi = gapIdxAt(p2.x, p2.y);
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (p1gi >= 0 && CORNER_GAP_SET.has(p1gi) && p2gi >= 0 && CORNER_GAP_SET.has(p2gi) && segLen < 1.1) return '';
      let sx1 = X(p1.x), sy1 = Yp(p1.y, panel);
      let sx2 = X(p2.x), sy2 = Yp(p2.y, panel);
      const p1Edge = isOnBoundary(p1.x, p1.y, cells, gw, gh);
      const p2Edge = isOnBoundary(p2.x, p2.y, cells, gw, gh);
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);

      if (partial < 1) {
        sx2 = sx1 + (sx2 - sx1) * partial;
        sy2 = sy1 + (sy2 - sy1) * partial;
        return strandPiece(sx1, sy1, sx2, sy2, col, w, op, p1Edge && partial > 0, false);
      }

      if (sdx === 0 || sdy === 0) {
        return strandPiece(sx1, sy1, sx2, sy2, col, w, op, p1Edge, p2Edge);
      }

      const gap = strandGap();
      const ddx = sx2 - sx1, ddy = sy2 - sy1;
      const len = Math.hypot(ddx, ddy);
      if (len < 0.5) return '';
      const ux = ddx / len, uy = ddy / len;
      const isBS = sdx === sdy;
      const other = isBS ? 'fs' : 'bs';
      const segArc0 = segIdx != null ? segIdx : 0;
      const cuts = [];
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      const tryCut = (ix, iy, underHere) => {
        if (!(ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < gh - 0.01)) return;
        if (!underHere) return;
        const key = `${panel},${ix.toFixed(2)},${iy.toFixed(2)}`;
        if (!crossingMap[isBS ? 'forBS' : 'forFS'].has(key)) return;
        const entry = passMap.get(key);
        const partner = entry && entry[other];
        if (!partner) return;
        const myArc = segArc0 + Math.hypot(ix - p1.x, iy - p1.y);
        const partnerFirst = partner.li < li || (partner.li === li && partner.arc < myArc - 1e-9);
        // All-loops view: bridge with partner colour where over-strand already drawn.
        // Single-loop focus: keep one solid colour for the followed loop.
        const fillerCol = sel < 0 && partnerFirst ? loopColor(partner.li) : col;
        cuts.push({
          sx: X(ix), sy: Yp(iy, panel),
          filler: strandMode === 'full',
          fillerCol,
        });
      };

      if (isBS) {
        const kVal = p1.y - p1.x;
        const ki = Math.round(kVal - 0.5);
        for (let mi = -1; mi <= gw + gh; mi++) {
          const mVal = mi + 0.5;
          tryCut((mVal - kVal) / 2, (mVal + kVal) / 2, bsWeaveUnder(ki, mi, panel));
        }
      } else {
        const mVal = p1.y + p1.x;
        const mi = Math.round(mVal - 0.5);
        for (let ki = -gw; ki <= gh; ki++) {
          const kVal2 = ki + 0.5;
          tryCut((mVal - kVal2) / 2, (mVal + kVal2) / 2, fsWeaveUnder(ki, mi, panel));
        }
      }
      cuts.sort((a, b) => ((a.sx - sx1) * ux + (a.sy - sy1) * uy) - ((b.sx - sx1) * ux + (b.sy - sy1) * uy));

      let s = '', cx = sx1, cy = sy1, isFirst = true;
      for (const cut of cuts) {
        const gsx = cut.sx - ux * gap, gsy = cut.sy - uy * gap;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) s += strandPiece(cx, cy, gsx, gsy, col, w, op, isFirst && p1Edge, false);
        const gex = cut.sx + ux * gap, gey = cut.sy + uy * gap;
        if (cut.filler) {
          s += strandPiece(gsx - ux * 1.1, gsy - uy * 1.1, gex + ux * 1.1, gey + uy * 1.1, cut.fillerCol, w, op, false, false);
        }
        cx = gex; cy = gey;
        isFirst = false;
      }
      const projEnd = (sx2 - cx) * ux + (sy2 - cy) * uy;
      if (projEnd > 0.5) s += strandPiece(cx, cy, sx2, sy2, col, w, op, isFirst && p1Edge, p2Edge);
      return s;
    }

    function thinLine(x1, y1, x2, y2, c, w, o) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`;
    }
    function pathSvg(d, c, w, o, cap) {
      return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap || 'round'}" stroke-linejoin="round" opacity="${o}"/>`;
    }

    function mirrorLoopPath(gx, gy, col, w, op) {
      const jx = X(gx), yA = Yp(gy, 'A'), yB = Yp(gy, 'B');
      const mid = (yA + yB) / 2, bulge = Math.max(Math.abs(yB - yA) / 2, CELL * 0.2);
      const bx = gx <= 0.01 ? -bulge : bulge;
      return pathSvg(`M${jx},${yA} Q${jx + bx},${mid} ${jx},${yB}`, col, w, op, strandMode === 'string' ? 'round' : 'butt');
    }

    function cornerArcSvg(a, b, ca, panel, col, w, op) {
      const sx1 = X(a.x), sy1 = Yp(a.y, panel);
      const sx2 = X(b.x), sy2 = Yp(b.y, panel);
      const r = Math.hypot(sx2 - sx1, sy2 - sy1) / 2;
      if (r < 0.5) return '';
      return pathSvg(`M${sx1},${sy1} A${r},${r} 0 0,${ca.sweep} ${sx2},${sy2}`, col, w, op, 'butt');
    }

    function seamCornerArcSvg(a, b, ca, col, w, op) {
      const sx1 = X(a.x), sy1 = Yp(a.y, a.panel);
      const sx2 = X(b.x), sy2 = Yp(b.y, b.panel);
      const bulge = 0.35;
      // Bulge outward from the empty quadrant (side walls, top wall, seam corners).
      const cgx = ca.vx + ca.ox * bulge;
      const cgy = ca.vy + ca.oy * bulge;
      const cx = X(cgx), cy = Yp(cgy, a.panel);
      return pathSvg(`M${sx1},${sy1} Q${cx},${cy} ${sx2},${sy2}`, col, w, op, 'butt');
    }

    function notchPortalDot(notch, panel, col, w, op) {
      const jx = X(notch.vx), jy = Yp(notch.vy, panel);
      const r = Math.max(w * 0.55, 4 * sc());
      return `<circle cx="${jx}" cy="${jy}" r="${r}" fill="${col}" stroke="#fff" stroke-width="${0.9 * sc()}" opacity="${op}"/>`;
    }

    function drawSegment(a, b, col, w, op, partial, pass, li, segIdx) {
      const useStrand = strandMode !== 'string';
      const empty = { strands: '', arcs: '' };
      const notch = matchNotchThroatCross(a, b);
      if (notch) {
        const endPanel = b.panel;
        const throat = { x: notch.x, y: notch.y };
        const x1 = X(a.x), y1 = Yp(a.y, a.panel);
        const xm = X(throat.x), ym = Yp(throat.y, a.panel), ym2 = Yp(throat.y, endPanel);
        const x2 = X(b.x), y2 = Yp(b.y, endPanel);
        const f = Math.min(1, Math.max(0, partial));
        if (f <= 0) return empty;
        const leg1 = Math.hypot(xm - x1, ym - y1), leg2 = Math.hypot(x2 - xm, y2 - ym2), total = leg1 + leg2;
        const drawLeg = (p1, p2, panel, es, ee, frac) => {
          if (useStrand && isDiagonalWeaveSeg(p1, p2) && frac >= 1)
            return renderGridStrand(p1, p2, panel, col, w, op, 1, li, segIdx);
          const sx1 = X(p1.x), sy1 = Yp(p1.y, panel);
          const sx2 = X(p2.x), sy2 = Yp(p2.y, panel);
          if (frac >= 1) {
            return useStrand ? strandPiece(sx1, sy1, sx2, sy2, col, w, op, es, ee)
              : thinLine(sx1, sy1, sx2, sy2, col, w, op);
          }
          return useStrand
            ? strandPiece(sx1, sy1, sx1 + (sx2 - sx1) * frac, sy1 + (sy2 - sy1) * frac, col, w, op, es, false)
            : thinLine(sx1, sy1, sx1 + (sx2 - sx1) * frac, sy1 + (sy2 - sy1) * frac, col, w, op);
        };
        if (pass === 'arcs') return empty;
        if (f >= 1) {
          return { strands: drawLeg(a, throat, a.panel, true, false, 1)
            + notchPortalDot(notch, a.panel, col, w, op)
            + drawLeg(throat, b, endPanel, false, true, 1), arcs: '' };
        }
        const d = f * total;
        if (d <= leg1) {
          return { strands: drawLeg(a, throat, a.panel, true, false, d / leg1), arcs: '' };
        }
        const d2 = d - leg1;
        if (d2 <= leg2) {
          return { strands: drawLeg(a, throat, a.panel, true, false, 1)
            + notchPortalDot(notch, a.panel, col, w, op)
            + drawLeg(throat, b, endPanel, false, false, d2 / leg2), arcs: '' };
        }
        return { strands: drawLeg(a, throat, a.panel, true, false, 1)
          + notchPortalDot(notch, a.panel, col, w, op), arcs: '' };
      }

      const sca = matchSideCornerArc(a, b);
      const ca = sca || matchCorner(a, b);
      if (ca) {
        if (partial >= 1) {
          const arc = sca ? seamCornerArcSvg(a, b, ca, col, w, op) : cornerArcSvg(a, b, ca, a.panel, col, w, op);
          if (pass === 'strands') return empty;
          return { strands: '', arcs: arc };
        }
        if (partial <= 0 || pass === 'arcs') return empty;
        const endPanel = sca ? b.panel : a.panel;
        const x1 = X(a.x), y1 = Yp(a.y, a.panel);
        const x2 = X(b.x), y2 = Yp(b.y, endPanel);
        const line = useStrand
          ? strandPiece(x1, y1, x1 + (x2 - x1) * partial, y1 + (y2 - y1) * partial, col, w, op, true, false)
          : thinLine(x1, y1, x1 + (x2 - x1) * partial, y1 + (y2 - y1) * partial, col, w, op);
        return { strands: line, arcs: '' };
      }

      if (a.panel === b.panel) {
        if (pass === 'arcs') return empty;
        return { strands: renderGridStrand(a, b, a.panel, col, w, op, partial, li, segIdx), arcs: '' };
      }

      if (pass === 'arcs') return empty;
      const x1 = X(a.x), y1 = Yp(a.y, a.panel);
      const x2 = X(b.x), y2 = Yp(b.y, a.panel);
      let strands = '';
      const drawLeg = () => {
        if (useStrand && isDiagonalWeaveSeg(a, b)) {
          return renderGridStrand(a, b, a.panel, col, w, op, partial, li, segIdx);
        }
        if (partial >= 1) {
          return useStrand
            ? strandPiece(x1, y1, x2, y2, col, w, op, false, false)
            : thinLine(x1, y1, x2, y2, col, w, op);
        }
        if (partial > 0) {
          return useStrand
            ? strandPiece(x1, y1, x1 + (x2 - x1) * partial, y1 + (y2 - y1) * partial, col, w, op, false, false)
            : thinLine(x1, y1, x1 + (x2 - x1) * partial, y1 + (y2 - y1) * partial, col, w, op);
        }
        return '';
      };
      strands += drawLeg();
      if (needsMirrorLoop(a, b) && partial >= 0.98) strands += mirrorLoopPath(b.x, b.y, col, w, op);
      return { strands, arcs: '' };
    }

    function segmentHeadAt(a, b, frac) {
      const notch = matchNotchThroatCross(a, b);
      const f = Math.min(1, Math.max(0, frac));
      const x1 = X(a.x), y1 = Yp(a.y, a.panel);
      if (notch) {
        const endPanel = b.panel;
        const xm = X(notch.x), ym = Yp(notch.y, a.panel), ym2 = Yp(notch.y, endPanel);
        const x2 = X(b.x), y2 = Yp(b.y, endPanel);
        const leg1 = Math.hypot(xm - x1, ym - y1), leg2 = Math.hypot(x2 - xm, y2 - ym2), total = leg1 + leg2;
        const d = f * total;
        if (d <= leg1) return { x: x1 + (xm - x1) * (d / leg1), y: y1 + (ym - y1) * (d / leg1), panel: a.panel };
        if (f >= 1) return { x: x2, y: y2, panel: endPanel };
        const d2 = d - leg1;
        return { x: xm + (x2 - xm) * (d2 / leg2), y: ym2 + (y2 - ym2) * (d2 / leg2), panel: endPanel };
      }
      const sca = matchSideCornerArc(a, b);
      const ca = sca || matchCorner(a, b);
      if (ca) {
        const endPanel = sca ? b.panel : a.panel;
        const x2 = X(b.x), y2 = Yp(b.y, endPanel);
        return { x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, panel: f >= 1 ? endPanel : a.panel };
      }
      const x2 = X(b.x), y2 = Yp(b.y, a.panel);
      if (needsMirrorLoop(a, b) && f >= 1)
        return { x: X(b.x), y: Yp(b.y, b.panel), panel: b.panel };
      return { x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, panel: f >= 1 ? b.panel : a.panel };
    }

    function drawLoop(li, frac, dim, pass) {
      const path = loops[li];
      if (!path || !path.length) return { strands: '', arcs: '', head: null, panel: null, crossings: 0 };
      const n = path.length;
      const col = loopColor(li);
      const col2 = (!dim && strandMode !== 'string') ? (secondaryColors[li] || null) : null;
      const op = dim ? 0.06 : 1;
      const w = dim ? lineW() * 0.35 : lineW();
      const p = frac * n, k = Math.min(n, Math.floor(p)), fr = p - Math.floor(p);
      const mid = Math.floor(n / 2);
      let strands = '', arcs = '', head = null, panel = null, crossings = 0;

      for (let i = 0; i < n; i++) {
        const a = path[i], b = path[(i + 1) % n];
        const c = col2 && i >= mid ? col2 : col;
        if (i > 0 && path[i].panel !== path[i - 1].panel && i <= k) crossings++;
        if (matchNotchThroatCross(a, b) && i < k) crossings++;
        let partial = 0;
        if (i < k) partial = 1;
        else if (i === k && k < n) partial = fr;
        if (partial <= 0) continue;
        const seg = drawSegment(a, b, c, w, op, partial, pass, li, i);
        strands += seg.strands;
        arcs += seg.arcs;
        if (i === k && k < n) {
          const hp = segmentHeadAt(a, b, fr);
          head = { x: hp.x, y: hp.y }; panel = hp.panel;
        }
      }
      return { strands, arcs, head, panel, crossings };
    }

    function shapeLayer(panel) {
      let s = '';
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (cells[y][x]) {
        const yt = Math.min(Yp(y, panel), Yp(y + 1, panel));
        s += `<rect x="${X(x)}" y="${yt}" width="${CELL}" height="${CELL}" fill="${theme.panelFill}"/>`;
      }
      return s;
    }

    function weaveLayer(panel) {
      if (!showWeave || strandMode === 'full') return '';
      const stroke = theme.weaveStroke;
      const swW = 1.2 * sc();
      let s = '';
      for (const line of buildWeaveLines(panel)) {
        s += renderWeaveSegment(line.sx0, line.sy0, line.sx1, line.sy1, line.ux, line.uy, line.cuts, stroke, swW);
      }
      return s;
    }

    function boundaryLayer(panel) {
      let s = '';
      for (const e of edges) {
        const a = e.type === 'h'
          ? { x1: X(e.x0), y1: Yp(e.y, panel), x2: X(e.x1), y2: Yp(e.y, panel) }
          : { x1: X(e.x), y1: Yp(e.y0, panel), x2: X(e.x), y2: Yp(e.y1, panel) };
        s += `<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${theme.boundaryStroke}" stroke-width="${1.2 * sc()}"/>`;
      }
      return s;
    }

    function gapMarkersLayer() {
      let s = '<g class="gap-markers">';
      const r = Math.max(3.5, CELL * 0.17), swM = 1.2 * sc();
      for (const g of gaps) {
        const fill = isWallGap(g) ? theme.wallGap : theme.portalGap;
        if (L.isSeamGap(g, gh)) {
          s += `<circle cx="${X(g.x)}" cy="${Yp(g.y, 'A')}" r="${r}" fill="${fill}" stroke="${theme.seam}" stroke-width="${1.8 * sc()}"/>`;
          continue;
        }
        for (const panel of ['A', 'B'])
          s += `<circle cx="${X(g.x)}" cy="${Yp(g.y, panel)}" r="${r}" fill="${fill}" stroke="${theme.panelFill}" stroke-width="${swM}"/>`;
      }
      return s + '</g>';
    }

    function background() {
      let s = shapeLayer('A') + shapeLayer('B');
      s += weaveLayer('A') + weaveLayer('B');
      s += boundaryLayer('A') + boundaryLayer('B');
      s += `<line x1="${X(0)}" y1="${Yp(gh, 'A')}" x2="${X(gw)}" y2="${Yp(gh, 'A')}" stroke="${theme.seam}" stroke-width="${1.5 * sc()}" stroke-dasharray="1 4" opacity="0.7"/>`;
      return s;
    }

    function isLoopVisible(i) {
      return loopVisible === null || loopVisible[i] !== false;
    }

    function render() {
      if (destroyed) return;
      let s = background();
      let strands = '', arcs = '', info = null;
      const addLoop = (li, frac, dim) => {
        const dStr = drawLoop(li, frac, dim, 'strands');
        const dArc = drawLoop(li, frac, dim, 'arcs');
        strands += dStr.strands;
        arcs += dArc.arcs;
        return dStr;
      };
      if (sel < 0) {
        loops.forEach((_, li) => {
          if (!loops[li] || !loops[li].length) return;
          if (!isLoopVisible(li)) return;
          const d = addLoop(li, t, false);
          if (d.head) s += `<circle cx="${d.head.x}" cy="${d.head.y}" r="${Math.max(4.5 * sc(), lineW() * 0.35)}" fill="${theme.head}"/>`;
        });
      } else {
        loops.forEach((_, li) => {
          if (!loops[li] || !loops[li].length) return;
          if (!isLoopVisible(li)) return;
          if (li !== sel) addLoop(li, 1, true);
        });
        if (sel >= 0 && sel < loops.length && loops[sel] && loops[sel].length && isLoopVisible(sel)) {
          const d = addLoop(sel, t, false); info = d;
          if (d.head) {
            const hr = Math.max(6 * sc(), lineW() * 0.45);
            s += `<circle cx="${d.head.x}" cy="${d.head.y}" r="${hr}" fill="${theme.head}"/>`;
            s += `<circle cx="${d.head.x}" cy="${d.head.y}" r="${hr * 1.8}" fill="none" stroke="${theme.head}" stroke-width="${1.5 * sc()}" opacity="0.5"/>`;
          }
        }
      }
      s += strands + arcs;
      s += gapMarkersLayer();
      svgHost.innerHTML = `<svg width="${W()}" height="${H()}" viewBox="0 0 ${W()} ${H()}" style="display:block;max-width:100%;height:auto">${s}</svg>`;
      if (opts.onTick) opts.onTick({ t, sel, info, loopCount: loops.length, playing });
    }

    function frame(ts) {
      if (destroyed) return;
      if (playing) {
        if (!last) last = ts;
        t += speed * (ts - last) / 1000;
        last = ts;
        if (t >= 1) t = 0;
        render();
      } else last = 0;
      raf = requestAnimationFrame(frame);
    }

    function applyCellSize() {
      CELL = Math.max(8, Math.min(96, Math.round(baseCell * zoomScale)));
      PAD = Math.round(CELL * 24 / 22);
      render();
    }

    function fitCellSize() {
      const cw = container.clientWidth || 400;
      const ch = container.clientHeight || 400;
      const fit = Math.floor(Math.min((cw - 32) / (gw + 2.2), (ch - 32) / (2 * gh + 2.2)));
      baseCell = Math.max(10, Math.min(40, fit || baseCell));
      applyCellSize();
    }

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => fitCellSize())
      : null;
    if (ro) ro.observe(container);
    else window.addEventListener('resize', fitCellSize);

    raf = requestAnimationFrame(frame);
    fitCellSize();

    if (opts.autoplay) { playing = true; t = 0; }

    const api = {
      play() { playing = true; if (t >= 1) t = 0; render(); },
      pause() { playing = false; last = 0; render(); },
      restart() { t = 0; playing = true; last = 0; render(); },
      setSpeed(v) { speed = v; },
      setSelection(i) { sel = i; t = 1; playing = false; render(); },
      setColors(c) { colors = (c || []).slice(); render(); },
      setSecondaryColors(c) { secondaryColors = (c || []).slice(); render(); },
      setStrandMode(m) { strandMode = m || 'thin'; render(); },
      setVisible(v) { loopVisible = v ? v.slice() : null; render(); },
      setShowWeave(v) { showWeave = !!v; render(); },
      setZoom(scale) { zoomScale = Math.max(0.15, Math.min(5, scale)); applyCellSize(); },
      getZoom() { return zoomScale; },
      setProgress(v) { t = Math.max(0, Math.min(1, v)); render(); },
      getLoops: () => loops,
      getState() { return { t, sel, playing, speed, loopCount: loops.length, strandMode, zoom: zoomScale }; },
      destroy() {
        destroyed = true;
        playing = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        else window.removeEventListener('resize', fitCellSize);
        container.innerHTML = '';
      },
    };
    return api;
  }

  global.TwoPanelPlayer = { create };
})(typeof window !== 'undefined' ? window : globalThis);
