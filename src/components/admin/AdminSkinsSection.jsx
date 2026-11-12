import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { SKINS_BY_CATEGORY } from '../../data/skins';
import { uploadUnitImage } from '../../utils/adminImage';
import { compressImage } from '../../utils/adminSafety';
import { slugify } from '../../utils/slug';
import Dropdown from '../Dropdown';
import SkinEditor from './SkinEditor';

/**
 * Skins editor — pick any skin (built-in or editor-created), edit its card,
 * category, description and artwork. Shiny skins were removed (2026-11-12).
 */
export default function AdminSkinsSection({ session, onSave, saving = false }) {
  const { createdSkins } = useData();
  const [slug, setSlug] = useState('');
  const [note, setNote] = useState('');

  const skins = useMemo(() => {
    const builtIn = Object.values(SKINS_BY_CATEGORY).flat().map((skin) => ({ ...skin, builtIn: true }));
    const overrideSlugs = new Set((createdSkins || []).map((row) => row.slug));
    return [...(createdSkins || []), ...builtIn.filter((skin) => !overrideSlugs.has(skin.slug))];
  }, [createdSkins]);

  const selected = skins.find((skin) => skin.slug === slug) || null;

  async function save(form, imageFile) {
    setNote('');
    const name = String(form.name || '').trim();
    if (!name) { setNote('Give the skin a name first.'); return; }
    const targetSlug = selected?.slug || slugify(name);
    let imageUrl = form.imageUrl || selected?.imageUrl || null;
    if (imageFile) {
      imageUrl = await uploadUnitImage(await compressImage(imageFile), targetSlug, session).catch(() => imageUrl);
    }
    await onSave?.({
      slug: targetSlug,
      name,
      kind: 'skin',
      category: form.category || 'Normie',
      rarity: form.rarity || form.category || 'Normie',
      crate: form.crate || null,
      description: form.description || '',
      image_url: imageUrl,
    });
    setSlug(targetSlug);
    setNote(`✓ ${name} saved — live on /wiki/skins.`);
  }

  return (
    <section className="admin-editor card">
      <p className="admin-kicker">Skins</p>
      <h2>🎨 Skin editor</h2>
      <div className="admin-field full" style={{ marginBottom: 14 }}>
        <span>Choose a skin</span>
        <Dropdown
          value={slug}
          onChange={(value) => { setSlug(value); setNote(''); }}
          searchable
          ariaLabel="Choose a skin to edit"
          placeholder="Select a skin…"
          options={skins.map((skin) => ({ value: skin.slug, label: `${skin.name} · ${skin.category}` }))}
        />
      </div>
      {note && <div className="admin-message" role="status">{note}</div>}
      <SkinEditor
        key={selected?.slug || 'new'}
        skin={selected || { name: '', category: 'Normie', description: '', imageUrl: '' }}
        onSave={save}
        onReset={() => { setSlug(''); setNote(''); }}
        saving={saving}
      />
    </section>
  );
}
