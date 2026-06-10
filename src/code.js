/*
 * TearCode — encode/decode Tear design codes ("T1-…").
 * Spec: docs/design-code-spec.md. Zero dependencies; browser + Node.
 * Standalone module — not yet wired into the app (index.html).
 */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.TearCode = api;
})(function () {
  "use strict";

  var VERSION = 1;
  var PREFIX = "T1-";

  // Frozen for T1 — must match the JOAO array in src/app.js. Nibble value = index + 1.
  var PALETTE = [
    { name: "Branco", hex: "#f4f1e8" },
    { name: "Creme", hex: "#ecdcb0" },
    { name: "Amarelo", hex: "#e8c838" },
    { name: "Ambar", hex: "#e8a020" },
    { name: "Coral", hex: "#e84030" },
    { name: "Vermelho", hex: "#d4242c" },
    { name: "Rosa Claro", hex: "#e68a96" },
    { name: "Rosa Choque", hex: "#e4287c" },
    { name: "Magenta", hex: "#c41878" },
    { name: "Roxo", hex: "#6a2aa0" },
    { name: "Verde Neon", hex: "#8ab840" },
    { name: "Verde Mar", hex: "#2e9a5e" },
    { name: "Turquesa", hex: "#2aa0b4" },
    { name: "Azul", hex: "#1e40c8" },
    { name: "Preto", hex: "#1a1c28" }
  ];
  var HEX_TO_INDEX = {};
  PALETTE.forEach(function (c, i) { HEX_TO_INDEX[c.hex] = i; });

  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var B64_VAL = {};
  for (var bi = 0; bi < 64; bi++) B64_VAL[B64[bi]] = bi;

  function err(msg) { throw new Error("TearCode: " + msg); }

  // ---------- base64url (no padding, canonical) ----------

  function toBase64url(bytes) {
    var out = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i];
      var b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var n = (b0 << 16) | (b1 << 8) | b2;
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
      if (i + 2 < bytes.length) out += B64[n & 63];
    }
    return out;
  }

  function fromBase64url(s) {
    if (s.length % 4 === 1) err("malformed code: impossible base64url length");
    var bytes = [];
    var buf = 0, bits = 0;
    for (var i = 0; i < s.length; i++) {
      var v = B64_VAL[s[i]];
      if (v === undefined) err("malformed code: invalid base64url character " + JSON.stringify(s[i]));
      buf = (buf << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buf >> bits) & 255);
      }
    }
    if ((buf & ((1 << bits) - 1)) !== 0) err("malformed code: nonzero base64url padding bits (non-canonical)");
    return bytes;
  }

  // ---------- input normalisation ----------

  function normaliseHex(hex, ctx) {
    if (typeof hex !== "string") err(ctx + ": colour must be a hex string, got " + typeof hex);
    var h = hex.trim().toLowerCase();
    if (h.charAt(0) === "#") h = h.slice(1);
    if (/^[0-9a-f]{3}$/.test(h)) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/.test(h)) err(ctx + ": invalid hex colour " + JSON.stringify(hex));
    return "#" + h;
  }

  // Sparse {cycleIndex: hex} object -> sorted [{idx, hex}] array.
  function normaliseColourMap(map, label) {
    if (map === undefined || map === null) return [];
    if (typeof map !== "object" || Array.isArray(map)) err(label + " must be a {cycleIndex: hex} object");
    var out = [];
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (!/^(0|[1-9][0-9]*)$/.test(k)) err(label + ": cycle index must be a non-negative integer, got " + JSON.stringify(k));
      var idx = parseInt(k, 10);
      if (idx > 65535) err(label + ": cycle index " + idx + " exceeds 65535");
      out.push({ idx: idx, hex: normaliseHex(map[k], label + "[" + k + "]") });
    }
    out.sort(function (a, b) { return a.idx - b.idx; });
    return out;
  }

  // Split a section's entries into nibble-encodable vs escape entries.
  function planSection(entries) {
    var nibbles = [], escapes = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (HEX_TO_INDEX[e.hex] !== undefined && e.idx <= 254) nibbles.push(e);
      else escapes.push(e);
    }
    if (nibbles.length > 0) {
      var maxIdx = nibbles[nibbles.length - 1].idx;
      // Sparse high-index palette colours: escapes (6 B each) can beat a dense nibble run.
      if (6 * nibbles.length < Math.ceil((maxIdx + 1) / 2)) {
        return { nibbles: [], escapes: entries };
      }
    }
    return { nibbles: nibbles, escapes: escapes };
  }

  function writeNibbleSection(bytes, nibbles) {
    var N = nibbles.length ? nibbles[nibbles.length - 1].idx + 1 : 0;
    bytes.push(N);
    var packed = new Array(Math.ceil(N / 2));
    for (var i = 0; i < packed.length; i++) packed[i] = 0;
    for (var j = 0; j < nibbles.length; j++) {
      var e = nibbles[j];
      var v = HEX_TO_INDEX[e.hex] + 1; // 1..15
      var slot = e.idx >> 1;
      packed[slot] |= (e.idx & 1) === 0 ? (v << 4) : v;
    }
    for (var k = 0; k < packed.length; k++) bytes.push(packed[k]);
  }

  // ---------- public API ----------

  function encodeDesign(design) {
    if (design === null || typeof design !== "object") err("encodeDesign expects a design object");
    var gw = design.gw, gh = design.gh;
    if (!Number.isInteger(gw) || gw < 2 || gw > 64) err("gw must be an integer in 2..64, got " + gw);
    if (!Number.isInteger(gh) || gh < 2 || gh > 64) err("gh must be an integer in 2..64, got " + gh);
    var cells = design.cells;
    if (!Array.isArray(cells) || cells.length !== gh) err("cells must be an array of gh=" + gh + " rows");

    var bytes = [VERSION, gw, gh];

    var nCellBytes = Math.ceil((gw * gh) / 8);
    var cellBytes = new Array(nCellBytes);
    for (var b = 0; b < nCellBytes; b++) cellBytes[b] = 0;
    for (var y = 0; y < gh; y++) {
      var row = cells[y];
      if (!Array.isArray(row) || row.length !== gw) err("cells row " + y + " must be an array of gw=" + gw + " entries");
      for (var x = 0; x < gw; x++) {
        if (row[x]) {
          var i = y * gw + x;
          cellBytes[i >> 3] |= 1 << (7 - (i & 7));
        }
      }
    }
    for (var cb = 0; cb < nCellBytes; cb++) bytes.push(cellBytes[cb]);

    var primary = planSection(normaliseColourMap(design.colors, "colors"));
    var secondary = planSection(normaliseColourMap(design.secondary, "secondary"));

    var escapes = [];
    primary.escapes.forEach(function (e) { escapes.push({ idx: e.idx, target: 0, hex: e.hex }); });
    secondary.escapes.forEach(function (e) { escapes.push({ idx: e.idx, target: 1, hex: e.hex }); });
    if (escapes.length > 255) err("too many escape colour entries (" + escapes.length + "; max 255)");

    var needE = escapes.length > 0;
    var needS = secondary.nibbles.length > 0 || needE;
    var needP = primary.nibbles.length > 0 || needS;

    if (needP) writeNibbleSection(bytes, primary.nibbles);
    if (needS) writeNibbleSection(bytes, secondary.nibbles);
    if (needE) {
      bytes.push(escapes.length);
      escapes.forEach(function (e) {
        bytes.push((e.idx >> 8) & 255, e.idx & 255, e.target);
        bytes.push(parseInt(e.hex.slice(1, 3), 16), parseInt(e.hex.slice(3, 5), 16), parseInt(e.hex.slice(5, 7), 16));
      });
    }

    return PREFIX + toBase64url(bytes);
  }

  function decodeDesign(str) {
    if (typeof str !== "string") err("decodeDesign expects a string, got " + typeof str);
    var code = str.trim();
    if (code.slice(0, 3) !== PREFIX) {
      var m = /^T([0-9]+)-/.exec(code);
      if (m && m[1] !== "1") err("unsupported format version T" + m[1] + " (this decoder supports T1)");
      err('not a Tear design code (expected prefix "' + PREFIX + '")');
    }
    var bytes = fromBase64url(code.slice(PREFIX.length));
    var off = 0;
    function need(n, what) {
      if (off + n > bytes.length) err("truncated payload: expected " + what);
    }

    need(3, "3-byte header (version, gw, gh)");
    if (bytes[0] !== VERSION) err("version byte " + bytes[0] + " does not match T1");
    var gw = bytes[1], gh = bytes[2];
    if (gw < 2 || gw > 64) err("gw out of range 2..64: " + gw);
    if (gh < 2 || gh > 64) err("gh out of range 2..64: " + gh);
    off = 3;

    var nBits = gw * gh;
    var nCellBytes = Math.ceil(nBits / 8);
    need(nCellBytes, "cell bitfield (" + nCellBytes + " bytes for " + gw + "x" + gh + ")");
    var cells = [];
    for (var y = 0; y < gh; y++) {
      var row = [];
      for (var x = 0; x < gw; x++) {
        var i = y * gw + x;
        row.push((bytes[off + (i >> 3)] & (1 << (7 - (i & 7)))) !== 0);
      }
      cells.push(row);
    }
    for (var p = nBits; p < nCellBytes * 8; p++) {
      if ((bytes[off + (p >> 3)] & (1 << (7 - (p & 7)))) !== 0) err("nonzero padding bits in cell bitfield (non-canonical)");
    }
    off += nCellBytes;

    function readNibbleSection(map, label) {
      need(1, label + " colour count");
      var N = bytes[off++];
      var nPacked = Math.ceil(N / 2);
      need(nPacked, label + " colour nibbles (" + nPacked + " bytes)");
      for (var i = 0; i < N; i++) {
        var byteVal = bytes[off + (i >> 1)];
        var v = (i & 1) === 0 ? (byteVal >> 4) & 15 : byteVal & 15;
        if (v !== 0) map[i] = PALETTE[v - 1].hex;
      }
      if ((N & 1) === 1 && (bytes[off + nPacked - 1] & 15) !== 0) {
        err("nonzero padding nibble in " + label + " colour section (non-canonical)");
      }
      off += nPacked;
    }

    var colors = {}, secondary = {};
    if (off < bytes.length) readNibbleSection(colors, "primary");
    if (off < bytes.length) readNibbleSection(secondary, "secondary");
    if (off < bytes.length) {
      var M = bytes[off++];
      need(6 * M, "escape section (" + M + " entries x 6 bytes)");
      for (var e = 0; e < M; e++) {
        var idx = (bytes[off] << 8) | bytes[off + 1];
        var target = bytes[off + 2];
        if (target !== 0 && target !== 1) err("invalid escape target byte " + target + " (must be 0 or 1)");
        var hex = "#" + [bytes[off + 3], bytes[off + 4], bytes[off + 5]].map(function (c) {
          return (c < 16 ? "0" : "") + c.toString(16);
        }).join("");
        (target === 0 ? colors : secondary)[idx] = hex;
        off += 6;
      }
      if (off !== bytes.length) err("trailing bytes after escape section");
    }

    return { gw: gw, gh: gh, cells: cells, colors: colors, secondary: secondary };
  }

  return {
    VERSION: VERSION,
    PREFIX: PREFIX,
    PALETTE: PALETTE,
    encodeDesign: encodeDesign,
    decodeDesign: decodeDesign
  };
});
