# João das Cordas — website brief

**Deliverable:** a public story-site for João's craft. This brief is self-contained: hand it to a designer (human or Claude) with the repo and they can build the whole thing. Companion docs: `knowledge-base.md` (facts — correct that first, write second), `where-this-craft-sits-in-mathematics.md` (the essay, becomes a page), `design-code-spec.md` (T1 codes), `barbante-beatriz-colors.md` (real yarn palette).

**This is product #2/#3 of the agreed strategy** — (1) A Oficina = João's tool, iterate forever, never redesign; (2) the site/Toy = separate app, shared engine. The site must NOT touch `index.html` or change the Oficina in any way.

---

## 1. The pitch (what the site must make a stranger feel in 60 seconds)

An elderly Portuguese craftsman invented, alone, a way of making real cloth out of nothing but **closed loops of cotton cord** — no warp, no weft, no seams, no stitches, every cord spliced invisibly back to its own beginning. The patterns aren't designed; they're **computed by the shape of a wooden board**, by a rule mathematicians call mirror curves — the geometry of Angolan sand drawings, Celtic knots and Tamil kolam. For the irregular boards João builds, counting the loops is an **open problem in mathematics (2020)**. A friend built him a small program so the pencil-work would stop rationing his imagination; he has since woven 15-loop patterns that, quite possibly, **no human being had ever seen**.

It looks like a weave. It is a constellation of circles holding each other in place.

## 1b. Who it's for — and what each visitor must leave with

The message hierarchy, in order of universality:

1. **The rule** — a cord at 45°, bouncing, coming home. Delivered by the hero animation in 10 seconds, before any words. Every audience gets this one.
2. **The man** — invented it alone; purist → accident → loops-as-colours; no documented precedent.
3. **The loops are real** — closed circles, invisible splices, no seams (the join macro is the proof shot).
4. **The mathematics is open** — his boards live on an unsolved problem; simulation is the only oracle.
5. **You can act** — read / play / follow / write / own / **learn**.

The scroll story carries 1–4 for *everyone*. Then three doors, one per serious audience — each visitor should find their door within one screen of finishing the scroll (and from the header at any time):

| Visitor | Must leave knowing | Their door |
|---|---|---|
| **Mathematician** (knot theory, ethnomath, Bridges) | The pieces are physically realized N-component alternating links, made on boards whose loop count is an open problem (Yuan 2020). His pattern corpus is *data*. He is alive, working, and reachable | `/matematica` — the essay, the precise-claims appendix with citations, and a **"for researchers" contact block** (conferences are already trying to reach him; make this trivially easy) |
| **Developer / tool-lover** | The entire craft is one rule; the engine is tiny; every pattern is a ~40-char URL | `/experimenta` — the Toy, plus a short "how it works" note (the rule in ~10 lines of pseudocode) and a link to the repo |
| **Buyer** | Each object is one of a kind with provenance no other craftsman can print — *first traced* / *first woven* dates, the design code as a certificate. Finished pieces are buyable; bespoke = get in touch (§5e) | `/obra` — the gallery (= the Instagram-fed pieces, §5c) + buy/enquire |
| **Learner / future apprentice** | This craft currently has — as far as anyone can discover — exactly one practitioner, and **he wants to pass it on**. You can write to him and learn | the *Aprender* invitation block (§5d) → contact intent *Learning* |
| **Curator / tastemaker** (galleries, designers — e.g. Pippa Small) | Seamless, one-of-a-kind textile objects, exhibition-ready, each with provenance and a story no other maker on Earth can tell. Elevated materials are *proven*: the jacket itself is fine wool (§5e tier) | the site itself as a one-link pitch: threshold → `/obra` → write to João |
| **Curious public / press** | The story itself | the scroll; share links |

Rule of thumb for every page: **beautiful first, then exactly as deep as that reader wants** — the home never shows a citation, the essay page never hides one. Every visitor should find their door within one screen of crossing the threshold (§2), and from the header at any time.

## 1c. The epic — and how it spreads

The story-like-no-other, compressed and *honest*: **twice invented, once proved.** A geometry invented in Angolan sand centuries ago; turned into theorems by the mathematicians who studied that sand (Gerdes, Jablan); then invented **again, from nothing**, by a Portuguese craftsman who knew none of it — re-deriving even their aesthetic ideals alone — and who carried it past both, into cloth, into territory where the mathematics is still open. With a fourth, mirroring echo: the toolmaker, who built an instrument for a friend and only then discovered how deep the whole thing goes. **Innocence is the motif: everyone in this story found the territory without a map.**

Virality is engineered, not hoped for:

- **One epic page.** The threshold + hero must carry the whole story in ~90 seconds. The famous-person test: someone with a million followers lands here — do they understand, feel it, and screenshot within a minute? If not, rework the threshold.
- **One sentence.** Every page exposes a copy-ready line. Working candidate: *"A retired Portuguese craftsman weaves patterns no human has ever seen — and mathematics cannot yet explain his boards."*
- **Shareable units.** Per-specimen OG/social cards (pattern render + provenance line) so every shared link unfurls beautifully in feeds; downloadable loop videos of patterns being laid — the player is inherently watchable, TikTok/IG-ready.
- **Reference the fascinating world directly.** `/matematica` carries a curated *watch & read* rail — the sona animation video, the Bridges PDFs, Jablan's mirror-curves page (`references.md` §9). João's story gains weight from showing the sand masters and mathematicians who came before him, not from standing alone.
- **Seeding map — each target gets its own hook:**
  - *Math YouTube* (Numberphile / Stand-up Maths / Mathologer): mirror curves + arithmetic billiards is squarely their beat; pitch = "an open problem, physically woven, by a man who never knew it was maths." **Single highest-leverage post.**
  - *Bridges community*: Radović, Sazdanović, Przytycki, Chavey — the people who would understand the jacket instantly; reachable, named in the knowledge base.
  - *Craft & design press* (Colossal, It's Nice That): lead with photography + the UNESCO-listed lineage.
  - *Hacker News / dev world*: the toolmaker's arc — "I built a single-file offline web app for an elderly weaver and fell into knot theory."
  - *Portuguese media*: the Lusophone arc, Angola ↔ Portugal, UNESCO 2023.
  - *Tastemakers*: Wilmon knows **Pippa Small** (ethical jewellery; artisan collaborations; might showcase pieces in elevated materials) — the first personal send. The site must work as a pitch deck in one link.
- **The campaign frame (Wilmon, 2026-06-11) — honest and viral-native:** *"My friend invented a craft mathematics can't explain. I want a jacket. He wants a workshop."* The site's own story includes the toolmaker's motive: a friend who wants a jacket made this in his spare time to get João the attention he deserves — **the goal is to fund João's workshop** (he currently works in a caravan). Self-aware, true, and exactly the framing Twitter/X rewards. The daily game (§5f) is the engine; every share carries the link.
- **Outreach machinery**: the `/outreach-research` command (`.claude/commands/outreach-research.md`) deep-researches contactable leads — mirror-curve/knot researchers, math departments with art/outreach programmes, fibre-art galleries — into `docs/outreach/contacts.csv`. João's own pitch to math departments, in his logic: **commissions at reduced prices, because maths was his worst subject at school and now he realises he is contributing to the field.** (That sentence goes in the outreach emails verbatim — it's irresistible.)
- **AI-staged mood boards (idea, 2026-06-11)**: take the real piece photos and AI-stage them — on models, gallery walls, mansion interiors, feet — as internal mood boards and pitch material for curators ("this is how it could hang"). Rules: built FROM his actual photographed pieces (not invented work), always labelled as visualisations, never presented as real product/installation shots, never on the shop pages. A separate folder: `media/mockups/`.

## 2. Architecture — collection-led with a cinematic threshold

Three content pillars, one arc: **História**, **Matemática**, **A Ferramenta** (the tool and the collaboration: together we built an instrument that lets him find patterns no human has ever seen). The arc in one line — put it somewhere prominent: **knot theory, made into art, made into clothing.**

Five structural models were weighed (each is how a different kind of expert would naturally build this):

| Model | Home leads with | Serves best | Failure mode |
|---|---|---|---|
| **Story-led scroll** | cinematic biography, cycle count rising 1→15 | press, first-time public | linear: buyers and professors wade through biography; finished the day it ships — doesn't grow as João weaves. Great *page*, weak *home* |
| **Collection-led** | a living grid of pieces, each a permalink | buyers, Instagram, return visits | without framing, reads as a craft shop |
| **Museum / exhibition** | curated "rooms" + wall text | prestige, press | static; nobody returns to a museum site |
| **Research corpus** | a numbered specimen registry — data on an open problem | mathematicians | cold lead for everyone else |
| **Tool-led** | a playable board, story around interaction | developers, curious | interaction before context; photography demoted; Toy is phase 2 |

**The deciding insight: the atomic unit of this site is the SPECIMEN PAGE** — one physical piece, fully told. Every audience wants the *same page* and reads different lines of it:

- full-bleed photography *(buyer)* · live trace of the true pattern *(everyone)* · mono provenance block — design code, loop count, *first traced* / *first woven* dates, metres per colour *(mathematician: a data point; buyer: a certificate)* · a ~100-word story fragment *(public)* · **a timelapse of the making, where one exists** (Wilmon has timelapse videos — §7) · **open this pattern in the Toy** *(developer)* · price + status + **buy / enquire** (§5e) + link to its Instagram post.

Specimen pages make the site Instagram-native (every post deep-links to one), shop-native (each is a product page), math-native (each is a datum in the corpus), and infinitely extensible — João keeps weaving, the site keeps growing, no redesign ever needed.

**The recommended structure:**

- **Home (`/`)** = a **threshold** of at most 3 screens — the hero cord laid live, title on close, then one line each for beats 2–4 of the message hierarchy — which dissolves into **the collection**: a Pinterest-density grid of specimens, photographs interleaved with a few *live trace* tiles so it self-evidently isn't a normal shop.
- **`/obra/<slug>`** = the specimen template above; the core build artifact of the whole site.
- **`/como`** ("How it's made") = **the process page, arguably the site's most important** (copy + media script in `docs/the-process.md`). Nine physical steps from a shape in his head to finished cloth, each with real photo/clip/quote evidence; the "holy shit, look at the labour" page. The tool appears in exactly ONE of the nine steps; the rest is pure hand-work. This page, not the tool page, carries the craft, and is a strong candidate for primary nav. Keeps the site about João, not the app.
- **`/historia`** = the scroll story (below) — the best telling of the biography, executed once, as a page among equals rather than the spine of the site.
- **`/matematica`** = the essay + researcher contact, ending with the full reference apparatus: papers, books and licensed historical imagery of the sona/kolam/Celtic lineage (`docs/references.md`).
- **`/ferramenta`** = the tool's story as an **interactive walkthrough** (spec below; copy in `docs/the-tool.md`). Deliberately separate from `/como` so the site is not an ode to the tool; `/como` links here once and moves on.
- **`/experimenta`** = the Toy. Instagram and contact woven through (§5b/5c).
- Short links `/t/<T1-code>` open any design code in the player — patterns without physical pieces are shareable too.

### The História page — the scroll story

**A scroll story where the cycle count rises as you descend, and the escalation IS João's biography.**

A sticky counter (big numeral, JetBrains Mono) ticks up as you scroll: **1 → 2 → 4 → 8 → 12 → 15 → ?** — the final station is the jacket, and the counter ends on a question mark, because even its maker cannot count it. Each number is a station; each station pairs a **live in-page animation of that exact pattern being laid** (real engine, real bounces — never video) with a **photograph of the physical piece** João made of that very pattern. Digital twin ↔ cotton twin.

**Stations are galleries** (Wilmon, 2026-06-10, after seeing about.html live — the live-player format is validated, keep it): under each numeral, show *every* specimen in the manifest with that loop count — the 2 station carries all the two-cycle pieces, and so on. The história page thus doubles as the collection grouped by loop count, and it grows as João weaves; the featured twin pair leads, the rest tile beneath it.

| # | Station | Story beat | Animation | Photo needed |
|---|---|---|---|---|
| — | **Hero** | "One cord, bouncing." Full-bleed player laying a single cord; title overlays when it closes | 17×10 (gcd 1), `autoplay:'visible'` | none (the animation is the hero) |
| 1 | **The purist** | For years a piece only *counted* if one cord did the whole board. He re-derived, alone, the thousand-year-old Chokwe ideal of monolinearity. Also the **hardest** craft: one pass drags the whole cord's length through every crossing | 17×10 single cord, slow, single colour | a 1-cycle piece |
| 2 | **The accident** | A board came out wrong — two loops. Instead of a failure he saw a pattern. He loved it | 18×10, two colours | the/a 2-cycle piece |
| 4 | **Loops are colours** | Second accident, four loops — and the realization that changed everything: **every loop can carry its own colour**. The flaw became the medium | a 4-cycle board, 4 yarn colours | spools photo (have it) + a 4-cycle piece |
| ∮ | **Interlude: the mathematics** | Sand of Angola → Gerdes → gcd(m,n) → the open problem. Short on the scroll; "read the full essay" → essay page behind a photo of the jacket | the gcd trio (18×10 / 14×12 / 8×6 — same 2-cord cloth at three sizes, already proven in about.html) | sona drawing (sourced/licensed) optional |
| 8 | **Factors of four** | his 8-colour pieces and the 8-circuit shoe panels — "it has to be factors of four: four, eight, or twelve" (his empirical rule, on tape) | an 8-circuit board traced live | an 8-colour piece (several on film) |
| 12 | **The shoes** | A thing you can walk in, made of nothing but circles | the shoes' pattern | shoes |
| 15 | **The open country** | Patterns that exist only by computation, in a shape-space so large most of his multi-cycle pieces are plausibly **first sightings by any human**. His next: 45×60, five colours × three circuits | a real 15-cycle design of his, full palette | a 15-cycle piece |
| ? | **The jacket** | 100+ hours, uncounted. Eight woven rectangles, unified: the colour pass crosses the joins and they disappear. Probably four loops — **"I cannot tell."** No thread in it has an end. The counter that rose all page long ends at a question mark | **the jacket's design**, traced live (panels) | jacket: worn (have), flat, and **macro of a join** |
| ✚ | **Two crafts** | The collaboration: a weaver who could only see four loops ahead, and a friend who built him an instrument — a small handmade program with one user. Toolmaker and weaver, mirrored. (**Never** the phrase "vibe coding"; tell it as friendship + tools) | the Oficina itself, briefly (screenshot or short capture) | João at the board / board mid-weave |
| ▶ | **Try it** | Hand the reader the rule: the Play tab (§5) | — | — |

Footer: provenance line, contact / bespoke teaser ("each pattern has a *first traced* and *first woven* date — provenance no other craftsman can print"), link to A Oficina.

### The Ferramenta page — an interactive walkthrough (Wilmon, 2026-06-10)

Not a static essay: the tool's story as a stepped, **playable** sequence — the reader meets the problem, the old solution, and the instrument, in that order. Narration = `docs/the-tool.md`; each beat pairs a real artifact with a live element:

1. **The problem** — "how many cords will this shape need?" A live mini-board: toggle cells, watch the count jump unpredictably. The reader *feels* the problem inside ten seconds.
2. **The old way** — photos of the pencil board and the working booklet; a player traces ONE path slowly, bounce by bounce, to convey the labour (hours per guess, one slip ruins the trace).
3. **The first pattern** — the 2-cycle piece: live trace + photo of the physical piece.
4. **The accident** — the 4-cycle he made by mistake and loved: live + photo.
5. **The shoes** — the L-shaped 8-cycle flat panel he *designed* (the wish come true): live trace + photo of the finished pair (the pair Wilmon bought). Then **the 3D twist**: two 8-cycle panels tied together along every side but the foot opening become a **12-loop object** — the seam removes the wall, the shoe is one billiard folded through space, and the flat tool can't see it. Cliffhanger: the bench still knows things the screen doesn't. (Possible sequel beat: the seam simulation — KB "shoe seam is computable in principle" — if the engine's pillowcase extension predicts 12, the tool catches up to the bench *on the page*.)
6. **The instrument** — the app appears, with the weekend story; CTA → `/experimenta` ("now you try").

Tech: TearPlayer embeds + a minimal cell-toggle editor (subset of the Toy's drawing surface — step 1 and step 6 share it). All photo/booklet slots named per the §7 design-pass instruction. This page doubles as the developer door (§1b).

## 3. What we can do live (the unfair advantage)

Every animation on the site is the **real engine**, not video. Already built and shared:

- **`src/engine.js`** (`TearEngine`) — pure billiard/weave engine, zero deps.
- **`src/player.js`** (`TearPlayer`) — embeddable trace-player. Options: `cells` (arbitrary shapes — L-shapes, holes), `gw/gh`, `colors`, `autoplay:'visible'` (IntersectionObserver — plays when scrolled into view; this is the scroll-story mechanism, already working), `speedFactor`, `loop`, `strand` thickness, `nails`, `bg`, `onDone`/`onTick` callbacks (→ drive the sticky counter, trigger text reveals when a cord closes).
- **`src/code.js`** (`TearCode`) — T1 design codes: every pattern on the site is a ~40-char URL-safe string. Patterns are **shareable as URLs** (`#T1-…`) — which also lets a bespoke enquiry show exactly what it means (§5e).
- **`about.html`** — the prototype of all this; the site supersedes it. Its copy is good seed copy.

Laying rule (owner's hard rule, already enforced by the player): a string being laid is **CONTINUOUS** — gaps only where it dives under cord already on the board.

## 4. Visual language — the site is NOT the app (updated per Wilmon, 2026-06-10)

The app's cool-slate / JetBrains-Mono system belongs to the app (and stays inside every embedded player canvas) — but the site around it gets its own design. Direction in Wilmon's words: **"etsy meets something better than etsy meets insta meets pinterest meets information."** Not folksy. Not 2000s-WordPress. Not the app's futurism either.

- **Photography- and pattern-first.** The unit of the site is the image — a woven object or a live pattern. Layouts are confident image grids and full-bleeds (Pinterest density, Instagram confidence), not text columns with pictures attached. Text supports images everywhere except the essay page, where it flips.
- **Gallery-grade, commerce-clean.** Benchmark against the best contemporary maker-commerce and design-portfolio sites: large type, generous white space, flawless image treatment, thin sticky nav. Explicitly rejected: theme-shop templates and sliders; folksy "artisan" styling (kraft paper, handwriting fonts, burlap, rope texture).
- **Light by default.** The site reads as a well-lit gallery — paper-white / very light neutral surfaces — so the cotton photography and yarn colours carry all the colour. The embedded players keep their dark canvas and read as framed live objects; the contrast is a feature: a computed thing hanging in a paper world. That duality (cotton ↔ computation) IS the visual concept — every station already pairs them; the design should express the pairing, not blend it.
- **Typography:** a contemporary editorial pairing — a strong modern grotesque for UI and headings, a genuinely readable text face for the essay (serif is allowed *on the site*; taste-check with Wilmon). JetBrains Mono survives only as the **machine voice**: design codes, cycle counts, dates, provenance lines — like the catalogue number on a museum label.
- **All saturated colour still comes from the yarn** (JOAO palette / Barbante Beatriz swatches), inside patterns and photographs only.
- Still true from the app's hard rules: rendered strands stay flat and clean (no rope shading, no decorative gradients); animations are always the real engine; a string being laid is continuous.
- Motion: the cord animations carry the wow. No parallax gimmicks, no scroll-jacking — plain scroll, `autoplay:'visible'`, counter ticks.
- **Quality bar:** a knot theorist, a developer and a buyer should have the same first reaction — *this is fucking awesome* — before reading a word. If the hero doesn't stop the scroll, redo the hero.

## 5. The Play tab ("the Toy") — phase 2, design for it now

A separate playful app (NOT the Oficina — João's muscle memory is sacred; the Toy can diverge freely):

- v1 scope: draw a shape on a grid → cords trace live → count + colours appear → **Share** button copies a `#T1-…` URL that reproduces the design. Mobile-first, zero chrome, instant.
- It reuses `engine.js` + `player.js` + `code.js` verbatim. The drawing surface is new code.
- A bespoke enquiry can attach its share URL ("send this to João") — bake design-code URLs in from day one. Enquiry only; never a checkout (§5e).
- On the site it's a tab/route ("Experimenta / Play"), not a section of the scroll.

## 5f. The Daily Game — "a Wordle in loops" (Wilmon, 2026-06-11; mechanics TBD)

**Concept:** every day, one target pattern (a real design from João's corpus or a seeded generation). Players recreate it with limited information/attempts and share their result on X/Twitter — the viral engine that carries the campaign frame (§1c). Distinct from the Toy sandbox (`/experimenta` stays "the game is creating, not guessing" — the daily game is the *competitive sibling*, its own route, e.g. `/diario`).

**Mechanics options (to be playtested, not decided):**
1. **Inverse problem (recommended starting point):** the finished weave is shown; players must find the BOARD that produces it by toggling cells. Each "pull" traces their board live and scores it against the target (matching cells light up Wordle-style). 5 pulls max; score = pulls used. The kicker: *guessing the board from the cloth is literally the open problem* — every player is doing frontier mathematics and the share card can say so.
2. **Wilmon's variant:** fixed attempts, only ONE variable changeable per go (e.g. colour order) — least goes wins.
3. **Speedrun:** exact recreation against the clock; post times. (Weakest for shareability — times don't make good emoji grids.)

**Share format (the whole point):** a compact emoji/colour grid of the final attempt + "🧶 3/5" + one line — *"Today's board is a real piece by João, a 75-year-old who invented this craft. He's saving for a workshop."* + link. The Wordle lesson: the share IS the ad, and it must be legible in a feed without clicking.

**"Helping João" must be real, not vibes:** a daily counter ("2,481 people wove João's pattern today"), streaks unlocking real behind-the-scenes clips (we have them — `media/clips/`), and a visible workshop-fund link/progress. Honesty rule: if there's a fund, say where money goes.

**Tech:** trivially cheap — daily seed = a T1 design code derived from the date; the engine scores matches client-side; share cards pre-rendered per day. No backend needed except (later) the counter.

## 5b. Instagram — first-class channel, not an embed afterthought

- The account is the living proof that the work is real and current; on the site it powers `/obra` (the gallery) and gets a prominent follow link everywhere photography appears.
- **Content ritual (proposal):** every post = the physical piece (+ optionally a short clip of its pattern being laid in the player) with a caption carrying the provenance line in mono: design code `T1-…`, cycle count, *first traced* / *first woven* dates. The design code in every caption becomes his signature — Instagram itself carries provenance, and anyone can paste a code into `/experimenta` and watch the piece's pattern trace.
- **Tech (important):** do **not** build on live Instagram embeds — the Basic Display API was shut down (Dec 2024), the Graph API needs a professional account + tokens + a backend, and the official embed script is heavy and janky. Instead `/obra` is a curated gallery driven by the piece manifest (§6), each card deep-linking to its IG post, plus a follow button. New posts = one manifest entry (2-minute manual step; tiny sync script later if it hurts).
- Open: handle (e.g. `@joaodascordas`), who runs it, PT/EN caption policy.

## 5c. Contact — "write to João"

International maths conferences are already trying to reach him. Make it trivially easy, and triage by intent:

- **One address** (e.g. `ola@joaodascordas.pt` or an alias), read with João by Wilmon — and say so honestly on the page: "João works in cotton, not email; messages are read with him. PT or EN welcome."
- **Four labelled intents, same inbox**, each living where its audience already is: *Research / conferences / talks* (block on `/matematica`, speaking that audience's language: his corpus is data on an open problem; talks, visits and collaborations welcome) · *Buying & bespoke enquiries* (on specimen pages and the collection — bespoke is always this, never a checkout, §5e) · *Learning the craft* (§5d) · *Press & everything else* (footer).
- Static site → `mailto:` links with prefilled subjects to start; switch to a form service (Formspree/Basin) only if spam forces it. No backend.
- Open: the actual address; whether researcher studio visits are offered.

## 5d. Aprender — he wants to teach

João wants to pass the craft on. Treat this as a **headline fact**: the craft has, as far as we can discover, exactly one practitioner — teaching is how it gets a second. "Learn to do what he does" is also the strongest call-to-action on the site for the audience money can't define.

- v1 is a **standing invitation block**, not a page: placed (a) on home directly after the collection, (b) at the end of `/historia`, (c) on `/experimenta` — the Toy is the natural on-ramp: *you've played with the rule; the cloth is learnable too. Write to João.*
- Copy direction: plain and personal — "João teaches. If you want to learn to make this, get in touch." Add honest logistics once decided.
- Feeds contact intent #3 (§5c). Open with João: format (studio visits, workshops, remote?), language (PT only? gestures + boards travel well), who can come.
- If teaching takes off, it graduates to `/aprender` with its own photography (hands, boards, nails).

## 5e. Selling — prices on finished pieces only; bespoke is a conversation

**Decided (Wilmon, 2026-06-10): the site sells only what João has already made** — pieces that exist, photographed, priced. **Bespoke/commissions are never transacted on the site**: no configurator, no deposits, no checkout for unmade work. The specimen page carries a single quiet line for it: *"Get in touch to discuss bespoke options."* That's the whole commission funnel — an email conversation (a buyer *may* attach a `T1-…` code from the Toy to show what they mean, but it's still just a conversation).

For the finished pieces, phased so money never blocks launch:

- **Phase 1 (launch): prices, no checkout.** Each specimen shows its price and a status badge: *available / sold / not for sale*. **Sold pieces stay on the site forever** — they are the provenance archive; a gallery's red dot, not an empty shelf. Sold work sells future work. Buying = the enquiry mailto.
- **Price ladder (working guidance, 2026-06-10):** entry tier — simple mats/bands — **€90–180, nothing under €90** (the gallery framing and printed provenance are what escape the €40–80 Etsy anchor); runners/bags €250–600; cushions €300–500; fine-wool garments €10k+ (above). Final numbers from João's hours per piece (on the verify list) at a fair hourly rate; raise with demonstrated demand.
- **Phase 2: direct sales via Stripe Payment Links.** Zero backend — ideal for one-of-one objects: one Stripe Product per available piece, quantity 1, the specimen's Buy button links straight to Stripe Checkout (cards/Apple Pay; shipping address collection built in). After a sale: deactivate the link, flip the manifest status to *sold* — one manual step, same rhythm as the Instagram ritual.
- **Pricing model (hard-won, §craft facts):** difficulty scales with **length-per-loop and crossings, NOT loop count** — a 1-loop piece is the *hardest*. Price on metres and hours; never advertise "per loop" pricing.
- **The garment tier (decided, Wilmon 2026-06-10):** fine-wool garment-grade pieces — the jacket class — command **€10k+, possibly more**. The jacket is ~€60 of wool and ~200 hours of labour including chasing every loop three times through the finished 3D garment; the price is the hours and the singularity, never the materials. These are the pieces for the curator/tastemaker audience (§1b).
- Open/legal (decide before Phase 2): João's seller status in Portugal (artesão / recibos verdes), EU VAT on goods, who packs & ships.

## 6. Tech recommendation

- **Stack:** React is fine for the site shell (routing, i18n, scroll orchestration) — but the engine/player/code modules stay **vanilla JS, shared verbatim** with the Oficina; mount players in refs. Vite + static export. No backend.
- **Hosting:** GitHub Pages (already serving `gh-pages-mobile`); site can live at the repo root path or its own repo/domain. Domain candidate: *joaodascordas.pt* (open question).
- The site does **not** need the Oficina's offline/self-contained constraint — normal bundling, lazy-loaded photos.
- **Bilingual PT/EN** from day one (PT is João's and the craft's language; EN is the math/Bridges audience). Same toggle pattern as the app.
- Pattern provenance: a small JSON manifest per piece — design code, title, first-traced date, first-woven date, photo refs, IG post URL, status (*available / sold / not for sale*), price, Stripe payment-link URL (phase 2+). The manifest is the site's single source of truth: gallery, specimen pages, sold states and IG links all render from it.

## 7. Assets — have / need

**Have:** **~119 catalogued photos in `docs/photos/`** (4 drops) — see `docs/photos/catalog.md`, ~34 hero-grade. Highlights: **the working booklet** (incl. the hand-drawn basket-weave sheet), **the basket-weave paper on a nail board**, a **complete 10-shot process sequence** (paper → cords → density → off nails → tightened → finished mat → folded into a slipper), the **digital-vs-physical match shot** (app render beside the real board — the site's thesis in one image), a warm outdoor João portrait, and **TWO styled shoots**: golden-hour outdoor (placemats on terracotta, set dinner table, vest + bands on a weathered door, rainbow boots against a carved door, slippers worn) AND a **gallery-style interior editorial set** (mats on a black table under a framed print with a red cabinet — magazine-grade) plus a B/W weave macro and a swatch triptych. **`/obra`, the threshold, and the collection grid can all be built from existing imagery now** — the photo gap is effectively closed except for the specific shots below. Plus the spools photo (`docs/joao-woven-cushion.jpeg` — note: shows the **yarn spools**, not a cushion) and **Wilmon's timelapse videos** (not yet delivered — first-class assets: specimen pages, IG clips, the história stations). The catalog also lists discoveries (jute open-mesh register; a net with a deliberate circular hole — the open problem made physical; scarves/mittens/toggle bands; the caravan workshop) and the remaining shoot list (front jacket, flat jacket, **join macro**, 15-cycle piece, cushion).

**Design-pass instruction:** the design must create **named slots for assets that exist but aren't delivered yet** — per-specimen photo galleries, a timelapse video player per specimen, the join macro, João-at-the-board. Design with real *proportions* (placeholder boxes labelled with what goes there), so assets drop in without layout rework.

**Need (the photo shoot list, one session at João's):**
1. Jacket — flat, worn, and **macro of an invisible join** (the single most persuasive image possible). *First worn photo exists (shared in chat 2026-06-10 — side view, collar and cuffs visible, 45° weave clearly legible; original file still needs to land in the repo/asset folder).* Still wanted: front worn, flat, collar detail, cuff detail, the join macro.
2. Shoes. 3. A 1-cycle piece, a 2-cycle piece, a 4-cycle piece, a 15-cycle piece. 4. João at the board; a board mid-weave with nails visible. 5. The cushion (red/turquoise/cream). 6. **Everything else he still has, whatever the loop count** — stations are galleries (§2), so every photographed piece gets a home under its numeral.

**Need (data):** recreate each photographed piece in the app and save its design code, so every station's animation traces **the true pattern of the physical object**. Verify with João: nail spacings, board sizes, colour-assignment habits, whether he names pieces.

**Open decisions (Wilmon):** Instagram handle + who runs it · contact address + who triages · per-piece prices (decided: prices shown — §5e Phase 1) · commerce legal before checkout: seller/tax status, VAT, shipping (§5e) · teaching logistics (format, language, who can come — §5d) · typography pairing taste-check (grotesque + text face) · domain (joaodascordas.pt?). (Fine-wool feasibility: ANSWERED — the jacket is fine wool; garment tier €10k+ decided, §5e.)

## 8. Things the site must NOT say (corrections log — we got these wrong once)

- ✗ "One-string shapes are rare." Wrong — gcd=1 is the *common* rectangle case (~61%). One-string is special for craft difficulty and his purist history, not rarity.
- ✗ "More loops = harder." Inverted — fewer loops is harder handwork.
- ✗ Overclaiming precedent. Exact wording: "as far as we have been able to discover, no documented precedent."
- ✗ "Vibe coding" or any framing of the tool as AI novelty. Friendship + instrument-making.

## 9. Wireframes

**Home + specimen (the core of the site):**

```
HOME ( / )                                SPECIMEN ( /obra/<slug> )
┌──────────────────────────┐              ┌──────────────────────────┐
│ THRESHOLD (≤3 screens)   │              │ photograph, full-bleed   │
│  hero: cord laid live;   │              ├────────────┬─────────────┤
│  title fades in on close │              │ live trace │ provenance  │
│  → 3 one-liners (beats   │              │ (player,   │ (mono):     │
│    2–4) while scrolling  │              │  the true  │ T1-… · 8    │
├──────────────────────────┤              │  pattern)  │ loops ·     │
│ THE COLLECTION (grid)    │              │            │ traced/woven│
│ ┌────┐ ┌────┐ ┌────┐     │              │            │ · m per cor │
│ │foto│ │play│ │foto│     │              ├────────────┴─────────────┤
│ └────┘ └────┘ └────┘     │              │ ~100-word story fragment │
│ ┌────┐ ┌────┐ ┌────┐     │              │ €— · available           │
│ │play│ │foto│ │foto│     │              │ [buy/enquire] [IG ↗]     │
│ └────┘ └────┘ └────┘     │              │ [▶ open in the Toy]      │
│   … grows forever …      │              │ related specimens        │
│                          │              └──────────────────────────┘
├──────────────────────────┤
│ APRENDER — João teaches. │
│ "write to learn this" CTA│
└──────────────────────────┘
```

**/historia (portrait scroll; landscape = animation left / photo+text right):**

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
│  bespoke · A Oficina        │
└─────────────────────────────┘
Header (thin, light): JOÃO DAS CORDAS · Obra | História | Matemática | Experimenta · PT/EN
Routes: / (threshold + collection) · /obra/<slug> (specimen) · /historia (scroll story) ·
        /matematica (essay + researcher contact) · /ferramenta (interactive walkthrough) ·
        /experimenta (Toy) · /t/<T1-code> (any design code in the player) · → A Oficina (external)
Footer: write to João (mailto) · Instagram ↗ · A Oficina ↗ · provenance note
NOTE §4: site chrome is LIGHT (gallery); only the embedded players are dark.
```

## 10. Build order

0. Create the Instagram account + contact address now — the channels should exist (and start posting) before the site does; the site links out from day one.
1. Photo shoot + design-code recreation of each photographed piece (blocks everything visual).
2. **Specimen template + threshold + collection home** — ship with however many pieces have real photos (a gallery of eight is an opening, not a gap); add specimens forever.
3. /historia scroll story (stations with assets only; placeholder-free).
4. Essay page (content done — typeset it).
5. Toy v1 (draw → trace → share URL) + `/t/<code>` short links.
6. Commerce, phased (§5e): prices + status badges in the manifest → Stripe Payment Links per available (finished) piece. Bespoke stays a get-in-touch conversation — nothing to build.
