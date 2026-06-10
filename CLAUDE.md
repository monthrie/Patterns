# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Knot Maker — Mobile** (`index.html`) is a single-file web app that simulates a real craft: 45° billiard-path string weaving on nail boards. The user draws an arbitrary shape on a cell grid; the app traces diagonal paths that bounce off the boundary; **each closed path ("cycle") is one physical cotton string** the craftsman weaves on a real board, with crossings interlaced over/under in checkerboard parity. The app counts cycles, colors them (real Barbante Beatriz yarn palette — see `barbante-beatriz-colors.md`), measures string lengths, and renders the finished weave.

The primary user is João, an elderly Portuguese craftsman, on an Android tablet. He builds real textiles from these designs (see `docs/joao-woven-cushion.jpeg`). The app must remain **fully self-contained and offline-capable** — React is inlined, no CDN dependencies.

## Build & Run

The app is generated — **never hand-edit `index.html`**:

```
src/app.js              ← edit this (application code; plain JS + React.createElement via Babel-style output)
build/template.html     ← head, CSS design system, body shell ( /* %%SCRIPTS%% */ marker )
build/vendor-react.js, build/vendor-react-dom.js  ← React 18 UMD, inlined verbatim

cd build && node assemble.js     # → writes ../index.html
node build/serve.js              # static server on http://localhost:8901
```

Note: `assemble.js` must keep the function-replacer form of `String.replace` — the code contains `$$` sequences that string replacement would corrupt.

After any change, verify in a browser: app loads with zero console errors, drawing on the grid updates cycles live, all three tabs work. A `window.onerror` handler writes errors into `document.title` (prefix `ERRO:`) so headless runs can detect failures by checking the title.

## Architecture (src/app.js)

Single React component `KnotMakerMobile` plus pure engine functions. Coordinate conventions: `gx/gy` grid, `px/py` pixel, `ix/iy` interior intersection indices.

**Engine (pure functions, treat as verified — change with extreme care):**
- `buildEdges(cells, gw, gh)` — boundary edge segments of the cell shape
- `buildGaps(cells, gw, gh)` — boundary midpoints = nail positions = path start points
- `tracePath(startIdx, gaps, edges, ...)` — 45° billiard trace until the loop closes
- `getAllCycles(cells, gw, gh)` — all cycles covering every gap
- Weave parity: `(k + m + W) % 2` checkerboard decides over/under at each crossing; under-crossings are rendered as geometric gap cutouts in `renderStrandSVG`

**UI:** three bottom tabs (Edit = cell-grid shape editor with marquee drag; Shapes = save/load/presets/import/export + per-cycle color pickers; Mode = strand thickness, zoom, nails overlay, string-length stats). Stats bar shows cycle count + balance dot. Knot viewport: side-by-side in landscape (≥500px wide), below the editor in portrait. Pinch zoom on both surfaces. Saved shapes in `localStorage` key `celtic.savedShapes`.

**Design system:** CSS variables in `build/template.html` (`--ink`, `--bone`, `--accent` brass, `--hair`, …) — warm "workshop at night" palette. Fonts: Atkinson Hyperlegible (UI, chosen for older eyes) + JetBrains Mono (numbers). All inline styles in app code reference the same variables; retheme via tokens, not per-component edits.

## Repo layout

- `index.html` — the product (generated, committed)
- `src/app.js` — application source of truth (the original JSX source was lost; this is readable transpiled output)
- `build/` — assembler, template, vendored React, dev server (`node_modules/` gitignored)
- `docs/` — reference photos
- `archive/` — superseded variants, rejected redesign, salvageable experiments (see `archive/README.md`; notably the string-tracing animation in `archive/reference/celtic-knot-L.html`)
- `barbante-beatriz-colors.md` — physical yarn colors, hex-matched from real spools

## Deployment

GitHub Pages serves branch `gh-pages-mobile` at https://monthrie.github.io/Patterns/. Active development on branch `fable5`.
