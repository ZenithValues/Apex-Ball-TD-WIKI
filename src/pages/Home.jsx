import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_UNITS } from '../data/units';
import { useData } from '../context/DataContext';
import { isShinyRarity } from '../data/taxonomy';
import { formatCompactNumber } from '../utils/formatNumber';
import { evaluateTrade } from '../utils/calculator';
import { useWikiImageOverrides } from '../hooks/useWikiImageOverrides';
import UnitIcon from '../components/UnitIcon';
import { CUTOUT_MAP } from '../components/ThemeCutout';
import HeroShowcase from '../components/HeroShowcase';
import CoolIcon from '../components/CoolIcon';
import AdSlot from '../components/AdSlot';
// Optional website illustration icons; never used as unit image overrides.
import wikiDecoration from '../assets/units/provided/baller.png';
import valuesDecoration from '../assets/units/provided/brainball.png';
import gamesDecoration from '../assets/units/provided/showmanball.png';
import './Home.css';

const BASE_UNIT_COUNT = ALL_UNITS.filter((unit) => !isShinyRarity(unit.rarity)).length;
const DESTINATIONS = [
  { to: '/wiki', label: 'Wiki', text: 'Stats, upgrades and how to obtain each unit.', icon: wikiDecoration },
  { to: '/values', label: 'Values', text: 'Browse estimates, demand and scarcity.', icon: valuesDecoration },
  { to: '/minigames', label: 'Minigames', text: 'Put your Ball TD knowledge to the test.', icon: gamesDecoration },
];
const COMMUNITY = [
  { label: 'Credits', description: 'The people behind the wiki', to: '/credits' },
  { label: 'Play Ball TD', description: 'Official Roblox experience', href: 'https://www.roblox.com/games/18343561950/Ball-Tower-Defense' },
  { label: 'Official Discord', description: 'Ball Tower Defense community', href: 'https://discord.gg/kWhpVncQwr' },
  { label: 'Cash Grab Studios', description: 'Official Roblox community', href: 'https://www.roblox.com/communities/32380537/Cash-Grab-Studios#!/about' },
  { label: 'YouTube', description: 'Cash Grab Studios channel', href: 'https://www.youtube.com/@CashGrabStudios' },
];

export default function Home() {
  const { unitValues } = useData();
  const [sampleTradeIdx, setSampleTradeIdx] = useState(0);
  const tradeTabRefs = useRef([]);
  const unitCount = unitValues?.filter((u) => u.kind !== 'item' && !u.shiny && !isShinyRarity(u.rarity)).length || BASE_UNIT_COUNT;
  const variantCount = unitValues?.filter((u) => u.kind !== 'item').length || ALL_UNITS.length;

  const featuredValueUnits = useMemo(() => (unitValues || [])
    .filter((u) => u.kind !== 'item' && u.hasValue && !u.shiny && !isShinyRarity(u.rarity) && Number.isFinite(u.tradeValue) && u.tradeValue > 0)
    .sort((a, b) => b.tradeValue - a.tradeValue).slice(0, 4), [unitValues]);
  const { imageMap } = useWikiImageOverrides(featuredValueUnits.map((unit) => unit.slug));

  // Use real current values and the calculator's own verdict, not fixed claims.
  const sampleTrades = useMemo(() => {
    const priced = (unitValues || [])
      .filter((u) => u.kind !== 'item' && u.hasValue && !u.shiny && !isShinyRarity(u.rarity) && Number.isFinite(u.tradeValue) && u.tradeValue > 0)
      .sort((a, b) => b.tradeValue - a.tradeValue);
    if (!priced.length) return [];
    const high = priced[0];
    const low = priced.find((u) => u.tradeValue < high.tradeValue * 0.95) || high;
    return [[high, high], [low, high], [high, low]].map(([yours, theirs], index) => {
      const result = evaluateTrade([{ tradeValue: yours.tradeValue }], [{ tradeValue: theirs.tradeValue }]);
      const sign = result.diff > 0 ? '+' : '';
      return { label: `Example ${index + 1}`, yours, theirs, verdict: result.verdict, difference: `${sign}${formatCompactNumber(result.diff)}` };
    });
  }, [unitValues]);
  const sample = sampleTrades[sampleTradeIdx] || sampleTrades[0];
  const onTradeTabKeyDown = (event, index) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % sampleTrades.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + sampleTrades.length) % sampleTrades.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = sampleTrades.length - 1;
    else return;
    event.preventDefault();
    setSampleTradeIdx(next);
    tradeTabRefs.current[next]?.focus();
  };

  return (
    <div className="home-layout-wrapper">
      <div className="home-side-ad left"><AdSlot slotId="2911497117" /></div>
      <main className="home">
        <HeroShowcase unitCount={unitCount} variantCount={variantCount} />

        <section id="inside-apex" className="landing-intro landing-container" aria-labelledby="landing-intro-title">
          <div className="landing-section-label"><span>Inside Apex</span><span>A better view of the game</span></div>
          <div className="landing-intro-main" data-scroll-reveal>
            <h2 id="landing-intro-title">Built for<br />every move.</h2>
            <p>Whether you’re building a team or planning a trade, the details make the difference. Explore the wiki, check the market, and find your next move.</p>
          </div>
          <div className="landing-destinations">
            {DESTINATIONS.map((item) => <Link key={item.to} to={item.to} className="landing-destination">
              <img src={item.icon} alt="" aria-hidden="true" loading="lazy" />
              <div><strong>{item.label}</strong><span>{item.text}</span></div>
              <CoolIcon name="arrow-up-right" size={20} />
            </Link>)}
          </div>
        </section>

        <section className="landing-market landing-container" aria-labelledby="landing-market-title">
          <div className="landing-market-copy" data-scroll-reveal>
            <span className="landing-overline">The market</span>
            <h2 id="landing-market-title">Value,<br />in context.</h2>
            <p>Find the numbers behind a trade. Explore current estimates, demand and scarcity for {unitCount} units.</p>
            <Link to="/values" className="landing-text-link">Explore values <CoolIcon name="arrow-up-right" size={18} /></Link>
          </div>
          <div className="landing-market-list" data-scroll-reveal>
            <div className="landing-list-head"><strong>Highest-valued units</strong><Link to="/values/units/search">View all <CoolIcon name="arrow-up-right" size={15} /></Link></div>
            {featuredValueUnits.length ? featuredValueUnits.map((unit, index) => (
              <Link key={unit.slug} className="landing-market-row" to={`/values/units/${encodeURIComponent(unit.rarity)}/${unit.slug}`}>
                <span className="landing-row-number">{String(index + 1).padStart(2, '0')}</span>
                <UnitIcon slug={unit.slug} name={unit.name} shiny={isShinyRarity(unit.rarity)} size={46} imageUrl={imageMap[unit.slug] || unit.imageUrl} />
                <span className="landing-unit-name"><strong>{unit.name}</strong><small>{unit.rarity} · {unit.demand || 'Normal'} demand</small></span>
                <span className="showcase-unit-price">{formatCompactNumber(unit.tradeValue)}</span>
                <CoolIcon name="arrow-up-right" size={16} />
              </Link>
            )) : <p className="landing-empty">Value estimates are not available right now.</p>}
          </div>
        </section>

        <section className="landing-wiki" aria-labelledby="landing-wiki-title">
          <div className="landing-wiki-art" aria-hidden="true">
            <span>WIKI</span>
            <img src={CUTOUT_MAP.poseidon.src} alt="" loading="lazy" />
          </div>
          <div className="landing-wiki-copy" data-scroll-reveal>
            <span className="landing-overline">The unit index</span>
            <h2 id="landing-wiki-title">Every unit.<br />Every detail.</h2>
            <p>Discover stats, upgrade paths and obtain methods, then compare units side by side.</p>
            <div className="landing-link-stack">
              <Link to="/wiki/units/search" className="landing-text-link">Browse units <CoolIcon name="arrow-up-right" size={18} /></Link>
              <Link to="/wiki/compare" className="landing-text-link">Compare units <CoolIcon name="arrow-up-right" size={18} /></Link>
            </div>
          </div>
        </section>

        <section className="landing-trade landing-container" aria-labelledby="landing-trade-title">
          <div className="landing-trade-copy" data-scroll-reveal>
            <span className="landing-overline">Trade calculator</span>
            <h2 id="landing-trade-title">Make the<br />next move.</h2>
            <p>Compare both sides of a trade using the same values and calculations as the full calculator.</p>
            <Link to="/values/calculator" className="landing-text-link">Open calculator <CoolIcon name="arrow-up-right" size={18} /></Link>
          </div>
          <div className="landing-trade-demo" data-scroll-reveal>
            <div className="landing-demo-top"><strong>See how it works</strong><span>Sample trade</span></div>
            {sample ? <>
              <div className="landing-demo-tabs" role="tablist" aria-label="Sample trade scenarios">
                {sampleTrades.map((trade, idx) => <button
                  key={trade.label}
                  ref={(element) => { tradeTabRefs.current[idx] = element; }}
                  id={`landing-trade-tab-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={sampleTradeIdx === idx}
                  aria-controls="landing-trade-panel"
                  tabIndex={sampleTradeIdx === idx ? 0 : -1}
                  onClick={() => setSampleTradeIdx(idx)}
                  onKeyDown={(event) => onTradeTabKeyDown(event, idx)}
                >{trade.label}</button>)}
              </div>
              <div id="landing-trade-panel" role="tabpanel" aria-labelledby={`landing-trade-tab-${sampleTradeIdx}`} tabIndex={0}>
                <div className="landing-trade-sides">
                  <div><span>Your side</span><strong>{sample.yours.name}</strong><small>{formatCompactNumber(sample.yours.tradeValue)} value</small></div>
                  <span className="landing-trade-swap" aria-hidden="true">⇄</span>
                  <div><span>Their side</span><strong>{sample.theirs.name}</strong><small>{formatCompactNumber(sample.theirs.tradeValue)} value</small></div>
                </div>
                <div className="landing-trade-result"><span>Result</span><strong>{sample.verdict}</strong><span>{sample.difference} value</span></div>
              </div>
            </> : <p className="landing-empty">Sample values are unavailable. Open the calculator to explore.</p>}
          </div>
        </section>

        <section className="landing-community landing-container" aria-labelledby="landing-community-title">
          <div><span className="landing-overline">Beyond the wiki</span><h2 id="landing-community-title">Stay in<br />the game.</h2></div>
          <div className="landing-community-links">
            {COMMUNITY.map((item) => {
              const body = <><span><strong>{item.label}</strong><small>{item.description}</small></span><CoolIcon name="arrow-up-right" size={18} /></>;
              return item.to ? <Link key={item.label} to={item.to}>{body}</Link> : <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{body}</a>;
            })}
          </div>
        </section>
      </main>
      <div className="home-side-ad right"><AdSlot slotId="2911497117" /></div>
    </div>
  );
}
