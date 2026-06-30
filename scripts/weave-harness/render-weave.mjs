#!/usr/bin/env node
// Headless João-weave renderer.
// Drives a COPY of the real engine (engine.html). No clicking, no re-implementation:
// it reaches into the live React component, calls the engine's own loadShape()/
// setCycleColor()/setStrandMode(), lets the real renderStrandSVG recompute, then reads
// the live <svg> out and screenshots it.
//
// Usage:
//   node render-weave.mjs --shape shapes/shoe-19x11.json --out out/shoe.png \
//        --mode full --colors bw
//
// --mode   thin | full | string        (string = single colour; use thin/full for coloured cycles)
// --colors bw | rainbow | #aaa,#bbb,..  (bw = alternating black/white across the real cycle count)
// --bg     hex                          (backdrop behind the weave; default mid grey)

import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(HERE, 'engine.html');
const CHROME = '/Users/wilmon/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';

// ---- args ----
const A = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { A[argv[i].slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
}
// ---- shape spec: --rect WxH, or --shape <file>. The file may be the engine-native form
//      { name, gw, gh, cells:[[bool]] } OR the pattern-from-image decoder form
//      { name, rect:[w,h] | cells:["..##..",…], colors:[…], bg }. We normalize either. ----
function normalizeShape(spec) {
  let { name = 'weave', gw, gh, cells, rect } = spec;
  if (rect) { gw = rect[0]; gh = rect[1]; cells = Array.from({ length: gh }, () => Array(gw).fill(true)); }
  else if (Array.isArray(cells) && typeof cells[0] === 'string') {
    const rows = cells; gh = rows.length; gw = Math.max(...rows.map(r => r.length));
    cells = rows.map(r => Array.from({ length: gw }, (_, x) => { const ch = r[x]; return !!ch && ch !== '.' && ch !== ' '; }));
  } else if (Array.isArray(cells) && Array.isArray(cells[0])) {
    gh = cells.length; gw = cells[0].length; cells = cells.map(r => r.map(Boolean));
  } else { throw new Error('shape needs rect, string-cells, or boolean-cells'); }
  return { name, gw, gh, cells };
}
let spec;
if (A.rect) { const [w, h] = String(A.rect).split('x').map(Number); spec = { name: `rect-${w}x${h}`, rect: [w, h] }; }
else if (A.shape) spec = JSON.parse(fs.readFileSync(path.resolve(A.shape), 'utf8'));
else { console.error('need --shape <file.json> or --rect WxH'); process.exit(1); }
const shape = normalizeShape(spec);
const outPath = path.resolve(A.out || path.join(HERE, `out/${shape.name}.png`));
const mode = A.mode || 'full';
// colour priority: --colors flag > spec.colors (decoder) > 'bw'
const colorsArg = A.colors || (Array.isArray(spec.colors) ? spec.colors : null) || 'bw';
const bg = A.bg || spec.bg || '#5a5f66';

// ---- tiny static server (engine is self-contained, serve it at every path) ----
const html = fs.readFileSync(ENGINE, 'utf8');
const server = http.createServer((_, res) => { res.setHeader('content-type', 'text/html'); res.end(html); });
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/`;

// ---- in-page bridge: find the live component and expose its real setters ----
function installBridge() {
  function comp() {
    const host = document.getElementById('root');
    const ck = Object.keys(host).find(k => k.startsWith('__reactContainer$'));
    const root = host[ck];
    const fiberRoot = root.stateNode;                 // FiberRootNode
    const current = (fiberRoot && fiberRoot.current) || root; // live tree
    const stack = [current];
    while (stack.length) {
      const f = stack.pop();
      if (!f) continue;
      if (typeof f.type === 'function' && f.type.name === 'KnotMakerMobile') return f;
      if (f.child) stack.push(f.child);
      if (f.sibling) stack.push(f.sibling);
    }
    return null;
  }
  function hooks(f) {
    const out = [];
    let h = f && f.memoizedState;
    while (h) {
      let value, dispatch = null;
      if (h.queue && typeof h.queue.dispatch === 'function') { value = h.memoizedState; dispatch = h.queue.dispatch; }
      else { const ms = h.memoizedState; value = (Array.isArray(ms) && ms.length === 2 && Array.isArray(ms[1])) ? ms[0] : ms; }
      out.push({ value, dispatch });
      h = h.next;
    }
    return out;
  }
  function api() {
    // All app callbacks are anonymous (useCallback wraps the arrow), so target the raw
    // useState dispatchers by source order + value signature. cells/gridW/gridH are the
    // first three useState calls (consecutive); strandMode is the only 'thin'|'full'|'string'
    // state; cycleColors is the first plain-object state after it.
    const hs = hooks(comp());
    const cellsIdx = hs.findIndex(h => h.dispatch && Array.isArray(h.value) && Array.isArray(h.value[0]) && typeof h.value[0][0] === 'boolean');
    const smIdx = hs.findIndex(h => h.dispatch && typeof h.value === 'string' && ['thin', 'full', 'string'].includes(h.value));
    const ccIdx = hs.findIndex((h, i) => i > smIdx && h.dispatch && h.value && typeof h.value === 'object' && !Array.isArray(h.value));
    // object-valued state hooks after strandMode, in source order:
    // [0]=cycleColors, [1]=cycleSecondary, [2]=visibleCycles
    const objIdxs = hs.map((h, i) => ({ h, i })).filter(({ h, i }) => i > smIdx && h.dispatch && h.value && typeof h.value === 'object' && !Array.isArray(h.value)).map(x => x.i);
    // cycles array lives inside a memoized object { cycles, gaps, edges }
    const cyObj = hs.find(h => h.value && typeof h.value === 'object' && !Array.isArray(h.value) && Array.isArray(h.value.cycles));
    return {
      setCells: hs[cellsIdx].dispatch,
      setGridW: hs[cellsIdx + 1].dispatch,
      setGridH: hs[cellsIdx + 2].dispatch,
      setStrandMode: hs[smIdx].dispatch,
      setCycleColors: hs[objIdxs[0]].dispatch,
      setVisibleCycles: hs[objIdxs[2]].dispatch,
      cycles: cyObj ? cyObj.value.cycles : [],
    };
  }
  window.__weave = {
    ready: () => { try { return !!(document.getElementById('root') && comp()); } catch { return false; } },
    apply: (shape, mode) => {
      const a = api();
      a.setGridW(shape.gw); a.setGridH(shape.gh);
      a.setCells(shape.cells.map(r => [...r]));
      a.setStrandMode(mode);
      return true;
    },
    cycleCount: () => api().cycles.length,
    paint: (list) => { const map = {}; list.forEach((c, i) => { map[i] = c; }); api().setCycleColors(map); return list.length; },
    // keep only `keep` indices visible: with showAll=true (default), marking the rest false hides them
    showOnly: (keep, total) => { const map = {}; for (let i = 0; i < total; i++) if (!keep.includes(i)) map[i] = false; api().setVisibleCycles(map); return keep; },
  };
  return true;
}

const colorFor = (n) => {
  if (Array.isArray(colorsArg)) return Array.from({ length: n }, (_, i) => colorsArg[i % colorsArg.length]);
  if (colorsArg === 'bw') return Array.from({ length: n }, (_, i) => i % 2 === 0 ? '#000000' : '#ffffff');
  if (colorsArg === 'rainbow') return Array.from({ length: n }, (_, i) => `hsl(${Math.round(360 * i / n)},70%,55%)`);
  const list = String(colorsArg).split(',').map(s => s.trim());
  return Array.from({ length: n }, (_, i) => list[i % list.length]);
};

// ---- colour naming (so the recipe reads "cord 1 = purple (#574fa6)") ----
const NAMED = [['black', '#000000'], ['white', '#ffffff'], ['grey', '#808080'], ['navy', '#0d1b2a'],
['blue', '#1d3ad0'], ['cobalt', '#1f3cc9'], ['teal', '#3ec9b0'], ['deep teal', '#176b54'],
['green', '#1a6b44'], ['forest green', '#15633e'], ['lime', '#a6df3f'], ['yellow', '#ffe119'],
['gold', '#f4b942'], ['orange', '#f7a01a'], ['apricot', '#f4a259'], ['red', '#e5383b'],
['crimson', '#d4202a'], ['pink', '#ef3f8d'], ['magenta', '#f032e6'], ['purple', '#574fa6'],
['violet', '#9d4edd'], ['aubergine', '#2b1840'], ['mauve', '#6d597a'], ['cream', '#f6e7c1'], ['string grey', '#8fa3ad']];
const hslToRgb = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l); const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0), f(8), f(4)].map(x => Math.round(255 * x)); };
const toRgb = (c) => {
  if (c[0] === '#') { const h = c.slice(1); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
  const m = c.match(/hsl\(\s*([\d.]+)\D+([\d.]+)\D+([\d.]+)/i); if (m) return hslToRgb(+m[1], +m[2], +m[3]); return [128, 128, 128];
};
const NAMED_RGB = NAMED.map(([n, h]) => [n, toRgb(h)]);
const nameOf = (c) => { const [r, g, b] = toRgb(c); let best = '', d = 1e9; for (const [n, [R, G, B]] of NAMED_RGB) { const e = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2; if (e < d) { d = e; best = n; } } return best; };

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.error('  [page]', m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root svg', { timeout: 15000 });
  await page.evaluate(installBridge);
  await page.waitForFunction(() => window.__weave && window.__weave.ready(), { timeout: 15000 });

  // 1) load the shape + strand mode through the engine's own functions
  await page.evaluate(({ shape, mode }) => window.__weave.apply(shape, mode), { shape, mode });
  await page.waitForTimeout(400);

  // 2) ask the REAL engine how many cycles this shape produced
  const cycles = await page.evaluate(() => window.__weave.cycleCount());
  console.log(`engine reports ${cycles} cycles for "${shape.name}" (${shape.gw}x${shape.gh})`);

  // 3a) optionally show only a subset of loops ( --show random:N | --show 2,5,9 )
  let keep = null;  // visible cord indices when --show is used, else null (all visible)
  if (A.show) {
    const all = Array.from({ length: cycles }, (_, i) => i);
    if (String(A.show).startsWith('random:')) {
      const n = Math.min(cycles, parseInt(String(A.show).split(':')[1], 10) || 1);
      keep = all.sort(() => Math.random() - 0.5).slice(0, n).sort((a, b) => a - b);
    } else {
      keep = String(A.show).split(',').map(s => parseInt(s.trim(), 10)).filter(i => i >= 0 && i < cycles);
    }
    await page.evaluate(({ keep, total }) => window.__weave.showOnly(keep, total), { keep, total: cycles });
    await page.waitForTimeout(300);
    console.log(`showing loops: [${keep.join(', ')}] of ${cycles}`);
  }

  // 3b) paint them (string mode forces the single string colour, ignoring per-cord colours)
  const appliedColors = mode === 'string'
    ? Array.from({ length: cycles }, () => '#8fa3ad')
    : colorFor(cycles);
  if (mode !== 'string') {
    await page.evaluate((list) => window.__weave.paint(list), appliedColors);
    await page.waitForTimeout(400);
  }

  // 4) clone the weave <svg> into a clean full-screen overlay (no app chrome) and shoot that
  const handle = await page.evaluateHandle((bg) => {
    const svgs = [...document.querySelectorAll('svg')];
    let best = null, area = 0;
    for (const s of svgs) { const b = s.getBoundingClientRect(); const a = b.width * b.height; if (a > area) { area = a; best = s; } }
    const vb = best.viewBox.baseVal;
    // recolour any full-bleed background rect the app drew so strands read on the backdrop
    for (const r of best.querySelectorAll('rect')) {
      const w = +r.getAttribute('width') || 0, h = +r.getAttribute('height') || 0;
      if (vb && w >= vb.width * 0.95 && h >= vb.height * 0.95) r.setAttribute('fill', bg);
    }
    const clone = best.cloneNode(true);
    clone.style.cssText = 'width:1200px;height:auto;display:block;background:' + bg;
    const wrap = document.createElement('div');
    wrap.id = '__weaveshot';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:48px;box-sizing:border-box;background:' + bg;
    wrap.appendChild(clone);
    document.body.appendChild(wrap);
    return wrap;
  }, bg);

  await handle.screenshot({ path: outPath });
  const svgText = await page.evaluate((el) => el.querySelector('svg').outerHTML, handle);
  fs.writeFileSync(outPath.replace(/\.png$/, '.svg'), svgText);
  // app-importable shape (Guardadas → Importar) — array-wrapped, engine-native form
  const shapesPath = outPath.replace(/\.png$/, '.shapes.json');
  fs.writeFileSync(shapesPath, JSON.stringify([{ name: shape.name, gw: shape.gw, gh: shape.gh, cells: shape.cells }]));

  // recipe — exactly how to make it: board dims + every cord's colour, in order
  const visible = (i) => keep === null || keep.includes(i);
  const label = (i) => visible(i) ? `${nameOf(appliedColors[i])} (${appliedColors[i]})` : 'HIDDEN';
  const runs = [];
  for (let i = 0; i < cycles; i++) { const l = label(i); const last = runs[runs.length - 1]; if (last && last.l === l) last.to = i; else runs.push({ from: i, to: i, l }); }
  const recipe = [
    `# Recipe — ${shape.name}`, '',
    `**Board:** ${shape.gw} × ${shape.gh} cells   ·   **Cords (cycles):** ${cycles}   ·   **Mode:** ${mode}   ·   **Background:** ${bg}`,
    keep ? `**Showing only cords:** ${keep.map(i => i + 1).join(', ')} (rest hidden)` : '',
    '', '## Cords in runs', '',
    ...runs.map(r => r.from === r.to ? `- cord ${r.from + 1}: ${r.l}` : `- cords ${r.from + 1}–${r.to + 1}: ${r.l}`),
    '', '## Every cord', '',
    ...Array.from({ length: cycles }, (_, i) => `cord ${i + 1} = ${label(i)}`),
    '',
  ].filter(x => x !== '' || true).join('\n');
  const recipePath = outPath.replace(/\.png$/, '.recipe.md');
  fs.writeFileSync(recipePath, recipe);

  console.log(`wrote ${outPath}`);
  console.log(`wrote ${outPath.replace(/\.png$/, '.svg')}`);
  console.log(`wrote ${shapesPath}  (importable: Guardadas → Importar)`);
  console.log(`wrote ${recipePath}  (board + per-cord colours)`);
  console.log(`CYCLES=${cycles}`);
} finally {
  await browser.close();
  server.close();
}
