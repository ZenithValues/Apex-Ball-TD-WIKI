import { useEffect, useMemo, useState } from 'react';
import { pushKvEntry, deleteKvEntry } from '../../utils/apexClient';
import { uploadUnitImage } from '../../utils/adminImage';
import { compressImage } from '../../utils/adminSafety';
import { useData } from '../../context/DataContext';
import { slugify } from '../../utils/slug';
import { ITEM_ARTIFACTS, ITEM_CURRENCIES } from '../../data/taxonomy';
import Dropdown from '../Dropdown';
import './ItemFamilyEditor.css';

/**
 * ItemFamilyEditor — the item half of the WIKI and Values editors (operator, rev 8:
 * "Delete Consumables and merge every other item/gear into the WIKI editor and
 * Value Editor").
 *
 * It started life as five standalone sidebar sections; those are gone. The same
 * component is now opened from a family switch INSIDE the WIKI editor, and the
 * Value editor edits the same rows through its own category switch, so there is
 * one place to write an item and one place to price it. Consumables were deleted
 * outright (the two keys moved to Artifacts).
 *
 * Before this, Artifacts / Gamepasses / Consumables / Currencies / Items could
 * only be touched through the one flat "Create anything" form, which lists every
 * non-unit row in one pile and gives every family the same six boxes. Crates and
 * Materials had proper editors; the rest of the item families had none.
 *
 * One component drives all five: each family declares the groups it owns in the
 * KV lane (`groups`), the built-in list it starts from (`builtIn`) and the fields
 * that actually exist in the game (`fields`). Rows are saved through the same
 * `item` lane the public pages read, so a save is live immediately.
 *
 * Artwork (operator, rev 8): "Make the 'Artwork URL' just be a image input like
 * every other damn unit" — the paste-a-URL box is GONE. These editors now use the
 * same drag-and-drop upload zone as the unit / crate / map / skin editors:
 * pick a file, it is downscaled in the browser (`compressImage`), stored in the
 * shared image store (`uploadUnitImage` → `/image/<slug>`) and the row keeps the
 * short URL. Nothing asks an editor to hunt for a URL.
 */

export const ITEM_FAMILIES = {
  Artifact: {
    title: 'Artifact',
    plural: 'Artifacts',
    icon: '🗝️',
    accent: '#ffd24d',
    // Keys ARE artifacts (operator, 2026-11-12) — legacy 'Key' rows land here.
    groups: ['Artifact', 'Key'],
    builtIn: ITEM_ARTIFACTS,
    wiki: (slug) => `/wiki/artifacts/${slug}`,
    blurb: 'Artifacts and keys — anything that opens or unlocks something else in the game.',
    fields: [
      ['name', 'Artifact name', 'text'],
      ['rarity', 'Rarity', 'text'],
      ['description', 'Description', 'textarea'],
      ['effect', 'Effect', 'textarea'],
      ['obtain', 'How to obtain', 'text'],
      ['baseValue', 'Base value', 'text'],
    ],
  },
  Gamepass: {
    title: 'Gamepass',
    plural: 'Gamepasses',
    icon: '🎟️',
    accent: '#7cd4ff',
    groups: ['Gamepass'],
    builtIn: [],
    wiki: (slug) => `/wiki/gamepasses/${slug}`,
    blurb: 'Roblox store gamepasses and exactly what each one unlocks.',
    fields: [
      ['name', 'Gamepass name', 'text'],
      ['price', 'Robux price', 'text'],
      ['description', 'Description', 'textarea'],
      ['effect', 'What it unlocks', 'textarea'],
      ['obtain', 'Where to buy it', 'text'],
    ],
  },
  Currency: {
    title: 'Currency',
    plural: 'Currencies',
    icon: '💎',
    accent: '#facc15',
    groups: ['Currency', 'Currencies'],
    builtIn: ITEM_CURRENCIES,
    wiki: (slug) => `/wiki/currencies/${slug}`,
    blurb: 'Every currency in the game — Gems and Coins only since rev 8.',
    fields: [
      ['name', 'Currency name', 'text'],
      ['description', 'Description', 'textarea'],
      ['obtain', 'How you earn it', 'text'],
    ],
  },
  Item: {
    title: 'Item',
    plural: 'Items',
    icon: '🎒',
    accent: '#c084fc',
    groups: ['Item'],
    builtIn: [],
    wiki: (slug) => `/wiki/items/Item/${slug}`,
    blurb: 'Anything that does not belong to another family. Grouped on the WIKI as "Item".',
    fields: [
      ['name', 'Item name', 'text'],
      ['rarity', 'Rarity', 'text'],
      ['description', 'Description', 'textarea'],
      ['effect', 'Effect', 'textarea'],
      ['obtain', 'How to obtain', 'text'],
      ['baseValue', 'Base value', 'text'],
    ],
  },
};

/** Families that live inside the WIKI / Values editors, in sidebar order. */
export const MERGED_FAMILIES = ['Artifact', 'Gamepass', 'Currency', 'Item'];

/** "an Artifact" / "a Gamepass" — the picker placeholders read as English. */
function article(word) {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

function blankFor(family) {
  return ITEM_FAMILIES[family].fields.reduce((acc, [key]) => ({ ...acc, [key]: '' }), {});
}

export default function ItemFamilyEditor({ family = 'Artifact', session = null }) {
  const config = ITEM_FAMILIES[family];
  const { itemRows, refresh } = useData();
  const [selected, setSelected] = useState('');
  const [form, setForm] = useState(() => blankFor(family));
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [dragging, setDragging] = useState(false);

  // KV rows for this family, merged with the built-in list (KV always wins).
  const rows = useMemo(() => {
    const saved = (itemRows || []).filter((row) => config.groups.includes(row.group));
    const taken = new Set(saved.map((row) => row.slug));
    const builtIn = (config.builtIn || [])
      .map((name) => ({ slug: slugify(name), name, group: config.groups[0], builtIn: true }))
      .filter((row) => !taken.has(row.slug));
    return [...saved, ...builtIn].sort((a, b) => String(a.name || a.slug).localeCompare(String(b.name || b.slug)));
  }, [itemRows, config]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.name || ''} ${row.slug}`.toLowerCase().includes(q));
  }, [rows, query]);
  const options = useMemo(() => rows.map((row) => ({ value: row.slug, label: row.name || row.slug })), [rows]);

  function pick(slug) {
    const row = rows.find((entry) => entry.slug === slug);
    setSelected(slug);
    setNote('');
    setImageFile(null);
    setImageUrl(row?.imageUrl || row?.image_url || '');
    setForm({
      ...blankFor(family),
      ...Object.fromEntries(config.fields.map(([key]) => [key, row?.[key] ?? ''])),
    });
  }

  function startNew() {
    setSelected('');
    setForm(blankFor(family));
    setNote('');
    setImageFile(null);
    setImageUrl('');
  }

  // Switching family in the WIKI editor must not carry the previous family's row
  // over — the slug belongs to another group, so the form resets to NEW.
  useEffect(() => {
    setSelected('');
    setForm(blankFor(family));
    setImageFile(null);
    setImageUrl('');
    setNote('');
  }, [family]);

  async function acceptImage(file) {
    if (!file?.type?.startsWith('image/')) return;
    setImageFile(await compressImage(file)); // downscale before it ever hits the DB
    setNote('');
  }

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const name = String(form.name || '').trim();
    if (!name) { setNote('Give it a name first.'); return; }
    const slug = selected || slugify(name);
    if (!slug) { setNote('That name cannot be turned into a URL slug.'); return; }
    setBusy(true);
    setNote('');
    // Same upload path as every other editor: compress → image store → short URL.
    let artwork = imageUrl || null;
    if (imageFile) {
      artwork = await uploadUnitImage(imageFile, slug, session).catch(() => artwork);
    }
    const payload = {
      slug,
      // Canonical singular group so every public section resolves it.
      group: config.groups[0],
      name,
      updated_at: new Date().toISOString(),
    };
    for (const [key, , type] of config.fields) {
      if (key === 'name') continue;
      const raw = String(form[key] ?? '').trim();
      if (key === 'baseValue' || key === 'price') {
        payload[key] = raw === '' ? null : (Number.isFinite(Number(raw)) ? Number(raw) : raw);
        continue;
      }
      payload[key] = raw || null;
    }
    payload.image_url = artwork;
    payload.imageUrl = artwork;
    const res = await pushKvEntry('item', slug, payload);
    if (res.ok) {
      setSelected(slug);
      setImageUrl(artwork || '');
      setImageFile(null);
      setNote(`✓ ${name} saved — live on ${config.wiki(slug)}.`);
      await refresh?.();
    } else {
      setNote(res.error || 'Could not save. Are you signed in?');
    }
    setBusy(false);
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm(`Delete ${form.name || selected} from the database?`)) return;
    setBusy(true);
    const res = await deleteKvEntry('item', selected);
    setNote(res.ok ? '✓ Deleted.' : (res.error || 'Could not delete.'));
    if (res.ok) { startNew(); await refresh?.(); }
    setBusy(false);
  }

  return (
    <section className="admin-content-layout itf" style={{ '--itf-accent': config.accent }}>
      <aside className="admin-unit-picker card">
        <div className="admin-section-head">
          <h2>{config.plural}</h2>
          <span className="admin-count-badge">{rows.length}</span>
        </div>

        <div className="admin-field full">
          <span>Pick {article(config.title.toLowerCase())}</span>
          <Dropdown
            value={selected}
            onChange={pick}
            searchable
            ariaLabel={`Choose ${article(config.title.toLowerCase())} to edit`}
            placeholder={`Select ${article(config.title.toLowerCase())}…`}
            options={options}
          />
        </div>

        <input
          className="admin-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Filter ${config.plural.toLowerCase()}…`}
          aria-label={`Search ${config.plural.toLowerCase()}`}
        />

        <div className="admin-unit-list" data-lenis-prevent>
          {filtered.map((row) => (
            <button
              type="button"
              key={row.slug}
              className={row.slug === selected ? 'admin-unit active' : 'admin-unit'}
              onClick={() => pick(row.slug)}
            >
              <span className="admin-unit-text">
                <strong>{row.name || row.slug}</strong>
                <small>{row.slug}{row.builtIn ? ' · built-in' : ''}</small>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="itf-empty">Nothing here yet — create the first {config.title.toLowerCase()}.</p>
          )}
        </div>

        <div className="itf-actions">
          <button type="button" onClick={startNew}>＋ New {config.title.toLowerCase()}</button>
        </div>
      </aside>

      <div className="admin-editor card">
        <p className="admin-kicker">{config.plural}</p>
        <h2>{config.icon} {config.title} editor</h2>
        <p className="itf-blurb">{config.blurb}</p>
        <p className="admin-sub-meta" style={{ color: config.accent }}>
          {selected ? `EDITING · ${selected}` : `NEW ${config.title.toUpperCase()}`}
        </p>

        <div className={`admin-upload-zone${dragging ? ' dragging' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); acceptImage(event.dataTransfer.files?.[0]); }}
        >
          {(imageFile ? URL.createObjectURL(imageFile) : imageUrl)
            ? <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt={`${config.title} artwork`} className="admin-image-preview" />
            : <strong>Drop {config.title.toLowerCase()} artwork here</strong>}
          <label className="admin-upload-button">
            📸 UPLOAD IMAGE
            <input
              type="file"
              accept="image/*"
              aria-label={`Upload ${config.title.toLowerCase()} artwork`}
              onChange={(event) => acceptImage(event.target.files?.[0])}
            />
          </label>
          <span className="admin-upload-meta">
            Automatic cloud compression &amp; optimization
          </span>
          {(imageFile || imageUrl) && (
            <button
              type="button"
              className="itf-clear-image"
              onClick={() => { setImageFile(null); setImageUrl(''); }}
            >
              Remove artwork
            </button>
          )}
        </div>

        <div className="admin-form-grid">
          {config.fields.map(([key, label, type]) => (
            <label key={key} className={`admin-field${type === 'textarea' ? ' full' : ''}`}>
              <span>{label}</span>
              {type === 'textarea' ? (
                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={form[key] || ''}
                  onChange={(event) => set(key, event.target.value)}
                />
              ) : (
                <input
                  className="admin-text-input"
                  value={form[key] || ''}
                  onChange={(event) => set(key, event.target.value)}
                />
              )}
            </label>
          ))}

          <div className="admin-field full itf-buttons">
            <button type="button" className="filled" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : `💾 Save ${config.title.toLowerCase()}`}
            </button>
            {selected && (
              <button type="button" onClick={remove} disabled={busy}>🗑 Delete</button>
            )}
            {selected && (
              <a className="itf-link" href={config.wiki(selected)} target="_blank" rel="noreferrer">
                View public page →
              </a>
            )}
          </div>

          {note && <div className="admin-message full" role="status">{note}</div>}
        </div>
      </div>
    </section>
  );
}
