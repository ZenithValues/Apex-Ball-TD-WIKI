import { useMemo } from 'react';
import './ContributionGraph.css';

export default function ContributionGraph({ valueLog = [], wikiLog = [] }) {
  const valueStats = useMemo(() => calculateStats(valueLog, 'value'), [valueLog]);
  const wikiStats = useMemo(() => calculateStats(wikiLog, 'wiki'), [wikiLog]);

  return (
    <div className="admin-contrib-section card">
      <div className="admin-contrib-head">
        <h2>Admin Activity Contribution Graphs</h2>
        <span className="admin-contrib-kicker">Automatic Reward System Active</span>
      </div>

      <div className="admin-contrib-grid">
        <ContributionCard
          title="VALUE Activity Graph"
          badgeLabel="Lead Value Editor"
          badgeColor="#4d9dff"
          stats={valueStats}
        />
        <ContributionCard
          title="WIKI Activity Graph"
          badgeLabel="Lead WIKI Editor"
          badgeColor="#c04dff"
          stats={wikiStats}
        />
      </div>
    </div>
  );
}

function calculateStats(logEntries, kind) {
  const userMap = new Map();
  const dateMap = new Map();

  const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dateMap.set(dateStr, 0);
  }

  (logEntries || []).forEach((entry) => {
    const email = entry.changed_by_email || 'anonymous';
    const dateStr = entry.changed_at ? new Date(entry.changed_at).toISOString().slice(0, 10) : null;

    if (email) {
      userMap.set(email, (userMap.get(email) || 0) + 1);
    }
    if (dateStr && dateMap.has(dateStr)) {
      dateMap.set(dateStr, dateMap.get(dateStr) + 1);
    }
  });

  let topEditor = null;
  let maxCount = 0;
  userMap.forEach((count, email) => {
    if (count > maxCount) {
      maxCount = count;
      topEditor = email;
    }
  });

  const cells = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  const totalEdits = (logEntries || []).length;

  return { cells, topEditor, maxCount, totalEdits, kind };
}

function ContributionCard({ title, badgeLabel, badgeColor, stats }) {
  const { cells, topEditor, maxCount, totalEdits } = stats;

  return (
    <div className="contrib-card">
      <div className="contrib-card-head">
        <h3>{title}</h3>
        <span className="contrib-total-badge">{totalEdits} Edits</span>
      </div>

      <div className="contrib-leader-box" style={{ borderColor: badgeColor, boxShadow: `0 0 12px ${badgeColor}33` }}>
        <div className="contrib-leader-info">
          <span className="contrib-leader-role" style={{ color: badgeColor }}>
            🏆 {badgeLabel}
          </span>
          <strong className="contrib-leader-email">
            {topEditor ? topEditor : 'Awaiting contributions'}
          </strong>
        </div>
        <div className="contrib-leader-count">
          <b>{maxCount}</b>
          <small>contributions</small>
        </div>
      </div>

      <div className="contrib-heatmap-wrap">
        <span className="contrib-heatmap-title">28-Day Activity Heatmap</span>
        <div className="contrib-heatmap-cells">
          {cells.map(({ date, count }) => {
            const level = count === 0 ? 0 : count < 3 ? 1 : count < 7 ? 2 : 3;
            return (
              <div
                key={date}
                className={`contrib-cell level-${level}`}
                title={`${date}: ${count} ${stats.kind} edit${count === 1 ? '' : 's'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
