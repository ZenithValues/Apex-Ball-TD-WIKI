import { useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import UnitValueCard from '../../components/UnitValueCard';
import { VALUES_NAV } from '../../config/navigation';
import { UNIT_RARITIES, getRarityGlow } from '../../data/taxonomy';
import { useScrollToHighlight } from '../../utils/useScrollToHighlight';
import { useLiveValues } from '../../hooks/useLiveValues';
import { decodeRouteParam, encodeRouteParam } from '../../utils/routeParams';
import '../../components/EntityGrid.css';
import './ValueUnitsList.css';

const gridVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};

export default function ValueUnitsList() {
  const params = useParams();
  const rarity = decodeRouteParam(params.rarity);
  const highlighted = useScrollToHighlight();
  const { unitValues, error } = useLiveValues();
  const isValidRarity = UNIT_RARITIES.includes(rarity);

  const units = useMemo(() => (isValidRarity ? unitValues.filter((u) => u.rarity === rarity) : []), [unitValues, rarity, isValidRarity]);

  if (!isValidRarity) return <Navigate to="/values/units/Normie" replace />;

  const encodedRarity = encodeRouteParam(rarity);
  const linkBase = `/values/units/${encodedRarity}`;
  const rarityGlow = getRarityGlow(rarity);

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <div className="rarity-list-header" style={{ '--rarity-accent': rarityGlow }}>
        <div className="rarity-list-title-group">
          <p className="crumb">Values / Units / {rarity}</p>
          <div className="rarity-list-title-row">
            <span className="rarity-list-dot" aria-hidden="true" />
            <h1>{rarity} — Values</h1>
            <span className="rarity-list-count">{units.length} Units</span>
          </div>
        </div>
        <div className="rarity-list-actions">
          <Link to="/values/units/search" className="rarity-list-btn">
            Search Values
          </Link>
          <Link to={`/wiki/units/${encodedRarity}`} className="rarity-list-btn primary">
            {rarity} WIKI →
          </Link>
        </div>
      </div>

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}

      {units.length === 0 ? (
        <div className="empty-state">No {rarity} units yet.</div>
      ) : (
        <motion.div key={`values-${rarity}`} className="uv-grid" variants={gridVariants} initial="initial" animate="animate">
          {units.map((u) => (
            <UnitValueCard key={u.slug} unit={u} linkBase={linkBase} highlighted={highlighted === u.slug} />
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}
