import { useParams, Link, Navigate } from 'react-router-dom';
import { decodeRouteParam } from '../../utils/routeParams';
import PageShell from '../../components/PageShell';
import { WIKI_NAV } from '../../config/navigation';
import { getSkinBySlug } from '../../data/skins';
import { getRarityPalette, getRarityGlow } from '../../data/taxonomy';

export default function SkinDetail({ shiny = false }) {
  const params = useParams();
  const category = decodeRouteParam(params.category);
  const slug = decodeRouteParam(params.slug);
  const skin = getSkinBySlug(slug, shiny);
  const base = shiny ? '/wiki/shiny-skins' : '/wiki/skins';

  if (!skin) return <Navigate to={`${base}/${category || 'Normie'}`} replace />;

  const rarityName = skin.rarity || (shiny ? `Shiny ${skin.category}` : skin.category);
  const glow = getRarityGlow(rarityName);
  const palette = getRarityPalette(rarityName);

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <p className="crumb">
        <Link to={base}>{shiny ? 'Shiny Skins' : 'Skins'}</Link> / <Link to={`${base}/${category}`}>{category}</Link> / {skin.name}
      </p>

      <div className="unit-header-card card" style={{ borderColor: glow, boxShadow: `0 0 20px ${glow}22`, marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>{shiny ? `Shiny ${skin.name}` : skin.name}</h1>
            <span
              className="rarity-tag"
              style={{
                color: glow,
                borderColor: glow,
                boxShadow: `0 0 10px ${glow}44`,
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'inline-block',
                marginTop: '6px',
              }}
            >
              {rarityName}
            </span>
          </div>
        </div>
      </div>

      {!skin.documented ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No data yet for this skin. Send me its description and how to obtain it.
        </div>
      ) : (
        <div className="unit-body card" style={{ marginTop: 20, padding: 20 }}>
          {skin.description && <p className="unit-desc" style={{ fontSize: '1rem', color: 'var(--text-dim)', marginBottom: 16 }}>{skin.description}</p>}
          {skin.obtain && (
            <table className="kv-table">
              <tbody>
                <tr><th>Rarity Tier</th><td style={{ color: glow, fontWeight: 700 }}>{rarityName}</td></tr>
                <tr><th>Method</th><td>{skin.obtain.method}</td></tr>
                <tr><th>Source</th><td>{skin.obtain.source}</td></tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </PageShell>
  );
}
