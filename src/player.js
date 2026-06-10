/*
 * TearPlayer — embeddable trace-player ("The Pull").
 * Lays each string nail-to-nail in real time, exactly like the craft:
 *   - a string being laid is CONTINUOUS — the only gaps are where it dives
 *     under cord that is already on the board (painter's order = laying order)
 *   - later strings simply lie on top where they cross over
 * Flat, clean rendering. Vanilla JS + SVG, zero dependencies.
 * Requires TearEngine (src/engine.js).
 *
 * Usage:
 *   const p = TearPlayer.create(el, { cells, gw, gh, colors: [...], autoplay: 'visible' });
 *   p.play(); p.pause(); p.restart(); p.finish(); p.destroy();
 */
(function (global) {
  'use strict';
  const E = global.TearEngine;
  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function luminance(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return (parseInt(v.slice(0, 2), 16) + parseInt(v.slice(2, 4), 16) + parseInt(v.slice(4, 6), 16)) / 3;
  }

  /**
   * For every interior crossing point, record which cycle passes through it on
   * each diagonal and at what arc position — the laying order at that point.
   * key -> { bs: {ci, arc}, fs: {ci, arc} }
   */
  function buildPassMap(cycleData, W, H) {
    const map = new Map();
    cycleData.forEach((cd, ci) => {
      const pts = cd.pts, cums = cd.cums;
      for (let seg = 0; seg < pts.length - 1; seg++) {
        const p1 = pts[seg], p2 = pts[seg + 1];
        const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
        if (sdx === 0 || sdy === 0) continue;
        const axis = sdx === sdy ? 'bs' : 'fs';
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const visit = (ix, iy) => {
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            const key = ix.toFixed(2) + ',' + iy.toFixed(2);
            let e = map.get(key);
            if (!e) { e = {}; map.set(key, e); }
            e[axis] = { ci, arc: cums[seg] + Math.hypot(ix - p1.x, iy - p1.y) };
          }
        };
        if (axis === 'bs') {
          const kVal = p1.y - p1.x;
          for (let mi = -1; mi <= W + H; mi++) {
            const mVal = mi + 0.5;
            visit((mVal - kVal) / 2, (mVal + kVal) / 2);
          }
        } else {
          const mVal = p1.y + p1.x;
          for (let ki = -W; ki <= H; ki++) {
            const kVal2 = ki + 0.5;
            visit((mVal - kVal2) / 2, (mVal + kVal2) / 2);
          }
        }
      }
    });
    return map;
  }

  /**
   * Cut a cycle's path into drawable pieces. A cut exists ONLY where this
   * string passes under a strand that was laid earlier (earlier cycle, or an
   * earlier pass of itself). Everything else stays continuous — later strands
   * are simply drawn on top, as in real life.
   */
  function buildPieces(ctx, ci, pts, cums) {
    const { W, H, cells, gaps, cornerGapSet, toX, toY, cellSz, gapHalf, passMap } = ctx;
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
      const diagonal = sdx !== 0 && sdy !== 0;
      const cuts = [];
      if (diagonal) {
        const axis = sdx === sdy ? 'bs' : 'fs';
        const other = axis === 'bs' ? 'fs' : 'bs';
        const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
        const tryCut = (ix, iy, underHere) => {
          if (!(ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01)) return;
          if (!underHere) return;                        // we pass over here
          const entry = passMap.get(ix.toFixed(2) + ',' + iy.toFixed(2));
          const partner = entry && entry[other];
          if (!partner) return;                          // nothing ever crosses here
          const myArc = segArc0 + Math.hypot(ix - p1.x, iy - p1.y);
          const partnerFirst = partner.ci < ci || (partner.ci === ci && partner.arc < myArc - 1e-9);
          if (!partnerFirst) return;                     // we lay first; it covers us later
          cuts.push({ sx: toX(ix), sy: toY(iy) });
        };
        if (axis === 'bs') {
          const kVal = p1.y - p1.x;
          const ki = Math.round(kVal - 0.5);
          for (let mi = -1; mi <= W + H; mi++) {
            const mVal = mi + 0.5;
            tryCut((mVal - kVal) / 2, (mVal + kVal) / 2, (ki + mi + W) % 2 === 1);
          }
        } else {
          const mVal = p1.y + p1.x;
          const mi = Math.round(mVal - 0.5);
          for (let ki = -W; ki <= H; ki++) {
            const kVal2 = ki + 0.5;
            tryCut((mVal - kVal2) / 2, (mVal + kVal2) / 2, (ki + mi + W) % 2 === 0);
          }
        }
        cuts.sort((a, b) => ((a.sx - sx1) * ux + (a.sy - sy1) * uy) - ((b.sx - sx1) * ux + (b.sy - sy1) * uy));
      }
      const projToArc = (px, py) => segArc0 + Math.hypot(px - sx1, py - sy1) / cellSz;
      let cx = sx1, cy = sy1;
      let isFirst = true;
      for (const cut of cuts) {
        const gsx = cut.sx - ux * gapHalf, gsy = cut.sy - uy * gapHalf;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) pieces.push({
          x1: cx, y1: cy, x2: gsx, y2: gsy,
          arcStart: projToArc(cx, cy), arcEnd: projToArc(gsx, gsy),
          lenPx: Math.hypot(gsx - cx, gsy - cy),
          edgeStart: isFirst && p1Edge, edgeEnd: false,
        });
        cx = cut.sx + ux * gapHalf; cy = cut.sy + uy * gapHalf;
        isFirst = false;
      }
      const projEnd = (sx2 - cx) * ux + (sy2 - cy) * uy;
      if (projEnd > 0.5) pieces.push({
        x1: cx, y1: cy, x2: sx2, y2: sy2,
        arcStart: projToArc(cx, cy), arcEnd: projToArc(sx2, sy2),
        lenPx: Math.hypot(sx2 - cx, sy2 - cy),
        edgeStart: isFirst && p1Edge, edgeEnd: p2Edge,
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
    const bg = opts.bg || '#0c0f12';
    const lightBg = luminance(bg) > 140;
    const showNails = opts.nails !== false;
    const speedFactor = opts.speedFactor || 1;
    const loop = !!opts.loop;

    const { cycles, gaps } = E.getAllCycles(cells, W, H);
    const colors = cycles.map((c, i) =>
      (opts.colors && opts.colors[i]) || E.COLORS[i % E.COLORS.length]);

    // geometry
    const cellSz = 44;
    const pad = cellSz * 1.0;
    const svgW = W * cellSz + pad * 2, svgH = H * cellSz + pad * 2;
    const toX = x => pad + x * cellSz;
    const toY = y => pad + y * cellSz;
    const sw = cellSz * (opts.strand || 0.45);
    const FULL_W = cellSz * 0.707;          // strands touch — finished cloth has no gaps
    const gapHalf = FULL_W / 2;             // cuts sized for the finished cloth

    const ctx = { W, H, cells, gaps, toX, toY, cellSz, sw, gapHalf };
    ctx.cornerGapSet = new Set();
    const cornerData = buildCornerData(ctx);
    for (const a of cornerData) {
      if (a.gi1 >= 0) ctx.cornerGapSet.add(a.gi1);
      if (a.gi2 >= 0) ctx.cornerGapSet.add(a.gi2);
    }

    const baseCycleData = cycles.map(c => ({ pts: c.points, cums: E.cumLens(c.points) }));
    ctx.passMap = buildPassMap(baseCycleData, W, H);

    // ---------- DOM ----------
    container.classList.add('tear-player');
    const svg = el('svg', {
      viewBox: `0 0 ${svgW} ${svgH}`,
      preserveAspectRatio: 'xMidYMid meet',
      style: `display:block;width:100%;height:100%;background:${bg};`,
    }, container);
    const styleEl = el('style', {}, svg);
    styleEl.textContent = 'line, path { transition: stroke-width 650ms ease; } circle { transition: r 650ms ease; }';

    const gBoard = el('g', {}, svg);
    const gWeave = el('g', {}, svg);   // cycles appended in laying order — painter's order IS weave order
    const gAnim = el('g', {}, svg);

    // faint boundary
    for (const e of E.buildEdges(cells, W, H)) {
      const a = e.type === 'h'
        ? { x1: toX(e.x0), y1: toY(e.y), x2: toX(e.x1), y2: toY(e.y) }
        : { x1: toX(e.x), y1: toY(e.y0), x2: toX(e.x), y2: toY(e.y1) };
      el('line', Object.assign(a, {
        stroke: lightBg ? 'rgba(0,0,0,0.16)' : 'rgba(193,202,211,0.10)', 'stroke-width': 1.2,
      }), gBoard);
    }
    // nails: quiet dots
    if (showNails) {
      const fill = lightBg ? 'rgba(0,0,0,0.30)' : 'rgba(193,202,211,0.35)';
      gaps.forEach((g, i) => {
        if (!ctx.cornerGapSet.has(i)) el('circle', { cx: toX(g.x), cy: toY(g.y), r: 2.2, fill }, gBoard);
      });
      for (const a of cornerData) el('circle', { cx: toX(a.vx), cy: toY(a.vy), r: 2.2, fill }, gBoard);
    }

    // ---------- per-cycle visuals ----------
    const cycleData = baseCycleData.map((cd, ci) => {
      const { pts, cums } = cd;
      const total = cums[cums.length - 1];
      const color = colors[ci];
      const gCycle = el('g', {}, gWeave);
      const pieces = buildPieces(ctx, ci, pts, cums);
      const nodes = pieces.map(p => {
        const line = el('line', {
          x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2,
          stroke: color, 'stroke-width': sw, 'stroke-linecap': 'butt',
          visibility: 'hidden',
        }, gCycle);
        const extras = [];
        const cap = (x, y, at) => {
          const c = el('circle', { cx: x, cy: y, r: sw / 2, fill: color, opacity: 0 }, gCycle);
          extras.push({ node: c, at });
        };
        if (p.edgeStart) cap(p.x1, p.y1, p.arcStart + 0.02);
        if (p.edgeEnd) cap(p.x2, p.y2, p.arcEnd);
        return { piece: p, line, extras };
      });
      const arcs = [];
      for (const a of cornerData) {
        const range = cornerArcRange(pts, cums, a.g1, a.g2);
        if (!range) continue;
        const x1 = toX(a.g1.x), y1 = toY(a.g1.y), x2 = toX(a.g2.x), y2 = toY(a.g2.y);
        const r = Math.hypot(x2 - x1, y2 - y1) / 2;
        const node = el('path', {
          d: `M${x1},${y1} A${r},${r} 0 0,${a.sweep} ${x2},${y2}`,
          fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linecap': 'butt', opacity: 0,
        }, gCycle);
        arcs.push({ at: range[1], node });
      }
      return { pts, cums, total, color, nodes, arcs };
    });

    // needle + home marker — minimal
    const homeRing = el('circle', { r: cellSz * 0.38, fill: 'none', stroke: lightBg ? 'rgba(0,0,0,0.5)' : 'rgba(238,242,245,0.7)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4', opacity: 0 }, gAnim);
    const needleDot = el('circle', { r: Math.max(4, sw * 0.42), fill: '#ffffff', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': 1, opacity: 0 }, gAnim);

    // ---------- timeline ----------
    const totalAll = cycleData.reduce((a, c) => a + c.total, 0);
    let curCycle = 0;
    let t = 0;
    let playing = false;
    let raf = null;
    let lastNow = 0;
    let pauseUntil = 0;
    let done = false;
    let restartTimer = null;

    // pace the whole board: first string slow, later strings accelerate
    const totalDur = Math.min(22, Math.max(6, totalAll * 0.022)) / speedFactor;
    const baseRate = totalAll / totalDur;
    const rateFor = ci => baseRate * (cycleData.length <= 1 ? 1 : (0.7 + 0.75 * (ci / (cycleData.length - 1))));
    const cyclePause = cycleData.length > 4 ? 220 : 450;

    let isFull = false;
    function setFull(full) {
      if (full === isFull) return;
      isFull = full;
      const w = full ? FULL_W : sw;
      for (const c of cycleData) {
        for (const g of c.nodes) {
          g.line.setAttribute('stroke-width', w);
          for (const ex of g.extras) if (ex.node.tagName === 'circle') ex.node.setAttribute('r', w / 2);
        }
        for (const a of c.arcs) a.node.setAttribute('stroke-width', w);
      }
    }

    function setPieceProgress(g, tt) {
      const p = g.piece;
      if (tt >= p.arcEnd) {
        g.line.setAttribute('visibility', 'visible');
        g.line.removeAttribute('stroke-dasharray');
      } else if (tt <= p.arcStart) {
        g.line.setAttribute('visibility', 'hidden');
      } else {
        const vis = ((tt - p.arcStart) / (p.arcEnd - p.arcStart)) * p.lenPx;
        g.line.setAttribute('visibility', 'visible');
        g.line.setAttribute('stroke-dasharray', `${vis} ${p.lenPx + 2}`);
      }
      for (const ex of g.extras) ex.node.setAttribute('opacity', tt >= ex.at ? 1 : 0);
    }

    function renderCycleAt(ci, tt) {
      const c = cycleData[ci];
      for (const g of c.nodes) setPieceProgress(g, tt);
      for (const a of c.arcs) a.node.setAttribute('opacity', tt >= a.at ? 1 : 0);
    }

    function renderState() {
      for (let i = 0; i < cycleData.length; i++) {
        if (i < curCycle) renderCycleAt(i, Infinity);
        else if (i > curCycle) renderCycleAt(i, -1);
        else renderCycleAt(i, t);
      }
      const c = cycleData[curCycle];
      if (!c) return;
      const home = c.pts[0];
      homeRing.setAttribute('cx', toX(home.x));
      homeRing.setAttribute('cy', toY(home.y));
      if (!done && t > 0 && t < c.total) {
        const pos = E.pointAtArc(c.pts, c.cums, t);
        needleDot.setAttribute('cx', toX(pos.x));
        needleDot.setAttribute('cy', toY(pos.y));
        needleDot.setAttribute('opacity', 1);
        homeRing.setAttribute('opacity', 0.55);
      } else {
        needleDot.setAttribute('opacity', 0);
        homeRing.setAttribute('opacity', done ? 0 : 0.55);
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
              pauseUntil = now + cyclePause;
            } else {
              done = true;
              playing = false;
              renderState();
              if (opts.fullOnDone !== false) setFull(true);
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
        setFull(false);
        renderState();
      },
      finish() {
        curCycle = cycleData.length - 1;
        t = cycleData[curCycle] ? cycleData[curCycle].total : 0;
        done = true; playing = false;
        if (opts.fullOnDone !== false) setFull(true);
        renderState();
      },
      destroy() {
        api.pause();
        if (observer) observer.disconnect();
        svg.remove();
      },
    };

    renderState();

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
