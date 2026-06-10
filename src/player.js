/*
 * TearPlayer — embeddable trace-player ("The Pull").
 * Renders a billiard-weave pattern and lays each string nail-to-nail in real
 * time: needle, glowing home nail, rope-shaded strands, over/under weave.
 * Vanilla JS + SVG, zero dependencies. Requires TearEngine (src/engine.js).
 *
 * Usage:
 *   const p = TearPlayer.create(el, { cells, gw, gh, colors: ['#d4242c', ...], autoplay: 'visible' });
 *   p.play(); p.pause(); p.restart(); p.destroy();
 */
(function (global) {
  'use strict';
  const E = global.TearEngine;
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- colour helpers ----------
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  }
  function mix(hexA, hexB, f) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
  }
  const darken = (hex, f) => mix(hex, '#000000', f);
  const lighten = (hex, f) => mix(hex, '#ffffff', f);

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // ---------- weave geometry (ported from the app, with arc-position tagging) ----------
  function getCoveredCrossings(pts, W, H) {
    const bsSet = new Set(), fsSet = new Set();
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg], p2 = pts[seg + 1];
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      if (sdx === 0 || sdy === 0) continue;
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      if (sdx === sdy) {
        const kVal = p1.y - p1.x;
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const cx = (mVal - kVal) / 2, cy = (mVal + kVal) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01)
            bsSet.add(cx.toFixed(2) + ',' + cy.toFixed(2));
        }
      } else {
        const mVal = p1.y + p1.x;
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const cx = (mVal - kVal2) / 2, cy = (mVal + kVal2) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01)
            fsSet.add(cx.toFixed(2) + ',' + cy.toFixed(2));
        }
      }
    }
    return { bsSet, fsSet };
  }

  /**
   * Cut a cycle's path into drawable pieces with weave gaps, tagging each piece
   * with its [arcStart, arcEnd] position along the path (grid units).
   */
  function buildPieces(ctx, pts, cums) {
    const { W, H, cells, gaps, cornerGapSet, toX, toY, cellSz, sw, gapHalf, crossingMap } = ctx;
    const pieces = [];
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg], p2 = pts[seg + 1];
      const segArc0 = cums[seg];
      const sx1 = toX(p1.x), sy1 = toY(p1.y);
      const sx2 = toX(p2.x), sy2 = toY(p2.y);
      const ddx = sx2 - sx1, ddy = sy2 - sy1;
      const len = Math.hypot(ddx, ddy);
      if (len < 0.5) continue;
      const ux = ddx / len, uy = ddy / len;
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      const p1Edge = E.isOnBoundary(p1.x, p1.y, cells, W, H);
      const p2Edge = E.isOnBoundary(p2.x, p2.y, cells, W, H);
      const p1gi = E.pointToGapIdx(p1.x, p1.y, gaps);
      const p2gi = E.pointToGapIdx(p2.x, p2.y, gaps);
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      // corner shortcut segments are replaced by corner arcs
      if (p1gi >= 0 && cornerGapSet.has(p1gi) && p2gi >= 0 && cornerGapSet.has(p2gi) && segLen < 1.1) continue;
      const axis = (sdx === 0 || sdy === 0) ? 'flat' : (sdx === sdy ? 'bs' : 'fs');
      if (axis === 'flat') {
        pieces.push({ x1: sx1, y1: sy1, x2: sx2, y2: sy2, axis, arcStart: segArc0, arcEnd: segArc0 + segLen, lenPx: len, edgeStart: p1Edge, edgeEnd: p2Edge, cutStart: false, cutEnd: false });
        continue;
      }
      const cuts = [];
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      if (axis === 'bs') {
        const kVal = p1.y - p1.x;
        const ki = Math.round(kVal - 0.5);
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const ix = (mVal - kVal) / 2, iy = (mVal + kVal) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 1) {
              if (crossingMap.forBS.has(ix.toFixed(2) + ',' + iy.toFixed(2)))
                cuts.push({ sx: toX(ix), sy: toY(iy) });
            }
          }
        }
      } else {
        const mVal = p1.y + p1.x;
        const mi = Math.round(mVal - 0.5);
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const ix = (mVal - kVal2) / 2, iy = (mVal + kVal2) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 0) {
              if (crossingMap.forFS.has(ix.toFixed(2) + ',' + iy.toFixed(2)))
                cuts.push({ sx: toX(ix), sy: toY(iy) });
            }
          }
        }
      }
      cuts.sort((a, b) => ((a.sx - sx1) * ux + (a.sy - sy1) * uy) - ((b.sx - sx1) * ux + (b.sy - sy1) * uy));
      let cx = sx1, cy = sy1;
      let isFirst = true;
      const projToArc = (px, py) => segArc0 + Math.hypot(px - sx1, py - sy1) / cellSz;
      for (const cut of cuts) {
        const gsx = cut.sx - ux * gapHalf, gsy = cut.sy - uy * gapHalf;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) pieces.push({
          x1: cx, y1: cy, x2: gsx, y2: gsy, axis,
          arcStart: projToArc(cx, cy), arcEnd: projToArc(gsx, gsy),
          lenPx: Math.hypot(gsx - cx, gsy - cy),
          edgeStart: isFirst && p1Edge, edgeEnd: false,
          cutStart: !isFirst, cutEnd: true,
        });
        cx = cut.sx + ux * gapHalf; cy = cut.sy + uy * gapHalf;
        isFirst = false;
      }
      const projEnd = (sx2 - cx) * ux + (sy2 - cy) * uy;
      if (projEnd > 0.5) pieces.push({
        x1: cx, y1: cy, x2: sx2, y2: sy2, axis,
        arcStart: projToArc(cx, cy), arcEnd: projToArc(sx2, sy2),
        lenPx: Math.hypot(sx2 - cx, sy2 - cy),
        edgeStart: isFirst && p1Edge, edgeEnd: p2Edge,
        cutStart: !isFirst, cutEnd: false,
      });
    }
    return pieces;
  }

  function buildCornerData(ctx) {
    const { W, H, cells, gaps } = ctx;
    const arcs = [];
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy - 1][vx - 1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy - 1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx - 1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br !== 1) continue;
      let g1, g2, sweep;
      if (br) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; sweep = 0; }
      else if (bl) { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; sweep = 1; }
      else if (tr) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; sweep = 1; }
      else { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; sweep = 0; }
      const gi1 = E.pointToGapIdx(g1.x, g1.y, gaps);
      const gi2 = E.pointToGapIdx(g2.x, g2.y, gaps);
      arcs.push({ g1, g2, gi1, gi2, sweep, vx, vy });
    }
    return arcs;
  }

  function cornerGapSetOf(ctx) {
    const set = new Set();
    for (const a of buildCornerData(ctx)) {
      if (a.gi1 >= 0) set.add(a.gi1);
      if (a.gi2 >= 0) set.add(a.gi2);
    }
    return set;
  }

  // find the arc position of a corner arc within a cycle's path (if it belongs to it)
  function cornerArcRange(pts, cums, g1, g2) {
    const near = (p, g) => Math.abs(p.x - g.x) < 0.05 && Math.abs(p.y - g.y) < 0.05;
    for (let i = 0; i < pts.length - 1; i++) {
      if ((near(pts[i], g1) && near(pts[i + 1], g2)) || (near(pts[i], g2) && near(pts[i + 1], g1)))
        return [cums[i], cums[i + 1]];
    }
    return null;
  }

  // ---------- the player ----------
  function create(container, opts) {
    opts = opts || {};
    const cells = opts.cells || E.rectCells(opts.gw || 18, opts.gh || 10);
    const H = cells.length, W = cells[0].length;
    const bg = opts.bg || '#101b16';
    const lightBg = (() => { const [r, g, b] = hexToRgb(bg); return (r + g + b) / 3 > 140; })();
    const rope = opts.rope !== false;
    const showNails = opts.nails !== false;
    const speedFactor = opts.speedFactor || 1;
    const loop = !!opts.loop;
    const ghost = !!opts.ghost;

    const { cycles, gaps } = E.getAllCycles(cells, W, H);
    const colors = cycles.map((c, i) =>
      (opts.colors && opts.colors[i]) || E.COLORS[i % E.COLORS.length]);

    // geometry
    const cellSz = 44;
    const pad = cellSz * 1.1;
    const svgW = W * cellSz + pad * 2, svgH = H * cellSz + pad * 2;
    const toX = x => pad + x * cellSz;
    const toY = y => pad + y * cellSz;
    const sw = cellSz * (opts.strand || 0.45);
    const gapHalf = sw / 2;

    const ctx = { W, H, cells, gaps, toX, toY, cellSz, sw, gapHalf };
    ctx.cornerGapSet = cornerGapSetOf(ctx);

    // full final-state crossing map (so gaps are correct from the first laid string)
    const allBS = new Set(), allFS = new Set();
    for (const c of cycles) {
      const { bsSet, fsSet } = getCoveredCrossings(c.points, W, H);
      for (const k of bsSet) allBS.add(k);
      for (const k of fsSet) allFS.add(k);
    }
    ctx.crossingMap = { forBS: allFS, forFS: allBS };

    // ---------- DOM ----------
    container.classList.add('tear-player');
    container.style.position = container.style.position || 'relative';
    const svg = el('svg', {
      viewBox: `0 0 ${svgW} ${svgH}`,
      preserveAspectRatio: 'xMidYMid meet',
      style: `display:block;width:100%;height:100%;background:${bg};`,
    }, container);

    const defs = el('defs', {}, svg);
    // rope gradients: one per (colour, axis), shared via userSpaceOnUse + repeat
    const gradId = (hex, axis) => 'rg-' + axis + '-' + hex.replace('#', '');
    const made = new Set();
    function ensureGradients(hex) {
      if (!rope || made.has(hex)) return;
      made.add(hex);
      const ax = toX(0.5), ay = toY(0); // lies on a centre-line of both axes
      const mk = (axis, vx, vy) => {
        const g = el('linearGradient', {
          id: gradId(hex, axis), gradientUnits: 'userSpaceOnUse', spreadMethod: 'repeat',
          x1: ax, y1: ay, x2: ax + vx, y2: ay + vy,
        }, defs);
        const stops = [
          [0, lighten(hex, 0.22)], [0.30, hex], [0.50, darken(hex, 0.28)], [0.70, hex], [1, lighten(hex, 0.22)],
        ];
        for (const [o, c] of stops) el('stop', { offset: o, 'stop-color': c }, g);
      };
      mk('bs', cellSz / 2, -cellSz / 2);
      mk('fs', cellSz / 2, cellSz / 2);
    }
    for (const c of colors) ensureGradients(c);
    // brass nail gradient
    const nailGrad = el('radialGradient', { id: 'tear-nail', cx: '0.35', cy: '0.3', r: '0.9' }, defs);
    el('stop', { offset: 0, 'stop-color': '#f7e3a8' }, nailGrad);
    el('stop', { offset: 0.55, 'stop-color': '#b98c3a' }, nailGrad);
    el('stop', { offset: 1, 'stop-color': '#6e4f1d' }, nailGrad);

    const gBoard = el('g', {}, svg);   // boundary hint
    const gNails = el('g', {}, svg);   // pins go in before any cord — craft order
    const gGhost = el('g', {}, svg);
    const gUnder = el('g', {}, svg);   // dark under-strokes (rope contour)
    const gTop = el('g', {}, svg);     // lit strokes
    const gShadow = el('g', {}, svg);  // dive shadows at under-crossing tips
    const gAnim = el('g', {}, svg);    // needle + home glow

    // faint boundary
    for (const e of E.buildEdges(cells, W, H)) {
      const a = e.type === 'h'
        ? { x1: toX(e.x0), y1: toY(e.y), x2: toX(e.x1), y2: toY(e.y) }
        : { x1: toX(e.x), y1: toY(e.y0), x2: toX(e.x), y2: toY(e.y1) };
      el('line', Object.assign(a, {
        stroke: lightBg ? 'rgba(0,0,0,0.18)' : 'rgba(241,230,205,0.10)', 'stroke-width': 1.3,
      }), gBoard);
    }

    // nails: edge gaps (non-corner) + lone-cell corners
    if (showNails) {
      const pin = (x, y, r) => {
        el('ellipse', { cx: x + 1.4, cy: y + 1.6, rx: r, ry: r * 0.85, fill: 'rgba(0,0,0,0.28)' }, gNails);
        el('circle', { cx: x, cy: y, r, fill: 'url(#tear-nail)', stroke: 'rgba(0,0,0,0.45)', 'stroke-width': 0.7 }, gNails);
        el('circle', { cx: x - r * 0.35, cy: y - r * 0.35, r: r * 0.26, fill: 'rgba(255,255,255,0.85)' }, gNails);
      };
      gaps.forEach((g, i) => { if (!ctx.cornerGapSet.has(i)) pin(toX(g.x), toY(g.y), 3.4); });
      for (const a of buildCornerData(ctx)) pin(toX(a.vx), toY(a.vy), 4.0);
    }

    // ---------- per-cycle visual elements ----------
    const cycleData = cycles.map((c, ci) => {
      const pts = c.points;
      const cums = E.cumLens(pts);
      const total = cums[cums.length - 1];
      const color = colors[ci];
      const under = rope ? darken(mix(color, bg, 0.08), lightBg ? 0.55 : 0.42) : null;
      const pieces = buildPieces(ctx, pts, cums);
      const nodes = [];
      for (const p of pieces) {
        const group = { piece: p, lines: [], extras: [] };
        const dashHidden = `0 ${p.lenPx + 2}`;
        if (rope) {
          group.lines.push(el('line', {
            x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2,
            stroke: under, 'stroke-width': sw + 2.6, 'stroke-linecap': 'butt',
            'stroke-dasharray': dashHidden, visibility: 'hidden',
          }, gUnder));
        }
        const paint = (rope && p.axis !== 'flat') ? `url(#${gradId(color, p.axis)})` : color;
        group.lines.push(el('line', {
          x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2,
          stroke: paint, 'stroke-width': sw, 'stroke-linecap': 'butt',
          'stroke-dasharray': dashHidden, visibility: 'hidden',
        }, gTop));
        // dive shadows at cut-facing ends (revealed when the piece completes)
        if (rope) {
          const mkShadow = (fromX, fromY, toXp, toYp) => {
            const ln = Math.hypot(toXp - fromX, toYp - fromY) || 1;
            const f = Math.min(1, (gapHalf * 0.9) / ln);
            const ex = fromX + (toXp - fromX) * f, ey = fromY + (toYp - fromY) * f;
            const sEl = el('line', {
              x1: fromX, y1: fromY, x2: ex, y2: ey,
              stroke: 'rgba(0,0,0,0.30)', 'stroke-width': sw, 'stroke-linecap': 'butt',
              opacity: 0,
            }, gShadow);
            group.extras.push({ node: sEl, at: p.arcEnd });
          };
          if (p.cutEnd) mkShadow(p.x2, p.y2, p.x1, p.y1);
          if (p.cutStart) {
            const sEl = el('line', (() => {
              const ln = p.lenPx || 1;
              const f = Math.min(1, (gapHalf * 0.9) / ln);
              return {
                x1: p.x1, y1: p.y1,
                x2: p.x1 + (p.x2 - p.x1) * f, y2: p.y1 + (p.y2 - p.y1) * f,
                stroke: 'rgba(0,0,0,0.30)', 'stroke-width': sw, 'stroke-linecap': 'butt', opacity: 0,
              };
            })(), gShadow);
            group.extras.push({ node: sEl, at: p.arcEnd });
          }
        }
        // edge end-caps
        const cap = (x, y, at) => {
          const cEl = el('circle', { cx: x, cy: y, r: sw / 2, fill: color, opacity: 0 }, gTop);
          group.extras.push({ node: cEl, at });
        };
        if (p.edgeStart) cap(p.x1, p.y1, p.arcStart + 0.02);
        if (p.edgeEnd) cap(p.x2, p.y2, p.arcEnd);
        nodes.push(group);
      }
      // corner arcs belonging to this cycle
      const arcs = [];
      for (const a of buildCornerData(ctx)) {
        const range = cornerArcRange(pts, cums, a.g1, a.g2);
        if (!range) continue;
        const x1 = toX(a.g1.x), y1 = toY(a.g1.y), x2 = toX(a.g2.x), y2 = toY(a.g2.y);
        const r = Math.hypot(x2 - x1, y2 - y1) / 2;
        const d = `M${x1},${y1} A${r},${r} 0 0,${a.sweep} ${x2},${y2}`;
        const nodesArc = [];
        if (rope) nodesArc.push(el('path', { d, fill: 'none', stroke: under, 'stroke-width': sw + 2.6, 'stroke-linecap': 'round', opacity: 0 }, gUnder));
        nodesArc.push(el('path', { d, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linecap': 'butt', opacity: 0 }, gTop));
        arcs.push({ at: range[1], nodes: nodesArc });
      }
      // ghost preview of the path
      let ghostNode = null;
      if (ghost) {
        ghostNode = el('polyline', {
          points: pts.map(p => `${toX(p.x)},${toY(p.y)}`).join(' '),
          fill: 'none', stroke: color, 'stroke-opacity': 0.13,
          'stroke-width': Math.max(1.5, sw * 0.25), 'stroke-dasharray': `${cellSz * 0.18} ${cellSz * 0.2}`,
        }, gGhost);
      }
      return { pts, cums, total, color, nodes, arcs, ghostNode };
    });

    // needle + home glow
    const homeGlow = el('circle', { r: cellSz * 0.42, fill: 'none', stroke: '#ecc87e', 'stroke-width': 2.2, 'stroke-dasharray': '5 4', opacity: 0 }, gAnim);
    const needleHalo = el('circle', { r: Math.max(10, sw * 1.4), fill: 'none', stroke: '#ecc87e', 'stroke-width': 2.4, opacity: 0 }, gAnim);
    const needleDot = el('circle', { r: Math.max(4.5, sw * 0.5), fill: '#fff6dd', stroke: '#d9a440', 'stroke-width': 1.6, opacity: 0 }, gAnim);

    // ---------- timeline ----------
    const totalAll = cycleData.reduce((a, c) => a + c.total, 0);
    let curCycle = 0;
    let t = 0;               // arc position within current cycle
    let playing = false;
    let raf = null;
    let lastNow = 0;
    let pauseUntil = 0;
    let done = false;

    // pace the WHOLE board, not each cycle: first string slow and dramatic,
    // later strings accelerate (the viewer knows the rule by then)
    const totalDur = Math.min(22, Math.max(6, totalAll * 0.022)) / speedFactor; // seconds
    const baseRate = totalAll / totalDur; // arc-units per second
    const rateFor = ci => baseRate * (cycleData.length <= 1 ? 1 : (0.7 + 0.75 * (ci / (cycleData.length - 1))));
    const cyclePause = cycleData.length > 4 ? 220 : 450;

    function setPieceProgress(group, tt) {
      const p = group.piece;
      let dash, hidden = false;
      if (tt >= p.arcEnd) dash = null;                 // fully drawn
      else if (tt <= p.arcStart) { dash = `0 ${p.lenPx + 2}`; hidden = true; }
      else {
        const vis = ((tt - p.arcStart) / (p.arcEnd - p.arcStart)) * p.lenPx;
        dash = `${vis} ${p.lenPx + 2}`;
      }
      for (const ln of group.lines) {
        ln.setAttribute('visibility', hidden ? 'hidden' : 'visible');
        if (dash === null) ln.removeAttribute('stroke-dasharray');
        else ln.setAttribute('stroke-dasharray', dash);
      }
      for (const ex of group.extras) ex.node.setAttribute('opacity', tt >= ex.at ? 1 : 0);
    }

    function renderCycleAt(ci, tt) {
      const c = cycleData[ci];
      for (const g of c.nodes) setPieceProgress(g, tt);
      for (const a of c.arcs) for (const n of a.nodes) n.setAttribute('opacity', tt >= a.at ? 1 : 0);
    }

    function renderState() {
      for (let i = 0; i < cycleData.length; i++) {
        if (i < curCycle) renderCycleAt(i, Infinity);
        else if (i > curCycle) renderCycleAt(i, -1);
        else renderCycleAt(i, t);
      }
      const c = cycleData[curCycle];
      if (!c) return;
      const active = playing && !done && t < c.total;
      // home glow + needle
      const home = c.pts[0];
      homeGlow.setAttribute('cx', toX(home.x));
      homeGlow.setAttribute('cy', toY(home.y));
      if (active || (t > 0 && t < c.total)) {
        const pos = E.pointAtArc(c.pts, c.cums, t);
        const px = toX(pos.x), py = toY(pos.y);
        needleDot.setAttribute('cx', px); needleDot.setAttribute('cy', py);
        needleHalo.setAttribute('cx', px); needleHalo.setAttribute('cy', py);
        needleDot.setAttribute('opacity', 1);
        needleHalo.setAttribute('opacity', 0.5 + 0.4 * Math.sin(lastNow / 180));
        // glow breathes brighter as the needle nears home (after half way)
        const dHome = Math.hypot(pos.x - home.x, pos.y - home.y);
        const near = t > c.total * 0.5 ? Math.max(0, 1 - dHome / 4) : 0;
        homeGlow.setAttribute('opacity', 0.28 + near * 0.7);
      } else {
        needleDot.setAttribute('opacity', 0);
        needleHalo.setAttribute('opacity', 0);
        homeGlow.setAttribute('opacity', done ? 0 : 0.28);
      }
    }

    function tick(now) {
      raf = null;
      if (!playing) return;
      const dt = Math.min(0.05, (now - lastNow) / 1000 || 0);
      lastNow = now;
      if (now >= pauseUntil) {
        const c = cycleData[curCycle];
        if (c) {
          t += rateFor(curCycle) * dt;
          if (t >= c.total) {
            t = c.total;
            renderState();
            if (curCycle < cycleData.length - 1) {
              curCycle++;
              t = 0;
              pauseUntil = now + cyclePause;   // a breath between strings
            } else {
              done = true;
              playing = false;
              renderState();
              if (typeof opts.onDone === 'function') opts.onDone();
              if (loop) restartTimer = setTimeout(() => { api.restart(); api.play(); }, 1800);
              return;
            }
          }
        }
      }
      renderState();
      raf = requestAnimationFrame(tick);
    }

    let restartTimer = null;
    const api = {
      svg,
      cycles: cycles.length,
      play() {
        if (done) api.restart();
        if (playing) return;
        playing = true;
        lastNow = performance.now();
        if (!raf) raf = requestAnimationFrame(tick);
      },
      pause() { playing = false; if (raf) { cancelAnimationFrame(raf); raf = null; } },
      restart() {
        if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
        curCycle = 0; t = 0; done = false; pauseUntil = 0;
        renderState();
      },
      finish() { curCycle = cycleData.length - 1; t = cycleData[curCycle] ? cycleData[curCycle].total : 0; done = true; playing = false; renderState(); },
      setSpeed(f) { /* takes effect next frame */ opts.speedFactor = f; },
      destroy() {
        api.pause();
        if (observer) observer.disconnect();
        svg.remove();
      },
    };

    // initial paint
    renderState();

    // autoplay
    let observer = null;
    if (opts.autoplay === 'visible' && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(entries => {
        for (const en of entries) {
          if (en.isIntersecting && !done) api.play();
          else if (!en.isIntersecting) api.pause();
        }
      }, { threshold: 0.35 });
      observer.observe(container);
    } else if (opts.autoplay !== false) {
      api.play();
    }

    return api;
  }

  global.TearPlayer = { create };
})(typeof window !== 'undefined' ? window : globalThis);
