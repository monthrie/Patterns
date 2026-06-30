// Explore: 28 cycles (56×84 board), 6 colours, many arrangements. Same palette throughout
// so the comparison is purely about how the colours are sequenced across the 28 strings.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));

const C0 = '#0d1b2a', C1 = '#e5383b', C2 = '#f4a259', C3 = '#3ec9b0', C4 = '#f6e7c1', C5 = '#9d4edd';
const P = [C0, C1, C2, C3, C4, C5];               // navy · red · apricot · teal · cream · violet
const groups = (sizes, cols) => sizes.flatMap((s, i) => Array(s).fill(cols[i]));
const fit = (a, n) => Array.from({ length: n }, (_, i) => a[i % a.length]);
const mk = (s) => { let x = s; return () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };
const shuffle = (a, seed) => { const r = mk(seed); const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[b[i], b[j]] = [b[j], b[i]]; } return b; };

const arrangements = {
  '01-argyle': groups([5, 5, 5, 5, 4, 4], P),
  '02-palindrome': (() => { const a = groups([3, 3, 2, 2, 2, 2], P); return [...a, ...[...a].reverse()]; })(),
  '03-scatter': shuffle(groups([5, 5, 5, 5, 4, 4], P), 17),
  '04-twobig': groups([8, 8, 3, 3, 3, 3], [C0, C3, C1, C2, C5, C4]),  // navy & teal big, rest thin
  '05-gradient': groups([5, 5, 5, 5, 4, 4], [C5, C0, C3, C4, C2, C1]),// ordered by hue
  '06-tweed': fit(P, 28),                                             // 1-string alternation
  '07-confetti': Array.from({ length: 28 }, (_, i) => { const r = mk(3 + i)(); return r < 0.5 ? C0 : P[1 + Math.floor(mk(99 + i)() * 5)]; }),
  '08-nested': (() => { const h = fit(P, 14); return [...h, ...[...h].reverse()]; })(),
  '09-scatter2': shuffle(groups([5, 5, 5, 5, 4, 4], P), 88),
  '10-tribig': groups([6, 6, 6, 4, 3, 3], [C0, C1, C3, C5, C2, C4]),  // three big blocks + accents
};

for (const [name, colors] of Object.entries(arrangements)) {
  const colors28 = fit(colors, 28);
  const spec = { name: `expl-${name}`, rect: [56, 84], colors: colors28, bg: '#15181f' };
  fs.writeFileSync(path.join(HERE, `shapes/expl-${name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${name} ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/expl-${name}.json`, '--out', `out/expl-${name}.png`], { cwd: HERE, stdio: 'inherit' });
}
