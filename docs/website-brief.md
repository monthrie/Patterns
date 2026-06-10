# João das Cordas — website brief

**Deliverable:** a public story-site for João's craft. This brief is self-contained: hand it to a designer (human or Claude) with the repo and they can build the whole thing. Companion docs: `knowledge-base.md` (facts — correct that first, write second), `where-this-craft-sits-in-mathematics.md` (the essay, becomes a page), `design-code-spec.md` (T1 codes), `barbante-beatriz-colors.md` (real yarn palette).

**This is product #2/#3 of the agreed strategy** — (1) A Oficina = João's tool, iterate forever, never redesign; (2) the site/Toy = separate app, shared engine. The site must NOT touch `index.html` or change the Oficina in any way.

---

## 1. The pitch (what the site must make a stranger feel in 60 seconds)

An elderly Portuguese craftsman invented, alone, a way of making real cloth out of nothing but **closed loops of cotton cord** — no warp, no weft, no seams, no stitches, every cord spliced invisibly back to its own beginning. The patterns aren't designed; they're **computed by the shape of a wooden board**, by a rule mathematicians call mirror curves — the geometry of Angolan sand drawings, Celtic knots and Tamil kolam. For the irregular boards João builds, counting the loops is an **open problem in mathematics (2020)**. A friend built him a small program so the pencil-work would stop rationing his imagination; he has since woven 15-loop patterns that, quite possibly, **no human being had ever seen**.

It looks like a weave. It is a constellation of circles holding each other in place.

## 2. The narrative spine (Wilmon's structure — this is decided, not optional)

**A scroll story where the cycle count rises as you descend, and the escalation IS João's biography.**

A sticky counter (big numeral, JetBrains Mono) ticks up as you scroll: **1 → 2 → 4 → 8 → 12 → 15**. Each number is a station; each station pairs a **live in-page animation of that exact pattern being laid** (real engine, real bounces — never video) with a **photograph of the physical piece** João made of that very pattern. Digital twin ↔ cotton twin.

| # | Station | Story beat | Animation | Photo needed |
|---|---|---|---|---|
| — | **Hero** | "One cord, bouncing." Full-bleed player laying a single cord; title overlays when it closes | 17×10 (gcd 1), `autoplay:'visible'` | none (the animation is the hero) |
| 1 | **The purist** | For years a piece only *counted* if one cord did the whole board. He re-derived, alone, the thousand-year-old Chokwe ideal of monolinearity. Also the **hardest** craft: one pass drags the whole cord's length through every crossing | 17×10 single cord, slow, single colour | a 1-cycle piece |
| 2 | **The accident** | A board came out wrong — two loops. Instead of a failure he saw a pattern. He loved it | 18×10, two colours | the/a 2-cycle piece |
| 4 | **Loops are colours** | Second accident, four loops — and the realization that changed everything: **every loop can carry its own colour**. The flaw became the medium | a 4-cycle board, 4 yarn colours | spools photo (have it) + a 4-cycle piece |
| ∮ | **Interlude: the mathematics** | Sand of Angola → Gerdes → gcd(m,n) → the open problem. Short on the scroll; "read the full essay" → essay page behind a photo of the jacket | the gcd trio (18×10 / 14×12 / 8×6 — same 2-cord cloth at three sizes, already proven in about.html) | sona drawing (sourced/licensed) optional |
| 8 | **The jacket** | ~200 hours. Eight circles of cotton and nothing else. No thread in it has an end — dare the reader to find one. Strictly: a wearable 8-component alternating link | **the jacket's actual design code**, traced live | jacket: full, worn, and **macro of a join** |
| 12 | **The shoes** | A thing you can walk in, made of nothing but circles | the shoes' pattern | shoes |
| 15 | **The open country** | Patterns that exist only by computation, in a shape-space so large most of his multi-cycle pieces are plausibly **first sightings by any human**. "200 hours per theorem" | a real 15-cycle design of his, full palette | a 15-cycle piece |
| ✚ | **Two crafts** | The collaboration: a weaver who could only see four loops ahead, and a friend who built him an instrument — a small handmade program with one user. Toolmaker and weaver, mirrored. (**Never** the phrase "vibe coding"; tell it as friendship + tools) | the Oficina itself, briefly (screenshot or short capture) | João at the board / board mid-weave |
| ▶ | **Try it** | Hand the reader the rule: the Play tab (§5) | — | — |

Footer: provenance line, contact/commissions teaser ("each pattern has a *first traced* and *first woven* date — provenance no other craftsman can print"), link to A Oficina.

## 3. What we can do live (the unfair advantage)

Every animation on the site is the **real engine**, not video. Already built and shared:

- **`src/engine.js`** (`TearEngine`) — pure billiard/weave engine, zero deps.
- **`src/player.js`** (`TearPlayer`) — embeddable trace-player. Options: `cells` (arbitrary shapes — L-shapes, holes), `gw/gh`, `colors`, `autoplay:'visible'` (IntersectionObserver — plays when scrolled into view; this is the scroll-story mechanism, already working), `speedFactor`, `loop`, `strand` thickness, `nails`, `bg`, `onDone`/`onTick` callbacks (→ drive the sticky counter, trigger text reveals when a cord closes).
- **`src/code.js`** (`TearCode`) — T1 design codes: every pattern on the site is a ~40-char URL-safe string. Patterns are **shareable as URLs** (`#T1-…`), which is also the commissions backbone later.
- **`about.html`** — the prototype of all this; the site supersedes it. Its copy is good seed copy.

Laying rule (owner's hard rule, already enforced by the player): a string being laid is **CONTINUOUS** — gaps only where it dives under cord already on the board.

## 4. Visual language — hard rules from the owner (violations got a redesign rejected)

- **Cool slate, modern, minimal.** The existing system: `--ink #090c0f`, `--ink-2 #121a22`, `--hair #1e2832`, `--bone #c1cad3`, `--dim #6d7884`, `--accent #a3b8c4`. JetBrains Mono throughout.
- **NO** warm/brass/wood "workshop" theming, **no** serif/decorative display fonts, **no** rope texture, gradients, shadows, or "lit cylinders" on strands. Strands are flat and clean. ("70s museum librarian design" = the rejected direction.)
- **All colour comes from the yarn.** The chrome stays slate; the 15-colour JOAO palette / 13 Barbante Beatriz swatches are the only saturated colours on the page, and they appear only inside patterns and photos. The spools photo *is* the palette section.
- Photography treatment: honest, well-lit, uncropped craft — not lifestyle-blog styling.
- Motion: the cord animations carry all the "wow". No parallax gimmicks, no scroll-jacking; plain scroll with `autoplay:'visible'` players and counter ticks is enough.

## 5. The Play tab ("the Toy") — phase 2, design for it now

A separate playful app (NOT the Oficina — João's muscle memory is sacred; the Toy can diverge freely):

- v1 scope: draw a shape on a grid → cords trace live → count + colours appear → **Share** button copies a `#T1-…` URL that reproduces the design. Mobile-first, zero chrome, instant.
- It reuses `engine.js` + `player.js` + `code.js` verbatim. The drawing surface is new code.
- A "send this to João" / commission hook can attach to the share URL later — bake design-code URLs in from day one.
- On the site it's a tab/route ("Experimenta / Play"), not a section of the scroll.

## 6. Tech recommendation

- **Stack:** React is fine for the site shell (routing, i18n, scroll orchestration) — but the engine/player/code modules stay **vanilla JS, shared verbatim** with the Oficina; mount players in refs. Vite + static export. No backend.
- **Hosting:** GitHub Pages (already serving `gh-pages-mobile`); site can live at the repo root path or its own repo/domain. Domain candidate: *joaodascordas.pt* (open question).
- The site does **not** need the Oficina's offline/self-contained constraint — normal bundling, lazy-loaded photos.
- **Bilingual PT/EN** from day one (PT is João's and the craft's language; EN is the math/Bridges audience). Same toggle pattern as the app.
- Pattern provenance: a small JSON manifest per piece — design code, title, first-traced date, first-woven date, photo refs.

## 7. Assets — have / need

**Have:** spools photo (`docs/joao-woven-cushion.jpeg` — note: the file currently shows the **yarn spools**, not a cushion; fix the filename or recover the cushion shot), the essay, the engine/player/codes, about.html copy.

**Need (the photo shoot list, one session at João's):**
1. Jacket — flat, worn, and **macro of an invisible join** (the single most persuasive image possible).
2. Shoes. 3. A 1-cycle piece, a 2-cycle piece, a 4-cycle piece, a 15-cycle piece. 4. João at the board; a board mid-weave with nails visible. 5. The cushion (red/turquoise/cream).

**Need (data):** recreate each photographed piece in the app and save its design code, so every station's animation traces **the true pattern of the physical object**. Verify with João: nail spacings, board sizes, colour-assignment habits, whether he names pieces.

## 8. Things the site must NOT say (corrections log — we got these wrong once)

- ✗ "One-string shapes are rare." Wrong — gcd=1 is the *common* rectangle case (~61%). One-string is special for craft difficulty and his purist history, not rarity.
- ✗ "More loops = harder." Inverted — fewer loops is harder handwork.
- ✗ Overclaiming precedent. Exact wording: "as far as we have been able to discover, no documented precedent."
- ✗ "Vibe coding" or any framing of the tool as AI novelty. Friendship + instrument-making.

## 9. Wireframe (portrait scroll; landscape = animation left / photo+text right)

```
┌─────────────────────────────┐
│  HERO  full-bleed player    │  cord laid live; title fades in on close:
│  "JOÃO DAS CORDAS"          │  "One cord, bouncing."  [PT/EN]  [▾ scroll]
├────────────┬────────────────┤
│  sticky    │  STATION 1     │  counter rail (left, sticky): big numeral
│  counter   │  player 17×10  │  ticks 1→2→4→8→12→15 as stations enter
│            │  text: purist  │  each station: player (autoplay:visible)
│     1      │  photo: piece  │  + ~120 words + photo of the real object
├────────────┼────────────────┤
│     2      │  THE ACCIDENT  │  18×10, two colours
├────────────┼────────────────┤
│     4      │  LOOPS=COLOURS │  spools photo full-width; palette chips
├────────────┼────────────────┤
│     ∮      │  MATH INTERLUDE│  gcd trio side-by-side → [Read the essay]
├────────────┼────────────────┤
│     8      │  THE JACKET    │  biggest station; join macro; link badge
├────────────┼────────────────┤
│    12      │  THE SHOES     │
├────────────┼────────────────┤
│    15      │  OPEN COUNTRY  │  full-palette 15-cycle trace
├────────────┴────────────────┤
│  TWO CRAFTS  (collaboration)│  João + the tool; photo of him at board
├─────────────────────────────┤
│  ▶ EXPERIMENTA / PLAY       │  → Toy route (tab in header too)
├─────────────────────────────┤
│  footer: provenance ·       │
│  commissions · A Oficina    │
└─────────────────────────────┘
Header (thin, slate): JOÃO DAS CORDAS · História | Matemática | Experimenta · PT/EN
Routes: / (scroll story) · /matematica (essay) · /experimenta (Toy) · → A Oficina (external)
```

## 10. Build order

1. Photo shoot + design-code recreation of each photographed piece (blocks everything visual).
2. Scroll story with the stations that have assets; placeholder-free — ship only stations with real photos, add stations as photos arrive.
3. Essay page (content done — typeset it).
4. Toy v1 (draw → trace → share URL).
5. Commissions layer (later; URLs already in place).
