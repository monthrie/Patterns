# Seam / 3D-weave handover

Goal: model how João's flat woven panels become a 3D woven shoe, and reproduce the
real cord count. This doc is self-contained: a fresh session should be able to pick
it up and continue without re-deriving anything.

Branch: `seam-lab`. The main app (`index.html` / `src/app.js`) is SACRED and untouched.

---

## 1. The hard fact (measured by the owner, not computed)

- **Rainbow boot: 8 cords flat per panel → 12 cords assembled.** (+4) MEASURED FACT.
- **Black-and-white slipper: 2 cords flat → 2 assembled (+0) is a GUESS**, never counted
  on the object (owner correction 2026-06-17). It must NOT be used to validate any model.

CORRECTION: an earlier version of this doc called the b&w "2 to 2" a measured fact and
used it to "prove" cords = closed billiard loops. That was unfounded; the b&w count was
never actually counted on the object. Only the rainbow 8 to 12 is observed. Do not lean
on the b&w number anywhere downstream.

The rainbow flat panel is a **19×11 cell L-shape with an 11×3 notch top-left**
(`cells[y][x] = !(y<3 && x<11)`, x∈[0,19), y∈[0,11)). The engine's flat billiard on
it = **8 cords**, matching reality. The single-shape weave is CORRECT and verified.

---

## 2. The engine (TearEngine, `src/engine.js`) — treat as verified

The flat weave is a 45° billiard on a grid of cells:
- `buildEdges(cells,gw,gh)` — maximal straight boundary edge segments.
- `buildGaps(cells,gw,gh)` — **GAPS = boundary edge MIDPOINTS** (half-integer coords).
  An H-gap is at `(x+0.5, y)`, a V-gap at `(x, y+0.5)`. One gap per boundary cell-edge,
  so an L-cell edge has L gaps. The 19×11 L has 60 gaps (edges 8,11,19,8,3,11).
- `tracePath(startIdx,gaps,edges)` — shoots a 45° ray into the interior from a gap and
  bounces off the boundary until it closes. At a single edge it reflects (flip one
  axis); at a **corner** (`hitH && hitV`, an integer vertex) it does a 180° reversal.
- `getAllCycles(cells,gw,gh)` — every gap belongs to exactly one closed cord; returns
  the cords (each visits a set of gaps once). 19×11 L → 8 cords.

Rendering of a finished cord = `weaveSegments` in `src/seam.js` (a verbatim twin of the
app's `renderStrandSVG` diagonal branch): straight strand segments with a gap cut at
each UNDER-crossing (checkerboard parity `(k+m+W)%2`), giving the over/under cloth.

## 3. Nails vs gaps vs corners (the geometry, verified)

This caused an hour of confusion; it is now nailed:

- **GAP** = where the cord crosses the boundary = edge MIDPOINT (half-integer). The
  engine works in gaps. A 19-cell edge has 19 gaps.
- **NAIL** = a physical pin = the INTEGER lattice point BETWEEN two gaps. The cord
  bounces (U-turns) around nails; it never crosses one. A 19-cell edge is bounded by 20
  nails (integers 0..19). The owner's "19×11 nails, count the corner twice" = the nail
  tally; "20×12 gaps" = counting a crossing at each corner too.
- **CORNER** = an integer vertex where the boundary turns (`tl+tr+bl+br===1` convex,
  `===3` concave). The cord 180°-reverses there; the engine puts NO gap on a corner.
  The 19×11 L has 5 convex corners + 1 concave at (11,3).
- **CROSSINGS** (over/under interlace points) are strictly INTERIOR lattice
  intersections, never on the boundary. Not to be confused with boundary gaps.

KEY: across all 8 flat cords the corners are visited **0 times** — the cord wraps
*around* the corner nail using the two flanking gaps, never *through* the corner.

## 3b. THE LIKELY ANSWER (found late): compute the double cover on the GAP grid

The double cover must be computed on the **20×12 GAP grid** (= the 19×11 nail grid +1
per dimension, notch 12×4), NOT the 19×11 nail grid. The owner said this repeatedly
("19×11 nails, 20×12 gaps; the cord crosses at gaps"). On the gap grid the orientation
double cover gives, by opening edge (verified, /tmp/dcover.mjs logic):

| opening edge (gaps) | assembled cords |
|---|---|
| tower-top, len 8 (the short "ankle") | **8** |
| lower-left, len 8 | 8 |
| notch-floor, len 12 | **12** |
| right, len 12 | **12** |
| sole, len 20 | **12** |
| notch-wall, len 4 | **12** |

So **12 is what the gap-grid double cover gives for 4 of the 6 openings** (every edge
except the two short 8-gap edges). The flat panel is still 8 (single mode, nail grid).

### STILL NOT SOLVED — and the precise tension (correcting an earlier wrong "solved")

The owner's definitive description of the assembly:
- It is **one bent tube / cylinder, open at one end (the ankle), closed at the toe**, a 90°
  bend at the instep. Two identical panels laid together and tied around the perimeter.
- There is **exactly ONE untied place**: the **top 8-nail (= 9-gap) section** (the ankle
  mouth). Everything else is tied; once tied, it is SEAMLESS (no creases/lines).
- Every colour is one closed loop; 12 colours = 12 loops. No loose ends.
- b&w: 2 flat → 2 assembled (+0). rainbow: 8 flat → 12 assembled (+4).

What the models actually give (all honest, run):
| model (19×11 nail grid) | opening | count |
|---|---|---|
| double cover (two sheets, reflection) | tower-top (short) | **8** |
| double cover | any single edge | 8 / 11 / 13 |
| cylinder roll top↔sole (translation) | ends | 13 |
| cylinder roll left↔right | ends | 5 / 9 |
| double cover on **20×12 GAP grid** | a LONG edge or throat | **12** |
| double cover on 20×12 GAP grid | the short tower-top | 8 |

THE UNRESOLVED CRUX: 12 only appears for a **long** opening on the **gap** grid, but the
owner says the opening is the **short top 8-nail section**, which gives 8 in every model.
The gap between 8 and 12 (+4) is real and not yet bridged by any single-short-opening model.

The likely culprits a fresh session should chase, in order:
1. **The fencepost on the opening.** "8 nails = 9 GAPS." It is not pinned down exactly how
   an 8-nail untied span maps to open GAPS (8? 9? including which corner gaps?), nor on
   which grid the cord crosses (the 60 boundary gaps redistribute as +1 per edge minus
   shared corners; total still 60). Get the owner to count GAPS per edge on the real board.
2. **The model may need the true 3D bent-tube surface** (a translation/half-translation
   surface) with geodesics, not a flat reflection/translation gluing. None of the flat
   gluings above is the physical bent tube; they are approximations.
3. **The corner where two cords "go round the top corner of the notch to the next part"** —
   the owner reports cords wrapping the notch corner at the opening. That wrap is not in any
   model yet and is the most concrete physical clue to the +4.

Do NOT claim "throat opening" as the answer — it gives 12 only because it is a LONG
opening, which contradicts the owner's short single opening. It was a wrong guess.

### FINAL HONEST STATE (after exhausting the gluing models)

The opening is the BIG TOP edge (the ~8-nail / 9-gap ankle mouth — the only opening big
enough for a foot; the 3-nail notch-wall is far too small, that was a dumb suggestion).

Verified, every way:
- Two panels, 5 of 6 edges tied, that big top open = the orientation double cover. It
  gives **8**, not 12. (19×11 board; any 8-flat board with an ~8-gap top opening gives 8.)
- Searched all 8-flat L-boards: those whose SHORT-TOP double cover = 12 have a top edge of
  4, 12, or 20 gaps, never 8 or 9. So no board with an ~8-nail top reaches 12 this way.
- The b&w (2-flat) under the identical construction gives 2, matching the owner's count.

So the double-cover billiard model **matches the b&w (2→2) but is wrong for the rainbow
(predicts 8, reality 12)**. The +4 is real and is NOT produced by the tying as modelled.
This is a genuine dead end for the flat-gluing approach, not a tuning issue.

THE LIVE LEAD (where a fresh session should start, NOT more opening-guessing):
- The skeleton is 8 loops/panel (verified, = the engine). The owner counts 12 COLOURED
  loops in the finished shoe. The original craft description says he "traverses every loop
  several more times through the assembled 3D structure to fill the gap," then the skeleton
  is pulled out. So the 12 coloured cords may NOT be in 1-to-1 correspondence with the 8
  skeleton billiard loops. The sparse b&w (2 loops) needs no filling, so coloured = skeleton
  = 2; the dense rainbow filling may split/duplicate loops, giving 12 ≠ 8.
- If so, the right object to count is the COLOURED-cord traversal of the assembled 3D form,
  not the skeleton double cover. That is a different (and unbuilt) model. Get from the owner:
  exactly how the colour is laid (does each colour follow one skeleton loop once, or does
  the filling create extra closed colour loops?).
- Everything billiard/double-cover here is verified and will not yield 12 for this board
  and opening. Stop re-deriving it; the missing physics is in the colour-filling step.

NOTE: section 4 below (the "{8,11,13} parity wall") is the result on the WRONG (19-nail)
grid. It is correct for that grid but is the wrong grid; 3b supersedes it. Kept for the
record because the mistake (computing assembly on nails not gaps) is instructive.

## 4. The {8,11,13} result on the 19×11 NAIL grid (wrong grid — see 3b)

The clean, correct assembly model is the **orientation double cover**: two identical
panels sealed face-to-face on every edge except the opening; a cord switches sheet at a
sealed edge and reflects at the open one. Its per-face paths ARE the real flat billiard
(0 hopping segments — this is the property `SeamEngine.traceCord` violates, producing
"patterns that never exist"). Script: `scripts/seam-doublecover.mjs`.

Its count is rigid:

> assembled = flat_count + (number of cords whose sealed-crossing parity is EVEN)

For the **19×11 L the reachable counts are exactly {8, 11, 13}** (the even-parity cord
count can only be 0, 3, or 5 over all single-edge openings). **12 is provably
unreachable** for this panel — it falls in a parity gap (would need exactly 4 cords to
double). At the physical ankle (the short top edge, len 8) it gives 8.

Cross-checks that confirm the wall is real, not a bug:
- b&w (2-flat L) double cover → **2** (reachable {2,3}). ✓ matches reality.
- The corner / "missing nail" hypothesis was tested THREE ways (corners inert /
  counted-twice / flip-if-sealed) — all give identical counts, because corner
  contributions cancel pairwise along every closed cord. Corners cannot move the count.
- 12 IS reachable for **other-dimensioned** 8-flat L panels (31 of 489), but only at a
  LONG-edge opening, never the short ankle. The `Lpanel(20,12,12,4)` that gave 12 was a
  FUDGE: no honest nail→gap conversion produces it (corner-dilation of 19×11 gives
  flat 1, not 8).

## 5. Models tried (all in `scripts/`, all honest, none gives 12 for 19×11+one mouth)

| model | script | flat | assembled | verdict |
|---|---|---|---|---|
| two-panel right-sides-together (rev+flip) | `seam-model.mjs`, `fold-two-panel.mjs` | 8 | **3** | wrong |
| orientation double cover (one mouth) | `seam-doublecover.mjs`, `seam-cover.mjs` | 8 | **8/11/13** | rigid, no 12 |
| single-panel self-fold (zip) | `seam-cornerfold2.mjs`, `/tmp` zips | 8 | **11** (physical ankle) | no 12 there |
| dual / lattice-nail billiard | `dual-nail.mjs` | **5** | 13 | fails flat=8 |
| corner-crossings added | (in candidates) | 8 | unchanged | provably inert |

Note: a single-panel fold CAN hit 12 for *some* crease/opening (a sweep found several),
but not at the physical ankle the photos show. This is the most promising unexplored
direction IF the real boot is one folded panel (the components photo suggests one L per
boot; the owner has also described two panels stacked — this ambiguity is unresolved).

## 6. The tool (`shoe.html` + `src/shoe-ui.js`)

- **Single shape** mode: the flat billiard on the 19×11 cells. VERIFIED correct (8
  strings, same cells/weave/labels as the knot maker). Draw cells; W/H size; fill/clear.
- **Glued piece** mode: currently uses `SeamEngine` → shows 3 with non-physical paths.
  NOT solved. Should be rebuilt to render the real flat weave per face (double-cover
  model) once the correct gluing is known.
- Toggle between them to compare single mode against the real engine.

## 7. The open question (what a fresh session must answer)

Both shoes are honest closed-cord counts: b&w 2→2 (+0), rainbow 8→12 (+4). A one-mouth
double cover of the verified 19×11 panel can only do +0/+3/+5, so **+4 → 12 is not a
one-mouth double cover of this panel.** Therefore one of:

1. **The rainbow board is not exactly 19×11/11×3.** A nearby 8-flat L can hit 12 at the
   right opening. Need the exact nail count per edge from the physical board.
2. **The fold is a single panel folded with a specific crease** (not two stacked, not a
   uniform double cover). Single-panel folds reach 12 for some creases — need the exact
   crease/opening from the real boot.
3. **The opening is not one full edge** (e.g. it spans the corner, or is two short
   edges) — which changes the parity and can reach +4.

The decider is physical, not computational. Required from the owner:
- A FLAT, fully-laid skeleton photo on the nail board (count nails per edge exactly).
- A photo showing the SEAM lines / which edge meets which (inside-out or raking light).
- The ankle OPENING close-up (how many gaps are actually left open, and whether it spans
  a corner).
- Ideally a mid-assembly photo or a description of which edge folds onto which.

Verified scripts to rerun: `scripts/seam-doublecover.mjs`, `scripts/seam-parity-proof.mjs`,
`scripts/seam-cover2.mjs`, `scripts/fold-two-panel.mjs`, `scripts/seam-model.mjs`.
Run: `cd <repo> && node scripts/<name>.mjs`.
