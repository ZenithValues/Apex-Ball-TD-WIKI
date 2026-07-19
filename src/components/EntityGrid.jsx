import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRarityPalette, getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { getBaseStats } from '../utils/unitStats';
import { useScrollToHighlight } from '../utils/useScrollToHighlight';
import UnitIcon from './UnitIcon';
import './EntityGrid.css';

const gridVariants = {
  animate: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 18, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const MotionLink = motion(Link);

/**
 * Generic card grid for lists of units/items/maps/traits/skins.
 * `entities` items need at minimum: { slug, name, documented }.
 * `linkBase` e.g. "/wiki/units/Normie" -> links become `${linkBase}/${slug}`
 * `renderMeta(entity)` optional — return JSX for extra info (e.g. type badge, value).
 * `rarityAccent` optional — when true, entities are expected to have a
 * `.rarity` field and render as a bigger unit card: icon, name, glowing
 * rarity label, a quick stat readout (cooldown/range/damage/placement),
 * then meta badges — matching the Values cards.
 */
export default function EntityGrid({ entities, linkBase, renderMeta, emptyLabel, rarityAccent }) {
  const highlighted = useScrollToHighlight();

  if (!entities || entities.length === 0) {
    return <div className="empty-state">{emptyLabel || 'No entries yet.'}</div>;
  }

  if (rarityAccent) {
    return (
      <motion.div className="unit-card-grid" variants={gridVariants} initial="initial" animate="animate">
        {entities.map((e) => {
          const palette = getRarityPalette(e.rarity);
          const glow = getRarityGlow(e.rarity);
          const stats = getBaseStats(e);
          const isHighlighted = highlighted === e.slug;
          return (
            <MotionLink
              key={e.slug}
              to={`${linkBase}/${e.slug}`}
              data-slug={e.slug}
              className={isHighlighted ? 'unit-card unit-card-highlight' : 'unit-card'}
              style={{
                '--rarity-border': `linear-gradient(90deg, ${palette.join(', ')})`,
                '--rarity-glow': glow,
              }}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
              whileTap={{ scale: 0.975, transition: { duration: 0.12 } }}
            >
              <div className="unit-card-stripe" />
              <div className="unit-card-header">
                <div className="unit-card-icon-wrap">
                  <UnitIcon slug={e.slug} name={e.name} glowColor={glow} shiny={isShinyRarity(e.rarity)} size={74} imageUrl={e.imageUrl} />
                </div>
                <div className="unit-card-header-text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <div className="unit-card-name">{e.name}</div>
                    {Boolean(e.isPrvw || e.prvw || e.livePrvwOverride) && (
                      <span className="badge prvw-badge" style={{ background: '#b679ff', color: '#fff', fontSize: '0.62rem', padding: '2px 8px', fontWeight: 800, borderRadius: '999px', boxShadow: '0 0 10px rgba(182,121,255,0.6)' }}>PRVW</span>
                    )}
                  </div>
                  <div className="unit-card-rarity" style={{ color: glow }}>
                    {e.rarity}
                  </div>
                </div>
              </div>

              <div className="unit-card-body">
                {stats && (
                  <div className="unit-card-stats">
                    {stats.damage != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Damage</span>
                        <span className="unit-card-stat-value">{stats.damage}</span>
                      </div>
                    )}
                    {stats.cooldown != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Cooldown</span>
                        <span className="unit-card-stat-value">{stats.cooldown}s</span>
                      </div>
                    )}
                    {stats.range != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Range</span>
                        <span className="unit-card-stat-value">{stats.range}</span>
                      </div>
                    )}
                    {stats.placementLimit != null && (
                      <div className="unit-card-stat">
                        <span className="unit-card-stat-label">Placement</span>
                        <span className="unit-card-stat-value">{stats.placementLimit}</span>
                      </div>
                    )}
                  </div>
                )}

                {!e.documented && <span className="badge dim" style={{ marginTop: 8 }}>Pending</span>}
                {renderMeta && <div className="unit-card-meta" style={{ marginTop: 8 }}>{renderMeta(e)}</div>}
              </div>
            </MotionLink>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div className="entity-grid" variants={gridVariants} initial="initial" animate="animate">
      {entities.map((e) => (
        <MotionLink
          key={e.slug}
          to={`${linkBase}/${e.slug}`}
          className="entity-card card"
          variants={cardVariants}
          whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          <div className="entity-card-inner">
            <div className="entity-card-top">
              <div className="entity-card-title-block">
                <span className="entity-name">{e.name}</span>
              </div>
              {!e.documented && <span className="badge dim entity-pending">Pending</span>}
            </div>
            {renderMeta && <div className="entity-card-meta">{renderMeta(e)}</div>}
          </div>
        </MotionLink>
      ))}
    </motion.div>
  );
}