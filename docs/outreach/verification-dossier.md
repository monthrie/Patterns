# Verification dossier: "The Cloth That Computes a gcd"

*Prepared for the incoming mathematician co-author. Everything here is meant to be re-derived and re-checked by you, not taken on trust. The point of this document is honesty: when your name goes on the note, the mathematics should be yours, derived and written in your own words, and every number should be one you have reproduced from a clean checkout.*

Draft under review: `docs/outreach/interlace-note-draft.md` ("The Cloth That Computes a gcd").
Engine: `src/engine.js` (`globalThis.TearEngine.getAllCycles(cells, gw, gh)`).
Over/under rule as actually rendered: `src/app.js`, function `weaveLines` (~lines 876 to 986).

---

## 1. What you are being asked to verify and own

The note makes two mathematical claims and one computational claim. **Theorem 1** says the craftsman's parity rule for which cord goes over and which goes under (family A under iff `k+m+W` is odd, family B under iff `k+m+W` is even, with `W` the board width) makes every finished piece an alternating link: travelling along any single closed cord, the over/under states strictly alternate through straight runs, wall bounces, corner reversals, and across the closing splice. **Theorem 2** says a rectangular board of m by n cells carries exactly `gcd(m,n)` closed strands, all of identical length `2mn/gcd(m,n)` unit diagonal segments. The **computational claim** (Section 5) is the monolinear census: `a(n)` = the number of free n-cell polyominoes that resolve to a single closed strand is `1,1,2,4,11,28,86,273,915,3126,10948,38782,138719,499351,1808081,6576500` for n = 1..16, exact over all thirteen million boards, with no match in the OEIS. You are asked to independently re-derive both proofs and rewrite them in your own words (the draft's Section 3 and Section 4 are starting points, not text to sign as-is), to personally own the load-bearing identities listed below, and to confirm the census numbers by rerunning the code. The proofs in this note were drafted with AI assistance and then re-checked by independent code (described in Section 4 below); that is corroboration, not authorship. The work becomes genuinely yours only once you have done the derivations yourself.

---

## 2. The two theorems

### Theorem 1 (the weave is alternating)

**Statement.** For every polyomino board P, under the asymmetric parity rule (family-A cord under iff `k+m+W` odd, family-B cord under iff `k+m+W` even), the union of strands is an alternating diagram, and hence each finished piece is an alternating link with one component per closed cord.

**Draft proof.** `interlace-note-draft.md`, Section 3, cases (a) straight run, (b) vertical wall, (c) horizontal wall, (d) corner, (e) closure.

**Independent-check verdict.** Confirmed. A fresh verifier (`scripts/recheck-theorem1.mjs`) that never calls the engine's tracer builds the link diagram crossing-by-crossing from cell geometry, walks each cord with its own reflection test, assigns over/under from the parity rule, and checks strict alternation including the closure wrap. Result: 26 hand-picked boards (large coprime rectangles 17x10 and 13x11, gcd-4 boards, staircases to 19 cells, asymmetric Ls, multi-hole boards, swiss cheese, pinwheel, plus, rings, irregulars), 67 strands, 1960 crossings, **0 exceptions**, plus 5000 random connected polyominoes across two seeds (2000 at seed 12345, 3000 at seed 99), **0 exceptions**. The over/under bit the verifier assigns is byte-identical to the actual `weaveLines` cut decision in `app.js` (`(k+m+W)%2===1` for rising cords, `===0` for falling), so it verifies the rendered weave, not a re-invented rule. The prior verifier's numbers also reproduce exactly (39 boards, 116 strands, 2429 crossings, 0 exceptions).

**Steps you should personally re-derive (do not trust code for these):**

1. **The two wall-reflection identities.** Vertical wall at `x=c`: incoming on family-A line k gives outgoing family-B line `m' = k + 2c`, and the pre- and post-bounce parity keys differ by 2 (same parity). Horizontal wall at `y=c`: outgoing `m' = 2c - k - 1`, and the keys are **equal**. These are the load-bearing identities of the whole theorem.
2. **Why the family swap saves alternation.** Same-parity (or 2-apart) keys would *repeat* the under-condition if the rule were symmetric. The cord changes family A to B at the wall, and the rule is keyed asymmetrically (A to odd, B to even), so equal/2-apart parity now selects the *opposite* under-state. This asymmetry is the entire content of Theorem 1 and is the part most worth owning by hand.
3. **No crossing at a corner.** From `x=(m-k)/2`, `y=(m+k+1)/2` the numerators differ by `2k+1` (odd), so exactly one of x, y is a half-integer; a lattice point (both integer) therefore carries no crossing. Case (d) depends entirely on this.
4. **The closure parity argument (e).** A cyclic 0/1 sequence in which every adjacent pair differs forces even length and a clean wrap. Trivial but load-bearing for "no clash at the splice."
5. **The `k_first` offset claim.** The draft asserts the first crossing after a vertical bounce sits on the immediately adjacent line `k_first = k+1` (and `k-1` after a horizontal bounce). The verifier confirms the net parity outcome on every tested bounce, but the specific +1/-1 offset was confirmed only computationally. Re-derive that the post-bounce cord's first transverse crossing is on the immediate neighbour, with no skipped index at the wall.

**Open proof concern.** Crossingless loops. A cord that encloses an interior hole but meets no other cord (for example the 4-nail diamond around a single empty cell in the pinwheel board) is a valid physical strand and a component of the link, but it carries zero crossings and is "alternating" only vacuously. The draft's Theorem 1 statement ("each finished piece is an alternating link") does not mention these. On the pinwheel the engine reports 3 strands and the crossing-graph verifier reports 2; the difference is exactly one crossingless loop, and after subtracting it the counts agree (this is not an engine error and not an alternation failure). Recommend one clarifying sentence allowing zero-crossing unknotted/unlinked components, or restricting the alternation statement to strands carrying at least one crossing. Separately, note that "alternating" is a property of a diagram, not a link invariant; the draft's phrasing "admits an alternating diagram and is an alternating link" is correct, just confirm the wording survives a careful referee.

### Theorem 2 (a rectangle counts its own gcd)

**Statement.** An m by n rectangular board carries exactly `gcd(m,n)` closed strands, all of equal length `2mn/gcd(m,n)` unit diagonal segments (Euclidean arc length that times `sqrt(2)`).

**Draft proof.** `interlace-note-draft.md`, Section 4: unfolding to the torus, the discrete step `s:(x,y) -> (x+1,y+1)` on `Z/2n x Z/2m`, orbit length `lcm(2n,2m)`, parity-class split into `gcd(m,n)` orbits.

**Independent-check verdict.** Confirmed numerically and step-by-step. `scripts/recheck-theorem2.mjs` cross-checks three mutually independent computations on every rectangle up to 14x14 (196 rectangles): (1) engine billiard trace with a from-scratch arc-length, (2) closed-form `gcd`/`lcm` arithmetic, (3) an explicit orbit walk of `s` on one parity class of `Z/2n x Z/2m`. All three agree on count and length, **0 equal-length violations, 0 failures**. `scripts/recheck-theorem2-proofsteps.mjs` verifies each individual proof step (order of (1,1) = lcm; `r | 2mn`; each parity class splits into exactly `gcd` orbits all of length r; both classes symmetric; whole torus = `2*gcd` orbits over `4mn` points) for all m, n up to 20 (400 pairs, **0 failures**).

**Steps you should personally re-derive:**

1. **`ord((1,1))` in `Z/2n x Z/2m` = `lcm(2n,2m)` = `2mn/gcd(m,n)`**, using `lcm(a,b)*gcd(a,b)=ab`. This single identity drives both the count and the length.
2. **`r = lcm(2n,2m)` divides `2mn`**, so a class of `2mn` points is a clean union of full orbits. (`2mn` is a common multiple of `2n` and `2m`, and lcm divides any common multiple.) Without this, `2mn/r = gcd` is not obviously an integer.
3. **The homomorphism argument.** `(x,y) -> x+y mod 2` is constant on each orbit because `g0 = (1,1)` adds 2 to `x+y`; hence each coset of `<(1,1)>` lies entirely in one parity class, and each `2mn`-element class splits into `2mn/r = gcd(m,n)` orbits. This replaces the draft's weaker "physical board = one parity class" assertion.
4. **The geometry-to-group bridge, by hand, for one small rectangle (2x2 or 3x2).** Write the unfolding (triangle-wave fold), confirm a 45-degree billiard path lifts to a straight slope-1 line, confirm the lift sampled per unit diagonal is the orbit of (1,1), and confirm the physical strands are the orbits in one class. Do this symbolically, not with code: the automated geometric lift is fragile at tiny scales (floating-point sampling collisions).
5. **Equal length is special to translations.** All orbits are cosets of one cyclic subgroup, hence identical size; this is why all strands are congruent and would fail for a general bijection. Worth spelling out, since a referee will want it.

**Open proof concern.** The draft's reduction is correct but leans on one under-argued step: "the physical board is one reflected copy, that is, one parity class, and its strands are exactly the orbits of s in that class." The bijection (physical 2mn segments to one parity class; physical strands to s-orbits) is asserted, not constructed, and the literal "(px,py) parity" framing is a coordinate trap, because the physical 45-degree-rotated coordinates are not the model's integer index frame. **Recommendation (cleanest correct version, verified for all m,n up to 24 by `recheck-theorem2-proofsteps.mjs` and the group-theory enumeration):** Let `G = Z/2n x Z/2m`, order `4mn`, and `g0 = (1,1)`. Orbits of s are the cosets of `H = <g0>`; `ord(g0) = lcm(2n,2m) = 2mn/gcd(m,n) =: r`, so `|H| = r` and the number of cosets is `[G:H] = 4mn/r = 2*gcd(m,n)`. The map `G -> Z/2`, `(x,y) -> x+y mod 2`, is constant on each coset (g0 adds 2 to x+y), so each coset lies in one parity class; each class has `2mn` elements and `r | 2mn`, so each class holds exactly `2mn/r = gcd(m,n)` orbits, of identical length r. Both classes carry `gcd(m,n)` orbits, so the count is `gcd(m,n)` and the length `2mn/gcd` regardless of which class is declared physical. This sidesteps the "which copy is physical" bookkeeping entirely. The draft should also add one or two sentences making the unfolding explicit (the triangle-wave fold lifting the billiard path to a slope-1 geodesic on `R^2/(2nZ x 2mZ)`, sampled per unit advance = orbit of (1,1)); right now the leap from "reflect repeatedly" to "s on `Z/2n x Z/2m`" is asserted.

---

## 3. Reproduce it yourself

From a clean checkout, run `node` from the repo root (`/Users/wilmon/Documents/projects/Patterns`). Each command is foreground and finishes in under two minutes except the census, which is timed below.

**Theorem 1, hand battery (fast):**
```
node scripts/recheck-theorem1.mjs
```
Expected tail: `boards tested 26 / strands tested 67 / crossings checked 1960 / exceptions 0`, and `RESULT_JSON {"theorem1Holds":true,...,"exceptions":[]}`. Every board row shows `alt ok`, `cover ok`, and a matching count; the pinwheel row reads `=3(1Ø)` (engine count 3, one crossingless loop subtracted).

**Theorem 1, random differential sweep (two seeds):**
```
RECHECK_RANDOM=2000 SEED=12345 node scripts/recheck-theorem1.mjs
RECHECK_RANDOM=3000 SEED=99    node scripts/recheck-theorem1.mjs
```
Expected: `random boards tested 2000` / `3000`, `random exceptions 0` in each.

**Theorem 2, three-way numeric check (rectangles to 14x14):**
```
node scripts/recheck-theorem2.mjs
```
Expected tail: `rectangles tested 196`, `three-way count agreement ALL AGREE`, `equal-length violations 0`, `total FAIL rows 0`, `RESULT_JSON {"theorem2Holds":true,...}`.

**Theorem 2, individual proof steps (m,n to 20):**
```
node scripts/recheck-theorem2-proofsteps.mjs
```
Expected: `pairs tested 400`, `failures 0`, `RESULT_JSON {"proofStepsHold":true,...}`.

**Census, fresh enumeration (independent of the engine; ~70s to n=13):**
```
node scripts/recheck-sequence.mjs 13
```
Expected: fixed totals match A001168 and free totals match A000105 for every n (`OK` on each row); `a(n) (L=1): 1, 1, 2, 4, 11, 28, 86, 273, 915, 3126, 10948, 38782, 138719`; `L=2 sequence: 0, 0, 0, 1, 1, 7, 21, 93, 348, 1426, 5577, 22142, 87006`; and `a(n) vs published Section 5: MATCH through n=13`. (n=14..16, slow to enumerate freshly, come from the artifact below; raise the argument to `14`, `15`, or `16` to reproduce them, allowing several minutes to over an hour.)

**Census, the original enumerator and exact artifact (n to 16):**
```
node scripts/polyomino-loops.mjs            # the authors' own enumerator
cat scripts/artifacts/polyomino-loops-16.json   # exact census, all 13M boards
```
The artifact's `sizes["16"].distribution` reads `{"1":6576500,"2":5264430,"3":1164267,"4":73226,"5":831,"6":1}` (so `a(16)=6576500`), with `freeOk` and `fixedOk` true at every n.

**OEIS absence (live check):**
```
curl -s "https://oeis.org/search?q=11,28,86,273,915,3126,10948,38782&fmt=json"
curl -s "https://oeis.org/search?q=1,7,21,93,348,1426,5577,22142&fmt=json"
```
Both return the literal `null` (no match). For contrast, `curl -s "https://oeis.org/search?q=id:A000105&fmt=json"` returns the polyomino-count data `1,1,1,2,5,12,35,108,369,1285,4655,...`, confirming the underlying sequences exist while the monolinear and L=2 sequences do not.

**Optional, the sampler behind the n=17..19 extrapolation:**
```
node scripts/sample-census-uniform.mjs
cat scripts/artifacts/sample-census-uniform.json
```
This is Markov-chain sampling, indicative only (see the punch-list).

**Optional, the prior Theorem-1 verifier (for provenance comparison):**
```
node scripts/verify-alternation.mjs
```
Expected: `39 boards / 116 strands / 2429 crossings / 0 exceptions`.

---

## 4. Honest provenance

This is the true account of how the note was produced, so you know exactly what you are signing onto.

**The authors' own code.** The billiard/weave engine (`src/engine.js`, mirrored in `src/app.js`) is the authors' software, built over time as the simulator for the craftsman's technique. The over/under rule lives in `app.js` `weaveLines` and is the rule actually rendered in the app the craftsman uses. The original exact census enumerator (`scripts/polyomino-loops.mjs`) and the exact artifact (`scripts/artifacts/polyomino-loops-16.json`, covering all ~13 million free polyominoes to n=16) are the authors' work, as is the Markov-chain sampler (`scripts/sample-census-uniform.mjs`) used for the n=17..19 extrapolation in Section 5.

**What generative AI did.** AI assistance drafted the prose of the note (`interlace-note-draft.md`), including the first written form of the Section 3 and Section 4 proofs and the Section 5 exposition. AI also wrote the verification and recheck scripts and ran them. AI was not the source of the mathematical results: the count law is classical (Gerdes, Jablan, arithmetic billiards), the engine predates the writeup, and the census numbers come from the authors' enumerator. AI's role was exposition and checking, not discovery.

**What has now been independently re-verified.** To guard against a shared bug or a shared reasoning error in the AI-drafted material, a second, independent pass was run with fresh code that deliberately shares no logic with the original verifier or, where possible, with the engine:
- Theorem 1 was re-checked by `scripts/recheck-theorem1.mjs`, which builds the link diagram crossing-by-crossing from cell geometry and walks each cord with its own reflection test, never calling the engine tracer for its alternation logic. Clean on 26 hand boards (67 strands, 1960 crossings) and 5000 random boards across two seeds. Its over/under bit matches the rendered `weaveLines` decision exactly.
- Theorem 2 was re-checked by `scripts/recheck-theorem2.mjs` (three independent computations: engine trace, closed-form gcd/lcm, explicit orbit walk) on 196 rectangles, and by `scripts/recheck-theorem2-proofsteps.mjs` (each proof step arithmetically, to m,n=20). Clean.
- The census was re-checked by `scripts/recheck-sequence.mjs`, a from-scratch polyomino enumerator (BFS layer growth, different canonicalization) with a from-scratch discrete billiard loop-counter (half-edge state machine, no floating-point ray casting). It reproduces `a(n)` and the L=2 sequence exactly through n=13, matches A001168/A000105, and was cross-validated against the engine on all fixed polyominoes up to n=9 (0 mismatches), pinning the two independent loop-counters together. Values for n=14..16 rest on the authors' artifact, not on a fresh independent enumeration, though the fresh tracer agrees with the engine on every shape it tested.

**What still rests on the AI-drafted prose alone.** The proofs as currently written are AI-drafted and confirmed by independent computation, but they have not yet been re-derived and rewritten by a mathematician. That is your task. Until you have done the derivations in Section 2 by hand and rewritten Sections 3 and 4 in your own words, the note's proofs are corroborated, not authored.

---

## 5. Draft "Declaration of methods and assistance"

*Use the following once you have personally verified and rewritten the mathematics, at which point every sentence is exactly true:*

> The mathematical results in this note were derived and written by the authors. The count and equal-length theorem for rectangular boards is classical (arithmetic billiards; Gerdes and Jablan for mirror curves); the alternation theorem and the census of monolinear polyomino boards were proved and computed by the authors. All computations are reproducible from the scripts provided as supporting material: a billiard-weave engine and an exact polyomino enumerator (the authors' own software), together with independent re-verification scripts that confirm each theorem and the census by computations sharing no logic with the engine. Generative AI was used to assist with drafting and exposition and to write and run the verification code; it was not relied upon as a source of mathematical results, and every theorem was independently re-derived and written by the authors. This declaration is included per the journal's policy on AI use.

---

## 6. Punch-list before submission

1. **Theorem 1, crossingless loops.** Add one sentence allowing zero-crossing unknotted/unlinked components, or restrict the alternation statement to strands carrying at least one crossing. The current statement does not mention them, and the pinwheel board exhibits one.
2. **Theorem 1, the `k_first` offset.** Re-derive by hand that the first transverse crossing after a wall bounce is on the immediately adjacent line (`k+1` vertical, `k-1` horizontal); it is currently confirmed only computationally.
3. **Theorem 2, the reduction.** Replace the "physical board = one parity class" assertion with the group-theoretic version in Section 2 above (cosets of `<(1,1)>`, monochromatic under `x+y mod 2`, `gcd` orbits per class). Add one or two sentences making the unfolding-to-torus and the per-segment sampling explicit, so the leap from "reflect repeatedly" to "s on `Z/2n x Z/2m`" is shown, not asserted.
4. **OEIS wording.** "No match as of June 2026" is confirmed against the published corpus, but a sequence under draft review is generally not returned by default search, so "no match" should be read as "no accepted entry." Insert the assigned A-number once the draft entry is live, and update the wording to reflect acceptance status at print time.
5. **Crossover precision (Section 5).** The "cross near n=20" claim is a defensible rounding, not exact: a linear fit of the L1-minus-L2 gap over n=16..19 extrapolates the crossing to about n=19.4, and the gap is still +1.3 points at n=19 and shrinking nonlinearly. The draft already hedges these sampled values as indicative; keep that hedge. The qualitative claim (L=2 overtakes L=1 just past exact reach) is sound.
6. **References [T1].** Verify the exact Cromwell chapter/page and the Kauffman/Murasugi/Thistlethwaite page numbers against the originals before print, and add them to `docs/references.md`. (Tracked already in the draft's "Notes to self.")
7. **n=14..16 independence (optional).** If full independence of the published a(14..16) is wanted, run `scripts/recheck-sequence.mjs 16` with the fresh enumerator (slow) so those three values are reproduced by code that does not share the engine. Currently they rest on the authors' artifact, which the fresh tracer agrees with on every shape tested through n=13.
