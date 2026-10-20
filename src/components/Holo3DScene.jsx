import { useEffect, useRef } from 'react';
import './Holo3DScene.css';

/**
 * SPLINE-STYLE VOLUMETRIC 3D RENDERER (Holo3DScene)
 *
 * Renders solid, Phong/PBR-shaded 3D geometry with real surface normals,
 * metallic-obsidian facets, specular highlights, smooth continuous volumetric
 * 3D torus tubes, orbiting 3D shaded spheres, and a 3D extruded pedestal base.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

// Closed 20-face Icosahedron mesh (vertices + outward-winding triangle faces)
function createSolidIcosahedron() {
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

  const faceData = faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const cz = (va.z + vb.z + vc.z) / 3;
    const clen = Math.hypot(cx, cy, cz) || 1;
    return {
      indices: [a, b, c],
      nx: cx / clen,
      ny: cy / clen,
      nz: cz / clen,
    };
  });

  return { vertices, faceData };
}

// Closed 8-face Octahedron Crystal
function createSolidCrystal() {
  const vertices = [
    { x: 0, y: 1.32, z: 0 },
    { x: 0, y: -1.32, z: 0 },
    { x: 1.05, y: 0, z: 0 },
    { x: 0, y: 0, z: 1.05 },
    { x: -1.05, y: 0, z: 0 },
    { x: 0, y: 0, z: -1.05 },
  ];
  const faces = [
    [0, 3, 2], [0, 4, 3], [0, 5, 4], [0, 2, 5],
    [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2],
  ];
  const faceData = faces.map(([a, b, c]) => {
    const va = vertices[a];
    const vb = vertices[b];
    const vc = vertices[c];
    const cx = (va.x + vb.x + vc.x) / 3;
    const cy = (va.y + vb.y + vc.y) / 3;
    const cz = (va.z + vb.z + vc.z) / 3;
    const clen = Math.hypot(cx, cy, cz) || 1;
    return {
      indices: [a, b, c],
      nx: cx / clen,
      ny: cy / clen,
      nz: cz / clen,
    };
  });
  return { vertices, faceData };
}

function createTorusRing(radius, segments, tiltX = 0, tiltZ = 0) {
  const pts = [];
  const cosX = Math.cos(tiltX);
  const sinX = Math.sin(tiltX);
  const cosZ = Math.cos(tiltZ);
  const sinZ = Math.sin(tiltZ);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = 0;
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

    const mesh = variant === 'crystal' ? createSolidCrystal() : createSolidIcosahedron();
    const ringSegs = isMobile ? 56 : 84;
    const ring1 = createTorusRing(1.44, ringSegs, 1.08, 0.28);
    const ring2 = createTorusRing(1.74, ringSegs, -0.78, -0.45);
    const ring3 =
      variant === 'construction' || variant === 'gyro'
        ? createTorusRing(2.04, ringSegs, 0.42, 0.92)
        : null;

    // Orbiting 3D Spline Spheres (thick volumetric 3D orbs)
    const orbCount = isMobile ? 5 : 7;
    const satellites = Array.from({ length: orbCount }, (_, i) => {
      const angle = (i / orbCount) * Math.PI * 2;
      const radius = 1.52 + (i % 3) * 0.26;
      const yOffset = ((i % 3) - 1) * 0.38;
      return {
        baseAngle: angle,
        radius,
        yOffset,
        speed: (i % 2 === 0 ? 1 : -1) * (0.78 + (i % 3) * 0.22),
        orbSize: isMobile ? 6.5 + (i % 3) * 2.2 : 8.5 + (i % 3) * 3.0,
      };
    });

    const state = {
      scroll: { current: 0.35, target: 0.35, ease: 0.09 },
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
      const nextW = Math.max(1, rect.width);
      const nextH = Math.max(1, rect.height);
      const nextDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
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
      state.mouseX.target = nx * 0.65;
      state.mouseY.target = ny * 0.45;
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
      const fov = 4.0;
      const depth = fov / Math.max(1.1, fov - p.z);
      return {
        x: cx + p.x * scale * depth,
        y: cy + p.y * scale * depth,
        z: p.z,
        depth,
      };
    }

    // Smooth continuous multi-pass 3D tube ring (no overlapping cap dots!)
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

      const baseWidth = (frontHalf ? 5.2 : 2.8) * thicknessScale;
      const alpha = frontHalf ? 0.58 : 0.22;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Pass 1: Outer volumetric tube halo
      buildHalfPath();
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.26).toFixed(3)})`;
      ctx.lineWidth = baseWidth * 2.4;
      ctx.stroke();

      // Pass 2: Main metallic-tinted 3D tube body
      buildHalfPath();
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = baseWidth;
      ctx.stroke();

      // Pass 3: Crisp specular ridge on front-facing 3D tube
      if (frontHalf) {
        buildHalfPath();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.72)`;
        ctx.lineWidth = Math.max(1.2, baseWidth * 0.34);
        ctx.stroke();
      }
    }

    // Solid Phong-shaded 3D sphere orb with specular highlight & rim light
    function drawShadedSphere(x, y, radius, zDepth) {
      const r = Math.max(2.5, radius);
      const grad = ctx.createRadialGradient(
        x - r * 0.35,
        y - r * 0.35,
        r * 0.08,
        x,
        y,
        r
      );
      const brightness = zDepth >= 0 ? 1 : 0.62;
      grad.addColorStop(0, `rgba(255, 255, 255, ${(0.96 * brightness).toFixed(2)})`);
      grad.addColorStop(
        0.35,
        `rgba(${Math.round(rgb[0] * 0.85 + 38)}, ${Math.round(rgb[1] * 0.85 + 38)}, ${Math.round(rgb[2] * 0.85 + 38)}, ${(0.88 * brightness).toFixed(2)})`
      );
      grad.addColorStop(
        0.78,
        `rgba(${Math.round(rgb[0] * 0.28)}, ${Math.round(rgb[1] * 0.28)}, ${Math.round(rgb[2] * 0.28)}, ${(0.92 * brightness).toFixed(2)})`
      );
      grad.addColorStop(1, `rgba(8, 8, 14, ${(0.95 * brightness).toFixed(2)})`);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = zDepth >= 0 ? 1.5 : 0.9;
      ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(0.55 * brightness).toFixed(2)})`;
      ctx.stroke();
    }

    const lightX = -0.52;
    const lightY = -0.64;
    const lightZ = 0.56;

    function tick(now) {
      if (!visible || document.hidden) {
        rafId = 0;
        return;
      }
      // Keep canvas buffer synced if layout changed
      resize();

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      state.scroll.current = dampValue(state.scroll.current, state.scroll.target, state.scroll.ease, delta);
      state.mouseX.current = dampValue(state.mouseX.current, state.mouseX.target, state.mouseX.ease, delta);
      state.mouseY.current = dampValue(state.mouseY.current, state.mouseY.target, state.mouseY.ease, delta);

      const timeSec = now * 0.001;
      const sp = state.scroll.current;

      const explode =
        variant === 'construction'
          ? Math.max(0, 1 - sp * 1.35) * 0.72
          : (Math.sin(timeSec * 1.4) * 0.5 + 0.5) * 0.15;

      const rx = 0.38 + timeSec * 0.55 + sp * 2.1 + state.mouseY.current;
      const ry = timeSec * 0.88 + sp * 3.4 + state.mouseX.current;
      const rz = timeSec * 0.32 + sp * 1.1;

      ctx.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.5 + Math.sin(timeSec * 1.6) * 6;
      const baseScale = Math.min(width, height) * (variant === 'construction' ? 0.25 : 0.25);

      const projectedSatellites = satellites.map((sat) => {
        const a = sat.baseAngle + timeSec * sat.speed + sp * 2.4;
        const pos = {
          x: Math.cos(a) * sat.radius,
          y: sat.yOffset + Math.sin(a * 1.5) * 0.22,
          z: Math.sin(a) * sat.radius,
        };
        const rot = rotate3D(pos, rx * 0.35, ry * 0.25, 0);
        const pr = project(rot, baseScale, cx, cy);
        return {
          ...pr,
          radius: sat.orbSize * pr.depth * 0.85,
        };
      });

      // 1. Back halves of Volumetric 3D Torus Rings (z < 0)
      drawVolumetricRingHalf(ring1, rx * 0.85, -ry * 0.95, rz * 0.5, baseScale, cx, cy, false, 1);
      drawVolumetricRingHalf(ring2, -rx * 0.65, ry * 0.75, -rz * 0.8, baseScale, cx, cy, false, 0.88);
      if (ring3) {
        drawVolumetricRingHalf(ring3, rx * 0.45, ry * 0.55, rz * 1.1, baseScale, cx, cy, false, 0.76);
      }

      // 2. Back Orbiting 3D Spheres (z < 0)
      projectedSatellites
        .filter((s) => s.z < 0)
        .sort((a, b) => a.z - b.z)
        .forEach((s) => drawShadedSphere(s.x, s.y, s.radius, s.z));

      // 3. Transform, Light & Depth-Sort Solid 3D Polyhedron Faces
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

        const ndotl = Math.max(0, rN.x * -lightX + rN.y * -lightY + rN.z * lightZ);
        const hx = -lightX;
        const hy = -lightY;
        const hz = lightZ + 1.0;
        const hlen = Math.hypot(hx, hy, hz) || 1;
        const ndoth = Math.max(0, (rN.x * hx + rN.y * hy + rN.z * hz) / hlen);
        const specular = Math.pow(ndoth, 20);
        const rim = Math.pow(1 - Math.min(1, Math.abs(rN.z)), 2.2);

        renderedFaces.push({
          prA,
          prB,
          prC,
          avgZ,
          frontFacing: rN.z >= -0.15,
          ndotl,
          specular,
          rim,
        });
      }

      renderedFaces.sort((a, b) => a.avgZ - b.avgZ);

      for (let i = 0; i < renderedFaces.length; i++) {
        const rf = renderedFaces[i];
        const { prA, prB, prC, frontFacing, ndotl, specular, rim } = rf;

        ctx.beginPath();
        ctx.moveTo(prA.x, prA.y);
        ctx.lineTo(prB.x, prB.y);
        ctx.lineTo(prC.x, prC.y);
        ctx.closePath();

        if (!frontFacing) {
          ctx.fillStyle = `rgba(10, 10, 18, 0.34)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        } else {
          const baseDark = 14;
          const diffR = baseDark + rgb[0] * (0.14 + ndotl * 0.42 + rim * 0.25) + specular * 195;
          const diffG = baseDark + rgb[1] * (0.14 + ndotl * 0.42 + rim * 0.25) + specular * 195;
          const diffB = baseDark + rgb[2] * (0.14 + ndotl * 0.42 + rim * 0.25) + specular * 195;

          const rCol = Math.min(255, Math.round(diffR));
          const gCol = Math.min(255, Math.round(diffG));
          const bCol = Math.min(255, Math.round(diffB));

          const faceAlpha = variant === 'construction' ? 0.66 : 0.52;
          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${faceAlpha})`;
          ctx.fill();

          const edgeAlpha = Math.min(0.92, 0.38 + ndotl * 0.35 + specular * 0.45);
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${edgeAlpha.toFixed(3)})`;
          ctx.lineWidth = 2.0;
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }

      // 4. Front halves of Volumetric 3D Torus Rings (z >= 0)
      drawVolumetricRingHalf(ring1, rx * 0.85, -ry * 0.95, rz * 0.5, baseScale, cx, cy, true, 1);
      drawVolumetricRingHalf(ring2, -rx * 0.65, ry * 0.75, -rz * 0.8, baseScale, cx, cy, true, 0.88);
      if (ring3) {
        drawVolumetricRingHalf(ring3, rx * 0.45, ry * 0.55, rz * 1.1, baseScale, cx, cy, true, 0.76);
      }

      // 5. Front Orbiting 3D Spheres (z >= 0)
      projectedSatellites
        .filter((s) => s.z >= 0)
        .sort((a, b) => a.z - b.z)
        .forEach((s) => drawShadedSphere(s.x, s.y, s.radius, s.z));

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
      if (ro) ro.disconnect();
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
      {variant !== 'construction' && (
        <div className="holo-3d-pedestal-rings">
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
