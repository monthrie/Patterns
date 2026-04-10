import { useState, useRef, useCallback } from "react";

/*
  BOOT GEOMETRY — SYMMETRICAL NET
  ────────────────────────────────
  Two cuboids joined together, open at the top:
  
  Side view:
       ┌─────┐  ← open top
       │ SHIN│
       │     │
  ┌────┴─────┘
  │   FOOT    │
  └───────────┘

  Net layout (symmetrical cross):

          [shin back]
   [sL]  [shin base]  [sR]
          [heel]
   [fL]  [sole]       [fR]
          [toe]
          [foot top]
          [shin front]
*/

function buildBootNet({ footL, footH, footW, shinL, shinH }) {
  const faces = [];
  const foldLines = [];
  
  // ─── SYMMETRICAL CROSS LAYOUT ───
  //
  // Everything on a central vertical axis with sides mirroring L/R:
  //
  //              [shin back]          shinH tall
  //       [sL]  [shin base]  [sR]    shinL tall, sides are shinH wide
  //              [heel]               footH tall
  //       [fL]  [sole]       [fR]    footL tall, sides are footH wide  
  //              [toe]                footH tall
  //              [foot top]           (footL - shinL) tall  ← only the open part
  //              [shin front]         shinH tall  ← continuous with foot top
  //
  // Central column is footW wide.
  // All centered on x = centerX.
  
  const centerX = 0; // left edge of central column
  
  // Build from bottom up (shin front at bottom, shin back at top)
  // Actually let's go top-to-bottom in the net:
  
  let y = 0; // running Y cursor
  
  // 1. Shin back (top of net)
  faces.push({ id: "shin-back", label: "Shin Back", x: centerX, y, w: footW, h: shinH, color: "#D4734A", group: "shin" });
  const shinBackBottom = y + shinH;
  y += shinH;
  
  // 2. Shin base + shin L/R (cross row)
  // Fold: shin-back ↔ shin-base
  foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
  
  faces.push({ id: "shin-left", label: "Shin L", x: centerX - shinH, y, w: shinH, h: shinL, color: "#6BBD82", group: "shin" });
  foldLines.push({ x1: centerX, y1: y, x2: centerX, y2: y + shinL }); // shin-left ↔ shin-base
  
  faces.push({ id: "shin-base", label: "Shin Base", x: centerX, y, w: footW, h: shinL, color: "#D4A843", group: "shin" });
  
  faces.push({ id: "shin-right", label: "Shin R", x: centerX + footW, y, w: shinH, h: shinL, color: "#6BBD82", group: "shin" });
  foldLines.push({ x1: centerX + footW, y1: y, x2: centerX + footW, y2: y + shinL }); // shin-base ↔ shin-right
  
  y += shinL;
  
  // 3. Heel face
  // Fold: shin-base ↔ heel
  foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
  
  faces.push({ id: "heel", label: "Heel", x: centerX, y, w: footW, h: footH, color: "#E8594A", group: "foot" });
  y += footH;
  
  // 4. Sole + foot L/R (cross row)
  // Fold: heel ↔ sole
  foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
  
  faces.push({ id: "foot-left", label: "Left", x: centerX - footH, y, w: footH, h: footL, color: "#5BBD72", group: "foot" });
  foldLines.push({ x1: centerX, y1: y, x2: centerX, y2: y + footL }); // foot-left ↔ sole
  
  faces.push({ id: "sole", label: "Sole", x: centerX, y, w: footW, h: footL, color: "#5B8DBE", group: "foot" });
  
  faces.push({ id: "foot-right", label: "Right", x: centerX + footW, y, w: footH, h: footL, color: "#5BBD72", group: "foot" });
  foldLines.push({ x1: centerX + footW, y1: y, x2: centerX + footW, y2: y + footL }); // sole ↔ foot-right
  
  y += footL;
  
  // 5. Toe face
  // Fold: sole ↔ toe
  foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
  
  faces.push({ id: "toe", label: "Toe", x: centerX, y, w: footW, h: footH, color: "#E8594A", group: "foot" });
  y += footH;
  
  // 6. Foot top (only the part NOT covered by shin) — folds up from toe
  const footTopH = footL - shinL;
  if (footTopH > 0) {
    // Fold: toe ↔ foot-top
    foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
    
    faces.push({ id: "foot-top", label: "Foot Top", x: centerX, y, w: footW, h: footTopH, color: "#7B68AE", group: "foot" });
    y += footTopH;
  }
  
  // 7. Shin front — continues directly below foot top (they share an edge in 3D)
  // Fold: foot-top ↔ shin-front (or toe ↔ shin-front if footTopH is 0)
  foldLines.push({ x1: centerX, y1: y, x2: centerX + footW, y2: y });
  
  faces.push({ id: "shin-front", label: "Shin Front", x: centerX, y, w: footW, h: shinH, color: "#D4734A", group: "shin" });
  y += shinH;
  
  return { faces, foldLines };
}


function BootFace({ face, hovered, onHover, onLeave, showLabels }) {
  const isHovered = hovered === face.id;
  return (
    <g onMouseEnter={() => onHover(face.id)} onMouseLeave={onLeave}>
      <rect
        x={face.x}
        y={face.y}
        width={face.w}
        height={face.h}
        fill={face.color}
        stroke="#1a1a2e"
        strokeWidth="2.5"
        rx="1"
        style={{
          filter: isHovered ? "brightness(1.25)" : "none",
          cursor: "pointer",
          transition: "filter 0.15s",
        }}
      />
      {showLabels && (
        <text
          x={face.x + face.w / 2}
          y={face.y + face.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={Math.min(face.w, face.h) > 40 ? 12 : 9}
          fontWeight="600"
          fontFamily="'DM Mono', monospace"
          opacity="0.9"
          style={{ pointerEvents: "none" }}
        >
          {face.label}
        </text>
      )}
    </g>
  );
}

const TAB_SIZE = 12;

function GlueTabs({ faces, foldLines, show }) {
  if (!show) return null;
  
  // Add tabs to edges that are NOT fold lines (i.e., free edges that need gluing)
  const tabs = [];
  
  faces.forEach((face) => {
    const edges = [
      { x1: face.x, y1: face.y, x2: face.x + face.w, y2: face.y, nx: 0, ny: -1 },
      { x1: face.x + face.w, y1: face.y, x2: face.x + face.w, y2: face.y + face.h, nx: 1, ny: 0 },
      { x1: face.x + face.w, y1: face.y + face.h, x2: face.x, y2: face.y + face.h, nx: 0, ny: 1 },
      { x1: face.x, y1: face.y + face.h, x2: face.x, y2: face.y, nx: -1, ny: 0 },
    ];
    
    edges.forEach((edge, ei) => {
      // Check if this edge is a fold line
      const isFold = foldLines.some((fl) => {
        const match1 = Math.abs(fl.x1 - edge.x1) < 2 && Math.abs(fl.y1 - edge.y1) < 2 &&
                       Math.abs(fl.x2 - edge.x2) < 2 && Math.abs(fl.y2 - edge.y2) < 2;
        const match2 = Math.abs(fl.x1 - edge.x2) < 2 && Math.abs(fl.y1 - edge.y2) < 2 &&
                       Math.abs(fl.x2 - edge.x1) < 2 && Math.abs(fl.y2 - edge.y1) < 2;
        return match1 || match2;
      });
      
      // Check if this edge is shared with another face (adjacent but not via fold line)
      const isShared = faces.some((other) => {
        if (other.id === face.id) return false;
        const otherEdges = [
          { x1: other.x, y1: other.y, x2: other.x + other.w, y2: other.y },
          { x1: other.x + other.w, y1: other.y, x2: other.x + other.w, y2: other.y + other.h },
          { x1: other.x + other.w, y1: other.y + other.h, x2: other.x, y2: other.y + other.h },
          { x1: other.x, y1: other.y + other.h, x2: other.x, y2: other.y },
        ];
        return otherEdges.some((oe) => {
          const m1 = Math.abs(oe.x1 - edge.x1) < 2 && Math.abs(oe.y1 - edge.y1) < 2 &&
                     Math.abs(oe.x2 - edge.x2) < 2 && Math.abs(oe.y2 - edge.y2) < 2;
          const m2 = Math.abs(oe.x1 - edge.x2) < 2 && Math.abs(oe.y1 - edge.y2) < 2 &&
                     Math.abs(oe.x2 - edge.x1) < 2 && Math.abs(oe.y2 - edge.y1) < 2;
          return m1 || m2;
        });
      });
      
      if (!isFold && !isShared) {
        // Free edge — add a tab
        const dx = edge.x2 - edge.x1;
        const dy = edge.y2 - edge.y1;
        const inset = 0.12;
        const p = [
          [edge.x1 + dx * inset, edge.y1 + dy * inset],
          [edge.x2 - dx * inset, edge.y2 - dy * inset],
          [edge.x2 - dx * inset + edge.nx * TAB_SIZE, edge.y2 - dy * inset + edge.ny * TAB_SIZE],
          [edge.x1 + dx * inset + edge.nx * TAB_SIZE, edge.y1 + dy * inset + edge.ny * TAB_SIZE],
        ];
        tabs.push(
          <polygon
            key={`tab-${face.id}-${ei}`}
            points={p.map((pt) => pt.join(",")).join(" ")}
            fill={face.color}
            opacity={0.25}
            stroke="#555"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        );
      }
    });
  });
  
  return <>{tabs}</>;
}


export default function BootNetGenerator() {
  const [footL, setFootL] = useState(160);
  const [footW, setFootW] = useState(80);
  const [footH, setFootH] = useState(40);
  const [shinL, setShinL] = useState(70);
  const [shinH, setShinH] = useState(90);
  const [showTabs, setShowTabs] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const svgRef = useRef(null);

  const net = buildBootNet({ footL, footH, footW, shinL, shinH });

  // Compute viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  net.faces.forEach((f) => {
    minX = Math.min(minX, f.x);
    minY = Math.min(minY, f.y);
    maxX = Math.max(maxX, f.x + f.w);
    maxY = Math.max(maxY, f.y + f.h);
  });
  const pad = showTabs ? 50 : 30;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + 2 * pad;
  const vbH = maxY - minY + 2 * pad;

  const downloadSVG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "boot-net.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const jsonData = JSON.stringify({
    description: "Boot net - two joined cuboids, open top. All faces are rectangles. Fold along shared edges, glue free edges.",
    params: { footL, footW, footH, shinL, shinH },
    faces: net.faces.map((f) => ({
      id: f.id,
      label: f.label,
      group: f.group,
      x: f.x,
      y: f.y,
      width: f.w,
      height: f.h,
    })),
    foldLines: net.foldLines.map((fl) => ({
      from: [fl.x1, fl.y1],
      to: [fl.x2, fl.y2],
    })),
    layout: "Symmetrical cross. Central column (footW wide) top-to-bottom: shin_back, shin_base (with shin_L/R flanking), heel, sole (with foot_L/R flanking), toe, foot_top, shin_front. No top on shin (boot opening).",
  }, null, 2);

  const sliders = [
    { label: "Foot Length", value: footL, set: setFootL, min: 80, max: 250, color: "#5B8DBE" },
    { label: "Foot Width", value: footW, set: setFootW, min: 40, max: 150, color: "#5B8DBE" },
    { label: "Foot Height", value: footH, set: setFootH, min: 20, max: 80, color: "#5B8DBE" },
    { label: "Shin Depth", value: shinL, set: setShinL, min: 30, max: 120, color: "#D4A843" },
    { label: "Shin Height", value: shinH, set: setShinH, min: 40, max: 180, color: "#D4A843" },
  ];

  const hoveredFace = net.faces.find((f) => f.id === hovered);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#12121f",
      color: "#d0d0d0",
      fontFamily: "'DM Mono', 'Fira Code', monospace",
      padding: "20px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 30,
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            letterSpacing: "-1px",
          }}>
            🥾 Boot Net Builder
          </h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Two-cuboid boot shape · open top · adjustable dimensions
          </p>
        </div>

        {/* 3D Isometric Preview — driven by actual dimensions */}
        {(() => {
          // Isometric projection helpers
          // We use a simple cabinet/oblique projection for clarity
          const sc = 0.55; // scale factor to fit nicely
          const fl = footL * sc;
          const fw = footW * sc;
          const fh = footH * sc;
          const sl = shinL * sc;
          const sh = shinH * sc;

          // Oblique projection: x-right, y-up, depth goes upper-right at 30deg
          const depthAngle = Math.PI / 6; // 30 degrees
          const depthScale = 0.5;
          const dx = (d) => Math.cos(depthAngle) * d * depthScale;
          const dy = (d) => -Math.sin(depthAngle) * d * depthScale;

          // Origin = front-bottom-left of the foot box
          // We'll compute all 3D corners then project
          const project = (x3, y3, z3) => [
            x3 + dx(z3),
            -y3 + dy(z3), // flip y so up is negative in SVG
          ];

          // Foot box corners (x: length, y: height up, z: width/depth)
          const fbl = project(0, 0, 0);       // front-bottom-left
          const fbr = project(fl, 0, 0);      // front-bottom-right
          const ftl = project(0, fh, 0);      // front-top-left
          const ftr = project(fl, fh, 0);     // front-top-right
          const bbl = project(0, 0, fw);      // back-bottom-left
          const bbr = project(fl, 0, fw);     // back-bottom-right
          const btl = project(0, fh, fw);     // back-top-left
          const btr = project(fl, fh, fw);    // back-top-right

          // Shin sits at the right (heel) end of the foot top
          // Shin base: from x=(fl - sl) to x=fl, full width fw, at y=fh
          const shinX0 = fl - sl;
          const sfl = project(shinX0, fh, 0);      // shin front-bottom-left
          const sfr = project(fl, fh, 0);           // shin front-bottom-right (= ftr)
          const sftl = project(shinX0, fh + sh, 0); // shin front-top-left
          const sftr = project(fl, fh + sh, 0);     // shin front-top-right
          const sbl = project(shinX0, fh, fw);      // shin back-bottom-left
          const sbr = project(fl, fh, fw);           // shin back-bottom-right (= btr)
          const sbtl = project(shinX0, fh + sh, fw); // shin back-top-left
          const sbtr = project(fl, fh + sh, fw);     // shin back-top-right

          const pts = (arr) => arr.map((p) => p.join(",")).join(" ");

          // Compute bounding box for viewBox
          const allPts = [fbl, fbr, ftl, ftr, bbl, bbr, btl, btr, sfl, sfr, sftl, sftr, sbl, sbr, sbtl, sbtr];
          let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
          allPts.forEach(([x, y]) => { mnx = Math.min(mnx, x); mny = Math.min(mny, y); mxx = Math.max(mxx, x); mxy = Math.max(mxy, y); });
          const pvb = 12;
          const vw = mxx - mnx + pvb * 2;
          const vh = mxy - mny + pvb * 2;
          const vxo = mnx - pvb;
          const vyo = mny - pvb;

          return (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <svg width="280" height="160" viewBox={`${vxo} ${vyo} ${vw} ${vh}`} style={{ overflow: "visible" }}>
                {/* Foot box — back faces first (painter's algorithm) */}
                {/* Back face (far side) */}
                <polygon points={pts([bbl, bbr, btr, btl])} fill="#5B8DBE" opacity="0.25" stroke="#fff" strokeWidth="0.7" />
                {/* Bottom face */}
                <polygon points={pts([fbl, fbr, bbr, bbl])} fill="#5B8DBE" opacity="0.35" stroke="#fff" strokeWidth="0.7" />
                {/* Left side face */}
                <polygon points={pts([fbl, ftl, btl, bbl])} fill="#5B8DBE" opacity="0.45" stroke="#fff" strokeWidth="0.7" />
                {/* Top face of foot (visible part: from toe to where shin starts) */}
                {shinX0 > 0 && (
                  <polygon
                    points={pts([ftl, project(shinX0, fh, 0), project(shinX0, fh, fw), btl])}
                    fill="#5B8DBE" opacity="0.7" stroke="#fff" strokeWidth="0.7"
                  />
                )}
                {/* Front face */}
                <polygon points={pts([fbl, fbr, ftr, ftl])} fill="#5B8DBE" opacity="0.55" stroke="#fff" strokeWidth="0.7" />
                {/* Right side face (heel) */}
                <polygon points={pts([fbr, ftr, btr, bbr])} fill="#5B8DBE" opacity="0.4" stroke="#fff" strokeWidth="0.7" />

                {/* Shin box */}
                {/* Shin back face */}
                <polygon points={pts([sbl, sbr, sbtr, sbtl])} fill="#D4A843" opacity="0.25" stroke="#fff" strokeWidth="0.7" />
                {/* Shin left face */}
                <polygon points={pts([sfl, sftl, sbtl, sbl])} fill="#D4A843" opacity="0.5" stroke="#fff" strokeWidth="0.7" />
                {/* Shin front face */}
                <polygon points={pts([sfl, sfr, sftr, sftl])} fill="#D4A843" opacity="0.6" stroke="#fff" strokeWidth="0.7" />
                {/* Shin right face */}
                <polygon points={pts([sfr, sftr, sbtr, sbr])} fill="#D4A843" opacity="0.4" stroke="#fff" strokeWidth="0.7" />

                {/* Open top — dashed outline */}
                <polygon
                  points={pts([sftl, sftr, sbtr, sbtl])}
                  fill="none"
                  stroke="#E8594A"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                {/* "open" label */}
                {(() => {
                  const labelPos = [
                    (sftr[0] + sbtr[0]) / 2 + 4,
                    (sftr[1] + sbtr[1]) / 2 - 3,
                  ];
                  return (
                    <text
                      x={labelPos[0]}
                      y={labelPos[1]}
                      fill="#E8594A"
                      fontSize="7"
                      fontFamily="'DM Mono', monospace"
                      fontWeight="500"
                    >
                      open
                    </text>
                  );
                })()}
              </svg>
            </div>
          );
        })()}

        {/* Controls */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "10px 16px",
          marginBottom: 16,
          padding: "16px",
          background: "#1a1a30",
          borderRadius: 10,
          border: "1px solid #2a2a4a",
        }}>
          {sliders.map((s) => (
            <div key={s.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {s.label}
                </label>
                <span style={{ fontSize: 12, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                style={{ width: "100%", accentColor: s.color }}
              />
            </div>
          ))}
          
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { label: "Tabs", val: showTabs, set: setShowTabs },
              { label: "Labels", val: showLabels, set: setShowLabels },
              { label: "Grid", val: showGrid, set: setShowGrid },
            ].map((t) => (
              <label key={t.label} style={{ fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <input type="checkbox" checked={t.val} onChange={(e) => t.set(e.target.checked)} style={{ accentColor: "#6BBD82" }} />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* SVG Canvas */}
        <div style={{
          background: "#0a0a18",
          borderRadius: 12,
          border: "1px solid #2a2a4a",
          overflow: "hidden",
          position: "relative",
        }}>
          <svg
            ref={svgRef}
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            width="100%"
            style={{ display: "block", maxHeight: 550 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid */}
            {showGrid && (
              <g opacity="0.06">
                {Array.from({ length: Math.ceil(vbW / 20) + 1 }, (_, i) => {
                  const x = Math.floor(vbX / 20) * 20 + i * 20;
                  return <line key={`gv${i}`} x1={x} y1={vbY} x2={x} y2={vbY + vbH} stroke="#fff" strokeWidth="0.5" />;
                })}
                {Array.from({ length: Math.ceil(vbH / 20) + 1 }, (_, i) => {
                  const y = Math.floor(vbY / 20) * 20 + i * 20;
                  return <line key={`gh${i}`} x1={vbX} y1={y} x2={vbX + vbW} y2={y} stroke="#fff" strokeWidth="0.5" />;
                })}
              </g>
            )}

            {/* Glue tabs */}
            <GlueTabs faces={net.faces} foldLines={net.foldLines} show={showTabs} />

            {/* Fold lines */}
            {net.foldLines.map((fl, i) => (
              <line
                key={`fold-${i}`}
                x1={fl.x1}
                y1={fl.y1}
                x2={fl.x2}
                y2={fl.y2}
                stroke="#fff"
                strokeWidth="1"
                strokeDasharray="6 3"
                opacity="0.3"
              />
            ))}

            {/* Faces */}
            {net.faces.map((f) => (
              <BootFace
                key={f.id}
                face={f}
                hovered={hovered}
                onHover={setHovered}
                onLeave={() => setHovered(null)}
                showLabels={showLabels}
              />
            ))}
          </svg>

          {/* Hover info */}
          {hoveredFace && (
            <div style={{
              position: "absolute",
              top: 10,
              left: 10,
              background: "#1a1a30ee",
              border: "1px solid #333",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              color: "#ccc",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: 2,
                background: hoveredFace.color,
              }} />
              {hoveredFace.label} · {hoveredFace.w} × {hoveredFace.h}
            </div>
          )}
        </div>

        {/* Actions & Legend */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#555" }}>
            {[
              { color: "#5B8DBE", label: "Foot" },
              { color: "#E8594A", label: "Toe/Heel" },
              { color: "#5BBD72", label: "Foot Sides" },
              { color: "#7B68AE", label: "Foot Top" },
              { color: "#D4A843", label: "Shin Base" },
              { color: "#D4734A", label: "Shin Walls" },
              { color: "#6BBD82", label: "Shin Sides" },
            ].map((l) => (
              <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowJson((v) => !v)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: showJson ? "2px solid #6BBD82" : "2px solid #D4A843",
                background: showJson ? "#6BBD8222" : "#D4A84322",
                color: showJson ? "#6BBD82" : "#D4A843",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              {showJson ? "▾ Hide JSON" : "▸ Show JSON"}
            </button>
            <button
              onClick={downloadSVG}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "2px solid #5B8DBE",
                background: "#5B8DBE22",
                color: "#5B8DBE",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
              }}
            >
              ↓ Download SVG
            </button>
          </div>
        </div>

        {/* JSON output */}
        {showJson && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
              Select all and copy — paste this into another AI to rebuild the net.
            </p>
            <textarea
              readOnly
              value={jsonData}
              onFocus={(e) => e.target.select()}
              style={{
                width: "100%",
                height: 280,
                background: "#0a0a18",
                color: "#aaa",
                border: "1px solid #2a2a4a",
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                fontFamily: "'DM Mono', 'Fira Code', monospace",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}