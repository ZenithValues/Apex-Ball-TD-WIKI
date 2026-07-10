import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { VALUES_NAV } from '../../data/navTree';
import { UNIT_VALUES } from '../../data/values';

export default function ValuesHome() {
  const documented = UNIT_VALUES.filter((u) => u.hasValue).length;

  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <h1>Values</h1>
      <p className="wiki-intro">
        Base values, demand, and scarcity ratings sourced from real trades &amp; market data.
        Every value shown is derived from the live formula:
        <br />
        <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
      </p>
      <div className="wiki-stats">
        <div className="wiki-stat card">
          <div className="wiki-stat-value">{documented} / {UNIT_VALUES.length}</div>
          <div className="wiki-stat-label">Units With Market Data</div>
        </div>
      </div>
      <p style={{ marginTop: 28 }}>
        <Link to="/values/calculator" className="hero-btn filled" style={{ display: 'inline-block' }}>
          Open Trade Calculator →
        </Link>
      </p>
    </PageShell>
  );
}
