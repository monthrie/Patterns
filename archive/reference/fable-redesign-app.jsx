const { useState, useCallback, useMemo, useRef, useEffect } = React;

/* ================================================================
   TEAR DE PREGOS / NAIL LOOM — pattern workshop
   Billiard-path weaving designer for nail-board barbante craft.
   Geometry/tracing engine carried over verbatim from Knot Maker.
   ================================================================ */

// ========== SHAPE PRESETS ==========
function makePreset(name, curW, curH) {
  if (name === 'escada') {
    const gw = 18, gh = 10;
    const cells = Array.from({length: gh}, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++) {
      const w = y < 4 ? 8 + y * 2 : gw;
      for (let x = 0; x < Math.min(w, gw); x++) cells[y][x] = true;
    }
    return { cells, gw, gh };
  }
  if (name === 'L') {
    const gw = 18, gh = 10;
    const cells = Array.from({length: gh}, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++) {
      const w = y < 2 ? 8 : gw;
      for (let x = 0; x < w; x++) cells[y][x] = true;
    }
    return { cells, gw, gh };
  }
  if (name === 'cruz') {
    const gw = 15, gh = 15;
    const cells = Array.from({length: gh}, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++)
        if ((x >= 5 && x < 10) || (y >= 5 && y < 10)) cells[y][x] = true;
    return { cells, gw, gh };
  }
  if (name === 'moldura') {
    const gw = 16, gh = 12;
    const cells = Array.from({length: gh}, () => Array(gw).fill(true));
    for (let y = 4; y < 8; y++) for (let x = 5; x < 11; x++) cells[y][x] = false;
    return { cells, gw, gh };
  }
  const gw = curW || 18, gh = curH || 10;
  return { cells: Array.from({length: gh}, () => Array(gw).fill(true)), gw, gh };
}

// ========== CELL-GRID SHAPE FUNCTIONS (engine, unchanged) ==========
function buildEdges(cells, gw, gh) {
  const hUnits = [];
  const vUnits = [];
  for (let y = 0; y <= gh; y++)
    for (let x = 0; x < gw; x++) {
      const above = y > 0 ? cells[y-1][x] : false;
      const below = y < gh ? cells[y][x] : false;
      if (above !== below) hUnits.push({y, x});
    }
  for (let x = 0; x <= gw; x++)
    for (let y = 0; y < gh; y++) {
      const left = x > 0 ? cells[y][x-1] : false;
      const right = x < gw ? cells[y][x] : false;
      if (left !== right) vUnits.push({x, y});
    }
  const edges = [];
  const hByY = {};
  for (const e of hUnits) { if (!hByY[e.y]) hByY[e.y] = []; hByY[e.y].push(e.x); }
  for (const y in hByY) {
    const xs = hByY[y].sort((a, b) => a - b);
    let start = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] === xs[i-1] + 1) continue;
      edges.push({ y: +y, x0: start, x1: xs[i-1] + 1, type: 'h' });
      if (i < xs.length) start = xs[i];
    }
  }
  const vByX = {};
  for (const e of vUnits) { if (!vByX[e.x]) vByX[e.x] = []; vByX[e.x].push(e.y); }
  for (const x in vByX) {
    const ys = vByX[x].sort((a, b) => a - b);
    let start = ys[0];
    for (let i = 1; i <= ys.length; i++) {
      if (i < ys.length && ys[i] === ys[i-1] + 1) continue;
      edges.push({ x: +x, y0: start, y1: ys[i-1] + 1, type: 'v' });
      if (i < ys.length) start = ys[i];
    }
  }
  return edges;
}
function buildGaps(cells, gw, gh) {
  const gaps = [];
  for (let y = 0; y <= gh; y++)
    for (let x = 0; x < gw; x++) {
      const above = y > 0 ? cells[y-1][x] : false;
      const below = y < gh ? cells[y][x] : false;
      if (above !== below) gaps.push({ x: x + 0.5, y, isH: true, interiorBelow: !!below });
    }
  for (let x = 0; x <= gw; x++)
    for (let y = 0; y < gh; y++) {
      const left = x > 0 ? cells[y][x-1] : false;
      const right = x < gw ? cells[y][x] : false;
      if (left !== right) gaps.push({ x, y: y + 0.5, isH: false, interiorRight: !!right });
    }
  return gaps;
}
function getInitialDir(gap) {
  if (gap.isH) {
    return gap.interiorBelow ? { dx: 1, dy: 1 } : { dx: -1, dy: -1 };
  }
  return gap.interiorRight ? { dx: 1, dy: -1 } : { dx: -1, dy: 1 };
}
function pointToGapIdx(px, py, gaps) {
  for (let i = 0; i < gaps.length; i++)
    if (Math.abs(px - gaps[i].x) < 0.1 && Math.abs(py - gaps[i].y) < 0.1) return i;
  return -1;
}
function isOnBoundary(px, py, cells, gw, gh) {
  const E = 0.01;
  const iy = Math.round(py), ix = Math.round(px);
  if (Math.abs(py - iy) < E) {
    const cx = Math.floor(px);
    if (cx >= 0 && cx < gw) {
      const above = iy > 0 ? !!cells[iy-1]?.[cx] : false;
      const below = iy < gh ? !!cells[iy]?.[cx] : false;
      if (above !== below) return true;
    }
  }
  if (Math.abs(px - ix) < E) {
    const cy = Math.floor(py);
    if (cy >= 0 && cy < gh) {
      const left = ix > 0 ? !!cells[cy]?.[ix-1] : false;
      const right = ix < gw ? !!cells[cy]?.[ix] : false;
      if (left !== right) return true;
    }
  }
  return false;
}

// ========== BILLIARD TRACING (engine, unchanged) ==========
function tracePath(startIdx, gaps, edges, cells, gw, gh) {
  const EPS = 1e-9;
  const sc = gaps[startIdx];
  const pts = [{ x: sc.x, y: sc.y }];
  let { dx, dy } = getInitialDir(sc);
  let x = sc.x, y = sc.y;
  const maxIter = edges.length * 200 + 2000;
  for (let iter = 0; iter < maxIter; iter++) {
    let minT = Infinity, hitH = false, hitV = false;
    for (const edge of edges) {
      let t;
      if (edge.type === 'h') {
        if (Math.abs(dy) < EPS) continue;
        t = (edge.y - y) / dy;
        if (t < EPS) continue;
        const hx = x + dx * t;
        if (hx < edge.x0 - EPS || hx > edge.x1 + EPS) continue;
      } else {
        if (Math.abs(dx) < EPS) continue;
        t = (edge.x - x) / dx;
        if (t < EPS) continue;
        const hy = y + dy * t;
        if (hy < edge.y0 - EPS || hy > edge.y1 + EPS) continue;
      }
      if (t < minT - EPS) {
        minT = t; hitH = edge.type === 'h'; hitV = edge.type === 'v';
      } else if (Math.abs(t - minT) < EPS * 100) {
        if (edge.type === 'h') hitH = true;
        if (edge.type === 'v') hitV = true;
      }
    }
    if (minT === Infinity || minT > 1e6) break;
    x += dx * minT; y += dy * minT;
    x = Math.round(x * 1e6) / 1e6;
    y = Math.round(y * 1e6) / 1e6;
    pts.push({ x, y });
    if (pts.length > 2 && Math.abs(x - sc.x) < 0.01 && Math.abs(y - sc.y) < 0.01) break;
    if (hitH && hitV) { dx = -dx; dy = -dy; }
    else if (hitH) dy = -dy;
    else if (hitV) dx = -dx;
  }
  return pts;
}
function getAllCycles(cells, gw, gh) {
  const edges = buildEdges(cells, gw, gh);
  const gaps = buildGaps(cells, gw, gh);
  if (gaps.length === 0) return { cycles: [], gaps, edges };
  const vis = new Set(), cycles = [];
  for (let g = 0; g < gaps.length; g++) {
    if (vis.has(g)) continue;
    const pts = tracePath(g, gaps, edges, cells, gw, gh);
    const gapSet = new Set();
    for (const p of pts) {
      const gi = pointToGapIdx(p.x, p.y, gaps);
      if (gi >= 0) { gapSet.add(gi); vis.add(gi); }
    }
    cycles.push({ startGap: g, points: pts, gaps: gapSet });
  }
  return { cycles, gaps, edges };
}

// ========== COLORS ==========
const JOAO = [
  { name: "Branco",      en: "White",       hex: "#f4f1e8" },
  { name: "Creme",       en: "Cream",       hex: "#ecdcb0" },
  { name: "Amarelo",     en: "Yellow",      hex: "#e8c838" },
  { name: "Âmbar",       en: "Amber",       hex: "#e8a020" },
  { name: "Coral",       en: "Coral",       hex: "#e84030" },
  { name: "Vermelho",    en: "Red",         hex: "#d4242c" },
  { name: "Rosa Claro",  en: "Light Pink",  hex: "#e68a96" },
  { name: "Rosa Choque", en: "Hot Pink",    hex: "#e4287c" },
  { name: "Magenta",     en: "Magenta",     hex: "#c41878" },
  { name: "Roxo",        en: "Purple",      hex: "#6a2aa0" },
  { name: "Verde Neon",  en: "Neon Green",  hex: "#8ab840" },
  { name: "Verde Mar",   en: "Sea Green",   hex: "#2e9a5e" },
  { name: "Turquesa",    en: "Turquoise",   hex: "#2aa0b4" },
  { name: "Azul",        en: "Blue",        hex: "#1e40c8" },
  { name: "Preto",       en: "Black",       hex: "#1a1c28" },
];
const colorName = (hex, lang) => {
  const j = JOAO.find(j => j.hex.toLowerCase() === (hex || '').toLowerCase());
  return j ? (lang === 'en' ? j.en : j.name) : hex;
};
// Default rotation tuned for contrast between neighbouring fios
const COLORS = ["#d4242c", "#2aa0b4", "#ecdcb0", "#e4287c", "#2e9a5e", "#e8a020", "#1e40c8", "#6a2aa0", "#e84030", "#8ab840", "#c41878", "#e68a96", "#e8c838", "#f4f1e8"];

const STARTER_PALETTES = [
  { name: "Almofada", colors: ["#d4242c", "#2aa0b4", "#ecdcb0"], builtin: true },
  { name: "Mar",      colors: ["#1e40c8", "#2aa0b4", "#f4f1e8"], builtin: true },
  { name: "Fogo",     colors: ["#d4242c", "#e8a020", "#e8c838"], builtin: true },
  { name: "Jardim",   colors: ["#2e9a5e", "#8ab840", "#ecdcb0"], builtin: true },
  { name: "Festa",    colors: ["#e4287c", "#6a2aa0", "#e8c838", "#2aa0b4"], builtin: true },
];

const BG_OPTIONS = ["#101b16", "#161007", "#3c352a", "#9b9484", "#f3ead4"];

// ========== TRANSLATIONS ==========
const STR = {
  pt: {
    sub: "oficina de padrões",
    fio1: "fio ✦", fios: "fios", deFio: "de fio",
    tabForma: "Forma", tabCores: "Cores", tabFio: "Fio", tabDescobrir: "Descobrir", tabGaleria: "Galeria", tabAjustes: "Ajustes",
    gridSize: "Tamanho da grelha", fill: "Preencher", clear: "Limpar",
    draw: "Desenhar", mirrorH: "Espelho ↔", mirrorV: "Espelho ↕",
    undoB: "Desfazer", redoB: "Refazer",
    presets: "Formas prontas",
    pRect: "Retângulo", pL: "Forma L", pStairs: "Escada", pCross: "Cruz", pFrame: "Moldura",
    formaNote1a: "Desenhe a forma", formaNote1b: " diretamente no quadro — arraste o dedo para acender ou apagar quadrados. O padrão atualiza-se logo.",
    formaNote2a: "Os ", formaNote2b: "números dourados", formaNote2c: " nas bordas dizem quantos pregos leva cada lado da tábua.",
    showWeave: "Ver o tecido por trás",
    viewFios: "Ver fios", all: "TODOS",
    paint: "Pintar fios",
    paintHint: "Toque num fio para escolher a cor. “Metade 2” pinta a segunda metade do fio com outra cor.",
    popPrimary: "Cor do fio", popSecondary: "Metade 2", removeSecond: "Tirar a segunda cor",
    palettes: "Combinações guardadas", savePal: "Guardar cores atuais",
    buy: "Quanto fio comprar", total: "Total",
    tooMany: n => `Este padrão tem ${n} fios — demasiados para pintar um a um. Experimente uma forma com menos fios.`,
    fioTitle: "Enfiar o fio", which: "Qual fio?", lay: "Pôr o fio nos pregos",
    start: "Começar", again: "Outra vez", pause: "Pausa", cont: "Continuar",
    slow: "Devagar", fast: "Rápido", nailNums: "Números nos pregos",
    fioNote1a: "O círculo tracejado é o ", fioNote1b: "prego de partida", fioNote1c: ". Carregue em ", fioNote1d: "Começar", fioNote1e: " e veja o caminho do fio, prego a prego — tal como na tábua.",
    fioNote2: "Use ⏮ ⏭ para avançar um prego de cada vez enquanto trabalha.",
    drawFirst: "Desenhe primeiro uma forma na aba ",
    nail: "Prego", of: "de",
    descTitle: "Descobrir", descHint: "padrões novos",
    surprise: "Surpreende-me!", surpriseHint: "Cria uma forma nova ao acaso, já com cores.",
    mapTitle: "Mapa de fios — retângulos",
    mapHint: "Quantos fios leva um retângulo? Toque num quadrado para experimentar.",
    leg1: "1 fio — especial!", leg2: "2 fios",
    descNote1a: "Os retângulos ", descNote1b: "dourados", descNote1c: " fazem-se com ", descNote1d: "um único fio", descNote1e: " — o fio percorre a tábua inteira e volta ao início. São os mais raros e bonitos de fazer.",
    descNote2a: "Repare no segredo: o número de fios é sempre o ", descNote2b: "maior divisor comum", descNote2c: " dos dois lados!",
    galTitle: "Galeria", pattern: "padrão", patterns: "padrões",
    savePat: "Guardar padrão atual", png: "Imagem PNG", exportB: "Exportar", importB: "Importar",
    galEmptyA: "Ainda não há padrões guardados. Quando gostar de um desenho, carregue em ", galEmptyB: "Guardar padrão atual", galEmptyC: ".",
    ajTitle: "Ajustes",
    strand: "Aspeto do fio", thin: "Fino", full: "Grosso", string: "Linha",
    spacing: "Distância entre pregos",
    spacingHint: "Usado para calcular os comprimentos de fio em centímetros.",
    bg: "Fundo", showNails: "Mostrar os pregos",
    lang: "Língua",
    helpTitle: "Como usar:",
    promptPattern: "Nome do padrão:", promptPalette: "Nome para esta combinação de cores:",
    confirmDel: n => `Apagar “${n}”?`, importErr: m => `Não consegui importar: ${m}`,
    badge: "Desenhe com o dedo · 2 dedos para zoom",
    fit: "AJUSTAR", changeBg: "Mudar fundo",
    balanced: n => `Fios equilibrados (cada um ~${n}% do comprimento).`,
    unbalanced: (a, b) => `Desigual: o fio mais curto tem ${a}% e o mais longo ${b}% do total.`,
    fioOf: i => `fio ${i}`,
  },
  en: {
    sub: "pattern workshop",
    fio1: "string ✦", fios: "strings", deFio: "of string",
    tabForma: "Shape", tabCores: "Colours", tabFio: "Thread", tabDescobrir: "Discover", tabGaleria: "Gallery", tabAjustes: "Settings",
    gridSize: "Board size", fill: "Fill", clear: "Clear",
    draw: "Drawing", mirrorH: "Mirror ↔", mirrorV: "Mirror ↕",
    undoB: "Undo", redoB: "Redo",
    presets: "Ready-made shapes",
    pRect: "Rectangle", pL: "L-shape", pStairs: "Staircase", pCross: "Cross", pFrame: "Frame",
    formaNote1a: "Draw the shape", formaNote1b: " right on the board — drag your finger to switch squares on or off. The pattern updates instantly.",
    formaNote2a: "The ", formaNote2b: "golden numbers", formaNote2c: " along the edges tell you how many nails each side of the board needs.",
    showWeave: "Show the weave behind",
    viewFios: "Show strings", all: "ALL",
    paint: "Paint strings",
    paintHint: "Tap a string to pick its colour. “Half 2” paints the second half of the string in another colour.",
    popPrimary: "String colour", popSecondary: "Half 2", removeSecond: "Remove second colour",
    palettes: "Saved colour combos", savePal: "Save current colours",
    buy: "How much string to buy", total: "Total",
    tooMany: n => `This pattern has ${n} strings — too many to paint one by one. Try a shape with fewer strings.`,
    fioTitle: "Lay the string", which: "Which string?", lay: "Lay it on the nails",
    start: "Start", again: "Replay", pause: "Pause", cont: "Continue",
    slow: "Slow", fast: "Fast", nailNums: "Numbers on the nails",
    fioNote1a: "The dashed circle is the ", fioNote1b: "starting nail", fioNote1c: ". Press ", fioNote1d: "Start", fioNote1e: " and watch the string's path, nail by nail — just like on the board.",
    fioNote2: "Use ⏮ ⏭ to step one nail at a time while you work.",
    drawFirst: "First draw a shape in the ",
    nail: "Nail", of: "of",
    descTitle: "Discover", descHint: "new patterns",
    surprise: "Surprise me!", surpriseHint: "Invents a random new shape, colours included.",
    mapTitle: "String map — rectangles",
    mapHint: "How many strings does a rectangle need? Tap a square to try it.",
    leg1: "1 string — special!", leg2: "2 strings",
    descNote1a: "The ", descNote1b: "golden", descNote1c: " rectangles are made with ", descNote1d: "a single string", descNote1e: " — it travels the whole board and returns to the start. The rarest and most beautiful to make.",
    descNote2a: "Spot the secret: the number of strings is always the ", descNote2b: "greatest common divisor", descNote2c: " of the two sides!",
    galTitle: "Gallery", pattern: "pattern", patterns: "patterns",
    savePat: "Save current pattern", png: "PNG image", exportB: "Export", importB: "Import",
    galEmptyA: "No saved patterns yet. When you like a design, press ", galEmptyB: "Save current pattern", galEmptyC: ".",
    ajTitle: "Settings",
    strand: "String style", thin: "Thin", full: "Thick", string: "Line",
    spacing: "Nail spacing",
    spacingHint: "Used to work out string lengths in centimetres.",
    bg: "Background", showNails: "Show the nails",
    lang: "Language",
    helpTitle: "How to use:",
    promptPattern: "Pattern name:", promptPalette: "Name for this colour combo:",
    confirmDel: n => `Delete “${n}”?`, importErr: m => `Could not import: ${m}`,
    badge: "Draw with your finger · 2 fingers to zoom",
    fit: "FIT", changeBg: "Change background",
    balanced: n => `Strings are balanced (each ~${n}% of the length).`,
    unbalanced: (a, b) => `Uneven: the shortest string is ${a}% and the longest ${b}% of the total.`,
    fioOf: i => `string ${i}`,
  },
};

// ========== SMALL UTILS ==========
function loadLS(key, def) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : JSON.parse(v);
  } catch { return def; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function fmtLen(cm) {
  if (!(cm > 0)) return "0 cm";
  if (cm >= 100) return (cm / 100).toFixed(2).replace('.', ',') + " m";
  return Math.round(cm) + " cm";
}
function arcLen(pts) {
  let t = 0;
  for (let s = 0; s < pts.length - 1; s++)
    t += Math.hypot(pts[s+1].x - pts[s].x, pts[s+1].y - pts[s].y);
  return t;
}
function cumLens(pts) {
  const out = [0];
  for (let s = 0; s < pts.length - 1; s++)
    out.push(out[s] + Math.hypot(pts[s+1].x - pts[s].x, pts[s+1].y - pts[s].y));
  return out;
}
function splitPtsAtArc(pts, arc) {
  if (pts.length < 2 || arc <= 0) return [[], pts];
  let acc = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const d = Math.hypot(pts[s+1].x - pts[s].x, pts[s+1].y - pts[s].y);
    if (acc + d >= arc) {
      const t = (arc - acc) / d;
      const split = {
        x: pts[s].x + (pts[s+1].x - pts[s].x) * t,
        y: pts[s].y + (pts[s+1].y - pts[s].y) * t,
      };
      return [pts.slice(0, s + 1).concat([split]), [split].concat(pts.slice(s + 1))];
    }
    acc += d;
  }
  return [pts, []];
}

// Random connected-ish shape: full rectangle with symmetric bites and sometimes a window
function randomShape() {
  const w = 8 + 2 * Math.floor(Math.random() * 6);   // 8..18
  const h = 6 + 2 * Math.floor(Math.random() * 4);   // 6..12
  const symH = Math.random() < 0.85;
  const symV = Math.random() < 0.6;
  const cells = Array.from({length: h}, () => Array(w).fill(true));
  const carve = (x0, y0, bw, bh) => {
    const apply = (cx, cy) => {
      if (cx >= 0 && cx < w && cy >= 0 && cy < h) cells[cy][cx] = false;
    };
    for (let y = y0; y < y0 + bh; y++)
      for (let x = x0; x < x0 + bw; x++) {
        apply(x, y);
        if (symH) apply(w - 1 - x, y);
        if (symV) apply(x, h - 1 - y);
        if (symH && symV) apply(w - 1 - x, h - 1 - y);
      }
  };
  const nBites = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nBites; i++) {
    const bw = 1 + Math.floor(Math.random() * Math.max(1, w / 4));
    const bh = 1 + Math.floor(Math.random() * Math.max(1, h / 3));
    const side = Math.floor(Math.random() * 4);
    if (side === 0) carve(Math.floor(Math.random() * (w - bw)), 0, bw, bh);
    else if (side === 1) carve(Math.floor(Math.random() * (w - bw)), h - bh, bw, bh);
    else if (side === 2) carve(0, Math.floor(Math.random() * (h - bh)), bw, bh);
    else carve(w - bw, Math.floor(Math.random() * (h - bh)), bw, bh);
  }
  if (Math.random() < 0.35 && w >= 10 && h >= 8) {
    const hw = 2 + Math.floor(Math.random() * 3);
    const hh = 2 + Math.floor(Math.random() * 2);
    carve(Math.floor((w - hw) / 2), Math.floor((h - hh) / 2), hw, hh);
  }
  let on = 0;
  for (const row of cells) for (const c of row) if (c) on++;
  if (on < w * h * 0.45) return randomShape();
  return { cells, gw: w, gh: h };
}

// ========== ICONS ==========
function Icon({ name, size }) {
  const s = size || 24;
  const P = {
    forma:     <g><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9h17M3.5 14.5h17M9 3.5v17M14.5 3.5v17"/></g>,
    cores:     <g><path d="M12 21a9 9 0 1 1 9-9c0 2.5-1.7 3.5-3.5 3.5H15a2 2 0 0 0-1.5 3.3c.6.7.2 2.2-1.5 2.2z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="11" cy="7.2" r="1.2"/><circle cx="16" cy="8.5" r="1.2"/></g>,
    fio:       <g><circle cx="12" cy="12" r="8.5"/><path d="M5 9.5c4-2.5 10-2.5 14 0M5 14.5c4 2.5 10 2.5 14 0M12 3.5v17"/></g>,
    descobrir: <g><circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></g>,
    galeria:   <g><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9.5h17M8 5v-1.5M16 5v-1.5"/><circle cx="8.5" cy="14" r="1.4"/><path d="M11.5 16.5l2.5-3 3.5 4"/></g>,
    ajustes:   <g><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/></g>,
    play:      <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>,
    pause:     <g><rect x="6.5" y="5.5" width="3.6" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="13.9" y="5.5" width="3.6" height="13" rx="1" fill="currentColor" stroke="none"/></g>,
    stepb:     <g><path d="M17 5.5v13l-9-6.5z" fill="currentColor" stroke="none"/><path d="M6.5 5.5v13"/></g>,
    stepf:     <g><path d="M7 5.5v13l9-6.5z" fill="currentColor" stroke="none"/><path d="M17.5 5.5v13"/></g>,
    undo:      <g><path d="M8 6.5L4 10.5l4 4"/><path d="M4.5 10.5h9a5.5 5.5 0 0 1 0 11h-2"/></g>,
    redo:      <g><path d="M16 6.5l4 4-4 4"/><path d="M19.5 10.5h-9a5.5 5.5 0 0 0 0 11h2"/></g>,
    dado:      <g><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/></g>,
    descarregar: <g><path d="M12 4v11M7.5 11l4.5 4.5L16.5 11"/><path d="M4.5 19.5h15"/></g>,
    carregar:  <g><path d="M12 15.5v-11M7.5 9L12 4.5 16.5 9"/><path d="M4.5 19.5h15"/></g>,
    imagem:    <g><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17.5l4.5-5 3.5 4 2.5-2.8 4 3.8"/></g>,
    mais:      <path d="M12 5v14M5 12h14"/>,
    menos:     <path d="M5 12h14"/>,
    espelhoH:  <g><path d="M12 3v18" strokeDasharray="2.5 2.5"/><path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5"/></g>,
    espelhoV:  <g><path d="M3 12h18" strokeDasharray="2.5 2.5"/><path d="M7.5 8L12 3.5 16.5 8M7.5 16L12 20.5 16.5 16"/></g>,
    prego:     <g><circle cx="12" cy="7" r="3.5"/><path d="M12 10.5V20M9.5 18l2.5 2.5L14.5 18"/></g>,
    olho:      <g><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></g>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] || null}
    </svg>
  );
}

// ========== MINI PREVIEW (gallery cards) ==========
const MiniPreview = React.memo(function MiniPreview({ cells, gw, gh, colors }) {
  const data = useMemo(() => getAllCycles(cells, gw, gh), [cells, gw, gh]);
  const vb = `-1 -1 ${gw + 2} ${gh + 2}`;
  return (
    <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {data.cycles.map((c, i) => (
        <polyline key={i}
          points={c.points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={(colors && colors[i]) || COLORS[i % COLORS.length]}
          strokeWidth={Math.max(0.16, Math.min(gw, gh) * 0.03)}
          strokeLinejoin="round" />
      ))}
    </svg>
  );
});

// ========== MAIN ==========
function TearDePregos() {
  // --- shape state ---
  const [cells, setCells] = useState(() => Array.from({length: 10}, () => Array(18).fill(true)));
  const [gridW, setGridW] = useState(18);
  const [gridH, setGridH] = useState(10);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // --- ui state --- (deep link: ?tab=cores|fio|descobrir|galeria|ajustes)
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      return ['forma', 'cores', 'fio', 'descobrir', 'galeria', 'ajustes'].includes(t) ? t : 'forma';
    } catch { return 'forma'; }
  });
  const [panelOpen, setPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [marquee, setMarquee] = useState(null);
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  const [editGhost, setEditGhost] = useState(true); // show weave behind the shape editor

  // --- weave/view state ---
  const settings0 = useMemo(() => loadLS('tear.settings', {}), []);
  const [lang, setLang] = useState(settings0.lang === 'en' ? 'en' : 'pt');
  const T = STR[lang];
  const [strandMode, setStrandMode] = useState(settings0.strandMode || 'thin');
  const [bgIndex, setBgIndex] = useState(Number.isInteger(settings0.bgIndex) ? settings0.bgIndex : 0);
  const [showNails, setShowNails] = useState(!!settings0.showNails);
  const [nailSpacing, setNailSpacing] = useState(settings0.nailSpacing || 1.5);
  const [selGap, setSelGap] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [visibleCycles, setVisibleCycles] = useState({});
  const [cycleColors, setCycleColors] = useState({});
  const [cycleSecondary, setCycleSecondary] = useState({});
  const [palettePopover, setPalettePopover] = useState(null); // {i, kind}

  // --- threading (Fio) state ---
  const [threadCi, setThreadCi] = useState(0);
  const [threadT, setThreadT] = useState(0);
  const [threadPlaying, setThreadPlaying] = useState(false);
  const [threadSpeed, setThreadSpeed] = useState(3);
  const [showNailNums, setShowNailNums] = useState(settings0.showNailNums !== false);

  // --- library state ---
  const [patterns, setPatterns] = useState(() => {
    const p = loadLS('tear.patterns', null);
    if (p) return p;
    // migrate from the old Knot Maker shape library
    const old = loadLS('celtic.savedShapes', []);
    return (old || []).map(s => ({ name: s.name, gw: s.gw, gh: s.gh, cells: s.cells, colors: {}, secondary: {} }));
  });
  const [palettes, setPalettes] = useState(() => loadLS('tear.palettes', []));

  useEffect(() => { saveLS('tear.patterns', patterns); }, [patterns]);
  useEffect(() => { saveLS('tear.palettes', palettes); }, [palettes]);
  useEffect(() => {
    saveLS('tear.settings', { strandMode, bgIndex, showNails, nailSpacing, showNailNums, lang });
  }, [strandMode, bgIndex, showNails, nailSpacing, showNailNums, lang]);

  const W = gridW, H = gridH;
  const bgColor = BG_OPTIONS[bgIndex];
  const lightBg = bgIndex >= 3;

  // ---------- cycles ----------
  const { cycles, gaps, edges } = useMemo(() => getAllCycles(cells, gridW, gridH), [cells, gridW, gridH]);

  // ---------- canvas geometry ----------
  const svgW = 1000, svgH = 700;
  const cellSz = Math.min((svgW - 90) / W, (svgH - 90) / H);
  const ox = (svgW - W * cellSz) / 2, oy = (svgH - H * cellSz) / 2;
  const vbW = svgW / zoom, vbH = svgH / zoom;
  const vbX = (svgW - vbW) / 2 - panX / zoom;
  const vbY = (svgH - vbH) / 2 - panY / zoom;
  const toX = useCallback(x => ox + x * cellSz, [ox, cellSz]);
  const toY = useCallback(y => oy + y * cellSz, [oy, cellSz]);
  const gr = Math.max(4, cellSz * 0.12);
  const sw = cellSz * (strandMode === 'full' ? 0.707 : strandMode === 'string' ? 0.12 : 0.45);

  const svgRef = useRef(null);
  const wrapRef = useRef(null);

  // ---------- undo / redo ----------
  const snapshot = useCallback(() => ({ cells: cells.map(r => [...r]), gw: gridW, gh: gridH }), [cells, gridW, gridH]);
  const pushUndo = useCallback(() => {
    setUndoStack(st => [...st.slice(-59), snapshot()]);
    setRedoStack([]);
  }, [snapshot]);
  const applySnap = useCallback(snap => {
    setCells(snap.cells.map(r => [...r]));
    setGridW(snap.gw); setGridH(snap.gh);
    setSelGap(null); setShowAll(true); setVisibleCycles({});
  }, []);
  const undo = useCallback(() => {
    setUndoStack(st => {
      if (!st.length) return st;
      const prev = st[st.length - 1];
      setRedoStack(r => [...r, snapshot()]);
      applySnap(prev);
      return st.slice(0, -1);
    });
  }, [snapshot, applySnap]);
  const redo = useCallback(() => {
    setRedoStack(st => {
      if (!st.length) return st;
      const nxt = st[st.length - 1];
      setUndoStack(u => [...u, snapshot()]);
      applySnap(nxt);
      return st.slice(0, -1);
    });
  }, [snapshot, applySnap]);
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ---------- shape ops ----------
  const resetView = useCallback(() => { setZoom(1); setPanX(0); setPanY(0); }, []);
  const afterShapeChange = useCallback(() => {
    setSelGap(null); setShowAll(true); setVisibleCycles({});
  }, []);
  const loadShapeData = useCallback((shp, opts) => {
    pushUndo();
    setCells(shp.cells.map(r => [...r]));
    setGridW(shp.gw); setGridH(shp.gh);
    afterShapeChange();
    setCycleColors(opts?.colors || {});
    setCycleSecondary(opts?.secondary || {});
    if (opts?.strandMode) setStrandMode(opts.strandMode);
    resetView();
  }, [pushUndo, afterShapeChange, resetView]);
  const resizeGrid = useCallback((newW, newH) => {
    pushUndo();
    setCells(prev => Array.from({length: newH}, (_, y) =>
      Array.from({length: newW}, (_, x) =>
        y < prev.length && x < (prev[0]?.length || 0) ? prev[y][x] : false)));
    setGridW(newW); setGridH(newH);
    afterShapeChange();
  }, [pushUndo, afterShapeChange]);
  const fillAll = useCallback(v => {
    pushUndo();
    setCells(Array.from({length: gridH}, () => Array(gridW).fill(v)));
    afterShapeChange();
  }, [pushUndo, gridW, gridH, afterShapeChange]);

  const surpriseMe = useCallback(() => {
    const shp = randomShape();
    const pal = STARTER_PALETTES[Math.floor(Math.random() * STARTER_PALETTES.length)];
    const n = getAllCycles(shp.cells, shp.gw, shp.gh).cycles.length;
    const colors = {};
    for (let i = 0; i < n; i++) colors[i] = pal.colors[i % pal.colors.length];
    loadShapeData(shp, { colors });
  }, [loadShapeData]);

  // ---------- color helpers ----------
  const getCycleColor = useCallback(i => {
    if (strandMode === 'string') return "#8fa3ad";
    return cycleColors[i] || COLORS[i % COLORS.length];
  }, [cycleColors, strandMode]);
  const isCycleVisible = useCallback(i => {
    if (showAll) return visibleCycles[i] !== false;
    return visibleCycles[i] === true;
  }, [showAll, visibleCycles]);
  const toggleCycle = useCallback(i => {
    setVisibleCycles(prev => ({ ...prev, [i]: !(showAll ? prev[i] !== false : prev[i] === true) }));
  }, [showAll]);
  const applyPalette = useCallback(pal => {
    const colors = {};
    for (let i = 0; i < cycles.length; i++) colors[i] = pal.colors[i % pal.colors.length];
    setCycleColors(colors);
    setCycleSecondary({});
  }, [cycles.length]);
  const saveCurrentPalette = useCallback(() => {
    const name = window.prompt(T.promptPalette);
    if (!name?.trim()) return;
    const cols = [];
    for (let i = 0; i < Math.min(cycles.length, 8); i++) {
      const c = getCycleColor(i);
      if (!cols.includes(c)) cols.push(c);
    }
    if (!cols.length) return;
    setPalettes(p => [...p.filter(x => x.name !== name.trim()), { name: name.trim(), colors: cols }]);
  }, [cycles.length, getCycleColor, T]);

  // close palette popover on outside tap
  useEffect(() => {
    if (!palettePopover) return;
    const close = e => {
      if (!e.target.closest?.("[data-pop]") && !e.target.closest?.("[data-pop-trigger]")) setPalettePopover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [palettePopover]);

  // ---------- stats ----------
  const stringStats = useMemo(() => {
    const stats = [];
    let totalLen = 0;
    for (let i = 0; i < cycles.length; i++) {
      const pts = cycles[i].points;
      if (!pts || pts.length < 2) { stats.push(null); continue; }
      const len = arcLen(pts);
      const c1 = getCycleColor(i);
      const c2 = cycleSecondary[i] || null;
      const half = len * 0.5;
      stats.push({ len, c1, c2, firstLen: c2 ? half : len, secondLen: c2 ? half : 0 });
      totalLen += len;
    }
    const byColor = {};
    for (const s of stats) {
      if (!s) continue;
      byColor[s.c1] = (byColor[s.c1] || 0) + s.firstLen;
      if (s.c2) byColor[s.c2] = (byColor[s.c2] || 0) + s.secondLen;
    }
    return { perCycle: stats, totalLen, byColor };
  }, [cycles, getCycleColor, cycleSecondary]);

  const cycleBalance = useMemo(() => {
    const { perCycle, totalLen } = stringStats;
    if (cycles.length === 0 || totalLen <= 0) return null;
    const pcts = cycles.map((_, i) => {
      const s = perCycle[i];
      return s && s.len ? (s.len / totalLen) * 100 : 0;
    });
    const minP = Math.min(...pcts), maxP = Math.max(...pcts);
    const spread = maxP - minP;
    const fair = spread <= 12;
    let rating = 'red';
    if (cycles.length <= 2 || fair) rating = 'green';
    else if (spread <= 25) rating = 'orange';
    const ratingColor = rating === 'green' ? '#7da06a' : rating === 'orange' ? '#d9a440' : '#c8502e';
    const summary = fair
      ? T.balanced((100 / cycles.length).toFixed(0))
      : T.unbalanced(minP.toFixed(0), maxP.toFixed(0));
    return { ratingColor, summary };
  }, [stringStats, cycles, T]);

  // ---------- weave render machinery (engine, adapted) ----------
  const cornerGapSet = useMemo(() => {
    const set = new Set();
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy-1][vx-1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy-1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx-1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br !== 1) continue;
      let g1, g2;
      if (br)      { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; }
      else if (bl) { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; }
      else if (tr) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; }
      else         { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; }
      const gi1 = pointToGapIdx(g1.x, g1.y, gaps);
      const gi2 = pointToGapIdx(g2.x, g2.y, gaps);
      if (gi1 >= 0) set.add(gi1);
      if (gi2 >= 0) set.add(gi2);
    }
    return set;
  }, [cells, W, H, gaps]);

  const nailPositions = useMemo(() => {
    const nails = [];
    for (let i = 0; i < gaps.length; i++)
      if (!cornerGapSet.has(i)) nails.push({ x: gaps[i].x, y: gaps[i].y, type: 'edge' });
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy-1][vx-1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy-1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx-1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br === 1) nails.push({ x: vx, y: vy, type: 'corner' });
    }
    return nails;
  }, [cells, W, H, gaps, cornerGapSet]);

  function getCoveredCrossings(pts) {
    const bsSet = new Set(), fsSet = new Set();
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg], p2 = pts[seg + 1];
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      if (sdx === 0 || sdy === 0) continue;
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      const isBS = sdx === sdy;
      if (isBS) {
        const kVal = p1.y - p1.x;
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const cx = (mVal - kVal) / 2, cy = (mVal + kVal) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01)
            bsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      } else {
        const mVal = p1.y + p1.x;
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const cx = (mVal - kVal2) / 2, cy = (mVal + kVal2) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01)
            fsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      }
    }
    return { bsSet, fsSet };
  }

  function renderStrandSVG(pts, color, crossingMap) {
    const elements = [];
    const lineW = sw;
    const gap = strandMode === 'string' ? cellSz * 0.16 : sw / 2;
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg], p2 = pts[seg + 1];
      const sx1 = toX(p1.x), sy1 = toY(p1.y);
      const sx2 = toX(p2.x), sy2 = toY(p2.y);
      const ddx = sx2 - sx1, ddy = sy2 - sy1;
      const len = Math.hypot(ddx, ddy);
      if (len < 0.5) continue;
      const ux = ddx / len, uy = ddy / len;
      const sdx = Math.sign(p2.x - p1.x), sdy = Math.sign(p2.y - p1.y);
      const p1Edge = isOnBoundary(p1.x, p1.y, cells, W, H);
      const p2Edge = isOnBoundary(p2.x, p2.y, cells, W, H);
      const p1gi = pointToGapIdx(p1.x, p1.y, gaps);
      const p2gi = pointToGapIdx(p2.x, p2.y, gaps);
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (p1gi >= 0 && cornerGapSet.has(p1gi) && p2gi >= 0 && cornerGapSet.has(p2gi) && segLen < 1.1) continue;
      if (sdx === 0 || sdy === 0) {
        elements.push({ type: 'strand', x1: sx1, y1: sy1, x2: sx2, y2: sy2, color, w: lineW, z: 2, edgeStart: p1Edge, edgeEnd: p2Edge });
        continue;
      }
      const isBS = sdx === sdy;
      const cuts = [];
      const minX = Math.min(p1.x, p2.x), maxX = Math.max(p1.x, p2.x);
      if (isBS) {
        const kVal = p1.y - p1.x;
        const ki = Math.round(kVal - 0.5);
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const ix = (mVal - kVal) / 2, iy = (mVal + kVal) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 1) {
              if (!crossingMap || crossingMap.forBS.has(`${ix.toFixed(2)},${iy.toFixed(2)}`))
                cuts.push({ sx: toX(ix), sy: toY(iy) });
            }
          }
        }
      } else {
        const mVal = p1.y + p1.x;
        const mi = Math.round(mVal - 0.5);
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const ix = (mVal - kVal2) / 2, iy = (mVal + kVal2) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 0) {
              if (!crossingMap || crossingMap.forFS.has(`${ix.toFixed(2)},${iy.toFixed(2)}`))
                cuts.push({ sx: toX(ix), sy: toY(iy) });
            }
          }
        }
      }
      cuts.sort((a, b) => ((a.sx - sx1) * ux + (a.sy - sy1) * uy) - ((b.sx - sx1) * ux + (b.sy - sy1) * uy));
      let cx = sx1, cy = sy1;
      let isFirst = true;
      for (const cut of cuts) {
        const gsx = cut.sx - ux * gap, gsy = cut.sy - uy * gap;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) elements.push({ type: 'strand', x1: cx, y1: cy, x2: gsx, y2: gsy, color, w: lineW, z: 2, edgeStart: isFirst && p1Edge, edgeEnd: false });
        cx = cut.sx + ux * gap; cy = cut.sy + uy * gap;
        isFirst = false;
      }
      const projEnd = (sx2 - cx) * ux + (sy2 - cy) * uy;
      if (projEnd > 0.5) elements.push({ type: 'strand', x1: cx, y1: cy, x2: sx2, y2: sy2, color, w: lineW, z: 2, edgeStart: isFirst && p1Edge, edgeEnd: p2Edge });
    }
    return elements;
  }

  // ---------- threading derived ----------
  const threadActive = activeTab === 'fio' && cycles.length > 0;
  const safeCi = Math.min(threadCi, Math.max(0, cycles.length - 1));
  const threadPts = threadActive ? cycles[safeCi]?.points : null;
  const threadCums = useMemo(() => (threadPts && threadPts.length > 1 ? cumLens(threadPts) : null), [threadPts]);
  const threadTotal = threadCums ? threadCums[threadCums.length - 1] : 0;
  const threadDone = threadTotal > 0 && threadT >= threadTotal - 1e-6;

  useEffect(() => { // reset when cycle selection or shape changes
    setThreadT(0); setThreadPlaying(false);
  }, [safeCi, cycles]);

  useEffect(() => {
    if (!threadPlaying || !threadTotal) return;
    let raf, last = performance.now();
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setThreadT(t => {
        const nt = t + threadSpeed * dt;
        if (nt >= threadTotal) { setThreadPlaying(false); return threadTotal; }
        return nt;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [threadPlaying, threadSpeed, threadTotal]);

  const threadStep = useCallback(dir => {
    if (!threadCums) return;
    setThreadPlaying(false);
    setThreadT(t => {
      if (dir > 0) {
        for (const c of threadCums) if (c > t + 1e-6) return Math.min(c, threadTotal);
        return threadTotal;
      }
      for (let i = threadCums.length - 1; i >= 0; i--)
        if (threadCums[i] < t - 1e-6) return threadCums[i];
      return 0;
    });
  }, [threadCums, threadTotal]);

  const nailsVisited = useMemo(() => {
    if (!threadCums) return 0;
    let n = 0;
    for (const c of threadCums) if (c <= threadT + 1e-6) n++;
    return Math.min(n, threadCums.length - 1);
  }, [threadCums, threadT]);

  // ---------- rendered strands ----------
  const crossingMap = useMemo(() => {
    try {
      const allBS = new Set(), allFS = new Set();
      for (let i = 0; i < cycles.length; i++) {
        if (!isCycleVisible(i)) continue;
        const pts = cycles[i].points;
        if (!pts || pts.length < 2) continue;
        const { bsSet, fsSet } = getCoveredCrossings(pts);
        for (const k of bsSet) allBS.add(k);
        for (const k of fsSet) allFS.add(k);
      }
      return { forBS: allFS, forFS: allBS };
    } catch (e) { console.error(e); return { forBS: new Set(), forFS: new Set() }; }
  }, [cycles, isCycleVisible, cells, W, H]);

  const renderElements = useMemo(() => {
    try {
      const els = [];
      for (let i = 0; i < cycles.length; i++) {
        if (!isCycleVisible(i)) continue;
        if (threadActive && i === safeCi) continue; // drawn separately (partial)
        const pts = cycles[i].points;
        if (!pts || pts.length < 2) continue;
        const c1 = getCycleColor(i);
        const c2 = strandMode === 'string' ? null : cycleSecondary[i];
        if (c2) {
          const splitArc = arcLen(pts) * 0.5;
          const [first, second] = splitPtsAtArc(pts, splitArc);
          if (first.length >= 2) els.push(...renderStrandSVG(first, c1, crossingMap));
          if (second.length >= 2) els.push(...renderStrandSVG(second, c2, crossingMap));
        } else {
          els.push(...renderStrandSVG(pts, c1, crossingMap));
        }
      }
      els.sort((a, b) => a.z - b.z);
      return els;
    } catch (e) { console.error('RENDER ERROR:', e); return []; }
  }, [cycles, isCycleVisible, cells, W, H, cellSz, sw, cycleColors, cycleSecondary, strandMode, crossingMap, threadActive, safeCi]);

  const threadLaid = useMemo(() => {
    if (!threadActive || !threadPts || threadPts.length < 2) return null;
    const [laid] = splitPtsAtArc(threadPts, threadT);
    return laid;
  }, [threadActive, threadPts, threadT]);

  const threadElements = useMemo(() => {
    if (!threadLaid || threadLaid.length < 2) return [];
    try { return renderStrandSVG(threadLaid, getCycleColor(safeCi), crossingMap); }
    catch (e) { return []; }
  }, [threadLaid, safeCi, crossingMap, cellSz, sw, strandMode, cycleColors]);

  // corner arcs
  const cornerArcs = useMemo(() => {
    const arcs = [];
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy-1][vx-1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy-1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx-1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br !== 1) continue;
      let g1, g2, sweep;
      if (br)      { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; sweep = 0; }
      else if (bl) { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy + 0.5 }; sweep = 1; }
      else if (tr) { g1 = { x: vx + 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; sweep = 1; }
      else         { g1 = { x: vx - 0.5, y: vy }; g2 = { x: vx, y: vy - 0.5 }; sweep = 0; }
      const gi1 = pointToGapIdx(g1.x, g1.y, gaps);
      const gi2 = pointToGapIdx(g2.x, g2.y, gaps);
      const ci1 = gi1 >= 0 ? cycles.findIndex(c => c.gaps.has(gi1)) : -1;
      const ci2 = gi2 >= 0 ? cycles.findIndex(c => c.gaps.has(gi2)) : -1;
      const ci = ci1 >= 0 ? ci1 : ci2;
      if (ci < 0 || !isCycleVisible(ci)) continue;
      if (threadActive && ci === safeCi && !threadDone) continue; // arc appears when the fio completes
      const color = getCycleColor(ci);
      const dx = toX(g2.x) - toX(g1.x), dy = toY(g2.y) - toY(g1.y);
      const r = Math.hypot(dx, dy) / 2;
      arcs.push({ sx1: toX(g1.x), sy1: toY(g1.y), sx2: toX(g2.x), sy2: toY(g2.y), r, sweep, color });
    }
    return arcs;
  }, [cells, W, H, gaps, cycles, isCycleVisible, getCycleColor, toX, toY, threadActive, safeCi, threadDone]);

  const boundaryEdges = useMemo(() => edges.map(e => (
    e.type === 'h'
      ? { x1: toX(e.x0), y1: toY(e.y), x2: toX(e.x1), y2: toY(e.y) }
      : { x1: toX(e.x), y1: toY(e.y0), x2: toX(e.x), y2: toY(e.y1) }
  )), [edges, toX, toY]);

  // edge-run labels (nail counts along each straight border)
  const edgeRuns = useMemo(() => {
    const isOn = (x, y) => x >= 0 && y >= 0 && x < gridW && y < gridH && !!cells[y]?.[x];
    const runs = [];
    for (let y = 0; y <= gridH; y++) {
      let s = null, filledAbove = false;
      for (let x = 0; x <= gridW; x++) {
        const a = isOn(x, y - 1), b = isOn(x, y);
        const isEdge = x < gridW && a !== b;
        if (isEdge) { if (s === null) { s = x; filledAbove = a; } }
        else if (s !== null) { runs.push({ orient: "h", y, x0: s, x1: x, len: x - s, filledAbove }); s = null; }
      }
    }
    for (let x = 0; x <= gridW; x++) {
      let s = null, filledLeft = false;
      for (let y = 0; y <= gridH; y++) {
        const a = isOn(x - 1, y), b = isOn(x, y);
        const isEdge = y < gridH && a !== b;
        if (isEdge) { if (s === null) { s = y; filledLeft = a; } }
        else if (s !== null) { runs.push({ orient: "v", x, y0: s, y1: y, len: y - s, filledLeft }); s = null; }
      }
    }
    return runs;
  }, [cells, gridW, gridH]);

  const gapDots = useMemo(() => gaps.map((g, i) => ({ i, x: toX(g.x), y: toY(g.y) })), [gaps, toX, toY]);

  // ---------- pointer interaction on canvas ----------
  const formaMode = activeTab === 'forma';
  const clientToSvg = useCallback((clientX, clientY) => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const scale = Math.min(rect.width / vbW, rect.height / vbH);
    const offX = (rect.width - vbW * scale) / 2;
    const offY = (rect.height - vbH * scale) / 2;
    return {
      x: (clientX - rect.left - offX) / scale + vbX,
      y: (clientY - rect.top - offY) / scale + vbY,
    };
  }, [vbW, vbH, vbX, vbY]);
  const clientToCell = useCallback((clientX, clientY) => {
    const p = clientToSvg(clientX, clientY);
    if (!p) return null;
    return { x: Math.floor((p.x - ox) / cellSz), y: Math.floor((p.y - oy) / cellSz) };
  }, [clientToSvg, ox, oy, cellSz]);

  const dragRef = useRef(null);
  const cellsRef = useRef(cells); cellsRef.current = cells;
  const marqueeRef = useRef(marquee); marqueeRef.current = marquee;

  const commitMarquee = useCallback(() => {
    const m = marqueeRef.current;
    if (!m) return;
    pushUndo();
    const xa = Math.min(m.x0, m.x1), xb = Math.max(m.x0, m.x1);
    const ya = Math.min(m.y0, m.y1), yb = Math.max(m.y0, m.y1);
    setCells(prev => prev.map((row, y) => row.map((c, x) => {
      let inside = x >= xa && x <= xb && y >= ya && y <= yb;
      if (!inside && mirrorH) inside = (gridW - 1 - x) >= xa && (gridW - 1 - x) <= xb && y >= ya && y <= yb;
      if (!inside && mirrorV) inside = x >= xa && x <= xb && (gridH - 1 - y) >= ya && (gridH - 1 - y) <= yb;
      if (!inside && mirrorH && mirrorV) inside = (gridW - 1 - x) >= xa && (gridW - 1 - x) <= xb && (gridH - 1 - y) >= ya && (gridH - 1 - y) <= yb;
      return inside ? m.val : c;
    })));
    setSelGap(null); setShowAll(true); setVisibleCycles({});
    setMarquee(null);
  }, [pushUndo, mirrorH, mirrorV, gridW, gridH]);

  const onSvgPointerDown = useCallback(e => {
    if (e.pointerType === "touch" && e.isPrimary === false) { setMarquee(null); dragRef.current = null; return; }
    e.preventDefault();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    if (formaMode) {
      const c = clientToCell(e.clientX, e.clientY);
      if (!c || c.x < 0 || c.x >= gridW || c.y < 0 || c.y >= gridH) return;
      const val = !cellsRef.current[c.y][c.x];
      setMarquee({ x0: c.x, y0: c.y, x1: c.x, y1: c.y, val });
    } else {
      dragRef.current = { sx: e.clientX, sy: e.clientY, px: panX, py: panY, moved: false };
    }
  }, [formaMode, clientToCell, gridW, gridH, panX, panY]);

  const onSvgPointerMove = useCallback(e => {
    if (formaMode) {
      if (!marqueeRef.current) return;
      const c = clientToCell(e.clientX, e.clientY);
      if (!c) return;
      const x = Math.max(0, Math.min(gridW - 1, c.x));
      const y = Math.max(0, Math.min(gridH - 1, c.y));
      const m = marqueeRef.current;
      if (x === m.x1 && y === m.y1) return;
      setMarquee({ ...m, x1: x, y1: y });
    } else if (dragRef.current) {
      const d = dragRef.current;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (!d.moved && Math.hypot(dx, dy) < 7) return;
      d.moved = true;
      setPanX(d.px + dx); setPanY(d.py + dy);
    }
  }, [formaMode, clientToCell, gridW, gridH]);

  const clickGapAt = useCallback((clientX, clientY) => {
    const p = clientToSvg(clientX, clientY);
    if (!p) return;
    let best = -1, bestD = Infinity;
    for (const g of gapDots) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < bestD) { bestD = d; best = g.i; }
    }
    if (best < 0 || bestD > Math.max(18, gr * 3)) return;
    if (selGap === best) { setSelGap(null); setShowAll(true); setVisibleCycles({}); return; }
    const ci = cycles.findIndex(c => c.gaps.has(best));
    if (ci < 0) return;
    if (activeTab === 'fio') { setThreadCi(ci); return; }
    setSelGap(best);
    if (showAll) setShowAll(false);
    setVisibleCycles(prev => ({ ...prev, [ci]: true }));
  }, [clientToSvg, gapDots, gr, cycles, showAll, selGap, activeTab]);

  const onSvgPointerUp = useCallback(e => {
    if (formaMode) { commitMarquee(); return; }
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) clickGapAt(e.clientX, e.clientY);
  }, [formaMode, commitMarquee, clickGapAt]);

  // two-finger pinch zoom + pan (all modes)
  const pinchRef = useRef(null);
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const panRef = useRef({ x: panX, y: panY }); panRef.current = { x: panX, y: panY };
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const capture = e => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      setMarquee(null); dragRef.current = null;
      const t0 = e.touches[0], t1 = e.touches[1];
      pinchRef.current = {
        d: Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY),
        z: zoomRef.current,
        mx: (t0.clientX + t1.clientX) / 2, my: (t0.clientY + t1.clientY) / 2,
        px: panRef.current.x, py: panRef.current.y,
      };
    };
    const onMove = e => {
      if (e.touches.length === 2) {
        if (!pinchRef.current) capture(e);
        if (!pinchRef.current) return;
        e.preventDefault();
        const t0 = e.touches[0], t1 = e.touches[1];
        const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const mx = (t0.clientX + t1.clientX) / 2, my = (t0.clientY + t1.clientY) / 2;
        const scale = d / pinchRef.current.d;
        setZoom(Math.max(0.15, Math.min(6, pinchRef.current.z * scale)));
        setPanX(pinchRef.current.px + (mx - pinchRef.current.mx));
        setPanY(pinchRef.current.py + (my - pinchRef.current.my));
      }
    };
    const onEnd = e => { if (e.touches.length < 2) pinchRef.current = null; };
    el.addEventListener("touchstart", capture, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", capture);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);
  const onWheel = useCallback(e => {
    setZoom(z => Math.max(0.15, Math.min(6, z * (e.deltaY > 0 ? 0.9 : 1.11))));
  }, []);

  // ---------- discovery heatmap ----------
  const HM_MIN = 2, HM_MAX = 18;
  const heatmap = useMemo(() => {
    if (activeTab !== 'descobrir') return null;
    const rows = [];
    for (let h = HM_MIN; h <= HM_MAX; h++) {
      const row = [];
      for (let w = HM_MIN; w <= HM_MAX; w++) {
        const cl = Array.from({length: h}, () => Array(w).fill(true));
        row.push(getAllCycles(cl, w, h).cycles.length);
      }
      rows.push(row);
    }
    return rows;
  }, [activeTab]);
  const fioCellColor = n => n === 1 ? '#d9a440' : n === 2 ? '#7da06a' : n === 3 ? '#5a93b0' : n === 4 ? '#9a6ab0' : n <= 6 ? '#6d5f49' : '#473c2d';
  const isFullRect = useMemo(() => cells.every(r => r.every(Boolean)), [cells]);

  // ---------- gallery ----------
  const savePattern = useCallback(() => {
    const name = window.prompt(T.promptPattern);
    if (!name?.trim()) return;
    const snap = {
      name: name.trim(), gw: gridW, gh: gridH,
      cells: cells.map(r => [...r]),
      colors: { ...cycleColors }, secondary: { ...cycleSecondary },
      strandMode,
    };
    setPatterns(p => [...p.filter(s => s.name !== snap.name), snap]);
  }, [cells, gridW, gridH, cycleColors, cycleSecondary, strandMode, T]);
  const deletePattern = useCallback(name => {
    if (!window.confirm(T.confirmDel(name))) return;
    setPatterns(p => p.filter(s => s.name !== name));
  }, [T]);
  const importFileRef = useRef(null);
  const onImportFile = useCallback(e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("JSON?");
        const valid = data.filter(s => s && typeof s.name === "string" && Array.isArray(s.cells) && Number.isInteger(s.gw) && Number.isInteger(s.gh));
        setPatterns(prev => {
          const merged = [...prev];
          for (const s of valid) {
            const i = merged.findIndex(m => m.name === s.name);
            const entry = { name: s.name, gw: s.gw, gh: s.gh, cells: s.cells, colors: s.colors || {}, secondary: s.secondary || {}, strandMode: s.strandMode };
            if (i >= 0) merged[i] = entry; else merged.push(entry);
          }
          return merged;
        });
      } catch (err) { window.alert(T.importErr(err.message)); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [T]);
  const exportPatterns = useCallback(() => {
    const blob = new Blob([JSON.stringify(patterns, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tear-padroes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [patterns]);

  const exportPNG = useCallback(() => {
    const src = svgRef.current;
    if (!src) return;
    const clone = src.cloneNode(true);
    clone.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    clone.setAttribute('width', svgW * 2);
    clone.setAttribute('height', svgH * 2);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', svgW); rect.setAttribute('height', svgH);
    rect.setAttribute('fill', bgColor);
    clone.insertBefore(rect, clone.firstChild);
    const xml = new XMLSerializer().serializeToString(clone);
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = svgW * 2; cv.height = svgH * 2;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      cv.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'padrao-tear.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = svgUrl;
  }, [bgColor, svgW, svgH]);

  // ---------- tab handling ----------
  const TABS = [
    { id: 'forma',     lbl: T.tabForma },
    { id: 'cores',     lbl: T.tabCores },
    { id: 'fio',       lbl: T.tabFio },
    { id: 'descobrir', lbl: T.tabDescobrir },
    { id: 'galeria',   lbl: T.tabGaleria },
    { id: 'ajustes',   lbl: T.tabAjustes },
  ];
  const onTab = useCallback(id => {
    if (id === activeTab) { setPanelOpen(o => !o); return; }
    setActiveTab(id);
    setPanelOpen(true);
    if (id === 'fio') { setThreadT(0); setThreadPlaying(false); }
  }, [activeTab]);

  const manyCycles = cycles.length > 40;
  const totalCm = stringStats.totalLen * nailSpacing;

  // ============================================================
  // RENDER
  // ============================================================

  // ----- shape editor overlay (Forma mode) — bold, like the classic editor -----
  const formaOverlay = formaMode && (
    <g>
      {/* dim everything behind the editor so the board reads clearly */}
      <rect x={vbX - 50} y={vbY - 50} width={vbW + 100} height={vbH + 100}
        fill={lightBg ? "rgba(243,234,212,0.62)" : "rgba(10,8,4,0.62)"} />
      {cells.map((row, y) => row.map((on, x) => (
        <rect key={`c${x},${y}`}
          x={toX(x)} y={toY(y)} width={cellSz} height={cellSz}
          fill={on ? (editGhost ? "rgba(42,74,58,0.55)" : "#2a4a3a") : "#14181d"}
          stroke="#3a444f" strokeWidth={0.8} />
      )))}
      <rect x={toX(0)} y={toY(0)} width={W * cellSz} height={H * cellSz}
        fill="none" stroke="#5a93b0" strokeWidth={1.6} />
      {boundaryEdges.map((e, i) => (
        <line key={`fb${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
          stroke="#d9a440" strokeWidth={3} strokeLinecap="round" />
      ))}
      {edgeRuns.map((r, i) => {
        const fs = Math.max(11, Math.min(21, cellSz * 0.46));
        const off = Math.max(12, cellSz * 0.42);
        let x, y;
        if (r.orient === "h") {
          x = toX((r.x0 + r.x1) / 2);
          y = toY(r.y) + (r.filledAbove ? off : -off);
        } else {
          x = toX(r.x) + (r.filledLeft ? off : -off);
          y = toY((r.y0 + r.y1) / 2);
        }
        return (
          <text key={`er${i}`} x={x} y={y} fontSize={fs} fontWeight="800"
            fill="#ecc87e" stroke="#161007" strokeWidth={fs * 0.22}
            paintOrder="stroke" textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Atkinson Hyperlegible', sans-serif" style={{ pointerEvents: "none" }}>
            {r.len}
          </text>
        );
      })}
      {marquee && (() => {
        const xa = Math.min(marquee.x0, marquee.x1), xb = Math.max(marquee.x0, marquee.x1);
        const ya = Math.min(marquee.y0, marquee.y1), yb = Math.max(marquee.y0, marquee.y1);
        const rects = [[xa, ya, xb, yb]];
        if (mirrorH) rects.push([gridW - 1 - xb, ya, gridW - 1 - xa, yb]);
        if (mirrorV) rects.push([xa, gridH - 1 - yb, xb, gridH - 1 - ya]);
        if (mirrorH && mirrorV) rects.push([gridW - 1 - xb, gridH - 1 - yb, gridW - 1 - xa, gridH - 1 - ya]);
        return rects.map(([a, b, c, d], k) => (
          <rect key={`mq${k}`}
            x={toX(a)} y={toY(b)} width={(c - a + 1) * cellSz} height={(d - b + 1) * cellSz}
            fill={marquee.val ? "rgba(125,160,106,0.45)" : "rgba(200,80,46,0.4)"}
            stroke={marquee.val ? "#9fcf8a" : "#e87a55"} strokeWidth={2}
            opacity={k === 0 ? 1 : 0.6} />
        ));
      })()}
    </g>
  );

  const threadOverlay = threadActive && threadPts && threadPts.length > 1 && (
    <g>
      {/* ghost of the remaining path */}
      <polyline
        points={threadPts.map(p => `${toX(p.x)},${toY(p.y)}`).join(' ')}
        fill="none" stroke={getCycleColor(safeCi)} strokeOpacity={0.16}
        strokeWidth={Math.max(1.5, sw * 0.4)}
        strokeDasharray={`${cellSz * 0.2} ${cellSz * 0.22}`} />
      {/* nail visit numbers */}
      {showNailNums && threadPts.length - 1 <= 220 && threadPts.slice(0, -1).map((p, i) => {
        const visited = threadCums && threadCums[i] <= threadT + 1e-6;
        const fs = Math.max(8, gr * 1.5);
        return (
          <text key={`nn${i}`} x={toX(p.x)} y={toY(p.y) - gr * 1.6}
            fontSize={fs} fontWeight="800" textAnchor="middle"
            fill={visited ? "#ecc87e" : (lightBg ? "#777" : "#5d5142")}
            stroke={lightBg ? "#fff" : "#161007"} strokeWidth={fs * 0.18} paintOrder="stroke"
            fontFamily="'Atkinson Hyperlegible', sans-serif" style={{ pointerEvents: "none" }}>
            {i + 1}
          </text>
        );
      })}
      {/* start marker */}
      <circle cx={toX(threadPts[0].x)} cy={toY(threadPts[0].y)} r={gr * 1.9}
        fill="none" stroke="#ecc87e" strokeWidth={2} strokeDasharray="4 3" />
      {/* needle */}
      {threadLaid && threadLaid.length > 0 && !threadDone && (() => {
        const tip = threadLaid[threadLaid.length - 1];
        return (
          <g>
            <circle className="needle-halo" cx={toX(tip.x)} cy={toY(tip.y)} r={Math.max(9, sw * 1.5)}
              fill="none" stroke="#ecc87e" strokeWidth={2.5} />
            <circle cx={toX(tip.x)} cy={toY(tip.y)} r={Math.max(4, sw * 0.55)}
              fill="#fff6dd" stroke="#d9a440" strokeWidth={1.5} />
          </g>
        );
      })()}
    </g>
  );

  const canvasEl = (
    <div className="canvas-area" ref={wrapRef} style={{ background: bgColor }} onWheel={onWheel}>
      <svg ref={svgRef} className="main-svg"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} preserveAspectRatio="xMidYMid meet"
        onPointerDown={onSvgPointerDown} onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp} onPointerCancel={onSvgPointerUp}>
        {boundaryEdges.map((e, i) => (
          <line key={`be${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={lightBg ? "rgba(0,0,0,0.22)" : "rgba(241,230,205,0.13)"} strokeWidth={1.4} />
        ))}
        {renderElements.map((el, i) => (
          <line key={i} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2}
            stroke={el.color} strokeWidth={el.w} strokeLinecap="butt" />
        ))}
        {threadElements.map((el, i) => (
          <line key={`t${i}`} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2}
            stroke={el.color} strokeWidth={el.w} strokeLinecap="butt" />
        ))}
        {cornerArcs.map((arc, i) => (
          <path key={`ca${i}`} d={`M${arc.sx1},${arc.sy1} A${arc.r},${arc.r} 0 0,${arc.sweep} ${arc.sx2},${arc.sy2}`}
            fill="none" stroke={arc.color} strokeWidth={sw} strokeLinecap="butt" />
        ))}
        {renderElements.concat(threadElements).filter(el => el.type === 'strand' && (el.edgeStart || el.edgeEnd)).map((el, i) => {
          const r = el.w / 2;
          return (
            <g key={`cap${i}`}>
              {el.edgeStart && <circle cx={el.x1} cy={el.y1} r={r} fill={el.color} />}
              {el.edgeEnd && <circle cx={el.x2} cy={el.y2} r={r} fill={el.color} />}
            </g>
          );
        })}
        {!formaMode && gapDots.map(g => {
          const sel = selGap === g.i;
          const ci = cycles.findIndex(c => c.gaps.has(g.i));
          const vis = ci >= 0 && isCycleVisible(ci);
          const isThreadSel = threadActive && ci === safeCi;
          const col = vis && ci >= 0 ? getCycleColor(ci) : (lightBg ? "#00000030" : "#f1e6cd28");
          return (
            <g key={`g${g.i}`}>
              <circle cx={g.x} cy={g.y} r={sel || isThreadSel ? gr * 1.05 : gr * 0.55}
                fill={col} opacity={vis || sel ? 0.95 : 0.4} style={{ pointerEvents: "none" }} />
              {sel && <circle cx={g.x} cy={g.y} r={gr * 1.9} fill="none" stroke="#ecc87e" strokeWidth={1.4} opacity={0.6} style={{ pointerEvents: "none" }} />}
            </g>
          );
        })}
        {showNails && nailPositions.map((n, i) => (
          <circle key={`nail${i}`} cx={toX(n.x)} cy={toY(n.y)} r={3.4}
            fill={n.type === 'corner' ? "#c8502e" : "#d9a440"}
            stroke={lightBg ? "#00000060" : "#00000090"} strokeWidth={0.8}
            style={{ pointerEvents: "none" }} />
        ))}
        {threadOverlay}
        {formaOverlay}
      </svg>
      <div className="canvas-vignette" />

      <div className="fab-strip">
        <button className="fab bg-swatch" title={T.changeBg}
          onClick={() => setBgIndex(i => (i + 1) % BG_OPTIONS.length)}>
          <i style={{ background: BG_OPTIONS[(bgIndex + 1) % BG_OPTIONS.length] }} />
        </button>
        <button className="fab fit" onClick={resetView}>{T.fit}</button>
        <button className="fab" onClick={() => setZoom(z => Math.min(6, +(z * 1.3).toFixed(2)))}><Icon name="mais" size={20} /></button>
        <button className="fab" onClick={() => setZoom(z => Math.max(0.15, +(z / 1.3).toFixed(2)))}><Icon name="menos" size={20} /></button>
        {formaMode && (
          <button className="fab" style={{ color: editGhost ? 'var(--brass-soft)' : 'var(--faint)' }}
            title={T.showWeave} onClick={() => setEditGhost(v => !v)}>
            <Icon name="olho" size={20} />
          </button>
        )}
      </div>

      {formaMode && (
        <div className="canvas-badge">
          <span className="dot" />
          {T.badge}
        </div>
      )}
      {threadActive && threadPts && threadCums && (
        <div className="thread-hud">
          <span className="th-stat">{T.nail} <b>{Math.max(1, nailsVisited)}</b> {T.of} {threadCums.length - 1}</span>
          <span className="thread-bar"><i style={{ width: `${threadTotal ? (threadT / threadTotal) * 100 : 0}%` }} /></span>
          <span className="th-stat"><b>{fmtLen(threadT * nailSpacing)}</b> {T.of} {fmtLen(threadTotal * nailSpacing)}</span>
        </div>
      )}
    </div>
  );

  // ----- panel content per tab -----
  let panelTitle = "", panelHint = "", panelBody = null;

  if (activeTab === 'forma') {
    panelTitle = T.tabForma;
    panelHint = `${gridW}×${gridH}`;
    panelBody = (
      <>
        <div className="group">
          <div className="group-lbl">{T.gridSize}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)" }}>{lang === 'en' ? 'W' : 'L'}</span>
              <div className="stepper">
                <button onClick={() => gridW > 2 && resizeGrid(gridW - 1, gridH)}>−</button>
                <span className="stepper-val">{gridW}</span>
                <button onClick={() => gridW < 60 && resizeGrid(gridW + 1, gridH)}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)" }}>{lang === 'en' ? 'H' : 'A'}</span>
              <div className="stepper">
                <button onClick={() => gridH > 2 && resizeGrid(gridW, gridH - 1)}>−</button>
                <span className="stepper-val">{gridH}</span>
                <button onClick={() => gridH < 60 && resizeGrid(gridW, gridH + 1)}>+</button>
              </div>
            </div>
          </div>
          <div className="btn-row">
            <button className="btn sm grow" onClick={() => fillAll(true)}>{T.fill}</button>
            <button className="btn sm grow" onClick={() => fillAll(false)}>{T.clear}</button>
          </div>
        </div>

        <div className="group">
          <div className="group-lbl">{T.draw}</div>
          <div className="btn-row">
            <button className={`btn sm grow ${mirrorH ? 'primary' : ''}`} onClick={() => setMirrorH(v => !v)}>
              <Icon name="espelhoH" size={19} /> {T.mirrorH}
            </button>
            <button className={`btn sm grow ${mirrorV ? 'primary' : ''}`} onClick={() => setMirrorV(v => !v)}>
              <Icon name="espelhoV" size={19} /> {T.mirrorV}
            </button>
          </div>
          <div className="btn-row">
            <button className="btn sm grow" disabled={!undoStack.length} onClick={undo}><Icon name="undo" size={18} /> {T.undoB}</button>
            <button className="btn sm grow" disabled={!redoStack.length} onClick={redo}><Icon name="redo" size={18} /> {T.redoB}</button>
          </div>
          <button className={`toggle ${editGhost ? 'on' : ''}`} onClick={() => setEditGhost(v => !v)}>
            <span className="tg-lbl">{T.showWeave}</span>
            <span className="tg-pill" />
          </button>
        </div>

        <div className="group">
          <div className="group-lbl">{T.presets}</div>
          <div className="chip-row">
            {[['retangulo', T.pRect], ['L', T.pL], ['escada', T.pStairs], ['cruz', T.pCross], ['moldura', T.pFrame]].map(([id, lbl]) => (
              <button key={id} className="chip" onClick={() => {
                const s = makePreset(id, gridW, gridH);
                loadShapeData(s, {});
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        <div className="note">
          <p><b>{T.formaNote1a}</b>{T.formaNote1b}</p>
          <p>{T.formaNote2a}<b>{T.formaNote2b}</b>{T.formaNote2c}</p>
        </div>
      </>
    );
  }

  if (activeTab === 'cores') {
    panelTitle = T.tabCores;
    panelHint = `${cycles.length} ${cycles.length === 1 ? (lang === 'en' ? 'string' : 'fio') : T.fios}`;
    panelBody = manyCycles ? (
      <div className="note">{T.tooMany(cycles.length)}</div>
    ) : (
      <>
        <div className="group">
          <div className="group-lbl">{T.viewFios}</div>
          <div className="cycles-row">
            <button className={`cycle-chip all-btn ${showAll ? 'on' : ''}`}
              onClick={() => {
                if (showAll) {
                  setShowAll(false); setSelGap(null);
                  const hidden = {}; cycles.forEach((_, i) => { hidden[i] = false; });
                  setVisibleCycles(hidden);
                } else { setShowAll(true); setSelGap(null); setVisibleCycles({}); }
              }}>{T.all}</button>
            {cycles.map((c, i) => {
              const vis = isCycleVisible(i);
              return (
                <button key={i} className={`cycle-chip ${vis ? '' : 'off'}`}
                  style={{ background: getCycleColor(i), borderColor: vis ? getCycleColor(i) : undefined }}
                  onClick={() => toggleCycle(i)}>
                  {cycleSecondary[i] && <span className="half2" style={{ background: cycleSecondary[i] }} />}
                  <span className="num">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="group">
          <div className="group-lbl">{T.paint}</div>
          <div className="cycles-row">
            {cycles.map((c, i) => (
              <span key={i} className="pop-anchor">
                <button className="cycle-chip" data-pop-trigger
                  style={{ background: getCycleColor(i) }}
                  onClick={() => setPalettePopover(p => p?.i === i ? null : { i, kind: 'primary' })}>
                  {cycleSecondary[i] && <span className="half2" style={{ background: cycleSecondary[i] }} />}
                  <span className="num">{i + 1}</span>
                </button>
                {palettePopover?.i === i && (
                  <div className={`pop ${i % 6 >= 3 ? 'pop-right' : ''}`} data-pop>
                    <div className="pop-tabs">
                      <button className={palettePopover.kind === 'primary' ? 'on' : ''}
                        onClick={() => setPalettePopover({ i, kind: 'primary' })}>{T.popPrimary}</button>
                      <button className={palettePopover.kind === 'secondary' ? 'on' : ''}
                        onClick={() => setPalettePopover({ i, kind: 'secondary' })}>{T.popSecondary}</button>
                    </div>
                    <div className="pop-grid">
                      {JOAO.map(s => (
                        <button key={s.hex} className="swatch" title={lang === 'en' ? s.en : s.name} style={{ background: s.hex }}
                          onClick={() => {
                            if (palettePopover.kind === 'primary') setCycleColors(p => ({ ...p, [i]: s.hex }));
                            else setCycleSecondary(p => ({ ...p, [i]: s.hex }));
                            setPalettePopover(null);
                          }} />
                      ))}
                    </div>
                    {palettePopover.kind === 'secondary' && cycleSecondary[i] && (
                      <button className="btn sm danger" onClick={() => {
                        setCycleSecondary(p => { const n = { ...p }; delete n[i]; return n; });
                        setPalettePopover(null);
                      }}>{T.removeSecond}</button>
                    )}
                  </div>
                )}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--faint)" }}>{T.paintHint}</div>
        </div>

        <div className="group">
          <div className="group-lbl">{T.palettes}</div>
          {[...STARTER_PALETTES, ...palettes].map(pal => (
            <div key={pal.name} className="palette-row" onClick={() => applyPalette(pal)}>
              <span className="pal-dots">{pal.colors.map((c, k) => <i key={k} style={{ background: c }} />)}</span>
              <span className="pal-name">{pal.name}</span>
              {!pal.builtin && (
                <button className="pal-x" onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(T.confirmDel(pal.name))) setPalettes(p => p.filter(x => x.name !== pal.name));
                }}>✕</button>
              )}
            </div>
          ))}
          <button className="btn sm" onClick={saveCurrentPalette}>{T.savePal}</button>
        </div>

        {stringStats.totalLen > 0 && (
          <div className="group">
            <div className="group-lbl">{T.buy}</div>
            {Object.entries(stringStats.byColor).sort(([, a], [, b]) => b - a).map(([hex, len]) => {
              const pct = (len / stringStats.totalLen) * 100;
              return (
                <div key={hex}>
                  <div className="len-row">
                    <span className="len-dot" style={{ background: hex }} />
                    <span className="len-name">{colorName(hex, lang)}</span>
                    <span className="len-val">{fmtLen(len * nailSpacing)}</span>
                    <span className="len-pct">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="len-bar"><i style={{ width: `${pct}%`, background: hex }} /></div>
                </div>
              );
            })}
            <div className="len-row" style={{ marginTop: 4 }}>
              <span className="len-name" style={{ fontWeight: 700 }}>{T.total}</span>
              <span className="len-val">{fmtLen(totalCm)}</span>
            </div>
            {cycleBalance && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>{cycleBalance.summary}</div>}
          </div>
        )}
      </>
    );
  }

  if (activeTab === 'fio') {
    panelTitle = T.fioTitle;
    panelHint = threadPts ? T.fioOf(safeCi + 1) : "";
    panelBody = cycles.length === 0 ? (
      <div className="note">{T.drawFirst}<b>{T.tabForma}</b>.</div>
    ) : (
      <>
        <div className="group">
          <div className="group-lbl">{T.which}</div>
          <div className="cycles-row">
            {cycles.slice(0, 40).map((c, i) => (
              <button key={i} className={`cycle-chip ${i === safeCi ? '' : 'off'}`}
                style={{ background: getCycleColor(i), outline: i === safeCi ? '3px solid var(--brass-soft)' : 'none', outlineOffset: 2 }}
                onClick={() => setThreadCi(i)}>
                <span className="num">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="group">
          <div className="group-lbl">{T.lay}</div>
          <div className="btn-row" style={{ alignItems: "center" }}>
            <button className="icon-btn" onClick={() => threadStep(-1)} aria-label="back"><Icon name="stepb" size={20} /></button>
            <button className="btn primary grow" style={{ minHeight: 54, fontSize: 16 }}
              onClick={() => {
                if (threadDone) { setThreadT(0); setThreadPlaying(true); }
                else setThreadPlaying(p => !p);
              }}>
              <Icon name={threadPlaying ? "pause" : "play"} size={22} />
              {threadDone ? T.again : threadPlaying ? T.pause : threadT > 0 ? T.cont : T.start}
            </button>
            <button className="icon-btn" onClick={() => threadStep(1)} aria-label="forward"><Icon name="stepf" size={20} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 700 }}>{T.slow}</span>
            <input type="range" className="slider" min="0.8" max="12" step="0.2"
              value={threadSpeed} onChange={e => setThreadSpeed(+e.target.value)} />
            <span style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 700 }}>{T.fast}</span>
          </div>
          <button className={`toggle ${showNailNums ? 'on' : ''}`} onClick={() => setShowNailNums(v => !v)}>
            <span className="tg-lbl">{T.nailNums}</span>
            <span className="tg-pill" />
          </button>
        </div>

        <div className="note">
          <p>{T.fioNote1a}<b>{T.fioNote1b}</b>{T.fioNote1c}<b>{T.fioNote1d}</b>{T.fioNote1e}</p>
          <p>{T.fioNote2}</p>
        </div>
      </>
    );
  }

  if (activeTab === 'descobrir') {
    panelTitle = T.descTitle;
    panelHint = T.descHint;
    panelBody = (
      <>
        <div className="group">
          <button className="btn primary" style={{ minHeight: 56, fontSize: 16 }} onClick={surpriseMe}>
            <Icon name="dado" size={22} /> {T.surprise}
          </button>
          <div style={{ fontSize: 12.5, color: "var(--faint)" }}>{T.surpriseHint}</div>
        </div>

        <div className="group">
          <div className="group-lbl">{T.mapTitle}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{T.mapHint}</div>
          {heatmap && (
            <div className="heatmap-wrap">
              <div className="heatmap" style={{ gridTemplateColumns: `repeat(${HM_MAX - HM_MIN + 2}, 34px)` }}>
                <span className="hm-corner">{lang === 'en' ? 'W→ H↓' : 'L→ A↓'}</span>
                {Array.from({length: HM_MAX - HM_MIN + 1}, (_, k) => (
                  <span key={`cx${k}`} className="hm-axis">{HM_MIN + k}</span>
                ))}
                {heatmap.map((row, ri) => (
                  [<span key={`ry${ri}`} className="hm-axis">{HM_MIN + ri}</span>,
                    ...row.map((n, ci) => {
                      const w = HM_MIN + ci, h = HM_MIN + ri;
                      const cur = isFullRect && w === gridW && h === gridH;
                      return (
                        <button key={`hm${ri}-${ci}`} className={`hm-cell ${cur ? 'cur' : ''}`}
                          style={{ background: fioCellColor(n), color: n <= 4 ? '#1d1409' : '#cbbfa4' }}
                          onClick={() => {
                            loadShapeData({ cells: Array.from({length: h}, () => Array(w).fill(true)), gw: w, gh: h }, {});
                          }}>
                          {n}
                        </button>
                      );
                    })]
                ))}
              </div>
            </div>
          )}
          <div className="legend">
            <span><i style={{ background: '#d9a440' }} />{T.leg1}</span>
            <span><i style={{ background: '#7da06a' }} />{T.leg2}</span>
            <span><i style={{ background: '#5a93b0' }} />3</span>
            <span><i style={{ background: '#9a6ab0' }} />4</span>
            <span><i style={{ background: '#6d5f49' }} />5+</span>
          </div>
        </div>

        <div className="note">
          <p>{T.descNote1a}<b>{T.descNote1b}</b>{T.descNote1c}<b>{T.descNote1d}</b>{T.descNote1e}</p>
          <p>{T.descNote2a}<b>{T.descNote2b}</b>{T.descNote2c}</p>
        </div>
      </>
    );
  }

  if (activeTab === 'galeria') {
    panelTitle = T.galTitle;
    panelHint = `${patterns.length} ${patterns.length === 1 ? T.pattern : T.patterns}`;
    panelBody = (
      <>
        <div className="group">
          <button className="btn primary" style={{ minHeight: 52 }} onClick={savePattern}>{T.savePat}</button>
          <div className="btn-row">
            <button className="btn sm grow" onClick={exportPNG}><Icon name="imagem" size={18} /> {T.png}</button>
            <button className="btn sm grow" onClick={exportPatterns}><Icon name="descarregar" size={18} /> {T.exportB}</button>
            <button className="btn sm grow" onClick={() => importFileRef.current?.click()}><Icon name="carregar" size={18} /> {T.importB}</button>
            <input ref={importFileRef} type="file" accept="application/json" onChange={onImportFile} style={{ display: "none" }} />
          </div>
        </div>
        {patterns.length === 0 ? (
          <div className="note">{T.galEmptyA}<b>{T.galEmptyB}</b>{T.galEmptyC}</div>
        ) : (
          <div className="card-grid">
            {patterns.map(p => {
              const n = getAllCycles(p.cells, p.gw, p.gh).cycles.length;
              return (
                <div key={p.name} className="pattern-card" role="button"
                  onClick={() => loadShapeData(p, { colors: p.colors, secondary: p.secondary, strandMode: p.strandMode })}>
                  <div className="pc-preview">
                    <MiniPreview cells={p.cells} gw={p.gw} gh={p.gh} colors={p.colors} />
                  </div>
                  <div className="pc-meta">
                    <span className="pc-name">{p.name}</span>
                    <span className="pc-fios">{n} {n === 1 ? (lang === 'en' ? 'string' : 'fio') : T.fios}</span>
                    <button className="pc-x" onClick={e => { e.stopPropagation(); deletePattern(p.name); }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  if (activeTab === 'ajustes') {
    panelTitle = T.ajTitle;
    panelHint = "";
    panelBody = (
      <>
        <div className="group">
          <div className="group-lbl">{T.lang}</div>
          <div className="seg">
            <button className={lang === 'pt' ? 'on' : ''} onClick={() => setLang('pt')}>Português</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>
        </div>
        <div className="group">
          <div className="group-lbl">{T.strand}</div>
          <div className="seg">
            {[['thin', T.thin], ['full', T.full], ['string', T.string]].map(([id, lbl]) => (
              <button key={id} className={strandMode === id ? 'on' : ''} onClick={() => setStrandMode(id)}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="group">
          <div className="group-lbl">{T.spacing}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="stepper">
              <button onClick={() => setNailSpacing(v => Math.max(0.5, +(v - 0.25).toFixed(2)))}>−</button>
              <span className="stepper-val" style={{ width: 84 }}>{String(nailSpacing).replace('.', ',')} cm</span>
              <button onClick={() => setNailSpacing(v => Math.min(5, +(v + 0.25).toFixed(2)))}>+</button>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--faint)" }}>{T.spacingHint}</div>
        </div>
        <div className="group">
          <div className="group-lbl">{T.bg}</div>
          <div className="chip-row">
            {BG_OPTIONS.map((c, i) => (
              <button key={c} className="swatch" aria-label={`bg ${i + 1}`}
                style={{ background: c, outline: i === bgIndex ? '3px solid var(--brass-soft)' : 'none', outlineOffset: 1 }}
                onClick={() => setBgIndex(i)} />
            ))}
          </div>
        </div>
        <div className="group">
          <button className={`toggle ${showNails ? 'on' : ''}`} onClick={() => setShowNails(v => !v)}>
            <span className="tg-lbl">{T.showNails}</span>
            <span className="tg-pill" />
          </button>
        </div>
        <div className="note">
          {lang === 'en' ? (
            <>
              <p><b>{T.helpTitle}</b> draw the board's shape in <b>{T.tabForma}</b>; the top bar shows how many <b>strings</b> it needs; paint each string in <b>{T.tabCores}</b>; and in <b>{T.tabFio}</b> watch each string's path, nail by nail.</p>
              <p>In <b>{T.tabDescobrir}</b> there's a map showing how many strings every rectangle needs — and a button that invents new shapes.</p>
              <p>Patterns saved in <b>{T.tabGaleria}</b> stay on this tablet, even without internet.</p>
            </>
          ) : (
            <>
              <p><b>{T.helpTitle}</b> desenhe a forma da tábua em <b>{T.tabForma}</b>; veja quantos <b>fios</b> são precisos no topo; pinte cada fio em <b>{T.tabCores}</b>; e em <b>{T.tabFio}</b> veja o caminho de cada fio, prego a prego.</p>
              <p>Em <b>{T.tabDescobrir}</b> há um mapa que mostra quantos fios leva cada retângulo — e um botão que inventa formas novas.</p>
              <p>Os padrões guardados em <b>{T.tabGaleria}</b> ficam neste tablet, mesmo sem internet.</p>
            </>
          )}
        </div>
      </>
    );
  }

  // ----- shell -----
  return (
    <div className={`shell ${panelOpen ? '' : 'panel-closed'}`}>
      <div className="topbar">
        <div className="brand">
          <span className="brand-name">{lang === 'en' ? 'Nail Loom' : 'Tear de Pregos'}</span>
          <span className="brand-sub">{T.sub}</span>
        </div>
        <div className="topbar-stats">
          <span className="stat-pill" title={cycleBalance?.summary || ''}>
            {cycleBalance && <span className="balance-dot" style={{ background: cycleBalance.ratingColor, color: cycleBalance.ratingColor }} />}
            <b>{cycles.length}</b>
            <span>{cycles.length === 1 ? T.fio1 : T.fios}</span>
          </span>
          <span className="stat-pill"><b>{fmtLen(totalCm)}</b><span>{T.deFio}</span></span>
          <button className="icon-btn" disabled={!undoStack.length} onClick={undo} aria-label={T.undoB}><Icon name="undo" size={20} /></button>
          <button className="icon-btn" disabled={!redoStack.length} onClick={redo} aria-label={T.redoB}><Icon name="redo" size={20} /></button>
          <button className="icon-btn lang-btn" onClick={() => setLang(l => l === 'pt' ? 'en' : 'pt')} aria-label="Language">
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>
      </div>

      <nav className="rail">
        {TABS.map(t => (
          <button key={t.id} className={`rail-btn ${activeTab === t.id && panelOpen ? 'active' : ''}`} onClick={() => onTab(t.id)}>
            <Icon name={t.id} size={26} />
            <span className="rail-lbl">{t.lbl}</span>
          </button>
        ))}
      </nav>

      <aside className="panel">
        <div className="panel-h">
          <h2>{panelTitle}</h2>
          {panelHint ? <span className="panel-hint">{panelHint}</span> : null}
        </div>
        <div className="panel-body">{panelBody}</div>
      </aside>

      {canvasEl}
    </div>
  );
}

window.addEventListener('error', e => {
  // surface runtime errors in the document title so headless test runs can detect them
  document.title = 'ERRO: ' + (e.message || 'desconhecido');
});
ReactDOM.createRoot(document.getElementById('root')).render(<TearDePregos />);
