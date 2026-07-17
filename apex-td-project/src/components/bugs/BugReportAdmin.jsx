import { useState, useEffect } from 'react';
import { supabase, isMissingTableError } from '../../utils/supabase';

export default function BugReportAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, open, resolved

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Live updates: new bug reports — and status changes — stream into the
  // admin view without needing a refresh.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <section className="card admin-bug-reports">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Bug Reports</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={filter === 'all' ? 'filled' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'open' ? 'filled' : ''}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button
            type="button"
            className={filter === 'resolved' ? 'filled' : ''}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      {message && (
        <div className="pending-flag" style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-faint)' }}>Loading reports…</p>
      ) : reports.length === 0 ? (
        <p style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>
          No bug reports found.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((report) => (
            <div
              key={report.id}
              className="card"
              style={{
                padding: 16,
                opacity: report.resolved ? 0.7 : 1,
                borderLeft: report.resolved ? '3px solid var(--text-faint)' : '3px solid #4d9dff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h4 style={{ margin: '0 0 6px' }}>
                    {report.resolved && <span style={{ color: 'var(--text-faint)', marginRight: 6 }}>[Resolved]</span>}
                    {report.title}
                  </h4>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: 8 }}>
                    {report.category && <span>Category: {report.category}</span>}
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '0 0 8px', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                    {report.description}
                  </p>
                  {report.page_url && (
                    <a
                      href={report.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}
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
                    <button type="button" className="filled" onClick={() => markResolved(report)}>
                      Mark Resolved
                    </button>
                  )}
                  <button type="button" onClick={() => deleteReport(report)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={loadReports} style={{ marginTop: 16 }}>
        Refresh
      </button>
    </section>
  );
}
