/* === App (Babel-transpiled, target iOS 13.4+) === */
"use strict";

const {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect
} = React;

// ========== SHAPE PRESETS ==========
function makePreset(name, curW, curH) {
  if (name === 'staircase-boot') {
    const gw = 18,
      gh = 10;
    const cells = Array.from({
      length: gh
    }, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++) {
      const w = y < 4 ? 8 + y * 2 : gw;
      for (let x = 0; x < Math.min(w, gw); x++) cells[y][x] = true;
    }
    return {
      cells,
      gw,
      gh
    };
  }
  if (name === 'L-shape') {
    const gw = 18,
      gh = 10;
    const cells = Array.from({
      length: gh
    }, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++) {
      const w = y < 2 ? 8 : gw;
      for (let x = 0; x < w; x++) cells[y][x] = true;
    }
    return {
      cells,
      gw,
      gh
    };
  }
  if (name === 'cross') {
    const gw = 15,
      gh = 15;
    const cells = Array.from({
      length: gh
    }, () => Array(gw).fill(false));
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (x >= 5 && x < 10 || y >= 5 && y < 10) cells[y][x] = true;
    return {
      cells,
      gw,
      gh
    };
  }
  const gw = curW || 18,
    gh = curH || 10;
  return {
    cells: Array.from({
      length: gh
    }, () => Array(gw).fill(true)),
    gw,
    gh
  };
}

// ========== CELL-GRID SHAPE FUNCTIONS ==========
function buildEdges(cells, gw, gh) {
  const hUnits = [];
  const vUnits = [];
  for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
    const above = y > 0 ? cells[y - 1][x] : false;
    const below = y < gh ? cells[y][x] : false;
    if (above !== below) hUnits.push({
      y,
      x
    });
  }
  for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
    const left = x > 0 ? cells[y][x - 1] : false;
    const right = x < gw ? cells[y][x] : false;
    if (left !== right) vUnits.push({
      x,
      y
    });
  }
  const edges = [];
  const hByY = {};
  for (const e of hUnits) {
    if (!hByY[e.y]) hByY[e.y] = [];
    hByY[e.y].push(e.x);
  }
  for (const y in hByY) {
    const xs = hByY[y].sort((a, b) => a - b);
    let start = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] === xs[i - 1] + 1) continue;
      edges.push({
        y: +y,
        x0: start,
        x1: xs[i - 1] + 1,
        type: 'h'
      });
      if (i < xs.length) start = xs[i];
    }
  }
  const vByX = {};
  for (const e of vUnits) {
    if (!vByX[e.x]) vByX[e.x] = [];
    vByX[e.x].push(e.y);
  }
  for (const x in vByX) {
    const ys = vByX[x].sort((a, b) => a - b);
    let start = ys[0];
    for (let i = 1; i <= ys.length; i++) {
      if (i < ys.length && ys[i] === ys[i - 1] + 1) continue;
      edges.push({
        x: +x,
        y0: start,
        y1: ys[i - 1] + 1,
        type: 'v'
      });
      if (i < ys.length) start = ys[i];
    }
  }
  return edges;
}
function buildGaps(cells, gw, gh) {
  const gaps = [];
  for (let y = 0; y <= gh; y++) for (let x = 0; x < gw; x++) {
    const above = y > 0 ? cells[y - 1][x] : false;
    const below = y < gh ? cells[y][x] : false;
    if (above !== below) gaps.push({
      x: x + 0.5,
      y,
      isH: true,
      interiorBelow: !!below
    });
  }
  for (let x = 0; x <= gw; x++) for (let y = 0; y < gh; y++) {
    const left = x > 0 ? cells[y][x - 1] : false;
    const right = x < gw ? cells[y][x] : false;
    if (left !== right) gaps.push({
      x,
      y: y + 0.5,
      isH: false,
      interiorRight: !!right
    });
  }
  return gaps;
}
function getInitialDir(gap) {
  if (gap.isH) {
    return gap.interiorBelow ? {
      dx: 1,
      dy: 1
    } : {
      dx: -1,
      dy: -1
    };
  }
  return gap.interiorRight ? {
    dx: 1,
    dy: -1
  } : {
    dx: -1,
    dy: 1
  };
}
function pointToGapIdx(px, py, gaps) {
  for (let i = 0; i < gaps.length; i++) if (Math.abs(px - gaps[i].x) < 0.1 && Math.abs(py - gaps[i].y) < 0.1) return i;
  return -1;
}
function isOnBoundary(px, py, cells, gw, gh) {
  const E = 0.01;
  const iy = Math.round(py),
    ix = Math.round(px);
  if (Math.abs(py - iy) < E) {
    const cx = Math.floor(px);
    if (cx >= 0 && cx < gw) {
      const above = iy > 0 ? !!cells[iy - 1]?.[cx] : false;
      const below = iy < gh ? !!cells[iy]?.[cx] : false;
      if (above !== below) return true;
    }
  }
  if (Math.abs(px - ix) < E) {
    const cy = Math.floor(py);
    if (cy >= 0 && cy < gh) {
      const left = ix > 0 ? !!cells[cy]?.[ix - 1] : false;
      const right = ix < gw ? !!cells[cy]?.[ix] : false;
      if (left !== right) return true;
    }
  }
  return false;
}

// ========== BILLIARD TRACING ==========
function tracePath(startIdx, gaps, edges, cells, gw, gh) {
  const EPS = 1e-9;
  const sc = gaps[startIdx];
  const pts = [{
    x: sc.x,
    y: sc.y
  }];
  let {
    dx,
    dy
  } = getInitialDir(sc);
  let x = sc.x,
    y = sc.y;
  const maxIter = edges.length * 200 + 2000;
  for (let iter = 0; iter < maxIter; iter++) {
    let minT = Infinity,
      hitH = false,
      hitV = false;
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
        minT = t;
        hitH = edge.type === 'h';
        hitV = edge.type === 'v';
      } else if (Math.abs(t - minT) < EPS * 100) {
        if (edge.type === 'h') hitH = true;
        if (edge.type === 'v') hitV = true;
      }
    }
    if (minT === Infinity || minT > 1e6) break;
    x += dx * minT;
    y += dy * minT;
    x = Math.round(x * 1e6) / 1e6;
    y = Math.round(y * 1e6) / 1e6;
    pts.push({
      x,
      y
    });
    if (pts.length > 2 && Math.abs(x - sc.x) < 0.01 && Math.abs(y - sc.y) < 0.01) break;
    if (hitH && hitV) {
      dx = -dx;
      dy = -dy;
    } else if (hitH) dy = -dy;else if (hitV) dx = -dx;
  }
  return pts;
}
function getAllCycles(cells, gw, gh) {
  const edges = buildEdges(cells, gw, gh);
  const gaps = buildGaps(cells, gw, gh);
  if (gaps.length === 0) return {
    cycles: [],
    gaps,
    edges
  };
  const vis = new Set(),
    cycles = [];
  for (let g = 0; g < gaps.length; g++) {
    if (vis.has(g)) continue;
    const pts = tracePath(g, gaps, edges, cells, gw, gh);
    const gapSet = new Set();
    for (const p of pts) {
      const gi = pointToGapIdx(p.x, p.y, gaps);
      if (gi >= 0) {
        gapSet.add(gi);
        vis.add(gi);
      }
    }
    cycles.push({
      startGap: g,
      points: pts,
      gaps: gapSet
    });
  }
  return {
    cycles,
    gaps,
    edges
  };
}

// ========== COLORS ==========
const JOAO = [{
  name: "Branco",
  hex: "#f4f1e8"
}, {
  name: "Creme",
  hex: "#ecdcb0"
}, {
  name: "Amarelo",
  hex: "#e8c838"
}, {
  name: "Ambar",
  hex: "#e8a020"
}, {
  name: "Coral",
  hex: "#e84030"
}, {
  name: "Vermelho",
  hex: "#d4242c"
}, {
  name: "Rosa Claro",
  hex: "#e68a96"
}, {
  name: "Rosa Choque",
  hex: "#e4287c"
}, {
  name: "Magenta",
  hex: "#c41878"
}, {
  name: "Roxo",
  hex: "#6a2aa0"
}, {
  name: "Verde Neon",
  hex: "#8ab840"
}, {
  name: "Verde Mar",
  hex: "#2e9a5e"
}, {
  name: "Turquesa",
  hex: "#2aa0b4"
}, {
  name: "Azul",
  hex: "#1e40c8"
}, {
  name: "Preto",
  hex: "#1a1c28"
}];
const JOAO_DEFAULTS = JOAO.filter(c => c.hex !== "#1a1a1a");
// Curated default rotation — vivid, high-contrast neighbours (red/turquoise/cream first, like the cushion)
const COLORS = ["#d4242c", "#2aa0b4", "#ecdcb0", "#e4287c", "#2e9a5e", "#e8a020", "#1e40c8", "#6a2aa0", "#e84030", "#8ab840", "#c41878", "#e68a96", "#e8c838", "#f4f1e8"];
const STR = {
  pt: {
    fio: "fio", fios: "fios", pregos: "pregos",
    soPadrao: "S\u00d3 O PADR\u00c3O", voltar: "VOLTAR",
    tamanho: "Tamanho", hide: "esconder", change: "mudar", wLbl: "L", hLbl: "A",
    fill: "Preencher", clear: "Limpar",
    save: "Guardar", exportar: "Exportar", importar: "Importar",
    stripTitle: "Fios", all: "TODOS",
    tapHint: "Toque num fio para mudar a cor", custom: "Outra cor\u2026",
    changeBg: "Mudar o fundo", strandTitle: "Grossura do fio", nailsTitle: "Mostrar pregos",
    namePrompt: "Nome da forma:",
    deleteConfirm: n => `Apagar "${n}"?`,
    importErr: m => `N\u00e3o consegui importar: ${m}`,
    totalLen: "Fio total: ",
    balanced: p => `Fios equilibrados (cada um ~${p}% do comprimento).`,
    unbalanced: (a, b) => `Desigual: o fio mais curto tem ${a}% do comprimento e o mais longo ${b}%.`,
    tabDesenhar: "Desenhar", tabFios: "Fios", tabGuardadas: "Guardadas",
    playTitle: "Ver a montagem", playClose: "Fechar", playAgain: "Outra vez",
    presets: { rectangle: "Ret\u00e2ngulo", "L-shape": "Forma L", "staircase-boot": "Escada", cross: "Cruz" },
    strand: { thin: "fino", full: "grosso", string: "linha" },
  },
  en: {
    fio: "string", fios: "strings", pregos: "nails",
    soPadrao: "PATTERN ONLY", voltar: "BACK",
    tamanho: "Size", hide: "hide", change: "change", wLbl: "W", hLbl: "H",
    fill: "Fill", clear: "Clear",
    save: "Save", exportar: "Export", importar: "Import",
    stripTitle: "Strings", all: "ALL",
    tapHint: "Tap a string to change its colour", custom: "Custom\u2026",
    changeBg: "Change background", strandTitle: "String thickness", nailsTitle: "Show nails",
    namePrompt: "Shape name:",
    deleteConfirm: n => `Delete "${n}"?`,
    importErr: m => `Could not import: ${m}`,
    totalLen: "Total string: ",
    balanced: p => `Strings are balanced (each ~${p}% of the length).`,
    unbalanced: (a, b) => `Uneven: the shortest string is ${a}% of the length, the longest ${b}%.`,
    tabDesenhar: "Draw", tabFios: "Strings", tabGuardadas: "Saved",
    playTitle: "Watch the laying", playClose: "Close", playAgain: "Replay",
    presets: { rectangle: "Rectangle", "L-shape": "L-shape", "staircase-boot": "Staircase", cross: "Cross" },
    strand: { thin: "thin", full: "thick", string: "line" },
  },
};
const HELP = {
  pt: [
    /*#__PURE__*/React.createElement("p", { key: 0, style: { margin: "0 0 8px", fontWeight: 600, color: "var(--accent)" } }, "Como usar"),
    /*#__PURE__*/React.createElement("p", { key: 1, style: { margin: "0 0 6px" } }, "O n\u00famero no topo mostra quantos ", /*#__PURE__*/React.createElement("strong", null, "fios"), " o padr\u00e3o tem. O ponto colorido indica o ", /*#__PURE__*/React.createElement("strong", null, "equil\u00edbrio"), " \u2014 toque nele para ver porqu\u00ea."),
    /*#__PURE__*/React.createElement("p", { key: 2, style: { margin: "0 0 6px" } }, "Para come\u00e7ar com um ret\u00e2ngulo, escolha as dimens\u00f5es em ", /*#__PURE__*/React.createElement("strong", null, "\"Tamanho\""), " e carregue em ", /*#__PURE__*/React.createElement("strong", null, "\"Preencher\""), "."),
    /*#__PURE__*/React.createElement("p", { key: 3, style: { margin: "0 0 6px" } }, /*#__PURE__*/React.createElement("strong", null, "Arraste o dedo"), " na grelha para adicionar ou remover c\u00e9lulas \u2014 os fios atualizam em tempo real."),
    /*#__PURE__*/React.createElement("p", { key: 4, style: { margin: "0 0 6px" } }, "As cores de cada fio est\u00e3o na aba ", /*#__PURE__*/React.createElement("strong", null, "Fios"), "; se gostar de uma forma, guarde-a em ", /*#__PURE__*/React.createElement("strong", null, "Guardadas"), "."),
    /*#__PURE__*/React.createElement("p", { key: 5, style: { margin: 0 } }, "Os bot\u00f5es no canto do padr\u00e3o mudam o ", /*#__PURE__*/React.createElement("strong", null, "fundo"), ", o ", /*#__PURE__*/React.createElement("strong", null, "zoom"), ", os ", /*#__PURE__*/React.createElement("strong", null, "pregos"), " e a ", /*#__PURE__*/React.createElement("strong", null, "grossura do fio"), "."),
  ],
  en: [
    /*#__PURE__*/React.createElement("p", { key: 0, style: { margin: "0 0 8px", fontWeight: 600, color: "var(--accent)" } }, "How to use"),
    /*#__PURE__*/React.createElement("p", { key: 1, style: { margin: "0 0 6px" } }, "The number at the top shows how many ", /*#__PURE__*/React.createElement("strong", null, "strings"), " the pattern needs. The coloured dot shows the ", /*#__PURE__*/React.createElement("strong", null, "balance"), " \u2014 tap it to see why."),
    /*#__PURE__*/React.createElement("p", { key: 2, style: { margin: "0 0 6px" } }, "To start with a rectangle, set the dimensions under ", /*#__PURE__*/React.createElement("strong", null, "\"Size\""), " and press ", /*#__PURE__*/React.createElement("strong", null, "\"Fill\""), "."),
    /*#__PURE__*/React.createElement("p", { key: 3, style: { margin: "0 0 6px" } }, /*#__PURE__*/React.createElement("strong", null, "Drag your finger"), " across the grid to add or remove cells \u2014 the strings update live."),
    /*#__PURE__*/React.createElement("p", { key: 4, style: { margin: "0 0 6px" } }, "Each string's colour lives in the ", /*#__PURE__*/React.createElement("strong", null, "Strings"), " tab; if you like a shape, keep it under ", /*#__PURE__*/React.createElement("strong", null, "Saved"), "."),
    /*#__PURE__*/React.createElement("p", { key: 5, style: { margin: 0 } }, "The buttons in the corner of the pattern change the ", /*#__PURE__*/React.createElement("strong", null, "background"), ", ", /*#__PURE__*/React.createElement("strong", null, "zoom"), ", ", /*#__PURE__*/React.createElement("strong", null, "nails"), " and ", /*#__PURE__*/React.createElement("strong", null, "string thickness"), "."),
  ],
};
function subtractInterval(a0, a1, b0, b1) {
  if (b0 >= a1 || b1 <= a0) return [[a0, a1]];
  const r = [];
  if (a0 < b0) r.push([a0, b0]);
  if (b1 < a1) r.push([b1, a1]);
  return r;
}

// ========== MAIN COMPONENT ==========
function KnotMakerMobile() {
  const [cells, setCells] = useState(() => Array.from({
    length: 10
  }, () => Array(18).fill(true)));
  const [gridW, setGridW] = useState(18);
  const [gridH, setGridH] = useState(10);
  const [editW, setEditW] = useState('');
  const [editH, setEditH] = useState('');
  const [editingW, setEditingW] = useState(false);
  const [editingH, setEditingH] = useState(false);
  const [savedShapes, setSavedShapes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('celtic.savedShapes') || '[]');
    } catch {
      return [];
    }
  });
  const persistShapes = useCallback(next => {
    setSavedShapes(next);
    try {
      localStorage.setItem('celtic.savedShapes', JSON.stringify(next));
    } catch {}
  }, []);
  const [gridSizePanelOpen, setGridSizePanelOpen] = useState(() => {
    try {
      const v = localStorage.getItem("celtic.gridSizePanelOpen");
      if (v === null) return true;
      return v === "1";
    } catch {
      return true;
    }
  });
  const toggleGridSizePanel = useCallback(() => {
    setGridSizePanelOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem("celtic.gridSizePanelOpen", next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);
  const [selGap, setSelGap] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [cycleStripOpen, setCycleStripOpen] = useState(true);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [showNails, setShowNails] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const knotWrapRef = useRef(null);
  const [activeTab, setActiveTab] = useState('edit'); // null | 'edit' | 'fios' | 'shapes'
  const [lang, setLang] = useState(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('lang');
      if (q === 'en' || q === 'pt') return q;
      return localStorage.getItem('knot.lang') === 'en' ? 'en' : 'pt';
    } catch { return 'pt'; }
  });
  useEffect(() => { try { localStorage.setItem('knot.lang', lang); } catch {} }, [lang]);
  const T = STR[lang];
  const [playerOpen, setPlayerOpen] = useState(false);
  const playerBoxRef = useRef(null);
  const playerApiRef = useRef(null);
  useEffect(() => {
    if (!playerOpen || !playerBoxRef.current || typeof TearPlayer === 'undefined') return;
    const api = TearPlayer.create(playerBoxRef.current, {
      cells: cells.map(r => [...r]),
      colors: cycles.map((_, i) => getCycleColor(i)),
      bg: bgColor,
      autoplay: true,
    });
    playerApiRef.current = api;
    return () => { playerApiRef.current = null; api.destroy(); };
  }, [playerOpen]);
  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const q = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 500);
    q();
    window.addEventListener('resize', q);
    window.addEventListener('orientationchange', q);
    return () => {
      window.removeEventListener('resize', q);
      window.removeEventListener('orientationchange', q);
    };
  }, []);
  const [strandMode, setStrandMode] = useState('thin');
  const [cycleColors, setCycleColors] = useState({});
  const [cycleSecondary, setCycleSecondary] = useState({});
  const [palettePopover, setPalettePopover] = useState(null);
  const [visibleCycles, setVisibleCycles] = useState({});
  const [painting, setPainting] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const colorInputRefs = useRef({});
  const colorInputRefs2 = useRef({});
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const pressStartRef = useRef(null);
  useEffect(() => {
    if (!palettePopover) return;
    const close = e => {
      if (!e.target.closest?.("[data-palette-pop]") && !e.target.closest?.("[data-palette-trigger]")) setPalettePopover(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [palettePopover]);

  // Two fingers: pinch-zoom + drag to pan the knot. One finger: tap gap dots only (no pan).
  const pinchRef = useRef(null);
  useEffect(() => {
    const el = knotWrapRef.current;
    if (!el) return;
    const captureTwoFinger = e => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const t0 = e.touches[0],
        t1 = e.touches[1];
      const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const mx = (t0.clientX + t1.clientX) / 2;
      const my = (t0.clientY + t1.clientY) / 2;
      pinchRef.current = {
        d,
        z: zoom,
        mx,
        my,
        px: panX,
        py: panY
      };
    };
    const onTouchStart = e => {
      captureTwoFinger(e);
    };
    const onTouchMove = e => {
      if (e.touches.length === 2) {
        if (!pinchRef.current) captureTwoFinger(e);
        if (!pinchRef.current) return;
        e.preventDefault();
        const t0 = e.touches[0],
          t1 = e.touches[1];
        const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const mx = (t0.clientX + t1.clientX) / 2;
        const my = (t0.clientY + t1.clientY) / 2;
        const scale = d / pinchRef.current.d;
        setZoom(Math.max(0.15, Math.min(5, pinchRef.current.z * scale)));
        setPanX(pinchRef.current.px + (mx - pinchRef.current.mx));
        setPanY(pinchRef.current.py + (my - pinchRef.current.my));
      }
    };
    const onTouchEnd = e => {
      if (e.touches.length < 2) pinchRef.current = null;
    };
    el.addEventListener("touchstart", onTouchStart, {
      passive: false
    });
    el.addEventListener("touchmove", onTouchMove, {
      passive: false
    });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [zoom, panX, panY]);
  const W = gridW,
    H = gridH;
  const loadShape = useCallback(shape => {
    setCells(shape.cells.map(r => [...r]));
    setGridW(shape.gw);
    setGridH(shape.gh);
    setSelGap(null);
    setShowAll(true);
    setCycleColors({});
    setVisibleCycles({});
  }, []);
  const saveCurrentShape = useCallback(() => {
    const name = window.prompt(T.namePrompt);
    if (!name?.trim()) return;
    const trimmed = name.trim();
    const snap = {
      name: trimmed,
      gw: gridW,
      gh: gridH,
      cells: cells.map(r => [...r])
    };
    const next = [...savedShapes.filter(s => s.name !== trimmed), snap];
    persistShapes(next);
  }, [cells, gridW, gridH, savedShapes, persistShapes]);
  const deleteShape = useCallback(name => {
    persistShapes(savedShapes.filter(s => s.name !== name));
  }, [savedShapes, persistShapes]);
  const exportShapes = useCallback(() => {
    const blob = new Blob([JSON.stringify(savedShapes, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `celtic-shapes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [savedShapes]);
  const importFileRef = useRef(null);
  const onImportFile = useCallback(e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("not an array");
        const valid = data.filter(s => s && typeof s.name === "string" && Array.isArray(s.cells) && Number.isInteger(s.gw) && Number.isInteger(s.gh));
        const merged = [...savedShapes];
        for (const s of valid) {
          const i = merged.findIndex(m => m.name === s.name);
          if (i >= 0) merged[i] = s;else merged.push(s);
        }
        persistShapes(merged);
      } catch (err) {
        window.alert(T.importErr(err.message));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [savedShapes, persistShapes]);
  const toggleCell = useCallback((x, y, forceVal) => {
    setCells(prev => {
      const next = prev.map(r => [...r]);
      next[y][x] = forceVal !== undefined ? forceVal : !prev[y][x];
      return next;
    });
    setSelGap(null);
    setShowAll(true);
  }, []);
  const resizeGrid = useCallback((newW, newH) => {
    setCells(prev => Array.from({
      length: newH
    }, (_, y) => Array.from({
      length: newW
    }, (_, x) => y < prev.length && x < (prev[0]?.length || 0) ? prev[y][x] : false)));
    setGridW(newW);
    setGridH(newH);
    setSelGap(null);
    setShowAll(true);
  }, []);
  const {
    cycles,
    gaps,
    edges
  } = useMemo(() => getAllCycles(cells, gridW, gridH), [cells, gridW, gridH]);
  const active = useMemo(() => selGap !== null ? cycles.find(c => c.gaps.has(selGap)) : null, [selGap, cycles]);

  // Responsive SVG sizing — cellSz is at zoom=1, viewBox scales for zoom
  const svgW = 600,
    svgH = 600;
  const pad = 40;
  const cellSz = Math.min((svgW - 2 * pad) / W, (svgH - 2 * pad) / H) * 0.92;
  const ox = (svgW - W * cellSz) / 2,
    oy = (svgH - H * cellSz) / 2;
  // ViewBox: zoom < 1 shows more area (zoom out), zoom > 1 shows less (zoom in)
  const vbW = svgW / zoom,
    vbH = svgH / zoom;
  const vbX = (svgW - vbW) / 2 - panX / zoom;
  const vbY = (svgH - vbH) / 2 - panY / zoom;
  const toX = useCallback(x => ox + x * cellSz, [ox, cellSz]);
  const toY = useCallback(y => oy + y * cellSz, [oy, cellSz]);
  const gapDots = useMemo(() => gaps.map((g, i) => ({
    i,
    x: toX(g.x),
    y: toY(g.y)
  })), [gaps, toX, toY]);
  const gr = Math.max(5, cellSz * 0.13);
  const sw = cellSz * (strandMode === 'full' ? 0.707 : strandMode === 'string' ? 0.12 : 0.45);
  const BG_OPTIONS = ["#0c0f12", "#2a2e35", "#5a5f66", "#a0a4a8", "#f8f8f5"];
  const [bgIndex, setBgIndex] = useState(0);
  const bgColor = BG_OPTIONS[bgIndex];

  // Weave grid lines
  const weaveLines = useMemo(() => {
    const lines = [];
    for (let k = -W; k <= H; k++) {
      const kVal = k + 0.5;
      const activeSegs = [];
      let segStart = null;
      const nMin = Math.max(0, -k),
        nMax = Math.min(W - 1, H - k - 2);
      for (let n = nMin; n <= nMax; n++) {
        const cy1 = n + k,
          cy2 = n + k + 1;
        if (cy1 >= 0 && cy2 < H && n < W && cells[cy1][n] && cells[cy2][n]) {
          if (segStart === null) segStart = n;
        } else {
          if (segStart !== null) {
            activeSegs.push([segStart, n]);
            segStart = null;
          }
        }
      }
      if (segStart !== null) activeSegs.push([segStart, nMax + 1]);
      for (const [x0, x1] of activeSegs) {
        if (x1 - x0 < 0.01) continue;
        const sx0 = toX(x0),
          sy0 = toY(x0 + kVal);
        const sx1 = toX(x1),
          sy1 = toY(x1 + kVal);
        const ddx = sx1 - sx0,
          ddy = sy1 - sy0;
        const len = Math.hypot(ddx, ddy);
        if (len < 1) continue;
        const ux = ddx / len,
          uy = ddy / len;
        const cuts = [];
        for (let m = -1; m <= W + H; m++) {
          const mVal = m + 0.5;
          const ix = (mVal - kVal) / 2;
          const iy = (mVal + kVal) / 2;
          if (ix > x0 + 0.01 && ix < x1 - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((k + m + W) % 2 === 1) cuts.push({
              sx: toX(ix),
              sy: toY(iy)
            });
          }
        }
        lines.push({
          sx0,
          sy0,
          sx1,
          sy1,
          ux,
          uy,
          cuts
        });
      }
    }
    for (let m = 0; m <= W + H - 1; m++) {
      const mVal = m + 0.5;
      const activeSegs = [];
      let segStart = null;
      const nMin = Math.max(0, Math.ceil(mVal - H)),
        nMax = Math.min(W - 1, Math.floor(mVal - 1));
      for (let n = nMin; n <= nMax; n++) {
        const cy1 = m - n - 1,
          cy2 = m - n;
        if (cy1 >= 0 && cy2 < H && cy1 < H && cy2 >= 0 && n < W && cells[cy1][n] && cells[cy2][n]) {
          if (segStart === null) segStart = n;
        } else {
          if (segStart !== null) {
            activeSegs.push([segStart, n]);
            segStart = null;
          }
        }
      }
      if (segStart !== null) activeSegs.push([segStart, nMax + 1]);
      for (const [x0, x1] of activeSegs) {
        if (x1 - x0 < 0.01) continue;
        const sx0 = toX(x0),
          sy0 = toY(mVal - x0);
        const sx1 = toX(x1),
          sy1 = toY(mVal - x1);
        const ddx = sx1 - sx0,
          ddy = sy1 - sy0;
        const len = Math.hypot(ddx, ddy);
        if (len < 1) continue;
        const ux = ddx / len,
          uy = ddy / len;
        const cuts = [];
        for (let k = -W; k <= H; k++) {
          const kVal2 = k + 0.5;
          const ix = (mVal - kVal2) / 2;
          const iy = (mVal + kVal2) / 2;
          if (ix > x0 + 0.01 && ix < x1 - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((k + m + W) % 2 === 0) cuts.push({
              sx: toX(ix),
              sy: toY(iy)
            });
          }
        }
        lines.push({
          sx0,
          sy0,
          sx1,
          sy1,
          ux,
          uy,
          cuts
        });
      }
    }
    return lines;
  }, [cells, W, H, cellSz, toX, toY]);

  // Strand rendering
  const getCycleColor = useCallback(i => {
    if (strandMode === 'string') return "#8fa3ad";
    return cycleColors[i] || COLORS[i % COLORS.length];
  }, [cycleColors, strandMode]);
  const setCycleColor = useCallback((i, color) => setCycleColors(prev => ({
    ...prev,
    [i]: color
  })), []);
  const setCycleSecondaryColor = useCallback((i, color) => setCycleSecondary(prev => ({
    ...prev,
    [i]: color
  })), []);
  const clearCycleSecondary = useCallback(i => setCycleSecondary(prev => {
    const n = {
      ...prev
    };
    delete n[i];
    return n;
  }), []);
  const isCycleVisible = useCallback(i => {
    if (showAll) return visibleCycles[i] !== false;
    return visibleCycles[i] === true;
  }, [showAll, visibleCycles]);
  const toggleCycle = useCallback(i => {
    const willBeVisible = !isCycleVisible(i);
    setVisibleCycles(prev => ({
      ...prev,
      [i]: willBeVisible
    }));
  }, [isCycleVisible]);

  // Corner detection
  const cornerGapSet = useMemo(() => {
    const set = new Set();
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy - 1][vx - 1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy - 1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx - 1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br !== 1) continue;
      let g1, g2;
      if (br) {
        g1 = {
          x: vx + 0.5,
          y: vy
        };
        g2 = {
          x: vx,
          y: vy + 0.5
        };
      } else if (bl) {
        g1 = {
          x: vx - 0.5,
          y: vy
        };
        g2 = {
          x: vx,
          y: vy + 0.5
        };
      } else if (tr) {
        g1 = {
          x: vx + 0.5,
          y: vy
        };
        g2 = {
          x: vx,
          y: vy - 0.5
        };
      } else {
        g1 = {
          x: vx - 0.5,
          y: vy
        };
        g2 = {
          x: vx,
          y: vy - 0.5
        };
      }
      const gi1 = pointToGapIdx(g1.x, g1.y, gaps);
      const gi2 = pointToGapIdx(g2.x, g2.y, gaps);
      if (gi1 >= 0) set.add(gi1);
      if (gi2 >= 0) set.add(gi2);
    }
    return set;
  }, [cells, W, H, gaps]);

  // Nail positions
  const nailPositions = useMemo(() => {
    const nails = [];
    for (let i = 0; i < gaps.length; i++) {
      if (!cornerGapSet.has(i)) nails.push({
        x: gaps[i].x,
        y: gaps[i].y,
        type: 'edge'
      });
    }
    for (let vy = 0; vy <= H; vy++) for (let vx = 0; vx <= W; vx++) {
      const tl = vy > 0 && vx > 0 && cells[vy - 1][vx - 1] ? 1 : 0;
      const tr = vy > 0 && vx < W && cells[vy - 1][vx] ? 1 : 0;
      const bl = vy < H && vx > 0 && cells[vy][vx - 1] ? 1 : 0;
      const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
      if (tl + tr + bl + br === 1) nails.push({
        x: vx,
        y: vy,
        type: 'corner'
      });
    }
    return nails;
  }, [cells, W, H, gaps]);

  // Corner arcs
  const cornerArcs = useMemo(() => {
    const arcs = [];
    for (let vy = 0; vy <= H; vy++) {
      for (let vx = 0; vx <= W; vx++) {
        const tl = vy > 0 && vx > 0 && cells[vy - 1][vx - 1] ? 1 : 0;
        const tr = vy > 0 && vx < W && cells[vy - 1][vx] ? 1 : 0;
        const bl = vy < H && vx > 0 && cells[vy][vx - 1] ? 1 : 0;
        const br = vy < H && vx < W && cells[vy][vx] ? 1 : 0;
        if (tl + tr + bl + br !== 1) continue;
        let g1, g2, sweep;
        if (br) {
          g1 = {
            x: vx + 0.5,
            y: vy
          };
          g2 = {
            x: vx,
            y: vy + 0.5
          };
          sweep = 0;
        } else if (bl) {
          g1 = {
            x: vx - 0.5,
            y: vy
          };
          g2 = {
            x: vx,
            y: vy + 0.5
          };
          sweep = 1;
        } else if (tr) {
          g1 = {
            x: vx + 0.5,
            y: vy
          };
          g2 = {
            x: vx,
            y: vy - 0.5
          };
          sweep = 1;
        } else {
          g1 = {
            x: vx - 0.5,
            y: vy
          };
          g2 = {
            x: vx,
            y: vy - 0.5
          };
          sweep = 0;
        }
        const gi1 = pointToGapIdx(g1.x, g1.y, gaps);
        const gi2 = pointToGapIdx(g2.x, g2.y, gaps);
        const ci1 = gi1 >= 0 ? cycles.findIndex(c => c.gaps.has(gi1)) : -1;
        const ci2 = gi2 >= 0 ? cycles.findIndex(c => c.gaps.has(gi2)) : -1;
        let color = null;
        if (ci1 >= 0 && isCycleVisible(ci1)) color = getCycleColor(ci1);else if (ci2 >= 0 && isCycleVisible(ci2)) color = getCycleColor(ci2);
        if (!color) continue;
        const dx = toX(g2.x) - toX(g1.x),
          dy = toY(g2.y) - toY(g1.y);
        const r = Math.hypot(dx, dy) / 2;
        arcs.push({
          sx1: toX(g1.x),
          sy1: toY(g1.y),
          sx2: toX(g2.x),
          sy2: toY(g2.y),
          r,
          sweep,
          color
        });
      }
    }
    return arcs;
  }, [cells, W, H, gaps, cycles, isCycleVisible, getCycleColor, cellSz, toX, toY]);

  // Crossing coverage
  function getCoveredCrossings(pts) {
    const bsSet = new Set();
    const fsSet = new Set();
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg],
        p2 = pts[seg + 1];
      const sdx = Math.sign(p2.x - p1.x),
        sdy = Math.sign(p2.y - p1.y);
      if (sdx === 0 || sdy === 0) continue;
      const minX = Math.min(p1.x, p2.x),
        maxX = Math.max(p1.x, p2.x);
      const isBS = sdx === sdy;
      if (isBS) {
        const kVal = p1.y - p1.x;
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const cx = (mVal - kVal) / 2,
            cy = (mVal + kVal) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01) bsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      } else {
        const mVal = p1.y + p1.x;
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const cx = (mVal - kVal2) / 2,
            cy = (mVal + kVal2) / 2;
          if (cx > minX + 0.01 && cx < maxX - 0.01 && cy > 0.01 && cy < H - 0.01) fsSet.add(`${cx.toFixed(2)},${cy.toFixed(2)}`);
        }
      }
    }
    return {
      bsSet,
      fsSet
    };
  }
  function renderStrandSVG(pts, color, crossingMap) {
    const elements = [];
    const lineW = sw;
    const gap = strandMode === 'string' ? cellSz * 0.16 : sw / 2;
    for (let seg = 0; seg < pts.length - 1; seg++) {
      const p1 = pts[seg],
        p2 = pts[seg + 1];
      const sx1 = toX(p1.x),
        sy1 = toY(p1.y);
      const sx2 = toX(p2.x),
        sy2 = toY(p2.y);
      const ddx = sx2 - sx1,
        ddy = sy2 - sy1;
      const len = Math.hypot(ddx, ddy);
      if (len < 0.5) continue;
      const ux = ddx / len,
        uy = ddy / len;
      const sdx = Math.sign(p2.x - p1.x),
        sdy = Math.sign(p2.y - p1.y);
      const p1Edge = isOnBoundary(p1.x, p1.y, cells, W, H);
      const p2Edge = isOnBoundary(p2.x, p2.y, cells, W, H);
      const p1gi = pointToGapIdx(p1.x, p1.y, gaps);
      const p2gi = pointToGapIdx(p2.x, p2.y, gaps);
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (p1gi >= 0 && cornerGapSet.has(p1gi) && p2gi >= 0 && cornerGapSet.has(p2gi) && segLen < 1.1) continue;
      if (sdx === 0 || sdy === 0) {
        elements.push({
          type: 'strand',
          x1: sx1,
          y1: sy1,
          x2: sx2,
          y2: sy2,
          color,
          w: lineW,
          z: 2,
          edgeStart: p1Edge,
          edgeEnd: p2Edge
        });
        continue;
      }
      const isBS = sdx === sdy;
      const cuts = [];
      const minX = Math.min(p1.x, p2.x),
        maxX = Math.max(p1.x, p2.x);
      if (isBS) {
        const kVal = p1.y - p1.x;
        const ki = Math.round(kVal - 0.5);
        for (let mi = -1; mi <= W + H; mi++) {
          const mVal = mi + 0.5;
          const ix = (mVal - kVal) / 2,
            iy = (mVal + kVal) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 1) {
              if (!crossingMap || crossingMap.forBS.has(`${ix.toFixed(2)},${iy.toFixed(2)}`)) cuts.push({
                sx: toX(ix),
                sy: toY(iy)
              });
            }
          }
        }
      } else {
        const mVal = p1.y + p1.x;
        const mi = Math.round(mVal - 0.5);
        for (let ki = -W; ki <= H; ki++) {
          const kVal2 = ki + 0.5;
          const ix = (mVal - kVal2) / 2,
            iy = (mVal + kVal2) / 2;
          if (ix > minX + 0.01 && ix < maxX - 0.01 && iy > 0.01 && iy < H - 0.01) {
            if ((ki + mi + W) % 2 === 0) {
              if (!crossingMap || crossingMap.forFS.has(`${ix.toFixed(2)},${iy.toFixed(2)}`)) cuts.push({
                sx: toX(ix),
                sy: toY(iy)
              });
            }
          }
        }
      }
      cuts.sort((a, b) => (a.sx - sx1) * ux + (a.sy - sy1) * uy - ((b.sx - sx1) * ux + (b.sy - sy1) * uy));
      let cx = sx1,
        cy = sy1;
      let isFirst = true;
      for (const cut of cuts) {
        const gsx = cut.sx - ux * gap,
          gsy = cut.sy - uy * gap;
        const proj = (gsx - cx) * ux + (gsy - cy) * uy;
        if (proj > 0.5) elements.push({
          type: 'strand',
          x1: cx,
          y1: cy,
          x2: gsx,
          y2: gsy,
          color,
          w: lineW,
          z: 2,
          edgeStart: isFirst && p1Edge,
          edgeEnd: false
        });
        cx = cut.sx + ux * gap;
        cy = cut.sy + uy * gap;
        isFirst = false;
      }
      const projEnd = (sx2 - cx) * ux + (sy2 - cy) * uy;
      if (projEnd > 0.5) elements.push({
        type: 'strand',
        x1: cx,
        y1: cy,
        x2: sx2,
        y2: sy2,
        color,
        w: lineW,
        z: 2,
        edgeStart: isFirst && p1Edge,
        edgeEnd: p2Edge
      });
    }
    return elements;
  }
  const renderElements = useMemo(() => {
    try {
      const cycleCrossings = [];
      for (let i = 0; i < cycles.length; i++) {
        const pts = isCycleVisible(i) ? cycles[i].points : [];
        cycleCrossings.push(pts.length >= 2 ? getCoveredCrossings(pts) : {
          bsSet: new Set(),
          fsSet: new Set()
        });
      }
      const allBS = new Set(),
        allFS = new Set();
      for (let j = 0; j < cycles.length; j++) {
        for (const k of cycleCrossings[j].bsSet) allBS.add(k);
        for (const k of cycleCrossings[j].fsSet) allFS.add(k);
      }
      const crossingMap = {
        forBS: allFS,
        forFS: allBS
      };
      const arcLen = pts => {
        let t = 0;
        for (let s = 0; s < pts.length - 1; s++) t += Math.hypot(pts[s + 1].x - pts[s].x, pts[s + 1].y - pts[s].y);
        return t;
      };
      const splitPtsAtArc = (pts, arc) => {
        if (pts.length < 2 || arc <= 0) return [[], pts];
        let acc = 0;
        for (let s = 0; s < pts.length - 1; s++) {
          const d = Math.hypot(pts[s + 1].x - pts[s].x, pts[s + 1].y - pts[s].y);
          if (acc + d >= arc) {
            const t = (arc - acc) / d;
            const split = {
              x: pts[s].x + (pts[s + 1].x - pts[s].x) * t,
              y: pts[s].y + (pts[s + 1].y - pts[s].y) * t
            };
            return [pts.slice(0, s + 1).concat([split]), [split].concat(pts.slice(s + 1))];
          }
          acc += d;
        }
        return [pts, []];
      };
      const els = [];
      for (let i = 0; i < cycles.length; i++) {
        if (!isCycleVisible(i)) continue;
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
    } catch (e) {
      console.error('RENDER ERROR:', e);
      return [];
    }
  }, [cycles, isCycleVisible, cells, W, H, cellSz, toX, toY, sw, cycleColors, cycleSecondary, strandMode]);

  // String stats
  const stringStats = useMemo(() => {
    const stats = [];
    let totalLen = 0;
    for (let i = 0; i < cycles.length; i++) {
      const pts = cycles[i].points;
      if (!pts || pts.length < 2) {
        stats.push(null);
        continue;
      }
      let len = 0;
      for (let s = 0; s < pts.length - 1; s++) len += Math.hypot(pts[s + 1].x - pts[s].x, pts[s + 1].y - pts[s].y);
      const c1 = getCycleColor(i);
      const c2 = cycleSecondary[i] || null;
      const half = len * 0.5;
      stats.push({
        len,
        c1,
        c2,
        firstLen: c2 ? half : len,
        secondLen: c2 ? half : 0
      });
      totalLen += len;
    }
    const byColor = {};
    for (const s of stats) {
      if (!s) continue;
      byColor[s.c1] = (byColor[s.c1] || 0) + s.firstLen;
      if (s.c2) byColor[s.c2] = (byColor[s.c2] || 0) + s.secondLen;
    }
    return {
      perCycle: stats,
      totalLen,
      byColor
    };
  }, [cycles, getCycleColor, cycleSecondary]);

  /** Per-cycle share of total string length — answers “8 cycles but two hog the length?” */
  const cycleBalance = useMemo(() => {
    const {
      perCycle,
      totalLen
    } = stringStats;
    if (cycles.length === 0 || totalLen <= 0) return null;
    const pcts = cycles.map((_, i) => {
      const s = perCycle[i];
      if (!s || !s.len) return 0;
      return s.len / totalLen * 100;
    });
    const minP = Math.min(...pcts);
    const maxP = Math.max(...pcts);
    const spread = maxP - minP;
    const fair = spread <= 12;
    const summary = fair ? T.balanced((100 / cycles.length).toFixed(0)) : T.unbalanced(minP.toFixed(0), maxP.toFixed(0));
    // Balance rating: green / orange / red
    let rating = 'red';
    if (cycles.length === 2) rating = 'green';else if (fair) rating = 'green';else if (spread <= 25) rating = 'orange';
    const ratingColor = rating === 'green' ? '#4aaa78' : rating === 'orange' ? '#d4a03c' : '#c85050';
    return {
      pcts,
      minP,
      maxP,
      spread,
      fair,
      summary,
      rating,
      ratingColor
    };
  }, [stringStats, cycles, T]);
  const clickGap = useCallback(g => {
    const ci = cycles.findIndex(c => c.gaps.has(g));
    if (ci < 0) return;
    setSelGap(g);
    if (showAll) setShowAll(false);
    setVisibleCycles(prev => ({
      ...prev,
      [ci]: true
    }));
  }, [cycles, showAll]);

  // Boundary edges
  const boundaryEdges = useMemo(() => {
    return edges.map(e => {
      if (e.type === 'h') return {
        x1: toX(e.x0),
        y1: toY(e.y),
        x2: toX(e.x1),
        y2: toY(e.y)
      };
      return {
        x1: toX(e.x),
        y1: toY(e.y0),
        x2: toX(e.x),
        y2: toY(e.y1)
      };
    });
  }, [edges, toX, toY]);

  // Edge-run labels
  const edgeRuns = useMemo(() => {
    const isOn = (x, y) => x >= 0 && y >= 0 && x < gridW && y < gridH && !!cells[y]?.[x];
    const runs = [];
    for (let y = 0; y <= gridH; y++) {
      let s = null,
        filledAbove = false;
      for (let x = 0; x <= gridW; x++) {
        const a = isOn(x, y - 1),
          b = isOn(x, y);
        const isEdge = x < gridW && a !== b;
        if (isEdge) {
          if (s === null) {
            s = x;
            filledAbove = a;
          }
        } else if (s !== null) {
          runs.push({
            orient: "h",
            y,
            x0: s,
            x1: x,
            len: x - s,
            filledAbove
          });
          s = null;
        }
      }
    }
    for (let x = 0; x <= gridW; x++) {
      let s = null,
        filledLeft = false;
      for (let y = 0; y <= gridH; y++) {
        const a = isOn(x - 1, y),
          b = isOn(x, y);
        const isEdge = y < gridH && a !== b;
        if (isEdge) {
          if (s === null) {
            s = y;
            filledLeft = a;
          }
        } else if (s !== null) {
          runs.push({
            orient: "v",
            x,
            y0: s,
            y1: y,
            len: y - s,
            filledLeft
          });
          s = null;
        }
      }
    }
    return runs;
  }, [cells, gridW, gridH]);

  // Editor pointer handling
  const editorBaseCellSize = useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 400;
    const availW = isLandscape ? Math.max(220, Math.min(w * 0.5 - 28, 720)) : Math.min(w - 24, 600);
    return Math.max(28, Math.floor(availW / gridW));
  }, [gridW, isLandscape]);
  const [editorZoom, setEditorZoom] = useState(1);
  const editorCellSize = Math.round(editorBaseCellSize * editorZoom);
  /** Padding around the cell grid so edge length badges sit outside the frame and are not clipped. */
  const editorEdgePad = useMemo(() => Math.max(24, Math.min(48, Math.round(editorCellSize * 0.58))), [editorCellSize]);
  const editorRef = useRef(null);
  const editorScrollWrapRef = useRef(null);
  const editorZoomRef = useRef(1);
  editorZoomRef.current = editorZoom;
  const editPinchGestureRef = useRef(null);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const EDITOR_SCROLL_STEP = 72;
  const scrollEditorGrid = useCallback((dx, dy) => {
    const el = editorScrollWrapRef.current;
    if (!el) return;
    el.scrollBy({
      left: dx,
      top: dy,
      behavior: "auto"
    });
  }, []);
  useEffect(() => {
    const el = editorScrollWrapRef.current;
    if (!el) return;
    const captureTwoFinger = e => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const t0 = e.touches[0],
        t1 = e.touches[1];
      const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      if (d < 8) return;
      editPinchGestureRef.current = {
        d,
        z: editorZoomRef.current
      };
    };
    const onTouchStart = e => {
      captureTwoFinger(e);
    };
    const onTouchMove = e => {
      if (e.touches.length === 2) {
        if (!editPinchGestureRef.current) captureTwoFinger(e);
        if (!editPinchGestureRef.current) return;
        e.preventDefault();
        const t0 = e.touches[0],
          t1 = e.touches[1];
        const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const scale = d / editPinchGestureRef.current.d;
        setEditorZoom(Math.max(0.25, Math.min(4, editPinchGestureRef.current.z * scale)));
      }
    };
    const onTouchEnd = e => {
      if (e.touches.length < 2) editPinchGestureRef.current = null;
    };
    el.addEventListener("touchstart", onTouchStart, {
      passive: false,
      capture: true
    });
    el.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true
    });
    el.addEventListener("touchend", onTouchEnd, {
      capture: true
    });
    el.addEventListener("touchcancel", onTouchEnd, {
      capture: true
    });
    return () => {
      el.removeEventListener("touchstart", onTouchStart, {
        capture: true
      });
      el.removeEventListener("touchmove", onTouchMove, {
        capture: true
      });
      el.removeEventListener("touchend", onTouchEnd, {
        capture: true
      });
      el.removeEventListener("touchcancel", onTouchEnd, {
        capture: true
      });
    };
  }, [activeTab]);
  const getCellFromPointer = useCallback(e => {
    const rect = editorRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return null;
    const px = clientX - rect.left - editorEdgePad;
    const py = clientY - rect.top - editorEdgePad;
    const x = Math.floor(px / editorCellSize);
    const y = Math.floor(py / editorCellSize);
    if (x >= 0 && x < gridW && y >= 0 && y < gridH) return {
      x,
      y
    };
    return null;
  }, [editorCellSize, editorEdgePad, gridW, gridH]);
  const onEditorPointerDown = useCallback(e => {
    if (e.pointerType === "touch" && e.isPrimary === false) return;
    e.preventDefault();
    editorRef.current?.setPointerCapture?.(e.pointerId);
    const c = getCellFromPointer(e);
    if (!c) return;
    const val = !cellsRef.current[c.y][c.x];
    setMarquee({
      x0: c.x,
      y0: c.y,
      x1: c.x,
      y1: c.y,
      val
    });
  }, [getCellFromPointer]);
  const onEditorPointerMove = useCallback(e => {
    if (!marquee) return;
    const rect = editorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const px = clientX - rect.left - editorEdgePad;
    const py = clientY - rect.top - editorEdgePad;
    const x = Math.max(0, Math.min(gridW - 1, Math.floor(px / editorCellSize)));
    const y = Math.max(0, Math.min(gridH - 1, Math.floor(py / editorCellSize)));
    if (x === marquee.x1 && y === marquee.y1) return;
    setMarquee({
      ...marquee,
      x1: x,
      y1: y
    });
  }, [marquee, editorCellSize, editorEdgePad, gridW, gridH]);
  const onEditorPointerUp = useCallback(() => {
    if (!marquee) return;
    const {
      x0,
      y0,
      x1,
      y1,
      val
    } = marquee;
    const xa = Math.min(x0, x1),
      xb = Math.max(x0, x1);
    const ya = Math.min(y0, y1),
      yb = Math.max(y0, y1);
    setCells(prev => prev.map((row, y) => row.map((c, x) => x >= xa && x <= xb && y >= ya && y <= yb ? val : c)));
    setSelGap(null);
    setShowAll(true);
    setMarquee(null);
  }, [marquee]);
  const landscapeSplit = isLandscape;
  const knotViewportEl = /*#__PURE__*/React.createElement("div", {
    ref: knotWrapRef,
    className: "knot-viewport",
    onWheel: e => setZoom(z => Math.max(0.15, Math.min(5, z * (e.deltaY > 0 ? 0.92 : 1.09)))),
    style: {
      flex: 1,
      minHeight: 0,
      background: bgColor,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      touchAction: "none",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "knot-zoom-btns",
    style: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 10,
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setBgIndex(i => (i + 1) % BG_OPTIONS.length),
    title: T.changeBg,
    style: {
      width: 36,
      height: 36,
      background: BG_OPTIONS[(bgIndex + 1) % BG_OPTIONS.length],
      border: "1px solid var(--hair)",
      cursor: "pointer",
      fontFamily: "inherit",
      borderRadius: 4
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    },
    style: {
      width: 36,
      height: 36,
      background: "rgba(18,22,28,0.92)",
      border: "1px solid var(--hair)",
      color: "var(--accent-soft)",
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.8,
      cursor: "pointer",
      fontFamily: "inherit",
      borderRadius: 4
    }
  }, "100%"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoom(z => Math.max(0.15, +(z / 1.3).toFixed(2))),
    style: {
      width: 36,
      height: 36,
      background: "rgba(18,22,28,0.92)",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 18,
      cursor: "pointer",
      fontFamily: "inherit",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "-"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setZoom(z => Math.min(5, +(z * 1.3).toFixed(2))),
    style: {
      width: 36,
      height: 36,
      background: "rgba(18,22,28,0.92)",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 18,
      cursor: "pointer",
      fontFamily: "inherit",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "+"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowNails(v => !v),
    title: T.nailsTitle,
    style: {
      width: 36, height: 36,
      background: "rgba(18,22,28,0.92)",
      border: "1px solid " + (showNails ? "var(--accent)" : "var(--hair)"),
      color: showNails ? "var(--accent-soft)" : "var(--bone-dim)",
      fontSize: 13, cursor: "pointer", fontFamily: "inherit", borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center"
    }
  }, showNails ? "\u25c9" : "\u25cb"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStrandMode(m => m === 'thin' ? 'full' : m === 'full' ? 'string' : 'thin'),
    title: T.strandTitle,
    style: {
      height: 36, padding: "0 10px",
      background: "rgba(18,22,28,0.92)", border: "1px solid var(--hair)",
      color: "var(--accent-soft)", fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
      cursor: "pointer", fontFamily: "inherit", borderRadius: 4, textTransform: "uppercase"
    }
  }, T.strand[strandMode]), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlayerOpen(true),
    title: T.playTitle,
    style: {
      width: 36, height: 36,
      background: "rgba(18,22,28,0.92)", border: "1px solid var(--hair)",
      color: "var(--accent-soft)", fontSize: 13, cursor: "pointer",
      fontFamily: "inherit", borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center"
    }
  }, "\u25b6")), /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
    preserveAspectRatio: "xMidYMid meet",
    style: {
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
    id: "glo"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "2",
    result: "b"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "b"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), boundaryEdges.map((e, i) => /*#__PURE__*/React.createElement("line", {
    key: `be${i}`,
    x1: e.x1,
    y1: e.y1,
    x2: e.x2,
    y2: e.y2,
    stroke: "#2a2519",
    strokeWidth: 1.5
  })), renderElements.map((el, i) => /*#__PURE__*/React.createElement("line", {
    key: i,
    x1: el.x1,
    y1: el.y1,
    x2: el.x2,
    y2: el.y2,
    stroke: el.color,
    strokeWidth: el.w,
    strokeLinecap: "butt"
  })), cornerArcs.map((arc, i) => /*#__PURE__*/React.createElement("path", {
    key: `ca${i}`,
    d: `M${arc.sx1},${arc.sy1} A${arc.r},${arc.r} 0 0,${arc.sweep} ${arc.sx2},${arc.sy2}`,
    fill: "none",
    stroke: arc.color,
    strokeWidth: sw,
    strokeLinecap: "butt"
  })), renderElements.filter(el => el.type === 'strand' && (el.edgeStart || el.edgeEnd)).map((el, i) => {
    const r = el.w / 2;
    const caps = [];
    if (el.edgeStart) caps.push(/*#__PURE__*/React.createElement("circle", {
      key: `es${i}`,
      cx: el.x1,
      cy: el.y1,
      r: r,
      fill: el.color
    }));
    if (el.edgeEnd) caps.push(/*#__PURE__*/React.createElement("circle", {
      key: `ee${i}`,
      cx: el.x2,
      cy: el.y2,
      r: r,
      fill: el.color
    }));
    return caps;
  }), gapDots.map(g => {
    const sel = selGap === g.i;
    const ci = cycles.findIndex(c => c.gaps.has(g.i));
    const vis = ci >= 0 && isCycleVisible(ci);
    const col = vis && ci >= 0 ? getCycleColor(ci) : "#2e2920";
    return /*#__PURE__*/React.createElement("g", {
      key: `g${g.i}`
    }, /*#__PURE__*/React.createElement("circle", {
      cx: g.x,
      cy: g.y,
      r: gr * 2.5,
      fill: "transparent",
      style: {
        cursor: "pointer"
      },
      onClick: () => clickGap(g.i)
    }), /*#__PURE__*/React.createElement("circle", {
      cx: g.x,
      cy: g.y,
      r: sel ? gr * 1.15 : gr * 0.65,
      fill: col,
      opacity: vis || sel ? 1 : 0.45,
      style: {
        pointerEvents: "none"
      },
      filter: sel ? "url(#glo)" : undefined
    }), sel && /*#__PURE__*/React.createElement("circle", {
      cx: g.x,
      cy: g.y,
      r: gr * 2,
      fill: "none",
      stroke: "var(--accent-soft)",
      strokeWidth: 1.2,
      opacity: 0.45,
      style: {
        pointerEvents: "none"
      }
    }));
  }), showNails && nailPositions.map((n, i) => /*#__PURE__*/React.createElement("circle", {
    key: `nail${i}`,
    cx: toX(n.x),
    cy: toY(n.y),
    r: 4,
    fill: n.type === 'corner' ? "#ff4444" : "#44ff44",
    opacity: 0.8,
    style: {
      pointerEvents: "none"
    }
  }))));
  const statsBarEl = /*#__PURE__*/React.createElement("div", {
    className: "stats-bar",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 12px",
      borderBottom: "1px solid var(--hair)",
      background: "var(--ink-2)",
      fontSize: 13,
      flexWrap: "wrap"
    }
  }, cycleBalance && /*#__PURE__*/React.createElement("button", {
    onClick: () => setBalanceOpen(o => !o),
    "aria-label": "Equil\u00edbrio dos fios",
    title: cycleBalance.summary,
    style: {
      width: 26,
      height: 26,
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: "50%",
      background: cycleBalance.ratingColor,
      display: "inline-block",
      boxShadow: `0 0 4px ${cycleBalance.ratingColor}80`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent-soft)",
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, cycles.length), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--bone-dim)",
      fontSize: 11
    }
  }, cycles.length === 1 ? T.fio : T.fios), selGap !== null && active && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--hair)"
    }
  }, "|"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#9a8e78",
      whiteSpace: "nowrap",
      fontSize: 11
    }
  }, active.gaps.size, " " + T.pregos)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLang(l => l === 'pt' ? 'en' : 'pt'),
    style: {
      marginLeft: "auto",
      background: "transparent",
      color: "var(--bone-dim)",
      border: "1px solid var(--hair)",
      borderRadius: 8,
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.6,
      padding: "6px 10px",
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, lang === 'pt' ? "EN" : "PT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveTab(activeTab === null ? 'edit' : null),
    style: {
      background: activeTab === null ? "var(--accent-fill)" : "transparent",
      color: activeTab === null ? "var(--accent-on-fill)" : "var(--bone-dim)",
      border: "1px solid var(--hair)",
      borderRadius: 8,
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.6,
      padding: "6px 10px",
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, activeTab === null ? T.voltar : T.soPadrao), balanceOpen && cycleBalance && /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      color: "var(--bone-dim)",
      fontSize: 11.5,
      paddingBottom: 3
    }
  }, cycleBalance.summary));
  const colourPickerEl = cycles.length > 0 && cycles.length <= 30 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 12px",
      borderTop: "1px solid var(--hair)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--bone-dim)",
      letterSpacing: 0.5,
      marginBottom: 6
    }
  }, T.tapHint), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, cycles.map((c, i) => {
    const col = getCycleColor(i);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: "relative",
        display: "inline-block"
      }
    }, /*#__PURE__*/React.createElement("button", {
      "data-palette-trigger": true,
      onClick: () => setPalettePopover(palettePopover?.i === i ? null : {
        i,
        kind: "primary"
      }),
      style: {
        width: 36,
        height: 36,
        borderRadius: 6,
        border: "2px solid var(--hair)",
        background: col,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "#000",
        fontFamily: "inherit"
      }
    }, i + 1), /*#__PURE__*/React.createElement("input", {
      type: "color",
      ref: el => {
        colorInputRefs.current[i] = el;
      },
      value: col,
      onChange: e => setCycleColor(i, e.target.value),
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none"
      }
    }), palettePopover && palettePopover.i === i && /*#__PURE__*/React.createElement("div", {
      "data-palette-pop": true,
      style: {
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 8,
        zIndex: 50,
        background: "var(--ink-2)",
        border: "1px solid var(--hair)",
        padding: 8,
        display: "grid",
        gridTemplateColumns: "repeat(7, 28px)",
        gap: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        borderRadius: 8
      }
    }, JOAO.map(s => /*#__PURE__*/React.createElement("button", {
      key: s.hex,
      title: s.name,
      onClick: () => {
        setCycleColor(i, s.hex);
        setPalettePopover(null);
      },
      style: {
        width: 28,
        height: 28,
        padding: 0,
        background: s.hex,
        border: "1px solid #00000050",
        cursor: "pointer",
        borderRadius: 4
      }
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        colorInputRefs.current[i]?.click();
        setPalettePopover(null);
      },
      style: {
        gridColumn: "span 7",
        marginTop: 2,
        background: "transparent",
        border: "1px solid var(--hair)",
        color: "var(--bone-dim)",
        fontSize: 10,
        padding: "6px",
        cursor: "pointer",
        letterSpacing: 1,
        fontFamily: "inherit",
        textTransform: "uppercase",
        borderRadius: 4
      }
    }, T.custom)));
  }))) : null;
  const cycleStripEl = cycles.length > 0 && cycles.length <= 30 ? /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: "1px solid var(--hair)",
      background: "var(--ink-2)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCycleStripOpen(o => !o),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 12px",
      background: "transparent",
      border: "none",
      color: "var(--bone-dim)",
      fontSize: 11,
      fontFamily: "inherit",
      cursor: "pointer",
      letterSpacing: 0.5
    }
  }, /*#__PURE__*/React.createElement("span", null, T.stripTitle, " (", cycles.length, ")"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, cycleStripOpen ? "▾" : "▸")), cycleStripOpen && /*#__PURE__*/React.createElement("div", {
    className: "cycle-strip",
    style: {
      padding: "4px 12px 8px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (showAll) {
        setShowAll(false);
        setSelGap(null);
        const hidden = {};
        cycles.forEach((_, i) => {
          hidden[i] = false;
        });
        setVisibleCycles(hidden);
      } else {
        setShowAll(true);
        setSelGap(null);
        setVisibleCycles({});
      }
    },
    className: "cycle-btn",
    style: {
      background: showAll ? "var(--accent-fill)" : "transparent",
      color: showAll ? "var(--accent-on-fill)" : "var(--bone-dim)",
      borderColor: showAll ? "var(--accent)" : "var(--hair)",
      fontSize: 10,
      letterSpacing: 1
    }
  }, T.all), cycles.map((c, i) => {
    const vis = isCycleVisible(i);
    const col = getCycleColor(i);
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      className: "cycle-btn",
      onClick: () => toggleCycle(i),
      style: {
        background: vis ? col : "transparent",
        color: vis ? "#000" : "#6a6050",
        borderColor: vis ? col : "#332e24",
        opacity: vis ? 1 : 0.5
      }
    }, i + 1);
  })), cycleStripOpen && colourPickerEl) : null;
  const tabPanelsEl = /*#__PURE__*/React.createElement(React.Fragment, null, activeTab === 'edit' && /*#__PURE__*/React.createElement("div", {
    className: "panel panel-edit",
    style: {
      padding: 12,
      background: "var(--ink-2)",
      borderBottom: "1px solid var(--hair)",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowHelp(h => !h),
    style: {
      background: "transparent",
      border: "1px solid var(--hair)",
      color: "var(--accent)",
      width: 28,
      height: 28,
      borderRadius: "50%",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "?"), showHelp && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "10px 12px",
      background: "rgba(232,196,120,0.08)",
      border: "1px solid var(--hair)",
      borderRadius: 8,
      fontSize: 12,
      lineHeight: 1.6,
      color: "var(--bone-dim)"
    }
  }, HELP[lang])), /*#__PURE__*/React.createElement("div", {
    className: "grid-size-toolbar"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "grid-size-toggle",
    onClick: toggleGridSizePanel,
    "aria-expanded": gridSizePanelOpen,
    "aria-controls": "grid-size-panel",
    id: "grid-size-toggle"
  }, /*#__PURE__*/React.createElement("span", null, T.tamanho, " ", /*#__PURE__*/React.createElement("span", {
    className: "grid-size-toggle__dims"
  }, gridW, "\xD7", gridH)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "grid-size-toggle__hint"
  }, gridSizePanelOpen ? T.hide : T.change), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      fontSize: 10,
      color: "var(--accent-soft)"
    }
  }, gridSizePanelOpen ? "▾" : "▸"))), gridSizePanelOpen && /*#__PURE__*/React.createElement("div", {
    className: "grid-size-panel-body",
    id: "grid-size-panel",
    role: "region",
    "aria-labelledby": "grid-size-toggle"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--bone-dim)",
      letterSpacing: 1
    }
  }, T.wLbl), /*#__PURE__*/React.createElement("div", {
    className: "stepper"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (gridW > 2) resizeGrid(gridW - 1, gridH);
    }
  }, "-"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "2",
    max: "100",
    value: editingW ? editW : gridW,
    onFocus: e => {
      setEditingW(true);
      setEditW(String(gridW));
      e.target.select();
    },
    onChange: e => {
      setEditW(e.target.value);
    },
    onBlur: e => {
      setEditingW(false);
      const v = parseInt(editW, 10);
      if (!isNaN(v) && v >= 2 && v <= 100) resizeGrid(v, gridH);
    },
    onKeyDown: e => {
      if (e.key === 'Enter') e.target.blur();
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (gridW < 100) resizeGrid(gridW + 1, gridH);
    }
  }, "+"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--bone-dim)",
      letterSpacing: 1
    }
  }, T.hLbl), /*#__PURE__*/React.createElement("div", {
    className: "stepper"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (gridH > 2) resizeGrid(gridW, gridH - 1);
    }
  }, "-"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "2",
    max: "100",
    value: editingH ? editH : gridH,
    onFocus: e => {
      setEditingH(true);
      setEditH(String(gridH));
      e.target.select();
    },
    onChange: e => {
      setEditH(e.target.value);
    },
    onBlur: e => {
      setEditingH(false);
      const v = parseInt(editH, 10);
      if (!isNaN(v) && v >= 2 && v <= 100) resizeGrid(gridW, v);
    },
    onKeyDown: e => {
      if (e.key === 'Enter') e.target.blur();
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (gridH < 100) resizeGrid(gridW, gridH + 1);
    }
  }, "+")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCells(Array.from({
        length: gridH
      }, () => Array(gridW).fill(true)));
    },
    style: {
      padding: "8px 14px",
      background: "transparent",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 12,
      letterSpacing: 1,
      cursor: "pointer",
      fontFamily: "inherit",
      textTransform: "uppercase"
    }
  }, T.fill), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCells(Array.from({
        length: gridH
      }, () => Array(gridW).fill(false)));
    },
    style: {
      padding: "8px 14px",
      background: "transparent",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 12,
      letterSpacing: 1,
      cursor: "pointer",
      fontFamily: "inherit",
      textTransform: "uppercase"
    }
  }, T.clear)))), /*#__PURE__*/React.createElement("div", {
    className: "editor-viewport-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "editor-toolbar-rows"
  }, /*#__PURE__*/React.createElement("div", {
    className: "editor-pan-zoom-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "editor-zoom-strip",
    role: "toolbar",
    "aria-label": "Zoom cell grid"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-zoom-step",
    "aria-label": "Zoom out",
    onClick: () => setEditorZoom(z => Math.max(0.25, +(z / 1.12).toFixed(3)))
  }, "\u2212"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-zoom-pct-btn",
    title: "Reset zoom to 100%",
    onClick: () => setEditorZoom(1)
  }, Math.round(editorZoom * 100), "%"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-zoom-step",
    "aria-label": "Zoom in",
    onClick: () => setEditorZoom(z => Math.min(4, +(z * 1.12).toFixed(3)))
  }, "+")), /*#__PURE__*/React.createElement("div", {
    className: "editor-dpad",
    role: "toolbar",
    "aria-label": "Pan cell view"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-dpad-btn",
    "aria-label": "Pan left",
    onClick: () => scrollEditorGrid(-EDITOR_SCROLL_STEP, 0)
  }, /*#__PURE__*/React.createElement("span", {
    className: "editor-dpad-btn__arrow",
    "aria-hidden": true
  }, "\u25C0")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-dpad-btn",
    "aria-label": "Pan up",
    onClick: () => scrollEditorGrid(0, -EDITOR_SCROLL_STEP)
  }, /*#__PURE__*/React.createElement("span", {
    className: "editor-dpad-btn__arrow",
    "aria-hidden": true
  }, "\u25B2")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-dpad-btn",
    "aria-label": "Pan down",
    onClick: () => scrollEditorGrid(0, EDITOR_SCROLL_STEP)
  }, /*#__PURE__*/React.createElement("span", {
    className: "editor-dpad-btn__arrow",
    "aria-hidden": true
  }, "\u25BC")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "editor-dpad-btn",
    "aria-label": "Pan right",
    onClick: () => scrollEditorGrid(EDITOR_SCROLL_STEP, 0)
  }, /*#__PURE__*/React.createElement("span", {
    className: "editor-dpad-btn__arrow",
    "aria-hidden": true
  }, "\u25B6"))))), /*#__PURE__*/React.createElement("div", {
    ref: editorScrollWrapRef,
    className: "editor-scroll-wrap",
    onTouchStart: e => {
      if (e.touches.length >= 2) setMarquee(null);
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: editorRef,
    onPointerDown: onEditorPointerDown,
    onPointerMove: onEditorPointerMove,
    onPointerUp: onEditorPointerUp,
    onPointerCancel: onEditorPointerUp,
    style: {
      position: "relative",
      display: "inline-block",
      padding: editorEdgePad,
      userSelect: "none",
      touchAction: "none",
      cursor: "crosshair"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-grid",
      gridTemplateColumns: `repeat(${gridW}, ${editorCellSize}px)`,
      border: "2px solid #3a4a55",
      borderRadius: 4,
      background: "#0a0e14",
      boxShadow: "inset 0 0 0 1px rgba(120,150,165,0.1)",
      position: "relative",
      width: gridW * editorCellSize,
      minWidth: gridW * editorCellSize
    }
  }, cells.flatMap((row, y) => row.map((on, x) => /*#__PURE__*/React.createElement("div", {
    key: `${x},${y}`,
    style: {
      width: editorCellSize,
      height: editorCellSize,
      background: on ? "#2a4a3a" : "#12161c",
      border: "1px solid #252d36"
    }
  }))), edgeRuns.map((r, i) => {
    if (r.orient === "h") {
      return /*#__PURE__*/React.createElement("div", {
        key: `eb-h${i}`,
        style: {
          position: "absolute",
          pointerEvents: "none",
          zIndex: 2,
          left: r.x0 * editorCellSize,
          top: r.y * editorCellSize - 1.5,
          width: (r.x1 - r.x0) * editorCellSize,
          height: 3,
          background: "linear-gradient(180deg, #5c726c 0%, #3d4e49 100%)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.35)"
        }
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      key: `eb-v${i}`,
      style: {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 2,
        left: r.x * editorCellSize - 1.5,
        top: r.y0 * editorCellSize,
        width: 3,
        height: (r.y1 - r.y0) * editorCellSize,
        background: "linear-gradient(90deg, #5c726c 0%, #3d4e49 100%)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.35)"
      }
    });
  }), edgeRuns.map((r, i) => {
    const badgeFont = Math.max(11, Math.min(17, Math.round(editorCellSize * 0.38)));
    const hOff = Math.max(12, Math.round(editorCellSize * 0.34));
    const vOff = Math.max(11, Math.round(editorCellSize * 0.3));
    const labelStyle = {
      position: "absolute",
      pointerEvents: "none",
      zIndex: 3,
      fontSize: badgeFont,
      fontFamily: "inherit",
      fontWeight: 700,
      color: "#a8bcc8",
      lineHeight: 1,
      letterSpacing: 0.3,
      textShadow: "0 1px 3px rgba(0,0,0,0.7)"
    };
    if (r.orient === "h") {
      const cx = (r.x0 + r.x1) / 2 * editorCellSize;
      const edgeY = r.y * editorCellSize;
      const top = edgeY + (r.filledAbove ? hOff : -hOff);
      return /*#__PURE__*/React.createElement("div", {
        key: `h${i}`,
        style: {
          ...labelStyle,
          left: cx,
          top,
          transform: "translate(-50%, -50%)"
        }
      }, r.len);
    }
    const cy = (r.y0 + r.y1) / 2 * editorCellSize;
    const edgeX = r.x * editorCellSize;
    const left = edgeX + (r.filledLeft ? vOff : -vOff);
    return /*#__PURE__*/React.createElement("div", {
      key: `v${i}`,
      style: {
        ...labelStyle,
        left,
        top: cy,
        transform: "translate(-50%, -50%)"
      }
    }, r.len);
  }), marquee && (() => {
    const xa = Math.min(marquee.x0, marquee.x1),
      xb = Math.max(marquee.x0, marquee.x1);
    const ya = Math.min(marquee.y0, marquee.y1),
      yb = Math.max(marquee.y0, marquee.y1);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 4,
        left: xa * editorCellSize,
        top: ya * editorCellSize,
        width: (xb - xa + 1) * editorCellSize,
        height: (yb - ya + 1) * editorCellSize,
        background: marquee.val ? "rgba(74,170,120,0.25)" : "rgba(200,80,80,0.22)",
        border: `1px solid ${marquee.val ? "#4aaa78" : "#c85050"}`
      }
    });
  })()))))), activeTab === 'shapes' && /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      padding: 12,
      background: "var(--ink-2)",
      borderBottom: "1px solid var(--hair)"
    }
  }, cycleStripEl, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      marginBottom: 10,
      flexWrap: "wrap",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: saveCurrentShape,
    style: {
      padding: "10px 16px",
      background: "var(--accent-fill)",
      color: "var(--accent-on-fill)",
      border: "1px solid var(--edge)",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 1.4,
      cursor: "pointer",
      fontFamily: "inherit",
      textTransform: "uppercase"
    }
  }, T.save), /*#__PURE__*/React.createElement("button", {
    onClick: exportShapes,
    style: {
      padding: "10px 16px",
      background: "transparent",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 12,
      letterSpacing: 1,
      cursor: "pointer",
      fontFamily: "inherit",
      textTransform: "uppercase"
    }
  }, T.exportar), /*#__PURE__*/React.createElement("button", {
    onClick: () => importFileRef.current?.click(),
    style: {
      padding: "10px 16px",
      background: "transparent",
      border: "1px solid var(--hair)",
      color: "var(--bone-dim)",
      fontSize: 12,
      letterSpacing: 1,
      cursor: "pointer",
      fontFamily: "inherit",
      textTransform: "uppercase"
    }
  }, T.importar), /*#__PURE__*/React.createElement("input", {
    ref: importFileRef,
    type: "file",
    accept: "application/json",
    onChange: onImportFile,
    style: {
      display: "none"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, ['rectangle', 'L-shape', 'staircase-boot', 'cross'].map(name => /*#__PURE__*/React.createElement("span", {
    key: name,
    className: "knm-chip",
    onClick: () => {
      const s = makePreset(name, gridW, gridH);
      setCells(s.cells);
      setGridW(s.gw);
      setGridH(s.gh);
      setSelGap(null);
      setShowAll(true);
      setCycleColors({});
      setVisibleCycles({});
    }
  }, T.presets[name] || name))), savedShapes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 10
    }
  }, savedShapes.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.name,
    className: "knm-chip",
    onClick: () => loadShape(s)
  }, /*#__PURE__*/React.createElement("span", null, s.name), /*#__PURE__*/React.createElement("button", {
    className: "knm-chip-x",
    onClick: e => {
      e.stopPropagation();
      if (window.confirm(T.deleteConfirm(s.name))) deleteShape(s.name);
    }
  }, "x"))))), activeTab === 'fios' && /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      padding: 12,
      background: "var(--ink-2)",
      borderBottom: "1px solid var(--hair)"
    }
  }, cycleStripEl, cycleBalance && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--bone-dim)",
      padding: "8px 2px 2px",
      lineHeight: 1.5
    }
  }, cycleBalance.summary), stringStats.totalLen > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      borderTop: "1px solid var(--hair)",
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--accent-soft)",
      marginBottom: 8
    }
  }, T.totalLen, (stringStats.totalLen * 15 / 10).toFixed(0), "cm"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, Object.entries(stringStats.byColor).sort(([, a], [, b]) => b - a).map(([hex, len], rank) => {
    const pct = (len / stringStats.totalLen * 100).toFixed(0);
    const name = JOAO.find(j => j.hex === hex)?.name || hex;
    return /*#__PURE__*/React.createElement("div", {
      key: hex,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        background: hex,
        display: "inline-block",
        borderRadius: 2,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        color: "var(--bone-dim)"
      }
    }, name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--bone-dim)"
      }
    }, (len * 15 / 10).toFixed(0), "cm"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--accent-soft)",
        minWidth: 36,
        textAlign: "right"
      }
    }, pct, "%"));
  })))));

  // ========== RENDER ==========
  return /*#__PURE__*/React.createElement("div", {
    className: "app-shell"
  }, landscapeSplit ? /*#__PURE__*/React.createElement("div", {
    className: "land-split land-tab-" + (activeTab || "none")
  }, /*#__PURE__*/React.createElement("div", {
    className: "land-split-main",
    style: {
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }
  }, statsBarEl, tabPanelsEl, activeTab !== 'fios' && cycleStripEl), /*#__PURE__*/React.createElement("div", {
    className: "land-split-knot"
  }, knotViewportEl)) : activeTab === 'edit' ? /*#__PURE__*/React.createElement("div", {
    className: "edit-tab-scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "edit-portrait-main"
  }, statsBarEl, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, tabPanelsEl)), /*#__PURE__*/React.createElement("div", {
    className: "knot-below-editor"
  }, knotViewportEl)) : /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }
  }, statsBarEl, tabPanelsEl, knotViewportEl), playerOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      background: "rgba(9,12,15,0.97)",
      display: "flex", flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderBottom: "1px solid var(--hair)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: "var(--accent-soft)" }
  }, T.playTitle), /*#__PURE__*/React.createElement("button", {
    onClick: () => { const a = playerApiRef.current; if (a) { a.restart(); a.play(); } },
    style: {
      marginLeft: "auto", padding: "8px 14px", background: "transparent",
      border: "1px solid var(--hair)", borderRadius: 8, color: "var(--bone-dim)",
      fontSize: 12, letterSpacing: 0.6, cursor: "pointer", fontFamily: "inherit"
    }
  }, "\u21bb " + T.playAgain), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlayerOpen(false),
    "aria-label": T.playClose,
    style: {
      width: 38, height: 38, background: "transparent",
      border: "1px solid var(--hair)", borderRadius: 8, color: "var(--bone)",
      fontSize: 16, cursor: "pointer", fontFamily: "inherit"
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    ref: playerBoxRef,
    style: { flex: 1, minHeight: 0 }
  })), /*#__PURE__*/React.createElement("div", {
    className: "tab-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === 'edit' ? 'active' : ''}`,
    onClick: () => setActiveTab(activeTab === 'edit' ? null : 'edit')
  }, T.tabDesenhar), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === 'fios' ? 'active' : ''}`,
    onClick: () => setActiveTab(activeTab === 'fios' ? null : 'fios')
  }, T.tabFios), /*#__PURE__*/React.createElement("button", {
    className: `tab-btn ${activeTab === 'shapes' ? 'active' : ''}`,
    onClick: () => setActiveTab(activeTab === 'shapes' ? null : 'shapes')
  }, T.tabGuardadas)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(KnotMakerMobile, null));
