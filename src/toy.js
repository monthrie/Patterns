/*
 * TearToy v2 — the quiet weaving game.
 * Draw a board → discover how many strings your shape was hiding (gcd for
 * rectangles, an open problem for everything else) → watch the pull → dye,
 * name, keep → the wall (browse by string count) → share cards & links.
 * Once a year João picks one weave from the wall and makes it real.
 * Vanilla JS; requires TearEngine, TearPlayer, TearCode.
 */
(function (global) {
  'use strict';
  const E = global.TearEngine, P = global.TearPlayer, C = global.TearCode;

  const BG = '#0b0f13';
  const DYE = E.JOAO.filter(c => c.name !== 'Preto'); // Preto is invisible on the ink board
  const WALL_KEY = 'toy.wall.v1';
  const HUNT_KEY = 'toy.hunts.v1';
  const SPACING_CM = 1.5;            // nail spacing — same default as A Oficina
  const DEFAULT_GW = 13, DEFAULT_GH = 9;
  const MAX_GW = 20, MAX_GH = 14;

  // Curated wall seeds (design codes carry shape + colours).
  const SEEDS = [
    { name: 'the cushion', n: 5, joao: true, code: 'T1-AQ8K_________________________AVtLEA' },
    { name: 'seven', n: 7, code: 'T1-AQwI_________w_w_wfwBxZNi-A' },
    { name: 'the courtyard', n: 6, code: 'T1-AQwJ______8P8P8P______AG4lw6' },
    { name: 'the stairs', n: 5, code: 'T1-AQwJ8A-A_A_g_w_4_8_-__AFSdHA' },
    { name: 'the bite', n: 4, code: 'T1-AQ8H__________f_7__f_4AEgus' },
    { name: 'the nick', n: 3, code: 'T1-AQwH___________-_-ADOsA' },
    { name: 'the frame', n: 2, code: 'T1-AQ0J_______AfgPwH______4AtE' },
    { name: 'one circle', n: 1, code: 'T1-AREK____________________________wAFQ' },
    { name: 'the square paradox', n: 6, code: 'T1-AQYG______AGZDzq' },
  ];

  const HUNTS = [
    { id: 'seven', label: 'draw a board that needs exactly 7 strings', test: r => r.n === 7 },
    { id: 'holed-one', label: 'one string, on a board with a hole', test: r => r.n === 1 && hasHole(r.cells) },
    { id: 'five-small', label: 'five strings on fewer than 30 cells', test: r => r.n === 5 && countCells(r.cells) < 30 },
  ];

  const $ = id => document.getElementById(id);
  const views = { draw: $('view-draw'), weave: $('view-weave'), wall: $('view-wall') };
  const boardEl = $('board');
  const panelEl = $('panel');
  const wallEl = $('wall');
  const filtersEl = $('filters');
  const editorEl = $('editor');
  const countNumEl = $('count-num');
  const countLineEl = $('count-line');
  const weaveBtn = $('weave-btn');
  const huntsEl = $('hunts');

  // ---------- tiny DOM helper ----------
  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.style.cssText = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    for (const kid of kids) if (kid !== null && kid !== undefined) n.append(kid);
    return n;
  }

  const plural = n => (n === 1 ? 'string' : 'strings');
  const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function randomColors(n) {
    const s = shuffled(DYE);
    const out = [];
    for (let i = 0; i < n; i++) out.push(s[i % s.length].hex);
    return out;
  }

  function countCells(cells) {
    let k = 0;
    for (const row of cells) for (const c of row) if (c) k++;
    return k;
  }

  // A hole = an empty region not connected to the outside border.
  function hasHole(cells) {
    const gh = cells.length, gw = cells[0].length;
    const seen = Array.from({ length: gh }, () => new Array(gw).fill(false));
    const queue = [];
    for (let x = 0; x < gw; x++) {
      if (!cells[0][x]) queue.push([x, 0]);
      if (!cells[gh - 1][x]) queue.push([x, gh - 1]);
    }
    for (let y = 0; y < gh; y++) {
      if (!cells[y][0]) queue.push([0, y]);
      if (!cells[y][gw - 1]) queue.push([gw - 1, y]);
    }
    while (queue.length) {
      const [x, y] = queue.pop();
      if (x < 0 || y < 0 || x >= gw || y >= gh || seen[y][x] || cells[y][x]) continue;
      seen[y][x] = true;
      queue.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    }
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      if (!cells[y][x] && !seen[y][x]) return true;
    }
    return false;
  }

  function cropCells(cells) {
    const gh = cells.length, gw = cells[0].length;
    let x0 = gw, x1 = -1, y0 = gh, y1 = -1;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      if (cells[y][x]) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return null;
    x1 = Math.max(x1, x0 + 1); y1 = Math.max(y1, y0 + 1); // codes need gw,gh >= 2
    const out = [];
    for (let y = y0; y <= y1; y++) out.push(cells[y].slice(x0, x1 + 1));
    return out;
  }

  // ---------- the drawing canvas ----------
  const draw = {
    gw: DEFAULT_GW, gh: DEFAULT_GH,
    cells: null,
    undo: [],
    cellEls: [],
    n: 0,
  };

  function seedShape(gw, gh) {
    // a centred rectangle that starts the game with a few strings
    const cells = Array.from({ length: gh }, () => new Array(gw).fill(false));
    const w = Math.min(9, gw - 2), hh = Math.min(6, gh - 2);
    const ox = Math.floor((gw - w) / 2), oy = Math.floor((gh - hh) / 2);
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) cells[oy + y][ox + x] = true;
    return cells;
  }

  function buildEditor() {
    editorEl.style.gridTemplateColumns = `repeat(${draw.gw}, 1fr)`;
    editorEl.style.aspectRatio = `${draw.gw} / ${draw.gh}`;
    editorEl.replaceChildren();
    draw.cellEls = [];
    for (let y = 0; y < draw.gh; y++) for (let x = 0; x < draw.gw; x++) {
      const c = h('div', { class: 'cell' + (draw.cells[y][x] ? ' on' : '') });
      draw.cellEls.push(c);
      editorEl.append(c);
    }
  }

  function setCell(x, y, val) {
    if (x < 0 || y < 0 || x >= draw.gw || y >= draw.gh) return;
    if (draw.cells[y][x] === val) return;
    draw.cells[y][x] = val;
    draw.cellEls[y * draw.gw + x].classList.toggle('on', val);
    scheduleRecount();
  }

  let recountQueued = false;
  function scheduleRecount() {
    if (recountQueued) return;
    recountQueued = true;
    requestAnimationFrame(() => { recountQueued = false; recount(); });
  }

  function recount() {
    const k = countCells(draw.cells);
    if (k === 0) {
      draw.n = 0;
      countLineEl.innerHTML = '';
      countLineEl.append('draw a shape — every cell changes the answer');
      weaveBtn.disabled = true;
      return;
    }
    const { cycles } = E.getAllCycles(draw.cells, draw.gw, draw.gh);
    const changed = cycles.length !== draw.n;
    draw.n = cycles.length;
    countLineEl.replaceChildren(
      h('b', { id: 'count-num' }, String(draw.n)),
      ` ${plural(draw.n)} hide in this shape`,
    );
    weaveBtn.disabled = false;
    if (changed) {
      const num = countLineEl.querySelector('b');
      num.classList.remove('pop');
      void num.offsetWidth;
      num.classList.add('pop');
    }
  }

  function pushUndo() {
    draw.undo.push(draw.cells.map(r => r.slice()));
    if (draw.undo.length > 60) draw.undo.shift();
  }
  function popUndo() {
    const prev = draw.undo.pop();
    if (!prev) return;
    draw.cells = prev;
    if (prev.length !== draw.gh || prev[0].length !== draw.gw) {
      draw.gh = prev.length; draw.gw = prev[0].length;
      buildEditor();
    } else {
      draw.cellEls.forEach((el, i) => el.classList.toggle('on', draw.cells[(i / draw.gw) | 0][i % draw.gw]));
    }
    scheduleRecount();
  }

  function loadIntoEditor(cells) {
    pushUndo();
    const sh = cells.length, sw = cells[0].length;
    draw.gw = Math.min(MAX_GW, Math.max(DEFAULT_GW, sw));
    draw.gh = Math.min(MAX_GH, Math.max(DEFAULT_GH, sh));
    draw.cells = Array.from({ length: draw.gh }, () => new Array(draw.gw).fill(false));
    const ox = Math.floor((draw.gw - sw) / 2), oy = Math.floor((draw.gh - sh) / 2);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const tx = ox + x, ty = oy + y;
      if (tx >= 0 && ty >= 0 && tx < draw.gw && ty < draw.gh) draw.cells[ty][tx] = !!cells[y][x];
    }
    buildEditor();
    scheduleRecount();
  }

  function diceShape() {
    pushUndo();
    const gw = draw.gw, gh = draw.gh;
    const cells = Array.from({ length: gh }, () => new Array(gw).fill(false));
    const w = 5 + Math.floor(Math.random() * (gw - 5));
    const hh = 4 + Math.floor(Math.random() * (gh - 4));
    const ox = Math.floor((gw - w) / 2), oy = Math.floor((gh - hh) / 2);
    for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) cells[oy + y][ox + x] = true;
    const bites = Math.floor(Math.random() * 3);
    for (let b = 0; b < bites; b++) {
      const corner = Math.floor(Math.random() * 4);
      const bw = 1 + Math.floor(Math.random() * Math.max(1, (w >> 1) - 1));
      const bh = 1 + Math.floor(Math.random() * Math.max(1, (hh >> 1) - 1));
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const cx = ox + ((corner & 1) ? w - 1 - x : x);
        const cy = oy + ((corner & 2) ? hh - 1 - y : y);
        cells[cy][cx] = false;
      }
    }
    if (Math.random() < 0.3 && w >= 7 && hh >= 5) {
      const hw = 2 + Math.floor(Math.random() * 2), hht = 1 + Math.floor(Math.random() * 2);
      const hx = ox + 2 + Math.floor(Math.random() * (w - hw - 3));
      const hy = oy + 2 + Math.floor(Math.random() * (hh - hht - 3));
      for (let y = 0; y < hht; y++) for (let x = 0; x < hw; x++) cells[hy + y][hx + x] = false;
    }
    draw.cells = cells;
    draw.cellEls.forEach((el, i) => el.classList.toggle('on', cells[(i / gw) | 0][i % gw]));
    scheduleRecount();
  }

  // pointer painting
  let painting = false, paintVal = true;
  function cellFromEvent(e) {
    const r = editorEl.getBoundingClientRect();
    return [
      Math.floor((e.clientX - r.left) / r.width * draw.gw),
      Math.floor((e.clientY - r.top) / r.height * draw.gh),
    ];
  }
  editorEl.addEventListener('pointerdown', e => {
    e.preventDefault();
    editorEl.setPointerCapture(e.pointerId);
    const [x, y] = cellFromEvent(e);
    if (x < 0 || y < 0 || x >= draw.gw || y >= draw.gh) return;
    pushUndo();
    painting = true;
    paintVal = !draw.cells[y][x];
    setCell(x, y, paintVal);
  });
  editorEl.addEventListener('pointermove', e => {
    if (!painting) return;
    const [x, y] = cellFromEvent(e);
    setCell(x, y, paintVal);
  });
  const stopPaint = () => { painting = false; };
  editorEl.addEventListener('pointerup', stopPaint);
  editorEl.addEventListener('pointercancel', stopPaint);

  $('undo-btn').addEventListener('click', popUndo);
  $('dice-btn').addEventListener('click', diceShape);
  $('clear-btn').addEventListener('click', () => {
    pushUndo();
    draw.cells = Array.from({ length: draw.gh }, () => new Array(draw.gw).fill(false));
    draw.cellEls.forEach(el => el.classList.remove('on'));
    scheduleRecount();
  });

  // ---------- hunts ----------
  function loadHunts() {
    try { return JSON.parse(localStorage.getItem(HUNT_KEY)) || {}; }
    catch { return {}; }
  }
  function renderHunts() {
    const done = loadHunts();
    huntsEl.replaceChildren(
      h('div', { class: 'g-label' }, 'hunts'),
      ...HUNTS.map(ht => h('div', { class: 'hunt' + (done[ht.id] ? ' done' : '') },
        h('span', { class: 'tick' }, done[ht.id] ? '✓' : '○'), ' ', ht.label)),
    );
  }
  function checkHunts(round) {
    const done = loadHunts();
    const fresh = [];
    for (const ht of HUNTS) {
      if (!done[ht.id] && ht.test(round)) { done[ht.id] = today(); fresh.push(ht); }
    }
    if (fresh.length) {
      try { localStorage.setItem(HUNT_KEY, JSON.stringify(done)); } catch { /* private mode */ }
      renderHunts();
    }
    return fresh;
  }

  // ---------- views ----------
  let view = 'draw';
  function setView(name) {
    view = name;
    for (const k in views) views[k].hidden = k !== name;
    document.querySelectorAll('#tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === name || (name === 'weave' && b.dataset.view === 'draw'));
    });
    if (name !== 'weave' && player) player.pause();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('#tabs button').forEach(b => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });

  // ---------- the weave (the pull + the dye shop) ----------
  let round = null;   // { cells, gw, gh, n, total, colors, name, date, mine, joao }
  let player = null;
  let revealed = false;

  function makeRound(cells, opts) {
    const gh = cells.length, gw = cells[0].length;
    const { cycles } = E.getAllCycles(cells, gw, gh);
    return Object.assign({
      cells, gw, gh,
      n: cycles.length,
      total: cycles.reduce((a, c) => a + E.arcLen(c.points), 0),
      colors: randomColors(cycles.length),
      name: '', date: today(), mine: false, joao: false,
    }, opts || {});
  }

  function mountPlayer() {
    if (player) player.destroy();
    revealed = false;
    const ratio = (round.gw + 2) / (round.gh + 2);
    boardEl.style.aspectRatio = `${round.gw + 2} / ${round.gh + 2}`;
    boardEl.style.maxWidth = `min(720px, calc(52vh * ${ratio.toFixed(4)}))`;
    boardEl.classList.remove('shimmer');
    const rawDur = Math.min(22, Math.max(6, round.total * 0.022));
    player = P.create(boardEl, {
      cells: round.cells, colors: round.colors, bg: BG,
      autoplay: false,
      speedFactor: Math.max(1, Math.min(2.4, rawDur / 9)),
      onDone: reveal,
    });
  }

  function goWeave(r, finished) {
    round = r;
    setView('weave');
    mountPlayer();
    if (finished) {
      player.finish();
      reveal();
    } else {
      showLaying();
      player.play();
    }
  }

  function showLaying() {
    const fastBtn = h('button', {
      class: 'btn', 'aria-pressed': 'false',
      onclick: () => {
        const fast = fastBtn.getAttribute('aria-pressed') !== 'true';
        fastBtn.setAttribute('aria-pressed', String(fast));
        player.setSpeed(fast ? 4 : 1);
      },
    }, '▸▸ faster');
    const skipBtn = h('button', {
      class: 'btn',
      onclick: () => { player.finish(); reveal(true); },
    }, '⇥ skip');
    panelEl.replaceChildren(
      h('div', { class: 'ask dim' }, 'laying the string…'),
      h('div', { class: 'row' }, fastBtn, skipBtn),
    );
  }

  function reveal(skipped) {
    if (revealed) return;
    revealed = true;
    if (!skipped && round.mine) {
      boardEl.classList.remove('shimmer');
      void boardEl.offsetWidth;
      boardEl.classList.add('shimmer');
    }

    const metres = (round.total * SPACING_CM / 100).toFixed(1);
    const lines = [
      h('div', { class: 'ask' }, `${round.n} ${plural(round.n)}.`),
      h('div', { class: 'meta-line' }, `${metres} m of cord · ${countCells(round.cells)} cells`),
    ];
    if (round.joao) {
      lines.push(h('div', { class: 'cert' }, 'woven in cotton by João — no stitches, no seams'));
    } else if (round.mine) {
      lines.push(h('div', { class: 'cert' }, `first traced by you · ${round.date}`));
    }
    if (round.mine) {
      for (const ht of checkHunts(round)) {
        lines.push(h('div', { class: 'cert' }, `hunt complete — ${ht.label} ✓`));
      }
    }

    const chips = round.colors.map((col, i) => {
      const b = h('button', {
        class: 'chip', style: `background:${col}`, title: `string ${i + 1}`,
        onclick: () => {
          const cur = DYE.findIndex(c => c.hex === round.colors[i]);
          round.colors[i] = DYE[(cur + 1) % DYE.length].hex;
          b.style.background = round.colors[i];
          player.setColors(round.colors);
        },
      });
      return b;
    });

    const shuffleBtn = h('button', {
      class: 'btn',
      onclick: () => {
        const before = JSON.stringify(round.colors);
        do { round.colors = randomColors(round.n); }
        while (JSON.stringify(round.colors) === before && DYE.length > 1);
        chips.forEach((c, i) => { c.style.background = round.colors[i]; });
        player.setColors(round.colors);
      },
    }, 'shuffle');

    const nameInput = h('input', {
      id: 'name-input', class: 'name-input', placeholder: 'name this weave',
      maxlength: '40', value: round.name || '',
      oninput: () => { round.name = nameInput.value; },
    });

    const keepBtn = h('button', {
      class: 'btn',
      onclick: () => {
        keepDesign();
        keepBtn.textContent = 'on the wall ✓';
        keepBtn.disabled = true;
      },
    }, 'keep');

    const linkBtn = h('button', { class: 'btn', onclick: () => shareLink(linkBtn) }, 'copy link');
    const cardBtn = h('button', { class: 'btn', onclick: () => shareCard(cardBtn) }, 'share card');
    const remixBtn = h('button', {
      class: 'btn next',
      onclick: () => {
        loadIntoEditor(round.cells);
        setView('draw');
      },
    }, round.mine ? 'edit shape →' : 'remix →');

    panelEl.replaceChildren(
      ...lines,
      h('div', { class: 'chips' }, ...chips),
      round.joao ? null : nameInput,
      h('div', { class: 'row' }, shuffleBtn, keepBtn, linkBtn, cardBtn, remixBtn),
    );
  }

  // ---------- the wall ----------
  function designCode() {
    const colors = {};
    round.colors.forEach((c, i) => { colors[i] = c; });
    return C.encodeDesign({ gw: round.gw, gh: round.gh, cells: round.cells, colors });
  }

  function loadWall() {
    try { return JSON.parse(localStorage.getItem(WALL_KEY)) || []; }
    catch { return []; }
  }

  function keepDesign() {
    const entry = {
      code: designCode(),
      name: (round.name || '').trim() || 'untitled',
      n: round.n, date: round.date, mine: true,
    };
    const list = loadWall();
    if (!list.some(e => e.code === entry.code)) {
      list.unshift(entry);
      try { localStorage.setItem(WALL_KEY, JSON.stringify(list)); } catch { /* private mode */ }
    }
    buildWall();
  }

  function decodedColors(d) {
    const a = [];
    for (const k in d.colors) a[k] = d.colors[k];
    return a;
  }

  function roundFromCode(code, opts) {
    const d = C.decodeDesign(code);
    const r = makeRound(d.cells, opts);
    const cols = decodedColors(d);
    for (let i = 0; i < r.n; i++) if (cols[i]) r.colors[i] = cols[i];
    return r;
  }

  let wallFilter = 'all';
  function buildWall() {
    const entries = [
      ...loadWall(),
      ...SEEDS.map(s => ({ code: s.code, name: s.name, n: s.n, mine: false, joao: !!s.joao })),
    ];

    // filter chips: all + every string count present on the wall
    const counts = [...new Set(entries.map(e => e.n))].sort((a, b) => a - b);
    if (wallFilter !== 'all' && !counts.includes(wallFilter)) wallFilter = 'all';
    filtersEl.replaceChildren(
      ...['all', ...counts].map(f => h('button', {
        class: 'f-chip' + (String(wallFilter) === String(f) ? ' active' : ''),
        onclick: () => { wallFilter = f; buildWall(); },
      }, f === 'all' ? 'all' : `${f} ${plural(f)}`)),
    );

    wallEl.replaceChildren();
    for (const e of entries) {
      if (wallFilter !== 'all' && e.n !== wallFilter) continue;
      let d;
      try { d = C.decodeDesign(e.code); } catch { continue; }
      const thumb = h('div', { class: 'thumb', style: `aspect-ratio:${d.gw + 2}/${d.gh + 2}` });
      const card = h('div', {
        class: 'wall-card' + (e.joao ? ' joao' : ''),
        role: 'button', tabindex: '0',
        onclick: () => goWeave(roundFromCode(e.code, { name: e.name, mine: !!e.mine, joao: !!e.joao, date: e.date || '' }), true),
      },
        e.joao ? h('img', { class: 'joao-photo', src: 'docs/joao-woven-cushion.jpeg', alt: 'João’s woven cushion — the real object' }) : null,
        thumb,
        h('div', { class: 'card-meta' },
          h('span', { class: 'card-name' }, e.name),
          h('span', { class: 'card-n' }, `${e.n} ${plural(e.n)}${e.joao ? ' · made physical' : ''}`),
        ),
      );
      wallEl.append(card);
      const mini = P.create(thumb, {
        cells: d.cells, colors: decodedColors(d),
        autoplay: false, nails: false, bg: BG,
      });
      mini.finish();
    }
  }

  // ---------- share ----------
  function shareUrl() {
    return location.origin + location.pathname + '?d=' + designCode();
  }

  function shareLink(btn) {
    const url = shareUrl();
    const ok = () => { btn.textContent = 'link copied ✓'; setTimeout(() => { btn.textContent = 'copy link'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(ok, () => showShareField(url));
    } else {
      showShareField(url);
    }
  }

  function showShareField(url) {
    let field = panelEl.querySelector('.share-field');
    if (!field) {
      field = h('input', { class: 'share-field', readonly: '', 'aria-label': 'share link' });
      panelEl.append(field);
    }
    field.value = url;
    field.focus();
    field.select();
  }

  async function renderCard() {
    const W = 1080, HH = 1350, pad = 84;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = HH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#090c0f';
    ctx.fillRect(0, 0, W, HH);

    const svg = player.svg;
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    const scale = Math.min((W - pad * 2) / vb[2], 880 / vb[3]);
    const w = vb[2] * scale, hh2 = vb[3] * scale;
    const clone = svg.cloneNode(true);
    clone.setAttribute('width', String(Math.round(w)));
    clone.setAttribute('height', String(Math.round(hh2)));
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res; img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
    ctx.drawImage(img, (W - w) / 2, pad + (880 - hh2) / 2, w, hh2);

    const metres = (round.total * SPACING_CM / 100).toFixed(1);
    ctx.fillStyle = '#c1cad3';
    ctx.font = '600 52px "JetBrains Mono", monospace';
    ctx.fillText((round.name || '').trim() || 'untitled', pad, 1120);
    ctx.fillStyle = '#6d7884';
    ctx.font = '400 30px "JetBrains Mono", monospace';
    ctx.fillText(`${round.n} ${plural(round.n)} · ${metres} m of cord`, pad, 1176);
    if (round.mine) ctx.fillText(`first traced ${round.date}`, pad, 1222);
    ctx.fillStyle = '#a3b8c4';
    ctx.font = '400 24px "JetBrains Mono", monospace';
    ctx.fillText(shareUrl().replace(/^https?:\/\//, ''), pad, 1290);
    return canvas;
  }

  function shareCard(btn) {
    const orig = btn.textContent;
    btn.textContent = '…';
    renderCard().then(canvas => new Promise(res => canvas.toBlob(res, 'image/png'))).then(blob => {
      const fname = (((round.name || '').trim() || 'weave').replace(/[^\w-]+/g, '-')) + '.png';
      const file = new File([blob], fname, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'tear' }).catch(() => {});
        btn.textContent = orig;
      } else {
        const a = h('a', { href: URL.createObjectURL(blob), download: fname });
        document.body.append(a);
        a.click();
        a.remove();
        btn.textContent = 'saved ✓';
        setTimeout(() => { btn.textContent = orig; }, 2200);
      }
    }).catch(() => { btn.textContent = orig; });
  }

  // ---------- boot ----------
  function boot() {
    draw.cells = seedShape(draw.gw, draw.gh);
    buildEditor();
    recount();
    renderHunts();
    buildWall();
    weaveBtn.addEventListener('click', () => {
      const cropped = cropCells(draw.cells);
      if (!cropped) return;
      goWeave(makeRound(cropped, { mine: true }), false);
    });

    const m = /[?&]d=([^&]+)/.exec(location.search);
    if (m) {
      try {
        goWeave(roundFromCode(decodeURIComponent(m[1]), { mine: false }), false);
        return;
      } catch (err) {
        console.warn('tear: could not open shared design —', err);
      }
    }
    setView('draw');
  }

  // test hook (smoke-toy.mjs)
  global.__toy = {
    get draw() { return draw; },
    get round() { return round; },
    get player() { return player; },
    skip() { if (player) player.setSpeed(16); },
    cardDataURL() { return renderCard().then(c => c.toDataURL('image/png')); },
  };

  boot();
})(window);
