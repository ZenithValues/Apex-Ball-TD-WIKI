/**
 * UX & Deep Architectural Customization Settings
 * Controls background patterns, surface material, corner geometry,
 * typography voice, 3D metallic finish, cursor glow intensity,
 * animation speed, colorblind modes, and accessibility.
 */

const UX_STORAGE_KEY = 'apex-ux-settings-v1';

const DEFAULTS = {
  bgPattern: 'none',         // none | grid | dots | lines
  bgPatternColor: '#ffffff',
  surfaceStyle: 'obsidian',  // obsidian | chrome | glass | wireframe
  cardRadius: 'sculpted',    // sharp | balanced | sculpted
  fontStyle: 'sans',         // sans | mono | serif
  metalFinish: 'chrome',     // chrome | titanium | mercury | prismatic
  cursorGlow: 0.24,          // 0 to 0.8 (default subtle 0.24)
  animSpeed: 1,              // 0 = animations off; otherwise a speed multiplier (0.25–1.5)
  colorblind: 'none',        // none | protanopia | deuteranopia | tritanopia
  highContrast: false,
  fontSize: 'normal',        // small | normal | large | xlarge
  reducedMotion: false,
};

export function loadUXSettings() {
  try {
    const raw = localStorage.getItem(UX_STORAGE_KEY);
    if (raw) {
      const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
      parsed.animSpeed = normalizeAnimSpeed(parsed.animSpeed);
      return parsed;
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveUXSettings(settings) {
  try {
    localStorage.setItem(UX_STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function applyUXSettings(settings) {
  const root = document.documentElement;
  const s = { ...DEFAULTS, ...settings };

  root.dataset.bgPattern = s.bgPattern;
  root.style.setProperty('--bg-pattern-color', s.bgPatternColor || '#ffffff');

  root.dataset.surfaceStyle = s.surfaceStyle || 'obsidian';
  root.dataset.cardRadius = s.cardRadius || 'sculpted';
  root.dataset.fontStyle = s.fontStyle || 'sans';
  root.dataset.metalFinish = s.metalFinish || 'chrome';

  const glowOpacity = Number.isFinite(Number(s.cursorGlow))
    ? Math.max(0, Math.min(0.85, Number(s.cursorGlow)))
    : 0.24;
  root.style.setProperty('--cursor-glow-opacity', String(glowOpacity));

  const speedNum = Number(s.animSpeed);
  root.dataset.animSpeed =
    speedNum <= 0 ? 'none' : speedNum < 0.75 ? 'slow' : speedNum <= 1.25 ? 'normal' : 'fast';
  root.style.setProperty('--theme-speed', String(speedNum <= 0 ? 0.0001 : speedNum));
  root.style.setProperty('--anim-speed', String(speedNum <= 0 ? 0 : 1 / Math.max(speedNum, 0.0001)));
  root.dataset.colorblind = s.colorblind;
  root.dataset.highContrast = String(s.highContrast);
  root.dataset.fontSize = s.fontSize;

  if (s.reducedMotion) {
    root.dataset.reducedMotion = 'true';
  } else {
    delete root.dataset.reducedMotion;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('apex-ux-updated', { detail: s }));
  }
}

export const BG_PATTERNS = [
  { value: 'none', label: 'None' },
  { value: 'grid', label: 'Grid' },
  { value: 'dots', label: 'Dots' },
  { value: 'lines', label: 'Lines' },
];

export const SURFACE_STYLES = [
  { value: 'obsidian', label: 'Obsidian Matte' },
  { value: 'chrome', label: 'Brushed Chrome' },
  { value: 'glass', label: 'Liquid Glass' },
  { value: 'wireframe', label: 'Neon Wireframe' },
];

export const CARD_RADII = [
  { value: 'sharp', label: 'Sharp (6px)' },
  { value: 'balanced', label: 'Balanced (16px)' },
  { value: 'sculpted', label: 'Sculpted (24px)' },
];

export const FONT_STYLES = [
  { value: 'sans', label: 'Montserrat Sans' },
  { value: 'mono', label: 'Technical Mono' },
  { value: 'serif', label: 'Editorial Serif' },
];

export const METAL_FINISHES = [
  { value: 'chrome', label: 'Liquid Chrome' },
  { value: 'titanium', label: 'Brushed Titanium' },
  { value: 'mercury', label: 'Dark Mercury' },
  { value: 'prismatic', label: 'Prismatic Alloy' },
];

export const ANIM_SPEED_LABELS = { fast: 1.5, normal: 1, slow: 0.5, none: 0 };

export function normalizeAnimSpeed(raw) {
  if (raw === null || raw === undefined) return 1;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.min(1.5, Math.max(0, raw));
  const mapped = ANIM_SPEED_LABELS[String(raw)];
  return mapped !== undefined ? mapped : 1;
}

export const COLORBLIND_MODES = [
  { value: 'none', label: 'Off' },
  { value: 'protanopia', label: 'Protanopia (Red-blind)' },
  { value: 'deuteranopia', label: 'Deuteranopia (Green-blind)' },
  { value: 'tritanopia', label: 'Tritanopia (Blue-blind)' },
];

export const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];
