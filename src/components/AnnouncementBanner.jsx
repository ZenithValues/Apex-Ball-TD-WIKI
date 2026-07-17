import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import './AnnouncementBanner.css';

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apex-dismissed-announcements') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function loadAnnouncements() {
      const { data, error } = await supabase
        .from('site_announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      } else {
        const localRaw = localStorage.getItem('apex-local-announcements');
        if (localRaw) {
          try {
            setAnnouncements(JSON.parse(localRaw));
          } catch {
            // ignore
          }
        }
      }
    }
    loadAnnouncements();
  }, []);

  function dismiss(id) {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('apex-dismissed-announcements', JSON.stringify(next));
  }

  const visible = announcements.filter((a) => !dismissedIds.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="site-announcement-container">
      {visible.map((ann) => (
        <div key={ann.id} className="site-announcement-bar">
          <div className="announcement-content">
            <span className="announcement-badge">ANNOUNCEMENT</span>
            <span className="announcement-message">{ann.message}</span>
          </div>
          <button
            type="button"
            className="announcement-close"
            onClick={() => dismiss(ann.id)}
            aria-label="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
