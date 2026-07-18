import { useMemo } from 'react';
import { getDisplayName } from '../../utils/teamMembers';
import './ContributionGraph.css';

const PALETTE = [
  '#4d9dff',
  '#c04dff',
  '#58ff42',
  '#ffc94d',
  '#ff4d6e',
  '#00f5d4',
  '#ff9e00',
  '#7b2cbf',
];

export default function ContributionGraph({ valueLog = [], wikiLog = [] }) {
  const valueStats = useMemo(() => calculateStats(valueLog, 'Value'), [valueLog]);
  const wikiStats = useMemo(() => calculateStats(wikiLog, 'WIKI'), [wikiLog]);

  return (
    <div className="admin-contrib-section card">
      <div className="admin-contrib-head">
        <div>
          <h2>Team Activity &amp; Role Rewards</h2>
          <span className="admin-contrib-kicker">Owner Analytics · Contribution Pizza % Share</span>
        </div>
      </div>

      <div className="admin-contrib-grid">
        <ContributionCard
          title="VALUE Contributions"
          badgeLabel="Lead Value Editor"
          badgeColor="#4d9dff"
          stats={valueStats}
        />
        <ContributionCard
          title="WIKI Contributions"
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

  (logEntries || []).forEach((entry) => {
    const rawEmail = entry.changed_by_email || 'anonymous';
    const name = getDisplayName(rawEmail);
    userMap.set(name, (userMap.get(name) || 0) + 1);
  });

  const totalEdits = (logEntries || []).length;

  const userList = Array.from(userMap.entries())
    .map(([name, count], index) => {
      const pct = totalEdits > 0 ? (count / totalEdits) * 100 : 0;
      return {
        name,
        count,
        pct: Number(pct.toFixed(1)),
        rawPct: totalEdits > 0 ? count / totalEdits : 0,
        color: PALETTE[index % PALETTE.length],
      };
    })
    .sort((a, b) => b.count - a.count);

  const topEditor = userList[0] || null;

  return { userList, topEditor, totalEdits, kind };
}

function ContributionCard({ title, badgeLabel, badgeColor, stats }) {
  const { userList, topEditor, totalEdits } = stats;

  return (
    <div className="contrib-card">
      <div className="contrib-card-head">
        <h3>{title}</h3>
        <span className="contrib-total-badge">{totalEdits} Total Edits</span>
      </div>

      <div className="contrib-leader-box" style={{ borderColor: badgeColor, boxShadow: `0 0 16px ${badgeColor}33` }}>
        <div className="contrib-leader-info">
          <span className="contrib-leader-role" style={{ color: badgeColor }}>
            👑 {badgeLabel}
          </span>
          <strong className="contrib-leader-email">
            {topEditor ? topEditor.name : 'Awaiting Contributions'}
          </strong>
        </div>
        <div className="contrib-leader-count">
          <b>{topEditor ? `${topEditor.pct}%` : '0%'}</b>
          <small>{topEditor ? `${topEditor.count} edits` : '0 edits'}</small>
        </div>
      </div>

      {/* PIZZA GRAPHIC / PIE CHART */}
      <div className="contrib-pizza-section">
        <h4 className="contrib-sub-title">🍕 Team Pizza Chart (% Share)</h4>
        {userList.length === 0 || totalEdits === 0 ? (
          <div className="contrib-empty">No activity records logged yet</div>
        ) : (
          <div className="contrib-pizza-layout">
            <PizzaChart userList={userList} />
            <div className="contrib-pizza-legend">
              {userList.map((user) => (
                <div key={user.name} className="contrib-legend-item">
                  <i className="legend-dot" style={{ background: user.color }} />
                  <span className="legend-email" title={user.name}>{user.name}</span>
                  <span className="legend-stats">
                    <b>{user.pct}%</b> ({user.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PizzaChart({ userList }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="pizza-chart-wrap">
      <svg className="pizza-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="18" />
        {userList.map((user) => {
          const dash = user.rawPct * circumference;
          const strokeDasharray = `${dash} ${circumference}`;
          const strokeDashoffset = -accumulatedOffset * circumference;
          accumulatedOffset += user.rawPct;

          return (
            <circle
              key={user.name}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={user.color}
              strokeWidth="18"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            >
              <title>{`${user.name}: ${user.pct}% (${user.count} edits)`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="pizza-center-text">
        <span>Team</span>
        <strong>%</strong>
      </div>
    </div>
  );
}
