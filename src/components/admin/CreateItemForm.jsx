import { useMemo, useState } from 'react';
import { pushKvEntry, deleteKvEntry } from '../../utils/apexClient';
import { useData } from '../../context/DataContext';
import './CreateItemForm.css';

export const ITEM_GROUPS = [
  'Gamepass', 'Artifact', 'Key', 'Crate',
  'Currency', 'Skin', 'Material', 'Item',
];
const RARITIES = ['', 'Normie', 'Odd', 'Rare', 'Awesome', 'Legendary', 'Mythical', 'Transcendent', 'Ultra'];
const blank = { name: '', group: 'Gamepass', rarity: '', description: '', effect: '', obtain: '', imageUrl: '', baseValue: '' };

function slugify(name) {
  return String(name || '').toLowerCase().trim().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * ONE creator/editor for EVERY non-unit entity: Gamepasses, Artifacts/Keys,
 * Crates, Currencies, Skins, Materials and generic Items.
 * Rows live in the `itemOverrides` bundle section and are shown publicly on
 * /wiki/items/<group>/<slug>.
 */
export default function CreateItemForm() {
  const { itemRows, refresh } = useData();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const grouped = useMemo(() => {
    const map = {};
    for (const row of itemRows || []) (map[row.group] ||= []).push(row);
    return map;
  }, [itemRows]);

  function set(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  function edit(row) {
    setEditing(row.slug);
    setForm({
      name: row.name || '', group: row.group || 'Item', rarity: row.rarity || '',
      description: row.description || '', effect: row.effect || '', obtain: row.obtain || '',
      imageUrl: row.imageUrl || row.image_url || '', baseValue: row.baseValue ?? '',
    });
    setNote('');
  }

  function reset() { setEditing(null); setForm(blank); setNote(''); }

  async function save() {
    const name = form.name.trim();
    if (!name) { setNote('Give the item a name.'); return; }
    const slug = editing || slugify(name);
    if (!slug) { setNote('That name cannot be turned into a URL slug.'); return; }
    setBusy(true); setNote('');
    const payload = {
      name, slug, group: form.group, rarity: form.rarity || null,
      description: form.description || null, effect: form.effect || null,
      obtain: form.obtain || null, image_url: form.imageUrl || null,
      baseValue: form.baseValue === '' ? null : Number(form.baseValue),
      updated_at: new Date().toISOString(),
    };
    const res = await pushKvEntry('item', slug, payload);
    setNote(res.ok ? `✓ ${name} saved to ${form.group}.` : (res.error || 'Could not save. Are you signed in?'));
    if (res.ok) { reset(); await refresh?.(); }
    setBusy(false);
  }

  async function remove(slug) {
    if (!window.confirm(`Delete ${slug} from the database?`)) return;
    setBusy(true);
    const res = await deleteKvEntry('item', slug);
    setNote(res.ok ? '✓ Deleted.' : (res.error || 'Could not delete.'));
    if (res.ok) { if (editing === slug) reset(); await refresh?.(); }
    setBusy(false);
  }

  const fields = [
    ['name', 'Name'], ['rarity', 'Rarity'], ['description', 'Description'],
    ['effect', 'Effect'], ['obtain', 'Obtain / drop source'], ['imageUrl', 'Image URL'],
    ['baseValue', 'Value (optional)'],
  ];

  return (
    <div className="cif-wrap">
      <div className="cif-form">
        {fields.map(([key, label]) => (
          <label key={key} className="cif-field">
            <span>{label}</span>
            {key === 'rarity' ? (
              <select value={form[key]} onChange={(e) => set(key, e.target.value)}>
                {RARITIES.map((r) => <option key={r} value={r}>{r || '— none —'}</option>)}
              </select>
            ) : key === 'description' || key === 'effect' ? (
              <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={2} />
            ) : (
              <input value={form[key]} onChange={(e) => set(key, e.target.value)} />
            )}
          </label>
        ))}
        <label className="cif-field">
          <span>Type</span>
          <select value={form.group} onChange={(e) => set('group', e.target.value)}>
            {ITEM_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <div className="cif-actions">
          <button type="button" className="filled" onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? '💾 Save changes' : '➕ Create item'}</button>
          {editing && <button type="button" onClick={reset}>Cancel edit</button>}
        </div>
        {note && <p className="cif-note">{note}</p>}
      </div>

      <div className="cif-list">
        <h3>Existing items <small>{(itemRows || []).length}</small></h3>
        {Object.entries(grouped).length === 0 && <p className="cif-empty">Nothing here yet — create the first one.</p>}
        {Object.entries(grouped).map(([group, rows]) => (
          <div key={group} className="cif-group">
            <strong>{group}</strong>
            {rows.map((row) => (
              <div key={row.slug} className={`cif-row ${editing === row.slug ? 'editing' : ''}`}>
                <span>{row.name}</span>
                <span className="cif-row-actions">
                  <button type="button" onClick={() => edit(row)}>Edit</button>
                  <button type="button" className="danger" onClick={() => remove(row.slug)}>✕</button>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
