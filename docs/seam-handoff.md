# Seam / 12-cycle shoe — HANDOFF (2026-06-18)

Read this whole thing before touching anything. It supersedes the older `docs/seam-handover.md`.
It is written for a fresh chat to pick up cleanly. The owner is João's collaborator; when he
reports what the physical shoe does, that is **ground truth** — make the code match it, never
argue his eyes.

There is ONE hard rule that must gate everything (see §2). Several past attempts (including a
whole "corner-action" mechanism) violated it and produced impossible weaves. Do not repeat them.

---

## 0. The board (exact)

- The flat panel is an **L-shape: 19 cells wide × 11 cells tall, with an 11×3 notch removed from
  the top-left.** In code: `cells[y][x] = !(y < 3 && x < 11)`, x∈[0,19), y∈[0,11).
- Build it with `FaceTrace.Lpanel(19, 11, 11, 3)` (browser) or the same in `scripts/cords.mjs` (`L`).
- The boot is **two of these panels** assembled into a 3D bent tube, open at the ankle (the **cuff**),
  closed at the toe.
- Geometry vocabulary (CORRECTED 2026-06-19 — the owner caught the old version conflating
  nails and gaps; get this right or you will repeat my mistake):
  - **NAIL** = a physical pin = where the cord turns/passes. Nails sit at the **INTEGER**
    boundary points. **A convex corner has exactly ONE nail, sitting on the corner.**
  - **GAP** = the boundary CROSSING point = the **edge MIDPOINTS** (`buildGaps`), half-integer
    coords. A **nail sits BETWEEN two gaps.** So a convex corner nail has **two gaps**, one on each
    edge meeting there. (These two gaps are NOT two nails — that error is what the owner kept
    having to correct.) The L has **60 gaps**; each gap has 2 faces → **120 (gap,face) slots**.
  - **THE INVARIANT counts (gap,face) slots, not directions.** "every nail-side once" in §2 means
    every (gap,face) is used by exactly ONE cord. Do NOT key the disjoint check on direction too —
    two cords crossing one (gap,face) in opposite directions still collide, and a direction-keyed
    check waves that through (this fooled me on 2026-06-19; see §9).
  - The **cuff** = the top edge of the tower (y=0, x from 11 to 19) = 8 gaps → 16 (gap,face) slots.
  - **The concave (internal) corner** at vertex (11,3) is the SINGULARITY: a 45° cord hitting that
    vertex breaks the billiard, and the geometry guarantees no cord ever reaches it. The engine never
    visits it. It is the one corner that gets no wrap/through choice. (Dashed ring in face.html.)

---

## 1. The engine (verified — treat as correct, change with extreme care)

- `src/engine.js` (global `TearEngine`): the 45° billiard. `buildEdges`, `buildGaps`,
  `tracePath`, `getAllCycles`, `getInitialDir`, `pointToGapIdx`.
- `scripts/cords.mjs` (Node) and `src/face-trace.js` (browser twin, **byte-identical trace logic**):
  the two-faced cord tracer. THE RULE it implements:
  > a 45° cord REFLECTS at every wall (U-turns in direction). At a **TIED** edge it **switches face**
  > (front↔back); at an **OPEN** edge it **stays** on the same face. Every cord closes on its start.
- It is verified: `node scripts/face-verify.mjs` → ALL PASS (coverage, closure, continuity, the rule,
  nails-on-boundary, counts vs gcd/pouch table, and disjoint orbits keyed by nail+face+direction).

### Owner's language ↔ the rule
- **"turn / wrap back on itself" at the edge = STAY on the same face = OPEN behaviour.**
- **"go through" at the edge = CROSS to the other face = TIED behaviour.**
  (Both still physically U-turn in direction — the difference is the face.)

---

## 2. THE HARD INVARIANT (the owner caught me breaking this; never break it again)

**The engine cannot touch a nail-side more than once.** A bounce hands each (nail, face) to exactly
ONE cord — two cords physically cannot share a bounce. Verified live on the real engine:
L cuff-open → 8 cords, **all 120 nail-sides touched exactly once**, none twice.

> RULE: before quoting ANY cord count to the owner, run the every-nail-once check on the model.
> If a model double-touches a nail-side, it is producing a weave that cannot exist on the board.
> It is INVALID, no matter what number it prints. Throw it out.

---

## 3. What is TRUE and SOLVED

The verified engine on the L with **cuff open** gives **8 cords**, and this **exactly matches the
owner's 8-cycle shoe**:
- 8 cords, all closed, every nail-side touched once.
- Cuff profile: **all 8 cords touch the cuff exactly twice** → 16 cuff touches = the 8 cuff nails ×
  2 faces, each used once. The owner: "the cuff is perfectly 8 and 8, 2 of each colour, mirrored."
- So **the 8-cycle shoe is the engine running honestly.** No tricks needed. Confirmed.

Legal per-edge configs and their honest counts (every-nail-once = YES for all):
- cuff open → **8** (the 8-shoe), cuff profile {each cord twice}.
- nothing open (all "go through") → **8**, same profile.
- everything open → 16.
None of the legal settings gives 12.

---

## 4. The owner's spec for the TWO shoes (GROUND TRUTH — quote verbatim)

Same board/pattern; the difference is what the cord does when it reaches an edge.

**8-cycle shoe** (matches the engine, §3):
- 4 of the cords **wrap back on themselves at the edge**: **3 of those are at a corner, and 1 is at
  the 5th nail down on the back heel.**
- Cuff: perfectly 8 and 8; **2 of each colour** (8 colours, each appearing twice), **mirrored**.

**12-cycle shoe** (NOT yet reproduced legally):
- The cord **goes THROUGH rather than turning back on itself** when it reaches the edge. The owner:
  "I cannot see anywhere where this is not the case." → all-through, no wrap-backs.
- 12 cords. At the cuff: **all 12 colours appear at least once, with 4 repeated** → **16 total cuff
  touches** = 8 cords touch once + 4 cords touch twice. (Every cuff nail-side used once.)

So **12-shoe = the 8-shoe with its 4 wrap-backs turned into go-throughs**, and that should add +4
(8 → 12) while keeping every nail-side touched exactly once.

---

## 5. THE CORE UNSOLVED PROBLEM (state it precisely)

In the verified engine, "wrap back vs go through" is a **face** choice (stay vs cross). But changing
that choice **does not change the count**: cuff-open = 8 and all-through = 8 both give 8. So the
face-flip rule, by itself, cannot turn 4 wrap-backs into +4 cords.

Therefore the owner's "go through at the corner" must do something the current engine does NOT model,
something that **splits 4 cords (8 → 12) legally (every nail once)**.

**Leading hypothesis for the next chat to test:** maybe "go through" does NOT mean "reflect but flip
face." Maybe it means the cord **passes straight through the edge to the other face WITHOUT the U-turn
reflection** (continues onto the back instead of bouncing). That is a genuinely different billiard move
than anything tried so far, and it could restructure the cords. Test it, and CHECK every-nail-once.
(Caveat: "through at the corner" must not mean through the phantom vertex — that's the singularity.)

---

## 6. DEAD END — do NOT resurrect (it failed the §2 invariant)

The **"corner-action" mechanism** (a corner = one nail, flip its net face change to force
"come back" vs "go through" via a correction at the wrap-completion). Implemented in:
- `face.html` corner pins (click to flip same↔through) and
- `scripts/corner-action-test.mjs`, `corner-page-sweep.mjs`, `corner-suppress-test.mjs`,
  `corner-truecount.mjs`, `foot-corner-test.mjs`, `corner-open-test.mjs`, etc.

It appeared to "reach 12" for some corner configs, and the owner's "foot corner comes back" idea
gave 12 there. **But it is INVALID**: `scripts/cuff-debug.mjs` shows it runs TWO different cords
through the same cuff bounce at 2 nail-sides (e.g. (13.5,0):front, (18.5,0):front), which is
impossible. Its 12s and 13s come from cords overlapping. Do not cite any number from it. The
mechanism does not keep cords disjoint. If you want a corner/per-nail action, it MUST pass the
§2 every-nail-once + face-verify disjoint-orbit check first.

---

## 7. Files

VERIFIED / TRUST:
- `src/engine.js`, `scripts/cords.mjs`, `src/face-trace.js` — the engine + two-faced tracer.
- `scripts/face-verify.mjs` — the audit (ALL PASS). Run it after any engine change.
- `face.html` + `src/face-trace.js` — the front/back single-cord animator. The cord travel, the
  faces, the nails are correct. **The corner-pin toggles are the §6 dead-end — ignore/remove them.**
  Serve: `node build/serve.js <port>` then open `/face.html`.

DIAGNOSTICS (one-offs, fine to keep/delete):
- `scripts/cuff-debug.mjs`, `cuff-touch.mjs`, `render-12.mjs` (draws the shoe interwoven+thick),
  and the `corner-*`/`mouth-*`/`concave-*` scripts (all part of the §6 dead end).

SACRED: the main app `index.html` / `src/app.js` is João's product. NEVER touch it. All seam work
lives in `scripts/` + `face.html` + `src/face-trace.js`. (See the project memory `seam-shoe-model`.)

---

## 8. What to do next (in order)

1. **Re-confirm the anchor**: `node scripts/face-verify.mjs` passes, and the engine's cuff-open L = 8
   = the 8-shoe (the cuff {2:8} profile). Start from this known-true ground.
2. **Get ONE real cord traced off the shoe** — ideally one of the 4 that touch the cuff twice in the
   12-shoe. Start nail, then each step: to which nail, and does it WRAP BACK (same side) or GO THROUGH
   (other side), until it closes. This single real path is worth more than any model guess.
3. **Test the §5 hypothesis** ("go through" = pass straight through without reflecting) as a legal
   move, and gate it on §2 (every-nail-once) before believing any count.
4. **Never** quote a cord count to the owner without the every-nail-once check. The 8 is real; the 12
   must be earned the same clean way.

The whole job is: make the engine produce the **12-cycle shoe** — 12 cords, all-through, every cuff
nail-side used once (4 cords touch twice, 8 once), **every nail-side touched exactly once** — starting
from the fact that the engine already produces the 8-cycle shoe perfectly.

---

## 9. Findings 2026-06-19 (owner clarified the move; two hypotheses tested + KILLED)

Owner clarified §5: "go through = NO reflection, reads as if it never hit the edge," and
"on the 12-shoe the cord **passes through the corner nail to the other side**." Tested both,
gated on the corrected §2 invariant. Scripts: `scripts/seam-passthrough.mjs`, `scripts/corner-through.mjs`,
`scripts/corner-8shoe.mjs`. Anchors re-confirmed (8-shoe = 8, cuff {2x:8} = 16, clean).

1. **Literal "no reflection / keep direction" walks the cord OFF the board** (ray escapes, never
   closes). On a single flat panel there is nothing past the edge to continue onto. The move is only
   defined once you know WHERE the cord re-enters on the back = the panel-join/seam map. (`seam-passthrough.mjs`.)

2. **"Pass through the corner" modeled as a face-flip on the SAME path is the §6 dead-end, reproduced
   and explained.** Convex corner = one nail, two gaps; toggling which face the cord exits the corner
   on does change the count (8→9/10/12/13), BUT every count ≠ 8 is reached by putting **two cords on
   the same (gap,face)** (e.g. all-5-through: 19 shared nail-sides) and the cuff comes out 17/18, not
   16. Flipping the cord to the back "in place" is relabeling, not rerouting — it corrupts the global
   over/under parity. NO legal 12 exists in the 32-config sweep. (`corner-through.mjs`.)

3. **Audit hole found & fixed.** My first audit keyed disjointness on (gap,face,**direction**), which
   passed the illegal 12s because the two colliding cords cross the shared nail-side in opposite
   directions. The owner's cuff number (16) exposed it. The correct check is (gap,face) ownership only;
   now baked into `corner-through.mjs`'s `audit()`. face-verify's slot check has the same direction key —
   treat it as necessary-but-not-sufficient; always also check (gap,face) cross-cord ownership.

CONVERGENT CONCLUSION (three independent routes — no-reflection, corner-through, and the older
double-cover/cylinder sweeps): the model already represents front/back panels as the two faces and
already lets a cord switch panels at a tied edge. What it lacks is the **geometric relationship between
the two panels** (how the back sits against the front when sewn). Every move that stays on the trivial
(mirror-stacked) relationship gives 8 or an illegal weave. The +4 lives in the real panel-join.

NEXT (unchanged priority, now sharper): get ONE real cord traced off the 12-shoe — start gap, then at
each nail: next nail + wrap-back-or-through, until it closes. That fixes the re-entry rule empirically
and ends the seam-map guessing.
