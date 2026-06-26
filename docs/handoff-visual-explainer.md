# Handoff brief: build the VISUAL "How João builds" explainer (for a fresh chat)

Paste this whole file's path into a new chat and say: *"Read docs/handoff-visual-explainer.md and do it."* Self-contained. Goal: produce the visual assets (animations + screenshots) that explain João's process, using the real engine, for the `/como` process page and the Riga submission.

## What we're making and why
A visual explainer of how João turns a shape into cloth, built from the engine itself. The written spine already exists in `docs/how-joao-builds.md` (read it first) and `docs/the-process.md`. Your job is the PICTURES: animations of the cord laying, the string-only skeleton vs the finished coloured cloth, the gcd examples, and the colour story (including photo → pattern). These illustrate the words; they do not replace them.

## The storytelling frame (keep this in the captions/voice)
- The process **starts on an engine a friend built**, because the mathematics is genuinely hard and tracing a pattern by hand is brutally slow. The software **saves João roughly 3 hours per piece**, more on complex ones, and crucially it lets him **design patterns from what the software shows** before he commits a hundred hours of weaving. That is the engine's real role: the planning step.
- BUT João is the subject, not the tool. The engine is the lens we explain *through*. Voice: third person, **no em-dashes**, João central. The player canvas stays dark slate; all colour comes from the yarn palette.
- Honesty rule that matters here: the engine is **flat-only**. It animates a single board beautifully. It does **not** compute seams / 3D assembly (the cylinder, the joined panels, the jacket). Those stages get explained with static diagrams + the words, not faked animation. Say so plainly. (See `how-joao-builds.md` for the bounce-vs-carry-through logic.)

## Read first (context)
- `docs/how-joao-builds.md` — the rectangle → cylinder → two panels → collar → jacket ladder (the spine).
- `docs/the-process.md` — the 9-step process media script.
- `docs/the-tool.md` — the tool's story (audience of one; the paper; "dig in the dark → light in front of me").
- `docs/knowledge-base.md` — all verified facts; §2 craft mechanics, the difficulty inversion, the 3-pass densify.
- `docs/quotes.md` — João verbatim for captions.

## The engine — how to drive it (verified capabilities)
`src/engine.js` (TearEngine) + `src/player.js` (TearPlayer) are vanilla JS, zero-dep. The pattern for making a visual: write a tiny HTML page that embeds a player (copy `staircase.html` as the template — it works), serve it, screenshot it with Playwright.

`TearPlayer.create(el, opts)` options that matter:
- `cells` (2D boolean array, the shape) or `gw`/`gh` for a rectangle.
- `colors` — array of per-loop hex. **String-only / skeleton look = set every colour to one neutral** (e.g. all `#c1cad3` bone) **and `strand` thin** (~0.18). Finished-cloth look = real palette colours + `strand` ~0.45 (or up to ~0.7 for "touching" full cloth).
- `strand` — strand thickness (0.18 ≈ string skeleton; 0.45 default; ~0.7 ≈ finished cloth with no gaps).
- `nails` (true/false), `bg`, `speedFactor`, `loop`, `autoplay:'visible'|true|false`.
- `onDone` (fires when laying completes), `onTick` (per-frame — drives counters).
- The player **animates the cord laying in real time, one strand nail-to-nail, with the over/under gaps appearing as it dives under earlier cord.** That animation IS the "cord moving" we want.

Loop counts are real: `TearEngine.getAllCycles(cells, gw, gh).cycles.length` = gcd for rectangles. Use it to label examples (17×10→1, 18×10→2, 15×10→5, n×n→n).

### How to capture the cord MOVING (animation artifact)
1. Make a page with the player, `autoplay:false`, known `speedFactor`.
2. Serve it (there's a static server: `node build/serve.js <port>`; or reuse the running one). Note: the app/pages are plain static HTML.
3. With Playwright: navigate, then either (a) take a burst of screenshots every ~150-300ms while it plays to get frames, or (b) use the existing approach of capturing at set moments. Assemble frames into a GIF/mp4 with ffmpeg (`ffmpeg -i frame-%03d.png -vf palettegen ...` then loop) for a shareable loop.
4. For stills: screenshot at "just started," "half laid," "one loop closing," "finished."
Reference: `staircase.html` + the earlier playwright screenshots are the proven recipe.

### The string-only (skeleton) stage — important for the story
João builds a plain string skeleton, then adds colour. Show this as a PAIR on the same shape:
- skeleton: `colors` all bone, `strand` 0.18, nails on → looks like the loose string structure.
- finished: real per-loop palette colours, `strand` 0.45-0.7 → looks like cloth.
The app also has this built in: strand mode **"linha" (string)** is the skeleton look, **"grosso" (full)** is finished cloth, toggled on the Fios tab. You can screenshot the real app showing both.

## The colour story (the user specifically wants this)
1. **Colours are assigned per loop, after the structure is decided.** Show the same board rendered with different colour assignments (e.g. an 8-loop board in 8 colours vs 2 colours vs one-colour-repeated). Just re-render with different `colors` arrays. Caption: the pattern is discovered (fixed by the shape); only the colours are chosen.
2. **The real app does this on the Fios tab** — screenshot `index.html` (served): the Desenhar (draw) tab, then the Fios tab where each string gets a colour, plus the length readout ("Strings are balanced, each ~X%") which is the feature that saves planning time.
3. **Photo → pattern → colours**: use the **`pattern-from-image` skill** (`.claude/skills/pattern-from-image/SKILL.md`). Give it a photo of one of João's real woven pieces (from `docs/photos/`, e.g. a bold flat piece) and it analyses the colours + structure, picks a board with the right cycle count, renders the finished weave PNG, and emits an importable shapes JSON. This is a showstopper: "point it at a finished cloth and it reconstructs the design." Produce one or two of these as before/after pairs (real photo ↔ engine reconstruction).

## The shot list (what to produce)
Per stage of `how-joao-builds.md`, an animation and/or still:
1. **The atom — one rectangle laying.** Animated cord on, say, 17×10 (one loop, gcd 1): the single cord travelling, bouncing, closing. Then 18×10 (two loops) and a square (n loops) as stills with their counts. This is the "what one cord does" centrepiece.
2. **String skeleton vs finished cloth** — the paired render on one shape (skeleton bone/thin → coloured/full). The "before colour / after colour" of a flat piece.
3. **gcd examples row** — 17×10, 18×10, 15×10, square: four stills, each labelled with its loop count, to show "the boundary decides the number."
4. **The join stages (cylinder, two panels, collar, jacket)** — the engine can't animate these. Produce clean STATIC diagrams (SVG is fine) of bounce-vs-carry-through, a rectangle rolling into a cylinder, two panels sharing an edge with cords crossing, and note the loop count fusing. Pair with the real photos (`docs/photos/shoes/`, `jacket/`, the `shoe-construction/` set in `docs/outreach/riga-triennial/candidate-images/`).
5. **Colour assignment** — the same board in several colourways (engine renders) + an app screenshot of the Fios tab + length readout.
6. **Photo → pattern** — pattern-from-image on a real piece photo, shown as a before/after pair.

## Output
- Put generated stills/animations in `docs/photos/process-renders/` (gitignored like other images; commit only if small/curated).
- Tiny demo HTML pages can live in a scratch folder or `docs/_demos/` (don't pollute the app).
- Log what you made + filenames in `docs/photos/catalog.md` under a new "process-renders" section.
- Keep the dark-slate player canvas; no em-dashes in captions; João central, tool as the lens.

## Constraints / gotchas
- Engine is flat-only (no seams/3D) — do not fake 3D animation.
- Don't touch `index.html` / the app logic; only read it and screenshot it.
- The git situation: we are on branch `two-panel-loops` locally (a colleague's `origin/two-panel-loops` has separate newer code; our recovery is on `origin/two-panel-loops-recovery`). Don't push to the colleague's branch; commit locally / to the recovery branch only.
- `.env` holds an API key and is gitignored — never commit it; media/ and the photo library are gitignored too.
