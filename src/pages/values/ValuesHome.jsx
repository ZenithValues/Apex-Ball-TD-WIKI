import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import UnitExplorer from '../../components/UnitExplorer';
import { VALUES_NAV } from '../../config/navigation';
import '../wiki/WikiHome.css';

export default function ValuesHome() {
  return (
    <PageShell sidebarTitle="VALUES" navTree={VALUES_NAV}>
      <PageIntro
        eyebrow="Live Trading Index"
        title="Values"
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/values/calculator" className="hero-btn primary">
              Open Trade Calculator →
            </Link>
            <Link to="/values/units/search" className="hero-btn">
              Search Unit Values
            </Link>
          </div>
        }
      >
        <p>
          Base values, demand, and scarcity ratings sourced from real trades &amp; market data.
          Every value shown is derived from the live formula:{' '}
          <code>TradeValue = BaseValue × DemandMultiplier × ScarcityMultiplier</code>
        </p>
      </PageIntro>

      <UnitExplorer mode="values" />
    </PageShell>
  );
}
