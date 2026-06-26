#!/usr/bin/env node
/*
 * polyomino-loops.js
 *
 * Engine: how many connected loops does a polyomino have when glued to its
 * mirror image along a chosen subset of its perimeter edges (portals)?
 *
 * A "mirrored polyomino" is the two-panel surface: two copies of the shape,
 * with every perimeter edge labelled either WALL (string reflects, panel stays)
 * or PORTAL (string reflects, panel toggles A<->B). The loops are exactly the
 * connected loops of two-panel-loops.js.
 *
 * API
 * ---
 *   rectangleCells(w, h)
 *     -> { cells, gw, gh }  — a solid w×h rectangle
 *
 *   polyominoCells(rows)
 *     -> { cells, gw, gh }  — from a 2-D array of 0/1
 *
 *   loopCount(cells, gw, gh, isWallGap)
 *     -> { count, loopSizes, totalGapInstances, parityPrediction }
 *
 * Convenience wall-gap predicates
 *   wallTop(g)     — horizontal edge at y = 0
 *   wallBottom(gh) — horizontal edge at y = gh
 *   wallLeft(g)    — vertical edge at x = 0
 *   wallRight(gw)  — vertical edge at x = gw
 *   wallEdges(opts, gw, gh) — combine top/bottom/left/right flags
 *   allPortals()   — no walls (every edge is a portal)
 *   allWalls()     — every edge is a wall (standard single billiard)
 */

'use strict';

const {
  connectedLoops,
  parityPrediction: _parityPrediction,
  buildGaps
} = require('./two-panel-loops.js');

// ---------- shape builders ----------

function rectangleCells(w, h) {
  const cells = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(true);
    cells.push(row);
  }
  return { cells, gw: w, gh: h };
}

function polyominoCells(rows) {
  const gh = rows.length;
  const gw = Math.max(...rows.map(r => r.length));
  const cells = rows.map(r => {
    const row = [];
    for (let x = 0; x < gw; x++) row.push(!!r[x]);
    return row;
  });
  return { cells, gw, gh };
}

// ---------- wall-gap predicates ----------

const wallTop    = (g)      => g.isH  && g.y === 0;
const wallBottom = (gh) => (g) => g.isH  && g.y === gh;
const wallLeft   = (g)      => !g.isH && g.x === 0;
const wallRight  = (gw) => (g) => !g.isH && g.x === gw;
const allPortals = ()   => () => false;
const allWalls   = ()   => () => true;

// wallEdges({ top, bottom, left, right }, gw, gh)
function wallEdges({ top = false, bottom = false, left = false, right = false }, gw, gh) {
  return (g) =>
    (top    && wallTop(g))       ||
    (bottom && wallBottom(gh)(g)) ||
    (left   && wallLeft(g))      ||
    (right  && wallRight(gw)(g));
}

// ---------- main engine wrapper ----------

function loopCount(cells, gw, gh, isWallGap) {
  const res = connectedLoops(cells, gw, gh, isWallGap);
  const pred = _parityPrediction(cells, gw, gh, isWallGap);
  const gaps = buildGaps(cells, gw, gh);
  return {
    count: res.count,
    loopSizes: res.loops.map(l => l.length),
    totalGapInstances: gaps.length * 2,
    parityPrediction: pred
  };
}

// ---------- demo / CLI ----------

if (require.main === module) {
  const W = 6, H = 3;
  const { cells, gw, gh } = rectangleCells(W, H);

  console.log(`\n=== ${W}×${H} rectangle — mirrored along each choice of 3 edges ===`);
  console.log('(the 1 remaining wall edge is shown in the label)\n');

  const sides = ['top', 'bottom', 'left', 'right'];
  for (const wallSide of sides) {
    const opts = { top: true, bottom: true, left: true, right: true };
    opts[wallSide] = false;   // this side is the wall; the other 3 are portals
    const isWall = wallEdges(opts, gw, gh);

    // flip: portals are the 3 non-wallSide edges; wall is wallSide
    // Actually we want wallSide to be the WALL and the rest to be portals.
    // wallEdges with wallSide=false means wallSide is NOT a wall, i.e. portal.
    // We want the OPPOSITE: wallSide=wall, others=portal.
    const isWallFixed = wallEdges(
      { top: wallSide === 'top', bottom: wallSide === 'bottom',
        left: wallSide === 'left', right: wallSide === 'right' },
      gw, gh
    );

    const r = loopCount(cells, gw, gh, isWallFixed);
    console.log(`Wall = ${wallSide.padEnd(6)}  →  ${r.count} loop(s)   sizes: [${r.loopSizes.join(', ')}]`);
  }

  console.log('\n--- All portals (torus-like, no wall) ---');
  const rAll = loopCount(cells, gw, gh, allPortals());
  console.log(`All portals  →  ${rAll.count} loop(s)   sizes: [${rAll.loopSizes.join(', ')}]`);

  console.log('\n--- All walls (standard single-panel billiard) ---');
  const rWall = loopCount(cells, gw, gh, allWalls());
  console.log(`All walls    →  ${rWall.count} loop(s)   sizes: [${rWall.loopSizes.join(', ')}]`);
}

module.exports = {
  rectangleCells, polyominoCells,
  loopCount,
  wallTop, wallBottom, wallLeft, wallRight,
  wallEdges, allPortals, allWalls
};
