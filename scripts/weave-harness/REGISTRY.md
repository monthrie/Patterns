# Weave registry — shapes we've made

Dimensions + verified cycle counts for shapes rendered through the harness, so we don't
re-derive them every time. Cycle count is what the **real engine** reported, not a guess.

Run one: `node render-weave.mjs --shape shapes/<name>.json --out out/<name>.png --mode full --colors bw`

| Shape | Grid (w×h) | Notch | Cycles | File | Notes |
|-------|-----------|-------|--------|------|-------|
| shoe-19x11 | 19×11 | 11 wide × 3 tall, top-left | **8** | `shapes/shoe-19x11.json` | The boot/L silhouette. The canonical "8-cycle shoe". |
| rect-22x11 | 22×11 | none (full) | **11** | `shapes/rect-22x11.json` | Full rectangle, gcd(22,11)=11. Mirror-symmetric rainbow lattice. |
| rect-70x105 | 70×105 | none (full) | **35** | `--rect 70x105` | Big portrait cloth, gcd(70,105)=35. 6 colour-structure iterations via `iterate-70x105.mjs` (argyle / palindrome / duotone / triple-check / rainbow / scatter). |

## How cycle count works (so we can predict, not guess)
- A full W×H rectangle = `gcd(W,H)` cycles (e.g. 20×8 → 4, seen in `photo-4cycle`).
- Notching changes the count; the engine is the source of truth. The harness prints
  `engine reports N cycles` — trust that line, then colour for N.

## Colour schemes (`--colors`)
- `bw` — alternating black/white across the real cycle count (i even → black, odd → white).
- `rainbow` — evenly spaced hues.
- `#aaa,#bbb,...` — explicit list, cycled.
- Backdrop via `--bg <hex>` (default `#5a5f66` mid-grey so both black & white read).

## Modes (`--mode`)
- `full` (GROSSO, thick) · `thin` · `string` (single colour `#8fa3ad`, ignores per-cycle colours).

## Show only some loops (`--show`)
- `--show random:3` — render 3 random loops, hide the rest (non-deterministic).
- `--show 2,5,9` — render exactly those loop indices.
- Works in any mode. `--mode string --show random:3 --bg "#14181d"` = the isolated string-skeleton
  view (verified on rect-22x11: drew loops 7,9,10 as bare cords with nail dots).
- Coloured-isolated: `--mode full --show 2,5,9 --colors rainbow` = those loops, each its own colour.

## Full recipe list
See the skill: `Patterns/.claude/skills/render-weave/SKILL.md` (turnkey, all variations).
Reminder: after every render, **Read the PNG to show it inline** — don't just describe it.
| rect-32x16 | 32×16 | none (full) | **16** | `--rect 32x16` | Waistcoat-explainer set (2026-08-18): `wc-alt-bw` (alternating b/w = the stripe illusion), `wc-one-red` (one loop crimson = proof no stripe is a line), `wc-stage-3/8/13` (laying stages), `wc-skeleton`, `wc-loop7` (one loop = two diamonds), `wc-alt-joao` (Barbante palette). |
| rect-96x16 | 96×16 | none (full) | **16** | `--rect 96x16` | Three 32×16 panels joined in a row = the waistcoat body unrolled; count preserved (João's tiling principle, §6d). Set (2026-08-19): `wc3-string-full` (joined skeleton), `wc3-string-half` (8 of 16 strung), `wc3-oneloop` (ONE loop crossing both seams), `wc3-color-partial` (10 of 16 coloured), `wc-tiled-3x` (complete bw). |
| waistcoat REAL | fronts 16×48, back 32×48, body 64×48 | none | **16 each, 16 joined** | `--rect 16x48` / `32x48` / `64x48` | Colete tramado true proportions (Wilmon 2026-08-19). gcd checks: 16/16/16. Set: `wcR-panel-*`, `wcR-body-skeleton/half/oneloop/complete`. Complete render matches the reference photos. Supersedes the 32×16 stand-ins for all Riga figures. |
| rect-64x48 (Riga vest guesses) | 64×48 | none | **16** | `out/riga5-body.png`, `out/riga5-guess1.png` | GUESSES of the 5-colour Colete tramado (2+4+4+4+2 grouping, engine index order): placeholder palette, then grey2/blue4/green4/yellow4/red2 from João's photo clue. Structure right (tartan, self-crossing solid diamonds), scale of solid fields wrong → his circuit numbering ≠ engine order. Do NOT treat as the real pattern; awaiting straight-on photo or registo de fabrico for pattern-from-image decode. |
