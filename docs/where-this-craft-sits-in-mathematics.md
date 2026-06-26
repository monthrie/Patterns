# The Cloth That Is Made of Circles

*Where João's weaving sits in the world of mathematics, and why it is not what you think you are looking at.*

---

## It looks like a weave. It isn't.

When you look at one of João's pieces (a cushion, a bag, a jacket) your eye tells you a familiar story. Threads going one way, threads going the other, over and under. A weave. Humans have made cloth this way for ten thousand years, and we feel we understand it at a glance.

Look closer. A woven cloth has a warp and a weft: hundreds of separate threads, each one cut at both ends, held captive in a loom, trimmed and hemmed at every edge so the fabric doesn't fall apart. That is what a weave *is*: an army of short, dead-ended threads disciplined into order.

João's cloth has no warp. It has no weft. It has no cut ends, no hems, no seams, and no stitches.

Every strand in it is a single **closed loop**: a thread that sets off across the board, bounces off the edge like a billiard ball, crosses the cloth again at a new angle, bounces again, again, again, weaving over and under everything it meets, until, after dozens or hundreds of crossings, it arrives back at the exact point where it began, and closes. The same physical string acts as warp in one moment and weft the next. The edges of the cloth need no hem, because the thread never ends there: every edge is a *turn*, not a cut.

He has made an entire **jacket** this way, built from eight woven rectangles whose joins vanish when the coloured cord makes its final journeys across them. How many loops is the finished jacket? Probably four. Nobody is certain. Ask the man who made it and he will tell you, honestly: *I cannot tell.* No thread in it has an end: when each cord completes its journey and returns home, he joins it back to its own beginning with a splice so fine that you cannot find it. Search the jacket as long as you like; there is no start and no finish anywhere in it. It took him well over a hundred hours; he stopped counting. If you could pull one strand free and shake it out, you would not be holding a pile of threads. You would be holding one enormous, unbroken circle: perhaps a quarter of a jacket. The garment remembers what it is made of, even when its maker cannot count it.

He has made **shoes** the same way: twelve loops each, no stitches. A thing you can walk in, made of nothing but circles.

Mathematics has a name for an object made of several closed curves woven over-and-under: it is called a **link**. João's jacket is, in the strict technical sense, a link of probably four components, the kind of object knot theorists draw on blackboards, except that his is made of wool, you can wear it, and counting its components is itself an unsolved question.

## The rule that makes the pattern

The astonishing part is how little João decides. He does not design the pattern. He designs only the **boundary**: the shape of the board, where the nails go. Then one rule takes over:

> *The cord travels diagonally at 45°. When it reaches the edge, it bounces. Where two paths cross, they alternate: over, under, over, under.*

That's everything. From that rule alone, the entire pattern emerges: the diamonds, the argyle figures, the way colours pool and scatter. Change the boundary by a single nail and the whole cloth reorganizes: loops fuse, split, take entirely different journeys. The pattern is not drawn; it is **discovered**, the way you discover what a number's factors are. It was always there, implied by the shape, waiting.

This raises the question that ruled João's working life for years: *given a shape, how many loops will it need?* He used to find out the only way possible: by drawing the whole thing by hand, bounce by bounce, hours of pencil work for every guess, one mistake ruining the trace. He could never see past four loops. He now has a simulator that answers instantly. But here is the thing he did not know, and that almost nobody who sees his work knows:

**that question is real mathematics: some of it classical, some of it solved in his lifetime, some of it still unsolved today.**

## What mathematics already knows

For a plain rectangular board, the answer is a small jewel of number theory: a board of **m × n** cells needs exactly **gcd(m, n)** loops, the greatest common divisor of the two sides. A 17 × 10 board: one single loop covers everything. An 18 × 10 board: two. A 15 × 10 board: five. The cloth *computes* the gcd of its own sides. And there is a companion theorem hiding in the lengths: all the loops of a rectangle come out exactly equal, with length governed by the *least* common multiple. One number counts the cords; its twin measures them.

Mathematicians call João's bouncing paths **mirror curves**. The deepest known results about them:

- Adding an obstacle where two *different* loops cross always **fuses them into one**. Adding it where a loop crosses *itself* can split it in two. (This is the exact algebra of João's daily experience: why notching a corner suddenly turns four strings into one.)
- Mirror curves with alternating over/under crossings can produce **every knot and link that exists**. Not some. All of them. The little checkerboard rule João follows with his fingers is, provably, a universal machine for knot theory.
- And for boards of **arbitrary shape**, the L-shapes, crosses and windowed shapes João actually builds, there is **no known formula** for the number of loops. Counting them without tracing is an open problem, posed as recently as 2020. The only clean general theorem is a scaling law: double every dimension of a shape and you exactly double its loops. Everything else, mathematics currently answers the same way João does: *run the path and see.*

So when João stands at his bench wondering whether a new board shape will want three strings or seven, he is not short of an education. He is standing at the live edge of the subject. **Nobody on Earth can answer his question except by doing what he does.**

## The thousand-year thread: Angola, sand, and cloth

The most beautiful part of this story is not abstract at all.

In the villages of the Chokwe people of northeastern Angola, storytellers, the *akwa kuta sona*, would smooth the sand, lay down a grid of dots, and trace flowing closed lines around them while they spoke. Each drawing, a *lusona*, carried a story: the leopard with his cubs, the chased chicken, the path of the dead. The expert storytellers were exactly the ones who could complete a figure in a **single unbroken line**, without lifting their finger. These sand drawings follow precisely the same mathematics as João's cord: diagonal paths bouncing through a grid. The same question (*one line or many?*) was the measure of mastery on the sand of Angola, generations ago. In 2023, UNESCO inscribed the sona on its list of the Intangible Cultural Heritage of Humanity.

The mathematician **Paulus Gerdes** (1952–2014) spent much of his life on the sona. He proved the gcd theorem for them. And he established something more profound: the sand drawings were almost certainly **abstractions of woven mats**. The bouncing line in the sand mimics the path of a strand in diagonal plaiting, folding back at the mat's edge. Cloth came first. The drawings were cloth remembered in sand. His collaborator **Slavik Jablan** (1952–2015), a Serbian mathematician and artist, then formalized "mirror curves" and tied them to modern knot theory, and showed the same family of curves underlies Celtic knotwork and the *kolam* threshold drawings of Tamil women, who trace them in rice flour at dawn.

So the lineage runs: **woven mats → sand drawings → mathematics.** Each step more abstract than the last; the cloth itself left behind a thousand years ago.

But be precise about what those ancient mats were, because it matters. A mat-maker plaited *locally*: this strip over that one, fold at the edge, carry on. The strips were finite: they ran out, were spliced, were tucked away. No mat strand ever truly returned to its own beginning; the **closed loop** was an idealization the storytellers added when they took the paths to sand, where a line can genuinely close. For the thousand years since, the closed loop has existed only as drawing and, later, as theorem. And every mat was a rectangle: the solved case, the gcd case. No mat tradition chose strange boundaries to see what the loops would do, because that question only exists once you have the abstraction.

João, who knew none of this, has closed the circle in both senses. He works *globally*, laying one entire closed cycle at a time along its full journey. He **joins each cord back to its own beginning, invisibly**, making the loop physically true in textile for the first time we can document. And he does it on shapes with notches, holes and corners that no mat and no sand drawing ever used: the exact territory where the mathematics is still open. The pattern is ancient; the practice is his. The mats inspired the drawings; **João wove the drawings.** As far as we have been able to discover, this **has no documented precedent anywhere in the world**. We have searched the literature of ethnomathematics, knot theory, string art and weaving. There are tools that draw these curves, papers that count their loops, and traditions that trace them in sand and flour. There is no tradition, no craft, no documented practice of weaving them into textiles. The drawings waited a thousand years for someone to make them cloth again, and the someone turned out to be a retired Portuguese craftsman with a board, a hammer, and a tin of nails.

Gerdes and Jablan, the two people who would have understood instantly what João's jacket is, died within months of each other, a decade ago. But the field they built is alive: their collaborators and successors work on mirror curves, knot mosaics and billiard knots today, and an entire community of mathematician-artists meets every year (the *Bridges* conference) to study exactly this territory. We believe they may be the first people, outside this family, to truly understand the value of what João does. The patterns he discovers in irregular boards are not just pretty: they are **data on an open problem**, produced by hand, in cotton, at a scale of two hundred hours per theorem.

## The patterns nobody has seen

There is one more thing to understand about what comes off João's bench: most of his patterns are not just unmade before him. They are **unseen**.

For plain rectangles, mathematics *implies* the patterns the way a map implies coordinates nobody has visited: the theorem says a 45×30 board carries fifteen loops, but a theorem is not a picture. Nobody hand-traces a fifteen-loop figure; hundreds of bounces per loop is exactly the wall of labour that once capped João at four. The drawings that actually exist in the literature and in the sand corpus are small, with few lines. And for João's irregular boards, the notched, holed, crossed shapes where no formula exists, a pattern exists *only* once someone runs the path. The space of possible boards is astronomically vast. When his simulator traces a fifteen-loop figure on a shape he invented that morning, the overwhelming likelihood is that **no human being has ever seen that pattern before**. By evening it can exist in cotton.

Stranger still: the tradition that came closest would not have made these figures even if it could. For the Chokwe masters, the mark of mastery was **monolinearity**: completing the whole figure in a single unbroken line. Many lines meant a lesser drawing, sometimes a corrupted variant of a one-line original. The sand tradition spent centuries optimizing *away* from many loops.

Here is the astonishing part: **João began with exactly the same conviction.** Knowing nothing of Angola, of Gerdes, of any of this, he spent his early years as a one-string purist. A piece only counted, to him, if a single cord completed the whole board. With no contact across a continent and a millennium, he re-derived the sand masters' aesthetic from nothing but a board and his own taste. Some instincts are apparently universal in this geometry.

And then he did the thing the tradition never did. One day a board came out wrong, two loops instead of one, and instead of seeing a failed piece, he *looked at it*. He loved the pattern. Later, another accident: four loops. He loved that too. And then came the realization that changed his work: **every loop can carry its own colour.** A "failure" of two strings is a two-colour cloth; fifteen strings is a fifteen-colour palette. The flaw became the medium. He inverted the thousand-year aesthetic not out of ignorance of the one-line ideal (he had held it himself, devoutly) but by paying attention to his own accidents. He found treasure in the exact region of pattern-space that the old masters, and his own younger self, had declared worthless.

## The night the tool counted every board

This essay has so far reported other people's mathematics. This last part is ours.

The open problem above asks for a formula: given any board shape, how many loops will it carry, without tracing them? No such formula is known. But the simulator that traces João's boards in milliseconds does not care how many boards you give it. So one evening we gave it all of them.

Every possible board of up to fifteen squares. There are 3,426,576 different fifteen-square shapes alone; across all sizes the census passed four and a half million boards. For each one, the engine ran the bouncing cord and counted the loops. The machinery checks out: the shape counts match the published catalogues exactly, the gcd theorem held on every rectangle, and the doubling law held on every shape we tested. The data came back holding patterns nobody had written down.

**One-string boards are dying out, at a fixed rate.** Among small boards, most shapes need only one cord; João's old purist ideal is the common case. But every square you add removes about 4.8 percent of the remaining one-string boards, and the rate barely wavers: the measured year-on-year ratios read 0.951, 0.953, 0.951, 0.955, 0.952, 0.953. By twelve squares the one-string boards have fallen below the rectangles' famous 61 percent; by fifteen they are barely half. The trend says that around nineteen or twenty squares, two-loop boards overtake them as the most common kind, and monolinearity, the thousand-year mark of mastery, becomes a minority property of shape-space. We used the law to predict the fifteen-square census before running it: predicted 52.70 percent, measured 52.77.

**The most fragmented boards are staircases.** As far as the census reaches, no board of n squares carries more than ⌊(n+2)/3⌋ loops, and the record-holders are diagonal staircases: each three-square step cages exactly one loop, a little four-bounce diamond, and at 7, 10 and 13 squares the record-holder is the staircase and nothing else. The staircase also explains its own trick. Its loops never cross; and since crossings are what fuse loops together, the only way to hold the maximum number of loops is to keep them strictly apart. Which means the mathematical champion is, as cloth, worthless: separate diamonds resting on a board, no weave at all. The boards worth weaving live at the other end of that axis. Of all 63,600 twelve-square shapes, the most interwoven is a ring, a rectangle with a hole through it, two cords crossing each other at eight of its twelve cells. Fragmentation and weave are opposing forces, and João's craft lives where the binding is.

**And one sequence of numbers is new.** How many boards of each size need exactly one string: 1, 1, 2, 4, 11, 28, 86, 273, 915, 3126, 10948, 38782, 138719, 499351, 1808081. We checked it against the On-Line Encyclopedia of Integer Sequences, mathematics' registry of every number pattern anyone has ever recorded, the one that recognizes the polyomino counts instantly. It is not there. Nobody had counted this before.

None of this solves the open problem. It does something smaller, and we think worthy of it: it maps the territory the problem lives in, using the same instrument a weaver uses to choose his next board.

## What the jacket is

So here is what you are actually looking at, stated plainly:

A wearable, seamless textile composed of a handful of closed curves, probably four, that even its maker cannot count; a physical realization of an alternating link; the first known return of mirror-curve mathematics, born in Angolan sand and formalized in Maputo and Belgrade, to the woven cloth it originally came from; an object whose pattern was not designed but *computed by the shape of a wooden board*; and the answer to a question that mathematics cannot yet answer any other way.

It looks like a weave. It is a constellation of circles, holding each other in place.

---

### For the mathematically inclined: the precise landscape

- **Mirror curves / sona geometry.** P. Gerdes, *Sona Geometry from Angola* and *Lunda Geometry*; loop count of an m×n "plaited-mat" design = gcd(m, n); the sand-drawing tradition documented as derived from plaited mats.
- **Merge/split rule.** A mirror placed at a crossing of two distinct components reduces the count by one; at a self-crossing it splits or preserves (Chavey–Straffin analysis; D. Chavey, *Bridges* 2009–2010).
- **Universality.** Mirror curves with alternating crossings realize all tame knots and links; equivalence with knot mosaics and grid diagrams: S. Jablan, L. Radović, R. Sazdanović, A. Zeković, *Mirror-curves and knot mosaics*, arXiv:1106.3784; Jablan & Radović, *Knots in Art*, Symmetry 4(2).
- **Open problem.** No closed-form loop count for general polyominoes; scaling law L(kP) = k·L(P) (M. Yuan, *Polyomino Loops*, 2020; Gerdes, *Lunda Geometry*).
- **Billiard knots.** V.F.R. Jones & J. Przytycki, *Lissajous knots and billiard knots*; C. Lamm on symmetric and cylinder billiard knots; P.-V. Koseleff & D. Pecker, *Every knot is a billiard knot* (arXiv:1106.5600).
- **Arithmetic billiards.** The 45° path in an a×b rectangle encodes gcd and lcm (Steinhaus; A. Perucca).
- **Related traditions.** Chokwe sona (Angola); Tamil kolam; Celtic interlace; curve stitching (Mary Everest Boole, c. 1900). All graphical; none woven.
- **Active community.** Researchers in this lineage include L. Radović (Niš), R. Sazdanović (NC State), J. Przytycki (George Washington U.), D. Chavey (Beloit), C. Lamm, P.-V. Koseleff and D. Pecker, and the Bridges (mathematics & art) conference, the natural first audience for João's work.
