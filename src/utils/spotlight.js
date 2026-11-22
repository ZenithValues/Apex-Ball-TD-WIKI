/**
 * spotlight.js — cursor-light inversion on TEXT HEADERS ONLY (operator,
 * 2026-11-19: "colour inversion only at the cursor's light, on text
 * specifically, only headers like WIKI, APEX, Values, Community").
 *
 * On first pointer contact a header (h1, h2, the APEX brand) we append one
 * aria-hidden clone layer (`.spot-layer`). CSS masks that layer to a soft
 * circle pinned at `--sx/--sy`, and the layer paints the inverted scheme
 * (light patch, dark text), so the inversion exists ONLY inside the moving
 * light and nowhere else. Pointer-driven class updates — no :hover rules —
 * so the quiet-text-hover postcss pass cannot strip it, and no effect runs
 * without direct input (safe under reduced-motion gates).
 */
const HEAD_SELECTOR = 'h1, h2, .brand-text'; // .brand-text = the APEX wordmark

function ensureLayer(el) {
  let layer = el.querySelector(':scope > .spot-layer');
  if (!layer) {
    // Two stacked children: a feathered `.spot-glow` (the light — always a
    // soft ellipse, never a box) and `.spot-ink` (a text clone whose colour
    // inversion is clipped TO THE GLYPHS via background-clip:text, so only the
    // letter portions inside the light ever flip — mid-letter, no box, and no
    // dependency on CSS mask support).
    layer = document.createElement('span');
    layer.className = 'spot-layer';
    layer.setAttribute('aria-hidden', 'true');
    const glow = document.createElement('span');
    glow.className = 'spot-glow';
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
  if (!window.matchMedia('(pointer: fine)').matches) {
    // Touch devices: a single tap still reveals the light via pointerdown.
  }
  let current = null;
  const track = (event) => {
    const target = event.target;
    const el = target && target.closest ? target.closest(HEAD_SELECTOR) : null;
    if (el !== current) {
      if (current) current.classList.remove('is-spot');
      current = el && el.isConnected ? el : null;
      if (current) ensureLayer(current);
    }
    if (current) {
      const rect = current.getBoundingClientRect();
      current.style.setProperty('--sx', `${event.clientX - rect.left}px`);
      current.style.setProperty('--sy', `${event.clientY - rect.top}px`);
      current.classList.add('is-spot');
    }
  };
  window.addEventListener('pointermove', track, { passive: true });
  window.addEventListener('pointerdown', track, { passive: true });
}

export default initHeaderSpotlight;
