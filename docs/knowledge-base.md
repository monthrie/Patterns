# Knowledge Base — João, the craft, the mathematics

Working record of everything established so far. **Facts, not prose** — the essay(s) get written *from* this. Correct this file first, write second.
(Companion piece: `where-this-craft-sits-in-mathematics.md`.)

---

## 1. João — the person and the work

- Elderly Portuguese craftsman; designs on an Android tablet using the Knot Maker app (live at monthrie.github.io/Patterns); builds physically on nail boards with 4mm cotton cord (barbante).
- **Invented the process himself.** No knowledge of sona, mirror curves, Gerdes, or any of the related mathematics when he developed it.
- **The jacket**: exactly 8 cycles (8 closed loops), ~200 hours, no stitches, no seams. Process entirely his own invention.
- **The shoes**: 12 cycles each, no stitches. Wearable 3D forms from flat loop-weaving.
- **The joins**: he closes every loop physically — each cord's end spliced back to its own beginning, invisibly ("tied perfectly to itself"; you cannot find the join). This makes every piece a literal realization of closed mathematical curves / a multi-component link. Confirmed by Wilmon 2026-06-10.
- **His aesthetic arc** (important, verified by Wilmon):
  1. Started as a **one-string purist** — for a long while a piece only counted if a single cord completed the whole board. (Independently re-derived the Chokwe monolinearity ideal with zero contact.)
  2. **Accidentally** made a 2-cycle piece — loved the pattern.
  3. Later accidentally made a 4-cycle — loved that too.
  4. Realized loops can **encode colour** → multi-cycle colour patterns became his central fascination.
- Before the app: hand-drew every candidate pattern, bounce by bounce; never knew a pattern beyond ~4 cycles. The app removed that wall; he has since designed **and physically built 15-cycle patterns**.
- Pattern discovery is the part that excites him most.
- Wilmon: "the best thing I have seen a human do."

## 2. Craft mechanics & hard-won practical truths

- Board: nails along the boundary of a cell-grid shape; cord travels at 45°, bounces at edges, returns to start; multiple loops cover the board; crossings alternate over/under (checkerboard parity).
- **Difficulty inverts the math** (key insight, Wilmon 2026-06-10, NOT yet in essay by request):
  - 1 cycle = mathematically the common/simple case but **the hardest craft** — every weaving pass drags the entire piece's cordage through.
  - Many cycles (e.g. 15) = easier handwork — each cord is short.
  - ⇒ any difficulty/pricing model should scale with **length-per-loop** (and under-crossing count), not loop count.
- Distinct colours per loop = his colour-encoding medium; two-colour-per-loop (half/half split) also used (exists in app).
- Nail spacing default in app: 1.5 cm (lengths computed as path length × spacing).
- His physical yarn palettes: `barbante-beatriz-colors.md` (13 swatched colours) + the 15-colour JOAO palette in the app (PT names: Branco, Creme, Amarelo, Âmbar, Coral, Vermelho, Rosa Claro, Rosa Choque, Magenta, Roxo, Verde Neon, Verde Mar, Turquesa, Azul, Preto).
- Reference photo: `docs/joao-woven-cushion.jpeg` (red/turquoise/cream cushion).

## 3. The mathematics — established results

(Sources with links: see the research survey section at the bottom of the essay.)

- The paths are **mirror curves** (Gerdes/Jablan terminology), the geometry of the **sona** sand drawings of the Chokwe people, NE Angola; same family generates Celtic knotwork and Tamil kolam.
- **gcd theorem**: an m×n rectangle needs exactly gcd(m,n) loops (Gerdes; also classical via arithmetic billiards).
  - Corollaries: all loops of a rectangle have **equal length** ∝ lcm(m,n). A **square n×n needs exactly n loops** (maximal case — the heatmap diagonal).
  - **Distribution**: probability two random sides are coprime = 6/π² ≈ 61% ⇒ **monolinear is the COMMON case for rectangles**, not rare. (Correction logged — see §5.)
- **Merge/split rule**: an obstacle/mirror at a crossing of two *different* loops always fuses them (count −1); at a self-crossing it splits or preserves (Chavey–Straffin).
- **Universality**: mirror curves with alternating crossings realize *every* knot and link (Jablan, Radović, Sazdanović, Zeković — equivalence with knot mosaics/grid diagrams).
- **Open problem**: no closed-form loop count for general polyominoes (L-shapes, holes, notches). Only clean general result: scaling law **L(kP) = k·L(P)**. Posed as unsolved in print as recently as 2020 (Yuan).
- 3D cousins: **billiard knots** (Jones & Przytycki; Lissajous knots; Lamm; Koseleff & Pecker: every knot is a billiard knot in some prism).
- Each finished piece is, strictly, an **alternating link** with N components (jacket = 8-component link; shoes = 12-component).

## 4. Lineage & novelty assessment (researched, cited in essay)

- Historical chain: **diagonally plaited mats → sona sand drawings → mathematics**. Gerdes established the drawings descend from mat-strand paths.
- Crucial distinctions vs the mats (so "someone did it before" is wrong):
  - Mat-makers worked **locally** (crossing by crossing); João works **globally** (one whole closed cycle at a time).
  - Mat strands are finite, spliced, with ends — the **closed loop was the sand drawings' idealization**, never physically realized in textile. João's invisible self-joins make it physically true, apparently for the first time.
  - Mats were rectangles only; João works in the open-problem territory (irregular boundaries, holes).
- Chokwe aesthetics prized **monolinearity** (one line = mastery; many lines = lesser/corrupted variant). João held the same ideal independently, then inverted it via accidents → loops-as-colours.
- **No software precedent**: closest is Chavey's educational sona Java tool (Beloit). Nothing combines arbitrary boundaries + billiard tracing + over/under weave + physical string lengths + fabrication output.
- **No craft precedent found**: no documented tradition weaving mirror-curve paths as textile on nail boards. Honest claim wording: "as far as we have been able to discover, no documented precedent."
- Most of his multi-cycle patterns on irregular boards are plausibly **first sightings by any human** (only computable by simulation; astronomically large shape space).
- Key people: **Paulus Gerdes** (1952–2014), **Slavik Jablan** (1952–2015) — both deceased. Living/active in the lineage: Ljiljana Radović (Niš), Radmila Sazdanović (NC State), Józef Przytycki (GWU), Darrah Chavey (Beloit), Christoph Lamm, P.-V. Koseleff, D. Pecker. Natural first audience: **Bridges** (math & art conference).

## 5. Corrections log (things we got wrong once — don't repeat)

- ✗ "One-string shapes are rare, like primes." → **Wrong.** gcd=1 is the most common rectangle case (~61%); João reports most patterns generally come out one-cycle. One-string is special for *craft difficulty* and for his purist history, not rarity. (2026-06-10)
- ✗ Assuming loop count ∝ difficulty. → **Inverted.** Fewer loops = harder handwork (cordage dragged per pass). (2026-06-10)
- ✗ Early essay draft implied mats ≈ João's craft. → Sharpened: mats approximated the geometry locally with finite strands; the realized closed loop is his. (2026-06-10)

## 6. Story fragments & angles for future writing

- "The garment remembers what it is made of" / pull one strand → one enormous circle.
- The invisible join: dare the reader to find an end. (Macro photo needed.)
- "200 hours per theorem."
- He re-derived a millennium-old aesthetic alone, then outgrew it by trusting his accidents.
- Specimens: each pattern's "first traced" / "first woven" dates — provenance no other craftsman can print.
- The Lusophone arc: Angola ↔ Portugal.
- Shoes: "a thing you can walk in, made of nothing but circles."
- The square paradox: the most symmetric board (n×n) is the most fragmented (n loops); the humble 17×10 is one perfect circle.

## 7. Website vision (Wilmon, 2026-06-10)

- **Structure: a scroll story where the cycle count rises as you descend** — and the escalation IS João's biography (1 = purist era → 2 = the accident he loved → colour realization → 8 = the jacket → 15 = mastery of the territory he once refused).
- **Each station pairs a live animation with the real object**: the actual engine tracing that exact pattern in-page (not video — real bounces), then a photograph of the physical piece João made of that very pattern. Digital twin ↔ cotton twin.
- **The collaboration is a core narrative thread**: a craftsman who could only see four loops ahead inspired a friend to build him an instrument — a small handmade program made for one user — and with it he went past every tradition. Toolmaker and weaver, two crafts mirroring each other. (Do NOT use the phrase "vibe coding"; tell it as friendship + tools.)
- The mathematics essay (`where-this-craft-sits-in-mathematics.md`) is a page on the site, behind a photo of the jacket.
- **Technical backbone**: every site animation = a design code + a small embeddable trace-player built on the shared engine. Build The Pull once; it serves the Oficina app, the Toy, and all website embeds.

## 8. Assets & to-dos for the website

- Have: cushion photo. Need: jacket photos, shoes photos, macro of a join, photo of João at the board, photo of nail board mid-weave.
- **Need for the twin pairs**: per piece, the design (cells/colors as a design code) AND a photo of the finished object — at minimum a 2-cycle piece, the 8-cycle jacket, a 15-cycle piece. Recreate each design in the app and save it so the site animation traces the true pattern.
- Verify with João: how he plans color assignment; how he handles corners physically; his nail spacing(s); board sizes; whether he names pieces.
- Product strategy (decided 2026-06-10): three products — (1) **A Oficina**: João's instrument (current index.html, PT-first, iterate forever); (2) **The Toy**: separate playful app, shared engine; (3) **Commissions**: later, design-code URLs baked in early.
