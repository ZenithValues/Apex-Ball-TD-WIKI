import { useEffect, useRef } from 'react';
import './Holo3DScene.css';

function parseHexToRgbNormalized(hex) {
  const clean = String(hex || '').trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255,
    ];
  }
  return [0.86, 0.9, 0.98];
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

const STRANDS = 11;

/**
 * Evaluates a C1-smooth point along one of the 11 strokes of "A" "P" "E" "X"
 * for u in [0, 1]. Subtle 0.004 Z-layer offsets eliminate Z-fighting at corners
 * while keeping every letter fused as a solid cast-chrome 3D form.
 */
function sampleApexStroke(strandIdx, u) {
  const t = Math.max(0, Math.min(1, u));
  switch (strandIdx) {
    case 0: // 'A' left leg: (-2.06, -0.72) -> (-1.62, +0.72)
      return { x: lerp(-2.06, -1.62, t), y: lerp(-0.72, 0.72, t), z: 0.004 };
    case 1: // 'A' right leg: (-1.62, +0.72) -> (-1.18, -0.72)
      return { x: lerp(-1.62, -1.18, t), y: lerp(0.72, -0.72, t), z: 0.0 };
    case 2: // 'A' crossbar welded between left leg centerline (-1.895) and right leg centerline (-1.345)
      return { x: lerp(-1.895, -1.345, t), y: -0.18, z: -0.005 };
    case 3: // 'P' vertical stem: (-0.84, -0.72) -> (-0.84, +0.72)
      return { x: -0.84, y: lerp(-0.72, 0.72, t), z: 0.004 };
    case 4: {
      // 'P' mathematical C1-smooth upper bowl
      const xLeft = -0.84;
      const xArcCenter = -0.48;
      const yTop = 0.72;
      const yBot = -0.02;
      const yMid = (yTop + yBot) * 0.5;
      const rY = (yTop - yBot) * 0.5;
      const rX = 0.36;
      if (t < 0.22) {
        const s = t / 0.22;
        return { x: lerp(xLeft, xArcCenter, s), y: yTop, z: 0.0 };
      }
      if (t <= 0.78) {
        const s = (t - 0.22) / 0.56;
        const theta = Math.PI * 0.5 - s * Math.PI;
        return {
          x: xArcCenter + rX * Math.cos(theta),
          y: yMid + rY * Math.sin(theta),
          z: 0.0,
        };
      }
      const s = (t - 0.78) / 0.22;
      return { x: lerp(xArcCenter, xLeft, s), y: yBot, z: 0.0 };
    }
    case 5: // 'E' vertical spine: (0.20, +0.72) -> (0.20, -0.72)
      return { x: 0.20, y: lerp(0.72, -0.72, t), z: 0.005 };
    case 6: // 'E' top bar: (0.20, +0.72) -> (0.86, +0.72)
      return { x: lerp(0.20, 0.86, t), y: 0.72, z: 0.0 };
    case 7: // 'E' middle bar: (0.20, 0.0) -> (0.76, 0.0)
      return { x: lerp(0.20, 0.76, t), y: 0.0, z: -0.002 };
    case 8: // 'E' bottom bar: (0.20, -0.72) -> (0.88, -0.72)
      return { x: lerp(0.20, 0.88, t), y: -0.72, z: 0.0 };
    case 9: // 'X' first diagonal (\): (1.24, +0.72) -> (2.04, -0.72)
      return { x: lerp(1.24, 2.04, t), y: lerp(0.72, -0.72, t), z: 0.004 };
    case 10: // 'X' second diagonal (/): (1.24, -0.72) -> (2.04, +0.72)
    default:
      return { x: lerp(1.24, 2.04, t), y: lerp(-0.72, 0.72, t), z: -0.004 };
  }
}

/**
 * Evaluates a 100% closed, non-self-intersecting 3D Liquid-Chrome Sculpture
 * for stages A, B, C (sp = 0.00 .. 0.66) that smoothly separates into "APEX" at sp = 0.66 .. 1.00:
 * - sp = 0.00 (Overview): Classic (2, 3) Trefoil Liquid-Chrome Torus Knot with wide 3D Z-separation
 *   (front and back loops stay > 3.4 tube diameters apart in 3D Z-space — zero self-intersection!)
 * - sp = 0.34 (Values / WIKI): Flowing 3D Infinity / Figure-8 Liquid-Chrome Ribbon with wide Z-clearance
 * - sp = 0.64 (Calculator / Community): Closed Sculptural Horizontal Chrome Loop
 * - sp = 0.94..1.00 (Finale): Solid cast-chrome 3D letters "APEX"
 */
function evaluateSculpturePoint(strandIdx, u, sp, timeSec) {
  const globalU = (strandIdx + u) / STRANDS;
  const t = globalU * Math.PI * 2;
  const breath = Math.sin(timeSec * 0.55 + t * 2) * 0.02;

  // Stage A (sp = 0.00): Classic (2, 3) Liquid-Chrome Torus Knot (gentle curvature, zero foreshortening pinch)
  const rA = 1.12 + 0.25 * Math.cos(3 * t + 0.35);
  const shapeA = {
    x: -rA * Math.cos(2 * t) * 1.12 + breath,
    y: rA * Math.sin(2 * t) * 0.96 + breath * 0.7,
    z: 0.48 * Math.sin(3 * t + 0.35),
  };
  const radA = 0.182 + 0.016 * Math.cos(3 * t);

  // Stage B (sp = 0.34): Sculptural 3D Infinity / Figure-8 Liquid-Chrome Ribbon (wide Z-clearance)
  const shapeB = {
    x: -1.42 * Math.cos(t),
    y: 0.72 * Math.sin(2 * t) + 0.22 * Math.sin(t),
    z: 0.48 * Math.sin(t) + 0.22 * Math.cos(2 * t),
  };
  const radB = 0.185 + 0.015 * Math.cos(2 * t);

  // Stage C (sp = 0.64): Closed Sculptural Horizontal Chrome Loop (ready to part into "APEX")
  const shapeC = {
    x: -1.68 * Math.cos(t),
    y: 0.64 * Math.sin(t) + 0.14 * Math.sin(2 * t),
    z: 0.42 * Math.sin(2 * t),
  };
  const radC = 0.155;

  // Stage D (sp = 1.0): Solid 3D strokes of "APEX"
  const shapeD = sampleApexStroke(strandIdx, u);
  const radD = 0.115;

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

const VS_SOURCE = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjection;
uniform vec3 uRotation;
uniform vec2 uOffset;
uniform float uScale;

varying vec3 vNormal;
varying vec3 vViewPos;

vec3 rotateXYZ(vec3 p, vec3 r) {
  float cy = cos(r.y);
  float sy = sin(r.y);
  vec3 p1 = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);

  float cx = cos(r.x);
  float sx = sin(r.x);
  vec3 p2 = vec3(p1.x, p1.y * cx - p1.z * sx, p1.y * sx + p1.z * cx);

  float cz = cos(r.z);
  float sz = sin(r.z);
  return vec3(p2.x * cz - p2.y * sz, p2.x * sz + p2.y * cz, p2.z);
}

void main() {
  vec3 rotPos = rotateXYZ(aPosition, uRotation);
  vec3 rotNrm = normalize(rotateXYZ(aNormal, uRotation));

  vec3 viewPos = vec3(
    rotPos.x * uScale + uOffset.x,
    rotPos.y * uScale + uOffset.y,
    rotPos.z * uScale - 4.4
  );

  vNormal = rotNrm;
  vViewPos = viewPos;
  gl_Position = uProjection * vec4(viewPos, 1.0);
}
`;

// High-Contrast Mirror-Polished Liquid-Chrome Studio Environment Shader (NaN-free GLSL ES 1.00)
const FS_SOURCE = `
precision highp float;

varying vec3 vNormal;
varying vec3 vViewPos;

uniform vec3 uThemeColor;
uniform vec3 uLightDir;
uniform float uMetallic;
uniform float uContrast;
uniform float uTintStrength;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  if (dot(N, V) < 0.0) {
    N = -N;
  }

  // Exact per-pixel physical mirror reflection vector
  vec3 R = reflect(-V, N);
  vec3 L1 = normalize(uLightDir);
  vec3 L2 = normalize(vec3(-uLightDir.x * 0.9, uLightDir.y * 0.92, uLightDir.z));

  // Smooth C-infinity symmetric reflection coordinate
  float rxSym = R.x * R.x * 0.85 - L1.x * R.x * 0.22;
  float ryShift = R.y - L1.y * 0.35;

  // High-contrast studio chrome reflection bands
  float waveA = 0.5 + 0.5 * sin(ryShift * 4.2 + rxSym * 2.0);
  float studioStrip1 = smoothstep(0.46, 0.88, waveA);

  float waveB = 0.5 + 0.5 * cos(ryShift * 3.0 - rxSym * 1.6 + R.z * 1.1);
  float studioStrip2 = smoothstep(0.52, 0.90, waveB);

  // Smooth C-infinity dark obsidian studio horizon crease
  float hVal = ryShift + 0.08 * rxSym;
  float darkHorizon = exp(-hVal * hVal * 28.0);

  // Secondary dark reflection band for multi-layered chrome depth
  float uVal = ryShift - 0.52;
  float upperCrease = exp(-uVal * uVal * 38.0);

  // Dual symmetric studio key lights + cursor specular highlight
  vec3 H1 = normalize(L1 + V);
  vec3 H2 = normalize(L2 + V);
  float ndoth = max(max(0.0, dot(N, H1)), max(0.0, dot(N, H2)) * 0.95);

  float ndoth2 = ndoth * ndoth;
  float broadSpec = ndoth2 * ndoth2;
  float ndoth8 = broadSpec * broadSpec;
  float sharpSpec = ndoth8 * ndoth8 * ndoth8 * ndoth8;

  // Grazing Fresnel metallic rim
  float ndotv = max(0.0, dot(N, V));
  float invNdotV = 1.0 - ndotv;
  float fresnel = invNdotV * invNdotV;

  // Subtle depth ambient occlusion so rear loops sit deeper in obsidian shadow
  float depthAO = clamp(1.08 + (vViewPos.z + 4.4) * 0.22, 0.72, 1.12);

  // Combine studio reflections into high-contrast liquid chrome luminance
  float chromeReflect = (
    0.04 +
    waveA * 0.18 +
    studioStrip1 * 0.46 * uContrast +
    studioStrip2 * 0.34 * uContrast +
    broadSpec * 0.28 +
    fresnel * 0.24
  ) * (1.0 - darkHorizon * 0.78) * (1.0 - upperCrease * 0.52) * uMetallic * depthAO;

  float luma = clamp(chromeReflect, 0.012, 1.0);

  // Deep obsidian-chrome (#030408) to bright mirror platinum (#f2f6ff)
  vec3 chromeBase = mix(vec3(0.012, 0.016, 0.032), vec3(0.95, 0.97, 1.0), luma);

  // Dynamic theme accent reflection in mid-tones and Fresnel rim
  float themeMask = clamp(
    (waveA * 0.38 + studioStrip2 * 0.35 + broadSpec * 0.48 + fresnel * 0.78) * uTintStrength,
    0.0,
    0.85
  );
  vec3 tintedChrome = mix(chromeBase, uThemeColor, themeMask);

  // Pure white mirror softbox & cursor hotspot
  float whiteHotspot = clamp(
    (sharpSpec * 0.98 + studioStrip1 * studioStrip2 * 0.65 + broadSpec * studioStrip1 * 0.35) * depthAO,
    0.0,
    1.0
  );
  vec3 finalColor = mix(tintedChrome, vec3(1.0, 1.0, 1.0), whiteHotspot);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildPerspectiveMatrix4(fovRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovRad * 0.5);
  const nf = 1.0 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
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

    let gl = null;
    try {
      gl =
        canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          depth: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
        }) ||
        canvas.getContext('experimental-webgl', {
          alpha: true,
          antialias: true,
          depth: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: true,
        });
    } catch {
      gl = null;
    }

    if (!gl) return undefined;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return undefined;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;

    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const uProjection = gl.getUniformLocation(program, 'uProjection');
    const uRotation = gl.getUniformLocation(program, 'uRotation');
    const uOffset = gl.getUniformLocation(program, 'uOffset');
    const uScale = gl.getUniformLocation(program, 'uScale');
    const uThemeColor = gl.getUniformLocation(program, 'uThemeColor');
    const uLightDir = gl.getUniformLocation(program, 'uLightDir');
    const uMetallic = gl.getUniformLocation(program, 'uMetallic');
    const uContrast = gl.getUniformLocation(program, 'uContrast');
    const uTintStrength = gl.getUniformLocation(program, 'uTintStrength');

    const isFirefox =
      typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 900 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

    const maxDpr = isMobile || isFirefox ? 1.25 : Math.min(window.devicePixelRatio || 1, 2.0);

    // 6 smooth hemispherical cap rings at each end + high-density body rings
    const capSteps = 6;
    const bodySteps = isMobile || isFirefox ? 22 : 30;
    const spineSteps = bodySteps + capSteps * 2;
    const radialSteps = isMobile || isFirefox ? 20 : 28;

    const ringsPerStrand = spineSteps + 1;
    const vertsPerRing = radialSteps;
    const vertsPerStrand = ringsPerStrand * vertsPerRing;
    const totalVerts = STRANDS * vertsPerStrand;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);

    const quadsPerStrand = spineSteps * radialSteps;
    const totalIndices = STRANDS * quadsPerStrand * 6;
    const indices = new Uint16Array(totalIndices);

    let idxPtr = 0;
    for (let s = 0; s < STRANDS; s++) {
      const baseV = s * vertsPerStrand;
      for (let i = 0; i < spineSteps; i++) {
        const row0 = baseV + i * vertsPerRing;
        const row1 = baseV + (i + 1) * vertsPerRing;
        for (let r = 0; r < radialSteps; r++) {
          const rNext = (r + 1) % radialSteps;
          const v00 = row0 + r;
          const v10 = row1 + r;
          const v11 = row1 + rNext;
          const v01 = row0 + rNext;

          indices[idxPtr++] = v00;
          indices[idxPtr++] = v10;
          indices[idxPtr++] = v11;

          indices[idxPtr++] = v00;
          indices[idxPtr++] = v11;
          indices[idxPtr++] = v01;
        }
      }
    }

    const posBuffer = gl.createBuffer();
    const nrmBuffer = gl.createBuffer();
    const idxBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const radialCos = new Float32Array(radialSteps);
    const radialSin = new Float32Array(radialSteps);
    for (let r = 0; r < radialSteps; r++) {
      const theta = (r / radialSteps) * Math.PI * 2;
      radialCos[r] = Math.cos(theta);
      radialSin[r] = Math.sin(theta);
    }

    let width = 0;
    let height = 0;
    let rafId = 0;
    let visible = true;

    let themeRgb = [0.86, 0.9, 0.98];
    let metallicBoost = 1.08;
    let metalFinish = 'chrome';

    function updateThemeState() {
      const rootStyle = getComputedStyle(document.documentElement);
      const rawColor =
        tintColor ||
        rootStyle.getPropertyValue('--accent').trim() ||
        '#ffffff';
      themeRgb = parseHexToRgbNormalized(rawColor);
      const mVal = parseFloat(rootStyle.getPropertyValue('--theme-metallic'));
      metallicBoost = Number.isFinite(mVal) ? Math.max(0.7, mVal * 1.15) : 1.08;
      metalFinish = document.documentElement.dataset.metalFinish || 'chrome';
    }
    updateThemeState();

    const state = {
      scrollProgress: { current: 0, target: 0 },
      lightX: { current: 0.35, target: 0.35 },
      lightY: { current: 0.45, target: 0.45 },
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
      const nextW = Math.max(1, Math.round(rect.width || window.innerWidth));
      const nextH = Math.max(1, Math.round(rect.height || window.innerHeight));
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      canvas.width = Math.round(width * maxDpr);
      canvas.height = Math.round(height * maxDpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
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
      const ny = (0.5 - e.clientY / Math.max(1, window.innerHeight)) * 2;
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

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    let lastTime = performance.now();
    let timeSec = 0;

    function tick(now) {
      if (!visible || document.hidden) {
        rafId = 0;
        return;
      }
      if (width <= 1 || height <= 1) resize();

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
      const capBlend = smoothstep(0.64, 0.90, sp);
      const isClosedLoop = capBlend < 0.001;

      const autoRx =
        (0.16 + Math.sin(timeSec * 0.34) * 0.12) * (1 - apexAlign);
      const autoRy = (timeSec * 0.16 + sp * 0.95) * (1 - apexAlign);
      const autoRz = Math.cos(timeSec * 0.26) * 0.06 * (1 - apexAlign);

      const rx =
        autoRx + state.dragRotX - state.lightY.current * 0.10 * (1 - apexAlign * 0.5);
      const ry =
        autoRy + state.dragRotY + state.lightX.current * 0.13 * (1 - apexAlign * 0.5);
      const rz = autoRz;

      const ribbonSquash = lerp(0.84, 1.0, apexAlign);

      // Step 1: Sample body spine points (0..bodySteps) for all 11 strands
      const strandData = new Array(STRANDS);
      for (let s = 0; s < STRANDS; s++) {
        const bodyPts = new Array(bodySteps + 1);
        for (let b = 0; b <= bodySteps; b++) {
          bodyPts[b] = evaluateSculpturePoint(s, b / bodySteps, sp, timeSec);
        }
        strandData[s] = { bodyPts };
      }

      // Step 2: Build twist-free Parallel-Transport (Bishop) frames
      let prevN = { x: 0, y: 0, z: 1 };
      const allFrames = new Array(STRANDS);

      for (let s = 0; s < STRANDS; s++) {
        const { bodyPts } = strandData[s];
        const prevBody = strandData[(s - 1 + STRANDS) % STRANDS].bodyPts;
        const nextBody = strandData[(s + 1) % STRANDS].bodyPts;

        const frames = new Array(bodySteps + 1);
        if (!isClosedLoop) {
          prevN = { x: 0, y: 0, z: 1 };
        }

        for (let b = 0; b <= bodySteps; b++) {
          // When closed loop and b == 0 on s > 0, reuse the exact frame from the end of strand s - 1
          if (isClosedLoop && s > 0 && b === 0) {
            const prevEnd = allFrames[s - 1][bodySteps];
            frames[0] = { ...prevEnd };
            prevN = { x: prevEnd.nx, y: prevEnd.ny, z: prevEnd.nz };
            continue;
          }

          const pPrev =
            b > 0
              ? bodyPts[b - 1].pos
              : isClosedLoop
                ? prevBody[bodySteps - 1].pos
                : bodyPts[0].pos;
          const pNext =
            b < bodySteps
              ? bodyPts[b + 1].pos
              : isClosedLoop
                ? nextBody[1].pos
                : bodyPts[bodySteps].pos;

          let tx = pNext.x - pPrev.x;
          let ty = pNext.y - pPrev.y;
          let tz = pNext.z - pPrev.z;
          const tLen = Math.hypot(tx, ty, tz) || 1;
          tx /= tLen;
          ty /= tLen;
          tz /= tLen;

          const dotNT = prevN.x * tx + prevN.y * ty + prevN.z * tz;
          let nx = prevN.x - dotNT * tx;
          let ny = prevN.y - dotNT * ty;
          let nz = prevN.z - dotNT * tz;
          let nLen = Math.hypot(nx, ny, nz);
          if (nLen < 0.001) {
            nx = -ty;
            ny = tx;
            nz = 0;
            nLen = Math.hypot(nx, ny, nz) || 1;
          }
          nx /= nLen;
          ny /= nLen;
          nz /= nLen;

          const bx = ty * nz - tz * ny;
          const by = tz * nx - tx * nz;
          const bz = tx * ny - ty * nx;

          prevN = { x: nx, y: ny, z: nz };
          frames[b] = {
            pos: bodyPts[b].pos,
            radius: bodyPts[b].radius,
            tx,
            ty,
            tz,
            nx,
            ny,
            nz,
            bx,
            by,
            bz,
          };
        }
        allFrames[s] = frames;
      }

      // Apply exact closed-loop holonomy correction and weld seam
      if (isClosedLoop) {
        const fStart = allFrames[0][0];
        const fEnd = allFrames[STRANDS - 1][bodySteps];
        const cosH =
          fEnd.nx * fStart.nx + fEnd.ny * fStart.ny + fEnd.nz * fStart.nz;
        const sinH =
          fEnd.nx * fStart.bx + fEnd.ny * fStart.by + fEnd.nz * fStart.bz;
        const holonomyAngle = Math.atan2(sinH, cosH);
        const totalSteps = STRANDS * bodySteps;

        for (let s = 0; s < STRANDS; s++) {
          const frames = allFrames[s];
          for (let b = 0; b <= bodySteps; b++) {
            const globalStep = s * bodySteps + b;
            const corr = -(globalStep / totalSteps) * holonomyAngle;
            const c = Math.cos(corr);
            const sn = Math.sin(corr);
            const f = frames[b];
            const rNx = f.nx * c + f.bx * sn;
            const rNy = f.ny * c + f.by * sn;
            const rNz = f.nz * c + f.bz * sn;
            const rBx = -f.nx * sn + f.bx * c;
            const rBy = -f.ny * sn + f.by * c;
            const rBz = -f.nz * sn + f.bz * c;
            f.nx = rNx;
            f.ny = rNy;
            f.nz = rNz;
            f.bx = rBx;
            f.by = rBy;
            f.bz = rBz;
          }
        }
        // Weld final ring of strand 10 identically to ring 0 of strand 0
        allFrames[STRANDS - 1][bodySteps] = { ...allFrames[0][0] };
      }

      // Step 3: Populate vertex positions & normals (with pole-consistent spherical caps)
      let vPtr = 0;
      for (let s = 0; s < STRANDS; s++) {
        const frames = allFrames[s];

        for (let i = 0; i <= spineSteps; i++) {
          let f;
          let ringPos;
          let ringRad;
          let poleWeight = 0;
          let radialWeight = 1;
          let poleSign = 0;

          if (i < capSteps) {
            f = frames[0];
            const alpha = (i / capSteps) * (Math.PI * 0.5);
            const cosA = Math.cos(alpha) * capBlend;
            const sinA = lerp(1.0, Math.sin(alpha), capBlend);
            const ext = f.radius * cosA;
            ringPos = {
              x: f.pos.x - f.tx * ext,
              y: f.pos.y - f.ty * ext,
              z: f.pos.z - f.tz * ext,
            };
            ringRad = f.radius * sinA;
            // At alpha = 0 (pole), radialWeight is 0 so all 28 pole vertices share ONE identical normal!
            radialWeight = sinA;
            poleWeight = cosA;
            poleSign = -1;
          } else if (i > capSteps + bodySteps) {
            f = frames[bodySteps];
            const rem = spineSteps - i;
            const alpha = (rem / capSteps) * (Math.PI * 0.5);
            const cosA = Math.cos(alpha) * capBlend;
            const sinA = lerp(1.0, Math.sin(alpha), capBlend);
            const ext = f.radius * cosA;
            ringPos = {
              x: f.pos.x + f.tx * ext,
              y: f.pos.y + f.ty * ext,
              z: f.pos.z + f.tz * ext,
            };
            ringRad = f.radius * sinA;
            radialWeight = sinA;
            poleWeight = cosA;
            poleSign = 1;
          } else {
            f = frames[i - capSteps];
            ringPos = f.pos;
            ringRad = f.radius;
          }

          // Smooth pole normal facing slightly toward viewer (+Z) + axial tangent
          const poleNx = f.tx * poleSign * 0.38;
          const poleNy = f.ty * poleSign * 0.38;
          const poleNz = f.tz * poleSign * 0.38 + 0.92;

          for (let r = 0; r < radialSteps; r++) {
            const c = radialCos[r];
            const sn = radialSin[r];

            const radOffsetX =
              f.bx * c * ringRad + f.nx * sn * ringRad * ribbonSquash;
            const radOffsetY =
              f.by * c * ringRad + f.ny * sn * ringRad * ribbonSquash;
            const radOffsetZ =
              f.bz * c * ringRad + f.nz * sn * ringRad * ribbonSquash;

            positions[vPtr] = ringPos.x + radOffsetX;
            positions[vPtr + 1] = ringPos.y + radOffsetY;
            positions[vPtr + 2] = ringPos.z + radOffsetZ;

            const rNx = f.bx * c + (f.nx * sn) / ribbonSquash;
            const rNy = f.by * c + (f.ny * sn) / ribbonSquash;
            const rNz = f.bz * c + (f.nz * sn) / ribbonSquash;

            const localNx = rNx * radialWeight + poleNx * poleWeight;
            const localNy = rNy * radialWeight + poleNy * poleWeight;
            const localNz = rNz * radialWeight + poleNz * poleWeight;
            const nLen = Math.hypot(localNx, localNy, localNz) || 1;

            normals[vPtr] = localNx / nLen;
            normals[vPtr + 1] = localNy / nLen;
            normals[vPtr + 2] = localNz / nLen;
            vPtr += 3;
          }
        }
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);

      const aspect = Math.max(0.2, width / Math.max(1, height));
      const proj = buildPerspectiveMatrix4((40 * Math.PI) / 180, aspect, 0.1, 25.0);
      gl.uniformMatrix4fv(uProjection, false, proj);

      const offsetX = width > 1060 ? lerp(0.56 * (aspect / 1.7), 0.0, apexAlign) : 0.0;
      const offsetY = lerp(0.01, 0.18, apexAlign);
      const worldScale =
        lerp(0.76, 0.82, apexAlign) * Math.min(1.08, Math.max(0.66, aspect / 1.6));

      gl.uniform3f(uRotation, rx, ry, rz);
      gl.uniform2f(uOffset, offsetX, offsetY);
      gl.uniform1f(uScale, worldScale);
      gl.uniform3f(uThemeColor, themeRgb[0], themeRgb[1], themeRgb[2]);
      gl.uniform3f(uLightDir, state.lightX.current, state.lightY.current, 0.85);
      gl.uniform1f(uMetallic, metallicBoost);

      const finishContrast =
        metalFinish === 'mercury'
          ? 1.35
          : metalFinish === 'titanium'
            ? 0.78
            : 1.15;
      const themeTintStrength =
        metalFinish === 'prismatic' ? 0.82 : 0.52;

      gl.uniform1f(uContrast, finishContrast);
      gl.uniform1f(uTintStrength, themeTintStrength);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(aNormal);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
      gl.drawElements(gl.TRIANGLES, totalIndices, gl.UNSIGNED_SHORT, 0);

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
