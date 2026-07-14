import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import { VALUES_NAV } from '../../data/navTree';
import { useLiveValues } from '../../hooks/useLiveValues';

export default function ValuesHome() {
  const { unitValues, loading, error } = useLiveValues();
  const baseUnitValues = unitValues.filter((u) => !u.shiny);
  const documented = baseUnitValues.filter((u) => u.hasValue).length;

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <PageIntro
        eyebrow="APEX Market"
        title="Values"
        actions={(
          <Link to="/values/calculator" className="hero-btn filled" style={{ display: 'inline-block' }}>
            Open Trade Calculator →
          </Link>
        )}
      >
        <p>
          Base values, demand, and scarcity ratings sourced from real trades &amp; market data.
          Every value shown is derived from the live formula:
          <br />
          <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
        </p>
      </PageIntro>

      {error && <p className="pending-flag">Live values could not load; showing bundled fallback values.</p>}
      <div className="wiki-stats">
        <div className="wiki-stat card">
          <div className="wiki-stat-value">{documented} / {baseUnitValues.length}</div>
          <div className="wiki-stat-label">Units With Market Data</div>
          {loading && <div className="wiki-stat-note">Syncing live database…</div>}
        </div>
      </div>
    </PageShell>
  );
}
