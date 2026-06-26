# How João Builds: from a flat rectangle to a seamless jacket

The construction logic, from first principles, building up one join at a time. This is the rigorous spine for `/como` (the process page). Grounded in the engine, the interviews, and the established mathematics; uncertain points flagged. No em-dashes.

**The one idea the whole thing rests on:** in João's craft an *edge* is not where the cloth stops. It is where the cord *turns*. And a *seam* is not sewing. A seam is a place where the cord, instead of turning, is allowed to *carry straight on into the next panel*. Everything below is consequences of that single distinction: **bounce, or carry on.**

---

## 0. The atom: one flat rectangle

Take a board the shape of an m by n rectangle of cells. He hammers a nail at every step along the boundary (one per cell edge, about 1.5 cm apart), and lays his basket weave paper underneath so every crossing has its over or under written down in advance.

Then one cord:
1. Tie it to a boundary nail. Pull it across the cells at exactly 45 degrees.
2. When it reaches the boundary it catches the nail there and **turns** (reflects, like a ball off a cushion), setting off at 45 degrees again.
3. At every interior crossing it goes over or under, alternately, reading the paper.
4. It keeps turning at the edges and crossing the middle until it arrives back at the exact nail it started from. That closes one **loop**.
5. He splices the two ends of that loop into each other with a needle and offcuts of the same cord, so finely the join cannot be found. The loop is now a true closed circle.

How many loops does the rectangle need? Exactly **gcd(m, n)**, the greatest common divisor of the sides. This is a theorem (Gerdes; arithmetic billiards). Examples the engine confirms:
- 17 by 10 → gcd 1 → **one** cord covers the whole board and comes home.
- 18 by 10 → gcd 2 → **two** cords.
- 15 by 10 → gcd 5 → **five**.
- a square, n by n → **n** cords (the most fragmented case).

To give the cloth body, each cord is run along its path more than once (three passes in the thick wool). Lift it off the nails and it tightens into finished fabric. No warp, no weft, no hem, because no thread ever ended at an edge. **That flat rectangle is the atom. Everything else is rectangles taught to talk to each other.**

## 1. The fundamental move: replace a bounce with a pass-through

Picture the cord about to hit the right hand edge of the rectangle. Flat, it turns back. But suppose that right edge is going to be *joined* to another edge. Then at that nail the cord does not turn. It is led across the join and **continues straight into the neighbouring cloth** as if the wall were never there.

Two consequences, and they are the whole craft:
- **Geometry:** the cloth is no longer flat. Removing a wall and gluing two edges bends the fabric into the third dimension.
- **Counting:** every time a cord that *was* going to close into its own little loop is instead carried into another loop's territory, the two loops **fuse into one** (this is the Chavey and Straffin merge rule: joining a crossing of two different loops drops the loop count by one). So a seam does not just hold two panels together. It *re-counts the whole object.*

This is why João, on tape, cannot tell you how many loops his jacket has until it is finished. The boundary of each flat panel sets that panel's count by gcd. The *seams* then fuse those counts together into a final number that only the finished, three-dimensional object knows. "I don't know why, but they become twelve."

## 2. One rectangle, one edge joined to its opposite: the cylinder, the sleeve

The simplest join is a rectangle joining its own left edge to its own right edge. Roll it into a tube. That is a sleeve.

Now the cord, reaching the right edge, does not turn. It reappears at the left edge at the same height and keeps going, winding around the tube like the stripe on a barber's pole. The two short edges of the rectangle (the cuff and the shoulder end) still have nails and still make the cord turn. So the sleeve is a *cylinder billiard*: it bounces at the two ends and wraps around the middle.

What this does to the loop count is no longer gcd of the flat rectangle. It is the loop count of the cylinder, which depends on the tube's circumference and length and how the diagonal wraps. Mathematically this is the classic trick of *unrolling*: a cylinder is an infinite strip of repeated rectangles, and a path on the cylinder is a straight diagonal on that strip. (This is exactly the kind of thing the flat tool does not yet compute, and where a small engine extension could.)

The craft fact, from João: he weaves the rectangle flat first, then ties the long edges together *with the cord itself* so the strands are continuous across the seam. The sleeve has no seam you can find, because the seam is just the cord carrying on.

## 3. Two rectangles sharing one edge: front meets back

Now two separate panels, a front and a back, laid edge to edge and joined along the shoulder (and later the sides). Along that shared edge the cords of the front are led into the back and the cords of the back into the front. Neither turns at the join.

So at the shoulder seam, front loops and back loops meet and fuse. Two panels that were, say, one loop each flat can become a single loop spanning both once they are joined, because the seam carried the cord from one into the other. João said it precisely: when he stitches a front to a back, "the colours gotta match," and "it's not guaranteed it will become a one string only" because "now it's a different shape." The join changes the count, and he has to plan colour so the pattern lines up across the seam.

He also told us where it stops being tidy. A straight rectangle edge meeting another straight rectangle edge matches cleanly on the side where their nails line up. The pattern flows across as if the seam were not there.

## 4. The collar: the join that only half matches

The collar is not a plain rectangle meeting a plain rectangle. It is a longer, differently oriented strip set against the neckline. João was exact about this on tape: it matches along one side and *does not* match along the other. "It doesn't match in the collar." The same pattern, but on one edge the cord carries across and the diamonds continue, and on the other the geometry flips and they meet in opposition. He accepts it ("it doesn't lose anything"), and it is in fact a visible signature of where two pieces of different shape were married without a stitch.

This is the honest edge of the craft: most seams can be made to carry the pattern through, but some shapes cannot be reconciled on both sides at once. That is geometry, not a mistake.

## 5. The whole jacket: rectangles all the way

Assemble it: a back panel, two front panels, two sleeves rolled from rectangles into cylinders, a collar. Each was woven flat on its own board, each carrying its own gcd loop count. Then every shared edge is joined the same way, cord carried across rather than turned, until the eight flat panels are one three-dimensional garment.

The seams have fused all those separate loop counts into a single small number, probably four, that none of the individual panels had and that he could not know until it was done. Every one of those final loops is still a single closed circle, spliced invisibly to itself. Pull one and, in principle, you would draw out one enormous circle threading through the back, around a sleeve, across the front, through the collar, and home.

And the hardest part is that the colour does not go on flat. He builds the panels as a plain string *skeleton* first, ties the skeleton into the finished 3D shape, and only then chases the coloured cord through it, loop by loop, following the path while the garment already hangs in space. "It's a lot of work, man. I run from that." For the first jacket he got it wrong, saw the four loops he wanted were about to collapse into one, and took the entire thing apart to redo it panel by panel.

## What this means for the site and the tool
- **The flat tool solves step 0 perfectly** (gcd, the pattern, the colours, the lengths). It does not yet solve steps 1 to 5: the *seam arithmetic*. When panels are joined, the loop count is decided by the merge rule applied at every cross-seam crossing, in space, by hand. "Another thing we cannot compute, a kind of discovery in itself."
- **A future feature** (`seam/assembly calculator`): model each boundary nail as either a turn or a carry-through, then re-run the trace across the joined surface. If it outputs João's real counts (shoe 12, jacket ~4), the tool will have learned the third dimension. (See `knowledge-base.md` "the shoe seam is computable in principle.")
- **For `/como`:** this exact ladder, rectangle → cylinder → two panels → collar → jacket, is the clearest way to make a stranger feel the labour and the cleverness. Each rung is one diagram or one short live trace.

## To verify with João (precision points)
- Exact nail placement and spacing on a real board (one per cell edge? corners?).
- At a seam, is the cord literally one continuous strand crossing the join, or two strands tied so as to behave as one? (Determines whether "carry-through" is exact.)
- The sleeve: does he join the rectangle's long edges (a tube down the arm) or roll it the other way?
- The collar mismatch: which edge matches, which flips, and why (his words, with the piece in hand).
- Whether he can predict, before assembly, what the seams will fuse the count to, or whether it is always a surprise.
