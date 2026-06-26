// Round-trip and malformed-input tests for src/code.js (Tear design codes).
// Run: node scripts/test-code.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const TearCode = require("../src/code.js");
const { encodeDesign, decodeDesign, PALETTE } = TearCode;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok  " + name);
  } catch (e) {
    console.error("FAIL  " + name);
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

// ---------- helpers ----------

function rect(gw, gh, fill = true) {
  return Array.from({ length: gh }, () => Array.from({ length: gw }, () => fill));
}

function normaliseHex(h) {
  let s = h.trim().toLowerCase();
  if (s[0] === "#") s = s.slice(1);
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return "#" + s;
}

function normalise(design) {
  const norm = (map) => {
    const out = {};
    for (const k of Object.keys(map || {})) out[String(parseInt(k, 10))] = normaliseHex(map[k]);
    return out;
  };
  return {
    gw: design.gw,
    gh: design.gh,
    cells: design.cells.map((row) => row.map((c) => !!c)),
    colors: norm(design.colors),
    secondary: norm(design.secondary),
  };
}

function roundTrip(design) {
  const code = encodeDesign(design);
  assert.match(code, /^T1-[A-Za-z0-9_-]+$/, "code must be T1- + base64url");
  const decoded = decodeDesign(code);
  assert.deepEqual(decoded, normalise(design), "decode(encode(x)) must equal normalised x");
  // Canonical: re-encoding the decoded design reproduces the same code.
  assert.equal(encodeDesign(decoded), code, "re-encode must be stable");
  return code;
}

function assertThrows(fn, re, label) {
  assert.throws(fn, (e) => e instanceof Error && re.test(e.message), label + " (expected /" + re.source + "/)");
}

// Build a raw payload -> "T1-" code, to forge malformed payloads.
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function forge(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return "T1-" + out;
}

// Deterministic PRNG (mulberry32) for the random-shape case.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const examples = [];

// ---------- round trips ----------

test("empty colours (5x4 rectangle)", () => {
  const code = roundTrip({ gw: 5, gh: 4, cells: rect(5, 4) });
  examples.push(["5x4 rectangle, no colours", code]);
  const d = decodeDesign(code);
  assert.deepEqual(d.colors, {});
  assert.deepEqual(d.secondary, {});
});

test("full 18x10 with 2 palette colours is ~40 chars", () => {
  const code = roundTrip({
    gw: 18, gh: 10, cells: rect(18, 10),
    colors: { 0: "#d4242c", 1: "#2aa0b4" }, // Vermelho, Turquesa
  });
  examples.push(["18x10 full, 2 colours", code]);
  assert.ok(code.length <= 42, "expected ~40 chars, got " + code.length + ": " + code);
});

test("L-shape with holes", () => {
  const gw = 12, gh = 12;
  const cells = Array.from({ length: gh }, (_, y) =>
    Array.from({ length: gw }, (_, x) => x < 5 || y >= 7) // L
  );
  cells[2][2] = false; cells[3][2] = false; // hole in the vertical arm
  cells[9][8] = false; cells[9][9] = false; cells[10][8] = false; // hole in the foot
  const code = roundTrip({
    gw, gh, cells,
    colors: { 0: "#d4242c", 1: "#ecdcb0", 3: "#1e40c8" },
  });
  examples.push(["12x12 L-shape with holes, 3 colours", code]);
});

test("60x60 random shape", () => {
  const rnd = mulberry32(0xbeef);
  const gw = 60, gh = 60;
  const cells = Array.from({ length: gh }, () =>
    Array.from({ length: gw }, () => rnd() < 0.55)
  );
  const code = roundTrip({ gw, gh, cells, colors: { 0: "#2e9a5e" } });
  examples.push(["60x60 random shape, 1 colour", code]);
});

test("sparse secondary colours (high cycle indices use escapes)", () => {
  const code = roundTrip({
    gw: 8, gh: 8, cells: rect(8, 8),
    colors: { 2: "#e4287c" },
    secondary: { 7: "#f4f1e8", 123: "#1a1c28" }, // palette colours, sparse — escape path is cheaper
  });
  examples.push(["8x8, sparse secondary at cycles 7 & 123", code]);
  const d = decodeDesign(code);
  assert.equal(d.secondary[123], "#1a1c28");
});

test("arbitrary non-palette hex colours", () => {
  const code = roundTrip({
    gw: 6, gh: 6, cells: rect(6, 6),
    colors: { 0: "#123456", 2: "#ABCDEF", 5: "#0f0" }, // mixed case + shorthand normalise
    secondary: { 0: "#d4242c" }, // palette secondary alongside hex primaries
  });
  examples.push(["6x6, non-palette hex colours", code]);
  const d = decodeDesign(code);
  assert.equal(d.colors[2], "#abcdef");
  assert.equal(d.colors[5], "#00ff00");
});

test("cycle index > 255 round-trips via escape", () => {
  roundTrip({ gw: 4, gh: 4, cells: rect(4, 4), colors: { 300: "#d4242c", 65535: "#010203" } });
});

test("all 15 palette colours round-trip via nibbles", () => {
  const colors = {};
  PALETTE.forEach((c, i) => { colors[i] = c.hex; });
  roundTrip({ gw: 10, gh: 10, cells: rect(10, 10), colors });
});

test("secondary-only colours (empty primary placeholder section)", () => {
  roundTrip({ gw: 4, gh: 4, cells: rect(4, 4), colors: {}, secondary: { 1: "#e8c838" } });
});

test("empty shape (all cells false) is structurally valid", () => {
  roundTrip({ gw: 3, gh: 3, cells: rect(3, 3, false) });
});

// ---------- malformed input: decode ----------

const okCode = encodeDesign({ gw: 5, gh: 4, cells: rect(5, 4) });

test("decode rejects non-strings and foreign prefixes", () => {
  assertThrows(() => decodeDesign(42), /expects a string/, "number input");
  assertThrows(() => decodeDesign(""), /prefix/, "empty string");
  assertThrows(() => decodeDesign("X1-AAAA"), /prefix/, "foreign prefix");
  assertThrows(() => decodeDesign("t1-AAAA"), /prefix/, "lowercase prefix");
});

test("decode rejects unsupported future version prefix", () => {
  assertThrows(() => decodeDesign("T2-AAAA"), /unsupported format version T2/, "T2 prefix");
});

test("decode rejects bad base64url", () => {
  assertThrows(() => decodeDesign("T1-AB$D"), /invalid base64url character/, "bad char");
  assertThrows(() => decodeDesign("T1-AAAAA"), /impossible base64url length/, "len mod 4 == 1");
  assertThrows(() => decodeDesign("T1-AB"), /padding bits/, "nonzero base64 tail bits");
});

test("decode rejects truncated/invalid headers", () => {
  assertThrows(() => decodeDesign(forge([1, 5])), /truncated payload/, "2-byte payload");
  assertThrows(() => decodeDesign(forge([2, 5, 4, 0, 0, 0])), /version byte/, "version != 1");
  assertThrows(() => decodeDesign(forge([1, 1, 4, 0])), /gw out of range/, "gw too small");
  assertThrows(() => decodeDesign(forge([1, 65, 4, 0])), /gw out of range/, "gw too big");
  assertThrows(() => decodeDesign(forge([1, 5, 70, 0])), /gh out of range/, "gh too big");
});

test("decode rejects truncated or non-canonical cell bitfield", () => {
  assertThrows(() => decodeDesign(forge([1, 5, 4, 255])), /truncated payload.*cell bitfield/, "missing cell bytes");
  // 5x4 = 20 bits -> 3 bytes; low 4 bits of byte 3 are padding
  assertThrows(() => decodeDesign(forge([1, 5, 4, 255, 255, 0xf1])), /padding bits in cell bitfield/, "dirty padding");
});

test("decode rejects malformed colour sections", () => {
  const cellOk = [1, 5, 4, 255, 255, 0xf0];
  assertThrows(() => decodeDesign(forge([...cellOk, 4])), /truncated payload.*primary/, "nibble bytes missing");
  assertThrows(() => decodeDesign(forge([...cellOk, 1, 0x65])), /padding nibble/, "dirty odd-nibble padding");
  assertThrows(() => decodeDesign(forge([...cellOk, 0, 0, 2, 0, 0, 0, 1, 2, 3])), /truncated payload.*escape/, "escape entries missing");
  assertThrows(() => decodeDesign(forge([...cellOk, 0, 0, 1, 0, 0, 7, 1, 2, 3])), /invalid escape target/, "bad target byte");
  assertThrows(() => decodeDesign(forge([...cellOk, 0, 0, 1, 0, 0, 0, 1, 2, 3, 99])), /trailing bytes/, "trailing junk");
});

// ---------- malformed input: encode ----------

test("encode rejects bad designs", () => {
  assertThrows(() => encodeDesign(null), /design object/, "null");
  assertThrows(() => encodeDesign({ gw: 1, gh: 4, cells: rect(1, 4) }), /gw must be/, "gw=1");
  assertThrows(() => encodeDesign({ gw: 65, gh: 4, cells: rect(65, 4) }), /gw must be/, "gw=65");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4.5, cells: [] }), /gh must be/, "fractional gh");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(5, 3) }), /gh=4 rows/, "wrong row count");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(4, 4) }), /gw=5 entries/, "wrong row length");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(5, 4), colors: { 0: "red" } }), /invalid hex colour/, "bad hex");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(5, 4), colors: { "-1": "#fff" } }), /cycle index/, "negative cycle");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(5, 4), colors: { 70000: "#fff" } }), /exceeds 65535/, "huge cycle");
  assertThrows(() => encodeDesign({ gw: 5, gh: 4, cells: rect(5, 4), colors: [1, 2] }), /must be a/, "array colours");
});

// ---------- report ----------

console.log("\n" + passed + " tests passed.\n");
console.log("Example codes:");
for (const [label, code] of examples) {
  const shown = code.length > 72 ? code.slice(0, 69) + "..." : code;
  console.log("  " + String(code.length).padStart(4) + " chars  " + label + "\n        " + shown);
}
