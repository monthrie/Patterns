# 2D Shape Properties — Loops, Gaps & Other Well-Defined Quantities

This document defines, for a **2D shape** in the woven-knot / string-billiards tools, what a
*loop*, a *gap*, and the other derivable properties are — and which of them are **well-defined**
(deterministic, unique, computable from the shape alone).

All definitions below are grounded in the actual engine:
[celtic-knot-custom.html](celtic-knot-custom.html) (`buildEdges`, `buildGaps`, `tracePath`,
`getAllCycles`) and the renderer in [index.html](index.html) (`buildCornerData`, strand cuts).

---

## 0. The shape (the primitive)

A **shape** is a rectangular grid of boolean cells:

```
cells[row][col]   // true = filled, false = empty
gw = width  (number of columns)
gh = height (number of rows)
```

This is exactly the JSON export format, e.g.

```json
{ "name": "8 cycle shoe v2", "gw": 19, "gh": 11, "cells": [[ … ]] }
```

Coordinate space is the continuous rectangle `[0, gw] × [0, gh]`. Three coordinate kinds appear:


| symbol                    | meaning                                 |
| ------------------------- | --------------------------------------- |
| cell `(col,row)`          | a unit square; `true`/`false`           |
| **nail** / vertex `(x,y)` | integer lattice points, `0…gw` × `0…gh` |
| crossing point            | half-integer points where strands meet  |


Everything else in this document is **derived** from `cells`. Because each derivation is a pure
function of the boolean grid, every property below is well-defined *as long as the shape avoids the
degenerate cases in §8.*

---

## 1. Edge (wall)

> An **edge** is a unit-length piece of the shape's outline: a place where a filled cell sits
> next to an empty cell (or the outside).

Test (`buildEdges`): for each unit grid segment, the two cells on either side are compared with
**XOR**.

- Horizontal edge at `(x,y)`: exists iff `cells[y-1][x] !== cells[y][x]`.
- Vertical edge at `(x,y)`: exists iff `cells[y][x-1] !== cells[y][x]`.

(Cells outside the grid count as `false`.) Consecutive collinear unit edges are then **merged**
into maximal straight wall segments — these are the surfaces a strand reflects off.

**Well-defined:** yes. XOR is unambiguous; the merge is deterministic.

---

## 2. Gap

> A **gap** is one bounce/launch point on the outline: the **midpoint of a unit boundary edge**,
> together with the direction a strand leaves it.

Definition (`buildGaps`): exactly **one gap per unit boundary edge**.

- Horizontal edge → gap at `(x + 0.5, y)`, flag `isH = true`, plus `interiorBelow`.
- Vertical edge → gap at `(x, y + 0.5)`, flag `isH = false`, plus `interiorRight`.

The interior-side flag fixes the **launch direction** (`getInitialDir`) — the strand always shoots
*inward* at 45°:


| edge (interior side)  | launch `(dx, dy)` |
| --------------------- | ----------------- |
| top (filled below)    | `(+1, +1)`        |
| bottom (filled above) | `(−1, −1)`        |
| left (filled right)   | `(+1, −1)`        |
| right (filled left)   | `(−1, +1)`        |


**Well-defined:** yes — a gap is a half-integer point with a single inward direction. Distinct
gaps are always ≥ 0.5 apart (an h-gap has integer `y`/half-integer `x`; a v-gap is the reverse;
they can never coincide), so the tolerance-based reverse lookup `pointToGapIdx` (`±0.1`) is
unambiguous.

> ⚠️ **Naming note.** "Gap" here means a *boundary bounce point*, **not** the little break where
> one strand dives under another at an interior crossing (the usual knotwork meaning). Interior
> over/under is handled separately by the loom rule (§5).

**Count:** the number of gaps equals the **perimeter** measured in unit edges:  `G = P`.

---

## 3. Loop (cycle)

> A **loop** (a.k.a. *cycle* or *strand*) is **one continuous closed strand**: follow a single 45°
> billiard path as it bounces off the outline; when it returns to its starting gap, that closed
> trajectory is one loop. Everything it threads through is dyed a single colour.

Construction:

- `tracePath(startGap)` — start at a gap, travel straight at 45°, reflect at each wall
(horizontal wall flips `dy`; vertical wall flips `dx`; a corner flips both), and stop when the
path returns to its start point.
- `getAllCycles` — repeatedly trace from any **not-yet-visited** gap, marking every gap the path
passes through as used. Each completed trace is one loop.

Consequences (all well-defined):

- The loops **partition** the gaps: every gap belongs to **exactly one** loop, and no two loops
share a gap. ⇒ `Σ (gaps per loop) = G`.
- The loops are **disjoint** as strands, which is why each can take its own colour independently.
- The **number of loops `L`** is an emergent invariant of the shape. The engine computes it
directly by tracing; for a plain `w × h` rectangle it reduces to the classic plait result
`L = gcd(w, h)`, but for general shapes there is no shortcut — you trace.

This is what the name **"8 cycle shoe"** asserts: the boot outline resolves into exactly `L = 8`
disjoint closed strands.

---

## 4. Corner

> A **corner** is a nail where the outline turns 90°. Convex corners are where the strand makes a
> rounded turn-around arc; concave corners are reentrant notches.

Classification (`buildCornerData`): at each nail, count how many of the 4 surrounding cells are
filled.


| filled neighbours | corner type                          | strand behaviour                 |
| ----------------- | ------------------------------------ | -------------------------------- |
| 0 or 4            | not a corner (open space / interior) | —                                |
| **1**             | **convex** turn corner               | strand makes a 90° turn arc here |
| **3**             | **concave** (reentrant) corner       | two walls meet at a reflex angle |
| 2 (adjacent)      | straight wall                        | no turn                          |
| 2 (diagonal)      | **pinch** — degenerate, see §8       | ambiguous                        |


**Well-defined:** yes for the 0/1/3/4 cases. The diagonal-2 case is the one degeneracy (§8).

---

## 5. Interior crossing & the loom

> An **interior crossing** is an interior nail where two strand segments cross — one passes
> **over**, the other **under**.

Which diagonal is on top is fixed by the **loom rule**: a checkerboard parity of the nail
coordinates, `(ix + iy) % 2` (equivalently the `(ki + mi + W) % 2` test in the renderer's cut
logic). A strand only shows a gap-cut (goes "under") where another strand actually crosses it in
the opposite diagonal at that nail.

**Well-defined:** yes — parity is deterministic; the over/under assignment is consistent across the
whole shape.

---

## 6. Summary of well-defined scalar properties

For any non-degenerate shape, all of these are uniquely determined by `cells`:


| property             | symbol | definition                                                |
| -------------------- | ------ | --------------------------------------------------------- |
| Area                 | `A`    | number of filled cells                                    |
| Perimeter            | `P`    | number of unit boundary edges                             |
| Gaps                 | `G`    | number of boundary bounce points = `P`                    |
| Loops                | `L`    | number of disjoint closed strands                         |
| Convex corners       | `C₁`   | nails with exactly 1 filled neighbour (turn arcs)         |
| Concave corners      | `C₃`   | nails with exactly 3 filled neighbours                    |
| Connected components | `K`    | number of separate filled regions                         |
| Holes                | `h`    | enclosed empty regions                                    |
| Interior crossings   | `X`    | interior nails traversed by two opposite-diagonal strands |


---

## 7. Relationships (invariants)

These hold for any non-degenerate shape and are useful sanity checks:

- **Gaps = perimeter:**  `G = P`.
- **Loops partition gaps:**  `Σ_loops (gaps in loop) = G`.
- **Rectilinear corner balance** (simply-connected shape, no holes):  `C₁ − C₃ = 4`.
With `h` holes this becomes  `C₁ − C₃ = 4 (K − h)` for `K` components.
- **Rectangle special case:**  a plain `w × h` rectangle has `L = gcd(w, h)` loops.

---

## 8. Degenerate / ambiguous cases (where definitions break)

Most boolean grids are fine. The definitions become ambiguous only here:

1. **Diagonal pinch.** Two filled cells touching corner-to-corner with the other two corners empty
  (`tl + br` filled, `tr + bl` empty, or vice versa). The region pinches to a single point; two
   walls cross at that nail and the billiard reflection is undefined there. `buildCornerData`
   deliberately skips it. Avoid pinches if you want a clean, well-defined knot.
2. **Disconnected region.** Perfectly well-defined, but loops never span components — each filled
  blob carries its own independent set of loops. Track `K` if this matters.
3. **Empty shape.** No filled cells ⇒ no edges, no gaps, no loops (`getAllCycles` returns `[]`).

---

## 9. Worked example — the 8-cycle shoe

`gw = 19`, `gh = 11`. Rows 0–2 fill cols 11–18 (the upright); rows 3–10 fill the full width
(the sole). An L / boot shape.


| property                 | value         | how                                              |
| ------------------------ | ------------- | ------------------------------------------------ |
| Area `A`                 | **176**       | `3 rows × 8` + `8 rows × 19` = `24 + 152`        |
| Perimeter / Gaps `P = G` | **60**        | outline = `8 + 11 + 19 + 8 + 11 + 3`             |
| Convex corners `C₁`      | **5**         | the four outer corners + the sole's far top-left |
| Concave corners `C₃`     | **1**         | the reentrant notch where upright meets sole     |
| Corner balance           | `5 − 1 = 4` ✓ | matches the simply-connected invariant           |
| Loops `L`                | **8**         | computed by `getAllCycles` (the shape's name)    |


So 60 boundary bounce points are partitioned into 8 disjoint closed strands — 8 colours, one per
strand.

---

## 10. Code pointers


| concept             | function                               | file                                               |
| ------------------- | -------------------------------------- | -------------------------------------------------- |
| Boundary / edges    | `buildEdges`, `isOnBoundary`           | [celtic-knot-custom.html](celtic-knot-custom.html) |
| Gaps + launch dir   | `buildGaps`, `getInitialDir`           | [celtic-knot-custom.html](celtic-knot-custom.html) |
| Gap lookup          | `pointToGapIdx`                        | [celtic-knot-custom.html](celtic-knot-custom.html) |
| Loop tracing        | `tracePath`, `getAllCycles`            | [celtic-knot-custom.html](celtic-knot-custom.html) |
| Corners (turn arcs) | `buildCornerData`                      | [index.html](index.html)                           |
| Loom over/under     | checkerboard `(ix + iy) % 2` cut logic | [index.html](index.html)                           |


---

---

# Part II — The two-panel (mirror) model

Everything in Part I assumes a **single panel** where **every** edge is a reflecting wall, so each
loop closes within that one panel. Part II generalises this for the **mirror page**, where the
shape is paired with its mirror image and most edges become *pass-through* instead of *reflecting*.
A string can then leave one panel and continue on the other, so a loop is no longer confined to a
single panel.

> **The model in one sentence.** Take two copies of the shape — panel **A** (original) and panel
> **B** (its mirror) — and sew them together along **every perimeter edge except the short top
> edge**, which stays an open wall on both. A string travels straight at 45°, **passes through** a
> sewn edge onto the other panel, and **reflects** only at the top wall. With exactly two panels
> and each gap used once, every string returns to itself.

---

## 11. Panel & the two-panel surface

- **Panel** — one copy of the shape. There are exactly **two**: **A** (the original) and **B**
(its mirror twin). No further copies are ever created.
- **Twin panel** — the other panel. Crossing a sewn edge moves the string A→B or B→A.
- **Two-panel surface `D`** — the abstract surface formed by gluing A and B edge-for-edge along all
*portal* edges (§12), leaving the *wall* edges (the top-8) open on each panel.

**Topology.** The shape is a disk (simply connected). Two disks glued along all-but-one boundary
arc form a disk again, whose single boundary circle is **A's top-8 plus B's top-8** joined at the
two shared corners. So `D` is a flat disk-with-cone-points whose only boundary — the only thing a
string reflects off — is that length-16 top wall.

---

## 12. Edge roles — wall vs portal

Every perimeter edge (Part I §1) is now tagged one of two ways:

- **Wall edge** — a reflecting boundary, exactly as in Part I. The string bounces and **stays on
its panel**. *(In Part I, every edge is a wall.)*
- **Portal edge** — a *sewn* / pass-through edge. The string crosses to the **twin panel** and
continues in the same apparent direction (the "straight across the mirror" look). It is **not**
a boundary of `D` — it is interior.

**Intended tagging for the shoe:** **all edges are portals except the top-8 (E1), which is the one
wall.** (Edge labels E1–E6 are in §9 / the diagram from the working notes.)

---

## 13. Gap roles — bounce vs crossing

A gap (Part I §2) inherits its edge's role:

- **Wall gap** — a gap on a wall edge. The string **reflects** here (a bounce). Used once.
- **Portal gap** — a gap on a portal edge. The string **passes through** here (a crossing) to the
twin panel. Used once.

For the shoe: per panel, 60 gaps = **8 wall gaps** (the top-8) + **52 portal gaps**. Across the two
panels the 52 portal gaps are glued into **52 shared crossings**, and the wall gaps stay separate
(8 + 8 = **16 bounces**). Every one is used exactly once — this is the finiteness guarantee.

---

## 14. Behaviour at every interesting point

This is the complete local rule set. "⟂ velocity" = the velocity component perpendicular to the
edge; "panel" = which copy (A/B) the string is on.


| #   | where                                                                         | situation                                    | what the string does                                                                                                                                      | panel effect                                           |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | panel interior                                                                | —                                            | travels straight at 45°                                                                                                                                   | unchanged                                              |
| 2   | **wall gap** (mid top-8)                                                      | hits a wall                                  | **reflect** — flip ⟂ velocity                                                                                                                             | **unchanged**                                          |
| 3   | **portal gap** (mid any non-top edge)                                         | hits a portal                                | **pass through** to twin panel; direction unchanged (looks straight across)                                                                               | **toggles A↔B**                                        |
| 4   | **convex corner, both edges portal** (e.g. bottom-right, sole's far top-left) | the Part I turn-around **dissolves**         | the two flanking portal gaps each carry a **separate** string that **passes straight through** to the twin panel; no 180° reversal                        | **toggles A↔B**                                        |
| 5   | **concave corner, both edges portal** (the notch at the upright↔sole join)    | reentrant — ⚠️ **UNRESOLVED (see Part III)** | *intended:* the two strings cross like an X (one over, one under) and pass straight through — but this is **shown inconsistent** in the edge-bounce model | *intended* `toggles A↔B`; currently no consistent rule |
| 6   | **wall–portal junction** (the two ends of the top-8: `(11,0)` and `(19,0)`)   | convex turn, one wall + one portal           | one string **reflects** at the wall gap, then **crosses** at the adjacent portal gap; ends on the twin panel                                              | **toggles A↔B**                                        |
| 7   | **pinch** (two cells touching corner-to-corner only)                          | degenerate                                   | undefined — exclude the shape (Part I §8). *Does not occur on the shoe.*                                                                                  | —                                                      |


The panel-effect column is only ever `**toggles A↔B*`* (the gap used is a portal), `**unchanged**`
(a top-8 wall bounce), or `**—**` (undefined). Notes:

- **Corners are never a special primitive.** A corner is just its **two flanking gaps**, and each
gap applies its own rule (#2 reflect or #3 pass-through). The rounded turn-arc is cosmetic
(`buildCornerData`).
- **Portal turn-arounds dissolve (rows 4–5).** In Part I a convex corner reverses the string 180°
(the rounded end-loop) *because both its edges reflect*. When both edges are portals, that
reversal disappears — each flanking gap is an independent straight pass-through to the twin panel.
A real turn-around survives only where a **wall** is involved, i.e. the top-8 and its two
junctions (row 6).
- **Convex portal corners swap the two strands (a handedness flip).** A 180° turn-around reverses
the string's handedness (left↔right); a mirror reflection does the same. So passing the string
*through* to mirror panel B reproduces that flip for free — the turn-around is **relocated onto
B**, and the two strands flanking the corner emerge with their positions **exchanged** (an
inflection / crossing, not a reversal). The loom's over/under (§5) makes that crossing
well-defined — one strand over, one under — so the swap is a clean weave crossing rather than a
collision.
- **Where panels stitch together.** The *only* non-toggling events are the **top-8 wall bounces**
(#2). Every other event flips panel parity. So whether a string comes home on the same panel or
the opposite one is decided purely by **how many top-8 bounces it makes** — which is exactly the
even/odd test that merges A- and B-copies in §16.

---

## 15. Connected loop (the new loop)

> A **connected loop** is one continuous closed string on the two-panel surface `D`: it travels
> straight inside a panel, **passes through portal gaps** onto the twin panel, **reflects** at wall
> gaps, and closes when it returns to its **start gap, start direction, and start panel**.

This replaces the Part I §3 loop for the mirror model. Two facts make it well-defined and finite:

- **Used once.** There are finitely many gap events (for the shoe: 52 crossings + 16 bounces), and
each is used at most once — identical bookkeeping to `getAllCycles`' visited set.
- **Two panels only.** A portal crossing always toggles between exactly A and B; it never spawns a
third copy. So the orbit is a finite permutation cycle ⇒ **every string returns to itself.**

---

## 16. Counting connected loops — the mirror cover

`D` is a **2-to-1 mirror cover** of the original single-panel, all-wall billiard of Part I.
Collapsing the two panels onto one sends a portal *crossing* to an ordinary *reflection* (the twin
panel folds back onto the original), so the projected path is exactly an original Part I loop.
*(This folding is only a counting device — on the real surface `D` the strings pass straight
through the portal corners as in §14; the turn-around reappears only in this projection.)*
Therefore each connected loop sits **above** one original loop `Lᵢ`, and we can count without any
new tracing:

For each original loop `Lᵢ` (sizes for the shoe: 10,10,10,6,6,6,6,6), let

- `kᵢ` = gaps in `Lᵢ`,
- `tᵢ` = how many of them lie on the **wall** (top-8),
- so **portal crossings on `Lᵢ` = kᵢ − tᵢ**.

Walk `Lᵢ` once; the panel toggles `(kᵢ − tᵢ)` times:

- **even** ⇒ the string returns to the start gap on the **same** panel ⇒ `Lᵢ` lifts to **two**
connected loops (an A-version and its disjoint mirror B-version).
- **odd** ⇒ it returns on the **other** panel and must go round again ⇒ the two copies merge into
**one** connected loop of double length.

So the **connected-loop count** is

```
L* = 2·E + 1·O
```

where `E` / `O` = number of original loops with an even / odd portal-crossing count, and
`E + O = L` (= 8 for the shoe).

For the shoe all `kᵢ` are even, so the parity of `(kᵢ − tᵢ)` equals the parity of `tᵢ` — i.e. it
comes down to **how many of the 8 top-edge bounces fall on each original loop**.

**Traced result** (`two-panel-loops.js`): the 8 top-edge bounces fall **one per loop**, so every
loop is odd ⇒ `E = 0, O = 8 ⇒ L* = 8` — each connected loop a doubled strand (sizes
20,20,20,12,12,12,12,12, Σ = 120). Direct two-panel trace and the `2E + O` formula agree.

⚠️ This `L* = 8` is the count for the **consistent edge-bounce model** (convex corners turn, concave
corners reflect). The concave-corner behaviour we actually *want* — §14 row 5 — is **not yet
realizable**; see **Part III**. If a consistent concave rule is found, this count will change.

---

## 17. New well-defined quantities (two-panel model)


| property                         | symbol            | definition                                           |
| -------------------------------- | ----------------- | ---------------------------------------------------- |
| Wall edges / portal edges        | —                 | the wall/portal tagging of each perimeter edge (§12) |
| Wall gaps / portal gaps          | —                 | bounces vs crossings (§13)                           |
| Portal-crossing parity of a loop | `(kᵢ − tᵢ) mod 2` | decides whether `Lᵢ` lifts to 1 or 2 connected loops |
| **Connected-loop count**         | `L`*              | `2·E + O` — the number of closed strings on `D`      |


These are determined entirely by `cells` plus the wall/portal tagging, so — like everything in
Part I — they are well-defined as long as the shape avoids the degenerate pinch (§8 / row 7).

---

---

# Part III — Open problem: the concave corner

**Status: UNRESOLVED.** §14 row 5 states the *intended* concave-corner behaviour, but it has been
shown **inconsistent** in the current edge-bounce model. This part records the goal, what was
tried, why it fails, the leading hypothesis, and the open paths — so we can pick up cleanly.

## 18. The goal

In the consistent model (Part II) a strand at the concave corner **reflects** off the notch edges,
so it darts clear across the sole to the bottom-right corner and back before reaching the top wall.
The desired behaviour is for the strand to **pass straight through** the concave corner — an
**inflection**, the concave twin of the convex swap (§14 note "Convex portal corners swap"). On the
shoe this would let the Loop-3 strand run **straight up to the top wall** instead of diverting.

**Physical motivation (string-art picture).** The concave vertex would be a **singularity** if a
nail sat there. With the nail **removed** it is an open gap, and the two strands **cross like an X**
— one over, one under, decided by the loom (§5).

## 19. What was tried — the "concave bridge"

Connect the corner's two flanking gaps directly: a strand arriving at one flanking gap *along the
notch diagonal* passes **straight through** (no reflection) to the other flanking gap and continues.
Implemented as `buildConcaveBridges` in `two-panel-loops.js` — a set keyed by
`(gapIdx, incoming-direction)` that suppresses the reflection.

## 20. Why it fails (rigorously)

Clean loops require the step rule to be a **bijection**: every directed segment has exactly one
predecessor and one successor. The bridge breaks this — verified two ways, including with the A/B
panel tracked:

- **Merge.** The "up to the top wall" segment leaving the E6 gap `(11, 2.5)` is claimed by **two**
real segments of Loop 3 at once — the bridge (from `(10.5, 3)`) **and** the existing route up from
the bottom-right corner `(19, 10.5)`. Two strings → one ray is a *merge*, which cannot be split
into clean loops. The collision survives with panels tracked.
- **Escapes.** Forcing strings straight through the notch shoots many off into the open empty region
with no wall to catch them (~hundreds of escaping transitions).
- **Result:** the trace shatters into **degenerate length-1 / length-2 loops** — an inconsistent
`L* = 11` instead of the consistent `8`.

**Why it is forced (not a bookkeeping bug).** Every edge-midpoint gap must be crossed by exactly
one string. The bottom-right corner gaps `(18.5, 11)` / `(19, 10.5)` are crossed by **no other
string** than the one that detours there — so that detour is *obligatory*. Skip it and those gaps
go uncrossed, which is impossible. No amount of re-tracing escapes this.

## 21. Leading hypothesis — edges vs nails

The mismatch appears fundamental:

- The physical "remove the nail" picture is **nail-based**: strings *wrap around pins*, and pulling
the concave pin lets two strings cross.
- This engine is **edge-based**: strings bounce off **wall segments** (the notch edges). Removing a
nail does **not** open those walls, so the strings still reflect.

So "remove the nail → strings cross" has no consistent expression in the current tracer, because the  
walls the strings actually bounce off are still there.

## 23. Code state

`two-panel-loops.js` currently still contains the broken bridge (`buildConcaveBridges`), so it
reports the inconsistent **11** with degenerate fragments. The consistent edge-bounce model (bridge
removed) gives **8** (§16). The bridge should be reverted once a path in §22 is chosen.
