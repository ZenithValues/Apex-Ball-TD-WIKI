import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell';
import Dropdown from '../components/Dropdown';
import { applyTheme, DEFAULT_THEME, loadTheme, saveTheme, THEME_PRESETS } from '../config/theme';
import { formatCompactNumber } from '../utils/formatNumber';
import UnitIcon from '../components/UnitIcon';
import { VALUES_NAV } from '../config/navigation';
import './ThemeEditorDashboard.css';

const COLOR_GROUPS = [
  {
    title: 'Brand & Accents',
    fields: [
      ['accent', 'Primary Accent'],
      ['accentInverse', 'Accent Text'],
      ['youColor', 'Calculator YOU'],
      ['themColor', 'Calculator THEM'],
    ],
  },
  {
    title: 'Surfaces & Backgrounds',
    fields: [
      ['bg', 'Main Background'],
      ['bgElevated', 'Panels & Sidebar'],
      ['bgCard', 'Cards'],
      ['bgCardHover', 'Card Hover'],
    ],
  },
  {
    title: 'Typography & Borders',
    fields: [
      ['text', 'Primary Text'],
      ['textDim', 'Secondary Text'],
      ['textFaint', 'Muted Text'],
      ['border', 'Card Border'],
      ['borderStrong', 'Glow Border'],
    ],
  },
  {
    title: 'Status & Badges',
    fields: [
      ['success', 'Success / Win'],
      ['danger', 'Danger / Loss'],
    ],
  },
];

const EFFECT_SLIDERS = [
  ['glow', 'Neon Glow Intensity', 0, 0.75, 0.01],
  ['scanlines', 'Scanlines Opacity', 0, 0.35, 0.01],
  ['grid', 'Holo Grid Opacity', 0, 0.22, 0.01],
  ['vfx', 'VFX Power Scale', 0, 2, 0.05],
  ['speed', 'Animation Speed', 0.5, 1.5, 0.05],
];

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function darken(hex, factor = 0.2) {
  const value = hex.replace('#', '');
  const r = Math.round(parseInt(value.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(value.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(value.slice(4, 6), 16) * factor);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export default function ThemeEditorDashboard() {
  const [theme, setTheme] = useState(() => loadTheme());
  const [activeTab, setActiveTab] = useState('colors');
  const [copyNotice, setCopyNotice] = useState('');

  useEffect(() => {
    const loaded = loadTheme();
    setTheme(loaded);
    applyTheme(loaded);
  }, []);

  const presetId = useMemo(() => {
    const match = THEME_PRESETS.find((preset) => preset.id === theme?.id);
    return match ? match.id : 'custom';
  }, [theme?.id]);

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
    commit({ ...theme, id: 'custom', name: 'Custom Theme', colors: { ...(theme?.colors || DEFAULT_THEME.colors), [key]: value } });
  }

  function updateEffect(key, value) {
    commit({ ...theme, id: 'custom', name: theme?.name || 'Custom Theme', effects: { ...(theme?.effects || DEFAULT_THEME.effects), [key]: Number(value) } });
  }

  function updateName(value) {
    commit({ ...theme, id: 'custom', name: value || 'Custom Theme' });
  }

  function randomizeTheme() {
    const accent = randomHex();
    const bg = darken(accent, 0.08);
    const card = darken(accent, 0.14);
    commit({
      ...theme,
      id: 'custom',
      name: 'Cyber Harmony',
      colors: {
        ...(theme?.colors || DEFAULT_THEME.colors),
        bg,
        bgElevated: darken(accent, 0.18),
        bgCard: card,
        bgCardHover: darken(accent, 0.28),
        border: darken(accent, 0.42),
        borderStrong: accent,
        accent,
        text: '#ffffff',
        textDim: '#d7d7d7',
        textFaint: darken(accent, 0.72),
        youColor: accent,
        themColor: randomHex(),
      },
      effects: { ...(theme?.effects || DEFAULT_THEME.effects), glow: 0.52, scanlines: 0.22, grid: 0.14, vfx: 1.25 },
    });
  }

  function copyThemeCode() {
    const encoded = btoa(encodeURIComponent(JSON.stringify(theme)));
    navigator.clipboard?.writeText(encoded);
    setCopyNotice('Copied theme string to clipboard!');
    setTimeout(() => setCopyNotice(''), 2500);
  }

  function importThemeCode() {
    const code = window.prompt('Paste APEX theme code:');
    if (!code) return;
    try {
      let decoded = decodeURIComponent(atob(code.trim()));
      decoded = decoded.replace(/(#[0-9a-fA-F]{6}),(")/g, '$1$2,');
      const parsed = JSON.parse(decoded);
      commit({ ...parsed, id: 'custom', name: parsed.name || 'Imported Theme' });
      setCopyNotice('Theme imported successfully!');
      setTimeout(() => setCopyNotice(''), 2500);
    } catch {
      window.alert('Invalid theme code string.');
    }
  }

  const safeColors = theme?.colors || DEFAULT_THEME.colors;
  const safeEffects = theme?.effects || DEFAULT_THEME.effects;

  return (
    <PageShell sidebarTitle="VALUES & WIKI" navTree={VALUES_NAV}>
      <div className="theme-dashboard-page">
        <motion.div className="theme-dashboard-hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <span className="page-kicker">Customization Hub</span>
            <h1>Theme Studio</h1>
            <p>Design, customize, and fine-tune your personal site-wide holographic UI experience.</p>
          </div>
          <div className="theme-dashboard-hero-actions">
            <button type="button" className="filled" onClick={randomizeTheme}>⚡ Harmony Randomize</button>
            <button type="button" onClick={importThemeCode}>📥 Import Code</button>
            <button type="button" onClick={copyThemeCode}>📋 Export Code</button>
            <button type="button" onClick={() => commit(DEFAULT_THEME)}>🔄 Reset Defaults</button>
          </div>
        </motion.div>

        {copyNotice && <div className="theme-notice-toast">{copyNotice}</div>}

        <div className="theme-dashboard-layout">
          <main className="theme-dashboard-main card">
            <div className="theme-dash-tabs">
              <button type="button" className={activeTab === 'presets' ? 'active' : ''} onClick={() => setActiveTab('presets')}>
                Presets Catalog
              </button>
              <button type="button" className={activeTab === 'colors' ? 'active' : ''} onClick={() => setActiveTab('colors')}>
                Palette &amp; Colors
              </button>
              <button type="button" className={activeTab === 'vfx' ? 'active' : ''} onClick={() => setActiveTab('vfx')}>
                VFX &amp; Ambiance
              </button>
            </div>

            <div className="theme-dash-name-row">
              <label className="theme-dash-field">
                <span>Theme Name</span>
                <input
                  type="text"
                  className="theme-name-input"
                  value={theme?.name || 'Custom Theme'}
                  onChange={(e) => updateName(e.target.value)}
                />
              </label>

              <label className="theme-dash-field">
                <span>Active Preset</span>
                <Dropdown
                  value={presetId}
                  onChange={applyPreset}
                  options={[
                    ...THEME_PRESETS.map((p) => ({ value: p.id, label: p.name })),
                    { value: 'custom', label: 'Custom' },
                  ]}
                  ariaLabel="Select preset"
                />
              </label>
            </div>

            {activeTab === 'presets' && (
              <div className="theme-presets-grid">
                {THEME_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={`theme-preset-card ${presetId === preset.id ? 'active' : ''}`}
                    style={{
                      background: preset.colors.bgCard,
                      borderColor: preset.colors.borderStrong,
                    }}
                    onClick={() => applyPreset(preset.id)}
                  >
                    <div className="theme-preset-card-head">
                      <strong>{preset.name}</strong>
                      <span style={{ color: preset.colors.accent }}>● Active</span>
                    </div>
                    <div className="theme-preset-swatches">
                      {['accent', 'bg', 'bgCardHover', 'youColor', 'themColor'].map((k) => (
                        <i key={k} style={{ background: preset.colors[k] }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="theme-colors-sections">
                {COLOR_GROUPS.map((group) => (
                  <div key={group.title} className="theme-color-group">
                    <h3>{group.title}</h3>
                    <div className="theme-color-grid">
                      {group.fields.map(([key, label]) => (
                        <label key={key} className="theme-color-item">
                          <span>{label}</span>
                          <div className="theme-color-picker-wrap">
                            <input
                              type="color"
                              value={safeColors[key] || '#ffffff'}
                              onChange={(e) => updateColor(key, e.target.value)}
                            />
                            <code>{safeColors[key]}</code>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'vfx' && (
              <div className="theme-vfx-sliders">
                {EFFECT_SLIDERS.map(([key, label, min, max, step]) => (
                  <div key={key} className="theme-slider-block">
                    <div className="theme-slider-head">
                      <span>{label}</span>
                      <b>{safeEffects[key]}</b>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={safeEffects[key]}
                      onChange={(e) => updateEffect(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </main>

          <aside className="theme-dashboard-preview card">
            <h2>Live Sandbox Preview</h2>
            <p className="admin-muted">Real-time preview of your custom theme applied across site components.</p>

            <div className="sandbox-card-sample card">
              <div className="sandbox-card-head">
                <UnitIcon slug="grimreaper" name="Grim Reaper" glowColor={safeColors.accent} size={48} />
                <div>
                  <strong>Grim Reaper</strong>
                  <span style={{ color: safeColors.accent }}>Mythic · Values &amp; WIKI</span>
                </div>
              </div>
              <div className="sandbox-card-stats">
                <div><span>Value:</span> <b>{formatCompactNumber(2500000)}</b></div>
                <div><span>Gems:</span> <b>{formatCompactNumber(850000)}</b></div>
              </div>
              <div className="sandbox-verdict-sample" style={{ borderColor: safeColors.success }}>
                <span style={{ color: safeColors.success, fontWeight: 800 }}>BIG WIN</span>
                <small style={{ color: safeColors.textDim }}>Favors YOU by {formatCompactNumber(500000)} diff</small>
              </div>
              <div className="sandbox-actions">
                <button type="button" className="filled" style={{ background: safeColors.accent, color: safeColors.accentInverse }}>
                  Primary Action
                </button>
                <button type="button" style={{ borderColor: safeColors.border, color: safeColors.text }}>
                  Secondary Action
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
