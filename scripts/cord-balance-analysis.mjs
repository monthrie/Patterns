/*
 * Cord-balance analysis: tests the central conjecture and hunts for the real
 * characterization of BALANCED boards (all cords equal length).
 *
 *   node scripts/cord-balance-analysis.mjs [maxN]      (default 10)
 *
 * For every balanced multi-cord free polyomino it computes three things:
 *
 *  (A) REFLECTION-TILING (the conjecture). The billiard "unfolding" tiles the
 *      plane iff repeatedly reflecting the board across its boundary edges
 *      gives an embedded tiling (no overlap, full cover). We build that
 *      developing map by BFS and detect the first conflict. CLAIM under test:
 *      balanced <=> reflection-tiling.
 *
 *  (B) SYMMETRY + CORD ORBITS. The board's D4 symmetry subgroup, and how it
 *      permutes the cords. If the symmetry group is transitive on cords they
 *      are congruent => equal length (a clean sufficient condition for balance).
 *      We look for balanced boards where it is NOT transitive ("accidental"
 *      balance) and for balanced boards with NO symmetry at all.
 *
 *  (C) cord-length parity (are all cord lengths even?).
 *
 * Controls: rectangles must reflection-tile; the P-pentomino (4,6) must not.
 */
import '../src/engine.js';
const E = globalThis.TearEngine;
const SQRT2 = Math.SQRT2;
const MAXN = Math.max(1, Math.min(12, parseInt(process.argv[2] || '10', 10)));

// ---------- enumeration (Redelmeier, same as the trusted census) ----------
const A000105 = [0,1,1,2,5,12,35,108,369,1285,4655,17073,63600];
const TRANSFORMS = [
  (x,y)=>[x,y],(x,y)=>[-x,y],(x,y)=>[x,-y],(x,y)=>[-x,-y],
  (x,y)=>[y,x],(x,y)=>[-y,x],(x,y)=>[y,-x],(x,y)=>[-y,-x],
];
function canonicalKey(points){
  let best=null;
  for(const t of TRANSFORMS){
    const m=points.map(([x,y])=>t(x,y));
    let mx=Infinity,my=Infinity; for(const[x,y]of m){if(x<mx)mx=x;if(y<my)my=y;}
    const k=String.fromCharCode(...m.map(([x,y])=>(x-mx)*64+(y-my)).sort((a,b)=>a-b));
    if(best===null||k<best)best=k;
  }
  return best;
}
function keyToPoints(key){return[...key].map(c=>{const v=c.charCodeAt(0);return[(v/64)|0,v%64];});}

function enumerateFree(maxN){
  const out=Array.from({length:maxN+1},()=>new Set());
  const W=2*maxN,H=maxN+1,originX=maxN-1,origin=originX;
  const occupied=new Uint8Array(W*H),reached=new Uint8Array(W*H),current=[];
  function rec(untried,size){
    let i=untried.length;
    while(i>0){
      const c=untried[--i]; occupied[c]=1; current.push(c);
      const n=size+1;
      const pts=current.map(idx=>[(idx%W)-originX,(idx/W)|0]);
      let mx=Infinity,my=Infinity; for(const p of pts){if(p[0]<mx)mx=p[0];if(p[1]<my)my=p[1];}
      out[n].add(canonicalKey(pts.map(([x,y])=>[x-mx,y-my])));
      if(n<maxN){
        const x=c%W,y=(c/W)|0,cand=[];
        if(x+1<W)cand.push(c+1); if(x-1>=0)cand.push(c-1);
        if(y+1<H)cand.push(c+W); if(y-1>=0)cand.push(c-W);
        const added=[],next=untried.slice(0,i);
        for(const nb of cand){const nx=nb%W,ny=(nb/W)|0;
          if(reached[nb]||occupied[nb])continue; if(ny===0&&nx<originX)continue;
          reached[nb]=1; added.push(nb); next.push(nb);}
        rec(next,n);
        for(const a of added)reached[a]=0;
      }
      occupied[c]=0; current.pop();
    }
  }
  reached[origin]=1; rec([origin],0);
  return out;
}

// ---------- cords ----------
function cellsFromPoints(pts){
  const gw=Math.max(...pts.map(p=>p[0]))+1, gh=Math.max(...pts.map(p=>p[1]))+1;
  const cells=Array.from({length:gh},()=>Array(gw).fill(false));
  for(const[x,y]of pts)cells[y][x]=true;
  return {cells,gw,gh};
}
function cordsOf(pts){
  const {cells,gw,gh}=cellsFromPoints(pts);
  const {cycles,gaps}=E.getAllCycles(cells,gw,gh);
  const lens=cycles.map(c=>Math.round(E.arcLen(c.points)/SQRT2));
  return {cycles,gaps,lens,cells,gw,gh};
}

// ---------- (A) reflection-tiling developing map ----------
const RADIUS=28;
function reflTiles(pts){
  const baseCells=pts.map(([x,y])=>[x,y]);
  const cellOf=(g,cx,cy)=>[ g.a===1? cx+g.c : g.c-cx-1, g.b===1? cy+g.d : g.d-cy-1 ];
  const compose=(g2,g1)=>({a:g2.a*g1.a, c:g2.a*g1.c+g2.c, b:g2.b*g1.b, d:g2.b*g1.d+g2.d});
  const gkey=g=>`${g.a},${g.c},${g.b},${g.d}`;
  const copyCells=g=>baseCells.map(([cx,cy])=>cellOf(g,cx,cy));
  const cover=new Map();          // "col,row" -> gkey
  const placed=new Set();
  const queue=[];
  const place=(g)=>{
    const k=gkey(g);
    const cs=copyCells(g);
    for(const[col,row]of cs){
      const ck=col+','+row, ex=cover.get(ck);
      if(ex!==undefined && ex!==k) return false;    // overlap conflict
    }
    if(placed.has(k)) return true;
    for(const[col,row]of cs) cover.set(col+','+row,k);
    placed.add(k); queue.push({g,cells:cs});
    return true;
  };
  const id={a:1,c:0,b:1,d:0};
  if(!place(id)) return false;
  let head=0, ok=true;
  while(head<queue.length){
    const {g,cells}=queue[head++];
    const cellSet=new Set(cells.map(([c,r])=>c+','+r));
    for(const[col,row]of cells){
      if(Math.abs(col)>RADIUS||Math.abs(row)>RADIUS) continue;
      const nbrs=[[col+1,row,{a:-1,c:2*(col+1),b:1,d:0}],
                  [col-1,row,{a:-1,c:2*col,    b:1,d:0}],
                  [col,row+1,{a:1,c:0,b:-1,d:2*(row+1)}],
                  [col,row-1,{a:1,c:0,b:-1,d:2*row}]];
      for(const[nc,nr,sigma]of nbrs){
        if(cellSet.has(nc+','+nr))continue;          // internal edge
        const gp=compose(sigma,g);
        if(!place(gp)){ ok=false; break; }
      }
      if(!ok)break;
    }
    if(!ok)break;
  }
  if(!ok) return false;
  // coverage check on an inner box
  for(let x=-RADIUS/2;x<=RADIUS/2;x++)
    for(let y=-RADIUS/2;y<=RADIUS/2;y++)
      if(!cover.has(x+','+y)) return false;
  return true;
}

// ---------- (B) symmetry + cord orbits ----------
const LIN=[
  (x,y)=>[x,y],(x,y)=>[-x,y],(x,y)=>[x,-y],(x,y)=>[-x,-y],
  (x,y)=>[y,x],(x,y)=>[-y,x],(x,y)=>[y,-x],(x,y)=>[-y,-x],
];
function symmetryAffines(pts){
  // returns list of {lin, tx, ty} fixing the cell set
  const centers=pts.map(([x,y])=>[x+0.5,y+0.5]);
  const key=set=>set.map(([x,y])=>x.toFixed(2)+','+y.toFixed(2)).sort().join(';');
  const origKey=key(centers);
  const affs=[];
  for(let li=0;li<LIN.length;li++){
    const f=LIN[li];
    const tc=centers.map(([x,y])=>f(x,y));
    let mnx=Infinity,mny=Infinity,omnx=Infinity,omny=Infinity;
    for(const[x,y]of tc){if(x<mnx)mnx=x;if(y<mny)mny=y;}
    for(const[x,y]of centers){if(x<omnx)omnx=x;if(y<omny)omny=y;}
    const tx=omnx-mnx, ty=omny-mny;
    const moved=tc.map(([x,y])=>[x+tx,y+ty]);
    if(key(moved)===origKey) affs.push({li,tx,ty});
  }
  return affs;
}
function cordOrbits(pts){
  const {cycles,gaps}=cordsOf(pts);
  const L=cycles.length;
  if(L===0) return {L:0,groupSize:1,orbits:1,transitive:true};
  const affs=symmetryAffines(pts);
  // gap coord -> index
  const gkey=(x,y)=>x.toFixed(2)+','+y.toFixed(2);
  const gapIndex=new Map(); gaps.forEach((g,i)=>gapIndex.set(gkey(g.x,g.y),i));
  // cord membership: gap index -> cord id
  const cordOf=new Array(gaps.length).fill(-1);
  cycles.forEach((cy,ci)=>{ for(const gi of cy.gaps) cordOf[gi]=ci; });
  // build cord permutations from each symmetry
  const perms=[];
  for(const {li,tx,ty} of affs){
    const f=LIN[li];
    const perm=new Array(L).fill(-1);
    let good=true;
    for(let ci=0; ci<L && good; ci++){
      // take one gap of cord ci, map it, see which cord it lands in; verify whole cord lands in one cord
      let target=-1;
      for(const gi of cycles[ci].gaps){
        const g=gaps[gi];
        const [mx,my]=f(g.x,g.y);
        const j=gapIndex.get(gkey(mx+tx,my+ty));
        if(j===undefined){good=false;break;}
        const tc=cordOf[j];
        if(target===-1)target=tc; else if(target!==tc){good=false;break;}
      }
      perm[ci]=target;
    }
    if(good)perms.push(perm);
  }
  // union-find orbits under all perms
  const par=Array.from({length:L},(_,i)=>i);
  const find=a=>{while(par[a]!==a){par[a]=par[par[a]];a=par[a];}return a;};
  const uni=(a,b)=>{par[find(a)]=find(b);};
  for(const p of perms) for(let i=0;i<L;i++) if(p[i]>=0) uni(i,p[i]);
  const roots=new Set(); for(let i=0;i<L;i++)roots.add(find(i));
  return {L, groupSize:affs.length, orbits:roots.size, transitive:roots.size===1};
}

// ---------- run ----------
console.log(`# Cord-balance analysis up to n=${MAXN}\n`);

// controls
const rect=(w,h)=>{const p=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)p.push([x,y]);return p;};
console.log('Controls (reflection-tiling developing map):');
for(const [w,h] of [[1,1],[2,2],[2,3],[3,4],[1,5]])
  console.log(`  ${w}x${h} rectangle: tiles=${reflTiles(rect(w,h))}`);
const Ppent=[[1,0],[2,0],[0,1],[1,1],[2,1]]; // .## / ###
const pc=cordsOf(Ppent);
console.log(`  P-pentomino (cords ${pc.lens.slice().sort((a,b)=>a-b).join(',')}): tiles=${reflTiles(Ppent)}`);

const free=enumerateFree(MAXN);

// global parity + reflection-tiling-vs-rectangle sweep
let anyOddCord=0, nonRectThatTiles=0, rectThatFails=0, nonRectTotal=0;
const balancedRows=[];
let symStats={total:0,withSym:0,transitive:0,notTransitive:0,noSym:0,balancedAndTiles:0};
const accidental=[]; // balanced but cords NOT transitive under symmetry
const noSymBalanced=[]; // balanced with trivial symmetry group

for(let n=4;n<=MAXN;n++){
  for(const key of free[n]){
    const pts=keyToPoints(key);
    const {cycles,lens}=cordsOf(pts);
    for(const L of lens) if(L%2!==0) anyOddCord++;
    const L=cycles.length;
    if(L<2) continue;
    const sorted=lens.slice().sort((a,b)=>a-b);
    const balanced = sorted[0]===sorted[sorted.length-1];
    const isRect = (()=>{let mx=0,my=0;for(const[x,y]of pts){if(x>mx)mx=x;if(y>my)my=y;}return (mx+1)*(my+1)===n;})();
    if(!isRect){
      nonRectTotal++;
      const tiles=reflTiles(pts);
      if(tiles)nonRectThatTiles++;
    } else {
      if(!reflTiles(pts))rectThatFails++;
    }
    if(balanced){
      symStats.total++;
      const {groupSize,orbits,transitive}=cordOrbits(pts);
      if(groupSize>1)symStats.withSym++; else {symStats.noSym++; noSymBalanced.push({n,key,lens:sorted});}
      if(transitive)symStats.transitive++; else {symStats.notTransitive++; accidental.push({n,key,lens:sorted,orbits});}
      if(reflTiles(pts))symStats.balancedAndTiles++;
    }
  }
}

console.log(`\n## (C) parity: cords with ODD length found = ${anyOddCord}  (expect 0 => all cord lengths even)`);
console.log(`\n## (A) reflection-tiling sweep (all multi-cord boards, n=4..${MAXN})`);
console.log(`  non-rectangles tested: ${nonRectTotal}; of these that reflection-tile: ${nonRectThatTiles}`);
console.log(`  rectangles that FAIL to reflection-tile: ${rectThatFails}`);
console.log(`  => reflection-tiling == rectangle?  ${nonRectThatTiles===0 && rectThatFails===0 ? 'YES' : 'NO'}`);

console.log(`\n## (B) balanced boards vs symmetry (n=4..${MAXN})`);
console.log(`  balanced total: ${symStats.total}`);
console.log(`  with nontrivial symmetry: ${symStats.withSym}   trivial symmetry (asymmetric): ${symStats.noSym}`);
console.log(`  symmetry transitive on cords: ${symStats.transitive}   NOT transitive: ${symStats.notTransitive}`);
console.log(`  balanced AND reflection-tiles: ${symStats.balancedAndTiles}  (should equal balanced rectangles)`);

if(accidental.length){
  console.log(`\n  "accidental" balanced (cords NOT one symmetry orbit), count ${accidental.length}:`);
  for(const a of accidental.slice(0,30)){
    const pts=keyToPoints(a.key);
    const mx=Math.max(...pts.map(p=>p[0])),my=Math.max(...pts.map(p=>p[1]));
    const g=Array.from({length:my+1},()=>Array(mx+1).fill('.'));
    for(const[x,y]of pts)g[y][x]='#';
    console.log(`   n=${a.n} lens=${a.lens.join(',')} orbits=${a.orbits}\n     ${g.map(r=>r.join('')).join('\n     ')}`);
  }
}
if(noSymBalanced.length){
  console.log(`\n  balanced with NO symmetry, count ${noSymBalanced.length}:`);
  for(const a of noSymBalanced.slice(0,30)){
    const pts=keyToPoints(a.key);
    const mx=Math.max(...pts.map(p=>p[0])),my=Math.max(...pts.map(p=>p[1]));
    const g=Array.from({length:my+1},()=>Array(mx+1).fill('.'));
    for(const[x,y]of pts)g[y][x]='#';
    console.log(`   n=${a.n} lens=${a.lens.join(',')}\n     ${g.map(r=>r.join('')).join('\n     ')}`);
  }
}
