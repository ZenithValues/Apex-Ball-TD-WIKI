import { useEffect, useRef } from 'react';
import './Holo3DScene.css';

function parseHexToRgb(hex) {
  const clean = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return [220, 230, 248];
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpVec3(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * 11 pure, non-folding 3D tubular strokes that form the 4 letters "A" "P" "E" "X":
 * - 0: 'A' left diagonal leg
 * - 1: 'A' right diagonal leg
 * - 2: 'A' horizontal crossbar
 * - 3: 'P' vertical stem
 * - 4: 'P' smooth curved upper bowl
 * - 5: 'E' vertical spine
 * - 6: 'E' top horizontal bar
 * - 7: 'E' middle horizontal bar
 * - 8: 'E' bottom horizontal bar
 * - 9: 'X' first diagonal (\)
 * - 10: 'X' second crossing diagonal (/)
 */
const APEX_11_STROKES = [
  // 0: 'A' left leg
  [
    { x: -2.06, y: 0.72, z: 0.01 },
    { x: -1.84, y: 0.0, z: 0.01 },
    { x: -1.62, y: -0.72, z: 0.01 },
  ],
  // 1: 'A' right leg
  [
    { x: -1.62, y: -0.72, z: 0.02 },
    { x: -1.40, y: 0.0, z: 0.02 },
    { x: -1.18, y: 0.72, z: 0.02 },
  ],
  // 2: 'A' crossbar
  [
    { x: -1.86, y: 0.18, z: 0.07 },
    { x: -1.62, y: 0.18, z: 0.07 },
    { x: -1.38, y: 0.18, z: 0.07 },
  ],
  // 3: 'P' vertical stem
  [
    { x: -0.84, y: 0.72, z: 0.06 },
    { x: -0.84, y: 0.0, z: 0.06 },
    { x: -0.84, y: -0.72, z: 0.06 },
  ],
  // 4: 'P' smooth upper bowl
  [
    { x: -0.84, y: -0.72, z: 0.01 },
    { x: -0.42, y: -0.72, z: 0.01 },
    { x: -0.18, y: -0.55, z: 0.01 },
    { x: -0.14, y: -0.35, z: 0.01 },
    { x: -0.18, y: -0.15, z: 0.01 },
    { x: -0.42, y: 0.02, z: 0.01 },
    { x: -0.84, y: 0.02, z: 0.01 },
  ],
  // 5: 'E' vertical spine
  [
    { x: 0.22, y: -0.72, z: 0.06 },
    { x: 0.22, y: 0.0, z: 0.06 },
    { x: 0.22, y: 0.72, z: 0.06 },
  ],
  // 6: 'E' top bar
  [
    { x: 0.22, y: -0.72, z: 0.01 },
    { x: 0.55, y: -0.72, z: 0.01 },
    { x: 0.88, y: -0.72, z: 0.01 },
  ],
  // 7: 'E' middle bar
  [
    { x: 0.22, y: 0.0, z: 0.01 },
    { x: 0.50, y: 0.0, z: 0.01 },
    { x: 0.78, y: 0.0, z: 0.01 },
  ],
  // 8: 'E' bottom bar
  [
    { x: 0.22, y: 0.72, z: 0.01 },
    { x: 0.56, y: 0.72, z: 0.01 },
    { x: 0.90, y: 0.72, z: 0.01 },
  ],
  // 9: 'X' first diagonal (\)
  [
    { x: 1.24, y: -0.72, z: 0.05 },
    { x: 1.65, y: 0.0, z: 0.05 },
    { x: 2.06, y: 0.72, z: 0.05 },
  ],
  // 10: 'X' second crossing diagonal (/)
  [
    { x: 1.24, y: 0.72, z: -0.05 },
    { x: 1.65, y: 0.0, z: -0.05 },
    { x: 2.06, y: -0.72, z: -0.05 },
  ],
];

const STRAND_LAYER_Z = [
  0.01, // 0: A left leg
  0.02, // 1: A right leg
  0.08, // 2: A crossbar (on top of legs)
  0.06, // 3: P stem (on top of bowl joins)
  0.01, // 4: P bowl
  0.06, // 5: E spine (on top of bar joins)
  0.01, // 6: E top bar
  0.01, // 7: E middle bar
  0.01, // 8: E bottom bar
  0.05, // 9: X front diagonal (\)
  -0.05, // 10: X back diagonal (/)
];

function sampleStrokeSmooth(pts, u) {
  const n = pts.length - 1;
  const scaled = Math.max(0, Math.min(0.99999, u)) * n;
  const idx = Math.floor(scaled);
  const t = scaled - idx;

  const p0 = pts[Math.max(0, idx - 1)];
  const p1 = pts[idx];
  const p2 = pts[Math.min(n, idx + 1)];
  const p3 = pts[Math.min(n, idx + 2)];

  const t2 = t * t;
  const t3 = t2 * t;
  const tension = 0.25;

  const m1x = (p2.x - p0.x) * tension;
  const m1y = (p2.y - p0.y) * tension;
  const m1z = (p2.z - p0.z) * tension;

  const m2x = (p3.x - p1.x) * tension;
  const m2y = (p3.y - p1.y) * tension;
  const m2z = (p3.z - p1.z) * tension;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return {
    x: h00 * p1.x + h10 * m1x + h01 * p2.x + h11 * m2x,
    y: h00 * p1.y + h10 * m1y + h01 * p2.y + h11 * m2y,
    z: h00 * p1.z + h10 * m1z + h01 * p2.z + h11 * m2z,
  };
}

const STRANDS = APEX_11_STROKES.length;
const GRADIENT_STOPS = [
  { stop: 0.0, s: -0.98, nz: 0.19 },
  { stop: 0.14, s: -0.72, nz: 0.69 },
  { stop: 0.28, s: -0.44, nz: 0.89 },
  { stop: 0.42, s: -0.16, nz: 0.98 },
  { stop: 0.50, s: 0.0, nz: 1.0 },
  { stop: 0.58, s: 0.16, nz: 0.98 },
  { stop: 0.72, s: 0.44, nz: 0.89 },
  { stop: 0.86, s: 0.72, nz: 0.69 },
  { stop: 1.0, s: 0.98, nz: 0.19 },
];

function evaluateMorphSpine(strandIdx, u, sp, timeSec) {
  const globalU = (strandIdx + u) / STRANDS;
  const t = globalU * Math.PI * 2;
  const breath = Math.sin(timeSec * 0.55 + t * 2) * 0.025;

  // Stage A (sp = 0): Non-singular (2, 3) Liquid-Chrome Torus Knot (Images 1 & 2)
  const rA = 1.02 + 0.38 * Math.cos(3 * t);
  const shapeA = {
    x: rA * Math.cos(2 * t) * 1.18 + breath,
    y: rA * Math.sin(2 * t) * 0.86 + breath * 0.7,
    z: 0.62 * Math.sin(3 * t),
  };
  const radA = 0.255 + 0.068 * Math.sin(3 * t + 0.6);

  // Stage B (sp = 0.34): Flowing Figure-8 / Infinity Chrome Wave (Image 1 & 3)
  const shapeB = {
    x: 1.52 * Math.cos(t) + 0.22 * Math.cos(3 * t),
    y: 0.68 * Math.sin(2 * t) + 0.20 * Math.sin(3 * t),
    z: 0.58 * Math.sin(3 * t) + 0.22 * Math.cos(2 * t),
  };
  const radB = 0.24 + 0.06 * Math.cos(2 * t + 0.4);

  // Stage C (sp = 0.64): Sculptural (3, 4) Liquid-Mercury Toroidal Crown
  const rC = 0.98 + 0.35 * Math.cos(4 * t);
  const shapeC = {
    x: rC * Math.cos(3 * t) * 1.12,
    y: rC * Math.sin(3 * t) * 0.92,
    z: 0.58 * Math.sin(4 * t),
  };
  const radC = 0.215 + 0.05 * Math.sin(4 * t);

  // Stage D (sp = 1.0): 11 clean strokes of "APEX"
  const shapeD = sampleStrokeSmooth(APEX_11_STROKES[strandIdx], u);
  const radD = 0.112;

  let pos;
  let radius;
  if (sp < 0.34) {
    const k = smoothstep(0.0, 0.34, sp);
    pos = lerpVec3(shapeA, shapeB, k);
    radius = lerp(radA, radB, k);
  } else if (sp < 0.64) {
    const k = smoothstep(0.34, 0.64, sp);
    pos = lerpVec3(shapeB, shapeC, k);
    radius = lerp(radB, radC, k);
  } else {
    const k = smoothstep(0.64, 0.95, sp);
    pos = lerpVec3(shapeC, shapeD, k);
    radius = lerp(radC, radD, k);
  }

  return { pos, radius };
}

export default function Holo3DScene({
  tintColor,
  className = '',
  scrollContainerRef,
  interactive = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    const isFirefox =
      typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 900 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

    const maxDpr = isMobile || isFirefox ? 1.2 : Math.min(window.devicePixelRatio || 1, 1.75);
    const spineSteps = isMobile || isFirefox ? 28 : 44;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let visible = true;

    let rgb = [220, 230, 248];
    let metallicBoost = 0.95;
    let metalFinish = 'chrome';

    function updateThemeState() {
      const rootStyle = getComputedStyle(document.documentElement);
      const rawColor =
        tintColor ||
        rootStyle.getPropertyValue('--accent').trim() ||
        '#ffffff';
      rgb = parseHexToRgb(rawColor);
      const mVal = parseFloat(rootStyle.getPropertyValue('--theme-metallic'));
      metallicBoost = Number.isFinite(mVal) ? mVal : 0.95;
      metalFinish = document.documentElement.dataset.metalFinish || 'chrome';
    }
    updateThemeState();

    const state = {
      scrollProgress: { current: 0, target: 0 },
      lightX: { current: 0.35, target: 0.35 },
      lightY: { current: -0.45, target: -0.45 },
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragRotX: 0,
      dragRotY: 0,
      velRotX: 0,
      velRotY: 0,
    };

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.round(rect.width));
      const nextH = Math.max(1, Math.round(rect.height));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      canvas.width = Math.round(width * maxDpr);
      canvas.height = Math.round(height * maxDpr);
      ctx.setTransform(maxDpr, 0, 0, maxDpr, 0, 0);
    }

    function updateScroll() {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      state.scrollProgress.target = Math.max(
        0,
        Math.min(1, window.scrollY / maxScroll)
      );
    }

    function onWindowPointerMove(e) {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      state.lightX.target = nx * 0.95;
      state.lightY.target = ny * 0.95;

      if (state.isDragging) {
        const dx = e.clientX - state.dragStartX;
        const dy = e.clientY - state.dragStartY;
        state.dragStartX = e.clientX;
        state.dragStartY = e.clientY;
        state.velRotY = dx * 0.0085;
        state.velRotX = dy * 0.0085;
        state.dragRotY += state.velRotY;
        state.dragRotX = Math.max(
          -1.35,
          Math.min(1.35, state.dragRotX + state.velRotX)
        );
      }
    }

    function onCanvasPointerDown(e) {
      if (!interactive) return;
      state.isDragging = true;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      canvas.classList.add('is-dragging');
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    function onWindowPointerUp(e) {
      if (!state.isDragging) return;
      state.isDragging = false;
      canvas.classList.remove('is-dragging');
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    function onCanvasDoubleClick() {
      state.dragRotX = 0;
      state.dragRotY = 0;
      state.velRotY = 0.035;
    }

    function rotate3D(p, rx, ry, rz) {
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;

      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const y2 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;

      const cz = Math.cos(rz);
      const sz = Math.sin(rz);
      const x3 = x1 * cz - y2 * sz;
      const y3 = x1 * sz + y2 * cz;
      return { x: x3, y: y3, z: z2 };
    }

    function project(p, scale, cx, cy) {
      const fov = 4.8;
      const depth = fov / Math.max(1.2, fov - p.z);
      return {
        x: cx + p.x * scale * depth,
        y: cy + p.y * scale * depth,
        z: p.z,
        depth,
      };
    }

    function evaluateChromeColor(
      nx,
      ny,
      nz,
      sRadial,
      zDepth,
      lightX,
      lightY,
      lightZ,
      finishContrast,
      themeTintStrength
    ) {
      const clampedNz = Math.max(0, Math.min(1, nz));
      const refX = 2 * clampedNz * nx;
      const refY = 2 * clampedNz * ny;

      const depthPhase = zDepth * 0.7;

      const radialChromeBand = Math.pow(
        Math.max(0, Math.cos((sRadial + 0.16) * 2.15)),
        2.4
      );
      const studioWave1 =
        0.5 +
        0.5 *
          Math.sin(
            refY * 3.1 + refX * 1.4 - lightY * 1.8 + lightX * 1.1 + depthPhase
          );
      const studioWave2 = Math.pow(
        Math.max(
          0,
          0.5 +
            0.5 *
              Math.cos(
                (refY - lightY * 0.5) * 2.6 +
                  (refX - lightX * 0.4) * 1.2 -
                  depthPhase * 0.5
              )
        ),
        2.6
      );

      // Dual symmetric studio key lights: Key 1 (cursor/upper-left) + Key 2 (counter-key upper-right)
      const h1x = lightX;
      const h1y = lightY;
      const h1z = lightZ + 1.0;
      const h1Len = Math.hypot(h1x, h1y, h1z) || 1;
      const ndoth1 = Math.max(0, (nx * h1x + ny * h1y + clampedNz * h1z) / h1Len);

      const h2x = -lightX * 0.85;
      const h2y = lightY * 0.9;
      const h2z = lightZ + 1.05;
      const h2Len = Math.hypot(h2x, h2y, h2z) || 1;
      const ndoth2 = Math.max(0, (nx * h2x + ny * h2y + clampedNz * h2z) / h2Len);

      const ndoth = Math.max(ndoth1, ndoth2 * 0.92);

      const sharpSpec = Math.pow(ndoth, 22);
      const broadSheen = Math.pow(ndoth, 3.8);
      const fresnel = Math.pow(1 - clampedNz, 2.2);

      const depthShade = Math.max(0.62, Math.min(1.10, 0.93 + zDepth * 0.24));

      const chromeLuma = Math.min(
        1,
        (0.02 +
          studioWave1 * 0.22 +
          (studioWave2 * 0.34 + radialChromeBand * 0.28) * finishContrast +
          broadSheen * 0.24 +
          fresnel * 0.14) *
          metallicBoost *
          depthShade
      );

      const themeContribution =
        (studioWave1 * 0.42 + broadSheen * 0.52 + fresnel * 0.65) *
        themeTintStrength;

      const baseMetalR = lerp(6, 228, chromeLuma);
      const baseMetalG = lerp(8, 234, chromeLuma);
      const baseMetalB = lerp(14, 248, chromeLuma);

      const tintedR = lerp(baseMetalR, rgb[0], themeContribution);
      const tintedG = lerp(baseMetalG, rgb[1], themeContribution);
      const tintedB = lerp(baseMetalB, rgb[2], themeContribution);

      const whiteHotspot = Math.min(
        1,
        (sharpSpec * 0.88 + studioWave2 * 0.28 + radialChromeBand * 0.22) *
          depthShade
      );
      const fr = Math.min(255, Math.round(lerp(tintedR, 255, whiteHotspot)));
      const fg = Math.min(255, Math.round(lerp(tintedG, 255, whiteHotspot)));
      const fb = Math.min(255, Math.round(lerp(tintedB, 255, whiteHotspot)));

      return `rgb(${fr}, ${fg}, ${fb})`;
    }

    let lastTime = performance.now();
    let timeSec = 0;

    function tick(now) {
      if (!visible || document.hidden) {
        rafId = 0;
        return;
      }
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
      lastTime = now;
      timeSec += dt;

      state.scrollProgress.current +=
        (state.scrollProgress.target - state.scrollProgress.current) * 0.068;
      state.lightX.current += (state.lightX.target - state.lightX.current) * 0.08;
      state.lightY.current += (state.lightY.target - state.lightY.current) * 0.08;

      if (!state.isDragging) {
        state.dragRotX += state.velRotX;
        state.dragRotY += state.velRotY;
        state.velRotX *= 0.93;
        state.velRotY *= 0.93;
      }

      const sp = state.scrollProgress.current;
      const apexAlign = smoothstep(0.68, 0.95, sp);

      const autoRx =
        (0.20 + Math.sin(timeSec * 0.34) * 0.14) * (1 - apexAlign);
      const autoRy = (timeSec * 0.18 + sp * 1.15) * (1 - apexAlign);
      const autoRz = Math.cos(timeSec * 0.26) * 0.08 * (1 - apexAlign);

      const rx =
        autoRx + state.dragRotX + state.lightY.current * 0.12 * (1 - apexAlign * 0.5);
      const ry =
        autoRy + state.dragRotY + state.lightX.current * 0.15 * (1 - apexAlign * 0.5);
      const rz = autoRz;

      ctx.clearRect(0, 0, width, height);

      const desktopRightShift =
        width > 1060 ? lerp(width * 0.67, width * 0.5, apexAlign) : width * 0.5;
      const cx = desktopRightShift;
      const cy = height * lerp(0.5, 0.46, apexAlign);
      const baseScale = Math.min(width, height) * lerp(0.245, 0.23, apexAlign);

      const rawLx = state.lightX.current;
      const rawLy = state.lightY.current;
      const rawLz = 0.82;
      const lLen = Math.hypot(rawLx, rawLy, rawLz) || 1;
      const lightX = rawLx / lLen;
      const lightY = rawLy / lLen;
      const lightZ = rawLz / lLen;

      const segments = [];

      for (let s = 0; s < STRANDS; s++) {
        const stations = new Array(spineSteps + 1);
        for (let i = 0; i <= spineSteps; i++) {
          const m = evaluateMorphSpine(s, i / spineSteps, sp, timeSec);
          const rotP = rotate3D(m.pos, rx, ry, rz);
          const pr = project(rotP, baseScale, cx, cy);
          stations[i] = {
            x: pr.x,
            y: pr.y,
            z: rotP.z,
            r2d: m.radius * baseScale * pr.depth,
          };
        }

        const layerZ = STRAND_LAYER_Z[s];
        for (let i = 0; i < spineSteps; i++) {
          const st0 = stations[i];
          const st1 = stations[i + 1];
          const avgZ = (st0.z + st1.z) * 0.5;
          const sortZ = lerp(
            avgZ,
            layerZ + (i / spineSteps) * 0.002,
            apexAlign
          );

          segments.push({
            st0,
            st1,
            avgZ,
            sortZ,
          });
        }
      }

      // Depth-sort segments back to front
      segments.sort((a, b) => a.sortZ - b.sortZ);

      const finishContrast =
        metalFinish === 'mercury'
          ? 1.25
          : metalFinish === 'titanium'
            ? 0.82
            : 1.05;
      const themeTintStrength =
        metalFinish === 'prismatic' ? 0.68 : 0.42;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < segments.length; i++) {
        const { st0, st1, avgZ } = segments[i];

        let dx = st1.x - st0.x;
        let dy = st1.y - st0.y;
        const segLen = Math.hypot(dx, dy);
        if (segLen < 0.05) {
          dx = 1;
          dy = 0;
        } else {
          dx /= segLen;
          dy /= segLen;
        }

        const midNx = -dy;
        const midNy = dx;

        const midX = (st0.x + st1.x) * 0.5;
        const midY = (st0.y + st1.y) * 0.5;
        const midR = Math.max(2, (st0.r2d + st1.r2d) * 0.5);

        const grad = ctx.createLinearGradient(
          midX - midNx * midR,
          midY - midNy * midR,
          midX + midNx * midR,
          midY + midNy * midR
        );

        for (let g = 0; g < GRADIENT_STOPS.length; g++) {
          const gs = GRADIENT_STOPS[g];
          const nx3d = midNx * gs.s;
          const ny3d = midNy * gs.s;
          const nz3d = gs.nz;
          grad.addColorStop(
            gs.stop,
            evaluateChromeColor(
              nx3d,
              ny3d,
              nz3d,
              gs.s,
              avgZ,
              lightX,
              lightY,
              lightZ,
              finishContrast,
              themeTintStrength
            )
          );
        }

        ctx.beginPath();
        ctx.moveTo(st0.x, st0.y);
        ctx.lineTo(st1.x, st1.y);
        ctx.lineWidth = midR * 2;
        ctx.strokeStyle = grad;
        ctx.stroke();
      }

      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!rafId && visible && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible = e.isIntersecting;
          if (visible) startLoop();
        });
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resize())
        : null;
    if (ro) ro.observe(canvas);

    const mo =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => updateThemeState())
        : null;
    if (mo) {
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'data-apex-theme', 'data-metal-finish'],
      });
    }

    function onVisibilityChange() {
      if (!document.hidden && visible) startLoop();
    }

    resize();
    updateScroll();
    startLoop();

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', onWindowPointerUp, { passive: true });
    window.addEventListener('apex-theme-updated', updateThemeState);
    window.addEventListener('apex-ux-updated', updateThemeState);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (interactive) {
      canvas.addEventListener('pointerdown', onCanvasPointerDown);
      canvas.addEventListener('dblclick', onCanvasDoubleClick);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
      window.removeEventListener('apex-theme-updated', updateThemeState);
      window.removeEventListener('apex-ux-updated', updateThemeState);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (interactive) {
        canvas.removeEventListener('pointerdown', onCanvasPointerDown);
        canvas.removeEventListener('dblclick', onCanvasDoubleClick);
      }
    };
  }, [tintColor, scrollContainerRef, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`holo-3d-canvas ${interactive ? 'is-interactive' : ''} ${className}`}
      aria-label="Interactive 3D metallic sculpture — click and drag to rotate"
    />
  );
}
