import { useMemo, useState } from 'react';
import { pushKvEntry, deleteKvEntry } from '../../utils/apexClient';
import { useData } from '../../context/DataContext';
import { slugify } from '../../utils/slug';
import { ALL_TRAITS } from '../../data/traits';
import { REFORGES } from '../../data/reforges';
import Dropdown from '../Dropdown';
import './CreateItemForm.css';

const BASE_LISTS = {
  Trait: () => ALL_TRAITS,
  Reforge: () => REFORGES,
};

const FIELDS = {
  Trait: [
    ['name', 'Trait name', 'text'],
    ['description', 'Description', 'textarea'],
    ['effect', 'Effect', 'text'],
    ['obtain', 'How to obtain', 'text'],
  ],
  Reforge: [
    ['name', 'Reforge name', 'text'],
    ['description', 'Description', 'textarea'],
    ['statBonuses', 'Stat bonuses (one per line, e.g. Damage: +10%)', 'textarea'],
    ['obtain', 'How to obtain', 'text'],
  ],
};

function blankFor(group) {
  return FIELDS[group].reduce((acc, [key]) => ({ ...acc, [key]: '' }), {});
}

/**
 * Shared list + form editor for the small WIKI collections that had no admin
 * UI before: Traits and Reforges. Rows are saved through the same KV
 * itemOverrides lane the public pages read, so a save is live immediately.
 */
export default function CollectionEditor({ group, title = 'Entry', icon = '🧩' }) {
  const { itemRows, refresh } = useData();
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => blankFor(group));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  // Built-in rows (read-only until edited) merged with the KV rows.
  const rows = useMemo(() => {
    const builtIn = (BASE_LISTS[group]?.() || []).map((row) => ({ ...row, builtIn: true }));
    const overrides = (itemRows || []).filter((row) => row.group === group);
    const overrideSlugs = new Set(overrides.map((row) => row.slug));
    return [...overrides, ...builtIn.filter((row) => !overrideSlugs.has(row.slug))];
  }, [group, itemRows]);

  const options = useMemo(
    () => rows.map((row) => ({ value: row.slug, label: row.name || row.slug })),
    [rows]
  );

  function pick(slug) {
    const row = rows.find((entry) => entry.slug === slug);
    setSelected(slug);
    setNote('');
    setForm({
      ...blankFor(group),
      ...Object.fromEntries(
        FIELDS[group].map(([key]) => [key, row?.[key] ?? (key === 'statBonuses' && Array.isArray(row?.statBonuses) ? row.statBonuses.join('\n') : '') ?? ''])
      ),
    });
  }

  function startNew() {
    setSelected(null);
    setForm(blankFor(group));
    setNote('');
  }

  async function save() {
    const name = String(form.name || '').trim();
    if (!name) { setNote('Give it a name first.'); return; }
    const slug = selected || slugify(name);
    setBusy(true);
    setNote('');
    const payload = {
      slug,
      group,
      name,
      description: form.description?.trim() || null,
      effect: form.effect?.trim() || null,
      obtain: form.obtain?.trim() || null,
      statBonuses: form.statBonuses
        ? form.statBonuses.split('\n').map((line) => line.trim()).filter(Boolean)
        : null,
      updated_at: new Date().toISOString(),
    };
    const res = await pushKvEntry('item', slug, payload);
    if (res.ok) {
      setNote(`✓ ${name} saved — live on /wiki/${group === 'Trait' ? 'traits' : 'reforges'}.`);
      setSelected(slug);
      await refresh?.();
    } else {
      setNote(res.error || 'Could not save. Are you signed in?');
    }
    setBusy(false);
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm(`Delete ${form.name || selected}?`)) return;
    setBusy(true);
    const res = await deleteKvEntry('item', selected);
    setNote(res.ok ? '✓ Deleted.' : (res.error || 'Could not delete.'));
    if (res.ok) { startNew(); await refresh?.(); }
    setBusy(false);
  }

  return (
    <div className="admin-form-grid">
      <div className="admin-field full">
        <span>{icon} {title} picker</span>
        <Dropdown
          value={selected || ''}
          onChange={pick}
          searchable
          ariaLabel={`Choose a ${title.toLowerCase()} to edit`}
          placeholder={`Select a ${title.toLowerCase()}…`}
          options={options}
        />
      </div>
      <div className="admin-field full">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={startNew}>＋ New {title.toLowerCase()}</button>
          {selected && <button type="button" onClick={remove} disabled={busy}>🗑 Delete</button>}
        </div>
      </div>
      {FIELDS[group].map(([key, label, type]) => (
        <label key={key} className={`admin-field${type === 'textarea' ? ' full' : ''}`}>
          <span>{label}</span>
          {type === 'textarea' ? (
            <textarea
              className="admin-textarea"
              rows={2}
              value={form[key] || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
            />
          ) : (
            <input
              className="admin-text-input"
              value={form[key] || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
            />
          )}
        </label>
      ))}
      <div className="admin-field full">
        <button type="button" className="filled" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : `💾 Save ${title.toLowerCase()}`}
        </button>
      </div>
      {note && <div className="admin-message full" role="status">{note}</div>}
    </div>
  );
}
