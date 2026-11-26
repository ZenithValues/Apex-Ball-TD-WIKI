/**
 * spotlight.js — LIQUID cursor-light inversion on text headers, APEX LANDING
 * PAGE ONLY (operator 2026-11-19: "ONLY on the APEX page" and the light's
 * shape should be liquid — slight waves trailing the cursor).
 *
 * On first pointer contact with a landing header (h1, h2, the APEX brand) we
 * append one aria-hidden clone layer. Inside it three blurred blobs build the
 * light: the head blob tracks the cursor while two lagged trail blobs chase
 * short history points, so the glow wobbles like liquid as the cursor moves.
 * `.spot-ink` clones the text and paints its inversion clipped to the glyphs,
 * so only letter portions inside the light ever flip — mid-stroke, no box.
 * Pointer-driven class updates — no :hover rules — so the quiet-text-hover
 * pass cannot strip it; motion gates freeze the wobble.
 */
const HEAD_SELECTOR = 'h1, h2, .brand-text'; // .brand-text = the APEX wordmark
const TRAIL_LAG_MS = [120, 260];
const MAX_HISTORY = 30;

function isLanding() {
  return window.location.pathname === '/';
}

function ensureLayer(el) {
  let layer = el.querySelector(':scope > .spot-layer');
  if (!layer) {
    // Three stacked children: `.spot-glow` hosts the liquid blobs (the
    // light), `.spot-ink` is the text clone whose inversion is clipped to the
    // glyphs via background-clip:text.
    layer = document.createElement('span');
    layer.className = 'spot-layer';
    layer.setAttribute('aria-hidden', 'true');
    const glow = document.createElement('span');
    glow.className = 'spot-glow';
    glow.innerHTML = '<span class="spot-blob spot-blob-main"></span>'
      + '<span class="spot-blob spot-blob-trail spot-blob-t1"></span>'
      + '<span class="spot-blob spot-blob-trail spot-blob-t2"></span>';
    const ink = document.createElement('span');
    ink.className = 'spot-ink';
    ink.innerHTML = el.innerHTML;
    layer.append(glow, ink);
    el.classList.add('spot-head');
    el.appendChild(layer);
  }
  return layer;
}

export function initHeaderSpotlight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  let current = null;
  let history = [];
  let trailPos = {};
  let raf = 0;

  const stopWave = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const wave = () => {
    raf = 0;
    if (!current || !current.isConnected || !current.classList.contains('is-spot')) return;
    const layer = current.querySelector(':scope > .spot-layer');
    if (!layer) return;
    const now = performance.now();
    const trailAt = (lag) => {
      let p = history[history.length - 1] || null;
      for (let i = history.length - 1; i >= 0; i -= 1) {
        if (now - history[i].t >= lag) { p = history[i]; break; }
      }
      return p;
    };
    const applyTrail = (key, lag) => {
      const p = trailAt(lag);
      if (!p) return;
      const prev = trailPos[key] || p;
      const nx = prev.x + (p.x - prev.x) * 0.15;
      const ny = prev.y + (p.y - prev.y) * 0.15;
      trailPos[key] = { x: nx, y: ny };
      layer.style.setProperty(`--${key}x`, `${nx}px`);
      layer.style.setProperty(`--${key}y`, `${ny}px`);
    };
    applyTrail('t1', TRAIL_LAG_MS[0]);
    applyTrail('t2', TRAIL_LAG_MS[1]);
    while (history.length && now - history[0].t > 1400) history.shift();
    raf = requestAnimationFrame(wave);
  };

  const track = (event) => {
    if (!isLanding()) {
      // The liquid light exists ONLY on the APEX landing page.
      if (current) {
        current.classList.remove('is-spot');
        current = null;
        stopWave();
      }
      return;
    }
    const target = event.target;
    const el = target && target.closest ? target.closest(HEAD_SELECTOR) : null;
    if (el !== current) {
      if (current) current.classList.remove('is-spot');
      current = el && el.isConnected ? el : null;
      history = [];
      trailPos = {};
      if (current) ensureLayer(current);
    }
    if (current) {
      const rect = current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      current.style.setProperty('--sx', `${x}px`);
      current.style.setProperty('--sy', `${y}px`);
      current.classList.add('is-spot');
      history.push({ x, y, t: performance.now() });
      if (history.length > MAX_HISTORY) history.shift();
      if (!raf) raf = requestAnimationFrame(wave);
    } else {
      stopWave();
    }
  };

  window.addEventListener('pointermove', track, { passive: true });
  window.addEventListener('pointerdown', track, { passive: true });
}

export default initHeaderSpotlight;
