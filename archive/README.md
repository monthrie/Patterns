# Archive

Historical and experimental variants of the Knot Maker app. **None of these are the product** — the live app is `/index.html`, built from `/src/app.js` via `/build/assemble.js`. These are kept for reference and salvage.

## superseded/ — replaced outright by index.html
- `index-deployed.html` — snapshot of the previously deployed build (cool slate palette). Same logic as index.html before the warm retheme.
- `index _mac.html` — older desktop-oriented variant (Apr 2026).
- `celtic-knot-mobile.html` — early mobile layout attempt, fully merged into index.html.

## reference/ — useful ideas and code worth mining
- `celtic-knot-L.html` — L-shaped board variant. **Contains the best string-tracing animation in the repo** (requestAnimationFrame, smooth sub-segment interpolation, dynamic duration, multi-cycle sync) — port candidate.
- `fable-redesign-concept.html` + `fable-redesign-app.jsx` — rejected June 2026 full redesign ("Tear de Pregos"). Salvage candidates: thread-laying animation with play/pause/step (jsx ~line 2318), rectangle discovery heatmap, saved palette system, two-colour strands, PT/EN i18n dictionary.
- `celtic-knot-custom.html` — first cell-grid custom shape builder (presets: escada, L, cruz, moldura).
- `celtic-knot-3.html` — "Nós do João" early proof of concept.
- `with_grid.html` — the original String Art Builder prototype (three strings A/B/C, genesis of the billiard idea).
- `palette-preview.html` — swatch sheet for the Barbante Beatriz yarn colours.
- `shape.json` — hand-drawn orthogonal polygon example data.

## niche-tools/ — standalone utilities, still functional
- `sock-sim.html` — computes how two L-shaped cycle sets join into a 3D sock.
- `weave-pattern.html` — printable diagonal basket-weave paper pattern generator (A4/A3).
