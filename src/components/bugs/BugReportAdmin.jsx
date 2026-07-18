import { useState, useEffect } from 'react';
import { supabase, isMissingTableError } from '../../utils/supabase';

export default function BugReportAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  async function loadReports() {
    setLoading(true);
    try {
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === 'open') {
        query = query.eq('resolved', false);
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true);
      }

      const { data, error } = await query;

      if (error) {
        if (isMissingTableError(error)) {
          setMessage('Bug reports table not created. Run the schema SQL first.');
        } else {
          setMessage(`Error loading: ${error.message}`);
        }
        setReports([]);
      } else {
        setReports(data || []);
        setMessage('');
      }
    } catch {
      setMessage('Failed to load bug reports.');
      setReports([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [filter]);

  useEffect(() => {
    const channel = supabase
      .channel('apex_bug_reports_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, () => {
        loadReports();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function markResolved(report) {
    const { error } = await supabase
      .from('bug_reports')
      .update({ resolved: true })
      .eq('id', report.id);

    if (error) {
      setMessage(`Failed to update: ${error.message}`);
    } else {
      setMessage(`Marked "${report.title}" as resolved.`);
      loadReports();
    }
  }

  async function deleteReport(report) {
    if (!window.confirm(`Delete bug report "${report.title}"?`)) return;

    const { error } = await supabase
      .from('bug_reports')
      .delete()
      .eq('id', report.id);

    if (error) {
      setMessage(`Failed to delete: ${error.message}`);
    } else {
      setMessage(`Deleted "${report.title}".`);
      loadReports();
    }
  }

  return (
    <section className="card admin-bug-reports" style={{ padding: '24px', borderRadius: 'var(--radius-md, 12px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Bug Reports</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={filter === 'all' ? 'filled' : ''}
            onClick={() => setFilter('all')}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)', fontWeight: 700, cursor: 'pointer' }}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'open' ? 'filled' : ''}
            onClick={() => setFilter('open')}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)', fontWeight: 700, cursor: 'pointer' }}
          >
            Open
          </button>
          <button
            type="button"
            className={filter === 'resolved' ? 'filled' : ''}
            onClick={() => setFilter('resolved')}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm, 6px)', fontWeight: 700, cursor: 'pointer' }}
          >
            Resolved
          </button>
        </div>
      </div>

      {message && (
        <div className="pending-flag" style={{ marginBottom: 16, padding: 12, borderRadius: 6, background: 'rgba(255, 170, 0, 0.15)', border: '1px solid #ffaa00', color: '#ffaa00' }}>
          {message}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-faint)' }}>Loading reports…</p>
      ) : reports.length === 0 ? (
        <p style={{ color: 'var(--text-faint)', fontStyle: 'italic', padding: 12 }}>
          No bug reports found.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reports.map((report) => (
            <div
              key={report.id}
              className="card"
              style={{
                padding: 18,
                borderRadius: 'var(--radius-sm, 8px)',
                opacity: report.resolved ? 0.7 : 1,
                borderLeft: report.resolved ? '4px solid var(--text-faint)' : '4px solid #4d9dff',
                background: 'var(--bg-elevated, #0f0f16)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    {report.resolved && <span style={{ color: 'var(--text-faint)', marginRight: 6 }}>[Resolved]</span>}
                    {report.title}
                  </h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: 8 }}>
                    {report.category && <span>Category: {report.category}</span>}
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '0 0 10px', color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.4 }}>
                    {report.description}
                  </p>
                  {report.page_url && (
                    <a
                      href={report.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'underline' }}
                    >
                      {report.page_url}
                    </a>
                  )}
                  {report.contact && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                      Contact: {report.contact}
                    </p>
                  )}
                  {report.browser && (
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                      Browser/Device: {report.browser}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!report.resolved && (
                    <button type="button" className="filled" onClick={() => markResolved(report)} style={{ padding: '8px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                      Mark Resolved
                    </button>
                  )}
                  <button type="button" className="admin-btn-danger" onClick={() => deleteReport(report)} style={{ padding: '8px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="admin-btn-subtle" onClick={loadReports} style={{ marginTop: 20, padding: '10px 18px', cursor: 'pointer' }}>
        ⚡ Refresh Reports
      </button>
    </section>
  );
}
