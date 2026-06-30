// Six colour-structure iterations on the same 70×105 board (gcd=35 → 35 cycles).
// Geometry is fixed; interest comes from the colour sequence across the 35 cycles.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const N = 35;
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const to = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
};
const rep = (arr, each) => arr.flatMap(c => Array(each).fill(c));
const fit = (arr, n) => Array.from({ length: n }, (_, i) => arr[i % arr.length]);

// 1) ARGYLE — 5 muted yarns, 7 strings each, grouped → plaid diamonds
const argyle = rep(['#2b3a67', '#496a81', '#66999b', '#b2c9ab', '#e4d8b4'], 7);
// 2) PALINDROME GRADIENT — hue ramp out-and-back → mirror-symmetric bands
const ramp = Array.from({ length: 18 }, (_, i) => hslToHex(210 - i * 11, 62, 55));
const palindrome = [...ramp, ...ramp.slice(0, N - ramp.length).reverse()];
// 3) DUOTONE BLOCKS — two yarns in big groups → two huge diamonds
const duotone = [...Array(17).fill('#1b1f3b'), ...Array(18).fill('#e9dcc0')];
// 4) TRIPLE CHECKER — 3 yarns alternating every string → fine 50/50 mix
const triple = fit(['#b5341f', '#f2c14e', '#1f6f6b'], N);
// 5) RAINBOW — 35 distinct hues (harness built-in)
// 6) SCATTER — 8 yarns shuffled (deterministic, no grouping) → pinwheels
const pal8 = ['#e6194b', '#f58231', '#ffe119', '#3cb44b', '#42d4f4', '#4363d8', '#911eb4', '#f032e6'];
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const scatter = Array.from({ length: N }, () => pal8[Math.floor(rnd() * pal8.length)]);

const runs = [
  { name: 'iter1-argyle', colors: argyle.join(','), bg: '#f4f1e8' },
  { name: 'iter2-palindrome', colors: palindrome.join(','), bg: '#f4f1e8' },
  { name: 'iter3-duotone', colors: duotone.join(','), bg: '#3a3f4b' },
  { name: 'iter4-triplecheck', colors: triple.join(','), bg: '#f4f1e8' },
  { name: 'iter5-rainbow', colors: 'rainbow', bg: '#14181d' },
  { name: 'iter6-scatter', colors: scatter.join(','), bg: '#f4f1e8' },
];

for (const r of runs) {
  console.log(`\n=== ${r.name} ===`);
  execFileSync('node', ['render-weave.mjs', '--rect', '70x105', '--colors', r.colors, '--bg', r.bg, '--out', `out/${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
