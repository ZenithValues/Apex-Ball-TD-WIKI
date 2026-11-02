import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import PageIntro from '../components/PageIntro';
import { TERM_TIPS, StatIcon } from '../components/StatMeta';
import { WIKI_NAV } from '../config/navigation';
import './Glossary.css';

const GROUPS = [
  { title: 'Trading & value', terms: ['tradeValue', 'value', 'gems', 'coins', 'demand', 'scarcity', 'status', 'budget'] },
  { title: 'Unit stats', terms: ['damage', 'dps', 'cooldown', 'range', 'placement', 'costPerDps', 'upgradeCost'] },
  { title: 'Rarity & variants', terms: ['rarity', 'shiny'] },
];

export default function Glossary() {
  return (
    <PageShell sidebarTitle="GLOSSARY" navTree={WIKI_NAV}>
      <PageIntro
        eyebrow="REFERENCE"
        title="Stat glossary"
        description="Every term used on unit cards, value pages and the trade calculator — in plain language. You can also tap any underlined stat label on the site for an instant definition."
      />
      <div className="glossary-body">
        {GROUPS.map((group) => (
          <section className="glossary-group" key={group.title}>
            <h2>{group.title}</h2>
            <div className="glossary-grid">
              {group.terms.filter((term) => TERM_TIPS[term]).map((term) => (
                <article className="glossary-card" key={term}>
                  <h3><StatIcon name={term} size={15} /> {term === 'costPerDps' ? 'Cost per DPS' : term === 'dps' ? 'DPS' : term === 'tradeValue' ? 'Trade value' : term.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</h3>
                  <p>{TERM_TIPS[term]}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
        <div className="glossary-cta">
          <Link to="/values/afford">💎 What can I afford?</Link>
          <Link to="/values/calculator">🧮 Trade calculator</Link>
          <Link to="/wiki/units/search">🔍 Browse units</Link>
        </div>
      </div>
    </PageShell>
  );
}
