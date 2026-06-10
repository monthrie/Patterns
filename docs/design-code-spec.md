# Tear Design Code — format specification

**Version: T1** (Tear, format version 1) · Status: stable · Reference implementation: `src/code.js` (`TearCode.encodeDesign` / `TearCode.decodeDesign`) · Tests: `scripts/test-code.mjs`

A *design code* is a short, URL-safe string that fully describes one weaving design: the cell-grid shape plus the colour assigned to each cycle (string loop). It is the interchange format for sharing, website embeds, galleries and commissions.

Example (full 18×10 rectangle, cycle 0 Vermelho, cycle 1 Turquesa — 41 chars):

```
T1-ARIK______________________________ACbQ
```

---

## 1. Outer form

```
"T1-" + base64url(payload)
```

- The literal ASCII prefix `T1-` identifies a Tear code and its major format version. Future incompatible formats will use `T2-`, `T3-`, …
- `base64url` is RFC 4648 §5 (`A–Z a–z 0–9 - _`), **no padding** (`=` never appears).
- The encoding is **canonical**: all unused bits (base64 tail bits, cell-bitfield padding, odd-nibble padding) MUST be zero. Decoders MUST reject nonzero padding so a given design has exactly one valid code.
- Codes contain only `[A-Za-z0-9_-]` after the prefix — safe in URLs, filenames and QR codes without escaping.

## 2. Payload layout

All multi-byte integers are big-endian. Offsets in bytes.

| offset | size | field |
|---|---|---|
| 0 | 1 | `version` — MUST be `0x01` (matches the prefix; belt and braces) |
| 1 | 1 | `gw` — grid width in cells, 2..64 |
| 2 | 1 | `gh` — grid height in cells, 2..64 |
| 3 | ⌈gw·gh/8⌉ | `cells` — shape bitfield (§3) |
| … | var | *optional* primary-colour nibble section (§4) |
| … | var | *optional* secondary-colour nibble section (§4) |
| … | var | *optional* escape section (§5) |

**Section presence is by truncation, in order.** The payload may end after `cells` (no colour data), after the primary section (no secondary, no escapes), or after the secondary section (no escapes). A later section can only appear if all earlier ones are present — an empty nibble section is written as the single count byte `0x00` to act as a placeholder. Any bytes remaining after the escape section are an error.

## 3. Cell bitfield

- One bit per grid cell, **row-major**: cell `(x, y)` is bit `i = y·gw + x` (`y = 0` is the top row).
- Bit `i` lives in byte `⌊i/8⌋`, **MSB-first**: bit position `7 − (i mod 8)`. Bit set = cell is part of the shape.
- The final byte's unused low bits (when `gw·gh` is not a multiple of 8) MUST be zero.
- The shape may contain holes or be disconnected; an all-zero bitfield is structurally valid (semantics are the app's concern, not the format's).

## 4. Colour nibble sections (primary, then secondary)

Each section assigns **palette colours** to low-numbered cycles, 4 bits per cycle:

```
u8  N                  — number of cycle slots covered (cycles 0 .. N−1), 0..255
⌈N/2⌉ bytes of nibbles — slot i: byte ⌊i/2⌋, high nibble when i is even
```

Nibble values:

| value | meaning |
|---|---|
| `0` | no colour stored for this cycle |
| `1`..`15` | JOAO palette index `value − 1` (§6) |

If `N` is odd, the unused low nibble of the last byte MUST be zero. Cycles ≥ `N` are unset (unless an escape entry sets them). The primary section colours each cycle's string; the secondary section is the optional second colour for two-colour ("half/half") loops.

## 5. Escape section — arbitrary hex and high cycle indices

For colours outside the 15-colour palette, or cycle indices that don't fit the nibble scheme (≥ 255), or sparse assignments where a dense nibble run would be wasteful:

```
u8  M            — number of escape entries, 0..255
M × 6 bytes:
    u16  cycleIndex   — 0..65535
    u8   target       — 0 = primary colour, 1 = secondary colour (other values: error)
    u8×3 R, G, B      — the colour, raw bytes
```

- Escape entries **override** any nibble assignment for the same (target, cycle); among duplicate escapes the last one wins.
- Encoders MAY store palette colours as escapes (decoders can't tell a palette RGB from an arbitrary one and don't need to). The reference encoder uses escapes for a section whenever they are smaller than the dense nibble run (e.g. one colour on cycle 200), and for everything that *can't* go in nibbles.

## 6. The JOAO palette (15 colours)

Nibble value = index + 1. Hex values are the app's `JOAO` array in `src/app.js` (real Barbante Beatriz yarn matches).

| index | name | hex |
|---|---|---|
| 0 | Branco | `#f4f1e8` |
| 1 | Creme | `#ecdcb0` |
| 2 | Amarelo | `#e8c838` |
| 3 | Ambar | `#e8a020` |
| 4 | Coral | `#e84030` |
| 5 | Vermelho | `#d4242c` |
| 6 | Rosa Claro | `#e68a96` |
| 7 | Rosa Choque | `#e4287c` |
| 8 | Magenta | `#c41878` |
| 9 | Roxo | `#6a2aa0` |
| 10 | Verde Neon | `#8ab840` |
| 11 | Verde Mar | `#2e9a5e` |
| 12 | Turquesa | `#2aa0b4` |
| 13 | Azul | `#1e40c8` |
| 14 | Preto | `#1a1c28` |

The palette table is **frozen for T1**. Changing a hex value or reordering entries would silently recolour every existing code; additions/changes require a new format version.

## 7. Cycle indexing

Cycle index *n* means the *n*-th cycle returned by the engine's `getAllCycles(cells, gw, gh)` for this exact shape — the same ordering the app uses for `cycleColors` / `cycleSecondary`. The code stores colour assignments only; cycles themselves are always re-derived from the shape, so a code can never disagree with its own geometry. Colour entries for cycle indices beyond the shape's actual cycle count are permitted in the format (decoders return them; apps may ignore them).

## 8. Sizes

- header 3 B + cells ⌈gw·gh/8⌉ B + colour sections.
- Full 18×10, two palette colours on cycles 0–1: 3 + 23 + (1+1) = 28 bytes → **41 chars** with prefix.
- Same shape, no colours: 26 bytes → 38 chars.
- 64×64 worst case shape: 515 bytes → ~690 chars (still a workable URL).
- Each escape entry adds 6 bytes (8 chars).

## 9. Decoder error conditions (normative)

A conforming decoder MUST reject, with a descriptive error: missing/foreign prefix; recognised-but-unsupported version prefix (`T2-` …); characters outside the base64url alphabet; impossible base64 length (len mod 4 = 1); nonzero base64 tail bits; payload shorter than 3 bytes; `version ≠ 1`; `gw`/`gh` outside 2..64; truncated cell bitfield; nonzero cell-bitfield padding bits; truncated nibble or escape sections; nonzero odd-nibble padding; escape `target` other than 0/1; trailing bytes after the escape section.

## 10. JS API (`src/code.js`)

Zero-dependency vanilla JS; attaches to `window.TearCode` in browsers and `module.exports` in Node.

```js
encodeDesign({ gw, gh, cells, colors, secondary }) → "T1-…"
decodeDesign("T1-…") → { gw, gh, cells, colors, secondary }   // throws on malformed input
```

- `cells`: `boolean[][]`, `gh` rows × `gw` columns (`cells[y][x]`; truthiness is coerced on encode).
- `colors`, `secondary`: sparse objects `{ cycleIndex: "#rrggbb" }`; optional on encode, always present (possibly `{}`) on decode.
- Hex input accepts `#rgb`/`#rrggbb`, any case, `#` optional; decode output is normalised lowercase `#rrggbb`. Palette colours round-trip through their palette index; everything else through escapes — `decode(encode(x))` equals `x` after normalisation either way.
