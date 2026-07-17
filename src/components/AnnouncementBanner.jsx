import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
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

  async function fetchAnnouncements() {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
      setAnnouncements(local.filter((a) => a.active));
      return;
    }

    const { data, error } = await supabase
      .from('site_announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    } else {
      const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
      setAnnouncements(local.filter((a) => a.active));
    }
  }

  useEffect(() => {
    fetchAnnouncements();

    const onEvent = () => fetchAnnouncements();
    window.addEventListener('apex-announcements-updated', onEvent);
    window.addEventListener('storage', onEvent);

    let channel = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('realtime_site_announcements')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_announcements' }, () => {
          fetchAnnouncements();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('apex-announcements-updated', onEvent);
      window.removeEventListener('storage', onEvent);
      if (channel) supabase.removeChannel(channel);
    };
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
            <span className="announcement-badge">📢 ANNOUNCEMENT</span>
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
