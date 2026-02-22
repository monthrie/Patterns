# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**String Billiards — Woven** is a single-file HTML5 canvas visualization that simulates 45-degree angle billiard trajectories on a grid with a weaving (over/under) pattern. Users place up to three colored strings on a nail grid and watch them bounce and weave.

## Running

No build system, dependencies, or package manager. Open `index.html` directly in a browser.

## Architecture

Everything lives in `index.html` (~650 lines): HTML structure, CSS styling, and JavaScript logic.

### JavaScript Organization (lines ~172-649)

**Core concepts:**
- Three independent strings (A=orange, B=cyan, C=yellow) travel diagonally at 45° angles, bouncing off grid borders
- Interior grid intersections follow a checkerboard loom rule (`(ix + iy) % 2`) determining which diagonal direction is "on top"
- A string only shows a gap (goes "under") when another string actually crosses at that point in the opposite direction

**Key functions by concern:**

- *Geometry/Calculation:* `computePath(s)`, `isSlashOnTop(ix,iy)`, `segDirection()`, `getInteriorPoints()`, `launchDir()`, `buildCoverageMap()`
- *Rendering:* `drawGrid()`, `drawAllWoven()` (three-pass: plain segments → segments with gaps → over-crossing redraws), `drawSegWithGaps()`, `drawLoomPattern()`, `fullRedraw()`
- *Animation:* `startAnim()`, `stopAnim()` — requestAnimationFrame-based with speed control
- *Interaction:* `setClickMode(m)`, canvas click/mousemove handlers, control change listeners

**Rendering pipeline:** `drawAllWoven()` uses a three-pass system to layer crossings correctly — first plain segments (no crossings), then segments with gap cutouts for under-crossings, then over-crossing portions redrawn on top.

### Coordinate conventions

- `gx`/`gy` — grid coordinates
- `px`/`py` — pixel coordinates
- `ix`/`iy` — interior intersection indices
- `x1`/`y1`, `x2`/`y2` — segment start/end points

### Constants (line ~173)

- `NAIL_R = 4` — nail radius
- `PAD = 40` — canvas padding
- `MAX_C = 700` — max canvas size
- `GAP_PX = 9` — gap width for weave under-crossings
