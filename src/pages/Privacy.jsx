import { Link } from 'react-router-dom';
import { useState } from 'react';
import { clearApexLocalData, openPrivacyChoices } from '../utils/privacyChoices';
import './Legal.css';

const External = ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>;

export default function Privacy() {
  const [cleared, setCleared] = useState(false);
  function clearLocal() {
    if (!window.confirm('Clear this site’s saved settings, game progress, local statistics, and admin session on this device? This cannot be undone.')) return;
    clearApexLocalData();
    setCleared(true);
  }

  return (
    <main className="legal-page">
      <header className="legal-header">
        <p className="legal-kicker">APEX WIKI &amp; VALUES</p>
        <h1>Privacy &amp; storage</h1>
        <p className="legal-lead">What this site stores, the services it connects to, and the choices available to you.</p>
        <p className="legal-updated">Last updated October 30, 2026</p>
      </header>
      <nav className="legal-index" aria-label="On this page">
        <a href="#operator">Operator</a><a href="#storage">Storage</a><a href="#services">Services</a><a href="#ads">Advertising</a><a href="#children">Children</a><a href="#rights">Your rights</a>
      </nav>

      <section id="operator" className="legal-section">
        <h2>Who runs this site</h2>
        <p>Apex WIKI &amp; Values is an unofficial, fan-made companion to Ball Tower Defense. It is not affiliated with or endorsed by Cash Grab Studios or the game’s creators.</p>
        <div className="legal-notice"><strong>Operator contact pending.</strong> The site operator has not yet provided a public legal identity or privacy-contact address. These details and a working rights-request process must be supplied before public launch.</div>
      </section>

      <section id="storage" className="legal-section">
        <h2>Cookies and storage on your device</h2>
        <p>The site uses browser storage and a service-worker cache for things such as security/session handling, your selected appearance and settings, offline assets, and game or achievement progress. Clearing browser data can remove this information. Some features may not remember your progress if storage is blocked.</p>
        <p>Optional visit, search-term, and feature-use statistics (including recent selected units) are kept on this device and are <strong>off by default</strong>. They are used for local features such as visit-based achievements. You can change this choice at any time. Rejecting removes local usage and recent-search history and visit-history fields where accessible; it does not delete your other game progress.</p>
        <p>This local choice does not authorize advertising or replace a certified advertising consent platform. The site does not intentionally load AdSense or advertising cookies in this build.</p>
        <div className="legal-actions">
          <button type="button" onClick={openPrivacyChoices}>Change privacy choices</button>
          <button type="button" onClick={clearLocal}>Clear this app’s local data</button>
        </div>
        {cleared && <p className="legal-feedback" role="status">APEX-prefixed local and session storage was cleared where available. Refresh to apply. This does not erase server records or all browser caches.</p>}
        <p>For other cookies, service-worker caches, or storage, use your browser’s site-data controls. This action affects this browser/device only; it does not remove records held by service providers or our database.</p>
      </section>

      <section id="services" className="legal-section">
        <h2>Information sent to services</h2>
        <p>When your browser loads the site or its data, hosting and network providers can receive information such as your IP address, request time, browser information, and requested resource. The site uses GitHub Pages for hosting and a Cloudflare Worker/KV service for the shared wiki and values database. These providers have their own security and retention practices.</p>
        <p>The report form in this build uses fixed choices rather than free text or a contact field. Those selections are sent to the shared Cloudflare service. Older reports and team-managed content may still exist in the database; the operator must secure and review them before release. Do not submit personal details through public channels.</p>
        <p>Some game features request the current time from WorldTimeAPI or TimeAPI.io. Unit or fan-art images may be hosted by other services and can send those services normal browser request information. Links to Roblox, Discord, and YouTube take you to independent sites with their own privacy practices.</p>
        <p>Data is kept on your device until you clear it or your browser removes it. Server/provider retention periods, locations, and deletion procedures are not yet confirmed by the operator and must be documented before launch. Data may be processed in countries other than yours, subject to the providers’ arrangements.</p>
      </section>

      <section id="ads" className="legal-section">
        <h2>Advertising and third parties</h2>
        <p><strong>Advertising is disabled in this build.</strong> No AdSense tag should load on staging or production until the operator completes the child-privacy assessment, configures the necessary consent tools and account settings, and updates this notice.</p>
        <p>If permitted advertising is enabled in a future release, Google and its partners may use cookies, IP addresses, or similar identifiers to deliver and measure ads. Subject to the settings and choices that apply, they may use visits to this and other sites for personalized advertising. Personalized ads must not be targeted to children where prohibited.</p>
        <ul>
          <li><External href="https://business.safety.google/privacy/">How Google uses data from partner sites</External></li>
          <li><External href="https://myadcenter.google.com/">Google My Ad Center</External> and <External href="https://www.aboutads.info/choices/">aboutads.info choices</External> provide advertising controls.</li>
          <li>The operator must identify applicable ad partners and publish their privacy links and choices before any ads are enabled.</li>
        </ul>
      </section>

      <section id="children" className="legal-section">
        <h2>Children and families</h2>
        <p>This site is intended for a mixed-age audience that includes children. Ads are off, and the public report form is designed not to ask for names, contact details, or free-text messages. A parent or guardian should help a child with privacy choices and external links.</p>
        <p>No system for verifying parental consent has been configured. The operator must assess children’s privacy rules and any required parental notice or consent before collecting children’s personal information, publishing submissions, or activating ads.</p>
      </section>

      <section id="rights" className="legal-section">
        <h2>Your rights and contact</h2>
        <p>Depending on where you live, you may have rights to access, correct, delete, object to, or obtain information about personal data, and to withdraw consent where applicable. You may also have the right to contact a data-protection authority. These rights are subject to applicable law and verification.</p>
        <p>A private contact channel for privacy, parental, and removal requests is <strong>not configured yet</strong>. The operator must publish one and establish a response process before public launch. Do not post sensitive information in a public bug report or community channel.</p>
        <p>Read the <Link to="/terms">Terms of use</Link> for information about fan content, estimates, and external links.</p>
      </section>
    </main>
  );
}
