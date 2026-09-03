#!/usr/bin/env node
// Engine-backed weave statistics. Boots the REAL engine (same bridge as render-weave.mjs),
// applies a shape, and dumps the engine's own cycle data so lengths/crossings can be
// computed from the actual paths, not from formulas.
//   node weave-stats.mjs --rect 16x48            # stats
//   node weave-stats.mjs --rect 4x4 --probe      # dump cycle[0] structure
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(HERE, 'engine.html');
const CHROME = '/Users/wilmon/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';

const A = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { A[argv[i].slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith('--')) ? argv[++i] : true; }
}
const [w, h] = String(A.rect || '16x48').split('x').map(Number);
const shape = { name: `rect-${w}x${h}`, gw: w, gh: h,
  cells: Array.from({ length: h }, () => Array(w).fill(true)) };

const html = fs.readFileSync(ENGINE, 'utf8');
const server = http.createServer((_, res) => { res.setHeader('content-type', 'text/html'); res.end(html); });
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

function installBridge() {
  function comp() {
    const host = document.getElementById('root');
    const ck = Object.keys(host).find(k => k.startsWith('__reactContainer$'));
    const root = host[ck];
    const fiberRoot = root.stateNode;
    const current = (fiberRoot && fiberRoot.current) || root;
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
    let hk = f && f.memoizedState;
    while (hk) {
      let value, dispatch = null;
      if (hk.queue && typeof hk.queue.dispatch === 'function') { value = hk.memoizedState; dispatch = hk.queue.dispatch; }
      else { const ms = hk.memoizedState; value = (Array.isArray(ms) && ms.length === 2 && Array.isArray(ms[1])) ? ms[0] : ms; }
      out.push({ value, dispatch });
      hk = hk.next;
    }
    return out;
  }
  function api() {
    const hs = hooks(comp());
    const cellsIdx = hs.findIndex(x => x.dispatch && Array.isArray(x.value) && Array.isArray(x.value[0]) && typeof x.value[0][0] === 'boolean');
    const cyObj = hs.find(x => x.value && typeof x.value === 'object' && !Array.isArray(x.value) && Array.isArray(x.value.cycles));
    return {
      setCells: hs[cellsIdx].dispatch,
      setGridW: hs[cellsIdx + 1].dispatch,
      setGridH: hs[cellsIdx + 2].dispatch,
      weave: cyObj ? cyObj.value : null,
    };
  }
  window.__weave = {
    ready: () => { try { return !!(document.getElementById('root') && comp()); } catch { return false; } },
    apply: (shape) => { const a = api(); a.setGridW(shape.gw); a.setGridH(shape.gh); a.setCells(shape.cells.map(r => [...r])); return true; },
    probe: () => {
      const wv = api().weave;
      const c0 = wv.cycles[0];
      const desc = (v) => Array.isArray(v) ? `array(${v.length}) first=${JSON.stringify(v[0]).slice(0, 200)}` : typeof v;
      return {
        weaveKeys: Object.keys(wv),
        cycleType: Array.isArray(c0) ? `array(${c0.length})` : typeof c0,
        cycleKeys: (c0 && typeof c0 === 'object' && !Array.isArray(c0)) ? Object.fromEntries(Object.entries(c0).map(([k, v]) => [k, desc(v)])) : null,
        cycleSample: JSON.stringify(c0).slice(0, 800),
      };
    },
    dump: () => JSON.stringify(api().weave, (k, v) => (v instanceof Map ? Object.fromEntries(v) : v)),
  };
  return true;
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root svg', { timeout: 15000 });
  await page.evaluate(installBridge);
  await page.waitForFunction(() => window.__weave && window.__weave.ready(), { timeout: 15000 });
  await page.evaluate((s) => window.__weave.apply(s), shape);
  await page.waitForTimeout(500);

  if (A.probe) {
    const p = await page.evaluate(() => window.__weave.probe());
    console.log(JSON.stringify(p, null, 2));
  } else {
    const raw = await page.evaluate(() => window.__weave.dump());
    fs.writeFileSync(A.out || `/tmp/cycles-${w}x${h}.json`, raw);
    console.log(`dumped cycles for ${w}x${h} -> ${A.out || `/tmp/cycles-${w}x${h}.json`}`);
  }
} finally {
  await browser.close();
  server.close();
}
