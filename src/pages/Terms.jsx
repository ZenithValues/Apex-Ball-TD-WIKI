import { Link } from 'react-router-dom';
import './Legal.css';

export default function Terms() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <p className="legal-kicker">APEX WIKI &amp; VALUES</p>
        <h1>Terms of use</h1>
        <p className="legal-lead">A few ground rules for using this community-made companion.</p>
        <p className="legal-updated">Last updated October 30, 2026</p>
      </header>
      <section className="legal-section">
        <h2>An unofficial fan project</h2>
        <p>Apex WIKI &amp; Values is independently made and is not affiliated with, endorsed by, or sponsored by Cash Grab Studios or Ball Tower Defense. Game names, trademarks, characters, artwork, and other game materials belong to their respective owners. The site operator should confirm permissions and applicable fan-content rules before release.</p>
      </section>
      <section className="legal-section">
        <h2>Information and trade estimates</h2>
        <p>Unit information and trading values are community-maintained estimates, may be incomplete or out of date, and can change without notice. The trade calculator is a guide, not a guarantee of a trade, outcome, or price. Make your own decisions and check information in the game.</p>
      </section>
      <section className="legal-section">
        <h2>Use the site responsibly</h2>
        <p>Do not interfere with the service, attempt unauthorized access, submit malicious material, or impersonate others. The report form is for predefined site-issue categories only; please do not send personal or sensitive information through it. Children should involve a parent or guardian when using online services.</p>
      </section>
      <section className="legal-section">
        <h2>Community content and links</h2>
        <p>Creators retain rights to their own work. The team should only publish community material with appropriate permission and must provide a route for removal or copyright concerns. Links to outside services are provided for convenience; those services have their own rules and privacy practices.</p>
      </section>
      <section className="legal-section">
        <h2>Availability and contact</h2>
        <p>The site and its information are provided as available and may change or be unavailable. Nothing here limits rights that cannot be limited under applicable law.</p>
        <p>The operator’s public legal identity and private contact channel for privacy, parental, copyright, and other requests are not yet configured. They must be added before public launch. See <Link to="/privacy">Privacy &amp; storage</Link> for data practices and local controls.</p>
      </section>
    </main>
  );
}
