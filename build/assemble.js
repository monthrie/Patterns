#!/usr/bin/env node
/*
 * Assemble the self-contained production index.html:
 *   build/template.html  (head, CSS, body shell — marker: /* %%SCRIPTS%% *​/)
 * + build/vendor-react.js / build/vendor-react-dom.js  (React 18 UMD, inlined for offline use)
 * + src/app.js  (application source — Babel-transpiled JS, the authoritative app code)
 * → ../index.html
 *
 * Usage: node assemble.js   (from build/)
 * Verify after any change: the app must load with no console errors at every tab.
 */
const fs = require('fs');
const path = require('path');

const here = p => path.join(__dirname, p);
const template = fs.readFileSync(here('template.html'), 'utf8');
const react = fs.readFileSync(here('vendor-react.js'), 'utf8');
const reactDom = fs.readFileSync(here('vendor-react-dom.js'), 'utf8');
const engine = fs.readFileSync(here('../src/engine.js'), 'utf8');
const player = fs.readFileSync(here('../src/player.js'), 'utf8');
const qrcode = fs.readFileSync(here('vendor-qrcode.js'), 'utf8'); // QR encoder (MIT, Kazuhiko Arase) for shape-transfer
const app = fs.readFileSync(here('../src/app.js'), 'utf8');

// Replacer must be a function: the code contains `$$` sequences that string
// replacements would interpret as escapes (corrupting React's $$typeof).
const out = template.replace('/* %%SCRIPTS%% */', () => react + reactDom + '\n' + engine + '\n' + player + '\n' + qrcode + '\n' + app);
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), out);
console.log('Wrote ../index.html (' + (out.length / 1024).toFixed(0) + ' KB)');
