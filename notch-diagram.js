/*
 * Zoomed notch anatomy diagram (void, flank gaps A/B, throat diagonal).
 * Used beside the shape editor when "Notch guide" is enabled.
 */
(function (global) {
  'use strict';

  const CS = 26;
  const PAD = 10;

  function floodEmpty(cells, gw, gh, sx, sy) {
    const out = [];
    if (sx < 0 || sy < 0 || sx >= gw || sy >= gh || cells[sy][sx]) return out;
    const seen = new Set();
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      const k = x + ',' + y;
      if (seen.has(k) || x < 0 || y < 0 || x >= gw || y >= gh || cells[y][x]) continue;
      seen.add(k);
      out.push({ x, y });
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return out;
  }

  function renderNotch(container, cells, gw, gh, n) {
    const cavitySet = new Set(
      floodEmpty(cells, gw, gh, n.voidCell.cx, n.voidCell.cy).map(c => c.x + ',' + c.y));

    let minX = n.vx - 2, maxX = n.vx + 2, minY = n.vy - 2, maxY = n.vy + 2;
    for (const k of cavitySet) {
      const [x, y] = k.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    minX = Math.max(0, minX);
    minY = Math.max(0, minY);
    maxX = Math.min(gw - 1, maxX);
    maxY = Math.min(gh - 1, maxY);

    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    const w = cols * CS + PAD * 2;
    const h = rows * CS + PAD * 2;

    const px = x => PAD + (x - minX) * CS;
    const py = y => PAD + (y - minY) * CS;
    const gapPx = gx => PAD + (gx - minX) * CS;
    const gapPy = gy => PAD + (gy - minY) * CS;

    const wrap = document.createElement('div');
    wrap.className = 'notch-diagram-notch';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Concave notch: void cavity, flank gaps A and B, throat diagonal');

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const rx = px(x), ry = py(y);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(rx));
        rect.setAttribute('y', String(ry));
        rect.setAttribute('width', String(CS));
        rect.setAttribute('height', String(CS));
        const inCavity = cavitySet.has(x + ',' + y);
        const isVoid = x === n.voidCell.cx && y === n.voidCell.cy;
        if (cells[y][x]) {
          rect.setAttribute('fill', '#2a4a3a');
          rect.setAttribute('stroke', '#3d5a4a');
          rect.setAttribute('stroke-width', '1');
        } else if (inCavity) {
          rect.setAttribute('fill', isVoid ? 'rgba(192,132,252,0.45)' : 'rgba(192,132,252,0.2)');
          rect.setAttribute('stroke', '#c084fc');
          rect.setAttribute('stroke-width', isVoid ? '2' : '1');
        } else {
          rect.setAttribute('fill', '#12161c');
          rect.setAttribute('stroke', '#252d36');
          rect.setAttribute('stroke-width', '1');
        }
        svg.appendChild(rect);
      }
    }

    if (n.bridgeDx + n.bridgeDy === 0) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(gapPx(n.flankA.x)));
      line.setAttribute('y1', String(gapPy(n.flankA.y)));
      line.setAttribute('x2', String(gapPx(n.flankB.x)));
      line.setAttribute('y2', String(gapPy(n.flankB.y)));
      line.setAttribute('stroke', '#fde047');
      line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(line);
    }

    for (const [label, flank, color] of [
      ['A', n.flankA, '#22d3ee'],
      ['B', n.flankB, '#fb923c'],
    ]) {
      const cx = gapPx(flank.x), cy = gapPy(flank.y);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(cx));
      circle.setAttribute('cy', String(cy));
      circle.setAttribute('r', '9');
      circle.setAttribute('fill', 'rgba(0,0,0,0.65)');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2.5');
      svg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(cx));
      text.setAttribute('y', String(cy + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'system-ui, sans-serif');
      text.textContent = label;
      svg.appendChild(text);
    }

    const nail = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    nail.setAttribute('cx', String(gapPx(n.vx)));
    nail.setAttribute('cy', String(gapPy(n.vy)));
    nail.setAttribute('r', '3');
    nail.setAttribute('fill', '#f472b6');
    svg.appendChild(nail);

    wrap.appendChild(svg);

    const cap = document.createElement('p');
    cap.className = 'notch-diagram-notch-cap';
    cap.textContent = `Corner at grid nail (${n.vx}, ${n.vy}). Purple = empty cavity. A & B = the two flank portal gaps. Yellow dashed = throat diagonal (patch 2).`;
    wrap.appendChild(cap);

    container.appendChild(wrap);
  }

  function render(container, cells, gw, gh) {
    if (!container) return;
    container.innerHTML = '';

    const annotate = global.TwoPanelLoops?.buildConcaveNotchAnnotations;
    if (!annotate) {
      container.innerHTML = '<p class="notch-diagram-empty">Notch diagram needs two-panel-loops.js.</p>';
      return;
    }

    if (!cells?.length || !gw || !gh) {
      container.innerHTML = '<p class="notch-diagram-empty">Draw a shape to see notch anatomy.</p>';
      return;
    }

    const notches = annotate(cells, gw, gh);
    if (!notches.length) {
      container.innerHTML = '<p class="notch-diagram-empty">No concave notch on this shape. Draw an L or boot with an inner corner (reentrant step).</p>';
      return;
    }

    for (const n of notches) renderNotch(container, cells, gw, gh, n);
  }

  global.NotchDiagram = { render };
})(typeof window !== 'undefined' ? window : globalThis);
