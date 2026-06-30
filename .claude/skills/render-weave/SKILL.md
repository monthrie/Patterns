---
name: render-weave
description: Render a João billiard-weave headless from parameters — finished coloured weave, black/white, bare string skeleton, or an isolated subset of loops. No clicking, no re-implementation; drives a copy of the real engine and reads its renderStrandSVG out as PNG + SVG. Use whenever the user wants a weave image with a given cycle count / colours / mode, or to show specific loops. Prints the engine's true cycle count so you never guess.
---

# Render a weave (headless)

Everything runs through `scripts/weave-harness/render-weave.mjs`. It loads a **copy** of the
deployed engine (`scripts/weave-harness/engine.html`), reaches into the live React component,
calls the engine's own setters, lets the real `renderStrandSVG` recompute, then screenshots a
clean clone of the weave `<svg>`. **Never hand-edit `index.html`; never click the app.**

```bash
cd /Users/wilmon/Documents/projects/Patterns/scripts/weave-harness
node render-weave.mjs --shape shapes/<name>.json --out out/<name>.png [flags]
```
It prints `engine reports N cycles for "<name>"` — **trust that line for the loop count.**
Writes `out/<name>.png` and `out/<name>.svg`. Each run ≈ 2–3 s.

## Flags (all variations)
| Flag | Values | Meaning |
|------|--------|---------|
| `--shape` | path to a spec JSON | the board — see spec forms below |
| `--rect` | `WxH` | shortcut: full rectangle, no file needed (e.g. `--rect 20x8`) |
| `--mode` | `full` (GROSSO/thick) · `thin` · `string` | strand style. `string` = single colour `#8fa3ad`, ignores per-cycle colours (the bare skeleton) |
| `--colors` | `bw` · `rainbow` · `"#000,#fff,…"` | `bw` = alternating black/white; csv list cycles through. Ignored in `string` mode |
| `--show` | `random:N` · `2,5,9` | render only a subset of loops (hides the rest). Works in any mode |
| `--bg` | hex | backdrop. Default `#5a5f66` mid-grey. Use a dark bg (`#14181d`) for `string` so the grey strands read |
| `--out` | path | output png (sibling `.svg` written too) |

## The one rule you need: cycle count
- **Full w×h rectangle → `gcd(w,h)` cycles.** Pick a shape for the count you want:

  | cycles | rectangle | | cycles | rectangle |
  |--|--|--|--|--|
  | 2 | 10×4, 14×8 | | 8 | 16×8, 24×8 |
  | 3 | 9×6, 12×9 | | 9 | 18×9, 27×9 |
  | 4 | 20×8, 12×8 | | 10 | 20×10, 30×10 |
  | 5 | 15×10, 20×15 | | 11 | 22×11, 33×11 |
  | 6 | 18×12, 24×6 | | 12 | 24×12, 36×12 |

- **Notched / non-rectangular shapes change the count** — don't predict, just render and read
  the `engine reports N cycles` line, then re-colour for N. (Proven: 19×11 with an 11×3 top-left
  notch → 8 cycles, the shoe.)

## Spec forms (`--shape` file)
The harness normalizes any of these (so the `pattern-from-image` decoder's specs run directly):
- engine-native: `{ "name", "gw", "gh", "cells": [[true,false,…],…] }`
- decoder rect:  `{ "name", "rect": [20,8], "colors": ["#…",…], "bg": "#…" }`
- decoder cells: `{ "name", "cells": ["..##..", ".####.", …], "colors": […], "bg": "#…" }`  (`.`/space = empty)

Inline `colors` / `bg` in the spec are used unless overridden by `--colors` / `--bg`.

## Outputs of every run
- `<out>.png` + `<out>.svg` — the render.
- `<out>.shapes.json` — array-wrapped, importable via the app's **Guardadas → Importar**.
- `<out>.recipe.md` — **exactly how to make it**: board `gw × gh`, cord count, a run-length
  summary (`cords 1–7: purple (#574fa6)`), and a per-cord list (`cord 1 = purple (#574fa6)` …).
  Colours auto-named from hex; `--show`-hidden cords are marked `HIDDEN`. This is the weaving
  spec — colours are threaded in cord order (the app's **Fios** tab, tap each string in order).

## Make a shape (it's just a boolean grid)
Full rectangle:
```bash
node -e 'const gw=22,gh=11,c=Array.from({length:gh},()=>Array(gw).fill(true));
require("fs").writeFileSync("shapes/rect-22x11.json",JSON.stringify({name:"rect-22x11",gw,gh,cells:c}))'
```
Carve a notch (→ L / boot silhouette). Set `c[y][x]=false` for the cut block:
```bash
node -e 'const gw=19,gh=11,c=Array.from({length:gh},()=>Array(gw).fill(true));
for(let y=0;y<3;y++)for(let x=0;x<11;x++)c[y][x]=false;
require("fs").writeFileSync("shapes/shoe-19x11.json",JSON.stringify({name:"shoe-19x11",gw,gh,cells:c}))'
```

## Recipes (copy-paste)
```bash
# finished coloured weave (each loop its own colour)
node render-weave.mjs --shape shapes/rect-22x11.json --out out/rainbow.png --mode full --colors rainbow

# black & white alternating
node render-weave.mjs --shape shapes/shoe-19x11.json --out out/shoe-bw.png --mode full --colors bw

# bare STRING SKELETON (all loops, single string colour, dark bg)
node render-weave.mjs --shape shapes/rect-22x11.json --out out/skeleton.png --mode string --bg "#14181d"

# 3 RANDOM loops, string format (the isolated-cords view)
node render-weave.mjs --shape shapes/rect-22x11.json --out out/3loops.png --mode string --show random:3 --bg "#14181d"

# specific loops, isolated AND each coloured (so you can tell them apart)
node render-weave.mjs --shape shapes/rect-22x11.json --out out/loops-2-5-9.png --mode full --show 2,5,9 --colors rainbow
```

## ALWAYS show the user the result
After rendering, **Read the output PNG so it displays inline** — the user is asking to *see* it,
not to be told it exists. Then offer next moves (re-roll random, re-colour, different shape).

## Record what you make
Append a row to `scripts/weave-harness/REGISTRY.md` (shape, grid, notch, engine-verified cycles,
file). That's the cheat sheet of known shapes so dimensions never get re-derived.

## How it hooks in (only if it breaks)
- React 18 `createRoot(#root)`. Bridge walks `FiberRootNode.current` → the `KnotMakerMobile`
  fiber and reads its hooks. App callbacks are **anonymous** (`useCallback(arrow,deps)`), so
  targets are found by **source order + value signature**, not name:
  hooks `[0]`=cells (2D bool), `[1]`=gridW, `[2]`=gridH; the `'thin'|'full'|'string'` state =
  strandMode; the object-states after it (in order) = cycleColors, cycleSecondary, **visibleCycles**.
- `cycles` is **not** its own hook — it lives inside a memoized `{cycles,gaps,edges}` object.
- Loop visibility: `showAll` stays `true` (default); to show a subset, mark the others `false`
  in `visibleCycles` (what `--show` does).
- If the app changes, refresh the copy: `cp index.html scripts/weave-harness/engine.html`.
- Browser: `playwright-core` (in `scripts/node_modules`) + chromium headless-shell **1223**.

## Paired with `pattern-from-image`
`pattern-from-image` is the **decode brain** (photo → board shape + colour-per-cycle); this skill
is the **render engine** it delegates to. If the user shares a photo or asks for a specific
textile, start there — it produces a spec and calls this. For a bare "render N cycles / these
colours / show these loops", use this skill directly.
