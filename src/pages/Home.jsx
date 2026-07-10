import { Link } from 'react-router-dom';
import apexLogo from '../assets/apex-logo.png';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <img src={apexLogo} alt="apeX" className="hero-logo" />

        <h1 className="hero-title">
          The <span className="hero-title-accent">DEFINITIVE</span> WIKI &amp; Values Website for
          Ball Tower Defense
        </h1>

        <div className="hero-divider">
          <span className="hero-divider-line" />
          <span className="hero-divider-x">×</span>
          <span className="hero-divider-line" />
        </div>

        <p className="hero-sub">
          151 Units, All Values &amp; Trade Calculator, Stat sheets, Rankings and MUCH more!
        </p>
      </section>

      <section className="home-grid">
        <Link to="/wiki" className="home-card">
          <h3>WIKI</h3>
          <p className="home-card-desc">151 Units, Items, Maps, and Skins</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Full stat sheets, obtain methods, and upgrades</p>
        </Link>

        <Link to="/values" className="home-card">
          <h3>Values</h3>
          <p className="home-card-desc">151 Units, Consumables, Currencies, and Gamepasses</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Values sourced from real trades &amp; market.</p>
        </Link>

        <Link to="/values/calculator" className="home-card">
          <h3>Trade Calculator</h3>
          <p className="home-card-desc">Quick calculator</p>
          <div className="home-card-divider">
            <span className="home-card-divider-line" />
            <span className="home-card-divider-x">×</span>
            <span className="home-card-divider-line" />
          </div>
          <p className="home-card-note">Values collected from our Database, sourced from real trades &amp; market.</p>
        </Link>
      </section>
    </div>
  );
}
