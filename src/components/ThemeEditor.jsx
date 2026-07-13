import { useEffect, useMemo, useState } from 'react';
import { applyTheme, DEFAULT_THEME, loadTheme, saveTheme, THEME_PRESETS } from '../utils/theme';
import './ThemeEditor.css';

const COLOR_FIELDS = [
  ['accent', 'Accent'],
  ['bg', 'Background'],
  ['bgCard', 'Cards'],
  ['bgElevated', 'Panels'],
  ['border', 'Border'],
  ['borderStrong', 'Strong Border'],
  ['text', 'Text'],
  ['textDim', 'Dim Text'],
  ['textFaint', 'Faint Text'],
  ['success', 'Success'],
  ['danger', 'Danger'],
  ['youColor', 'Calculator You'],
  ['themColor', 'Calculator Them'],
];

const EFFECT_FIELDS = [
  ['glow', 'Glow', 0, 1.2, 0.01],
  ['scanlines', 'Scanlines', 0, 0.6, 0.01],
  ['grid', 'Grid', 0, 0.35, 0.01],
  ['vfx', 'VFX Power', 0, 2, 0.05],
  ['speed', 'Animation Speed', 0.5, 1.5, 0.05],
];

export default function ThemeEditor({ open, onClose }) {
  const [theme, setTheme] = useState(() => loadTheme());

  useEffect(() => {
    const loaded = loadTheme();
    setTheme(loaded);
    applyTheme(loaded);
  }, []);

  useEffect(() => {
    if (!open) return;
    const loaded = loadTheme();
    setTheme(loaded);
  }, [open]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const presetId = useMemo(() => {
    const match = THEME_PRESETS.find((preset) => preset.id === theme.id);
    return match ? match.id : 'custom';
  }, [theme.id]);

  function commit(nextTheme) {
    const applied = applyTheme(nextTheme);
    setTheme(applied);
    saveTheme(applied);
  }

  function applyPreset(id) {
    const preset = THEME_PRESETS.find((entry) => entry.id === id) || DEFAULT_THEME;
    commit(preset);
  }

  function updateColor(key, value) {
    commit({ ...theme, id: 'custom', name: 'Custom', colors: { ...theme.colors, [key]: value } });
  }

  function updateEffect(key, value) {
    commit({ ...theme, id: 'custom', name: 'Custom', effects: { ...theme.effects, [key]: Number(value) } });
  }

  function copyThemeCode() {
    const encoded = btoa(encodeURIComponent(JSON.stringify(theme)));
    navigator.clipboard?.writeText(encoded);
  }

  function importThemeCode() {
    const code = window.prompt('Paste APEX theme code:');
    if (!code) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(atob(code.trim())));
      commit({ ...parsed, id: 'custom', name: parsed.name || 'Imported Theme' });
    } catch {
      window.alert('Invalid theme code.');
    }
  }

  if (!open) return null;

  return (
    <div className="theme-overlay" onClick={onClose}>
      <aside className="theme-panel" onClick={(event) => event.stopPropagation()}>
        <div className="theme-head">
          <div>
            <div className="theme-kicker">APEX Interface</div>
            <h2>Theme Editor</h2>
          </div>
          <button type="button" className="theme-close" onClick={onClose} aria-label="Close theme editor">
            ✕
          </button>
        </div>

        <label className="theme-field full">
          <span>Preset</span>
          <select value={presetId} onChange={(event) => applyPreset(event.target.value)}>
            {THEME_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>

        <div className="theme-preview">
          <div className="theme-preview-orb" />
          <div>
            <strong>{theme.name || 'Custom Theme'}</strong>
            <span>Local only — shared trades use the viewer&apos;s own theme.</span>
          </div>
        </div>

        <section className="theme-section">
          <h3>Colors</h3>
          <div className="theme-grid">
            {COLOR_FIELDS.map(([key, label]) => (
              <label key={key} className="theme-field">
                <span>{label}</span>
                <input type="color" value={theme.colors[key]} onChange={(event) => updateColor(key, event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section className="theme-section">
          <h3>VFX</h3>
          <div className="theme-sliders">
            {EFFECT_FIELDS.map(([key, label, min, max, step]) => (
              <label key={key} className="theme-slider">
                <span>{label} <b>{theme.effects[key]}</b></span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={theme.effects[key]}
                  onChange={(event) => updateEffect(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <div className="theme-actions">
          <button type="button" onClick={() => commit(DEFAULT_THEME)}>Reset</button>
          <button type="button" onClick={importThemeCode}>Import</button>
          <button type="button" onClick={copyThemeCode}>Copy Theme Code</button>
        </div>
      </aside>
    </div>
  );
}
