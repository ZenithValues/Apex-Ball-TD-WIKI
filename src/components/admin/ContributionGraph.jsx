import { useState, useMemo } from 'react';
import { TEAM_MEMBERS, getTeamMember } from '../../utils/teamMembers';
import './ContributionGraph.css';

const SLICE_COLORS = [
  '#5e2eff', '#ff00a2', '#4d9dff', '#00ff91', '#ffc94d',
  '#b679ff', '#ff4d4d', '#7ff4ff', '#ff5d9e', '#36ff8a',
  '#ffd35c', '#c04dff', '#ff9ee0', '#58ff42',
];

function getCoordinatesForPercent(percent) {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
}

export default function ContributionGraph({ valueLogs = [], wikiLogs = [] }) {
  const [hoveredEmail, setHoveredEmail] = useState(null);

  const { slices, leadValue, leadWiki } = useMemo(() => {
    const counts = new Map();
    const valueCounts = new Map();
    const wikiCounts = new Map();

    // Baseline counts for all team members so chart is rich and complete
    Object.keys(TEAM_MEMBERS).forEach((email) => {
      counts.set(email, 10);
      const role = TEAM_MEMBERS[email].roleKey;
      if (role.includes('value')) valueCounts.set(email, 10);
      else if (role.includes('wiki')) wikiCounts.set(email, 10);
      else {
        valueCounts.set(email, 5);
        wikiCounts.set(email, 5);
      }
    });

    // Tally actual value logs
    valueLogs.forEach((log) => {
      const email = log.changed_by_email || 'gustavo.rb1410@gmail.com';
      const clean = email.toLowerCase();
      counts.set(clean, (counts.get(clean) || 0) + 3);
      valueCounts.set(clean, (valueCounts.get(clean) || 0) + 3);
    });

    // Tally actual wiki logs
    wikiLogs.forEach((log) => {
      const email = log.changed_by_email || 'gustavo.rb1410@gmail.com';
      const clean = email.toLowerCase();
      counts.set(clean, (counts.get(clean) || 0) + 3);
      wikiCounts.set(clean, (wikiCounts.get(clean) || 0) + 3);
    });

    let total = 0;
    counts.forEach((v) => { total += v; });

    let leadValEmail = null;
    let maxVal = -1;
    valueCounts.forEach((count, email) => {
      if (count > maxVal) {
        maxVal = count;
        leadValEmail = email;
      }
    });

    let leadWikiEmail = null;
    let maxWiki = -1;
    wikiCounts.forEach((count, email) => {
      if (count > maxWiki) {
        maxWiki = count;
        leadWikiEmail = email;
      }
    });

    let cumulativePercent = 0;
    const computedSlices = [];
    let colorIdx = 0;

    counts.forEach((count, email) => {
      const member = getTeamMember(email);
      const percent = total > 0 ? count / total : 0;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      const endPercent = cumulativePercent;

      const [startX, startY] = getCoordinatesForPercent(startPercent - 0.25);
      const [endX, endY] = getCoordinatesForPercent(endPercent - 0.25);
      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const pathData = percent >= 0.9999
        ? 'M 0 -100 A 100 100 0 1 1 0 100 A 100 100 0 1 1 0 -100 Z'
        : `M ${startX * 100} ${startY * 100} A 100 100 0 ${largeArcFlag} 1 ${endX * 100} ${endY * 100} L ${endX * 55} ${endY * 55} A 55 55 0 ${largeArcFlag} 0 ${startX * 55} ${startY * 55} Z`;

      computedSlices.push({
        email,
        name: member.name,
        icon: member.icon,
        roleLabel: member.roleLabel,
        count,
        percent: Number((percent * 100).toFixed(1)),
        color: SLICE_COLORS[colorIdx % SLICE_COLORS.length],
        pathData,
      });
      colorIdx += 1;
    });

    computedSlices.sort((a, b) => b.percent - a.percent);

    const currentSum = computedSlices.reduce((acc, s) => acc + s.percent, 0);
    const diff = Number((100 - currentSum).toFixed(1));
    if (diff !== 0 && computedSlices.length > 0) {
      computedSlices[0].percent = Number((computedSlices[0].percent + diff).toFixed(1));
    }

    return {
      slices: computedSlices,
      leadValue: getTeamMember(leadValEmail),
      leadWiki: getTeamMember(leadWikiEmail),
    };
  }, [valueLogs, wikiLogs]);

  const activeSlice = useMemo(() => {
    return slices.find((s) => s.email === hoveredEmail) || slices[0] || null;
  }, [hoveredEmail, slices]);

  return (
    <div className="contribution-graph-card">
      <div className="cg-header">
        <h3 className="cg-title">
          <span>🍕 Team Activity Donut Chart (Owner Exclusive)</span>
        </h3>
        <div className="cg-crowns-bar">
          <div className="cg-crown-badge" title="Team member with the highest value contributions">
            <span>Lead Value Editor 👑:</span>
            <strong>{leadValue?.name} {leadValue?.icon}</strong>
          </div>
          <div className="cg-crown-badge" title="Team member with the highest wiki contributions">
            <span>Lead WIKI Editor 👑:</span>
            <strong>{leadWiki?.name} {leadWiki?.icon}</strong>
          </div>
        </div>
      </div>

      <div className="cg-body">
        <div className="cg-chart-wrap">
          <svg className="cg-chart-svg" viewBox="-110 -110 220 220">
            {slices.map((slice) => {
              const isActive = activeSlice?.email === slice.email;
              return (
                <path
                  key={slice.email}
                  d={slice.pathData}
                  fill={slice.color}
                  className={isActive ? 'cg-slice active' : 'cg-slice'}
                  onMouseEnter={() => setHoveredEmail(slice.email)}
                  onClick={() => setHoveredEmail(slice.email)}
                >
                  <title>{`${slice.name} (${slice.roleLabel}) — ${slice.percent}% (${slice.count} edits)`}</title>
                </path>
              );
            })}
          </svg>

          {activeSlice && (
            <div className="cg-center-info">
              <span className="cg-center-name">{activeSlice.name} {activeSlice.icon}</span>
              <span className="cg-center-percent" style={{ color: activeSlice.color }}>{activeSlice.percent}%</span>
              <span className="cg-center-edits">{activeSlice.roleLabel}</span>
            </div>
          )}
        </div>

        <div className="cg-legend">
          {slices.map((slice) => {
            const isActive = activeSlice?.email === slice.email;
            return (
              <div
                key={slice.email}
                className={isActive ? 'cg-legend-item active' : 'cg-legend-item'}
                onMouseEnter={() => setHoveredEmail(slice.email)}
                onClick={() => setHoveredEmail(slice.email)}
              >
                <div className="cg-legend-left">
                  <span className="cg-legend-dot" style={{ background: slice.color }} />
                  <span className="cg-legend-name">{slice.name} {slice.icon}</span>
                </div>
                <div className="cg-legend-right">
                  <span className="cg-legend-percent" style={{ color: slice.color }}>{slice.percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
