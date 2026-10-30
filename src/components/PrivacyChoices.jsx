import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getStatsChoice, saveStatsChoice, PRIVACY_OPEN_EVENT } from '../utils/privacyChoices';
import './PrivacyChoices.css';

// This small local-storage choice is intentionally NOT presented as a Google
// certified CMP. Advertising remains off until a real CMP and child-safety
// controls have been configured and reviewed by the operator.
export default function PrivacyChoices() {
  const [open, setOpen] = useState(() => getStatsChoice() === null);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(PRIVACY_OPEN_EVENT, show);
    return () => window.removeEventListener(PRIVACY_OPEN_EVENT, show);
  }, []);

  if (!open || typeof document === 'undefined') return null;
  function choose(allow) {
    saveStatsChoice(allow);
    setOpen(false);
  }

  return createPortal(
    <section className="privacy-choice" aria-labelledby="privacy-choice-title" aria-describedby="privacy-choice-description">
      <div className="privacy-choice-copy">
        <h2 id="privacy-choice-title">Your privacy choices</h2>
        <p id="privacy-choice-description">
          Settings and game progress are stored on this device. May we also save optional visit, search-term, and feature-use statistics here for local features and achievements? Ads are off in this build.
        </p>
        <Link to="/privacy" onClick={() => setOpen(false)}>Read our privacy &amp; storage notice</Link>
      </div>
      <div className="privacy-choice-actions">
        <button type="button" onClick={() => choose(false)}>Don’t save stats</button>
        <button type="button" onClick={() => choose(true)}>Save local stats</button>
      </div>
    </section>,
    document.body
  );
}
