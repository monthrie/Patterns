// Smoke tests for Knot Maker — Mobile (index.html).
// Drives the real app in system Chrome via playwright-core (no browser download).
// Usage:  npm run smoke   (from scripts/)   — exits 0 on pass, 1 on fail.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, '..');
const ARTIFACTS = path.join(SCRIPTS_DIR, 'artifacts');
const BASE_URL = 'http://localhost:8901/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const GRID_W = 18; // default grid
const VIEWPORTS = [
  { label: 'landscape', width: 1280, height: 800 },
  { label: 'portrait', width: 800, height: 1280 },
];

let passCount = 0;
const failures = [];

function pass(name) {
  passCount++;
  console.log(`PASS  ${name}`);
}
function fail(name, detail) {
  failures.push({ name, detail });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}
async function check(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (e) {
    fail(name, e.message);
  }
}

// ---------- dev server: reuse if already running, else spawn build/serve.js ----------
async function serverUp() {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await serverUp()) {
    console.log(`info  reusing server already on ${BASE_URL}`);
    return null;
  }
  const child = spawn('node', [path.join(ROOT, 'build', 'serve.js')], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 30; i++) {
    if (await serverUp()) {
      console.log(`info  started build/serve.js (pid ${child.pid}) on ${BASE_URL}`);
      return child;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  throw new Error(`could not start dev server on ${BASE_URL}`);
}

// ---------- per-viewport test suite ----------
async function runSuite(browser, vp) {
  const t = (name) => `[${vp.label}] ${name}`;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: true,
  });
  context.setDefaultTimeout(7000);
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location()?.url || '';
    // Chrome auto-requests /favicon.ico; the app ships none — not an app error.
    if (url.endsWith('/favicon.ico')) return;
    consoleErrors.push(`${msg.text()}${url ? ` (${url})` : ''}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  const fiosCount = async () => {
    return page.evaluate(() => {
      const spans = [...document.querySelectorAll('.stats-bar span')];
      const fio = spans.find((s) => /^fios?$/.test(s.textContent.trim()));
      if (!fio || !fio.previousElementSibling) return null;
      const n = parseInt(fio.previousElementSibling.textContent.trim(), 10);
      return Number.isFinite(n) ? n : null;
    });
  };

  // 1. App loads cleanly
  await check(t('app loads, no ERRO in title, no console errors'), async () => {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForSelector('.tab-bar');
    await page.waitForSelector('.stats-bar');
    const title = await page.title();
    if (title.startsWith('ERRO')) throw new Error(`document.title = "${title}"`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
  });

  // 2. Default 18x10 grid -> 2 fios
  await check(t('stats bar shows "2 fios" on default grid'), async () => {
    const n = await fiosCount();
    if (n !== 2) throw new Error(`expected 2 fios, stats bar shows ${n}`);
  });

  // 3a. FORMAS tab
  await check(t('FORMAS tab opens with Guardar/Exportar/Importar + presets'), async () => {
    await page.locator('.tab-bar .tab-btn', { hasText: /^Formas$/ }).click();
    for (const label of ['Guardar', 'Exportar', 'Importar']) {
      const btn = page.locator('button', { hasText: new RegExp(`^${label}$`) }).first();
      await btn.waitFor({ state: 'visible' });
    }
    const chips = await page.locator('.knm-chip').count();
    if (chips < 4) throw new Error(`expected >= 4 preset chips, found ${chips}`);
  });

  // 3b. VER tab
  await check(t('VER tab opens with Fio strand options'), async () => {
    await page.locator('.tab-bar .tab-btn', { hasText: /^Ver$/ }).click();
    await page
      .locator('span', { hasText: /^Fio$/ })
      .first()
      .waitFor({ state: 'visible' });
    for (const label of ['fino', 'grosso', 'linha']) {
      const btn = page.locator('button', { hasText: new RegExp(`^${label}$`) }).first();
      await btn.waitFor({ state: 'visible' });
    }
  });

  // 3c. DESENHAR tab (also leaves us on the editor for the drawing test)
  await check(t('DESENHAR tab opens with cell-grid editor'), async () => {
    await page.locator('.tab-bar .tab-btn', { hasText: /^Desenhar$/ }).click();
    await page.waitForSelector('.editor-scroll-wrap');
  });

  // 4. Drawing changes the fios count
  await check(t('pointer-drag on grid changes fios count'), async () => {
    const before = await fiosCount();
    const grid = page.locator('.editor-scroll-wrap > div > div').first();
    await grid.scrollIntoViewIfNeeded();
    const box = await grid.boundingBox();
    if (!box) throw new Error('editor grid not visible');
    const cell = (box.width - 4) / GRID_W; // 2px border each side
    const cx = (i) => box.x + 2 + (i + 0.5) * cell;
    const cy = (j) => box.y + 2 + (j + 0.5) * cell;
    // marquee drag across cells (2,2) -> (5,2): toggles those cells off
    await page.mouse.move(cx(2), cy(2));
    await page.mouse.down();
    await page.mouse.move(cx(3.5), cy(2), { steps: 4 });
    await page.mouse.move(cx(5), cy(2), { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    const after = await fiosCount();
    if (after === null) throw new Error('could not read fios count after drag');
    if (after === before) throw new Error(`fios count did not change (still ${after})`);
  });

  // 5. Fullscreen weave toggle
  await check(t('"SÓ O PADRÃO" toggles to "VOLTAR" and back'), async () => {
    const bar = page.locator('.stats-bar');
    await bar.locator('button', { hasText: /SÓ O PADRÃO/ }).click();
    await bar.locator('button', { hasText: /^VOLTAR$/ }).waitFor({ state: 'visible' });
    await bar.locator('button', { hasText: /^VOLTAR$/ }).click();
    await bar
      .locator('button', { hasText: /SÓ O PADRÃO/ })
      .waitFor({ state: 'visible' });
  });

  // 6. Zero console errors over the whole interaction + screenshot artifact
  await check(t('no console/page errors during entire run'), async () => {
    const title = await page.title();
    if (title.startsWith('ERRO')) throw new Error(`document.title = "${title}"`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
  });

  const shot = path.join(ARTIFACTS, `smoke-${vp.label}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  console.log(`info  screenshot -> ${path.relative(ROOT, shot)}`);

  await context.close();
}

// ---------- main ----------
const startedServer = await ensureServer();
mkdirSync(ARTIFACTS, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const vp of VIEWPORTS) {
    console.log(`\n=== viewport ${vp.label} (${vp.width}x${vp.height}) ===`);
    await runSuite(browser, vp);
  }
} catch (e) {
  fail('harness', e.message);
} finally {
  await browser?.close();
  startedServer?.kill();
}

console.log(`\n${passCount} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailure summary:');
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
process.exit(0);
