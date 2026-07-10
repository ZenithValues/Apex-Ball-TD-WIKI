import { Link } from 'react-router-dom';
import { getRarityPalette, getRarityGlow, isShinyRarity } from '../data/taxonomy';
import UnitIcon from './UnitIcon';
import './EntityGrid.css';

/**
 * Generic card grid for lists of units/items/maps/traits/skins.
 * `entities` items need at minimum: { slug, name, documented }.
 * `linkBase` e.g. "/wiki/units/Normie" -> links become `${linkBase}/${slug}`
 * `renderMeta(entity)` optional — return JSX for extra info (e.g. type badge, value).
 * `rarityAccent` optional — when true, entities are expected to have a
 * `.rarity` field and get a colored top accent stripe + glowing rarity label
 * + icon, matching the Values unit cards.
 */
export default function EntityGrid({ entities, linkBase, renderMeta, emptyLabel, rarityAccent }) {
  if (!entities || entities.length === 0) {
    return <div className="empty-state">{emptyLabel || 'No entries yet.'}</div>;
  }

  return (
    <div className="entity-grid">
      {entities.map((e) => {
        const palette = rarityAccent && e.rarity ? getRarityPalette(e.rarity) : null;
        const glow = rarityAccent && e.rarity ? getRarityGlow(e.rarity) : null;
        return (
          <Link
            key={e.slug}
            to={`${linkBase}/${e.slug}`}
            className={rarityAccent ? 'entity-card entity-card-accented card' : 'entity-card card'}
            style={palette ? { '--rarity-border': `linear-gradient(90deg, ${palette.join(', ')})` } : undefined}
          >
            {rarityAccent && <div className="entity-card-stripe" />}
            <div className="entity-card-inner">
              <div className="entity-card-top">
                {rarityAccent && (
                  <UnitIcon slug={e.slug} name={e.name} glowColor={glow} shiny={isShinyRarity(e.rarity)} size={40} />
                )}
                <div className="entity-card-title-block">
                  <span className="entity-name">{e.name}</span>
                  {rarityAccent && e.rarity && (
                    <div className="entity-card-rarity" style={{ color: glow, textShadow: `0 0 10px ${glow}99` }}>
                      {e.rarity}
                    </div>
                  )}
                </div>
                {!e.documented && <span className="badge dim entity-pending">Pending</span>}
              </div>
              {renderMeta && <div className="entity-card-meta">{renderMeta(e)}</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
