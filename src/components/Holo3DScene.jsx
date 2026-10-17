import { useEffect, useRef } from 'react';
import './Holo3DScene.css';

/**
 * Frameless 3D Procedural Wireframe & Gyroscopic Assembly Engine
 * Inspired by Claude Code 3D Scroll Showcases (awwwards-3d / 3d-frontend / scroll-cinematic).
 *
 * Features:
 * - True 3D (x, y, z) vertex & edge projection with perspective division
 * - Framerate-independent damp() lerp loop (ease 0.08)
 * - Scroll-scrubbed assembly/explosion: vertices assemble from exploded 3D shards
 *   into a locked 3D structure as scroll depth increases
 * - Automatic IntersectionObserver + visibilitychange pause (0% CPU/GPU off-screen)
 * - Mobile-first DPR cap (1.25 on mobile, 2.0 on desktop)
 */

const PHI = (1 + Math.sqrt(5)) / 2;

function createIcosahedron() {
  const rawV = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ];
  const vertices = rawV.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return {
      x: x / len,
      y: y / len,
      z: z / len,
      // Exploded vector for scroll-driven assembly
      ex: (x / len) * 2.35,
      ey: (y / len) * 2.35,
      ez: (z / len) * 2.35,
    };
  });

  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.hypot(
        vertices[i].x - vertices[j].x,
        vertices[i].y - vertices[j].y,
        vertices[i].z - vertices[j].z
      );
      if (d < 1.15) edges.push([i, j]);
    }
  }
  return { vertices, edges };
}

function createOctaCrystal() {
  const rawV = [
    [0, 1.28, 0], [0, -1.28, 0],
    [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
    [0.55, 0.55, 0.55], [-0.55, 0.55, 0.55], [0.55, 0.55, -0.55], [-0.55, 0.55, -0.55],
    [0.55, -0.55, 0.55], [-0.55, -0.55, 0.55], [0.55, -0.55, -0.55], [-0.55, -0.55, -0.55],
  ];
  const vertices = rawV.map(([x, y, z]) => ({
    x,
    y,
    z,
    ex: x * 2.2,
    ey: y * 2.2,
    ez: z * 2.2,
  }));
  const edges = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 4], [4, 3], [3, 5], [5, 2],
    [6, 7], [7, 9], [9, 8], [8, 6],
    [10, 11], [11, 13], [13, 12], [12, 10],
    [6, 10], [7, 11], [8, 12], [9, 13],
  ];
  return { vertices, edges };
}

function createRingPoints(radius, segments, tiltX = 0, tiltZ = 0) {
  const pts = [];
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);
  const cosZ = Math.cos(tiltZ);
  const sinZ = Math.sin(tiltZ);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    let x = Math.cos(a) * radius;
    let y = 0;
    let z = Math.sin(a) * radius;
    // Rotate X
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    // Rotate Z
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

export default function Holo3DScene({
  variant = 'icosa', // 'icosa' | 'crystal' | 'gyro' | 'construction'
  tintColor = '',
  className = '',
  scrollContainerRef = null,
  interactive = true,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia?.('(pointer: coarse)')?.matches);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    const mesh = variant === 'crystal' ? createOctaCrystal() : createIcosahedron();
    const ringSegs = isMobile ? 36 : 56;
    const ring1 = createRingPoints(1.42, ringSegs, 1.05, 0.25);
    const ring2 = createRingPoints(1.72, ringSegs, -0.72, -0.48);
    const ring3 = variant === 'construction' || variant === 'gyro'
      ? createRingPoints(2.02, ringSegs, 0.32, 0.88)
      : null;

    // Floating 3D depth particles
    const particleCount = isMobile ? 14 : 28;
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const r = 1.55 + (i % 5) * 0.24;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: 1.2 + (i % 3) * 0.7,
      };
    });

    const state = {
      scroll: { current: 0.5, target: 0.5, ease: 0.08 },
      rotX: { current: 0.25, target: 0.25, ease: 0.08 },
      rotY: { current: 0, target: 0, ease: 0.08 },
      mouseX: { current: 0, target: 0, ease: 0.1 },
      mouseY: { current: 0, target: 0, ease: 0.1 },
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

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updateScrollTarget() {
      const targetEl = scrollContainerRef?.current || canvas.parentElement;
      if (!targetEl) return;
      if (variant === 'construction') {
        const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        state.scroll.target = Math.max(0, Math.min(1, window.scrollY / docH));
      } else {
        const rect = targetEl.getBoundingClientRect();
        const total = window.innerHeight + rect.height;
        const p = (window.innerHeight - rect.top) / Math.max(1, total);
        state.scroll.target = Math.max(0, Math.min(1, p));
      }
    }

    function onPointerMove(e) {
      if (isMobile || !interactive) return;
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      state.mouseX.target = nx * 0.45;
      state.mouseY.target = ny * 0.35;
    }

    function rotate3D(p, rx, ry, rz) {
      // Y rotation
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      // X rotation
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);
      const y2 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      // Z rotation
      const cz = Math.cos(rz);
      const sz = Math.sin(rz);
      const x3 = x1 * cz - y2 * sz;
      const y3 = x1 * sz + y2 * cz;
      return { x: x3, y: y3, z: z2 };
    }

    function project(p, scale, cx, cy) {
      const fov = 4.2;
      const depth = fov / Math.max(1.2, fov - p.z);
      return {
        x: cx + p.x * scale * depth,
        y: cy + p.y * scale * depth,
        z: p.z,
        depth,
      };
    }

    function drawRing(pts, rx, ry, rz, scale, cx, cy, alphaScale) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const r = rotate3D(pts[i], rx, ry, rz);
        const pr = project(r, scale, cx, cy);
        if (i === 0) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      }
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${0.18 * alphaScale})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    function tick(now) {
      if (!visible || document.hidden) {
        rafId = 0;
        return;
      }
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      state.scroll.current = dampValue(state.scroll.current, state.scroll.target, state.scroll.ease, delta);
      state.mouseX.current = dampValue(state.mouseX.current, state.mouseX.target, state.mouseX.ease, delta);
      state.mouseY.current = dampValue(state.mouseY.current, state.mouseY.target, state.mouseY.ease, delta);

      const timeSec = prefersReduced ? 0 : now * 0.00042;
      const sp = state.scroll.current;

      // Explode factor: on construction page, starts exploded (0.85) at scroll=0 and locks to 0 at scroll>=0.65
      // On section stages, gently breathes & tightens around center of viewport
      const explode =
        variant === 'construction'
          ? Math.max(0, 1 - sp * 1.45) * 0.78
          : Math.abs(sp - 0.5) * 0.42;

      const rx = 0.32 + timeSec * 0.7 + sp * 1.6 + state.mouseY.current;
      const ry = timeSec * 1.15 + sp * 2.8 + state.mouseX.current;
      const rz = timeSec * 0.45 + sp * 0.9;

      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.5;
      const baseScale = Math.min(width, height) * (variant === 'construction' ? 0.25 : 0.28);

      // 1. Draw 3D Gyroscopic Rings
      drawRing(ring1, rx * 0.8, -ry * 0.9, rz * 0.5, baseScale, cx, cy, 1);
      drawRing(ring2, -rx * 0.6, ry * 0.7, -rz * 0.8, baseScale, cx, cy, 0.85);
      if (ring3) {
        drawRing(ring3, rx * 0.4, ry * 0.5, rz * 1.1, baseScale, cx, cy, 0.7);
      }

      // 2. Transform & Project 3D Polyhedron Vertices
      const projected = mesh.vertices.map((v) => {
        const vx = v.x + (v.ex - v.x) * explode;
        const vy = v.y + (v.ey - v.y) * explode;
        const vz = v.z + (v.ez - v.z) * explode;
        const rot = rotate3D({ x: vx, y: vy, z: vz }, rx, ry, rz);
        return project(rot, baseScale, cx, cy);
      });

      // 3. Draw Depth-Shaded 3D Wireframe Edges
      for (let i = 0; i < mesh.edges.length; i++) {
        const [aIdx, bIdx] = mesh.edges[i];
        const a = projected[aIdx];
        const b = projected[bIdx];
        const avgZ = (a.z + b.z) * 0.5;
        const alpha = Math.max(0.06, Math.min(0.52, 0.22 + avgZ * 0.16));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = avgZ > 0.2 ? 1.45 : 0.9;
        ctx.stroke();
      }

      // 4. Draw Glowing 3D Vertex Nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const nodeAlpha = Math.max(0.18, Math.min(0.9, 0.45 + p.z * 0.28));
        const r = Math.max(1.4, (2.2 + p.z * 0.9) * (isMobile ? 0.85 : 1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${nodeAlpha.toFixed(3)})`;
        ctx.fill();
      }

      // 5. Draw Orbiting 3D Depth Particles
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const rot = rotate3D(pt, -rx * 0.45, ry * 0.55, rz * 0.3);
        const pr = project(rot, baseScale, cx, cy);
        const pAlpha = Math.max(0.08, Math.min(0.55, 0.25 + pr.z * 0.15));
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pt.size * pr.depth * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${pAlpha.toFixed(3)})`;
        ctx.fill();
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function startLoop() {
      if (!rafId && visible && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    resize();
    updateScrollTarget();

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
      startLoop();
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('apex-theme-updated', onThemeUpdate);
    document.addEventListener('visibilitychange', startLoop);

    startLoop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('apex-theme-updated', onThemeUpdate);
      document.removeEventListener('visibilitychange', startLoop);
    };
  }, [variant, tintColor, scrollContainerRef, interactive]);

  return (
    <div className={`holo-3d-scene-wrap ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="holo-3d-canvas" />
      <div className="holo-3d-pedestal-rings">
        <span className="pedestal-ring ring-a" />
        <span className="pedestal-ring ring-b" />
      </div>
    </div>
  );
}
