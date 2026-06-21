/*
 * two-panel-loops.js — the two-panel (mirror) loop model
 * =======================================================
 *
 * A fresh model of the "connected loop" defined in shape-properties.md Part II.
 * It is NOT a patch on the single-panel getAllCycles. The object it traces is the
 * two-panel surface D:
 *
 *   - Panel A (original) and panel B (its mirror twin) — exactly two, never more.
 *   - Every perimeter edge is tagged WALL (reflect, stay on panel) or PORTAL
 *     (pass through to the twin panel). Default tagging: all portals except the
 *     short top edge, which is the one wall.
 *
 * State carried while tracing:  (panel, x, y, dx, dy)
 *   - (x,y,dx,dy) is the billiard geometry in the shape's own coordinates.
 *   - panel ∈ {A,B} is which sheet the string is on.
 *
 * Local rules (shape-properties.md §14):
 *   - WALL gap   → reflect; panel UNCHANGED.
 *   - PORTAL gap → the string passes through to the twin panel. Because the twin
 *     is a mirror copy, re-expressing "straight through into B" in B's own frame
 *     is the SAME reflected ray, so geometrically a portal looks like a reflection
 *     too — the ONLY extra effect is panel TOGGLES A↔B. (This identity is exactly
 *     why two panels suffice and the trace is finite: §16.)
 *   - Convex vertical-side corner → at a convex portal–portal corner where one
 *     flank is a vertical side wall (x = 0 or x = gw) and the other is horizontal,
 *     suppress one toggle so the corner crosses panels exactly once (side-first or
 *     horizontal-first), same rule as the bottom seam corners.
 *
 * A connected loop closes when the string returns to its start gap, start
 * direction AND start panel. Each (panel, gap) instance is used at most once, so
 * the loops partition the 2·G gap-instances and every string returns to itself.
 */

// ---------- geometry (the shape's outline; shared by both panels) ----------

function buildEdges(cells, gw, gh) {
  const hU = [], vU = [];
  for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
    const a = y > 0 ? cells[y - 1][x] : false, b = y < gh ? cells[y][x] : false;
    if (a !== b) hU.push({ y, x });
  }
  for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
    const l = x > 0 ? cells[y][x - 1] : false, r = x < gw ? cells[y][x] : false;
    if (l !== r) vU.push({ x, y });
  }
  const edges = [], hByY = {};
  for (const e of hU) (hByY[e.y] = hByY[e.y] || []).push(e.x);
  for (const y in hByY) {
    const xs = hByY[y].sort((a, b) => a - b); let s = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] === xs[i - 1] + 1) continue;
      edges.push({ y: +y, x0: s, x1: xs[i - 1] + 1, type: 'h' });
      if (i < xs.length) s = xs[i];
    }
  }
  const vByX = {};
  for (const e of vU) (vByX[e.x] = vByX[e.x] || []).push(e.y);
  for (const x in vByX) {
    const ys = vByX[x].sort((a, b) => a - b); let s = ys[0];
    for (let i = 1; i <= ys.length; i++) {
      if (i < ys.length && ys[i] === ys[i - 1] + 1) continue;
      edges.push({ x: +x, y0: s, y1: ys[i - 1] + 1, type: 'v' });
      if (i < ys.length) s = ys[i];
    }
  }
  return edges;
}

function buildGaps(cells, gw, gh) {
  const gaps = [];
  for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
    const a = y > 0 ? cells[y - 1][x] : false, b = y < gh ? cells[y][x] : false;
    if (a !== b) gaps.push({ x: x + 0.5, y, isH: true, interiorBelow: !!b });
  }
  for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
    const l = x > 0 ? cells[y][x - 1] : false, r = x < gw ? cells[y][x] : false;
    if (l !== r) gaps.push({ x, y: y + 0.5, isH: false, interiorRight: !!r });
  }
  return gaps;
}

function getInitialDir(g) {
  if (g.isH) return g.interiorBelow ? { dx: 1, dy: 1 } : { dx: -1, dy: -1 };
  return g.interiorRight ? { dx: 1, dy: -1 } : { dx: -1, dy: 1 };
}

function pointToGapIdx(px, py, gaps) {
  for (let i = 0; i < gaps.length; i++)
    if (Math.abs(px - gaps[i].x) < 0.1 && Math.abs(py - gaps[i].y) < 0.1) return i;
  return -1;
}

// One billiard bounce: travel straight from (x,y) along (dx,dy) to the nearest
// edge, return the arrival point and the REFLECTED outgoing direction.
function nextHit(x, y, dx, dy, edges) {
  const EPS = 1e-9; let minT = Infinity, hH = false, hV = false;
  for (const e of edges) {
    let t;
    if (e.type === 'h') {
      if (Math.abs(dy) < EPS) continue; t = (e.y - y) / dy; if (t < EPS) continue;
      const hx = x + dx * t; if (hx < e.x0 - EPS || hx > e.x1 + EPS) continue;
    } else {
      if (Math.abs(dx) < EPS) continue; t = (e.x - x) / dx; if (t < EPS) continue;
      const hy = y + dy * t; if (hy < e.y0 - EPS || hy > e.y1 + EPS) continue;
    }
    if (t < minT - EPS) { minT = t; hH = e.type === 'h'; hV = e.type === 'v'; }
    else if (Math.abs(t - minT) < EPS * 100) { if (e.type === 'h') hH = true; if (e.type === 'v') hV = true; }
  }
  if (minT === Infinity || minT > 1e6) return null;
  let nx = Math.round((x + dx * minT) * 1e6) / 1e6;
  let ny = Math.round((y + dy * minT) * 1e6) / 1e6;
  let ndx = dx, ndy = dy;
  if (hH && hV) { ndx = -dx; ndy = -dy; } else if (hH) ndy = -dy; else if (hV) ndx = -dx;
  return { x: nx, y: ny, dx: ndx, dy: ndy };
}

// ---------- the two-panel model ----------

const OTHER = { A: 'B', B: 'A' };

/*
 * Concave notch "throat" at a reentrant corner (e.g. the 12×4 sole block): a (1,-1)
 * diagonal that crosses the vertical step edge x = vx at y ∈ (vy, vy+1) passes through
 * the removed nail zone. Toggle panel once when the ray skips the flank gap and lands
 * on a wall gap beyond — only loops whose x+y = tx satisfy tx − vx ∈ (vy, vy+1) qualify.
 *
 * buildConcaveBridges (below) is the older flank-gap straight-through model (Part III).
 */
function buildConcaveNotchThroats(cells, gw, gh) {
  const throats = [];
  const f = (cx, cy) => cx >= 0 && cx < gw && cy >= 0 && cy < gh && !!cells[cy][cx];
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const tl = f(vx - 1, vy - 1), tr = f(vx, vy - 1), bl = f(vx - 1, vy), br = f(vx, vy);
    if (tl + tr + bl + br !== 3) continue;
    if (!tl) throats.push({ vx, vy, yMin: vy, yMax: vy + 1, flankX: vx - 0.5, flankY: vy, inDx: 1, inDy: -1 });
    else if (!tr) throats.push({ vx, vy, yMin: vy, yMax: vy + 1, flankX: vx + 0.5, flankY: vy, inDx: -1, inDy: -1 });
    else if (!bl) throats.push({ vx, vy, yMin: vy, yMax: vy + 1, flankX: vx - 0.5, flankY: vy, inDx: 1, inDy: 1 });
    else throats.push({ vx, vy, yMin: vy, yMax: vy + 1, flankX: vx + 0.5, flankY: vy, inDx: -1, inDy: 1 });
  }
  return throats;
}

function concaveNotchFlankOnRay(fromX, fromY, inDx, inDy, throat) {
  if (inDx !== throat.inDx || inDy !== throat.inDy) return false;
  const tx = Math.abs(inDx) > 1e-9 ? (throat.flankX - fromX) / inDx : Infinity;
  const ty = Math.abs(inDy) > 1e-9 ? (throat.flankY - fromY) / inDy : Infinity;
  const t = Math.min(tx, ty);
  return t > 1e-6 && t < Infinity
    && Math.abs(fromX + inDx * t - throat.flankX) < 0.01
    && Math.abs(fromY + inDy * t - throat.flankY) < 0.01;
}

function shouldConcaveNotchThroatToggle(fromX, fromY, toX, toY, inDx, inDy, gi, gaps, isWallGap, throats) {
  if (gi < 0 || !isWallGap(gaps[gi])) return false;
  const sum = fromX + fromY;
  if (Math.abs(toX + toY - sum) > 0.05) return false;
  for (const t of throats) {
    if (inDx !== t.inDx || inDy !== t.inDy || fromY <= t.yMin) continue;
    const yAtVx = sum - t.vx;
    if (yAtVx <= t.yMin || yAtVx >= t.yMax) continue;
    if (concaveNotchFlankOnRay(fromX, fromY, inDx, inDy, t)) continue;
    return true;
  }
  return false;
}

function wallFirstSeedOrder(gaps, isWallGap) {
  const seeds = [];
  const top = [];
  for (let i = 0; i < gaps.length; i++) if (isWallGap(gaps[i])) top.push(i);
  top.sort((a, b) => gaps[a].x - gaps[b].x);
  for (const g0 of top) seeds.push({ startPanel: 'A', g0 });
  for (const g0 of top) seeds.push({ startPanel: 'B', g0 });
  for (const startPanel of ['A', 'B'])
    for (let g0 = 0; g0 < gaps.length; g0++)
      if (!isWallGap(gaps[g0])) seeds.push({ startPanel, g0 });
  return seeds;
}

function gapIndexSeedOrder(gaps) {
  const seeds = [];
  for (const startPanel of ['A', 'B'])
    for (let g0 = 0; g0 < gaps.length; g0++) seeds.push({ startPanel, g0 });
  return seeds;
}

function buildConcaveBridges(cells, gw, gh, gaps) {
  const set = new Set();
  const f = (cx, cy) => cx >= 0 && cx < gw && cy >= 0 && cy < gh && !!cells[cy][cx];
  const gidx = (x, y) => { for (let i = 0; i < gaps.length; i++) if (Math.abs(gaps[i].x - x) < 0.01 && Math.abs(gaps[i].y - y) < 0.01) return i; return -1; };
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const tl = f(vx - 1, vy - 1), tr = f(vx, vy - 1), bl = f(vx - 1, vy), br = f(vx, vy);
    if (tl + tr + bl + br !== 3) continue;            // a concave (reentrant) corner
    let gA, gB;                                        // the two flanking gaps, across the empty notch
    if (!tl) { gA = [vx - 0.5, vy]; gB = [vx, vy - 0.5]; }
    else if (!tr) { gA = [vx + 0.5, vy]; gB = [vx, vy - 0.5]; }
    else if (!bl) { gA = [vx - 0.5, vy]; gB = [vx, vy + 0.5]; }
    else { gA = [vx + 0.5, vy]; gB = [vx, vy + 0.5]; }
    const iA = gidx(gA[0], gA[1]), iB = gidx(gB[0], gB[1]);
    const dx = Math.sign(gB[0] - gA[0]), dy = Math.sign(gB[1] - gA[1]); // the bridge diagonal
    for (const i of [iA, iB]) { set.add(i + '|' + dx + '|' + dy); set.add(i + '|' + (-dx) + '|' + (-dy)); }
  }
  return set;
}

function dirKey(dx, dy) { return dx + '|' + dy; }
function stateKey(panel, gi, dx, dy) { return panel + '|' + gi + '|' + dx + '|' + dy; }

function findGapIdxByXY(gaps, x, y) {
  for (let i = 0; i < gaps.length; i++) {
    if (Math.abs(gaps[i].x - x) < 0.01 && Math.abs(gaps[i].y - y) < 0.01) return i;
  }
  return -1;
}

function classifyCorner(cells, gw, gh, vx, vy) {
  const f = (cx, cy) => cx >= 0 && cx < gw && cy >= 0 && cy < gh && !!cells[cy][cx];
  const tl = f(vx - 1, vy - 1), tr = f(vx, vy - 1), bl = f(vx - 1, vy), br = f(vx, vy);
  const sum = (tl ? 1 : 0) + (tr ? 1 : 0) + (bl ? 1 : 0) + (br ? 1 : 0);
  if (sum !== 1 && sum !== 3) return null;
  if (sum === 1) {
    if (tl) return { type: 'convex', q: 'tl' };
    if (tr) return { type: 'convex', q: 'tr' };
    if (bl) return { type: 'convex', q: 'bl' };
    return { type: 'convex', q: 'br' };
  }
  if (!tl) return { type: 'concave', q: 'tl' };
  if (!tr) return { type: 'concave', q: 'tr' };
  if (!bl) return { type: 'concave', q: 'bl' };
  return { type: 'concave', q: 'br' };
}

function cornerFlanks(vx, vy, type, q) {
  if (type === 'concave') {
    if (q === 'tl') return [[vx - 0.5, vy], [vx, vy - 0.5]];
    if (q === 'tr') return [[vx + 0.5, vy], [vx, vy - 0.5]];
    if (q === 'bl') return [[vx - 0.5, vy], [vx, vy + 0.5]];
    return [[vx + 0.5, vy], [vx, vy + 0.5]];
  }
  if (q === 'tl') return [[vx - 0.5, vy], [vx, vy - 0.5]];
  if (q === 'tr') return [[vx + 0.5, vy], [vx, vy - 0.5]];
  if (q === 'bl') return [[vx - 0.5, vy], [vx, vy + 0.5]];
  return [[vx + 0.5, vy], [vx, vy + 0.5]];
}

function buildPortalCornerTransitionTable(cells, gw, gh, gaps, isWallGap, options = {}) {
  const modeConcave = options.concaveMode || 'cross';
  const modeConvex = options.convexMode || 'cross';
  const table = new Map();
  const corners = [];
  const addRule = (gi, inDx, inDy, outDx, outDy, meta) => {
    const key = gi + '|' + inDx + '|' + inDy;
    if (table.has(key)) {
      const prev = table.get(key);
      if (prev.outDx !== outDx || prev.outDy !== outDy) {
        throw new Error('conflicting corner transition at ' + key);
      }
      return;
    }
    table.set(key, { outDx, outDy, meta });
  };

  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const cc = classifyCorner(cells, gw, gh, vx, vy);
    if (!cc) continue;
    const [a, b] = cornerFlanks(vx, vy, cc.type, cc.q);
    const iA = findGapIdxByXY(gaps, a[0], a[1]);
    const iB = findGapIdxByXY(gaps, b[0], b[1]);
    if (iA < 0 || iB < 0) continue;
    if (isWallGap(gaps[iA]) || isWallGap(gaps[iB])) continue; // only portal-portal corners

    const mode = cc.type === 'concave' ? modeConcave : modeConvex;
    if (mode !== 'cross') continue;

    // For each flank, only the direction aimed at the corner is overridden.
    const inA = [Math.sign(vx - a[0]), Math.sign(vy - a[1])];
    const inB = [Math.sign(vx - b[0]), Math.sign(vy - b[1])];
    addRule(iA, inA[0], inA[1], inA[0], inA[1], { corner: cc.type, vx, vy });
    addRule(iB, inB[0], inB[1], inB[0], inB[1], { corner: cc.type, vx, vy });
    corners.push({ type: cc.type, vx, vy, iA, iB, mode });
  }
  return { table, corners };
}

function defaultReflectDirAtGap(g, inDx, inDy) {
  if (g.isH) return { dx: inDx, dy: -inDy };
  return { dx: -inDx, dy: inDy };
}

function isSeamGap(g, gh) { return g.isH && g.y === gh; }

function isVerticalSideGap(g, gw) {
  return !g.isH && (Math.abs(g.x) < 0.01 || Math.abs(g.x - gw) < 0.01);
}

// Convex portal–portal corner with a vertical side flank (x=0 or x=gw) + horizontal flank.
function classifyVerticalSideCorner(gaps, iA, iB, gw) {
  for (const [sideGi, otherGi] of [[iA, iB], [iB, iA]]) {
    if (isVerticalSideGap(gaps[sideGi], gw) && gaps[otherGi].isH)
      return { sideGi, otherGi };
  }
  return null;
}

/*
 * At convex portal–portal corners with a vertical side flank (left/right wall) and a
 * horizontal flank (seam or step top), suppress one portal toggle so the corner
 * toggles panel exactly once:
 *   - side-first: suppress at side flank when outgoing hits the horizontal flank
 *   - horizontal-first: suppress at horizontal flank when outgoing hits the side
 * Returns Set of "gi|inDx|inDy" keys.
 */
function buildConvexSeamCornerToggleSuppress(cells, gw, gh, gaps, isWallGap, edges) {
  const suppress = new Set();
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const cc = classifyCorner(cells, gw, gh, vx, vy);
    if (!cc || cc.type !== 'convex') continue;
    const [a, b] = cornerFlanks(vx, vy, cc.type, cc.q);
    const iA = findGapIdxByXY(gaps, a[0], a[1]);
    const iB = findGapIdxByXY(gaps, b[0], b[1]);
    if (iA < 0 || iB < 0) continue;
    if (isWallGap(gaps[iA]) || isWallGap(gaps[iB])) continue;

    const pair = classifyVerticalSideCorner(gaps, iA, iB, gw);
    if (!pair) continue;
    const { sideGi, otherGi } = pair;
    const side = gaps[sideGi], other = gaps[otherGi];

    for (const inDx of [-1, 1]) for (const inDy of [-1, 1]) {
      const sideOut = defaultReflectDirAtGap(side, inDx, inDy);
      const hSide = nextHit(side.x, side.y, sideOut.dx, sideOut.dy, edges);
      if (hSide && Math.abs(hSide.x - other.x) < 0.1 && Math.abs(hSide.y - other.y) < 0.1)
        suppress.add(sideGi + '|' + inDx + '|' + inDy);

      const otherOut = defaultReflectDirAtGap(other, inDx, inDy);
      const hOther = nextHit(other.x, other.y, otherOut.dx, otherOut.dy, edges);
      if (hOther && Math.abs(hOther.x - side.x) < 0.1 && Math.abs(hOther.y - side.y) < 0.1)
        suppress.add(otherGi + '|' + inDx + '|' + inDy);
    }
  }
  return suppress;
}

function shouldPortalToggle(gi, inDx, inDy, gaps, isWallGap, suppress) {
  if (isWallGap(gaps[gi])) return false;
  if (suppress.has(gi + '|' + inDx + '|' + inDy)) return false;
  return true;
}

function buildPortalCornerChoiceSpace(cells, gw, gh, gaps, isWallGap) {
  const choices = [];
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const cc = classifyCorner(cells, gw, gh, vx, vy);
    if (!cc) continue;
    const [a, b] = cornerFlanks(vx, vy, cc.type, cc.q);
    const iA = findGapIdxByXY(gaps, a[0], a[1]);
    const iB = findGapIdxByXY(gaps, b[0], b[1]);
    if (iA < 0 || iB < 0) continue;
    if (isWallGap(gaps[iA]) || isWallGap(gaps[iB])) continue; // portal-portal only

    for (const [gi, pt] of [[iA, a], [iB, b]]) {
      const inDx = Math.sign(vx - pt[0]);
      const inDy = Math.sign(vy - pt[1]);
      const refl = defaultReflectDirAtGap(gaps[gi], inDx, inDy);
      choices.push({
        cornerType: cc.type, vx, vy, gi, inDx, inDy,
        reflect: { dx: refl.dx, dy: refl.dy },
        straight: { dx: inDx, dy: inDy }
      });
    }
  }
  return choices;
}

function buildPortalCornerBidirectionalChoiceSpace(cells, gw, gh, gaps, isWallGap) {
  const choices = [];
  for (let vy = 0; vy <= gh; vy++) for (let vx = 0; vx <= gw; vx++) {
    const cc = classifyCorner(cells, gw, gh, vx, vy);
    if (!cc) continue;
    const [a, b] = cornerFlanks(vx, vy, cc.type, cc.q);
    const iA = findGapIdxByXY(gaps, a[0], a[1]);
    const iB = findGapIdxByXY(gaps, b[0], b[1]);
    if (iA < 0 || iB < 0) continue;
    if (isWallGap(gaps[iA]) || isWallGap(gaps[iB])) continue; // portal-portal only

    for (const [gi, pt] of [[iA, a], [iB, b]]) {
      const toward = [Math.sign(vx - pt[0]), Math.sign(vy - pt[1])];
      const dirs = [toward, [-toward[0], -toward[1]]];
      for (const [inDx, inDy] of dirs) {
        const refl = defaultReflectDirAtGap(gaps[gi], inDx, inDy);
        choices.push({
          cornerType: cc.type, vx, vy, gi, inDx, inDy,
          reflect: { dx: refl.dx, dy: refl.dy },
          straight: { dx: inDx, dy: inDy }
        });
      }
    }
  }
  return choices;
}

/*
 * connectedLoops(cells, gw, gh, isWallGap)
 *   isWallGap(gap) -> true if the gap lies on a WALL edge (reflect, no toggle);
 *                     false means PORTAL (pass through, toggle panel).
 * Returns { loops, gaps, count } where each loop is the ordered list of
 * { panel, gapIdx, x, y } events the string passes through.
 */
function connectedLoops(cells, gw, gh, isWallGap) {
  const edges = buildEdges(cells, gw, gh);
  const gaps = buildGaps(cells, gw, gh);
  const bridges = buildConcaveBridges(cells, gw, gh, gaps); // concave inflections
  const toggleSuppress = buildConvexSeamCornerToggleSuppress(cells, gw, gh, gaps, isWallGap, edges);
  const visited = new Set();                       // "panel:gapIdx" used once
  const key = (panel, gi) => panel + ':' + gi;
  const loops = [];

  for (const startPanel of ['A', 'B']) {
    for (let g0 = 0; g0 < gaps.length; g0++) {
      if (visited.has(key(startPanel, g0))) continue;

      const start = gaps[g0];
      const launch = getInitialDir(start);
      let panel = startPanel, x = start.x, y = start.y, dx = launch.dx, dy = launch.dy;
      const path = [{ panel, gapIdx: g0, x, y }];
      visited.add(key(panel, g0));

      const maxIter = (edges.length + gaps.length) * 8 + 5000;
      let it = 0;
      for (; it < maxIter; it++) {
        const idx0 = dx, idy0 = dy;                  // incoming direction
        const h = nextHit(x, y, idx0, idy0, edges);
        if (!h) break;                              // string escaped (shouldn't happen)
        x = h.x; y = h.y;
        const gi = pointToGapIdx(x, y, gaps);
        // concave corner: pass straight through the notch (§14 row 5); else reflect
        if (gi >= 0 && bridges.has(gi + '|' + idx0 + '|' + idy0)) { dx = idx0; dy = idy0; }
        else { dx = h.dx; dy = h.dy; }
        if (gi < 0) continue;                        // exact corner vertex (no gap) — pass on

        if (shouldPortalToggle(gi, idx0, idy0, gaps, isWallGap, toggleSuppress))
          panel = OTHER[panel]; // §14 #3: portal toggles the panel (except seam-corner side flank)

        // closed iff back to the start STATE: gap + direction + panel
        if (gi === g0 && dx === launch.dx && dy === launch.dy && panel === startPanel) break;

        if (visited.has(key(panel, gi))) break;      // safety: should only re-hit at closure
        visited.add(key(panel, gi));
        path.push({ panel, gapIdx: gi, x, y });
      }
      loops.push(path);
    }
  }
  return { loops, gaps, edges, count: loops.length };
}

function connectedLoopsWithCornerTable(cells, gw, gh, isWallGap, options = {}) {
  const edges = buildEdges(cells, gw, gh);
  const gaps = buildGaps(cells, gw, gh);
  const toggleSuppress = buildConvexSeamCornerToggleSuppress(cells, gw, gh, gaps, isWallGap, edges);
  const notchThroats = buildConcaveNotchThroats(cells, gw, gh);
  const providedTable = options.transitionTable || null;
  const built = providedTable ? { table: providedTable, corners: [] }
    : buildPortalCornerTransitionTable(cells, gw, gh, gaps, isWallGap, options);
  const { table, corners } = built;
  const visited = new Set();
  const key = (panel, gi) => panel + ':' + gi;
  const loops = [];

  const transitions = new Map();       // hit-state -> next hit-state
  const predCount = new Map();         // next hit-state -> indegree
  const escapes = [];

  const bootstrap = options.bootstrap || 'wallFirst';
  const seeds = bootstrap === 'wallFirst' ? wallFirstSeedOrder(gaps, isWallGap) : gapIndexSeedOrder(gaps);

  for (const { startPanel, g0 } of seeds) {
    if (visited.has(key(startPanel, g0))) continue;

    const start = gaps[g0];
    const launch = getInitialDir(start);
    let panel = startPanel, x = start.x, y = start.y, dx = launch.dx, dy = launch.dy;
    let prevHitState = null;
    const path = [{ panel, gapIdx: g0, x, y }];
    visited.add(key(panel, g0));

    const maxIter = (edges.length + gaps.length) * 8 + 5000;
    let it = 0;
    for (; it < maxIter; it++) {
      const inDx = dx, inDy = dy, fromX = x, fromY = y;
      const h = nextHit(x, y, inDx, inDy, edges);
      if (!h) {
        escapes.push({ panel, x, y, dx: inDx, dy: inDy });
        break;
      }
      x = h.x; y = h.y;
      const gi = pointToGapIdx(x, y, gaps);
      if (gi < 0) { dx = h.dx; dy = h.dy; continue; } // vertex-only event

      const hitState = stateKey(panel, gi, inDx, inDy);
      if (prevHitState) {
        if (!transitions.has(prevHitState)) transitions.set(prevHitState, hitState);
        if (transitions.get(prevHitState) !== hitState) {
          throw new Error('non-deterministic transition from ' + prevHitState);
        }
        predCount.set(hitState, (predCount.get(hitState) || 0) + 1);
      }
      prevHitState = hitState;

      const r = table.get(gi + '|' + inDx + '|' + inDy);
      if (r) { dx = r.outDx; dy = r.outDy; } else { dx = h.dx; dy = h.dy; }
      if (shouldPortalToggle(gi, inDx, inDy, gaps, isWallGap, toggleSuppress))
        panel = OTHER[panel];
      if (shouldConcaveNotchThroatToggle(fromX, fromY, x, y, inDx, inDy, gi, gaps, isWallGap, notchThroats))
        panel = OTHER[panel];

      if (gi === g0 && dx === launch.dx && dy === launch.dy && panel === startPanel) break;

      if (visited.has(key(panel, gi))) break;
      visited.add(key(panel, gi));
      path.push({ panel, gapIdx: gi, x, y });
    }
    loops.push(path);
  }

  const merges = [];
  for (const [s, n] of predCount.entries()) if (n > 1) merges.push({ state: s, indegree: n });
  return {
    loops, gaps, edges, count: loops.length, table, corners,
    diagnostics: { transitions, predCount, merges, escapes }
  };
}

function canonicalPattern(seq) {
  const first = new Map();
  let next = 1;
  return seq.map(v => {
    if (!first.has(v)) first.set(v, next++);
    return first.get(v);
  });
}

function topWallSequenceByLoop(res) {
  const bySlot = new Map(); // slot key -> loop id
  for (let li = 0; li < res.loops.length; li++) {
    for (const ev of res.loops[li]) {
      const g = res.gaps[ev.gapIdx];
      if (!(g.isH && g.y === 0)) continue;
      const slot = ev.panel + '|' + g.x.toFixed(1);
      bySlot.set(slot, li + 1);
    }
  }
  const xs = [];
  for (const g of res.gaps) if (g.isH && g.y === 0) xs.push(g.x);
  const uniqXs = [...new Set(xs)].sort((a, b) => a - b);
  const order = [
    ...uniqXs.map(x => 'A|' + x.toFixed(1)),
    ...uniqXs.slice().reverse().map(x => 'B|' + x.toFixed(1))
  ];
  return order.map(k => bySlot.get(k)).filter(v => v != null);
}

function validateColorPattern(res, targetPattern) {
  const actual = topWallSequenceByLoop(res);
  const a = canonicalPattern(actual);
  const t = canonicalPattern(targetPattern);
  const sameLength = a.length === t.length;
  const exact = sameLength && a.every((v, i) => v === t[i]);
  return {
    actualRaw: actual,
    actualCanonical: a,
    targetCanonical: t,
    exactMatch: exact
  };
}

function buildTransitionTableFromMask(choiceSpace, mask) {
  const table = new Map();
  for (let i = 0; i < choiceSpace.length; i++) {
    const c = choiceSpace[i];
    const useStraight = !!(mask & (1 << i));
    const out = useStraight ? c.straight : c.reflect;
    table.set(c.gi + '|' + c.inDx + '|' + c.inDy, {
      outDx: out.dx, outDy: out.dy,
      meta: { cornerType: c.cornerType, vx: c.vx, vy: c.vy, mode: useStraight ? 'straight' : 'reflect' }
    });
  }
  return table;
}

function searchPortalCornerRuleSets(cells, gw, gh, isWallGap, targetPattern, options = {}) {
  const gaps = buildGaps(cells, gw, gh);
  const choiceSpace = buildPortalCornerChoiceSpace(cells, gw, gh, gaps, isWallGap);
  if (choiceSpace.length > 30) throw new Error('choice space too large: ' + choiceSpace.length);
  const maxMask = 1 << choiceSpace.length;
  const targetLstar = options.targetLstar == null ? 12 : options.targetLstar;
  const requirePattern = options.requirePattern !== false;
  const results = [];
  let clean = 0;

  for (let mask = 0; mask < maxMask; mask++) {
    const table = buildTransitionTableFromMask(choiceSpace, mask);
    const res = connectedLoopsWithCornerTable(cells, gw, gh, isWallGap, { transitionTable: table });
    const okClean = res.diagnostics.merges.length === 0 && res.diagnostics.escapes.length === 0;
    if (!okClean) continue;
    clean++;
    if (res.count !== targetLstar) continue;
    const check = validateColorPattern(res, targetPattern);
    if (requirePattern && !check.exactMatch) continue;
    results.push({ mask, count: res.count, check, res });
  }
  return { choiceSpace, totalTried: maxMask, cleanTried: clean, results };
}

function searchBidirectionalPortalCornerRuleSets(cells, gw, gh, isWallGap, targetPattern, options = {}) {
  const gaps = buildGaps(cells, gw, gh);
  const choiceSpace = buildPortalCornerBidirectionalChoiceSpace(cells, gw, gh, gaps, isWallGap);
  if (choiceSpace.length > 22) throw new Error('bidirectional choice space too large: ' + choiceSpace.length);
  const maxMask = 1 << choiceSpace.length;
  const targetLstar = options.targetLstar == null ? 12 : options.targetLstar;
  const requirePattern = options.requirePattern !== false;
  const results = [];
  let clean = 0;

  for (let mask = 0; mask < maxMask; mask++) {
    const table = buildTransitionTableFromMask(choiceSpace, mask);
    const res = connectedLoopsWithCornerTable(cells, gw, gh, isWallGap, { transitionTable: table });
    const okClean = res.diagnostics.merges.length === 0 && res.diagnostics.escapes.length === 0;
    if (!okClean) continue;
    clean++;
    if (res.count !== targetLstar) continue;
    const check = validateColorPattern(res, targetPattern);
    if (requirePattern && !check.exactMatch) continue;
    results.push({ mask, count: res.count, check, res });
  }
  return { choiceSpace, totalTried: maxMask, cleanTried: clean, results };
}

function uniqueTowardCornerStates(cells, gw, gh, gaps, isWallGap) {
  const base = buildPortalCornerChoiceSpace(cells, gw, gh, gaps, isWallGap);
  const seen = new Set();
  const states = [];
  for (const c of base) {
    const k = c.gi + '|' + c.inDx + '|' + c.inDy;
    if (seen.has(k)) continue;
    seen.add(k);
    states.push({ gi: c.gi, inDx: c.inDx, inDy: c.inDy, key: k, cornerType: c.cornerType, vx: c.vx, vy: c.vy });
  }
  return states;
}

function connectedLoopsWithPortalRewire(cells, gw, gh, isWallGap, rewireMap) {
  const edges = buildEdges(cells, gw, gh);
  const gaps = buildGaps(cells, gw, gh);
  const toggleSuppress = buildConvexSeamCornerToggleSuppress(cells, gw, gh, gaps, isWallGap, edges);
  const visited = new Set();
  const key = (panel, gi) => panel + ':' + gi;
  const loops = [];
  const escapes = [];
  const transitions = new Map();
  const predCount = new Map();
  let teleports = 0;

  for (const startPanel of ['A', 'B']) {
    for (let g0 = 0; g0 < gaps.length; g0++) {
      if (visited.has(key(startPanel, g0))) continue;
      const start = gaps[g0];
      const launch = getInitialDir(start);
      let panel = startPanel, x = start.x, y = start.y, dx = launch.dx, dy = launch.dy;
      let prevHitState = null;
      const path = [{ panel, gapIdx: g0, x, y }];
      visited.add(key(panel, g0));

      const maxIter = (edges.length + gaps.length) * 12 + 8000;
      for (let it = 0; it < maxIter; it++) {
        const inDxRaw = dx, inDyRaw = dy;
        const h = nextHit(x, y, inDxRaw, inDyRaw, edges);
        if (!h) { escapes.push({ panel, x, y, dx: inDxRaw, dy: inDyRaw }); break; }
        x = h.x; y = h.y;
        let gi = pointToGapIdx(x, y, gaps);
        if (gi < 0) { dx = h.dx; dy = h.dy; continue; }

        let inDx = inDxRaw, inDy = inDyRaw;
        const rk = gi + '|' + inDx + '|' + inDy;
        if (rewireMap.has(rk)) {
          const t = rewireMap.get(rk);
          gi = t.gi;
          inDx = t.inDx;
          inDy = t.inDy;
          x = gaps[gi].x;
          y = gaps[gi].y;
          teleports++;
        }

        const hitState = stateKey(panel, gi, inDx, inDy);
        if (prevHitState) {
          if (!transitions.has(prevHitState)) transitions.set(prevHitState, hitState);
          if (transitions.get(prevHitState) !== hitState) {
            throw new Error('non-deterministic rewire transition from ' + prevHitState);
          }
          predCount.set(hitState, (predCount.get(hitState) || 0) + 1);
        }
        prevHitState = hitState;

        const out = defaultReflectDirAtGap(gaps[gi], inDx, inDy);
        dx = out.dx; dy = out.dy;
        if (shouldPortalToggle(gi, inDx, inDy, gaps, isWallGap, toggleSuppress))
          panel = OTHER[panel];

        if (gi === g0 && dx === launch.dx && dy === launch.dy && panel === startPanel) break;
        if (visited.has(key(panel, gi))) break;
        visited.add(key(panel, gi));
        path.push({ panel, gapIdx: gi, x, y });
      }
      loops.push(path);
    }
  }

  const merges = [];
  for (const [s, n] of predCount.entries()) if (n > 1) merges.push({ state: s, indegree: n });
  return { loops, gaps, edges, count: loops.length, diagnostics: { merges, escapes, teleports, transitions, predCount } };
}

function nextPermutation(a) {
  let i = a.length - 2;
  while (i >= 0 && a[i] >= a[i + 1]) i--;
  if (i < 0) return false;
  let j = a.length - 1;
  while (a[j] <= a[i]) j--;
  [a[i], a[j]] = [a[j], a[i]];
  let l = i + 1, r = a.length - 1;
  while (l < r) { [a[l], a[r]] = [a[r], a[l]]; l++; r--; }
  return true;
}

function searchPortalStatePermutations(cells, gw, gh, isWallGap, targetPattern, options = {}) {
  const gaps = buildGaps(cells, gw, gh);
  const states = uniqueTowardCornerStates(cells, gw, gh, gaps, isWallGap);
  const n = states.length;
  if (n > 9) throw new Error('state-permutation search too large: ' + n);
  const perm = Array.from({ length: n }, (_, i) => i);
  const targetLstar = options.targetLstar == null ? 12 : options.targetLstar;
  const requirePattern = options.requirePattern !== false;
  let tried = 0;
  let clean = 0;
  const matches = [];

  do {
    tried++;
    const rewire = new Map();
    for (let i = 0; i < n; i++) {
      const s = states[i], t = states[perm[i]];
      rewire.set(s.key, { gi: t.gi, inDx: t.inDx, inDy: t.inDy });
    }
    const res = connectedLoopsWithPortalRewire(cells, gw, gh, isWallGap, rewire);
    const okClean = res.diagnostics.merges.length === 0 && res.diagnostics.escapes.length === 0;
    if (!okClean) continue;
    clean++;
    if (res.count !== targetLstar) continue;
    const check = validateColorPattern(res, targetPattern);
    if (requirePattern && !check.exactMatch) continue;
    matches.push({ permutation: perm.slice(), count: res.count, check, teleports: res.diagnostics.teleports });
  } while (nextPermutation(perm));

  return { states, totalTried: tried, cleanTried: clean, results: matches };
}

// ---------- single-panel billiard (independent cross-check only) ----------

function originalLoops(cells, gw, gh) {
  const edges = buildEdges(cells, gw, gh), gaps = buildGaps(cells, gw, gh);
  const visited = new Set(), loops = [];
  for (let g0 = 0; g0 < gaps.length; g0++) {
    if (visited.has(g0)) continue;
    const start = gaps[g0]; const launch = getInitialDir(start);
    let x = start.x, y = start.y, dx = launch.dx, dy = launch.dy;
    const seq = [g0]; visited.add(g0);
    const maxIter = edges.length * 200 + 2000;
    for (let it = 0; it < maxIter; it++) {
      const h = nextHit(x, y, dx, dy, edges); if (!h) break;
      x = h.x; y = h.y; dx = h.dx; dy = h.dy;
      const gi = pointToGapIdx(x, y, gaps); if (gi < 0) continue;
      if (gi === g0 && dx === launch.dx && dy === launch.dy) break;
      if (!visited.has(gi)) { visited.add(gi); seq.push(gi); }
    }
    loops.push(seq);
  }
  return { loops, gaps };
}

// Predicted L* from the 2-to-1 mirror cover (shape-properties.md §16):
//   each original loop with an EVEN portal-count -> 2 connected loops,
//   with an ODD portal-count -> 1. So L* = 2E + O.
function parityPrediction(cells, gw, gh, isWallGap) {
  const { loops, gaps } = originalLoops(cells, gw, gh);
  let E = 0, O = 0; const breakdown = [];
  for (const seq of loops) {
    const portals = seq.filter(gi => !isWallGap(gaps[gi])).length;
    const walls = seq.length - portals;
    if (portals % 2 === 0) E++; else O++;
    breakdown.push({ size: seq.length, portals, walls, parity: portals % 2 ? 'odd' : 'even' });
  }
  return { E, O, Lstar: 2 * E + O, originalCount: loops.length, breakdown };
}

// ---------- shape + demo ----------

function shoeCells() {
  const gw = 19, gh = 11, cells = [];
  for (let y = 0; y < gh; y++) {
    const row = [];
    for (let x = 0; x < gw; x++) row.push(y < 3 ? x >= 11 : true);
    cells.push(row);
  }
  return { cells, gw, gh };
}

// Default wall tagging for the shoe: the short top edge (the horizontal boundary at y = 0).
const shoeTopWall = (g) => g.isH && g.y === 0;

if (typeof module !== 'undefined' && require.main === module) {
  const { cells, gw, gh } = shoeCells();

  const orig = originalLoops(cells, gw, gh);
  console.log('Single panel (Part I):  loops =', orig.loops.length,
    ' sizes =', orig.loops.map(l => l.length).join(','),
    ' Σ =', orig.loops.reduce((s, l) => s + l.length, 0));

  const pred = parityPrediction(cells, gw, gh, shoeTopWall);
  console.log('\nMirror-cover prediction (§16):  E =', pred.E, ' O =', pred.O,
    ' => L* = 2E+O =', pred.Lstar);
  console.table(pred.breakdown);

  const res = connectedLoops(cells, gw, gh, shoeTopWall);
  const sizes = res.loops.map(l => l.length);
  console.log('Direct two-panel trace: L* =', res.count,
    ' sizes =', sizes.join(','),
    ' Σ =', sizes.reduce((s, n) => s + n, 0), '(should be 2·G = 120)');

  console.log('\nMatch:', res.count === pred.Lstar ? 'YES — formula and trace agree ✓' : 'NO — mismatch ✗');

  const target = [2, 3, 4, 5, 7, 9, 10, 12, 11, 10, 8, 6, 5, 4, 3, 1];
  const model = connectedLoopsWithCornerTable(cells, gw, gh, shoeTopWall, {
    concaveMode: 'cross',
    convexMode: 'cross'
  });
  const sizes2 = model.loops.map(l => l.length);
  console.log('\nCorner-table model (concave+convex cross): L* =', model.count,
    ' sizes =', sizes2.join(','),
    ' Σ =', sizes2.reduce((s, n) => s + n, 0));
  console.log('Corner rules:', model.table.size, 'across', model.corners.length, 'portal corners');
  console.log('Diagnostics: merges =', model.diagnostics.merges.length,
    ' escapes =', model.diagnostics.escapes.length);

  const check = validateColorPattern(model, target);
  console.log('Top-wall canonical pattern (actual):', check.actualCanonical.join(','));
  console.log('Top-wall canonical pattern (target):', check.targetCanonical.join(','));
  console.log('Pattern match:', check.exactMatch ? 'YES ✓' : 'NO ✗');

  const search = searchPortalCornerRuleSets(cells, gw, gh, shoeTopWall, target, {
    targetLstar: 12,
    requirePattern: true
  });
  console.log('\nPortal-corner rule search: choices =', search.choiceSpace.length,
    ' tried =', search.totalTried, ' clean =', search.cleanTried);
  console.log('Matches for L*=12 + target pattern:', search.results.length);

  const search2 = searchBidirectionalPortalCornerRuleSets(cells, gw, gh, shoeTopWall, target, {
    targetLstar: 12,
    requirePattern: true
  });
  console.log('\nBidirectional corner-state search: choices =', search2.choiceSpace.length,
    ' tried =', search2.totalTried, ' clean =', search2.cleanTried);
  console.log('Matches for L*=12 + target pattern:', search2.results.length);

  const search3 = searchPortalStatePermutations(cells, gw, gh, shoeTopWall, target, {
    targetLstar: 12,
    requirePattern: true
  });
  console.log('\nGlobal portal-state permutation search: states =', search3.states.length,
    ' tried =', search3.totalTried, ' clean =', search3.cleanTried);
  console.log('Matches for L*=12 + target pattern:', search3.results.length);
}

const twoPanelExports = {
  buildEdges, buildGaps, getInitialDir, connectedLoops, connectedLoopsWithCornerTable,
  originalLoops, parityPrediction, shoeCells, shoeTopWall, buildPortalCornerTransitionTable,
  topWallSequenceByLoop, validateColorPattern, canonicalPattern,
  buildPortalCornerChoiceSpace, searchPortalCornerRuleSets,
  buildPortalCornerBidirectionalChoiceSpace, searchBidirectionalPortalCornerRuleSets,
  uniqueTowardCornerStates, connectedLoopsWithPortalRewire, searchPortalStatePermutations,
  isSeamGap, buildConvexSeamCornerToggleSuppress, shouldPortalToggle,
  buildConcaveNotchThroats, shouldConcaveNotchThroatToggle, wallFirstSeedOrder, gapIndexSeedOrder
};

if (typeof module !== 'undefined') {
  module.exports = twoPanelExports;
}
if (typeof window !== 'undefined') {
  window.TwoPanelLoops = twoPanelExports;
}
