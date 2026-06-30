---
name: pattern-from-image
description: Recreate a photographed weave (or a described pattern, e.g. "4 cycles, 4 random colours") digitally using the billiard-weave engine. Decodes the image's colours and structure into a board shape + colour-per-cycle, then renders via the render-weave harness. Use whenever the user shares a photo of a woven textile to reproduce, or asks for a pattern with N cycles/colours.
---

# Pattern from image

The **decode brain**: turn a photo (or an abstract request like "4 cycles, 4 colours") into the
parameters of a João weave — a board shape and a colour for each cycle. The actual rendering is
done by the **`render-weave`** skill/harness (the hands). This skill produces a *spec* and hands
it to `render-weave`, which prints the true cycle count and writes the PNG + importable shape.

> The engine is now the self-contained `index.html`; the old `scripts/render-pattern.mjs`,
> `scripts/swatch-colors.mjs`, and `src/engine.js` were deleted. **Never hand-edit `index.html`,
> never click the app** — go through `render-weave`.

## How the craft maps to parameters

- One **cycle** = one physical string = one colour. The visual pattern is fully determined by
  the board shape + the colour assigned to each cycle.
- For a **w×h rectangle**, cycle count = **gcd(w, h)**. So "a 4-cycle pattern" → 8×4, 12×8,
  20×8, 16×12… pick the aspect ratio closest to the photo. All cycles in a rectangle have
  equal length (balanced — João likes this).
- **Non-rectangular shapes change the count unpredictably — don't compute it, render and read
  it.** `render-weave` prints `engine reports N cycles`; trust that line, then set N colours.
- Colour **order** matters: it sets which colours sit on adjacent diagonals. If the render's
  colour adjacency doesn't match the photo, permute the `colors` array and re-render —
  don't change the shape.

## Reading a photo: colours vs cycles

João often uses one colour on **several consecutive strings**, so distinct-colour count is a
*lower bound* on cycle count, not the answer. Decode the photo like this:

- Every region is the crossing of one ↗ diagonal and one ↘ diagonal. **Same colour both
  ways → solid diamond block. Different colours → fine 50/50 checkerboard mix.**
- **Cycle→diagonal mapping is a zigzag, not a cycle** (verified empirically on rectangles):
  along each diagonal direction the owning cycle runs `0 1 … g-1 g-1 … 1 0 0 1 …`,
  mirrored at each end. The visible band sequence is the palindromic tiling of the
  `colors` array — so the array's *order* matters and rotations are NOT equivalent.
- Consequences:
  - The **first and last colours in the array read double-width** at the zigzag
    turnarounds. A huge solid diamond of colour X usually means X's group sits at one
    end of the array (e.g. 3 cream strings at the end → a 6-wide cream diamond).
  - **Grouped colours** (`R,R,R,Y,Y,Y,C,C,C` — João's habit, e.g. his 48×60 rug is
    12 strings as 3+3+3+3) give the classic plaid-argyle: solid diamonds of each colour,
    checker mixes between neighbouring groups. Group adjacency in the array = which
    colours frame which in the cloth.
  - Non-grouped, non-palindromic arrays give scattered pinwheels, not argyle.
- To inspect the mapping for a candidate board, **render it and look** — read the PNG and
  check the diagonal colour rhythm against the photo, then iterate (the old `src/engine.js`
  ownership-dump is gone; the render is now the fastest oracle, ≈2–3 s).
- Estimating the board: count diamond repeats across the cloth. Each colour group of
  size k occupies k diagonals; total diagonals per direction = W+H; cycle count g divides
  both W and H. João's real boards are big — 48×60 is normal — but any W,H with the same
  gcd and aspect renders the same motif smaller.

## Start from the string count

**Ask the user for the string count first** — it collapses the search. Verified examples:
the 48×60 rug = 12 strings, a 5-colour runner = 15 strings. What the count gives you:

- **João's habit is 3 strings per colour**: count = 3 × (number of colours). With group
  sizes fixed, the only unknown is the *order* of the colour groups, which you read off
  the photo's adjacencies (which colour checkers against which).
- Both board sides are multiples of g; pick the aspect from the photo (runner ≈ g wide).
- The motif repeats every **2g cells** along each axis (one full zigzag). If no string
  count is given, estimate g from the photo: g ≈ (motif repeat distance) / (2 × checker
  square pitch) — countable by eye, or by autocorrelation. Diamond repeats along the
  cloth also reveal the board length.
- Don't invent palindromes or singles first — try plain grouped `AAABBBCCC…` before
  anything exotic. The end groups read double (6-wide) at the zigzag turnarounds, which
  is usually exactly the photo's dominant colour.

## Workflow

1. **Read the photo.** Identify distinct yarn colours and estimate hexes by eye, then derive
   the full colour *sequence* (with repeats) per the section above. Note the cloth's aspect
   ratio.
2. **Match colours.** The k-means `swatch-colors.mjs` sampler is gone — sample **by eye**:
   Read the photo and estimate per-yarn hexes (use the 70th-percentile-ish bright pixels of
   each yarn, not the shadowed ones). Prefer the physical yarn palette in
   `barbante-beatriz-colors.md` (repo root) when a colour is close — those are strings João
   actually owns; say which you chose. *(If precise sampling matters, offer to rebuild a small
   swatch sampler — note it as a to-do, don't fake hexes.)*
3. **Write a spec** the harness consumes directly — `scripts/weave-harness/shapes/<name>.json`:

   ```json
   { "name": "my-pattern", "rect": [20, 8],
     "colors": ["#3f4a7e", "#a79fb2", "#dee5ad", "#4e7c33"], "bg": "#f4f1e8" }
   ```

   Instead of `rect`, arbitrary shapes use `"cells": ["..##..", ".####.", …]`
   (`.` or space = empty, anything else = filled). `colors` and `bg` are read by the harness;
   `bg` defaults to bone `#f4f1e8` for cloth comparison (pass `--bg` to override).

4. **Render via `render-weave`:**
   ```bash
   cd /Users/wilmon/Documents/projects/Patterns/scripts/weave-harness
   node render-weave.mjs --shape shapes/<name>.json --out out/<name>.png    # --mode full is default (finished cloth)
   ```
   It prints `engine reports N cycles` (**catch colour-count mismatches here**) and writes
   `out/<name>.png` + `.svg` + `.shapes.json`. Shortcut for a plain rectangle: `--rect 20x8`.
5. **Compare.** **Read the PNG** so it shows, and put it side by side (mentally) with the photo.
   Iterate on colour order first, then shape, until the diagonal colour rhythm matches. 2–3
   rounds is normal.
6. **Deliver.** Show the final PNG, state shape + cycle count + colours (with yarn names if
   palette-matched), and point at the `out/<name>.shapes.json` — importable in the app via
   **Guardadas → Importar**. The import carries only the shape; colours are applied in the
   **Fios** tab by tapping each string, so list them in cycle order.

## For "N cycles, random colours" requests (no photo)

Pick a rectangle with gcd = N (see the table in the `render-weave` skill), sample N colours from
`barbante-beatriz-colors.md` (real yarn only), render once with `--rect`, show it.

## Gotchas

- Rendering, cycle-count truth, modes, palettes, and the `--show`/string-skeleton variations all
  live in the **`render-weave`** skill — this skill only decides *what* to render.
- The render is the *finished cloth* (`--mode full`, no nails) — what a photo comparison wants.
- The photo's weave is usually denser/chunkier than the render (multi-strand yarn vs flat
  digital strands); match colour rhythm and diagonal structure, not texture.
- Dead references retired from this skill: `render-pattern.mjs`, `swatch-colors.mjs`,
  `src/engine.js`, `docs/barbante-beatriz-colors.md` (now at repo root).
