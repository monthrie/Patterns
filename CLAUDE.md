# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Knot Maker — Mobile** (`index.html`) is a single-file web app that simulates a real craft: 45° billiard-path string weaving on nail boards. The user draws an arbitrary shape on a cell grid; the app traces diagonal paths that bounce off the boundary; **each closed path ("cycle") is one physical cotton string** the craftsman weaves on a real board, with crossings interlaced over/under in checkerboard parity. The app counts cycles, colors them (real Barbante Beatriz yarn palette — see `barbante-beatriz-colors.md`), measures string lengths, and renders the finished weave.

The primary user is João, an elderly Portuguese craftsman, on an Android tablet. He builds real textiles from these designs (see `docs/joao-woven-cushion.jpeg`). The app must remain **fully self-contained and offline-capable** — React is inlined, no CDN dependencies.

## Build & Run

The app is generated — **never hand-edit `index.html`**:

```
src/app.js              ← edit this (application code; plain JS + React.createElement via Babel-style output)
src/engine.js           ← shared pure billiard/weave engine (TearEngine global; verbatim twin of app's inline copy)
src/player.js           ← embeddable trace-player (TearPlayer; "watch the laying" overlay + website embeds)
build/template.html     ← head, CSS design system, body shell ( /* %%SCRIPTS%% */ marker )
build/vendor-react.js, build/vendor-react-dom.js  ← React 18 UMD, inlined verbatim

cd build && node assemble.js     # → writes ../index.html (inlines engine + player + app)
node build/serve.js [port]       # static server, default 8901
node scripts/smoke.mjs           # 22 automated browser checks (PORT=#### to target a server)
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

**UI:** bilingual (PT default, EN via stats-bar toggle; all strings in the `STR` dict + `HELP`). Three intent tabs: Desenhar (cell-grid editor with marquee drag), Fios (string visibility chips + colour pickers + balance + per-colour lengths), Guardadas (save/load/presets/import/export). View properties live ON the canvas as floating controls: background, zoom/100%, nails toggle, strand thickness cycler, and ▶ which opens a fullscreen overlay playing the current pattern being laid (TearPlayer). Stats bar: cycle count + tappable balance dot + EN/PT + fullscreen toggle. Knot viewport: side-by-side in landscape (pane `clamp(340px,46vw,620px)`, wheel-zoom), below the editor in portrait. Pinch zoom on both surfaces. Saved shapes in `localStorage` key `celtic.savedShapes`; language in `knot.lang`.

**Design system:** CSS variables in `build/template.html` (`--ink`, `--bone`, `--accent` sea-glass, `--hair`, …) — cool slate, modern, minimal. Font: JetBrains Mono throughout. All inline styles in app code reference the same variables. HARD RULE from the owner: no warm/rustic theming, no decorative fonts, no rope/texture shading — flat clean strands; animated strings must be continuous (gaps only where diving under already-laid cord).

## Repo layout

- `index.html` — the product (generated, committed)
- `about.html` — the story page (static; live player embeds; links into the tool)
- `player.html` — trace-player demo / animation studio (static)
- `play.html` + `src/toy.js` — the Toy: standalone quiet weaving game (draw → weave → dye → wall → share); shared engine/player/code, never touches the app; smoke: `node scripts/smoke-toy.mjs`
- `src/app.js` — application source of truth (the original JSX source was lost; this is readable transpiled output)
- `src/engine.js`, `src/player.js` — shared engine + embeddable player (used by index.html overlay, about.html, player.html)
- `build/` — assembler, template, vendored React, dev server (`node_modules/` gitignored)
- `docs/` — reference photos
- `archive/` — superseded variants, rejected redesign, salvageable experiments (see `archive/README.md`; notably the string-tracing animation in `archive/reference/celtic-knot-L.html`)
- `barbante-beatriz-colors.md` — physical yarn colors, hex-matched from real spools

## Deployment

GitHub Pages serves branch `gh-pages-mobile` at https://monthrie.github.io/Patterns/. Active development on branch `fable5`.
