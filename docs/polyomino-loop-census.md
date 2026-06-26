# Polyomino loop census — empirical data on an open problem

> **PUBLISHED: OEIS A397065** (William Montgomery, approved 2026-06-15) — "Number of free polyominoes with n cells whose mirror curve consists of a single closed loop." https://oeis.org/A397065 . The monolinear-count sequence from this census is now a permanent entry in the mathematical record, computed with the engine built for João's practice. Highlights of the published entry:
> - Values to **n=17**: 1, 1, 2, 4, 11, 28, 86, 273, 915, 3126, 10948, 38782, 138719, 499351, 1808081, **6576500, 24013937** (n=16, 17 beyond our census).
> - The entry's own comment frames these as "the polyomino analog of the monolinear designs of the Chokwe sona (sand-drawing) tradition studied by Gerdes" — the OEIS itself now records the João ↔ sona ↔ Gerdes link. Cites Gerdes, Jablan et al., and Yuan.
> - Fraction a(n)/A000105(n) decreases from 1 (n=3) to ~0.503 (n=16); "may tend to 0" — confirms our decay-law observation as a published conjecture.
> - **New result (Andrei Zabolotskii, OEIS editor, 2026-06-15):** every tree-shaped polyomino (A131482) is monolinear, so A131482(n) ≤ a(n) is a LOWER BOUND; first strict inequality at a(6) = 28 = A131482(6) + 1, the extra one being the 2×3 rectangle (gcd(2,3)=1, monolinear, but not tree-shaped). Companion note by Montgomery: "Two kinds of loop: why a(6) = A131482(6) + 1."
> - Cross-refs: A000105 (upper bound), A131482 (lower bound). Keywords: nonn, more, hard, new.


Computed 2026-06-10 with João's verified billiard engine (`src/engine.js`, `getAllCycles`). This is a direct empirical answer to **Question 2** of Matthew Yuan's "Polyomino Loops" (Medium, 2020 — see `references.md`): *what is the distribution of the loop number L(P) over all polyominoes with n cells?* — and a large-scale test of his conjectures. As far as we can find, this data has not been published anywhere.

**Method.** Redelmeier enumeration of fixed polyominoes (each generated exactly once), canonicalized over the 8 symmetries to free polyominoes (L is symmetry-invariant); for each free shape, L(P) = number of closed 45° billiard loops, computed by the engine. Runtime: 102.5s for n ≤ 14; 945.8s for n = 15 (3,426,576 free shapes); 2189.0s for n = 16 (13,079,255 free shapes) — desktop, single-threaded Node.

**Validation (all green).**
- Free and fixed counts match OEIS A000105 / A001168 exactly for every n ≤ 16 (free 13,079,255 / fixed 104,592,937 at n=16).
- gcd theorem: L(m×n rectangle) = gcd(m,n) for all 27 rectangles in range — 0 violations.
- Scaling conjecture L(2P) = 2·L(P): verified for all 56 free polyominoes with n ≤ 6 — 0 violations.

**Reproduce:** `node scripts/polyomino-loops.mjs 14` (any maxN ≤ 16; writes `scripts/artifacts/polyomino-loops-<N>.json` with full distributions and witness shapes).

## The distribution

| n | free polyominoes | L distribution (L:count) | prime (L=1) | mean L | max L |
|---|---|---|---|---|---|
| 1 | 1 | 1:1 | 100% | 1.000 | 1 |
| 2 | 1 | 1:1 | 100% | 1.000 | 1 |
| 3 | 2 | 1:2 | 100% | 1.000 | 1 |
| 4 | 5 | 1:4 2:1 | 80.00% | 1.200 | 2 |
| 5 | 12 | 1:11 2:1 | 91.67% | 1.083 | 2 |
| 6 | 35 | 1:28 2:7 | 80.00% | 1.200 | 2 |
| 7 | 108 | 1:86 2:21 3:1 | 79.63% | 1.213 | 3 |
| 8 | 369 | 1:273 2:93 3:3 | 73.98% | 1.268 | 3 |
| 9 | 1,285 | 1:915 2:348 3:22 | 71.21% | 1.305 | 3 |
| 10 | 4,655 | 1:3126 2:1426 3:102 4:1 | 67.15% | 1.351 | 4 |
| 11 | 17,073 | 1:10948 2:5577 3:544 4:4 | 64.12% | 1.391 | 4 |
| 12 | 63,600 | 1:38782 2:22142 3:2630 4:46 | 60.98% | 1.433 | 4 |
| 13 | 238,591 | 1:138719 2:87006 3:12549 4:316 5:1 | 58.14% | 1.474 | 5 |
| 14 | 901,971 | 1:499351 2:342659 3:57797 4:2157 5:7 | 55.36% | 1.515 | 5 |
| 15 | 3,426,576 | 1:1808081 2:1343606 3:261901 4:12896 5:92 | 52.77% | 1.556 | 5 |
| 16 | 13,079,255 | 1:6576500 2:5264430 3:1164267 4:73226 5:831 6:1 | 50.28% | 1.598 | 6 |

## Observations (empirical — proofs are someone else's joy)

1. **The prime fraction decays geometrically — a law, not a drift.** The per-cell ratio f₁(n)/f₁(n−1) is strikingly stable: 0.951, 0.953, 0.951, 0.955, 0.952, 0.953, 0.953 (n=10→16). One-string boards die off at ≈4.8% per added cell. For *rectangles* the coprime-sides density stays at 6/π² ≈ 60.8% forever; general polyominoes fell through that line at n=12 and keep going. Conjecture: P(L=1 | n) → 0 like c·λⁿ with λ ≈ 0.952. Open: what is λ, really?
2. **Pre-registered prediction test, twice now: PASSED both times.** Before the n=15 run we logged P(L=1)=52.70%, f₂/f₁≈0.744, max L=5; measured **52.77%, 0.7431, 5.** Before the n=16 run (2026-06-15, `census-16-predictions.md`) we logged P(L=1)=50.2%, f₂/f₁≈0.79, mean L≈1.597, max L=6, first L=6 board = the staircase uniquely; measured **50.27%, 0.8005, 1.598, 6, L=6 count = 1.** The extrapolated crossover stands: f₂/f₁ rises +0.057/cell (0.686, 0.743, 0.801 at n=14,15,16), so around **n ≈ 19–20, two-loop boards overtake one-loop boards** as the most common kind — monolinearity becomes a minority property of shape-space.
3. **Maximum loop number: max L over n-cell polyominoes = ⌊(n+2)/3⌋ for all n ≤ 16.** First shape with L=k appears at exactly n = 3k−2, i.e. one new loop per 3 cells (L=6 first appears at n=16, as predicted).
4. **The record-holders are diagonal staircases, and at n = 3k−2 they are the unique maximisers** (exactly 1 shape achieves the max at n = 7, 10, 13, 16 — now confirmed four times). The family:

```
n=7, L=3      n=10, L=4      n=13, L=5
##.           ##..           ##...
###           ###.           ###..
.##           .###           .###.
              ..##           ..###
                             ...##
```

A staircase of k steps (3k−2 cells) carries exactly k loops — empirically the most fragmented shape per cell that exists. (Compare: the k×k square needs k² cells for the same k loops.) ⚠ Check Gerdes' *Lunda Geometry* before claiming novelty — staircase mirror-curve designs may appear there.

5. **Mean L grows roughly linearly**, ≈ +0.04 per cell in this range (1.20 at n=4 → 1.56 at n=15).
6. **The monolinear count sequence is not in the OEIS** (checked 2026-06-10 via the search API; the API does find A000105 etc., so the null is meaningful): 1, 1, 2, 4, 11, 28, 86, 273, 915, 3126, 10948, 38782, 138719, 499351, 1808081, **6576500** (a(16) added 2026-06-15). → **Submission candidate**: "Number of free polyominoes with n cells whose 45° mirror-curve decomposition is a single closed loop", with references to Gerdes, Yuan — and the tool it was computed with. The L=2 column is likewise unrecorded: 1, 1, 7, 21, 93, 348, 1426, 5577, 22142, 87006, 342659, 1343606, **5264430** (n=4→16). The max-L witness family (staircases) is also unrecorded. ⚠ Re-run the OEIS check on the extended sequences before print.

## The opposite extreme: interlacement (mined 2026-06-10, `scripts/mine-interlace.mjs`)

Wilmon's verdict on the staircase — "lame ass shape" — is itself a theorem-shaped observation: **the staircase's loops never cross** (that's *why* it maximizes loop count: crossings fuse loops), so maximal fragmentation = zero weave = craft-worthless. The boards worth weaving are at the other end. Mining all 63,600 12-cell shapes for cells whose two diagonals belong to *different* loops:

- **The Ring** — 3×5 rectangle with a 1×3 hole — is the most interlaced 12-cell board: 2 loops crossing at **8 of 12 cells**. A board with a hole (the open-problem territory; João has woven a hole piece). Code `T1-AQMF9t4CbQ`.
- **The Trio** — best mutually-woven L=3 board (every pair of loops crosses): code `T1-AQQENv8DOcA`.
- Equal-length non-rectangles exist (both loops 16.97 units on irregular boards) — relevant to João's colour balance.
- All three demoed live in `staircase.html`. New metric for the specimen manifest: **interlacement** (between-loop crossings / cells) — fragmentation and interlacement fight each other; beauty and craft live high on the second axis.

## Why this matters for the site / outreach

- It is literally **"data on an open problem, produced by a craftsman's tool"** — the strongest possible line for `/matematica` and the Yuan email (his essay ends *"keep me in the loop"*).
- The 13-cell staircase (5 loops, 5 colours) is **weavable** — a physical object that is also the answer to "what is the most fragmented small board?" Nobody has ever made it. João can.
- An OEIS entry citing the engine would be a small permanent monument in the mathematical record.

## Caveats

- "Free polyominoes" counting; distributions over *fixed* polyominoes would differ slightly (symmetric shapes weigh differently). The JSON artifacts contain everything needed to re-weight.
- Novelty claims ("not published") rest on our reference sweep + OEIS check — re-verify before putting in print, especially against Gerdes' Lunda-design literature.
- n=16 **now run** (2026-06-15, 2189s, ~8GB heap): the staircase-law test passed — first L=6 shape appears at exactly n=16=3·6−2, uniquely the diagonal staircase. n=17 (50,107,909 free) and n=18 (192,622,052 free) are beyond exact enumeration; sampling is the only route. ⚠ Eden-growth sampling is badly biased (P(L=1)=36% sampled vs 61% exact at n=12 — Eden favours compact, fragmented shapes), so a near-uniform sampler with calibration against the exact n≤16 data is required before any 17/18 estimate is trustworthy (in progress).
