# Cord-length survey: findings

Companion to `docs/cord-length-survey.md` (the brief). Computed 2026-06-16 with
João's verified billiard engine (`src/engine.js`), node only.

Reproduce:

```
node scripts/cord-length-survey.mjs 12      # spectrum + every balanced witness
node scripts/cord-balance-analysis.mjs 12   # reflection-tiling test + symmetry analysis
```

Artifacts: `scripts/artifacts/cord-length-survey-{10,12}.json`.

## Sanity checks (all pass)

Enumeration is Redelmeier over fixed polyominoes, deduped to free shapes (the
same trusted path as the monolinear census). Self-checks across every board up
to n = 12:

- free/fixed counts match OEIS A000105 / A001168 at every n,
- total length = 2n exactly on every board (0 failures), the one fixed quantity
  from the brief,
- every cord length is an integer (0 failures), and in fact even (see the
  parity lemma below),
- rectangle cords obey Theorem 2: `gcd(m,n)` cords each `2mn/gcd(m,n)`
  (0 violations).

Length is in cell-diagonal units throughout: `arcLen(points)/sqrt(2)`.

## 1. The central conjecture is false (cleanly)

**Conjecture under test:** a board is balanced (all cords equal) iff it tiles
the plane by reflection.

The "tiles by reflection" the brief invokes is the one that makes Theorem 2's
unfolding proof go through. You reflect the board across the boundary edge the
billiard hits, repeat, and the reflected copies must tile the plane (the
developing map embeds). I implemented that developing map directly
(`reflTiles`, a BFS that places reflected copies and flags the first overlap)
and swept every board.

**Result: reflection-tiling is exactly the rectangles.** Over all multi-cord
boards to n = 12, 32,965 non-rectangles were tested and 0 reflection-tile, while
every rectangle reflection-tiles. Controls behave: rectangles pass, the
P-pentomino fails.

This is a theorem, not just a sweep:

> A polyomino's billiard board reflection-tiles the plane iff it is a
> rectangle.
>
> A non-rectangular polyomino has a reflex corner v (interior angle 270°):
> three of the four unit cells around v are filled, one (call it q) is empty.
> In a reflection tiling q must be covered by reflecting an occupied neighbour
> across the shared edge. q touches occupied base cells only across the two
> grid lines through v. Reflecting the base across the vertical one sends the
> filled cell below-left of v onto the filled cell below-right (already
> occupied, opposite orientation), an overlap. Reflecting across the horizontal
> one overlaps symmetrically. So q cannot be covered consistently and no
> reflection tiling exists. Rectangles have no reflex corner and give the
> standard pmm tiling. QED

So the "reflection-tiling implies balanced" direction is just Theorem 2 restated
(rectangles are balanced), and the converse fails immediately:

**Smallest counterexamples: the two balanced hexominoes (n = 6), L = 2, cords 6
and 6, neither a rectangle, neither reflection-tiles:**

```
#.        ##.
##        ###
##        #..
#.
```

Balanced non-rectangles at the brief's target sizes:

- n = 6: 2 balanced, both non-rectangles (above), both fail reflection-tiling.
- n = 7: 0 balanced (no balanced board at all).
- n = 8: 16 balanced = 1 rectangle (2x4, reflection-tiles) + 15 non-rectangles,
  all failing reflection-tiling.

Up to n = 12 there are 1,891 balanced boards; exactly 4 of them reflection-tile,
and those 4 are precisely the balanced rectangles (2x2, 2x4, 3x3, 2x6). Balanced
is a vastly larger and different class.

Caveat on wording: if "tiles by reflection" is read in a weaker sense (the
polyomino merely admits some monohedral tiling whose adjacencies are
reflections), the class is bigger than rectangles, but that reading does not
rescue the conjecture either, because unbalanced boards such as the P-pentomino
tile the plane reflectively and freely. Under the strict unfolding sense that
the proof actually needs, the answer is clean and complete: rectangles only.

## 2. Why symmetry doesn't characterize balance either

The natural fallback ("the cords are one orbit of the board's symmetry group, so
they're congruent") is sufficient but far from necessary. Over balanced boards
to n = 12 (1,891 of them):

- 1,799 are completely asymmetric (trivial symmetry group). Only 92 have any
  nontrivial symmetry.
- 1,828 are not cord-transitive under their symmetry group. Even the 3x3
  rectangle isn't (its centre cord is fixed, the other two swap); it is balanced
  by Theorem 2, not by symmetry.

So off rectangles, balance is overwhelmingly "accidental": equal cord lengths
produced by the billiard arithmetic, not enforced by any geometric symmetry. The
smallest balanced board, the hexomino `##. / ### / #..`, is fully asymmetric.
Balance is an arithmetic phenomenon, not a tiling or symmetry one. That is the
real correction this survey delivers to the brief.

## 3. Parity lemma and the odd-n collapse

Every cord has even length (0 odd cords among all boards to n = 12).

Consequence: a balanced board has L cords each of length 2n/L, and that must be
even, so L divides n. For odd n this forces L to be an odd divisor at least 3,
which is why balanced boards are absent at n = 5, 7, 11 (prime: would need L = n
cords of length 2, impossible since `max L = floor((n+2)/3)`) and appear at n = 9
only with L = 3. The two odd-n balanced non-rectangles, both at n = 9, both L = 3
with cords 6,6,6:

```
.#.        .##.
##.        ####
###        ##..
.##        .#..
.#.
```

The parity lemma is itself worth stating in the note. It is clean, it explains
the odd-n pattern, and it looks provable from the checkerboard parity of the
weave.

## 4. Length spectrum

| n | multi-cord | balanced | unbalanced | balanced non-rect | longest cord | max imbalance |
|---|-----------|----------|-----------|-------------------|--------------|---------------|
| 4 | 1 | 1 | 0 | 0 | 4 | 1 |
| 5 | 1 | 0 | 1 | 0 | 6 | 3/2 |
| 6 | 7 | 2 | 5 | 2 | 8 | 2 |
| 7 | 22 | 0 | 22 | 0 | 10 | 5/2 |
| 8 | 96 | 16 | 80 | 15 | 12 | 3 |
| 9 | 370 | 3 | 367 | 2 | 14 | 7/2 |
| 10 | 1529 | 152 | 1377 | 152 | 16 | 4 |
| 11 | 6125 | 0 | 6125 | 0 | 18 | 9/2 |
| 12 | 24818 | 1717 | 23101 | 1716 | 20 | 5 |

Exact extremes (n at least 4), all verified to n = 12:

- Minimum cord on any multi-cord board = 4 (a 2x2 corner loop).
- Longest cord on a multi-cord board = 2n - 4, always realized by an L = 2 board
  with cord multiset {4, 2n - 4} (a long strip thickened to a 2x2 at one end).
  The absolute longest over all boards is the trivial 2n, from the 1xn
  monolinear strip.
- Maximum imbalance (longest / shortest) = (n - 2)/2, same {4, 2n-4} witnesses.

Candidate OEIS sequences (searched, none currently in OEIS):

- Balanced multi-cord n-cell polyominoes, n = 1..12:
  `0, 0, 0, 1, 0, 2, 0, 16, 3, 152, 0, 1717`. Not in OEIS. This is the one worth
  submitting; it carries the parity structure (odd-n collapse) and the
  reflection-tiling story.
- Balanced non-rectangles, n = 1..12: `0,0,0,0,0,2,0,15,2,152,0,1716`. Not in
  OEIS (it is the above minus the balanced-rectangle count).
- Longest cord 2n - 4 and max imbalance (n - 2)/2 are linear and trivial, not
  novel.

"Not in OEIS" is weak evidence on its own (per the brief), but the balanced
count is a natural refinement of the already-submitted loop-number census
A397065, so it has a real home.

## 5. Craft tie-in (yarn per colour)

Cord length = yarn length per colour. Per-colour ratios for the named small
pieces:

- Rectangles: every colour equal (Theorem 2). An m x n rectangle uses
  `gcd(m,n)` colours, each `2mn/gcd(m,n)` of yarn.
- Smallest unequal board, the P-pentomino (n = 5), cords 4 and 6: yarn 2 : 3.
- Maximally lopsided n-cell piece uses two colours in ratio
  (2n - 4) : 4 = (n - 2) : 2. At n = 12 that is a 5 : 1 board (one colour does
  almost all the work, the other just rings a 2x2 corner).
- Smallest equal-yarn non-rectangle, the balanced hexomino `#./##/##/#.` (or
  `##./###/#..`): two colours, 1 : 1, on a shape that is not a rectangle.

Suggested one-liner for Section 5 of the Interlace note: Theorem 2 makes every
colour use equal yarn on a rectangle; the smallest board where two colours
differ is the P-pentomino at 2 : 3, and the smallest non-rectangle where they
again come out equal is a hexomino, equal yarn without the symmetry of a
rectangle.

## 6. What to record or prove, and honest caveats

Record: the balanced-count sequence (Section 4), as a refinement of A397065.

Prove (ranked by cleanliness):

1. Parity lemma: every cord has even length. Cleanest, most likely a short
   checkerboard-parity argument; it implies the L divides n constraint and the
   odd-n collapse.
2. Reflection-tiling = rectangle (Section 1), done here modulo write-up; short
   reflex-corner argument. Settles the central conjecture negatively.
3. The {4, 2n - 4} extremal family for longest cord and max imbalance.

Do not chase: a closed form for the full length partition off rectangles.
Balance there is asymmetric and accidental (Section 2); the value is the
characterization questions above and the spectrum extremes, not the messy
general distribution. And "total = 2n" remains trivial; everything real is in
the partition.

The open prize remains open: an intrinsic characterization of which boards are
balanced. It is not "rectangle", not "reflection-tiles", not "a symmetry orbits
the cords". The parity lemma narrows it (L divides n, cords even) but does not
pin it. That gap is the honest state of the question.

## 7. Follow-up: balanced families and the two-cord problem

A second pass (scripts `cord-probe.mjs`, `interweave.mjs`, `family-bud.mjs`, and
two multi-agent hunts) attacked the open prize from the construction side. No
global characterization emerged, but several infinite balanced families and one
strong partial characterization did. All numbers below were independently
re-verified.

### Infinite balanced families (sufficient constructions)

- SCALING. Scale any board by k (each cell -> k x k block). Then cord multiset =
  k copies of {k * len} per original cord (verified, 0 failures). So kP is
  balanced iff P is balanced or monolinear. The one "obvious" family; rare at
  small n (n must be k^2 * m), so it explains only 5 of 1891 balanced boards to
  n=12.
- BAR + BUMP. A 1-wide column of even height with a centered side bump: the two
  cord lengths are LINEAR in bump position, crossing to equal exactly at centre.
  Balanced iff the bump is centred AND its height is congruent 2 mod 4 (then the
  horizontal mirror SWAPS the two cords; at height 0 mod 4 the mirror fixes each
  cord and they stay unequal). Sliding the bump off-centre walks through the whole
  imbalance spectrum, including the extreme {4, 2n-4}.
- FRAMES. A 1-thick m x p rectangular ring (m, p >= 3) always has exactly 2 cords
  and PERFECT interweave; balanced iff m, p are not both odd. When both odd it is
  off by exactly 4 forever (cords n+2, n-2). Verified 144 frames to m,p=14.
- FAMILY G. A c x r rectangle (c even) with a centered domino tab on the bottom;
  balanced iff r odd and gcd(c/2, r) = 1; primitive; verified to n approx 700.
- REFLECTION-DOUBLING. Glue a monolinear shape to its mirror across a right edge
  whose column has an even cell count; gives L=2, each cord n.
- FAMILY BUD (bar + up-stub + down-block; `scripts/family-bud.mjs`). The first
  ASYMMETRIC infinite family: a horizontal bar with a 1-wide vertical stub up and
  a 2-wide block down, placed to balance. Verified 808 members to n=86, all
  primitive, all asymmetric, 0 failures.

Together these still cover under 1 percent of balanced boards.

### Interweave (a second axis, independent of length)

Crossing model ported from app.js getCoveredCrossings. Per crossing, the "/" and
"\" strands belong to cords; an inter-cord crossing locks two colours.
interweave ratio = inter-cord crossings / total crossings.

- SQUARE rectangles and hollow FRAMES achieve ratio 1.00 (every crossing locks
  two colours) = "perfect interweave". Non-square rectangles drop below 1.
- Among 174 balanced boards (n<=10): 3 at ratio 1.0, then 6 at 0.8, 130 at 0.4.
  So balance and tight interweave pull against each other: spindly balanced boards
  (bar+bump) weave loosest (0.40), compact and frame boards weave tightest.
- Craft reading: for a piece that is both even-yarn AND holds together as cloth,
  use a frame with at least one even side, or a compact balanced block.

### Cord congruence (answering "equal length, also equal shape?")

Using doubled-integer coordinates: of 174 balanced boards, the cords are NEVER
pure translates, but 29 (16.7 percent) are congruent up to a D4 isometry,
including both smallest (n=6). The other ~83 percent are equal-length,
genuinely different-shape cords. So balance is overwhelmingly NOT congruence:
a cord-swapping isometry/congruence exists for only ~5 percent of balanced
boards. The 3x3 rectangle is the clean witness (cords 6,6,6, but the centre cord
is not congruent to the two diagonal cords).

### The two-cord problem (where ~96 percent of balance lives)

At n=12 the primitive balanced L-distribution is L2:1649, L3:65, L4:1. So
"which polyominoes split into exactly two equal cords" is essentially the whole
question. Best results:

- NEAR-CHARACTERIZATION (the cleanest lead). Equal NAIL-COUNT per cord (each cord
  passes through the same number of boundary nails) matches L=2 balance EXACTLY
  through n=8, then leaks a small, GROWING set of exceptions: 0 (n<=8), 3 (n=10),
  57 (n=12); over n<=13, 36 false positives + 24 false negatives out of 116622
  L=2 boards. Provably NOT exact and the gap widens with n. The reason is the
  exact decomposition arc_c = nails_c + defect_c, defect_c = sum over straight
  interior runs of (h-2)/2: a cord crossing the interior in a long straight run
  gains length without gaining nails. Balance fails the nail-tie exactly on boards
  with unequal interior straight runs.
- CLEAN LEMMA (reformulation, not a shape characterization). Balance <=> the two
  cords' slope-usage matrix is [[a,b],[b,a]] <=> cord 0 owns as many "/" pieces as
  cord 1 owns "\" pieces. Exact, 0 exceptions, but algebraically equivalent to
  "one cord has length n", so it restates balance rather than predicting it from
  shape.
- REFUTED: no per-cord count statistic (nails, bends, vertices) is sufficient; two
  cords can match on all three yet differ in length by 4. The hidden
  cord-swapping involution does not characterize balance (~95 percent of balanced
  boards have genuinely different-shaped cords).
- OVERFIT WARNING (important methodology note). A rule "equal nail-count OR has a
  hole" looked EXACT through n=12 but BROKE at n=14 (171 failures). Any
  exact-looking balance rule must be checked past n=12 before it is trusted.

Only exactly-necessary cheap condition remains n even (a corollary of the parity
lemma). The honest state: two-cord balance is governed by arc length, which
diverges from every cheap combinatorial count precisely on boards with long
interior straight runs; equal nail-count is the best heuristic but not a theorem.
