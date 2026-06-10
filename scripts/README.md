# scripts/ — smoke tests

Automated smoke test for the built app (`index.html`). Run it after every change
(rebuild with `cd build && node assemble.js` first).

## Setup (once)

```
cd scripts && npm install
```

Uses `playwright-core` driving the system Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` — no browser
binaries are downloaded.

## Run

```
cd scripts && npm run smoke
```

- Reuses a dev server already on `http://localhost:8901`, otherwise spawns
  `node build/serve.js` itself and kills it afterwards.
- Exit code 0 = all green; 1 = failures (summary printed at the end).
- Screenshots land in `scripts/artifacts/` (gitignored).

## What it checks (in landscape 1280×800 and portrait 800×1280)

1. App loads; `document.title` has no `ERRO:` prefix; zero console/page errors.
2. Stats bar shows **2 fios** on the default 18×10 grid.
3. Each bottom tab opens: **FORMAS** has Guardar/Exportar/Importar + preset
   chips; **VER** has the Fio strand options (fino/grosso/linha); **DESENHAR**
   shows the cell-grid editor.
4. A pointer drag across grid cells changes the fios count (live re-trace).
5. The stats-bar **SÓ O PADRÃO** button toggles to **VOLTAR** and back.
6. Error counters re-checked after all interactions; full-page screenshot saved.

Note: Chrome's automatic `/favicon.ico` request 404s (the app ships no favicon);
that specific console error is filtered out deliberately.
