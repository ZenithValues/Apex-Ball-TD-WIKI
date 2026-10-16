import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import { VALUES_NAV } from '../../config/navigation';
import { useLiveValues } from '../../hooks/useLiveValues';
import AdSlot from '../../components/AdSlot';
import '../wiki/WikiHome.css';

export default function ValuesHome() {
  const { unitValues, loading, error } = useLiveValues();
  const baseUnitValues = unitValues.filter((u) => !u.shiny);
  const totalBase = baseUnitValues.length || 151;
  const documented = baseUnitValues.filter((u) => u.hasValue).length || totalBase;

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <PageIntro
        eyebrow="Live Trading Index"
        title="Values"
        actions={(
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/values/calculator" className="hero-btn filled">
              Open Trade Calculator →
            </Link>
            <Link to="/values/units/search" className="hero-btn">
              Search Unit Values
            </Link>
          </div>
        )}
      >
        <p>
          Base values, demand, and scarcity ratings sourced from real trades &amp; market data.
          Every value shown is derived from the live formula:{' '}
          <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
        </p>
      </PageIntro>

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}

      <div className="wiki-stats">
        <div className="wiki-stat card">
          <div className="wiki-stat-value tabular-nums">{documented} / {totalBase}</div>
          <div className="wiki-stat-label">Units With Market Data</div>
          <div className="wiki-stat-note">
            {loading ? 'Syncing live database…' : 'Updated continuously from verified community trades.'}
          </div>
        </div>
        <div className="wiki-stat card">
          <div className="wiki-stat-value">10-Point</div>
          <div className="wiki-stat-label">Demand &amp; Scarcity Scale</div>
          <div className="wiki-stat-note">Real-time liquidity and supply multipliers per unit.</div>
        </div>
        <div className="wiki-stat card">
          <div className="wiki-stat-value">W / F / L</div>
          <div className="wiki-stat-label">Instant Trade Evaluator</div>
          <div className="wiki-stat-note">Compare multi-unit offers with shareable trade cards.</div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <UnitExplorer section="values" />
      </div>

      <AdSlot slotId="2911497117" ready={!loading} />
    </PageShell>
  );
}
