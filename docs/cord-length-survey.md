# Cord-length survey (research brief)

Aim of a dedicated session: survey how the length of the cords (strands) is
distributed across non-rectangular polyomino boards, find the clean structure,
and decide what is worth recording (OEIS sequence) or proving (a theorem).

This is the natural follow-on to the monolinear census (A397065, submitted to
OEIS) and to Theorem 2 of the Interlace note (`docs/outreach/interlace-note-draft.md`),
which proves that a rectangle's cords are all EQUAL length. The survey asks
where "equal" breaks and what replaces it.

## The model and the one fixed quantity

A board is a polyomino P. Its mirror curve decomposes into L(P) closed cords.
Measure cord length in **cell-diagonal units**: each cell carries exactly two
unit diagonals (one per family), so the TOTAL length over all cords is always

    total = 2 * (number of cells) = 2n,    exactly, for every shape.

(Confirmed: 2.000 per cell on every shape tested.) So total length is trivial.
The object of interest is the **partition** of 2n among the L cords.

## What is already established (seed data, verified with the engine)

- **Rectangles: all cords equal** (Theorem 2). An m by n rectangle: gcd(m,n)
  cords, each of length 2mn/gcd(m,n) cell-diagonals.
- **Smallest UNBALANCED board: the P-pentomino at n = 5** (2 by 3 minus a corner):

      .##
      ###

  Two cords of lengths **4 and 6** (sum 10 = 2*5). So unequal cords appear the
  instant you leave rectangles. (Craft reading: the two colors use yarn 2:3.)

- **Off rectangles, unbalanced is the norm.** Among boards with >= 2 cords:

      n:           4   5   6   7   8
      multi-cord:  1   1   7  22  96     (= free polyominoes minus monolinear)
      balanced:    1   0   2   0  16     (all cords equal length)
      unbalanced:  0   1   5  22  80

- **Balanced is NOT the same as rectangle.** At n = 6 there are 2 balanced
  multi-cord boards, and no 6-cell rectangle has L >= 2 (1x6 and 2x3 are both
  monolinear). So balanced non-rectangles exist. This is the key opening.

## The central conjecture to test first

The note observes Theorem 2's unfolding proof works "for any board that tiles
the plane by reflection." That direction gives: reflection-tiling board =>
equal cords (balanced). The open and interesting converse:

    CONJECTURE: a board is balanced (all cords equal length)
                if and only if it tiles the plane by reflection.

First job: list the balanced non-rectangles at n = 6, 7, 8 and check whether
each one reflection-tiles. If the conjecture holds, that is a real result and
the cleanest prize here. If it fails, the counterexample is itself interesting.

## Survey questions, ranked

1. **Characterize balanced boards** (theorem shot). Test the reflection-tiling
   conjecture above. Enumerate balanced boards, look at the witnesses.
2. **Length-spectrum sequences** (data shots, each a candidate OEIS entry; search
   OEIS for novelty before claiming anything):
   - number of balanced multi-cord n-cell polyominoes: 1,0,2,0,16,... (n>=4),
   - longest single cord achievable on an n-cell board,
   - maximum imbalance (longest cord / shortest cord) achievable,
   - the full length multiset as a refinement of L(P).
3. **Craft tie-in.** Cord length = yarn per color. Report, for the small named
   pieces, the per-color yarn ratios. Feeds a one-line remark into Section 5 of
   the Interlace note (Theorem 2 gives equal lengths on rectangles; off
   rectangles the smallest unequal board is the P-pentomino, strands 4 and 6).

## How to compute (everything is in this repo)

- Engine: `src/engine.js` attaches `globalThis.TearEngine`. Use
  `getAllCycles(cells, gw, gh).cycles`; each cycle has `.points`; cord length =
  `arcLen(points) / Math.SQRT2` (cell-diagonal units). `cells` is a gh-by-gw
  boolean grid.
- Exact census artifact: `scripts/artifacts/polyomino-loops-16.json` (loop-number
  distribution to n=16). Enumerator: `scripts/polyomino-loops.mjs` (Redelmeier,
  fast). For a quick free-polyomino sweep, a growth+canonical-dedup enumerator in
  Node is fine to about n=13; reuse the one in this repo's history if handy.
- Node only (the sandbox here runs node reliably; python scripts get backgrounded
  and killed, so prefer node).
- Tree-shaped check (used in a sibling result): cell graph is a tree iff
  edges == cells - 1, where edges = number of orthogonally adjacent cell pairs.

## Unit and sanity conventions

- Length unit: cell-diagonal segments. arcLen(points)/sqrt(2). Total per board = 2n.
- Always re-verify total = 2n as a sanity check on any length computation.
- A cord's length is an even or odd integer in these units; confirm integrality.

## Caveats (state these honestly in any writeup)

- General-shape lengths are expected to be messy; do not chase a clean
  number-theoretic formula off rectangles. The value is the balanced-board
  characterization and the spectrum extremes, not the full distribution.
- "Total length = 2n" is trivial. Frame everything as the partition.
- "Not in OEIS" is weak evidence of importance; many natural sequences are simply
  unentered. Search before claiming novelty.

## Context pointers

- OEIS: A397065 (monolinear count) submitted, in review. Difference vs tree
  polyominoes A131482 is a separate noted curiosity (monolinear non-trees).
- Interlace note: `docs/outreach/interlace-note-draft.md` (Theorem 2 is the
  equal-length result this survey extends).
- Census + laws: `docs/polyomino-loop-census.md` (max L = floor((n+2)/3), the
  ~0.952 decay, the L=1/L=2 crossover near n=19).
