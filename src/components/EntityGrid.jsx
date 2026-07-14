import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRarityPalette, getRarityGlow, isShinyRarity } from '../data/taxonomy';
import { getBaseStats } from '../utils/unitStats';
import { useHighlightTarget } from '../utils/useHighlightTarget';
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
  const highlighted = useHighlightTarget();

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
              style={{ '--rarity-border': `linear-gradient(180deg, ${palette.join(', ')})` }}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
              whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
            >
              <div className="unit-card-stripe" />
              <div className="unit-card-icon-wrap">
                <UnitIcon slug={e.slug} name={e.name} glowColor={glow} shiny={isShinyRarity(e.rarity)} size={96} imageUrl={e.imageUrl} />
              </div>
              <div className="unit-card-name">{e.name}</div>
              <div className="unit-card-rarity" style={{ color: glow, textShadow: `0 0 16px ${glow}, 0 0 4px ${glow}` }}>
                {e.rarity}
              </div>

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

              {!e.documented && <span className="badge dim">Pending</span>}
              {renderMeta && <div className="unit-card-meta">{renderMeta(e)}</div>}
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