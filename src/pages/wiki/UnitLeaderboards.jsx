import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import UnitIcon from '../../components/UnitIcon';
import UnitTags from '../../components/UnitTags';
import { WIKI_NAV } from '../../config/navigation';
import { ALL_UNITS } from '../../data/units';
import { getRarityGlow, isShinyRarity } from '../../data/taxonomy';
import { formatCompactNumber, getRankingValue, getUnitBestCostEfficiency, getUnitMaxDps } from '../../utils/leaderboardStats';
import { isMissingTableError, supabase } from '../../utils/supabase';
import './UnitLeaderboards.css';

const BOARDS = [
  { id: 'dps', label: 'DPS', title: 'Highest DPS', description: 'Units ranked by their best parsed DPS value.' },
  { id: 'efficiency', label: 'Cost Efficiency', title: 'Best Cost Efficiency', description: 'Lower Cost/DPS is better.' },
  { id: 'late', label: 'Late Game', title: 'Best Late-Game Ranking', description: 'Manual staff ranking from the admin panel.' },
  { id: 'early', label: 'Early Game', title: 'Best Early-Game Ranking', description: 'Manual staff ranking from the admin panel.' },
];

export default function UnitLeaderboards() {
  const [active, setActive] = useState('dps');
  const [rankingRows, setRankingRows] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadRankings() {
      const { data, error } = await supabase
        .from('unit_wiki_overrides')
        .select('slug, early_game_rank, late_game_rank')
        .not('slug', 'is', null);
      if (cancelled) return;
      if (error) {
        setRankingRows([]);
        if (!isMissingTableError(error)) setMessage(`Ranking data could not load: ${error.message}`);
      } else {
        setRankingRows(data || []);
      }
    }
    loadRankings();
    return () => { cancelled = true; };
  }, []);

  const board = BOARDS.find((entry) => entry.id === active) || BOARDS[0];

  const rows = useMemo(() => {
    const documentedUnits = ALL_UNITS.filter((unit) => unit.documented && !unit.unavailableData);
    if (active === 'dps') {
      return documentedUnits
        .map((unit) => ({ unit, metric: getUnitMaxDps(unit) }))
        .filter((row) => row.metric.value != null)
        .sort((a, b) => b.metric.value - a.metric.value)
        .slice(0, 50);
    }
    if (active === 'efficiency') {
      return documentedUnits
        .map((unit) => ({ unit, metric: getUnitBestCostEfficiency(unit) }))
        .filter((row) => row.metric.value != null)
        .sort((a, b) => a.metric.value - b.metric.value)
        .slice(0, 50);
    }

    const key = active === 'late' ? 'late_game_rank' : 'early_game_rank';
    return documentedUnits
      .map((unit) => ({ unit, rank: getRankingValue(unit, rankingRows, key) }))
      .filter((row) => row.rank != null)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 50)
      .map((row) => ({ unit: row.unit, metric: { value: row.rank, label: `Staff Rank #${row.rank}` } }));
  }, [active, rankingRows]);

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <h1>Unit Leaderboards</h1>
      <p className="crumb">WIKI / Unit Leaderboards</p>

      <div className="leaderboard-tabs">
        {BOARDS.map((entry) => (
          <button key={entry.id} type="button" className={active === entry.id ? 'active' : ''} onClick={() => setActive(entry.id)}>
            {entry.label}
          </button>
        ))}
      </div>

      <section className="leaderboard-head card">
        <h2>{board.title}</h2>
        <p>{board.description}</p>
        {message && <p className="pending-flag">{message}</p>}
        {(active === 'early' || active === 'late') && rows.length === 0 && (
          <p className="pending-flag">No staff rankings yet. Add Early/Late Game rank in /admin WIKI Editor.</p>
        )}
      </section>

      <div className="leaderboard-list">
        {rows.map((row, index) => (
          <LeaderboardRow key={row.unit.slug} index={index} active={active} {...row} />
        ))}
      </div>
    </PageShell>
  );
}

function LeaderboardRow({ unit, metric, index, active }) {
  const glow = getRarityGlow(unit.rarity);
  const value = active === 'early' || active === 'late' ? `#${metric.value}` : formatCompactNumber(metric.value);
  return (
    <Link to={`/wiki/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`} className="leaderboard-row card">
      <div className="leaderboard-rank">#{index + 1}</div>
      <UnitIcon slug={unit.slug} name={unit.name} glowColor={glow} shiny={isShinyRarity(unit.rarity)} size={56} />
      <div className="leaderboard-main">
        <strong>{unit.name}</strong>
        <span style={{ color: glow }}>{unit.rarity}</span>
        <UnitTags unit={unit} limit={4} />
      </div>
      <div className="leaderboard-metric">
        <b>{value}</b>
        <small>{metric.label || '—'}</small>
      </div>
    </Link>
  );
}
