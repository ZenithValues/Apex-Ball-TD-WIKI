import { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import './AnnouncementBanner.css';

const DEFAULT_ANNOUNCEMENT = {
  id: 'apex-default-announcement',
  message: '📢 Welcome to APEX Values & WIKI — Live Real-Time Trades & Database Active!',
  active: true,
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([DEFAULT_ANNOUNCEMENT]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apex-dismissed-announcements') || '[]');
    } catch {
      return [];
    }
  });
  const bannerRef = useRef(null);

  async function fetchAnnouncements() {
    if (!isSupabaseConfigured) {
      const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
      const activeLocal = local.filter((a) => a.active);
      setAnnouncements(activeLocal.length > 0 ? activeLocal : [DEFAULT_ANNOUNCEMENT]);
      return;
    }

    const { data, error } = await supabase
      .from('site_announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setAnnouncements(data);
    } else {
      const local = JSON.parse(localStorage.getItem('apex-local-announcements') || '[]');
      const activeLocal = local.filter((a) => a.active);
      setAnnouncements(activeLocal.length > 0 ? activeLocal : [DEFAULT_ANNOUNCEMENT]);
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
        .channel('realtime_site_announcements_nuclear')
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

  const visible = announcements.filter((a) => !dismissedIds.includes(a.id));

  useEffect(() => {
    if (bannerRef.current && visible.length > 0) {
      const height = bannerRef.current.offsetHeight || 44;
      document.documentElement.style.setProperty('--announcement-height', `${height}px`);
    } else {
      document.documentElement.style.setProperty('--announcement-height', '0px');
    }
  }, [visible]);

  function dismiss(id) {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('apex-dismissed-announcements', JSON.stringify(next));
  }

  if (visible.length === 0) return null;

  return (
    <div ref={bannerRef} className="site-announcement-container">
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
