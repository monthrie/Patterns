/*
 * TearToy — "Quantos fios?" (the Toy).
 * The quiet guessing game: a board appears → wager how many strings it needs
 * (the answer is gcd for rectangles, an open problem for irregular shapes) →
 * watch the pull → dye the strings → keep or share. No points, no streaks.
 * Vanilla JS; requires TearEngine (src/engine.js), TearPlayer (src/player.js),
 * TearCode (src/code.js).
 */
(function (global) {
  'use strict';
  const E = global.TearEngine, P = global.TearPlayer, C = global.TearCode;

  const BG = '#0b0f13';
  const DYE = E.JOAO.filter(c => c.name !== 'Preto'); // Preto is invisible on the ink board
  const GALLERY_KEY = 'toy.gallery';

  const boardEl = document.getElementById('board');
  const panelEl = document.getElementById('panel');
  const galleryEl = document.getElementById('gallery');
  const galleryWrap = document.getElementById('gallery-wrap');

  let round = null;        // { cells, gw, gh, n, total, colors }
  let player = null;
  let guess = null;
  let lastAnswer = 0;
  let revealOnDone = true; // shared boards skip the wager, so nothing to reveal

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

  const fios = n => (n === 1 ? 'fio' : 'fios');

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

  // ---------- boards ----------
  // A corner bite never disconnects the board as long as it spares 3 columns/rows.
  function bite(cells, gw, gh) {
    const c = cells.map(r => r.slice());
    const corner = Math.floor(Math.random() * 4);
    const bw = 1 + Math.floor(Math.random() * Math.min(4, gw - 3));
    const bh = 1 + Math.floor(Math.random() * Math.min(3, gh - 3));
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      c[(corner & 2) ? gh - 1 - y : y][(corner & 1) ? gw - 1 - x : x] = false;
    }
    return c;
  }

  function makeBoard() {
    for (let t = 0; t < 300; t++) {
      const gw = 6 + Math.floor(Math.random() * 11);   // 6..16
      const gh = 5 + Math.floor(Math.random() * 7);    // 5..11
      let cells = E.rectCells(gw, gh);
      const nBites = Math.random() < 0.45 ? 0 : (Math.random() < 0.6 ? 1 : 2);
      for (let b = 0; b < nBites; b++) cells = bite(cells, gw, gh);
      const { cycles } = E.getAllCycles(cells, gw, gh);
      const n = cycles.length;
      if (n < 1 || n > 9 || n === lastAnswer) continue;
      // 1 fio is the honest common case (gcd=1 ≈ 61% of rectangles) but a dull
      // wager when it dominates — keep it, just rarer
      if (n === 1 && Math.random() < 0.6) continue;
      const total = cycles.reduce((a, c) => a + E.arcLen(c.points), 0);
      return { cells, gw, gh, n, total };
    }
    // statistically unreachable; a calm 9×6 (3 fios) if randomness conspires
    const cells = E.rectCells(9, 6);
    const { cycles } = E.getAllCycles(cells, 9, 6);
    return { cells, gw: 9, gh: 6, n: cycles.length, total: cycles.reduce((a, c) => a + E.arcLen(c.points), 0) };
  }

  // ---------- player ----------
  function mountPlayer() {
    if (player) player.destroy();
    const ratio = (round.gw + 2) / (round.gh + 2);
    boardEl.style.aspectRatio = `${round.gw + 2} / ${round.gh + 2}`;
    boardEl.style.maxWidth = `min(820px, calc(58vh * ${ratio.toFixed(4)}))`;
    const rawDur = Math.min(22, Math.max(6, round.total * 0.022));
    player = P.create(boardEl, {
      cells: round.cells, colors: round.colors, bg: BG,
      autoplay: false,
      speedFactor: Math.max(1, Math.min(2.4, rawDur / 9)),
      onDone: () => showDye(revealOnDone),
    });
  }

  // ---------- phases ----------
  function showWager() {
    guess = null;
    const nums = [];
    for (let n = 1; n <= 9; n++) {
      nums.push(h('button', { class: 'num', onclick: () => startPull(n) }, String(n)));
    }
    panelEl.replaceChildren(
      h('div', { class: 'ask' }, 'Quantos fios vai levar esta tábua?'),
      h('div', { class: 'nums' }, ...nums),
    );
  }

  function startPull(n) {
    guess = n;
    const speedBtn = h('button', {
      class: 'btn', 'aria-pressed': 'false',
      onclick: () => {
        const fast = speedBtn.getAttribute('aria-pressed') !== 'true';
        speedBtn.setAttribute('aria-pressed', String(fast));
        player.setSpeed(fast ? 4 : 1);
      },
    }, '▸▸ mais depressa');
    panelEl.replaceChildren(
      h('div', { class: 'ask dim' },
        guess === null ? 'Uma tábua partilhada consigo. A pôr o fio…' : `Apostou ${n}. A pôr o fio…`),
      h('div', { class: 'row' }, speedBtn),
    );
    player.play();
  }

  function showDye(reveal) {
    let line, ok = false;
    if (reveal && guess !== null) {
      ok = guess === round.n;
      line = ok
        ? `Acertou — ${round.n} ${fios(round.n)}.`
        : `Apostou ${guess}; eram ${round.n} ${fios(round.n)}.`;
    } else {
      line = `${round.n} ${fios(round.n)}.`;
    }
    if (ok) {
      boardEl.classList.remove('shimmer');
      void boardEl.offsetWidth;
      boardEl.classList.add('shimmer');
    }

    const chips = round.colors.map((col, i) => {
      const b = h('button', {
        class: 'chip', style: `background:${col}`, title: `fio ${i + 1}`,
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
    }, 'baralhar cores');

    const keepBtn = h('button', {
      class: 'btn',
      onclick: () => {
        if (keep()) { keepBtn.textContent = 'guardada ✓'; keepBtn.disabled = true; }
      },
    }, 'guardar');

    const shareBtn = h('button', { class: 'btn', onclick: () => share(shareBtn) }, 'partilhar');

    panelEl.replaceChildren(
      h('div', { class: 'ask' }, line),
      h('div', { class: 'chips' }, ...chips),
      h('div', { class: 'row' },
        shuffleBtn, keepBtn, shareBtn,
        h('button', { class: 'btn next', onclick: newRound }, 'outra tábua →'),
      ),
    );
  }

  // ---------- keep & share ----------
  function designCode() {
    const colors = {};
    round.colors.forEach((c, i) => { colors[i] = c; });
    return C.encodeDesign({ gw: round.gw, gh: round.gh, cells: round.cells, colors });
  }

  function loadGallery() {
    try { return JSON.parse(localStorage.getItem(GALLERY_KEY)) || []; }
    catch { return []; }
  }

  function keep() {
    const code = designCode();
    const list = loadGallery();
    if (list.includes(code)) return true;
    list.push(code);
    try { localStorage.setItem(GALLERY_KEY, JSON.stringify(list)); } catch { /* private mode: keep in-page only */ }
    addGalleryItem(code);
    return true;
  }

  function decodedColors(d) {
    const a = [];
    for (const k in d.colors) a[k] = d.colors[k];
    return a;
  }

  function addGalleryItem(code) {
    let d;
    try { d = C.decodeDesign(code); } catch { return; }
    const item = h('button', { class: 'kept', title: 'abrir esta tábua', onclick: () => openKept(code) });
    item.style.aspectRatio = `${d.gw + 2} / ${d.gh + 2}`;
    galleryEl.prepend(item);
    const mini = P.create(item, {
      cells: d.cells, colors: decodedColors(d),
      autoplay: false, nails: false, bg: BG,
    });
    mini.finish();
    galleryWrap.hidden = false;
  }

  function openKept(code) {
    let d;
    try { d = C.decodeDesign(code); } catch { return; }
    setRoundFromDesign(d);
    mountPlayer();
    player.finish();
    guess = null;
    showDye(false);
  }

  function setRoundFromDesign(d) {
    const { cycles } = E.getAllCycles(d.cells, d.gw, d.gh);
    const colors = decodedColors(d);
    const fill = randomColors(cycles.length);
    for (let i = 0; i < cycles.length; i++) if (!colors[i]) colors[i] = fill[i];
    colors.length = cycles.length;
    round = {
      cells: d.cells, gw: d.gw, gh: d.gh,
      n: cycles.length,
      total: cycles.reduce((a, c) => a + E.arcLen(c.points), 0),
      colors,
    };
    lastAnswer = round.n;
    boardEl.classList.remove('shimmer');
  }

  function share(btn) {
    const url = location.origin + location.pathname + '?d=' + designCode();
    const okFeedback = () => { btn.textContent = 'ligação copiada ✓'; setTimeout(() => { btn.textContent = 'partilhar'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(okFeedback, () => showShareField(url));
    } else {
      showShareField(url);
    }
  }

  function showShareField(url) {
    let field = panelEl.querySelector('.share-field');
    if (!field) {
      field = h('input', { class: 'share-field', readonly: '', 'aria-label': 'ligação para partilhar' });
      panelEl.append(field);
    }
    field.value = url;
    field.focus();
    field.select();
  }

  // ---------- rounds & boot ----------
  function newRound() {
    const b = makeBoard();
    lastAnswer = b.n;
    revealOnDone = true;
    round = { cells: b.cells, gw: b.gw, gh: b.gh, n: b.n, total: b.total, colors: randomColors(b.n) };
    boardEl.classList.remove('shimmer');
    mountPlayer();
    showWager();
  }

  function boot() {
    loadGallery().forEach(addGalleryItem);
    const m = /[?&]d=([^&]+)/.exec(location.search);
    if (m) {
      try {
        const d = C.decodeDesign(decodeURIComponent(m[1]));
        setRoundFromDesign(d);
        revealOnDone = false;
        mountPlayer();
        guess = null;
        startPull(null);
        return;
      } catch { /* bad code → fresh board */ }
    }
    newRound();
  }

  // test hook (smoke-toy.mjs): inspect the round, fast-forward the pull
  global.__toy = {
    get round() { return round; },
    get player() { return player; },
    skip() { if (player) player.setSpeed(16); },
  };

  boot();
})(window);
