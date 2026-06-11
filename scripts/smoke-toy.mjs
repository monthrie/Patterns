// Smoke tests for the Toy v2 (play.html — the quiet weaving game).
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
  { label: 'phone', width: 390, height: 844 },
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
  page.on('console', (msg) => {
    if (msg.type() === 'warning') console.log(`warn  [page] ${msg.text()}`);
  });

  const shot = (name) => page.screenshot({ path: path.join(ARTIFACTS, `toy-${name}-${vp.label}.png`), fullPage: true });

  // 1. Loads into the daily swatch; draw view reachable with live count
  await check(t('page loads: daily swatch front door, draw editor works'), async () => {
    await page.goto(PAGE_URL, { waitUntil: 'load' });
    await page.waitForSelector('#swatch svg');
    const target = await page.evaluate(() => window.__toy.swatch.target);
    if (!target || !target.W) throw new Error('no daily target generated');
    const drawHidden = await page.locator('#view-draw').isHidden();
    if (!drawHidden) throw new Error('draw view visible at boot — daily should be the front door');
    await page.locator('#tabs button', { hasText: /^draw$/ }).click();
    await page.waitForSelector('#editor .cell');
    const n = await page.evaluate(() => window.__toy.draw.n);
    if (!Number.isInteger(n) || n < 1) throw new Error(`draw.n = ${n}`);
    const countText = await page.locator('#count-line').textContent();
    if (!countText.includes(String(n))) throw new Error(`count line "${countText}" missing ${n}`);
    const title = await page.title();
    if (title.startsWith('ERRO')) throw new Error(`document.title = "${title}"`);
    if (consoleErrors.length) throw new Error(`console errors: ${consoleErrors.join(' | ')}`);
  });

  // 2. Painting cells changes the shape (and the count reacts live)
  await check(t('painting on the grid changes the shape + recounts'), async () => {
    const before = await page.evaluate(() => ({
      cells: JSON.stringify(window.__toy.draw.cells),
      n: window.__toy.draw.n,
    }));
    const box = await page.locator('#editor').boundingBox();
    // drag along the top-left region: toggles a run of cells
    await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.08);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.08, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => ({
      cells: JSON.stringify(window.__toy.draw.cells),
      n: window.__toy.draw.n,
    }));
    if (after.cells === before.cells) throw new Error('cells unchanged after drag');
    const countText = await page.locator('#count-line').textContent();
    if (!countText.includes(String(after.n))) throw new Error(`count line stale: "${countText}" vs n=${after.n}`);
    // undo restores
    await page.locator('#undo-btn').click();
    await page.waitForTimeout(120);
    const undone = await page.evaluate(() => JSON.stringify(window.__toy.draw.cells));
    if (undone !== before.cells) throw new Error('undo did not restore the shape');
  });

  if (vp.label === 'phone') await shot('draw');

  // 3. Weave it -> the pull plays -> reveal with certificate + chips
  let myN = 0;
  await check(t('weave it -> pull -> reveal: count, cert, chips'), async () => {
    await page.locator('#weave-btn').click();
    await page.locator('.ask.dim', { hasText: /laying the string/ }).waitFor({ state: 'visible' });
    await page.evaluate(() => window.__toy.skip());
    await page.locator('.chips').waitFor({ state: 'visible', timeout: 25000 });
    myN = await page.evaluate(() => window.__toy.round.n);
    const line = await page.locator('#panel .ask').first().textContent();
    if (!line.includes(`${myN} string`)) throw new Error(`reveal line: "${line}"`);
    const cert = await page.locator('.cert').first().textContent();
    if (!/first traced by you/.test(cert)) throw new Error(`cert line: "${cert}"`);
    const chips = await page.locator('.chip').count();
    if (chips !== myN) throw new Error(`expected ${myN} chips, found ${chips}`);
  });

  // 4. Dye shop: chip tap + shuffle recolour
  await check(t('chip tap + shuffle change string colours'), async () => {
    const colorsOf = () => page.evaluate(() => JSON.stringify(window.__toy.round.colors));
    const c0 = await colorsOf();
    await page.locator('.chip').first().click();
    const c1 = await colorsOf();
    if (c1 === c0) throw new Error('chip tap did not change colours');
    await page.locator('.btn', { hasText: /^shuffle$/ }).click();
    const c2 = await colorsOf();
    if (c2 === c1) throw new Error('shuffle did not change colours');
  });

  if (vp.label === 'tablet') await shot('weave');

  // 5. Name + keep -> appears on the wall + localStorage
  await check(t('name + keep puts the weave on the wall'), async () => {
    await page.locator('#name-input').fill('smoke test weave');
    await page.locator('.btn', { hasText: /^keep$/ }).click();
    await page.locator('.btn', { hasText: /on the wall/ }).waitFor({ state: 'visible' });
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('toy.wall.v1') || '[]'));
    if (stored.length !== 1) throw new Error(`expected 1 stored entry, found ${stored.length}`);
    if (stored[0].name !== 'smoke test weave') throw new Error(`stored name "${stored[0].name}"`);
    if (!stored[0].code.startsWith('T1-')) throw new Error(`stored code "${stored[0].code}"`);
  });

  // 6. Share card renders a real PNG
  await check(t('share card renders a PNG data URL'), async () => {
    const len = await page.evaluate(() => window.__toy.cardDataURL().then(u => u.length));
    if (len < 20000) throw new Error(`card data URL suspiciously small (${len})`);
  });

  // 7. Copy link -> valid decodable ?d= URL
  let sharedUrl = '';
  await check(t('"copy link" copies a valid ?d=T1-… URL'), async () => {
    await page.locator('.btn', { hasText: /^copy link$/ }).click();
    await page.locator('.btn', { hasText: /copied/ }).waitFor({ state: 'visible' });
    sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
    if (!sharedUrl.includes('?d=T1-')) throw new Error(`clipboard: "${sharedUrl}"`);
    const ok = await page.evaluate((u) => {
      const d = window.TearCode.decodeDesign(u.split('?d=')[1]);
      return d.gw >= 2 && d.gh >= 2;
    }, sharedUrl);
    if (!ok) throw new Error('copied code did not decode');
  });

  // 8. The wall: João pinned, kept weave present, filters work
  await check(t('wall shows João + kept weave, filter by string count'), async () => {
    await page.locator('#tabs button', { hasText: /the wall/ }).click();
    await page.locator('.wall-card.joao').waitFor({ state: 'visible' });
    await page.locator('.wall-card', { hasText: 'smoke test weave' }).waitFor({ state: 'visible' });
    const joaoPhoto = await page.locator('.joao-photo').evaluate(img => img.complete && img.naturalWidth > 0);
    if (!joaoPhoto) throw new Error('João photo did not load');
    const total = await page.locator('.wall-card').count();
    await page.locator('.f-chip', { hasText: /^7 strings$/ }).click();
    const filtered = await page.locator('.wall-card').count();
    if (filtered >= total) throw new Error(`filter did not narrow the wall (${filtered} of ${total})`);
    const badN = await page.locator('.wall-card .card-n', { hasText: /^(?!7 )/ }).count();
    if (badN > 0) throw new Error(`${badN} non-7-string cards visible under the 7 filter`);
    await page.locator('.f-chip', { hasText: /^all$/ }).click();
    const back = await page.locator('.wall-card').count();
    if (back !== total) throw new Error(`"all" filter shows ${back}, expected ${total}`);
  });

  if (vp.label === 'phone' || vp.label === 'mac') await shot('wall');

  // 9. Opening a wall piece -> finished weave, remix loads it into the editor
  await check(t('wall card opens finished; remix loads shape into editor'), async () => {
    // card textContent starts with the player SVG's <style> text, so anchor on .card-name
    await page.locator('.wall-card', { has: page.locator('.card-name', { hasText: /^seven$/ }) }).click();
    await page.locator('.chips').waitFor({ state: 'visible' });
    const n = await page.evaluate(() => window.__toy.round.n);
    if (n !== 7) throw new Error(`"seven" opened with ${n} strings`);
    await page.locator('.btn.next', { hasText: /remix/ }).click();
    await page.locator('#editor .cell').first().waitFor({ state: 'visible' });
    // recount is rAF-deferred — poll instead of reading immediately
    await page.waitForFunction(() => window.__toy.draw.n === 7, null, { timeout: 3000 })
      .catch(async () => {
        const drawN = await page.evaluate(() => window.__toy.draw.n);
        throw new Error(`remixed shape recounts to ${drawN}, expected 7`);
      });
  });

  // 10. Shared ?d= URL plays the design and lands in the dye shop
  await check(t('shared ?d= URL plays straight into the weave'), async () => {
    await page.goto(sharedUrl, { waitUntil: 'load' });
    await page.waitForSelector('#board svg');
    const hidden = await page.locator('#view-draw').isHidden();
    if (!hidden) throw new Error('draw view shown instead of the shared weave');
    await page.evaluate(() => window.__toy.skip());
    await page.locator('.chips').waitFor({ state: 'visible', timeout: 25000 });
    const n = await page.evaluate(() => window.__toy.round.n);
    if (n !== myN) throw new Error(`shared weave has ${n} strings, expected ${myN}`);
  });

  // 11-13. The daily swatch, on a fixed day for determinism
  const DAY_URL = `${PAGE_URL}?day=2026-06-20`;
  let target = null;
  const setDim = async (which, want) => {
    const id = which === 'gw' ? 'dw' : 'dh';
    for (let i = 0; i < 40; i++) {
      const cur = await page.evaluate((w) => window.__toy.swatch[w], which);
      if (cur === want) return;
      await page.locator(`#${id}-${cur < want ? 'plus' : 'minus'}`).click();
    }
    throw new Error(`could not step ${which} to ${want}`);
  };

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  await check(t('swatch: wrong string count gets 🧵✗ feedback'), async () => {
    await page.goto(DAY_URL, { waitUntil: 'load' });
    await page.waitForSelector('#swatch svg');
    target = await page.evaluate(() => window.__toy.swatch.target);
    if (vp.label === 'phone') await shot('swatch');
    const gT = target.colors.length;
    // a loom with a different string count
    let wW = 0, wH = 0;
    outer1: for (let w = 7; w <= 20; w++) for (let hh = 5; hh <= 16; hh++) {
      if (gcd(w, hh) !== gT) { wW = w; wH = hh; break outer1; }
    }
    await setDim('gw', wW);
    await setDim('gh', wH);
    const slotCount = await page.locator('.slot').count();
    for (let i = 0; i < slotCount; i++) {
      await page.locator(`.slot[data-i="${i}"]`).click();
      await page.locator('.yarn').first().click();
    }
    await page.locator('#commit-btn').click();
    await page.locator('.go-row').first().waitFor({ state: 'visible', timeout: 25000 });
    const row = await page.locator('.go-row').first().textContent();
    if (!row.includes('✗')) throw new Error(`expected a strings ✗ in feedback row: "${row}"`);
  });

  await check(t('swatch: ANY loom with right strings + order wins'), async () => {
    const gT = target.colors.length;
    // deliberately solve on a different board than João's — same cloth
    let aW = target.W, aH = target.H;
    outer2: for (let w = 7; w <= 20; w++) for (let hh = 5; hh <= 16; hh++) {
      if (gcd(w, hh) === gT && !(w === target.W && hh === target.H)) { aW = w; aH = hh; break outer2; }
    }
    await setDim('gw', aW);
    await setDim('gh', aH);
    for (let i = 0; i < target.colors.length; i++) {
      await page.locator(`.slot[data-i="${i}"]`).click();
      await page.locator(`.yarn[data-hex="${target.colors[i]}"]`).click();
    }
    await page.locator('#commit-btn').click();
    await page.locator('#daily-result .ask', { hasText: /2\/6/ }).waitFor({ state: 'visible', timeout: 25000 });
    if (aW !== target.W || aH !== target.H) {
      const line = await page.locator('#daily-result .meta-line').textContent();
      if (!line.includes('same cloth')) throw new Error(`expected "same cloth" note for alternate loom: "${line}"`);
    }
    await page.locator('.btn.next', { hasText: /^share result$/ }).click();
    await page.locator('.btn', { hasText: /copied/ }).waitFor({ state: 'visible' });
    const text = await page.evaluate(() => navigator.clipboard.readText());
    if (!text.includes('the swatch #')) throw new Error(`share text: "${text}"`);
    if (!text.includes('🧵')) throw new Error('share text missing the strings mark');
    if (!text.includes('🟩')) throw new Error('share text missing the colour grid');
    if (vp.label === 'tablet') await shot('swatch-solved');
  });

  await check(t('swatch: solved state restores after reload'), async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#daily-result .ask');
    const ok = await page.evaluate(() => window.__toy.swatch.over && window.__toy.swatch.solved);
    if (!ok) throw new Error('daily state did not restore as solved');
    const loomHidden = await page.locator('#loom').isHidden();
    if (!loomHidden) throw new Error('loom still shown after the day is solved');
  });

  // 14. Zero console errors over the whole interaction
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
