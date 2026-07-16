import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/PageShell';
import PageIntro from '../../components/PageIntro';
import { WIKI_NAV } from '../../config/navigation';
import { supabase, isMissingTableError } from '../../utils/supabase';

const BUG_CATEGORIES = [
  'Wrong Data',
  'Broken Link',
  'UI/Display Issue',
  'Missing Information',
  'Performance',
  'Crash/Error',
  'Other',
];

export default function BugReport() {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    page_url: '',
    contact: '',
    browser: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter a title for the bug report.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please describe the bug you encountered.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('bug_reports')
        .insert({
          title: form.title.trim().slice(0, 200),
          category: form.category || null,
          description: form.description.trim().slice(0, 2000),
          page_url: form.page_url || window.location.href,
          contact: form.contact?.trim() ? form.contact.trim().slice(0, 200) : null,
          browser: form.browser?.trim() ? form.browser.trim().slice(0, 200) : null,
        });

      if (submitError) {
        if (isMissingTableError(submitError)) {
          setError('Bug reports database not set up yet. Please try again later or contact an admin directly.');
        } else {
          setError(`Failed to submit: ${submitError.message}`);
        }
      } else {
        setSubmitted(true);
        setForm({
          title: '',
          category: '',
          description: '',
          page_url: '',
          contact: '',
          browser: '',
        });
      }
    } catch {
      setError('Unable to submit bug report. Please try again later.');
    }

    setSubmitting(false);
  }

  if (submitted) {
    return (
      <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
        <PageIntro eyebrow="Bug Report" title="Report Submitted!">
          <p>Thank you for helping improve APEX! Your bug report has been received and will be reviewed by our team.</p>
        </PageIntro>
        <div className="card" style={{ marginTop: 24, padding: 24, textAlign: 'center' }}>
          <p style={{ margin: '0 0 20px', color: 'var(--text-dim)' }}>
            Your report helps make APEX Values & Wiki better for everyone.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="filled" onClick={() => setSubmitted(false)}>
              Submit Another Report
            </button>
            <Link to="/" className="button-link">
              Return Home
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell sidebarTitle="WIKI" navTree={WIKI_NAV}>
      <PageIntro eyebrow="Help Us Improve" title="Report a Bug">
        <p>
          Found something wrong? Let us know! Fill out this form to report bugs, incorrect data,
          broken links, or any other issues you encounter while using APEX Values & Wiki.
        </p>
      </PageIntro>

      <motion.form
        onSubmit={handleSubmit}
        className="card"
        style={{ marginTop: 24, maxWidth: 640 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Title <span style={{ color: 'var(--text-faint)' }}>*</span>
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Brief description of the issue"
              required
              maxLength={200}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {form.title.length}/200 characters
            </span>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Category</span>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
              }}
            >
              <option value="">Select a category…</option>
              {BUG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Description <span style={{ color: 'var(--text-faint)' }}>*</span>
            </span>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Please describe what happened, what you expected to happen, and steps to reproduce the issue…"
              required
              maxLength={2000}
              rows={5}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                resize: 'vertical',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {form.description.length}/2000 characters
            </span>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Page URL</span>
            <input
              type="url"
              value={form.page_url}
              onChange={(e) => updateField('page_url', e.target.value)}
              placeholder="URL where the bug occurred"
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Browser/Device (optional)</span>
            <input
              type="text"
              value={form.browser}
              onChange={(e) => updateField('browser', e.target.value)}
              placeholder="e.g., Chrome 120 on Windows 11"
              maxLength={200}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Contact (optional)</span>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => updateField('contact', e.target.value)}
              placeholder="Email or Discord for follow-up (not shown publicly)"
              maxLength={200}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              Only visible to admins. We may use this to ask for more details.
            </span>
          </label>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255, 77, 77, 0.1)',
              border: '1px solid rgba(255, 77, 77, 0.3)',
              borderRadius: 'var(--radius)',
              color: '#ff6b6b',
              fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              className="filled"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting…' : 'Submit Bug Report'}
            </button>
            <button
              type="button"
              onClick={() => setForm({
                title: '',
                category: '',
                description: '',
                page_url: '',
                contact: '',
                browser: '',
              })}
              disabled={submitting}
            >
              Clear
            </button>
          </div>
        </div>
      </motion.form>

      <p style={{ marginTop: 20, color: 'var(--text-faint)', fontSize: '0.82rem', maxWidth: 640 }}>
        Reports are reviewed by admins. For urgent issues, reach out directly on Discord.
      </p>
    </PageShell>
  );
}
