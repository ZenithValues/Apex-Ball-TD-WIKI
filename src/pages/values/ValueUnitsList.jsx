import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import UnitValueCard from '../../components/UnitValueCard';
import { VALUES_NAV } from '../../data/navTree';
import { UNIT_VALUES } from '../../data/values';
import { UNIT_RARITIES } from '../../data/taxonomy';
import { useHighlightTarget } from '../../utils/useHighlightTarget';
import './ValueUnitsList.css';

const gridVariants = {
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

export default function ValueUnitsList() {
  const { rarity } = useParams();
  const highlighted = useHighlightTarget();
  if (!UNIT_RARITIES.includes(rarity)) return <Navigate to="/values/units/Normie" replace />;

  const units = UNIT_VALUES.filter((u) => u.rarity === rarity);
  const linkBase = `/values/units/${encodeURIComponent(rarity)}`;

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <h1>{rarity} — Values</h1>
      <p className="crumb">Values / Units / {rarity}</p>

      {units.length === 0 ? (
        <div className="empty-state">No {rarity} units yet.</div>
      ) : (
        <motion.div className="uv-grid" variants={gridVariants} initial="initial" animate="animate">
          {units.map((u) => (
            <UnitValueCard key={u.slug} unit={u} linkBase={linkBase} highlighted={highlighted === u.slug} />
          ))}
        </motion.div>
      )}
    </PageShell>
  );
}
