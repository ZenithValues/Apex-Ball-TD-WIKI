import { useEffect, useRef } from 'react';
import './Holo3DScene.css';

/**
 * DIVERSE, INTERACTIVE, LIGHT-REACTIVE 3D ENGINE (Holo3DScene)
 *
 * 6 Distinct 3D Sculptural Variants:
 * - 'icosa'     : 20-face Geodesic Icosahedron Core + dual rings + glossy spheres
 * - 'crystal'   : 12-face Elongated Hexagonal Bipyramid Diamond + vertical halo + diamond shards
 * - 'gyro'      : 3D Chamfered Cube Reactor + 3 orthogonal gimbal rings + mini-cubes
 * - 'stellated' : 8-pointed Stellated Merkaba Star (dual intersecting tetrahedra) + Saturn belt + prism shards
 * - 'monolith'  : Twisted 3D Octagonal Obelisk Spire + ascending helical rings + energy nodes
 * - 'architect' : Full-viewport Scroll-Assembling Geodesic Lattice for the Landing Page backdrop
 *
 * Interactive Features:
 * - Click & drag anywhere on a 3D object to move it freely in 2D/3D space and spin it with momentum
 * - Double-click to smoothly glide back to home position
 * - Real-time cursor point-light reactivity: specular highlights & chrome gradients follow the cursor
 * - Pre-rendered offscreen sphere sprite + DPR cap for 60fps performance on Firefox Mobile & Safari
 */

const PHI = (1 + Math.sqrt(5)) / 2;

function computeFaceData(vertices, faces) {
  return faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    // Cross product (vb - va) x (vc - va) for true surface normal
    const ux = vb.x - va.x;
    const uy = vb.y - va.y;
    const uz = vb.z - va.z;
    const vx = vc.x - va.x;
    const vy = vc.y - va.y;
    const vz = vc.z - va.z;
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const cz = (va.z + vb.z + vc.z) / 3;
    // Ensure outward normal
    if (nx * cx + ny * cy + nz * cz < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const nlen = Math.hypot(nx, ny, nz) || 1;
    return {
      indices: [a, b, c],
      nx: nx / nlen,
      ny: ny / nlen,
      nz: nz / nlen,
    };
  });
}

// 1. Geodesic 20-face Icosahedron
function createIcosahedronMesh() {
  const rawV = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ];
  const vertices = rawV.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return { x: x / len, y: y / len, z: z / len };
  });
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { vertices, faceData: computeFaceData(vertices, faces) };
}

// 2. Elongated 12-face Hexagonal Bipyramid Diamond Crystal
function createHexCrystalMesh() {
  const vertices = [
    { x: 0, y: 1.48, z: 0 },  // 0 top spire
    { x: 0, y: -1.48, z: 0 }, // 1 bottom spire
  ];
  const waistRadius = 0.88;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = i % 2 === 0 ? waistRadius : waistRadius * 0.84;
    vertices.push({
      x: Math.cos(a) * r,
      y: (i % 2 === 0 ? 0.14 : -0.14),
      z: Math.sin(a) * r,
    });
  }
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const cur = 2 + i;
    const next = 2 + ((i + 1) % 6);
    faces.push([0, next, cur]);
    faces.push([1, cur, next]);
  }
  return { vertices, faceData: computeFaceData(vertices, faces) };
}

// 3. 3D Beveled / Truncated Cube Reactor (Gyro Core)
function createGyroCubeMesh() {
  const s = 0.76;
  const b = 1.04;
  // 8 cube corners + 6 face apexes (Tetrakis Hexahedron - 24 sleek bevel triangles)
  const vertices = [
    { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
    { x: s, y: s, z: -s },   { x: -s, y: s, z: -s },
    { x: -s, y: -s, z: s },  { x: s, y: -s, z: s },
    { x: s, y: s, z: s },    { x: -s, y: s, z: s },
    // 6 raised face centers
    { x: 0, y: 0, z: b },    // 8 front
    { x: 0, y: 0, z: -b },   // 9 back
    { x: b, y: 0, z: 0 },    // 10 right
    { x: -b, y: 0, z: 0 },   // 11 left
    { x: 0, y: b, z: 0 },    // 12 top
    { x: 0, y: -b, z: 0 },   // 13 bottom
  ];
  const faces = [
    // Front pyramid
    [8, 4, 5], [8, 5, 6], [8, 6, 7], [8, 7, 4],
    // Back pyramid
    [9, 1, 0], [9, 2, 1], [9, 3, 2], [9, 0, 3],
    // Right pyramid
    [10, 5, 1], [10, 1, 2], [10, 2, 6], [10, 6, 5],
    // Left pyramid
    [11, 0, 4], [11, 4, 7], [11, 7, 3], [11, 3, 0],
    // Top pyramid
    [12, 7, 6], [12, 6, 2], [12, 2, 3], [12, 3, 7],
    // Bottom pyramid
    [13, 0, 1], [13, 1, 5], [13, 5, 4], [13, 4, 0],
  ];
  return { vertices, faceData: computeFaceData(vertices, faces) };
}

// 4. Stellated Octahedron (8-Pointed 3D Merkaba Star)
function createStellatedStarMesh() {
  const s = 0.92;
  // Tetrahedron A
  const tA = [
    { x: s, y: s, z: s },
    { x: -s, y: -s, z: s },
    { x: -s, y: s, z: -s },
    { x: s, y: -s, z: -s },
  ];
  // Tetrahedron B (inverted)
  const tB = [
    { x: -s, y: -s, z: -s },
    { x: s, y: s, z: -s },
    { x: s, y: -s, z: s },
    { x: -s, y: s, z: s },
  ];
  const vertices = [...tA, ...tB];
  const faces = [
    // Tetrahedron A faces
    [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2],
    // Tetrahedron B faces
    [4, 5, 6], [4, 6, 7], [4, 7, 5], [5, 7, 6],
  ];
  return { vertices, faceData: computeFaceData(vertices, faces) };
}

// 5. Twisted 3D Octagonal Obelisk Monolith
function createMonolithMesh() {
  const vertices = [
    { x: 0, y: 1.52, z: 0 },  // 0 top pyramid tip
    { x: 0, y: -1.42, z: 0 }, // 1 bottom tip
  ];
  // Upper octagon ring (twisted +22 deg)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.36;
    vertices.push({ x: Math.cos(a) * 0.62, y: 0.72, z: Math.sin(a) * 0.62 });
  }
  // Lower octagon ring
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    vertices.push({ x: Math.cos(a) * 0.85, y: -0.78, z: Math.sin(a) * 0.85 });
  }
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const u1 = 2 + i;
    const u2 = 2 + ((i + 1) % 6);
    const l1 = 8 + i;
    const l2 = 8 + ((i + 1) % 6);
    // Top cap
    faces.push([0, u2, u1]);
    // Side twisted shaft (2 triangles per side)
    faces.push([u1, u2, l2]);
    faces.push([u1, l2, l1]);
    // Bottom cap
    faces.push([1, l1, l2]);
  }
  return { vertices, faceData: computeFaceData(vertices, faces) };
}

function getMeshForVariant(variant) {
  switch (variant) {
    case 'crystal':
      return createHexCrystalMesh();
    case 'gyro':
      return createGyroCubeMesh();
    case 'stellated':
      return createStellatedStarMesh();
    case 'monolith':
      return createMonolithMesh();
    case 'architect':
    case 'icosa':
    default:
      return createIcosahedronMesh();
  }
}

function createTorusRing(radius, segments, tiltX = 0, tiltZ = 0, yShift = 0) {
  const pts = [];
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);
  const cosZ = Math.cos(tiltZ);
  const sinZ = Math.sin(tiltZ);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = yShift;
    const z = Math.sin(a) * radius;
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const x2 = x * cosZ - y1 * sinZ;
    const y2 = x * sinZ + y1 * cosZ;
    pts.push({ x: x2, y: y2, z: z1 });
  }
  return pts;
}

function parseHexToRgb(input) {
  const clean = (input || '#ffffff').trim();
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(clean);
  if (m) {
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }
  return [255, 255, 255];
}

function dampValue(current, target, ease, delta) {
  const factor = 1 - Math.pow(1 - ease, delta * 60);
  return current + (target - current) * factor;
}

// Pre-rendered offscreen sphere sprite for zero per-frame gradient allocations on Firefox/mobile
function createSphereSprite(rgb) {
  const size = 64;
  const off = document.createElement('canvas');
  off.width = size;
  off.height = size;
  const octx = off.getContext('2d');
  if (!octx) return off;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  const grad = octx.createRadialGradient(
    cx - r * 0.35,
    cy - r * 0.35,
    r * 0.06,
    cx,
    cy,
    r
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
  grad.addColorStop(
    0.28,
    `rgba(${Math.min(255, Math.round(rgb[0] * 0.9 + 55))}, ${Math.min(255, Math.round(rgb[1] * 0.9 + 55))}, ${Math.min(255, Math.round(rgb[2] * 0.9 + 55))}, 0.92)`
  );
  grad.addColorStop(
    0.72,
    `rgba(${Math.round(rgb[0] * 0.35)}, ${Math.round(rgb[1] * 0.35)}, ${Math.round(rgb[2] * 0.35)}, 0.94)`
  );
  grad.addColorStop(1, 'rgba(6, 6, 12, 0.96)');

  octx.beginPath();
  octx.arc(cx, cy, r, 0, Math.PI * 2);
  octx.fillStyle = grad;
  octx.fill();

  octx.lineWidth = 2.2;
  octx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.72)`;
  octx.stroke();

  return off;
}

export default function Holo3DScene({
  variant = 'icosa', // 'icosa' | 'crystal' | 'gyro' | 'stellated' | 'monolith' | 'architect'
  tintColor = '',
  className = '',
  scrollContainerRef = null,
  interactive = true,
  showPedestal = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isFirefox = ua.includes('Firefox') || ua.includes('FxiOS');
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)')?.matches);

    const mesh = getMeshForVariant(variant);
    const ringSegs = isMobile || isFirefox ? 48 : 76;

    // Distinct Ring Configurations per Variant so each 3D sculpture looks unique
    let rings = [];
    if (variant === 'crystal') {
      rings = [
        { pts: createTorusRing(1.52, ringSegs, 0.18, 1.32, 0), speedX: 0.3, speedY: 0.7, speedZ: 0.2, thick: 1.05 },
        { pts: createTorusRing(0.95, ringSegs, 1.48, 0.0, 0.72), speedX: 0, speedY: -0.9, speedZ: 0, thick: 0.78 },
      ];
    } else if (variant === 'gyro') {
      rings = [
        { pts: createTorusRing(1.42, ringSegs, 0, 0, 0), speedX: 0.85, speedY: 0.25, speedZ: 0.1, thick: 1.05 },
        { pts: createTorusRing(1.66, ringSegs, Math.PI / 2, 0, 0), speedX: 0.2, speedY: -0.85, speedZ: 0.3, thick: 0.92 },
        { pts: createTorusRing(1.9, ringSegs, Math.PI / 4, Math.PI / 4, 0), speedX: -0.45, speedY: 0.45, speedZ: -0.65, thick: 0.8 },
      ];
    } else if (variant === 'stellated') {
      rings = [
        { pts: createTorusRing(1.65, ringSegs, 1.24, 0.18, 0), speedX: 0.15, speedY: 0.65, speedZ: 0.12, thick: 1.15 },
        { pts: createTorusRing(1.92, ringSegs, 1.24, 0.18, 0), speedX: 0.15, speedY: -0.5, speedZ: 0.12, thick: 0.72 },
      ];
    } else if (variant === 'monolith') {
      rings = [
        { pts: createTorusRing(1.28, ringSegs, 1.38, 0.12, -0.48), speedX: 0.1, speedY: 0.75, speedZ: 0.1, thick: 0.95 },
        { pts: createTorusRing(1.48, ringSegs, 1.38, -0.12, 0.38), speedX: -0.1, speedY: -0.65, speedZ: -0.1, thick: 0.85 },
      ];
    } else {
      // 'icosa' or 'architect'
      rings = [
        { pts: createTorusRing(1.46, ringSegs, 1.08, 0.28, 0), speedX: 0.65, speedY: -0.75, speedZ: 0.35, thick: 1.0 },
        { pts: createTorusRing(1.76, ringSegs, -0.78, -0.45, 0), speedX: -0.5, speedY: 0.6, speedZ: -0.6, thick: 0.88 },
      ];
      if (variant === 'architect') {
        rings.push({ pts: createTorusRing(2.08, ringSegs, 0.42, 0.92, 0), speedX: 0.35, speedY: 0.45, speedZ: 0.8, thick: 0.75 });
      }
    }

    // Distinct Satellite Shapes per Variant ('sphere' | 'diamond' | 'cube' | 'prism')
    const satShape =
      variant === 'crystal'
        ? 'diamond'
        : variant === 'gyro'
          ? 'cube'
          : variant === 'stellated'
            ? 'prism'
            : 'sphere';

    const orbCount = isMobile ? 4 : 6;
    const satellites = Array.from({ length: orbCount }, (_, i) => {
      const angle = (i / orbCount) * Math.PI * 2;
      const radius = 1.54 + (i % 3) * 0.26;
      const yOffset = ((i % 3) - 1) * 0.38;
      return {
        baseAngle: angle,
        radius,
        yOffset,
        // Slower, deliberate orbital speed
        speed: (i % 2 === 0 ? 1 : -1) * (0.24 + (i % 3) * 0.07),
        orbSize: isMobile ? 6.5 + (i % 3) * 2.0 : 8.5 + (i % 3) * 2.8,
        phase: i * 1.1,
      };
    });

    const state = {
      scroll: { current: 0.25, target: 0.25, ease: 0.045 },
      // Dynamic light vector following cursor
      lightX: { current: -0.48, target: -0.48, ease: 0.08 },
      lightY: { current: -0.62, target: -0.62, ease: 0.08 },
      // Interactive click-drag position & rotation
      posX: { current: 0, target: 0, ease: 0.14 },
      posY: { current: 0, target: 0, ease: 0.14 },
      dragRotX: 0,
      dragRotY: 0,
      velRotX: 0,
      velRotY: 0,
      isDragging: false,
      lastPointerX: 0,
      lastPointerY: 0,
      cursorLocalX: -9999,
      cursorLocalY: -9999,
      pointerInside: false,
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let rafId = 0;
    let lastTime = performance.now();

    function updateAccentRgb() {
      if (tintColor && tintColor.startsWith('#')) return parseHexToRgb(tintColor);
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return parseHexToRgb(computed || '#ffffff');
    }
    let rgb = updateAccentRgb();
    let sphereSprite = createSphereSprite(rgb);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const maxDpr = isMobile && isFirefox ? 1.0 : isMobile || isFirefox ? 1.2 : 1.75;
      const nextDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      if (nextW === width && nextH === height && nextDpr === dpr) return;
      width = nextW;
      height = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updateScrollTarget() {
      const targetEl = scrollContainerRef?.current || canvas.parentElement;
      if (!targetEl) return;
      if (variant === 'architect') {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        state.scroll.target = Math.max(0, Math.min(1, window.scrollY / docH));
      } else {
        const rect = targetEl.getBoundingClientRect();
        const total = window.innerHeight + rect.height;
        const p = (window.innerHeight - rect.top) / Math.max(1, total);
        state.scroll.target = Math.max(0, Math.min(1, p));
      }
    }

    // Global pointer listener for dynamic cursor-light reflection & subtle tilt
    function onWindowPointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      state.cursorLocalX = localX;
      state.cursorLocalY = localY;
      state.pointerInside =
        localX >= -40 && localX <= rect.width + 40 && localY >= -40 && localY <= rect.height + 40;

      const objCx = rect.width * 0.5 + state.posX.current;
      const objCy = rect.height * 0.5 + state.posY.current;
      const dx = (localX - objCx) / Math.max(180, rect.width * 0.5);
      const dy = (localY - objCy) / Math.max(180, rect.height * 0.5);
      state.lightX.target = Math.max(-0.92, Math.min(0.92, dx));
      state.lightY.target = Math.max(-0.92, Math.min(0.92, dy));

      if (state.isDragging) {
        const deltaX = e.clientX - state.lastPointerX;
        const deltaY = e.clientY - state.lastPointerY;
        state.lastPointerX = e.clientX;
        state.lastPointerY = e.clientY;

        // Spin the 3D object with drag + move it freely within generous bounds
        state.velRotY = deltaX * 0.011;
        state.velRotX = deltaY * 0.011;
        state.dragRotY += state.velRotY;
        state.dragRotX += state.velRotX;

        const maxMoveX = rect.width * 0.34;
        const maxMoveY = rect.height * 0.32;
        state.posX.target = Math.max(-maxMoveX, Math.min(maxMoveX, state.posX.target + deltaX * 0.82));
        state.posY.target = Math.max(-maxMoveY, Math.min(maxMoveY, state.posY.target + deltaY * 0.82));
      }
    }

    function onCanvasPointerDown(e) {
      if (!interactive) return;
      state.isDragging = true;
      state.lastPointerX = e.clientX;
      state.lastPointerY = e.clientY;
      canvas.classList.add('is-dragging');
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch { /* ignore */ }
    }

    function onCanvasPointerUp(e) {
      if (!state.isDragging) return;
      state.isDragging = false;
      canvas.classList.remove('is-dragging');
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch { /* ignore */ }
    }

    function onCanvasDoubleClick() {
      // Smoothly reset position to center on double-click
      state.posX.target = 0;
      state.posY.target = 0;
      state.velRotY = 0.04;
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
      const fov = 4.1;
      const depth = fov / Math.max(1.1, fov - p.z);
      return {
        x: cx + p.x * scale * depth,
        y: cy + p.y * scale * depth,
        z: p.z,
        depth,
      };
    }

    function drawVolumetricRingHalf(pts, rx, ry, rz, scale, cx, cy, frontHalf, thicknessScale = 1) {
      const projected = pts.map((pt) => {
        const r = rotate3D(pt, rx, ry, rz);
        return project(r, scale, cx, cy);
      });

      const buildHalfPath = () => {
        ctx.beginPath();
        let drawing = false;
        for (let i = 0; i < projected.length - 1; i++) {
          const a = projected[i];
          const b = projected[i + 1];
          const isFront = (a.z + b.z) * 0.5 >= 0;
          if (isFront !== frontHalf) {
            drawing = false;
            continue;
          }
          if (!drawing) {
            ctx.moveTo(a.x, a.y);
            drawing = true;
          }
          ctx.lineTo(b.x, b.y);
        }
      };

      const baseWidth = (frontHalf ? 4.8 : 2.6) * thicknessScale;
      const alpha = frontHalf ? 0.62 : 0.22;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Pass 1: Outer volumetric tube halo
      buildHalfPath();
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.25).toFixed(3)})`;
      ctx.lineWidth = baseWidth * 2.2;
      ctx.stroke();

      // Pass 2: Main metallic-tinted 3D tube body
      buildHalfPath();
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = baseWidth;
      ctx.stroke();

      // Pass 3: Specular ridge on front-facing 3D tube
      if (frontHalf) {
        buildHalfPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.lineWidth = Math.max(1.2, baseWidth * 0.34);
        ctx.stroke();
      }
    }

    function drawSatellite(sat, timeSec) {
      const { x, y, radius, z, phase } = sat;
      const r = Math.max(3, radius);
      const brightness = z >= 0 ? 1 : 0.6;

      if (satShape === 'sphere') {
        ctx.save();
        ctx.globalAlpha = brightness;
        ctx.drawImage(sphereSprite, x - r, y - r, r * 2, r * 2);
        ctx.restore();
        return;
      }

      // Geometric 3D shaded satellites (Diamond Shards, Mini-Cubes, Prism Shards)
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(timeSec * 0.45 + phase);
      ctx.beginPath();
      if (satShape === 'diamond') {
        ctx.moveTo(0, -r * 1.35);
        ctx.lineTo(r * 0.85, 0);
        ctx.lineTo(0, r * 1.35);
        ctx.lineTo(-r * 0.85, 0);
      } else if (satShape === 'cube') {
        const s = r * 0.88;
        ctx.rect(-s, -s, s * 2, s * 2);
      } else {
        // prism
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(r * 1.05, r * 0.85);
        ctx.lineTo(-r * 1.05, r * 0.85);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${Math.min(255, Math.round(rgb[0] * 0.75 + 65))}, ${Math.min(255, Math.round(rgb[1] * 0.75 + 65))}, ${Math.min(255, Math.round(rgb[2] * 0.75 + 65))}, ${(0.85 * brightness).toFixed(2)})`;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.85 * brightness).toFixed(2)})`;
      ctx.stroke();
      ctx.restore();
    }

    function tick(now) {
      if (!visible || document.hidden) {
        rafId = 0;
        return;
      }
      resize();

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      state.scroll.current = dampValue(state.scroll.current, state.scroll.target, state.scroll.ease, delta);
      state.lightX.current = dampValue(state.lightX.current, state.lightX.target, state.lightX.ease, delta);
      state.lightY.current = dampValue(state.lightY.current, state.lightY.target, state.lightY.ease, delta);
      state.posX.current = dampValue(state.posX.current, state.posX.target, state.posX.ease, delta);
      state.posY.current = dampValue(state.posY.current, state.posY.target, state.posY.ease, delta);

      // Apply rotational inertia when not actively dragging
      if (!state.isDragging) {
        state.dragRotX += state.velRotX;
        state.dragRotY += state.velRotY;
        state.velRotX *= 0.95;
        state.velRotY *= 0.95;
      }

      // Slower, deliberate, majestic 3D rotation speed (Item 2)
      const timeSec = now * 0.001;
      const sp = state.scroll.current;

      const explode =
        variant === 'architect'
          ? Math.max(0, 1 - sp * 1.28) * 0.62
          : (Math.sin(timeSec * 0.55) * 0.5 + 0.5) * 0.11;

      const isVerticalSpire = variant === 'crystal' || variant === 'monolith';
      const rx = isVerticalSpire
        ? 0.22 + Math.sin(timeSec * 0.55) * 0.14 + state.dragRotX + state.lightY.current * 0.18
        : 0.32 + timeSec * 0.14 + sp * 1.25 + state.dragRotX + state.lightY.current * 0.18;
      const ry = timeSec * 0.22 + sp * 2.1 + state.dragRotY + state.lightX.current * 0.22;
      const rz = isVerticalSpire
        ? Math.cos(timeSec * 0.45) * 0.08
        : timeSec * 0.08 + sp * 0.65;

      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5 + state.posX.current;
      const cy = height * 0.5 + state.posY.current + Math.sin(timeSec * 0.75) * 5;
      const baseScale = Math.min(width, height) * (variant === 'architect' ? 0.24 : 0.25);

      // Normalize dynamic cursor-following point light vector
      const rawLx = state.lightX.current;
      const rawLy = state.lightY.current;
      const rawLz = 0.72;
      const lLen = Math.hypot(rawLx, rawLy, rawLz) || 1;
      const lightX = rawLx / lLen;
      const lightY = rawLy / lLen;
      const lightZ = rawLz / lLen;

      // Subtle cursor-following theme light aura inside the 3D stage
      if (!isMobile && state.pointerInside) {
        const auraR = Math.min(width, height) * 0.32;
        const aura = ctx.createRadialGradient(
          state.cursorLocalX,
          state.cursorLocalY,
          4,
          state.cursorLocalX,
          state.cursorLocalY,
          auraR
        );
        aura.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`);
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
      }

      const projectedSatellites = satellites.map((sat) => {
        const a = sat.baseAngle + timeSec * sat.speed + sp * 1.4;
        const pos = {
          x: Math.cos(a) * sat.radius,
          y: sat.yOffset + Math.sin(a * 1.2) * 0.2,
          z: Math.sin(a) * sat.radius,
        };
        const rot = rotate3D(pos, rx * 0.35, ry * 0.25, 0);
        const pr = project(rot, baseScale, cx, cy);
        return {
          ...pr,
          radius: sat.orbSize * pr.depth * 0.85,
          phase: sat.phase,
        };
      });

      // 1. Back halves of Volumetric 3D Rings (z < 0)
      for (let rIdx = 0; rIdx < rings.length; rIdx++) {
        const rg = rings[rIdx];
        drawVolumetricRingHalf(
          rg.pts,
          rx * rg.speedX,
          ry * rg.speedY,
          rz * rg.speedZ,
          baseScale,
          cx,
          cy,
          false,
          rg.thick
        );
      }

      // 2. Back Satellites (z < 0)
      projectedSatellites
        .filter((s) => s.z < 0)
        .sort((a, b) => a.z - b.z)
        .forEach((s) => drawSatellite(s, timeSec));

      // 3. Transform, Light & Depth-Sort Solid Shiny 3D Polyhedron Faces
      const renderedFaces = [];
      for (let i = 0; i < mesh.faceData.length; i++) {
        const f = mesh.faceData[i];
        const [ia, ib, ic] = f.indices;
        const va = mesh.vertices[ia];
        const vb = mesh.vertices[ib];
        const vc = mesh.vertices[ic];

        const pA = {
          x: va.x + f.nx * explode,
          y: va.y + f.ny * explode,
          z: va.z + f.nz * explode,
        };
        const pB = {
          x: vb.x + f.nx * explode,
          y: vb.y + f.ny * explode,
          z: vb.z + f.nz * explode,
        };
        const pC = {
          x: vc.x + f.nx * explode,
          y: vc.y + f.ny * explode,
          z: vc.z + f.nz * explode,
        };

        const rA = rotate3D(pA, rx, ry, rz);
        const rB = rotate3D(pB, rx, ry, rz);
        const rC = rotate3D(pC, rx, ry, rz);
        const rN = rotate3D({ x: f.nx, y: f.ny, z: f.nz }, rx, ry, rz);

        const avgZ = (rA.z + rB.z + rC.z) / 3;
        const prA = project(rA, baseScale, cx, cy);
        const prB = project(rB, baseScale, cx, cy);
        const prC = project(rC, baseScale, cx, cy);

        // Cursor-reactive directional + point light
        const ndotl = Math.max(0, rN.x * lightX + rN.y * lightY + rN.z * lightZ);
        const hx = lightX;
        const hy = lightY;
        const hz = lightZ + 1.0;
        const hlen = Math.hypot(hx, hy, hz) || 1;
        const ndoth = Math.max(0, (rN.x * hx + rN.y * hy + rN.z * hz) / hlen);
        // Dual-lobe specular for extra shiny metallic-glass gleam
        const sharpSpec = Math.pow(ndoth, 28);
        const broadSheen = Math.pow(ndoth, 6);
        const rim = Math.pow(1 - Math.min(1, Math.abs(rN.z)), 2.0);

        renderedFaces.push({
          prA,
          prB,
          prC,
          avgZ,
          frontFacing: rN.z >= -0.18,
          ndotl,
          sharpSpec,
          broadSheen,
          rim,
        });
      }

      renderedFaces.sort((a, b) => a.avgZ - b.avgZ);

      for (let i = 0; i < renderedFaces.length; i++) {
        const rf = renderedFaces[i];
        const { prA, prB, prC, frontFacing, ndotl, sharpSpec, broadSheen, rim } = rf;

        ctx.beginPath();
        ctx.moveTo(prA.x, prA.y);
        ctx.lineTo(prB.x, prB.y);
        ctx.lineTo(prC.x, prC.y);
        ctx.closePath();

        if (!frontFacing) {
          ctx.fillStyle = 'rgba(10, 10, 18, 0.34)';
          ctx.fill();
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        } else {
          // Shiny chrome + theme-tinted light-reactive face shading
          const baseDark = 12;
          const lum = 0.16 + ndotl * 0.48 + broadSheen * 0.32 + rim * 0.28;
          const specBoost = sharpSpec * 235 + broadSheen * 48;

          const rCol = Math.min(255, Math.round(baseDark + rgb[0] * lum + specBoost));
          const gCol = Math.min(255, Math.round(baseDark + rgb[1] * lum + specBoost));
          const bCol = Math.min(255, Math.round(baseDark + rgb[2] * lum + specBoost));

          const faceAlpha = variant === 'architect' ? 0.56 : 0.72;
          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${faceAlpha})`;
          ctx.fill();

          // Specular bevel edge that gleams brightly when catching light
          const edgeAlpha = Math.min(0.98, 0.42 + ndotl * 0.38 + sharpSpec * 0.55);
          const edgeWhiteMix = Math.min(1, sharpSpec * 0.85 + broadSheen * 0.25);
          const er = Math.round(rgb[0] * (1 - edgeWhiteMix) + 255 * edgeWhiteMix);
          const eg = Math.round(rgb[1] * (1 - edgeWhiteMix) + 255 * edgeWhiteMix);
          const eb = Math.round(rgb[2] * (1 - edgeWhiteMix) + 255 * edgeWhiteMix);

          ctx.strokeStyle = `rgba(${er}, ${eg}, ${eb}, ${edgeAlpha.toFixed(3)})`;
          ctx.lineWidth = 2.0 + sharpSpec * 1.4;
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }

      // 4. Front halves of Volumetric 3D Rings (z >= 0)
      for (let rIdx = 0; rIdx < rings.length; rIdx++) {
        const rg = rings[rIdx];
        drawVolumetricRingHalf(
          rg.pts,
          rx * rg.speedX,
          ry * rg.speedY,
          rz * rg.speedZ,
          baseScale,
          cx,
          cy,
          true,
          rg.thick
        );
      }

      // 5. Front Satellites (z >= 0)
      projectedSatellites
        .filter((s) => s.z >= 0)
        .sort((a, b) => a.z - b.z)
        .forEach((s) => drawSatellite(s, timeSec));

      rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
      if (!rafId && visible && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    resize();
    updateScrollTarget();

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            resize();
            startLoop();
          })
        : null;
    if (ro) ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        visible = Boolean(entry?.isIntersecting);
        if (visible) startLoop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const onThemeUpdate = () => {
      rgb = updateAccentRgb();
      sphereSprite = createSphereSprite(rgb);
      startLoop();
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', onCanvasPointerUp, { passive: true });
    window.addEventListener('apex-theme-updated', onThemeUpdate);
    document.addEventListener('visibilitychange', startLoop);

    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    canvas.addEventListener('pointerup', onCanvasPointerUp);
    canvas.addEventListener('pointercancel', onCanvasPointerUp);
    canvas.addEventListener('dblclick', onCanvasDoubleClick);

    startLoop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onCanvasPointerUp);
      window.removeEventListener('apex-theme-updated', onThemeUpdate);
      document.removeEventListener('visibilitychange', startLoop);
      canvas.removeEventListener('pointerdown', onCanvasPointerDown);
      canvas.removeEventListener('pointerup', onCanvasPointerUp);
      canvas.removeEventListener('pointercancel', onCanvasPointerUp);
      canvas.removeEventListener('dblclick', onCanvasDoubleClick);
    };
  }, [variant, tintColor, scrollContainerRef, interactive]);

  return (
    <div
      className={`holo-3d-scene-wrap ${interactive ? 'is-interactive' : ''} ${className}`.trim()}
      title={interactive ? 'Click and drag to move & rotate 3D object (double-click to center)' : undefined}
    >
      <canvas ref={canvasRef} className="holo-3d-canvas" />
      {showPedestal && variant !== 'architect' && (
        <div className="holo-3d-pedestal-rings" aria-hidden="true">
          <div className="pedestal-3d-shadow" />
          <div className="pedestal-3d-slab-bottom" />
          <div className="pedestal-3d-slab-top" />
          <span className="pedestal-ring ring-a" />
          <span className="pedestal-ring ring-b" />
        </div>
      )}
    </div>
  );
}
