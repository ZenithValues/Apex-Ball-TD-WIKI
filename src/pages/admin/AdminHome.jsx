import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BASE_UNITS } from '../../data/units';
import { DEMAND_LABELS, SCARCITY_LABELS } from '../../data/taxonomy';
import { GENERATED_VALUE_OVERRIDES } from '../../data/generated/units.generated';
import { VALUE_OVERRIDES } from '../../data/values';
import { computeTradeValue } from '../../utils/calculator';
import {
  loadLocalValueChangeLog,
  loadLocalValueOverrides,
  saveLocalValueChangeLog,
  saveLocalValueOverrides,
} from '../../utils/localValueOverrides';
import './AdminHome.css';

const TRENDS = ['stable', 'rising', 'falling'];

function getInitialData(slug, localOverrides) {
  return localOverrides[slug] || VALUE_OVERRIDES[slug] || GENERATED_VALUE_OVERRIDES[slug] || {
    baseValue: 1,
    gems: 1,
    coins: 1,
    demand: 'Normal',
    scarcity: 'Standard',
    trend: 'stable',
  };
}

function normalizeForm(data) {
  return {
    baseValue: Number(data.baseValue) || 0,
    gems: Number(data.gems) || 0,
    coins: Number(data.coins) || 0,
    demand: data.demand || 'Normal',
    scarcity: data.scarcity || 'Standard',
    trend: data.trend || 'stable',
    notes: data.notes || '',
  };
}

export default function AdminHome() {
  const units = useMemo(() => BASE_UNITS.filter((unit) => unit.documented && !unit.unavailableData), []);
  const [query, setQuery] = useState('');
  const [localOverrides, setLocalOverrides] = useState(() => loadLocalValueOverrides());
  const [changeLog, setChangeLog] = useState(() => loadLocalValueChangeLog());
  const [selectedSlug, setSelectedSlug] = useState(units[0]?.slug || '');
  const selectedUnit = units.find((unit) => unit.slug === selectedSlug) || units[0];
  const selectedData = getInitialData(selectedUnit?.slug, localOverrides);
  const [form, setForm] = useState(() => normalizeForm(selectedData));
  const [message, setMessage] = useState('');

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return units.slice(0, 40);
    return units.filter((unit) => unit.name.toLowerCase().includes(q) || unit.slug.includes(q)).slice(0, 80);
  }, [query, units]);

  const tradeValue = computeTradeValue(form.baseValue, form.demand, form.scarcity);
  const isLocalOverride = !!localOverrides[selectedUnit?.slug];

  function selectUnit(unit) {
    setSelectedSlug(unit.slug);
    setForm(normalizeForm(getInitialData(unit.slug, localOverrides)));
    setMessage('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function saveValue() {
    const slug = selectedUnit.slug;
    const nextData = normalizeForm(form);
    const previous = getInitialData(slug, localOverrides);
    const nextOverrides = { ...localOverrides, [slug]: nextData };
    const logEntry = {
      id: `${Date.now()}-${slug}`,
      slug,
      name: selectedUnit.name,
      previous,
      next: nextData,
      changedAt: new Date().toISOString(),
      editor: 'Open Admin Preview',
    };
    const nextLog = [logEntry, ...changeLog].slice(0, 30);

    setLocalOverrides(nextOverrides);
    setChangeLog(nextLog);
    saveLocalValueOverrides(nextOverrides);
    saveLocalValueChangeLog(nextLog);
    setMessage('Saved locally. Reload the site to apply this override across Values/Calculator pages.');
  }

  function resetUnit() {
    const nextOverrides = { ...localOverrides };
    delete nextOverrides[selectedUnit.slug];
    setLocalOverrides(nextOverrides);
    saveLocalValueOverrides(nextOverrides);
    setForm(normalizeForm(getInitialData(selectedUnit.slug, nextOverrides)));
    setMessage('Local override removed. Reload the site to restore generated values everywhere.');
  }

  function reloadSite() {
    window.location.reload();
  }

  async function copyOverrides() {
    await navigator.clipboard?.writeText(JSON.stringify(localOverrides, null, 2));
    setMessage('Copied local overrides JSON.');
  }

  function downloadOverrides() {
    const blob = new Blob([JSON.stringify(localOverrides, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'apex-value-overrides.local.json';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="admin-page">
      <motion.section
        className="admin-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="admin-kicker">Open Preview</p>
        <h1>APEX Admin</h1>
        <p>
          Temporary no-login value editor. Anyone can open this page right now, and changes are saved only in this browser.
        </p>
      </motion.section>

      <div className="admin-warning">
        ⚠️ No permissions yet. This is a visual/local admin preview until a real backend/auth system is added.
      </div>

      <section className="admin-layout">
        <aside className="admin-unit-picker card">
          <div className="admin-section-head">
            <h2>Units</h2>
            <span>{units.length}</span>
          </div>
          <input
            className="admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search units…"
          />
          <div className="admin-unit-list" data-lenis-prevent>
            {filteredUnits.map((unit) => (
              <button
                key={unit.slug}
                type="button"
                className={unit.slug === selectedUnit?.slug ? 'admin-unit active' : 'admin-unit'}
                onClick={() => selectUnit(unit)}
              >
                <span>{unit.name}</span>
                <small>{unit.rarity}</small>
                {localOverrides[unit.slug] && <b>LOCAL</b>}
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-editor card">
          <div className="admin-editor-head">
            <div>
              <p className="admin-kicker">Editing</p>
              <h2>{selectedUnit?.name}</h2>
              <span>{selectedUnit?.rarity} · {selectedUnit?.type}</span>
            </div>
            {isLocalOverride && <div className="admin-local-pill">Local Override</div>}
          </div>

          <div className="admin-preview-value">
            <span>Computed Trade Value</span>
            <strong>{tradeValue.toLocaleString()}</strong>
          </div>

          <div className="admin-form-grid">
            <AdminInput label="Base Value" value={form.baseValue} onChange={(value) => updateField('baseValue', value)} type="number" />
            <AdminInput label="Gems" value={form.gems} onChange={(value) => updateField('gems', value)} type="number" />
            <AdminInput label="Coins" value={form.coins} onChange={(value) => updateField('coins', value)} type="number" />
            <AdminSelect label="Demand" value={form.demand} onChange={(value) => updateField('demand', value)} options={DEMAND_LABELS} />
            <AdminSelect label="Scarcity" value={form.scarcity} onChange={(value) => updateField('scarcity', value)} options={SCARCITY_LABELS} />
            <AdminSelect label="Trend" value={form.trend} onChange={(value) => updateField('trend', value)} options={TRENDS} />
            <label className="admin-field full">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Reason / evidence / notes…" />
            </label>
          </div>

          <div className="admin-actions">
            <button type="button" className="filled" onClick={saveValue}>Save Local Value</button>
            <button type="button" onClick={resetUnit}>Reset Unit</button>
            <button type="button" onClick={reloadSite}>Reload Site</button>
            <button type="button" onClick={copyOverrides}>Copy JSON</button>
            <button type="button" onClick={downloadOverrides}>Download JSON</button>
          </div>

          {message && <div className="admin-message">{message}</div>}
        </section>
      </section>

      <section className="admin-log card">
        <div className="admin-section-head">
          <h2>Local Change Log</h2>
          <span>{changeLog.length}</span>
        </div>
        {changeLog.length === 0 ? (
          <p className="admin-muted">No local changes yet.</p>
        ) : (
          <div className="admin-log-list">
            {changeLog.map((entry) => (
              <div key={entry.id} className="admin-log-entry">
                <strong>{entry.name}</strong>
                <span>{new Date(entry.changedAt).toLocaleString()}</span>
                <p>
                  Value {entry.previous?.baseValue ?? '—'} → {entry.next?.baseValue ?? '—'} · Demand {entry.previous?.demand ?? '—'} → {entry.next?.demand ?? '—'} · Scarcity {entry.previous?.scarcity ?? '—'} → {entry.next?.scarcity ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function AdminInput({ label, value, onChange, type = 'text' }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AdminSelect({ label, value, onChange, options }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
