# 8-cycle shoe — loop coordinates

Two-panel trace for the shoe shape (`gw=19`, `gh=11`), using
`connectedLoopsWithCornerTable` with `concaveMode: 'cross'` and `convexMode: 'cross'`.

**8 loops** · lengths `10, 20, 10, 12, 12, 12, 12, 6` · Σ = 120 (= 2·G)

Each row is one **gap** (wall bounce point): `step panel (x,y) dir-to-next`.
Coordinates are canvas space: origin top-left, y increases downward.
Half-integers mark the midpoint of a 1-unit wall edge.

Direction arrows: first = x (`→` right, `←` left), second = y (`↓` down, `↑` up).

Loops 1, 3, and 8 are length 10 / 10 / 6 — each closes in one lap after the
vertical-side corner rule. Loop 2 is length 20. Loops 4–7 are length 12.

In Loop 3, `>>>` marks steps that pass through the **concave corner** at nail `(11,3)`.

### Bounds and extremes

Shape coordinate space: **`x ∈ [0, 19]`**, **`y ∈ [0, 11]`** (continuous rectangle matching the grid).

| Axis | Min | Max |
|------|-----|-----|
| **x** | `0` | `19` |
| **y** | `0` | `11` |

Every gap below lies on one of the four outer walls. Each loop hits that wall at least once;
longer loops (1–3) revisit the bottom and right edges additional times.

**Top** (`y = 0`) — 8 gaps (each loop’s step 0 on panel A):

`(11.5,0)` L1 · `(12.5,0)` L2 · `(13.5,0)` L3 · `(14.5,0)` L4 · `(15.5,0)` L5 · `(16.5,0)` L6 · `(17.5,0)` L7 · `(18.5,0)` L8

**Bottom** (`y = 11`) — 19 gaps:

| x | Loop(s) |
|---|---------|
| `0.5` | L1 |
| `1.5` | L2 |
| `2.5` | L3 |
| `3.5` | L4 |
| `4.5` | L5 |
| `5.5` | L6 |
| `6.5` | L7 |
| `7.5` | L8 |
| `8.5` | L8 |
| `9.5` | L7 |
| `10.5` | L6 |
| `11.5` | L5 |
| `12.5` | L4 |
| `13.5` | L3 |
| `14.5` | L2 |
| `15.5` | L1 |
| `16.5` | L1 |
| `17.5` | L2 |
| `18.5` | L3 |

**Left** (`x = 0`) — 8 gaps:

| y | Loop(s) |
|---|---------|
| `3.5` | L8 |
| `4.5` | L7 |
| `5.5` | L6 |
| `6.5` | L5 |
| `7.5` | L4 |
| `8.5` | L3 |
| `9.5` | L2 |
| `10.5` | L1 |

**Right** (`x = 19`) — 11 gaps:

| y | Loop(s) |
|---|---------|
| `0.5` | L8 |
| `1.5` | L7 |
| `2.5` | L6 |
| `3.5` | L5 |
| `4.5` | L4 |
| `5.5` | L3 |
| `6.5` | L2 |
| `7.5` | L1 |
| `8.5` | L1 |
| `9.5` | L2 |
| `10.5` | L3 |

Corner **nails** `(0,0)`, `(19,0)`, `(0,11)`, `(19,11)` are not gap points — gaps sit at
edge midpoints, so the outermost visited coords are as listed above.

Most coordinates are half-integers (gap midpoints). Integer values appear on grid
lines — e.g. `x ∈ {0, 11, 19}`, `y = 3` at the concave notch `(7.5, 3)`.

### Convex corners

A **convex corner** is a nail `(x, y)` where exactly **one** of the four surrounding
cells is filled — an outer tip of the shape. Each convex corner has exactly **2 gaps**
(one on each wall segment leaving the corner).

In the two-panel model, every gap `(x, y)` can be visited on **panel A** or **panel B**
depending on the loop step — the coordinates are shared; the panel label is the sheet
the string is on at that step.

**Seam gaps** like `(0.5, 11)` sit on the bottom edge at `y = 11` (the green seam).
They appear in the viewer as orange dots with a **green ring** (one dot — both panels
share that point). Hover shows `A/B (0.5, 11) · portal · seam`.

| Nail | Gap | Edge | Seam? | Panel A (loop steps) | Panel B (loop steps) |
|------|-----|------|-------|----------------------|----------------------|
| `(11, 0)` top of step | `(11.5, 0)` H | top | | L1 step 0 | L1 step 10 |
| | `(11, 0.5)` V | right | | L1 step 19 | L1 step 9 |
| `(19, 0)` top-right tip | `(18.5, 0)` H | top | | L8 step 0 | L8 step 6 |
| | `(19, 0.5)` V | right | | L8 step 7 | L8 step 1 |
| `(0, 3)` top-left step | `(0.5, 3)` H | top | | L8 step 3 | — |
| | `(0, 3.5)` V | left | | L8 step 4 | — |
| `(0, 11)` bottom-left tip | `(0.5, 11)` H | bottom | **yes** | L1 step 5 | — |
| | `(0, 10.5)` V | left | | L1 step 4 | — |
| `(19, 11)` bottom-right tip | `(18.5, 11)` H | bottom | **yes** | L3 step 7 | — |
| | `(19, 10.5)` V | right | | L3 step 8 | — |

Rounded corner arcs in the viewer connect the **two gaps at the same nail on the same
panel** (e.g. on B: `(11, 0.5)` ↔ `(11.5, 0)` in Loop 3 steps 9→10).

**Vertical-side corner toggle:** at convex portal–portal corners where one flank is
the **left or right wall** (`x = 0` / `x = 19`) and the other is **horizontal**
(seam at `y = 11`, or step top at `y = 3`), exactly **one** panel toggle per corner
crossing — same side-first / horizontal-first rule as the bottom seam corners.

---

## Loop 1

Starts at `A (11.5, 0)`. At the bottom-left seam corner the side flank
`(0, 10.5)` does **not** toggle panel; only the seam gap `(0.5, 11)` does.

```
   0 A (11.5,0) →↓
   1 B (19,7.5) ←↓
   2 A (15.5,11) ←↑
   3 B (7.5,3) ←↓
   4 B (0,10.5) →↓
   5 A (0.5,11) →↑
   6 B (8.5,3) →↓
   7 A (16.5,11) →↑
   8 B (19,8.5) ←↑
   9 A (11,0.5) →↑
```

## Loop 2

```
   0 A (12.5,0) →↓
   1 B (19,6.5) ←↓
   2 A (14.5,11) ←↑
   3 B (6.5,3) ←↓
   4 A (0,9.5) →↓
   5 B (1.5,11) →↑
   6 A (9.5,3) →↓
   7 B (17.5,11) →↑
   8 A (19,9.5) ←↑
   9 B (11,1.5) →↑
  10 B (12.5,0) →↓
  11 A (19,6.5) ←↓
  12 B (14.5,11) ←↑
  13 A (6.5,3) ←↓
  14 B (0,9.5) →↓
  15 A (1.5,11) →↑
  16 B (9.5,3) →↓
  17 A (17.5,11) →↑
  18 B (19,9.5) ←↑
  19 A (11,1.5) →↑
```

## Loop 3

Starts at `A (13.5, 0)`. At the bottom-right seam corner (steps 7–8) the seam flank
does **not** toggle; the side flank `(19, 10.5)` does. Length 10 (one lap).

```
   0 A (13.5,0) →↓
   1 B (19,5.5) ←↓
   2 A (13.5,11) ←↑
   3 B (5.5,3) ←↓
   4 A (0,8.5) →↓
   5 B (2.5,11) →↑
>>> 6 A (10.5,3) →↓
   7 A (18.5,11) →↑
   8 B (19,10.5) ←↑
>>> 9 A (11,2.5) →↑
```

## Loop 4

```
   0 A (14.5,0) →↓
   1 B (19,4.5) ←↓
   2 A (12.5,11) ←↑
   3 B (4.5,3) ←↓
   4 A (0,7.5) →↓
   5 B (3.5,11) →↑
   6 B (14.5,0) →↓
   7 A (19,4.5) ←↓
   8 B (12.5,11) ←↑
   9 A (4.5,3) ←↓
  10 B (0,7.5) →↓
  11 A (3.5,11) →↑
```

## Loop 5

```
   0 A (15.5,0) →↓
   1 B (19,3.5) ←↓
   2 A (11.5,11) ←↑
   3 B (3.5,3) ←↓
   4 A (0,6.5) →↓
   5 B (4.5,11) →↑
   6 B (15.5,0) →↓
   7 A (19,3.5) ←↓
   8 B (11.5,11) ←↑
   9 A (3.5,3) ←↓
  10 B (0,6.5) →↓
  11 A (4.5,11) →↑
```

## Loop 6

```
   0 A (16.5,0) →↓
   1 B (19,2.5) ←↓
   2 A (10.5,11) ←↑
   3 B (2.5,3) ←↓
   4 A (0,5.5) →↓
   5 B (5.5,11) →↑
   6 B (16.5,0) →↓
   7 A (19,2.5) ←↓
   8 B (10.5,11) ←↑
   9 A (2.5,3) ←↓
  10 B (0,5.5) →↓
  11 A (5.5,11) →↑
```

## Loop 7

```
   0 A (17.5,0) →↓
   1 B (19,1.5) ←↓
   2 A (9.5,11) ←↑
   3 B (1.5,3) ←↓
   4 A (0,4.5) →↓
   5 B (6.5,11) →↑
   6 B (17.5,0) →↓
   7 A (19,1.5) ←↓
   8 B (9.5,11) ←↑
   9 A (1.5,3) ←↓
  10 B (0,4.5) →↓
  11 A (6.5,11) →↑
```

## Loop 8

Starts at `A (18.5, 0)`. At the top-left step corner `(0, 3)` the horizontal flank
`(0.5, 3)` does **not** toggle; the side flank `(0, 3.5)` does. Length 6 (one lap).

```
   0 A (18.5,0) →↓
   1 B (19,0.5) ←↓
   2 A (8.5,11) ←↑
   3 A (0.5,3) ←↓
   4 B (0,3.5) →↓
   5 A (7.5,11) →↑
```
