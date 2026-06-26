# An Audience of One

*The instrument behind the patterns: who built it, why, and what it changed. Copy + media script for the site's A Ferramenta interactive walkthrough (spec: `website-brief.md` §2). Third-person curator voice — NO first person; the toolmaker is a character, not the narrator. No em-dashes in copy.*

**Staging principle (Wilmon, 2026-06-10): the reader discovers everything in the same order the protagonists did.** Each revelation happens TO the reader, via the media, before the text explains it: João's accident strikes the reader's own board; the pencil's slowness is felt before the tool's speed; the prototype appears bare before the colours arrive. Media blocks below are tagged **[PHOTO]** (exists → `docs/photos/catalog.md` ref) / **[⚠ FIND]** (asset to dig up or shoot) / **[PLAYER]** (TearPlayer embed, options given) / **[INTERACTIVE]** (small bespoke element on the shared engine).

---

## A sentence at a gathering

The tool has an origin story, and it starts with a sentence spoken between friends.

At a gathering, João showed a friend a handful of pieces he was very proud of: two cords, four cords, colours crossing each other in ways he had half-tamed. By then he had made his great discovery, the one the mathematics page describes: that the "failures" with many loops were not failures at all, that every loop could carry its own colour. He had discovered that patterns existed.

> **[PHOTO]** The proud pieces: a 2-cord and a 4-cord piece, shot simply, side by side. ⚠ FIND: ask João *which* pieces he showed at the gathering; if they survive, photograph those exact ones (provenance gold). Stand-ins until then: `pieces/20260218-weave-macro-brown-cream.jpg` (2-colour) + a 4-colour piece from the catalog.

What he could not do was summon them. A pattern only revealed itself after hours of pencil tracing, or after days of weaving. And so he said the sentence that started everything. The next trick, he told his friend, was working out at the start how to make a pattern with the colours he wants.

> **[INTERACTIVE — "the accident", the page's first and most important element]** A board (e.g. 18×10), one colour chip selected, one button: *lay the cord*. The reader watches the cord bounce and close... and a dashed ring pulses on a nail the cord never touched. Button changes to *lay another cord*; the second cord traces in a SECOND colour. Caption: "You expected one cord. The board wanted two. This accident, which just happened to you, happened to João years ago. He looked at it. He loved it." (TearPlayer: `autoplay:false`, play on tap, `onDone` reveals the untouched-gap marker and the second-cord button; cycle colours pre-assigned.)

> **[PHOTO — EXISTS]** João's pencil method: `booklet/20260221-booklet-traced-path-numbered.jpeg` (hand-traced path, ink edge-numbering) and `booklet/20260222-booklet-handdrawn-basketweave.jpeg` — the basket-weave field **drawn by hand**, the sheet he photocopied before the generator existed.

> **[INTERACTIVE — pencil speed]** One path on a mid-size board, two buttons: *trace at pencil speed* (player at crawling `speedFactor`; caption: "at this speed the full board takes hours; one slip and the trace is worthless") and *trace at the tool's speed* (the same board completes in under a second). Do not explain; let the contrast do it. This plants the eureka the next section names.

The friend happened to be a programmer. He remembers the thought arriving whole: *this must be programmable.* A cord travels at 45 degrees, bounces at the edge, closes where it began. A computer can follow that rule a million times a second. He had no idea he was looking at a mathematics problem with a thousand-year lineage and an unsolved core. He thought he was going to save a friend some pencil work.

## The weekend

He went away and researched everything he could find: the formulas, the theories, whatever existed. And he studied João himself. He recorded how João worked. He photographed the working booklet, page after page of hand-traced paths. Whenever the code disagreed with the cloth, the cloth was right, and he went back to watch again: how a corner turns, how a cord is joined back to its own beginning, what happens at the awkward nails.

> **[PHOTO]** Hands at the board (the cloth being the referee): `process/20260218-hands-needle-interlacing.jpg` (hero), `process/20260218-board-template-first-cords-hands.jpg` (hero). ⚠ FIND: the research-phase recordings/photos of João working, if they survive — a few seconds of original video here would be priceless.

> **[INTERACTIVE — "the paper", a three-beat re-enactment of João's cleverest invention]** Beat 1: the reader lays a cord and must pick *over* or *under* at each crossing by feel — and discovers what the simulation proved: the live sequence is irregular (`U O O U O U U…`), impossible to carry as rhythm; mistakes clash visibly. Beat 2: João's solution slides in under the board — his self-designed **basket-weave paper**, the checkerboard printed as a reference. Now every crossing is one glance: the paper at that spot gives the answer, even at intersections where no cord has arrived yet. Beat 3, the reveal: the code didn't translate the paper into a formula — it INHERITED it: the prototype's second-ever feature was a basket weave laid *under* the digital knot, glanced at for every crossing, exactly like the bench. Caption: "First the code learned to bring a loop home. Second, it put João's paper underneath. The weaver and the machine read the same sheet." **[PHOTO — exists, 2026-06-11 drop]**: the basket-weave paper taped to a nail board, nails through it, hand-lettered edge labels — the analog computer itself.

The build took one weekend of hard work and a long series of failures. The order of victories inside the code repeated the craft itself: the first thing it ever did was bring a loop home to its starting nail. The second was to lay a basket weave underneath the knot, so that every crossing could be answered with a glance downward, exactly the way João answers it on his printed paper. And then the prototype worked. The screen drew a shape, the cords traced themselves, the count appeared. A rule that had only ever been executed by patient hands suddenly executed itself.

> **[⚠ FIND — the fossil record]** Screenshots of the EARLIEST tool versions, phone-sized: no colours, hairline strands, debug numbers, just the maths being wrestled. Wilmon believes he can recover/recreate a really early version. Display as a filmstrip: booklet page → v0 screenshot → today's app. The tool gets its own "first traced" provenance.

> **[ARTIFACT — the paper generator, exists in the codebase]** `archive/niche-tools/weave-pattern.html`: the toolmaker's other gift — a generator that prints João's basket-weave paper at any size, with the shape drawn on. Before it, João drew every sheet by hand and photocopied it. Show: photocopied hand-drawn sheet (⚠ FIND one) → the generator's print → the photo of the paper nailed to a board. Caption: "Three generations of the same sheet: drawn, then printed, then computed. The paper never left; it just got easier to make."

> **[INTERACTIVE — "v0"]** A deliberately bare embed, recreating the first thing the screen ever did: same engine, single hairline colourless strand, no counts, no chrome, one button: *run*. Caption: "The first thing the screen ever did. No colours yet. Colours came later; first it just had to be true." (TearPlayer with `colors` all bone-white, `strand` thin, `nails:false`.)

João, shown the screen, was more elated than the builder was. He could not believe it. His whole working life changed in front of him.

## Scaled to fit one pocket

João only had a phone. So the tool was made to work on a phone: one file, no internet needed, nothing to install, no account, no cloud. It runs today on the tablet in his workshop the same way.

> **[PHOTO]** The workshop reality: `studio/20260602-joao-studio-wide.jpg` (on his phone under the hanging cords — note: he is literally on a phone in this shot) and `studio/20260602-joao-portrait.jpg` (hero, spool shelf overhead).

Its palette was matched to the actual spools on his shelf, colour by colour, so that what he composes on screen is what he can buy and wind.

> **[PHOTO + INTERACTIVE — the palette is real]** The spools photo (`docs/joao-woven-cushion.jpeg`, to be renamed) beside a tappable row of the 15 JOAO palette chips; tapping a chip highlights the matching physical spool in the photo. Small, delightful, proves the screen-to-shelf claim in one gesture.

He draws any shape he can imagine on a grid of squares. The cords trace themselves in milliseconds. The tool counts the loops, colours them, measures how many metres of each colour the board will swallow, and, if he asks, plays the whole thing being laid, bounce by bounce, exactly as it will be laid on the board.

It is not a product. It has, deliberately, an audience of one. There is no login, no update, no one to ask anything of. It is closer to a workbench jig than to an app: a thing shaped around one craftsman's hands. Its builder still calls it the best thing he has ever made, and adds that João now uses it far more proficiently than he does, which is exactly how it should be.

> **[⚠ FIND]** A short clip or photo sequence of João *using* the tool on his tablet, hands and screen together. "Cool to see him use it" should be seeable.

## What it changed

The wish from the gathering is now João's ordinary morning: he decides the colours first, then goes looking for a board that wants them. An eight-loop pattern wearing only two colours. A three-loop piece with one colour repeated. Twelve loops marshalled into repeating bands. Before the tool he could never see past four loops; the pencil rationed his imagination. Now he designs and physically weaves patterns of fifteen.

> **[INTERACTIVE — João's morning]** A multi-loop board with the loops traced and a colour chip row: the reader assigns colours and watches the cloth change instantly. Presets reproduce his actual schemes: *8 loops, 2 colours* · *3 loops, one colour repeated* · *12 loops in repeating bands* (⚠ verify the "3×3×3×3" scheme with João and store each as a T1 design code). This is the gathering wish, fulfilled, in the reader's hands.

> **[PLAYER + PHOTO]** A 15-loop pattern being laid, full palette, beside the photo of a physical 15-cycle piece (⚠ FIND: the piece + its design code recreated in the app).

And every time he draws a new shape, the pattern that appears has, in all likelihood, never been seen by any human being. Not because the tool invents it. It doesn't. The pattern was always there, implied by the boundary, waiting. The colours are designed. The pattern is *discovered*. The tool removed the thousand bounces of pencil work that stood between João and the territory.

## The tool that wandered into mathematics

It was built as a drawing aid for a friend. Only afterwards did its builder learn what the bouncing rule actually is: mirror curves, the geometry of Angolan sand drawings, a corner of knot theory, and at its centre a question nobody has solved.

So one evening the engine was pointed at the question itself. It traced every possible board up to fifteen squares, more than four and a half million shapes, and counted the loops of each one. The data held laws nobody had written down, and a sequence of numbers that the mathematical record had never seen. The full story is on the mathematics page. The short version: an instrument made for one weaver, in one weekend, ended up producing data on an open problem.

> **[PLAYER ×2]** The two extremes from the census, side by side, both already built and coded: the Staircase (`T1-AQUFxxxxgAVtOsA`, loops that never touch, maximum fragmentation, useless as cloth) and the Ring (`T1-AQMF9t4CbQ`, a board with a hole, two cords crossing at 8 of 12 cells, maximum weave). One caption: "The tool found both. João would only ever weave one of them." Charts live on the mathematics page; here only the two objects.

And the bench is still ahead. When João ties two flat panels into a three-dimensional shoe, the loops fuse and recount themselves in ways the flat tool cannot yet see.

> **[PHOTO ×3 + DIAGRAM]** The shoes: `shoes/20260218-slipper-components-red-purple.jpg` (the flat panels with tabs), `shoes/20260218-wool-boot-piece-cream-brown.jpg`, `shoes/20260610-slippers-worn-bw.jpg` (hero, worn). Plus a simple static diagram: two L-panels, splice points marked along the seam, the foot opening left unmarked; caption: "two boards of eight loops; one shoe of twelve; the seam did the arithmetic." ⚠ FIND: the L-panel cells + per-point seam map from Wilmon's own pair (then the seam simulation can run, and this beat gains its sequel: the tool catching up).

Two crafts, mirrored: one shapes cord around nails, the other shaped code around a craftsman's hands. Neither knew the territory they were walking into, and that is the best part of the whole story.

> **[CTA]** "Now you try." → `/experimenta` (the Toy). The reader leaves this page the way João left the gathering: wanting to make one.

---

*Open questions before this ships: which year was the gathering? Does the working booklet survive? Do the research-phase recordings/photos survive? Can an early tool build be recovered or recreated for the v0 screenshots? What exactly is the "12 turned into 3×3×3×3" scheme, in João's words? Which was the first piece João wove from a design made in the tool?*
