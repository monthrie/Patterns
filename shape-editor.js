/*
 * ShapeEditor — cell-grid shape drawing (mirror tab edit panel).
 * Vanilla JS; matches index.html mirror edit UX.
 */
(function (global) {
  'use strict';

  function getAllCycles(cells, gw, gh) {
    if (global.TearEngine?.getAllCycles) return global.TearEngine.getAllCycles(cells, gw, gh);
    return localGetAllCycles(cells, gw, gh);
  }

  function localGetAllCycles(cells, gw, gh) {
    const edges = buildEdges(cells, gw, gh);
    const gaps = buildGaps(cells, gw, gh);
    if (!gaps.length) return { cycles: [], gaps, edges };
    const vis = new Set();
    const cycles = [];
    for (let g = 0; g < gaps.length; g++) {
      if (vis.has(g)) continue;
      const pts = tracePath(g, gaps, edges, cells, gw, gh);
      const gapSet = new Set();
      for (const p of pts) {
        const gi = pointToGapIdx(p.x, p.y, gaps);
        if (gi >= 0) { gapSet.add(gi); vis.add(gi); }
      }
      cycles.push({ startGap: g, points: pts, gaps: gapSet });
    }
    return { cycles, gaps, edges };
  }

  function buildEdges(cells, gw, gh) {
    const hUnits = [], vUnits = [];
    for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
      const above = y > 0 ? cells[y - 1][x] : false;
      const below = y < gh ? cells[y][x] : false;
      if (above !== below) hUnits.push({ y, x });
    }
    for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
      const left = x > 0 ? cells[y][x - 1] : false;
      const right = x < gw ? cells[y][x] : false;
      if (left !== right) vUnits.push({ x, y });
    }
    const edges = [];
    const hByY = {};
    for (const e of hUnits) { (hByY[e.y] ||= []).push(e.x); }
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
    for (const e of vUnits) { (vByX[e.x] ||= []).push(e.y); }
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
    for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
      const above = y > 0 ? cells[y - 1][x] : false;
      const below = y < gh ? cells[y][x] : false;
      if (above !== below) gaps.push({ x: x + 0.5, y, isH: true, interiorBelow: !!below });
    }
    for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
      const left = x > 0 ? cells[y][x - 1] : false;
      const right = x < gw ? cells[y][x] : false;
      if (left !== right) gaps.push({ x, y: y + 0.5, isH: false, interiorRight: !!right });
    }
    return gaps;
  }

  function getInitialDir(gap) {
    if (gap.isH) return gap.interiorBelow ? { dx: 1, dy: 1 } : { dx: -1, dy: -1 };
    return gap.interiorRight ? { dx: 1, dy: -1 } : { dx: -1, dy: 1 };
  }

  function pointToGapIdx(px, py, gaps) {
    for (let i = 0; i < gaps.length; i++) {
      if (Math.abs(px - gaps[i].x) < 0.1 && Math.abs(py - gaps[i].y) < 0.1) return i;
    }
    return -1;
  }

  function tracePath(startIdx, gaps, edges, cells, gw, gh) {
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
        if (t < minT - EPS) { minT = t; hitH = edge.type === 'h'; hitV = edge.type === 'v'; }
        else if (Math.abs(t - minT) < EPS * 100) {
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

  function edgeRunKey(r) {
    return r.orient === 'h'
      ? `h:${r.y}:${r.x0}:${r.x1}`
      : `v:${r.x}:${r.y0}:${r.y1}`;
  }

  function gapCoordKey(g) {
    return `${g.isH ? 'h' : 'v'}:${g.x}:${g.y}`;
  }

  function buildWallGapSet(cells, gw, gh, wallEdgeKeys) {
    const runs = computeEdgeRuns(cells, gw, gh);
    const keySet = new Set(wallEdgeKeys || []);
    const set = new Set();
    for (const r of runs) {
      if (!keySet.has(edgeRunKey(r))) continue;
      if (r.orient === 'h') {
        for (let x = r.x0; x < r.x1; x++) set.add(`h:${x + 0.5}:${r.y}`);
      } else {
        for (let y = r.y0; y < r.y1; y++) set.add(`v:${r.x}:${y + 0.5}`);
      }
    }
    return set;
  }

  /** wallEdges null/undefined → legacy top row (y=0); [] → all portals; [...] → explicit */
  function buildIsWallGap(cells, gw, gh, wallEdges) {
    if (wallEdges === null || wallEdges === undefined) {
      return g => g.isH && g.y === 0;
    }
    const wallSet = buildWallGapSet(cells, gw, gh, wallEdges);
    return g => wallSet.has(gapCoordKey(g));
  }

  function legacyTopWallEdgeKeys(cells, gw, gh) {
    return computeEdgeRuns(cells, gw, gh)
      .filter(r => r.orient === 'h' && r.y === 0)
      .map(edgeRunKey);
  }

  function computeEdgeRuns(cells, gridW, gridH) {
    const isOn = (x, y) => x >= 0 && y >= 0 && x < gridW && y < gridH && !!cells[y]?.[x];
    const runs = [];
    for (let y = 0; y <= gridH; y++) {
      let s = null, filledAbove = false;
      for (let x = 0; x <= gridW; x++) {
        const a = isOn(x, y - 1), b = isOn(x, y);
        const isEdge = x < gridW && a !== b;
        if (isEdge) {
          if (s === null) { s = x; filledAbove = a; }
        } else if (s !== null) {
          runs.push({ orient: 'h', y, x0: s, x1: x, len: x - s, filledAbove });
          s = null;
        }
      }
    }
    for (let x = 0; x <= gridW; x++) {
      let s = null, filledLeft = false;
      for (let y = 0; y <= gridH; y++) {
        const a = isOn(x - 1, y), b = isOn(x, y);
        const isEdge = y < gridH && a !== b;
        if (isEdge) {
          if (s === null) { s = y; filledLeft = a; }
        } else if (s !== null) {
          runs.push({ orient: 'v', x, y0: s, y1: y, len: y - s, filledLeft });
          s = null;
        }
      }
    }
    return runs;
  }

  function cloneCells(cells) {
    return cells.map(r => [...r]);
  }

  function flipCellsH(cells, gw) {
    return cells.map(row => {
      const out = Array(gw);
      for (let x = 0; x < gw; x++) out[gw - 1 - x] = row[x];
      return out;
    });
  }

  function flipCellsV(cells, gh) {
    return Array.from({ length: gh }, (_, y) => [...cells[gh - 1 - y]]);
  }

  function transformWallEdgeKey(key, gw, gh, kind) {
    const p = key.split(':');
    if (p[0] === 'h') {
      const y = +p[1], x0 = +p[2], x1 = +p[3];
      if (kind === 'h') return `h:${y}:${gw - x1}:${gw - x0}`;
      return `h:${gh - y}:${x0}:${x1}`;
    }
    const x = +p[1], y0 = +p[2], y1 = +p[3];
    if (kind === 'h') return `v:${gw - x}:${y0}:${y1}`;
    return `v:${x}:${gh - y1}:${gh - y0}`;
  }

  function transformWallEdges(keys, cells, gw, gh, kind) {
    const valid = new Set(computeEdgeRuns(cells, gw, gh).map(edgeRunKey));
    return keys
      .map(k => transformWallEdgeKey(k, gw, gh, kind))
      .filter(k => valid.has(k));
  }

  function normalizeCells(cells, gw, gh) {
    return Array.from({ length: gh }, (_, y) =>
      Array.from({ length: gw }, (_, x) => !!(cells[y] && cells[y][x])));
  }

  function create(container, opts) {
    opts = opts || {};
    let gridW = opts.gw || 18;
    let gridH = opts.gh || 10;
    let cells = normalizeCells(opts.cells || [], gridW, gridH);
    let marquee = null;
    let wallEdges = new Set(Array.isArray(opts.wallEdges) ? opts.wallEdges : []);
    let baseline = null;
    let destroyed = false;
    let onResize = null;
    let resizeObs = null;

    const onChange = opts.onChange || (() => {});
    const onSave = opts.onSave || null;
    const hint = opts.hint || 'Draw the L-shape below and choose how the two pieces join.';

    container.innerHTML = '';
    container.className = 'shape-editor';

    const hintEl = document.createElement('p');
    hintEl.className = 'shape-editor-hint';
    hintEl.textContent = hint;

    const gridToolbar = document.createElement('div');
    gridToolbar.className = 'grid-size-toolbar';

    const viewport = document.createElement('div');
    viewport.className = 'editor-viewport-frame';
    Object.assign(viewport.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    });

    const actions = document.createElement('div');
    actions.className = 'shape-editor-actions';
    if (onSave) {
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'shape-editor-save';
      saveBtn.textContent = opts.saveLabel || 'Save shape';
      saveBtn.onclick = () => {
        const { cycles } = getAllCycles(cells, gridW, gridH);
        onSave({ cells: cloneCells(cells), gw: gridW, gh: gridH, cycles: cycles.length });
      };
      actions.appendChild(saveBtn);
    }

    container.append(hintEl, gridToolbar, viewport, actions);

    let editorRef = null;
    let scrollWrap = null;
    let transformBar = null;
    let marqueeEl = null;
    let dimsEl = null;

    function cellSize() {
      const w = container.clientWidth || Math.min(window.innerWidth - 48, 960);
      const innerW = Math.max(120, w - 16);
      const labelPad = 16;
      const byW = (innerW - labelPad * 2) / gridW;
      const overhead = 168;
      const maxGridH = Math.min(window.innerHeight * 0.42, 380);
      const byH = (maxGridH - overhead - labelPad * 2) / gridH;
      return Math.max(10, Math.floor(Math.min(byW, byH)));
    }

    function edgePad() {
      const cs = cellSize();
      return Math.max(14, Math.min(32, Math.round(cs * 0.52)));
    }

    function captureBaseline() {
      baseline = {
        cells: cloneCells(cells),
        gw: gridW,
        gh: gridH,
        wallEdges: [...wallEdges],
      };
    }

    function emitChange() {
      onChange({
        cells: cloneCells(cells),
        gw: gridW,
        gh: gridH,
        wallEdges: [...wallEdges],
      });
    }

    function flipShape(kind) {
      if (kind === 'h') {
        cells = flipCellsH(cells, gridW);
        wallEdges = new Set(transformWallEdges([...wallEdges], cells, gridW, gridH, 'h'));
      } else if (kind === 'v') {
        cells = flipCellsV(cells, gridH);
        wallEdges = new Set(transformWallEdges([...wallEdges], cells, gridW, gridH, 'v'));
      } else return;
      marquee = null;
      renderAll();
      emitChange();
    }

    function resetShapeOrientation() {
      if (!baseline) return;
      cells = cloneCells(baseline.cells);
      gridW = baseline.gw;
      gridH = baseline.gh;
      wallEdges = new Set(baseline.wallEdges);
      marquee = null;
      renderAll();
      emitChange();
    }

    function makeTransformBtn(label, title, handler) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'grid-transform-btn';
      btn.textContent = label;
      btn.title = title;
      Object.assign(btn.style, {
        padding: '6px 10px',
        font: 'inherit',
        fontSize: '11px',
        color: '#cdd7ff',
        background: 'rgba(14, 18, 24, 0.94)',
        border: '1px solid #4a5568',
        borderRadius: '6px',
        cursor: 'pointer',
        letterSpacing: '0.2px',
      });
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        handler();
      });
      return btn;
    }

    function ensureTransformBar() {
      if (opts.showTransform === false || transformBar) return;
      transformBar = document.createElement('div');
      transformBar.className = 'grid-transform-bar';
      transformBar.setAttribute('aria-label', 'Flip shape');
      Object.assign(transformBar.style, {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        justifyContent: 'flex-end',
        padding: '8px 6px 4px',
        flexShrink: '0',
      });
      transformBar.append(
        makeTransformBtn('Flip ↔', 'Flip horizontally (left ↔ right)', () => flipShape('h')),
        makeTransformBtn('Flip ↕', 'Flip vertically (top ↔ bottom)', () => flipShape('v')),
        makeTransformBtn('Reset', 'Restore orientation from when shape was loaded', () => resetShapeOrientation()),
      );
      viewport.appendChild(transformBar);
    }

    function toggleWallEdge(key) {
      if (wallEdges.has(key)) wallEdges.delete(key);
      else wallEdges.add(key);
      renderViewport();
      emitChange();
    }

    function resizeGrid(newW, newH) {
      cells = Array.from({ length: newH }, (_, y) =>
        Array.from({ length: newW }, (_, x) =>
          y < cells.length && x < (cells[0]?.length || 0) ? cells[y][x] : true));
      gridW = newW;
      gridH = newH;
      renderAll();
      emitChange();
    }

    function applyMarquee() {
      if (!marquee) return;
      const { x0, y0, x1, y1, val } = marquee;
      const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
      const ya = Math.min(y0, y1), yb = Math.max(y0, y1);
      cells = cells.map((row, y) =>
        row.map((c, x) => (x >= xa && x <= xb && y >= ya && y <= yb ? val : c)));
      marquee = null;
      renderAll();
      emitChange();
    }

    function getCellFromPointer(e) {
      if (!editorRef) return null;
      const rect = editorRef.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientX == null) return null;
      const cs = cellSize();
      const pad = edgePad();
      const x = Math.floor((clientX - rect.left - pad) / cs);
      const y = Math.floor((clientY - rect.top - pad) / cs);
      if (x >= 0 && x < gridW && y >= 0 && y < gridH) return { x, y };
      return null;
    }

    function updateMarqueeEl() {
      if (!marqueeEl || !marquee) {
        if (marqueeEl) marqueeEl.remove();
        marqueeEl = null;
        return;
      }
      const cs = cellSize();
      const xa = Math.min(marquee.x0, marquee.x1), xb = Math.max(marquee.x0, marquee.x1);
      const ya = Math.min(marquee.y0, marquee.y1), yb = Math.max(marquee.y0, marquee.y1);
      if (!marqueeEl.parentNode) editorRef.querySelector('.editor-grid')?.appendChild(marqueeEl);
      Object.assign(marqueeEl.style, {
        left: `${xa * cs}px`,
        top: `${ya * cs}px`,
        width: `${(xb - xa + 1) * cs}px`,
        height: `${(yb - ya + 1) * cs}px`,
        background: marquee.val ? 'rgba(74,170,120,0.25)' : 'rgba(200,80,80,0.22)',
        border: `1px solid ${marquee.val ? '#4aaa78' : '#c85050'}`,
      });
    }

    function renderGridToolbar() {
      gridToolbar.innerHTML = '';
      gridToolbar.className = 'grid-size-bar';
      if (dimsEl) dimsEl.textContent = `${gridW}×${gridH}`;

      function stepper(label, val, onDec, onInc, onBlur) {
        const wrap = document.createElement('div');
        wrap.className = 'grid-size-stepper-wrap';
        const lbl = document.createElement('span');
        lbl.className = 'grid-size-lbl';
        lbl.textContent = label;
        const st = document.createElement('div');
        st.className = 'stepper';
        const dec = document.createElement('button');
        dec.type = 'button';
        dec.textContent = '−';
        dec.onclick = onDec;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '2';
        inp.max = '100';
        inp.value = String(val);
        inp.onfocus = () => { inp.select(); };
        inp.onblur = () => onBlur(inp);
        inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); };
        const inc = document.createElement('button');
        inc.type = 'button';
        inc.textContent = '+';
        inc.onclick = onInc;
        st.append(dec, inp, inc);
        wrap.append(lbl, st);
        return wrap;
      }

      gridToolbar.append(
        stepper('W', gridW,
          () => { if (gridW > 2) resizeGrid(gridW - 1, gridH); },
          () => { if (gridW < 100) resizeGrid(gridW + 1, gridH); },
          inp => {
            const v = parseInt(inp.value, 10);
            if (!isNaN(v) && v >= 2 && v <= 100) resizeGrid(v, gridH);
            else inp.value = String(gridW);
          }),
        stepper('H', gridH,
          () => { if (gridH > 2) resizeGrid(gridW, gridH - 1); },
          () => { if (gridH < 100) resizeGrid(gridW, gridH + 1); },
          inp => {
            const v = parseInt(inp.value, 10);
            if (!isNaN(v) && v >= 2 && v <= 100) resizeGrid(gridW, v);
            else inp.value = String(gridH);
          }),
      );

      const fillBtn = document.createElement('button');
      fillBtn.type = 'button';
      fillBtn.className = 'grid-size-action';
      fillBtn.textContent = 'Fill';
      fillBtn.onclick = () => {
        cells = Array.from({ length: gridH }, () => Array(gridW).fill(true));
        renderAll();
        emitChange();
      };
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'grid-size-action';
      clearBtn.textContent = 'Clear';
      clearBtn.onclick = () => {
        cells = Array.from({ length: gridH }, () => Array(gridW).fill(false));
        renderAll();
        emitChange();
      };
      const spacer = document.createElement('span');
      spacer.className = 'grid-size-spacer';
      gridToolbar.append(fillBtn, clearBtn);
      gridToolbar.insertBefore(spacer, fillBtn);
    }

    function renderViewport() {
      ensureTransformBar();
      const cs = cellSize();
      const pad = edgePad();
      const runs = computeEdgeRuns(cells, gridW, gridH);
      const badgeFont = Math.max(11, Math.min(17, Math.round(cs * 0.38)));
      const hOff = Math.max(12, Math.round(cs * 0.34));
      const vOff = Math.max(11, Math.round(cs * 0.3));

      if (scrollWrap) scrollWrap.remove();

      scrollWrap = document.createElement('div');
      scrollWrap.className = 'editor-scroll-wrap';

      editorRef = document.createElement('div');
      editorRef.className = 'editor-grid-host';
      Object.assign(editorRef.style, {
        position: 'relative',
        display: 'inline-block',
        padding: `${pad}px`,
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'crosshair',
      });

      const grid = document.createElement('div');
      grid.className = 'editor-grid';
      Object.assign(grid.style, {
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${gridW}, ${cs}px)`,
        border: '2px solid #3a4a55',
        borderRadius: '4px',
        background: '#0a0e14',
        boxShadow: 'inset 0 0 0 1px rgba(120,150,165,0.1)',
        position: 'relative',
        width: `${gridW * cs}px`,
        minWidth: `${gridW * cs}px`,
      });

      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const cell = document.createElement('div');
          Object.assign(cell.style, {
            width: `${cs}px`,
            height: `${cs}px`,
            background: cells[y][x] ? '#2a4a3a' : '#12161c',
            border: '1px solid #252d36',
          });
          grid.appendChild(cell);
        }
      }

      const portalW = 1.5;
      const wallW = 2.5;
      const portalColor = '#e8a020';
      const wallColor = '#f4f1e8';

      for (const r of runs) {
        const isWall = wallEdges.has(edgeRunKey(r));
        const bar = document.createElement('button');
        bar.type = 'button';
        bar.className = `edge-toggle${isWall ? ' edge-toggle--wall' : ' edge-toggle--portal'}`;
        bar.title = isWall ? 'Wall — click for portal' : 'Portal — click for wall';
        bar.setAttribute('aria-pressed', isWall ? 'true' : 'false');
        const key = edgeRunKey(r);

        const line = document.createElement('span');
        line.setAttribute('aria-hidden', 'true');
        Object.assign(line.style, {
          pointerEvents: 'none',
          display: 'block',
          flexShrink: '0',
        });

        Object.assign(bar.style, {
          position: 'absolute', zIndex: '5', padding: '0', margin: '0', border: 'none',
          cursor: 'pointer', background: 'transparent', boxShadow: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        });

        if (r.orient === 'h') {
          Object.assign(bar.style, {
            left: `${r.x0 * cs}px`, top: `${r.y * cs - 6}px`,
            width: `${(r.x1 - r.x0) * cs}px`, height: '12px',
          });
          if (isWall) {
            Object.assign(line.style, {
              width: '100%', height: `${wallW}px`, background: wallColor, borderRadius: '1px',
            });
          } else {
            Object.assign(line.style, {
              width: '100%', height: '0', borderTop: `${portalW}px dashed ${portalColor}`,
            });
          }
        } else {
          Object.assign(bar.style, {
            left: `${r.x * cs - 6}px`, top: `${r.y0 * cs}px`,
            width: '12px', height: `${(r.y1 - r.y0) * cs}px`,
          });
          if (isWall) {
            Object.assign(line.style, {
              width: `${wallW}px`, height: '100%', background: wallColor, borderRadius: '1px',
            });
          } else {
            Object.assign(line.style, {
              width: '0', height: '100%', borderLeft: `${portalW}px dashed ${portalColor}`,
            });
          }
        }

        bar.appendChild(line);
        bar.onpointerdown = e => {
          e.preventDefault();
          e.stopPropagation();
        };
        bar.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          toggleWallEdge(key);
        };
        grid.appendChild(bar);
      }

      for (const r of runs) {
        const lbl = document.createElement('div');
        Object.assign(lbl.style, {
          position: 'absolute', pointerEvents: 'none', zIndex: '3',
          fontSize: `${badgeFont}px`, fontFamily: 'inherit', fontWeight: '700',
          color: '#a8bcc8', lineHeight: '1', letterSpacing: '0.3px',
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
          transform: 'translate(-50%, -50%)',
        });
        if (r.orient === 'h') {
          const cx = (r.x0 + r.x1) / 2 * cs;
          const edgeY = r.y * cs;
          lbl.style.left = `${cx}px`;
          lbl.style.top = `${edgeY + (r.filledAbove ? hOff : -hOff)}px`;
        } else {
          const cy = (r.y0 + r.y1) / 2 * cs;
          const edgeX = r.x * cs;
          lbl.style.left = `${edgeX + (r.filledLeft ? vOff : -vOff)}px`;
          lbl.style.top = `${cy}px`;
        }
        lbl.textContent = String(r.len);
        grid.appendChild(lbl);
      }

      if (marquee) {
        marqueeEl = document.createElement('div');
        Object.assign(marqueeEl.style, {
          position: 'absolute', pointerEvents: 'none', zIndex: '4',
        });
        updateMarqueeEl();
        grid.appendChild(marqueeEl);
      } else {
        marqueeEl = null;
      }

      editorRef.appendChild(grid);
      scrollWrap.appendChild(editorRef);
      if (transformBar && transformBar.parentNode === viewport) {
        viewport.insertBefore(scrollWrap, transformBar);
      } else {
        viewport.appendChild(scrollWrap);
      }

      editorRef.onpointerdown = e => {
        if (e.pointerType === 'touch' && e.isPrimary === false) return;
        e.preventDefault();
        editorRef.setPointerCapture?.(e.pointerId);
        const c = getCellFromPointer(e);
        if (!c) return;
        marquee = { x0: c.x, y0: c.y, x1: c.x, y1: c.y, val: !cells[c.y][c.x] };
        if (!marqueeEl) {
          marqueeEl = document.createElement('div');
          Object.assign(marqueeEl.style, {
            position: 'absolute', pointerEvents: 'none', zIndex: '4',
          });
          grid.appendChild(marqueeEl);
        }
        updateMarqueeEl();
      };
      editorRef.onpointermove = e => {
        if (!marquee) return;
        const rect = editorRef.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (clientX == null) return;
        const cs2 = cellSize();
        const pad2 = edgePad();
        const x = Math.max(0, Math.min(gridW - 1, Math.floor((clientX - rect.left - pad2) / cs2)));
        const y = Math.max(0, Math.min(gridH - 1, Math.floor((clientY - rect.top - pad2) / cs2)));
        if (x === marquee.x1 && y === marquee.y1) return;
        marquee = { ...marquee, x1: x, y1: y };
        updateMarqueeEl();
      };
      editorRef.onpointerup = () => applyMarquee();
      editorRef.onpointercancel = () => applyMarquee();
    }

    function renderAll() {
      if (destroyed) return;
      renderGridToolbar();
      renderViewport();
    }

    renderAll();
    captureBaseline();

    onResize = () => { if (!destroyed) renderViewport(); };
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(onResize);
      resizeObs.observe(container);
    }

    return {
      getState() {
        return {
          cells: cloneCells(cells),
          gw: gridW,
          gh: gridH,
          wallEdges: [...wallEdges],
        };
      },
      setState(state, setOpts) {
        setOpts = setOpts || {};
        if (state.gw != null) gridW = state.gw;
        if (state.gh != null) gridH = state.gh;
        if (state.cells) cells = normalizeCells(state.cells, gridW, gridH);
        if (state.wallEdges !== undefined) {
          wallEdges = new Set(Array.isArray(state.wallEdges) ? state.wallEdges : []);
        }
        marquee = null;
        renderAll();
        if (setOpts.resetBaseline !== false) captureBaseline();
      },
      flipH() { flipShape('h'); },
      flipV() { flipShape('v'); },
      resetOrientation() { resetShapeOrientation(); },
      setWallEdges(keys) {
        wallEdges = new Set(Array.isArray(keys) ? keys : []);
        renderViewport();
      },
      setDimsLabel(el) {
        dimsEl = el;
        if (dimsEl) dimsEl.textContent = `${gridW}×${gridH}`;
      },
      fitGrid() { renderViewport(); },
      destroy() {
        destroyed = true;
        if (onResize) window.removeEventListener('resize', onResize);
        resizeObs?.disconnect();
        container.innerHTML = '';
      },
    };
  }

  global.ShapeEditor = {
    create,
    getAllCycles,
    computeEdgeRuns,
    edgeRunKey,
    flipCellsH,
    flipCellsV,
    transformWallEdgeKey,
    transformWallEdges,
    buildIsWallGap,
    buildWallGapSet,
    legacyTopWallEdgeKeys,
  };
})(typeof window !== 'undefined' ? window : globalThis);
