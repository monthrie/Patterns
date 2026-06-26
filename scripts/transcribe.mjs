/*
 * Transcribe interview videos via OpenAI whisper-1.
 *   node scripts/transcribe.mjs <video-or-audio file | folder> [...more]
 *
 * - extracts mono 16k mp3 (32kbps) with ffmpeg
 * - auto-chunks long audio to stay under the 25MB API limit
 * - writes docs/interviews/<basename>.md with [mm:ss] timestamped segments
 * - reads OPENAI_API_KEY from .env at repo root (gitignored) or the environment
 * - cost: $0.006/min ≈ $0.36 per hour of footage
 */
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'docs', 'interviews');
mkdirSync(OUT, { recursive: true });

let KEY = process.env.OPENAI_API_KEY;
if (!KEY && existsSync(join(root, '.env'))) {
  const m = readFileSync(join(root, '.env'), 'utf8').match(/OPENAI_API_KEY=(.+)/);
  if (m) KEY = m[1].trim();
}
if (!KEY) { console.error('No OPENAI_API_KEY in env or .env'); process.exit(1); }

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.avi', '.mkv', '.mp3', '.m4a', '.wav', '.aac', '.ogg']);
const args = process.argv.slice(2);
if (!args.length) { console.error('Usage: node scripts/transcribe.mjs <file|folder> [...]'); process.exit(1); }

const files = [];
for (const a of args) {
  const st = statSync(a);
  if (st.isDirectory()) {
    for (const f of readdirSync(a)) if (VIDEO_EXT.has(extname(f).toLowerCase())) files.push(join(a, f));
  } else files.push(a);
}
if (!files.length) { console.error('No media files found.'); process.exit(1); }

const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

async function transcribeChunk(path, language) {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)], { type: 'audio/mpeg' }), basename(path));
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');
  if (language) form.append('language', language);
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: form,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const CHUNK_SECONDS = 1500; // 25 min @ 32kbps mono ≈ 6MB, well under 25MB

for (const file of files) {
  const name = basename(file, extname(file));
  const outPath = join(OUT, name + '.md');
  if (existsSync(outPath)) { console.log(`SKIP (transcript exists): ${name}`); continue; }
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', file]).toString());
  const duration = parseFloat(probe.format.duration || '0');
  console.log(`\n${name}: ${fmt(duration)} (${(duration / 60 * 0.006).toFixed(2)} USD)`);

  const tmp = join(tmpdir(), 'joao-transcribe-' + Date.now());
  mkdirSync(tmp, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'quiet', '-i', file, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k',
    '-f', 'segment', '-segment_time', String(CHUNK_SECONDS), join(tmp, 'chunk-%03d.mp3')]);
  const chunks = readdirSync(tmp).sort();

  let allSegments = [], language = null;
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  chunk ${i + 1}/${chunks.length}... `);
    const r = await transcribeChunk(join(tmp, chunks[i]), language);
    if (!language && r.language) language = r.language === 'portuguese' ? 'pt' : r.language === 'english' ? 'en' : null;
    const offset = i * CHUNK_SECONDS;
    for (const s of r.segments || []) allSegments.push({ start: s.start + offset, text: s.text.trim() });
    console.log(`ok (${r.language || '?'})`);
  }
  rmSync(tmp, { recursive: true, force: true });

  const lines = [`# Transcript: ${name}`, '', `Source: \`${file}\` · duration ${fmt(duration)} · detected language: ${language || 'mixed/unknown'} · whisper-1, ${new Date().toISOString().slice(0, 10)}`,
    '', '> Raw machine transcript — no speaker labels (Whisper limitation). Attribution and fact-mining happen in a separate pass.', ''];
  for (const s of allSegments) lines.push(`**[${fmt(s.start)}]** ${s.text}`);
  writeFileSync(outPath, lines.join('\n') + '\n');
  console.log(`  → docs/interviews/${name}.md (${allSegments.length} segments)`);
}
console.log('\nDone.');
