// Smoke tests for the Toy (play.html — "Quantos fios?").
// Drives the real page in system Chrome via playwright-core (no browser download).
// Usage:  node smoke-toy.mjs   (from scripts/)  — exits 0 on pass, 1 on fail.
//         PORT=#### to target an already-running server.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPTS_DIR, '..');
const ARTIFACTS = path.join(SCRIPTS_DIR, 'artifacts');
const PORT = process.env.PORT || '8901';
const BASE_URL = `http://localhost:${PORT}/`;
const PAGE_URL = `${BASE_URL}play.html`;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = [
  { label: 'tablet', width: 1280, height: 800 },
  { label: 'mac', width: 1440, height: 900 },
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
  const child = spawn('node', [path.join(ROOT, 'build', 'serve.js'), PORT], {
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
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  context.setDefaultTimeout(8000);
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location()?.url || '';
    if (url.endsWith('/favicon.ico')) return;
    consoleErrors.push(`${msg.text()}${url ? ` (${url})` : ''}`);
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  // 1. Page loads cleanly into the wager phase
  await check(t('page loads with board + 9 wager buttons, no errors'), async () => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.waitForSelector('#board svg');
    const nums = await page.locator('.num').count();
    if (nums !== 9) throw new Error(`expected 9 wager buttons, found ${nums}`);
    const title = await page.title();
    if (title.startsWith('ERRO')) throw new Error(`document.title = "${title}"`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
  });

  const answer = await page.evaluate(() => window.__toy.round.n);
  if (vp.label === 'tablet') {
    await page.screenshot({ path: path.join(ARTIFACTS, `toy-wager-${vp.label}.png`), fullPage: true });
  }

  // 2. Wagering the right number starts the pull and ends in the dye shop
  await check(t('correct wager -> pull plays -> "Acertou" + dye chips'), async () => {
    await page.locator('.num', { hasText: new RegExp(`^${answer}$`) }).click();
    await page.locator('.ask.dim', { hasText: /Apostou/ }).waitFor({ state: 'visible' });
    await page.evaluate(() => window.__toy.skip());
    await page.locator('.chips').waitFor({ state: 'visible', timeout: 25000 });
    const line = await page.locator('#panel .ask').first().textContent();
    if (!/^Acertou/.test(line.trim())) throw new Error(`result line: "${line.trim()}"`);
    const chips = await page.locator('.chip').count();
    if (chips !== answer) throw new Error(`expected ${answer} chips, found ${chips}`);
  });

  // 3. Dye shop: chip tap and shuffle recolour the strings
  await check(t('chip tap + shuffle change string colours'), async () => {
    const colorsOf = () => page.evaluate(() => JSON.stringify(window.__toy.round.colors));
    const c0 = await colorsOf();
    await page.locator('.chip').first().click();
    const c1 = await colorsOf();
    if (c1 === c0) throw new Error('chip tap did not change colours');
    await page.locator('.btn', { hasText: /^baralhar cores$/ }).click();
    const c2 = await colorsOf();
    if (c2 === c1) throw new Error('shuffle did not change colours');
  });

  await page.screenshot({ path: path.join(ARTIFACTS, `toy-dye-${vp.label}.png`), fullPage: true });
  console.log(`info  screenshot -> ${path.relative(ROOT, path.join(ARTIFACTS, `toy-dye-${vp.label}.png`))}`);

  // 4. Keep -> gallery item + localStorage
  await check(t('"guardar" stores the design in the gallery'), async () => {
    await page.locator('.btn', { hasText: /^guardar$/ }).click();
    await page.locator('.btn', { hasText: /guardada/ }).waitFor({ state: 'visible' });
    await page.locator('#gallery .kept svg').first().waitFor({ state: 'visible' });
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('toy.gallery') || '[]'));
    if (stored.length !== 1) throw new Error(`expected 1 stored design, found ${stored.length}`);
    if (!stored[0].startsWith('T1-')) throw new Error(`stored code "${stored[0]}" is not a T1 code`);
  });

  // 5. Share copies a decodable design-code URL
  let sharedUrl = '';
  await check(t('"partilhar" copies a valid ?d=T1-… URL'), async () => {
    await page.locator('.btn', { hasText: /^partilhar$/ }).click();
    await page.locator('.btn', { hasText: /copiada/ }).waitFor({ state: 'visible' });
    sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    if (!sharedUrl.includes('?d=T1-')) throw new Error(`clipboard: "${sharedUrl}"`);
    const ok = await page.evaluate((u) => {
      const code = u.split('?d=')[1];
      const d = window.TearCode.decodeDesign(code);
      return d.gw >= 2 && d.gh >= 2;
    }, sharedUrl);
    if (!ok) throw new Error('copied code did not decode');
  });

  // 6. "outra tábua" returns to the wager with a fresh board
  await check(t('"outra tábua" starts a new round'), async () => {
    await page.locator('.btn.next', { hasText: /outra tábua/ }).click();
    await page.locator('.nums').waitFor({ state: 'visible' });
    const nums = await page.locator('.num').count();
    if (nums !== 9) throw new Error(`expected 9 wager buttons, found ${nums}`);
  });

  // 7. Opening a shared URL skips the wager and lands in the dye shop
  await check(t('shared ?d= URL skips wager, plays, same cycle count'), async () => {
    await page.goto(sharedUrl, { waitUntil: 'load' });
    await page.waitForSelector('#board svg');
    const nums = await page.locator('.num').count();
    if (nums !== 0) throw new Error('wager buttons shown for a shared board');
    const n = await page.evaluate(() => window.__toy.round.n);
    if (n !== answer) throw new Error(`shared board has ${n} fios, expected ${answer}`);
    await page.evaluate(() => window.__toy.skip());
    await page.locator('.chips').waitFor({ state: 'visible', timeout: 25000 });
  });

  // 8. Zero console errors over the whole interaction
  await check(t('no console/page errors during entire run'), async () => {
    const title = await page.title();
    if (title.startsWith('ERRO')) throw new Error(`document.title = "${title}"`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
  });

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
