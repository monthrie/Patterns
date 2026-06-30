// Chase the EMERGENT axis-aligned squares seen in 11a. g=11, board 44×55 (squarer).
// Each cord array is monotonic trough(index0)->centre(index10); the engine's zigzag mirrors it,
// so index0 = the inter-centre node (square gaps), index10 = the radiating centre.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const bg = '#141319';

const runs = [
  // 1) sharp mono rings — stepped (doubled) dark->white, crisp concentric rings
  { name: '1-mono-sharp', colors: ['#0c0c16', '#0c0c16', '#262657', '#262657', '#5b5bc9', '#5b5bc9', '#a3a3ee', '#a3a3ee', '#e8e8ff', '#ffffff', '#ffffff'] },
  // 2) thick dark frame + warm centre — bold dark gaps around bright diamonds
  { name: '2-thick-frame', colors: ['#0c0a10', '#0c0a10', '#0c0a10', '#7a2d1f', '#b5471f', '#e07a2a', '#ffab3b', '#ffd166', '#ffe9b8', '#fff6df', '#ffffff'] },
  // 3) two interleaved centres — gold & cyan bright cords alternating on a dark frame
  { name: '3-two-centres', colors: ['#0c0c16', '#ffd166', '#0c0c16', '#21c0c0', '#0c0c16', '#ffd166', '#0c0c16', '#21c0c0', '#0c0c16', '#ffd166', '#0c0c16'] },
  // 4) strong RING colour — red ring sits between dark gap and white centre
  { name: '4-red-ring', colors: ['#0c0c16', '#0c0c16', '#c01f2a', '#e5383b', '#ff6b3d', '#ffab3b', '#ffd166', '#ffe3a0', '#fff0cc', '#fffaf0', '#ffffff'] },
  // 5) bimodal 2-tone control — sharp navy/cream split (expected: diamonds, not squares)
  { name: '5-bimodal', colors: ['#11224a', '#11224a', '#11224a', '#11224a', '#11224a', '#11224a', '#f4ead0', '#f4ead0', '#f4ead0', '#f4ead0', '#f4ead0'] },
  // 6) gap-defining — make the GAP node a strong distinct colour (teal), centre warm
  { name: '6-teal-gap', colors: ['#16b0a6', '#16b0a6', '#0c0c16', '#3a1a2e', '#7a2d3a', '#b5471f', '#e07a2a', '#ffab3b', '#ffd166', '#ffe9b8', '#ffffff'] },
];

for (const r of runs) {
  const spec = { name: `sq-${r.name}`, rect: [44, 55], colors: r.colors, bg };
  fs.writeFileSync(path.join(HERE, `shapes/sq-${r.name}.json`), JSON.stringify(spec));
  console.log(`\n=== ${r.name} ===`);
  execFileSync('node', ['render-weave.mjs', '--shape', `shapes/sq-${r.name}.json`, '--out', `out/sq-${r.name}.png`], { cwd: HERE, stdio: 'inherit' });
}
