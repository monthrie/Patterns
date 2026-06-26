# The Cloth That Computes a gcd

### Closed billiard paths and checkerboard parity in a hand weave

*Authors: João [surname] (the craft), [mathematician co-author name] (the mathematics), and [your name] (the software and the sequence). Three-author submission; surnames and affiliations to be filled. For the anonymized review copy, names become Author 1/2/3 and the craftsman is referred to without his name.*

*Draft for Interlace. Audience: mathematicians. Short note, three figures. No em-dashes anywhere (house rule). Revised after computational verification and an adversarial referee pass; see notes at the end.*

---

## Abstract

A retired Portuguese craftsman, working with no knowledge of the relevant mathematics, developed a weaving technique in which every strand of a finished textile is a single closed 45 degree billiard path on a polyomino board, interlaced over and under by a fixed parity rule. We make the construction precise, prove that the parity rule produces an alternating link (so that each physical piece is a faithful realization of an alternating diagram), and prove the classical companion fact that a rectangular board of m by n cells carries exactly gcd(m, n) strands, all of equal length 2mn / gcd(m, n) unit segments. We close where the mathematics stops: on boards of irregular shape the number of strands has no known closed form, and we record an integer sequence, the count of polyomino boards that yield a single closed strand, which is exact through sixteen cells (over thirteen million boards) and has no match in the OEIS.

---

## 1. A weave with no ends

Figure 1 shows a garment. The eye reads it as an ordinary woven cloth, warp crossing weft, over and under. It is not. An ordinary weave is an army of short threads, each cut at both ends and held captive in a loom. The cloth in Figure 1 has no warp, no weft, no cut ends, no hems, and no stitches. Every strand in it is a single closed loop: a cord that sets off across a nail board, travels at 45 degrees, reflects off the boundary like a billiard ball, weaves over and under everything it meets, and after many crossings returns to its own starting point, where the craftsman splices it to itself so finely that the join cannot be found. Each finished piece is, in the strict sense of knot theory, a physical alternating link, with one component per closed cord.

The craftsman, João, invented the technique alone. He had no contact with the mathematics of mirror curves, with the sona sand drawings of the Chokwe people of Angola (inscribed by UNESCO in 2023 [U1]), or with the work of Gerdes [G1, G2] and Jablan [J1] that we cite below. He arrived at the construction from a tradition of sailors' knot mats and his own experiments, and only afterward did the connection to the published literature become visible. We mention this because the order matters: what follows is a description of an independently developed craft, annotated with the mathematics it turns out to instantiate.

This note isolates the smallest complete mathematical core of that craft. We define the model (Section 2), prove that the interlacing rule yields an alternating link (Section 3), prove the count and the equal-length property for rectangular boards (Section 4), and indicate the open territory the craft also occupies (Section 5).

---

## 2. The billiard model

Let a **board** be a polyomino P, a finite edge-connected union of unit cells in the integer grid. Place the board so its cells are unit squares with integer corners, and write W for its **width**, the number of grid columns it spans (this is the one integer the parity rule of Section 3 will consult). Two families of line segments run across the cells at 45 degrees:

- **Family A** (the rising diagonals), the lines y minus x equal to a half-integer. We index them by an integer k, so family-A line k is the line y minus x equal to k plus one half.
- **Family B** (the falling diagonals), the lines y plus x equal to a half-integer. We index them by an integer m, so family-B line m is the line y plus x equal to m plus one half.

Within each cell of P, one segment of each family crosses the cell. A **crossing** is a point where a family-A segment and a family-B segment meet inside a cell. The crossing of family-A line k with family-B line m sits at

    x = (m minus k) / 2,    y = (m + k + 1) / 2,                          (2.1)

and is realized in the weave precisely when that point lies in the interior of P. Each crossing is therefore labeled by the pair (k, m), and this label is unique. Note that in (2.1) the numerators m minus k and m + k + 1 differ by 2k + 1, an odd number, so they have opposite parity; exactly one of x, y is then a half-integer and the other an integer. In particular **no crossing sits at a lattice point** of the grid (where both coordinates are integers), a fact we will use at corner reflections in Section 3.

A **strand** is a maximal billiard trajectory: start at a boundary gap (the midpoint of a boundary edge of P, which is where João drives a nail), travel along a family-A or family-B segment, and at each boundary edge reflect by the law of equal angles. Because the boundary is a polyomino boundary and the slope is plus or minus one, reflection sends a family-A segment to a family-B segment and back. A strand closes when it returns to its start gap travelling in its start direction. The set of all strands partitions the cells of P and covers every gap exactly once. We write L(P) for the number of strands, and we call the board **monolinear** when L(P) = 1, a single closed cord covering it.

This is the standard mirror-curve model of Gerdes and Jablan [G1, J1]; we have only fixed an indexing convenient for the next two proofs.

---

## 3. The interlacing rule is alternating

At each crossing one cord passes over and one passes under. João fixes this by a single parity rule, which in the simulator we have built with him reads as follows. With W the board width of Section 2, at the crossing (k, m):

- a **family-A** cord passes **under** when k + m + W is **odd**;
- a **family-B** cord passes **under** when k + m + W is **even**.

The rule is consistent: at every crossing exactly one family is under and the other is over, since the two conditions are complementary in the parity of k + m + W. Note that the rule is **asymmetric** between the two families, A keyed to odd and B to even. Theorem 1 shows that this asymmetry is exactly what is required.

A link diagram is **alternating** if, travelling along any component, no two consecutive crossings are of the same type (over or under). We use the convention of the tracer for reflections: a bounce off a horizontal wall negates the vertical step (dy goes to minus dy), a bounce off a vertical wall negates the horizontal step (dx goes to minus dx), and a hit at an exact corner negates both.

> **Theorem 1.** For every board P, the interlacing rule above makes the union of strands an alternating diagram. Consequently every finished piece is an alternating link.

**Proof.** Travel along a single strand. It is a concatenation of straight diagonal runs joined by boundary reflections. We show the under/over state, read off by the parity rule, flips at each step, in four cases, and then that the strand closes without clash.

**(a) Within a straight run.** Suppose the strand is on family-A line k, so k is fixed for the whole run. As the cord advances along this rising diagonal it meets the falling diagonals of family B. Successive family-B lines m and m + 1 meet the cord, by (2.1), at points whose x-coordinates are (m minus k)/2 and (m + 1 minus k)/2, exactly one half unit apart, with no family-B line strictly between. Hence along a family-A run the cord meets family B in **consecutive index order**: m, m + 1, m + 2, and so on. (This is precisely the inner loop of the simulator, which walks the transverse index by ones along a fixed line.) At these crossings k + m + W increases by one each step, so its parity flips at every crossing; the family-A under condition, that k + m + W be odd, holds at every other one: under, over, under, over. A family-B run is identical with the roles of k and m exchanged: m is fixed, the cord meets family A in consecutive order k, k + 1, k + 2, the sum flips parity each step, and the family-B condition (sum even) selects every other crossing. So the states alternate inside every straight run.

**(b) Across a reflection off a vertical wall.** Let the wall be x equal to c with c an integer, and let the cord reflect at the boundary point (c, h). The incoming cord is on family-A line k, so h minus c equals k plus one half, that is

    2h = 2c + 2k + 1.                                                     (3.1)

Reflection off a vertical wall negates dx and preserves dy, sending the rising diagonal to a falling diagonal: the outgoing cord is on some family-B line m', with h plus c equal to m' plus one half, so by (3.1),

    m' = h + c minus 1/2 = k + 2c.                                        (3.2)

The last crossing before the wall lies on the incoming line k at the largest m with x strictly less than c; by (2.1), x less than c means m less than k + 2c, so m_last = k + 2c minus 1 and k + m_last + W = 2k + 2c minus 1 + W. The first crossing after the wall lies on the outgoing line m' = k + 2c; by part (a) the nearest family-A line on the far side is k_first = k + 1, giving k_first + m' + W = 2k + 2c + 1 + W. The two sums differ by 2, hence have the **same parity**. On its own, equal parity would repeat the under condition. But the cord has changed family at the wall, from A to B, and the under rule changes with it: the incoming crossing is under iff its sum is odd (family A), the outgoing crossing is under iff its sum is even (family B). With sums of equal parity, exactly one of those holds, so the two under states are **opposite**. Alternation survives the vertical reflection.

**(c) Across a reflection off a horizontal wall.** We write this out rather than appeal to symmetry. Let the wall be y equal to c with c an integer, and let the cord reflect at (h, c), incoming on family-A line k, so c minus h equals k plus one half, that is

    2h = 2c minus 2k minus 1.                                            (3.3)

Reflection off a horizontal wall negates dy and preserves dx, again sending a rising diagonal to a falling diagonal: the outgoing cord is on family-B line m', with c plus h equal to m' plus one half, so by (3.3),

    m' = c + h minus 1/2 = 2c minus k minus 1.                            (3.4)

The last crossing before the wall lies on line k. As the cord approaches y equal to c from below, by (2.1) the crossing's y-coordinate increases with m, and y less than c means m less than 2c minus k minus 1, so m_last = 2c minus k minus 2 and k + m_last + W = 2c minus 2 + W. The first crossing after the wall lies on m' = 2c minus k minus 1; by part (a) the nearest family-A line on the far side is k_first = k minus 1, giving k_first + m' + W = 2c minus 2 + W. Here the two sums are **equal**, hence of the same parity. As in case (b), equal parity together with the family swap from A to B (which switches the under rule from odd to even) forces the two under states to be **opposite**. Alternation survives the horizontal reflection. (The families' roles may be interchanged throughout (b) and (c): an incoming family-B cord reflects to family A, the algebra is identical, and the swap from even to odd again flips the under state.)

**(d) Across a corner hit.** Suppose the trajectory strikes an exact corner of the boundary, where a horizontal edge meets a vertical edge; the tracer negates both dx and dy, so the cord reverses and retraces its incoming line in the opposite sense. By Section 2 a corner sits at a lattice point, which carries **no crossing**. So the bounce introduces no crossing of its own, and the family does **not** change (the cord stays on its incoming line). After the reversal the cord re-meets the same nearest transverse diagonal it last crossed, which is the next one in reversed consecutive order, so k + m + W changes parity by one across the bounce. A one-step parity flip with the under rule held fixed flips the under state. This holds identically at a convex corner (the tip of one cell) and a concave corner (the inside of a notch): in both the reflecting point is a lattice point with no transverse segment. Alternation survives a corner hit.

**(e) Closure.** The strand is a closed loop, so its crossings form a cyclic sequence c(1), c(2), ..., c(N) with c(N+1) = c(1). The transitions analysed in (a) through (d) are local, and there is nothing special about the transition from c(N) back to c(1): it too is a step within a run, a wall reflection, or a corner reversal, hence also a flip. A cyclic sequence in which every consecutive pair of states differs returns to its starting value only if the number of transitions is even; since the under/over state at c(1) is single-valued, N is even and the loop closes with a genuine flip between c(N) and c(1). There is no clash at the splice, and the closed strand is alternating end to end.

Combining (a) through (e), the over and under states alternate along every strand, and since this holds for every strand the whole diagram is alternating. Each physical piece therefore admits an alternating diagram and is an alternating link, with one component per closed cord. **QED.**

*Verification.* We checked Theorem 1 computationally on 39 boards (rectangles, L-shapes, T and plus shapes, rings with a rectangular hole, the diagonal staircases of Section 5, and irregular polyominoes), 116 strands, 2429 distinct crossings: every strand strictly alternating, including across bounces and at closure, with zero exceptions. A coverage self-check confirmed each crossing is met exactly twice, once by each family, so no crossing is missed or double counted.

**A remark.** When the diagram is reduced (no nugatory crossing, that is, no crossing whose removal by a twist disconnects the diagram), alternation makes it a minimal-crossing diagram of its link, by the Tait conjecture proved by Kauffman, Murasugi and Thistlethwaite; see Cromwell [T1]. The over-one under-one structure is also the plain-weave binding of textiles. We note these connections without resting any later claim on them.

**Two representations, one strand.** A word on why "along a strand" is unambiguous, since the construction lives on two grids. The billiard tracer records each strand as a polyline of boundary-to-boundary runs: it stores only where the cord meets the boundary (nails and bounce points), not the interior crossings. The over/under rule, by contrast, is laid on the diagonal-grid crossings (2.1). These do not conflict: one boundary-to-boundary run is a straight diagonal segment of one family, and the crossings it carries are exactly the transverse lines it cuts, in the consecutive order of part (a). A strand, as a billiard cycle, is therefore the concatenation in travel order of the diagonal-grid segments it occupies, and the cyclic list c(1), ..., c(N) above is well defined as that concatenation, independent of which representation one starts from.

---

## 4. A rectangle counts its own gcd

The simplest boards are rectangles, and here the number of strands is forced by elementary number theory.

> **Theorem 2.** A rectangular board of m by n cells carries exactly gcd(m, n) closed strands, all of equal length, namely 2mn / gcd(m, n) unit diagonal segments each.

This count is classical. It is Gerdes' loop count for plaited-mat and sona designs [G1, G2], and the rectangular case of arithmetic billiards in the sense of Steinhaus and, more recently, Perucca and collaborators [P1]. The unfolding proof below makes both the count and the equal-length claim fall out of one orbit count.

Place the board as the rectangle [0, n] by [0, m], n cells wide and m cells tall.

**Unit diagonal segments.** Inside each of the mn cells pass exactly two unit diagonal segments, one of each family, so there are 2mn unit diagonal segments in the board, and each strand is a cyclic sequence of such segments joined at crossings and boundary gaps.

**Unfolding.** Reflect the rectangle repeatedly across its edges. Reflections in the two vertical edges generate translation by 2n in x, reflections in the two horizontal edges generate translation by 2m in y, so the reflection group is the lattice Λ = 2nℤ × 2mℤ, with the four copies {original, x-flip, y-flip, xy-flip} a fundamental domain. A 45 degree billiard trajectory lifts to a single straight line of slope one: each boundary reflection is undone by passing into the adjacent reflected copy, where the path continues straight. Quotienting by Λ, the trajectory becomes a closed slope-one geodesic on the flat torus T = ℝ² / (2nℤ × 2mℤ).

**A discrete model.** Sample the slope-one line once per unit diagonal segment. The dynamics reduce to the single step

    s : (x, y) ↦ (x + 1, y + 1)   on   ℤ/2n × ℤ/2m,

the advance by one unit diagonal. The 4mn points of ℤ/2n × ℤ/2m are the segment-centers of the four reflected copies. The map s is a translation of a finite abelian group, hence a bijection, and its orbits partition the points into cycles of equal length, the order of s.

**Orbit length.** The order of translation by (1, 1) on ℤ/2n × ℤ/2m is the least r > 0 with r ≡ 0 (mod 2n) and r ≡ 0 (mod 2m), that is

    r = lcm(2m, 2n) = 2 · lcm(m, n) = 2mn / gcd(m, n).

Every orbit has exactly 2mn / gcd(m, n) points.

**Parity classes and the strand count.** Color each segment-center (x, y) by the parity of x + y. The step s adds (1, 1), changing x + y by 2, so it preserves this color: each orbit lies entirely in one class. Each class holds 2mn of the 4mn points, and since every orbit has length 2mn / gcd(m, n), each class splits into exactly

    2mn / (2mn / gcd(m, n)) = gcd(m, n)

orbits. The physical board is one reflected copy, that is, one parity class, and its strands are exactly the orbits of s in that class. Hence the board carries gcd(m, n) strands. (We confirmed this against the simulator's exhaustive strand trace for all rectangles up to 12 by 12, with perfect agreement on both the count and the lengths below.)

**Equal length.** Because s is a single translation, all of its orbits have the identical length 2mn / gcd(m, n). Each strand is therefore composed of exactly 2mn / gcd(m, n) unit diagonal segments, every segment of Euclidean length √2, so each strand has arc length (2mn / gcd(m, n)) · √2, independent of which strand it is. The rectangle does not merely split into gcd(m, n) pieces; it splits into gcd(m, n) **congruent** pieces. ∎

Three corollaries the craftsman uses daily. A board whose sides are coprime is monolinear, a single cord of length 2mn · √2; for the 17 by 10 board, gcd is one, a lone cord crossing the whole field. A square board of side n splits into exactly n strands, the maximally fragmented rectangle, each of length 2n · √2. And since each strand can be dyed its own color, the count gcd(m, n) is the number of colors a rectangular piece can carry: the cloth computes the greatest common divisor of its own dimensions and offers it back as a palette. For the 15 by 10 board the answer is five.

---

## 5. Where the mathematics stops

Theorem 2 is the whole story for rectangles, and by the same unfolding for any board that tiles the plane by reflection. It is not the story for boards of general shape. For an arbitrary polyomino, with notches, arms, or holes, no closed form for L(P) is known; the problem of counting the strands of a general mirror curve without tracing it was still being posed as open as recently as 2020 [Y1]. The only clean general result is a scaling law, L(kP) = k · L(P) for the k-fold dilation [Y1, G2]. These irregular boards are exactly where João prefers to work, because their strand counts, and so their color counts, cannot be predicted by eye.

Using the simulator we computed L(P) for every free polyomino up to sixteen cells, over thirteen million boards, validating the result against the OEIS polyomino counts, against Theorem 2 on every rectangle, and against the scaling law on every shape in range, with zero violations. Two byproducts are relevant here.

First, let a(n) be the number of free polyominoes of n cells that are monolinear. Exactly enumerated, the sequence begins

    1, 1, 2, 4, 11, 28, 86, 273, 915, 3126, 10948, 38782, 138719, 499351, 1808081, 6576500   (n = 1 to 16).

A search of the On-Line Encyclopedia of Integer Sequences returned no match as of June 2026, although the encyclopedia recognizes the underlying polyomino counts at once. We have since submitted the sequence to the OEIS, where it is under editorial review [OEIS A-number to be inserted on acceptance]. The monolinear fraction declines slowly with n, from 0.92 at n = 5 to 0.50 at n = 16, with the per-cell ratio a(n+1) free-fraction over a(n) free-fraction sitting at about 0.953 across n = 8 to 16; we offer no asymptotic. A Markov-chain sampler, uniform over fixed n-cell polyominoes and calibrated against the exact fractions above (it reproduces them to within 0.2 percentage points for every n from 12 to 16), indicates the decline continues just past exact reach: the monolinear fraction falls to roughly 0.48, 0.46, and 0.44 at n = 17, 18, and 19, while the two-strand fraction rises to meet it, near 0.41, 0.42, and 0.42. The two cross near n = 20, beyond which a board is more likely to need two strands than one, and monolinearity ceases to be the common case. We report these sampled values as indicative only: the sampler cannot reach the rare, highly fragmented boards, so we draw no conclusion about the tail of the distribution, and the integer sequence above is kept to the exactly enumerated range.

Second, the most fragmented boards are the diagonal staircases. Through n = 16 the maximum strand count over all n-cell polyominoes is exactly floor((n + 2) / 3), first attained at n = 3k minus 2 by the k-step staircase, and there uniquely (one shape attains it at n = 7, 10, 13, 16). The staircase's strands never cross one another, which is why it fragments maximally: crossings are what fuse strands. So the mathematical extreme is, as cloth, inert, a row of separate diamonds with no weave at all. The boards worth weaving live at the opposite end, where the strands bind.

---

## Figures

1. João wearing the jacket, an alternating link one can wear. (`letter-photos/1-jacket-worn-alternating-link.jpg`)
2. The simulator's billiard trace beside the same board woven in cotton, the two representations of Section 3 made visible. (`letter-photos/2-app-trace-vs-cotton-twin.jpeg`)
3. A two-color board: gcd equal to two, the two strands black and white, the recurring interlocking pattern of Theorem 2. (`letter-photos/5-two-cycle-pattern-bw.jpg`)

---

## Declaration of methods and assistance

*[To finalize once the mathematician co-author has independently verified and written the mathematics, so that this statement is exactly true.] The computational results in this note were produced with the authors' own billiard-weave engine and standard polyomino enumeration and Markov-chain sampling code, all available as supporting material and reproducible from the cited scripts. The proofs were verified by the authors and, where stated, by independent computation. Generative AI was used to assist with drafting and exposition; it was not relied upon as a source of mathematical results. This declaration is included per the journal's policy on AI use.*

## References

[G1] P. Gerdes, *Sona Geometry from Angola: Mathematics of an African Tradition*. Polimetrica, Monza, 2006.

[G2] P. Gerdes, *Lunda Geometry: Mirror Curves, Designs, Knots, Polyominoes, Patterns, Symmetries*. Lulu, 2008.

[J1] S. Jablan, L. Radović, R. Sazdanović, A. Zeković, "Mirror-curves and knot mosaics." arXiv:1106.3784, 2011.

[T1] P. R. Cromwell, *Knots and Links*. Cambridge University Press, 2004 (Chapter 9, alternating knots). The Tait minimality conjecture invoked here was proved by L. H. Kauffman, *Topology* 26 (1987) 395-407; K. Murasugi, *Topology* 26 (1987) 187-194; M. B. Thistlethwaite, *Topology* 26 (1987) 297-309.

[P1] H. Steinhaus, *Mathematical Snapshots*. Stechert, New York, 1938 (Dover reprint, 1999); A. Perucca, "Arithmetic billiards," *Plus Magazine*, 2018; A. Perucca, J. dos Reis Santos, P. Sousa, "Arithmetic billiards," *Recreational Mathematics Magazine*, 2022, DOI 10.2478/rmm-2022-0003.

[Y1] M. Yuan, "Polyomino Loops." *The Startup* (Medium), February 2020. An online essay, not a refereed publication; cited as such.

[U1] UNESCO Intangible Cultural Heritage, "Sona, drawings and geometric figures on sand" (Angola, inscribed 2023), listing 01994.

---

## Notes to self (not for submission)

- **MASTER PRE-SUBMISSION TASK LIST: `docs/outreach/verification-dossier.md`** (the mathematician co-author's guide). Both theorems independently re-verified with fresh code that shares no logic with the engine (Theorem 1: 0 exceptions over 26 boards + 5000 random; Theorem 2: three independent methods agree over 196 rectangles; census reproduced from scratch to n=13). The dossier holds the per-theorem steps to re-derive by hand, exact reproduce-it-yourself commands, an honest provenance account, and the punch-list (whose items are mirrored in these notes).
- Co-authorship: THREE authors (João = the craft, [mathematician] = the mathematics, [you] = software + the sequence). Fill surnames/affiliations, decide order. The mathematician co-author re-derives and REWRITES Sections 3 and 4 in her own words; this is what makes the mathematics authentically the authors' and the AI declaration true.
- Monolinear sequence a(n) SUBMITTED to the OEIS (June 2026), under review. Insert the assigned A-number in Section 5 once the draft entry is live. Consider also submitting the L=2 sequence (1,1,7,21,93,348,1426,5577,22142,87006,342659,1343606,5264430).
- [T1]: Cromwell is a safe textbook anchor; verify the exact chapter/page and confirm the Kauffman/Murasugi/Thistlethwaite page numbers against the originals before print. These are not yet in docs/references.md; add them there once verified.
- Theorem 1 (for the rewrite): add one sentence allowing zero-crossing components (a cord enclosing a hole that meets no other cord is a valid link component but only vacuously alternating; the pinwheel board has one). And re-derive by hand the post-bounce offset k_first = k+1 (vertical) / k-1 (horizontal), currently confirmed only computationally. See dossier section 2 and the punch-list.
- Theorem 2 reduction NEEDS REWORK (independent re-check found a coordinate trap): the draft's "physical board = one parity class" via (px,py) parity is wrong-framed, because the physical coordinates are the 45-degree-rotated image of the model's integer index frame. Replace with the group-theoretic version (s-orbits = cosets of <(1,1)> in Z/2n x Z/2m; the map (x,y)->x+y mod 2 is constant on each coset; each parity class holds 2mn/r = gcd(m,n) orbits; both classes symmetric, so it does not matter which is "physical"). Verified for all m,n <= 24. Also add 1-2 sentences making the unfolding-to-torus and per-segment sampling explicit. The COUNT and the LENGTH are correct; only the prose of the reduction step needs fixing. Full clean version in dossier section 2.
- Verification + sampler artifacts: `scripts/verify-alternation.mjs` and `scripts/recheck-theorem1.mjs` (Theorem 1, two independent verifiers, 0 exceptions), `scripts/recheck-theorem2.mjs` + `recheck-theorem2-proofsteps.mjs` (Theorem 2, three-way + step-by-step), `scripts/recheck-sequence.mjs` (independent census enumerator), `scripts/sample-census-uniform.mjs` + `scripts/artifacts/sample-census-uniform.json` (calibrated MCMC, n=16..19), `scripts/artifacts/polyomino-loops-16.json` (exact census), `scripts/artifacts/census-16-predictions.md` (pre-registered prediction, passed).
- Figures: confirm the three image files are print-resolution; Figure 2 is the load-bearing one for an Interlace audience. A fourth figure (the parity sheet alone) is optional if space allows.
- Optional methodological aside for Section 5: the n=16 row was predicted in advance (P(L=1) 50.2%, max L 6, staircase unique) and confirmed exactly, evidence the regularities are law-like rather than noise. Include only if it does not bloat the note.
