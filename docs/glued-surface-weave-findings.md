# Glued-surface billiard-weave: findings (2026-06-16)

Research probe into building 3D objects by gluing polyomino panels (fundamental-polygon / square-tiled-surface construction) and weaving billiard cords across the seams. Honest known-vs-novel assessment. Scripts: `scripts/torus-mobius.mjs`, `scripts/glued-sequences.mjs`, `scripts/weave-consistency.mjs`.

## The model
A surface = polyomino(s) with edge identifications. Cord count = cycles of σ = (flat billiard permutation π from TearEngine) ∘ (one transposition per glued gap-pair). This IS the cylinder decomposition of a square-tiled surface (origami) in the slope-1 direction.

## Result 1 — the "orientability obstructs the weave" conjecture is FALSE
We conjectured the over/under weave (forced by `(k+m+W)%2`) stays globally alternating iff the glued surface is orientable. **Refuted: 130 of 340 glued cases contradict it.** Möbius/Klein are often consistent (2×2, 3×3, 2×6, 3×5, 4×4...); orientable tori often are not (2×3, 3×4, 4×6).

## Result 2 — the real condition is a 2-adic valuation rule (CONJECTURE, not proven)
Let v₂(n) = exponent of 2 dividing n. Computed with 0 mismatches over 85 sizes per surface, stable to 12×12:
- **cylinder** (one direction glued): consistent ⇔ v₂(W) ≤ v₂(H)  [W glued, H walls]
- **Möbius and Klein** (reversed seam): consistent ⇔ v₂(W) = v₂(H)
- **torus** (both glued, aligned): consistent ⇔ v₂(W) = v₂(H), OR (min(W,H)=2 and both even)

Orientable (torus) and non-orientable (Möbius/Klein) obey the SAME core v₂(W)=v₂(H). Orientability is not the discriminator. **Status: empirical to size 12, NOT a theorem.** The torus width-2 escape is the weak point (confirmed only to 2×20, rests on a degeneracy); drop it or prove it before stating a theorem.

To prove it: one bit per crossing; edge parity `1 XOR [fam_c=B] XOR [fam_c'=B]` between cord-consecutive crossings; consistency = 2-colorability of this graph = no frustrated cycle. Flat board is always bipartite (the verified flat result). Reduce a frustrated cycle to a cord-winding count whose 2-adic structure is set by W,H.

## Result 3 — sequences are mostly trivial
| family | values | OEIS | novel? |
|---|---|---|---|
| torus n×n | n | A000027 | no (just n) |
| Klein n×n | n | A000027 | no |
| Möbius n×n | 2n | A005843 | no |
| torus n×(n+1), cylinder n×n | even repeated | A052928 | no |
| torus 2×n | n if even else 2 | A133265 | no (trivial interleave) |
| **Möbius 2×n** | 2,4,4,4,6,4,8,8,10,4,12,12,14,4,... | **no match** | the only candidate; elementary mod-4 rule |

## Literature reality check (what a referee cites against us)
- **Cord counting is KNOWN**: origamis / square-tiled surfaces, cylinder decomposition; software `surface_dynamics`, `sage-flatsurf` (Delecroix, Zorich et al.). Concede this; do not claim the counting as new.
- **Billiards → knots is KNOWN**: Jones–Przytycki, Lamm (Lissajous), Koseleff–Pecker (every knot is a billiard knot in some prism). Different question (knot type vs our component count), but the connection is theirs.
- **Mirror curves / sona / Lunda**: Gerdes, Jablan–Radović–Sazdanović. All FLAT and PLANAR; over/under treated as a free choice, not tied to orientability.
- **Craft loops on glued surfaces is ALREADY a genre**: hitomezashi on cylinders (Xie, 2025; arXiv 2509.04880) and tori (arXiv 2309.02741), counted with homology classes. No over/under, no non-orientable, different rule — but the genre exists.
- **DANGER, adjacent (Dec 2024)**: "Alternating links on nonorientable surfaces and Klein-bottly alternating links" (arXiv 2412.07133); also Boden–Karimi (arXiv 2010.14030, orientable thickened surfaces). MUST read 2412.07133 in full before claiming the weave-consistency result is new — it may subsume it. Our defensible distinction: those ask *when an abstract diagram can be made alternating*; we *force* over/under by a parity rule and ask whether it *stays* consistent after gluing.

## What is genuinely (and narrowly) novel
1. **Fabricable seamed-panel pipeline** (strongest, most "Interlace"): glued polyomino → billiard cord structure → physically separate flat woven panels with cords continuous across a seam → 3D object (the seam-shoe model, gaps = nails+1). Nearest prior art (Möbius whole-garment weaving; mat-weaving-toward-Möbius) twists one mat; nobody derives panels+seams from a cord count. Demonstrable NOW via João's physical shoe (8+8→12).
2. **Weave-consistency v₂ dichotomy** — IF provable AND not subsumed by 2412.07133.

## Verdict
Not a standalone second Interlace paper yet, and not a section of the first (flat) note. The counting is known; the weave-consistency is an unproven conjecture with a soft spot; the only sequence is a curiosity. The right shape later: ONE follow-up note led by the seamed-panel construction (concrete, uniquely ours, demonstrable), with the weave-consistency conjecture presented honestly as computer-verified (state plainly that orientability is NOT the discriminator), and Möbius 2×n optionally submitted to OEIS.

## Next steps before any novelty claim
1. Read arXiv 2412.07133 in full; decide if the weave-consistency statement is a corollary.
2. Try to PROVE the Möbius/Klein/cylinder v₂ conditions (cleaner than the torus); drop or prove the torus width-2 escape.
3. Cite hitomezashi-on-surfaces, surface_dynamics/Zorich, Koseleff–Pecker up front to pre-empt the obvious referee objections.
4. Ship the FLAT note first (the gcd/alternation/census one); this glued-surface work is a later, separate follow-up.
