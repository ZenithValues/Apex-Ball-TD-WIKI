import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BASE_UNITS } from '../data/units';
import { labelAttacks } from '../utils/attacks';
import {
  getEstParts,
  formatDateKey,
  getDailyKey,
  formatDuration,
  nextResetMs as nextResetMsBase,
  getModeDayKey as getModeDayKeyBase,
} from '../utils/ballKnowledgeTime';
import './BallKnowledge.css';

const STORAGE_PREFIX = 'apex-ball-knowledge';
const STATS_KEY = 'apex-ball-knowledge-stats-v1';
const USER_SEED_KEY = 'apex-ball-knowledge-user-seed-v1';
const DAILY_SALT = 'apex-values-ball-knowledge-v3-personalized';

const MODES = {
  normal: {
    label: 'Normal',
    icon: '⚪',
    maxGuesses: null,
    timeLimit: null,
    nightmare: false,
    oneClueOnly: false,
    startingDamage: false,
    reveal: { damage: 3, range: 5, cooldown: 7, rarity: 10 },
  },
  hard: {
    label: 'Hard',
    icon: '🔴',
    maxGuesses: 3,
    timeLimit: null,
    nightmare: false,
    oneClueOnly: false,
    startingDamage: false,
    reveal: { damage: 3, range: 99, cooldown: 99, rarity: 99 },
  },
  impossible: {
    label: 'Impossible',
    icon: '💀',
    maxGuesses: 1,
    timeLimit: null,
    nightmare: false,
    oneClueOnly: false,
    startingDamage: true,
    reveal: { damage: 0, range: 99, cooldown: 99, rarity: 99 },
  },
  nightmare: {
    label: 'Nightmare',
    icon: '☠️',
    maxGuesses: 1,
    timeLimit: 30,
    nightmare: true,
    oneClueOnly: true,
    startingDamage: false,
    reveal: { damage: 99, range: 99, cooldown: 99, rarity: 99 },
  },
};

function hasEntries(obj) {
  return obj && Object.keys(obj).length > 0;
}

function formatEntries(obj) {
  if (!hasEntries(obj)) return '—';
  return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' / ');
}

function getDamageRows(upgrade) {
  const rows = [];
  Object.entries(upgrade.stats || {}).forEach(([key, value]) => {
    if (/damage/i.test(key)) rows.push({ label: key, value });
  });
  labelAttacks(upgrade.attacks).forEach((attack) => {
    Object.entries(attack.stats).forEach(([key, value]) => {
      if (/damage/i.test(key)) rows.push({ label: attack.name === 'Stats' ? key : `${attack.label} ${key}`, value });
    });
  });
  return rows;
}

function isUsefulCostPerDps(value) {
  return value && !/^n\/?a\$?$/i.test(String(value).trim());
}

function isPlacementUpgrade(upgrade, index) {
  if (index === 0) return true;
  const label = (upgrade.label || '').toLowerCase();
  return label.includes('placement');
}

function upgradeContainsUnitName(upgrade, unitName) {
  if (!unitName) return false;
  const nameLower = unitName.toLowerCase().trim();

  const stems = [nameLower];
  if (nameLower.endsWith('ball') && nameLower.length > 4) {
    stems.push(nameLower.slice(0, -4));
  }
  if (nameLower.endsWith('monkey') && nameLower.length > 6) {
    stems.push(nameLower.slice(0, -6));
  }

  const label = (upgrade.label || '').toLowerCase();
  const desc = (upgrade.description || '').toLowerCase();
  const dpsText = JSON.stringify(upgrade.dps || {}).toLowerCase();

  return stems.some((stem) => {
    if (stem.length < 3) return false;
    return label.includes(stem) || desc.includes(stem) || dpsText.includes(stem);
  });
}

function buildCandidates() {
  return BASE_UNITS.flatMap((unit) =>
    (unit.upgrades || []).map((upgrade, index) => ({ unit, upgrade, index, damageRows: getDamageRows(upgrade) }))
  ).filter(({ unit, upgrade, index, damageRows }) =>
    unit.documented &&
    !unit.unavailableData &&
    !isPlacementUpgrade(upgrade, index) &&
    !upgradeContainsUnitName(upgrade, unit.name) &&
    hasEntries(upgrade.dps) &&
    isUsefulCostPerDps(upgrade.costPerDps) &&
    damageRows.length > 0 &&
    upgrade.range &&
    upgrade.cooldown
  );
}

function hashString(value) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function getUserSeed() {
  try {
    let seed = localStorage.getItem(USER_SEED_KEY);
    if (!seed) {
      seed = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(USER_SEED_KEY, seed);
    }
    return seed;
  } catch {
    return 'no-storage-user';
  }
}

function nextResetMs(nowMs, mode) {
  return nextResetMsBase(nowMs, MODES[mode]);
}

function getModeDayKey(dayKey, mode) {
  return getModeDayKeyBase(dayKey, MODES[mode]);
}

function getPuzzleForDay(candidates, dayKey, mode, userSeed) {
  if (!candidates.length || !dayKey) return null;
  const modeDayKey = getModeDayKey(dayKey, mode);
  const index = hashString(`${DAILY_SALT}:${mode}:${modeDayKey}:${userSeed}`) % candidates.length;
  return candidates[index];
}

async function fetchJsonWithTimeout(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGlobalTimeMs() {
  const endpoints = [
    {
      label: 'WorldTimeAPI UTC',
      url: 'https://worldtimeapi.org/api/timezone/Etc/UTC',
      parse: (data) => (Number.isFinite(data.unixtime) ? data.unixtime * 1000 : Date.parse(data.utc_datetime)),
    },
    {
      label: 'TimeAPI UTC',
      url: 'https://timeapi.io/api/time/current/zone?timeZone=UTC',
      parse: (data) => Date.parse(`${data.dateTime || data.date || data.time}Z`),
    },
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const data = await fetchJsonWithTimeout(endpoint.url);
      const ms = endpoint.parse(data);
      if (Number.isFinite(ms)) return { ms, source: endpoint.label };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Unable to verify global time');
}

function defaultProgress() {
  return { guesses: [], won: false, lost: false };
}

function loadProgress(progressKey) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${progressKey}`);
    if (raw) return { ...defaultProgress(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultProgress();
}

function saveProgress(progressKey, progress) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${progressKey}`, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

function defaultStats() {
  return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, lastSolvedDay: null, totalGuesses: 0, guessDistribution: {} };
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats(), ...JSON.parse(raw) } : defaultStats();
  } catch {
    return defaultStats();
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

function previousDayKeyFromKey(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const parts = getEstParts(Date.UTC(year, month - 1, day, 5, 0, 0) - 24 * 60 * 60 * 1000);
  return formatDateKey(parts);
}

function recordWin(stats, dayKey, guessCount) {
  if (!dayKey || stats.lastSolvedDay === dayKey) return stats;
  const previousDay = previousDayKeyFromKey(dayKey);
  const currentStreak = stats.lastSolvedDay === previousDay ? stats.currentStreak + 1 : 1;
  const nextStats = {
    ...stats,
    played: stats.played + 1,
    wins: stats.wins + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    lastSolvedDay: dayKey,
    totalGuesses: stats.totalGuesses + guessCount,
    guessDistribution: { ...stats.guessDistribution, [guessCount]: (stats.guessDistribution?.[guessCount] || 0) + 1 },
  };
  saveStats(nextStats);
  return nextStats;
}

function normalizeGuess(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function confettiPieces() {
  return Array.from({ length: 42 }, (_, i) => ({
    id: i,
    x: Math.round(Math.cos(i * 1.7) * (70 + (i % 6) * 18)),
    y: Math.round(Math.sin(i * 2.1) * (62 + (i % 5) * 16)),
    delay: `${(i % 8) * 0.035}s`,
  }));
}

export default function BallKnowledge() {
  const candidates = useMemo(() => buildCandidates(), []);
  const units = useMemo(() => BASE_UNITS.filter((u) => u.documented && !u.unavailableData), []);
  const userSeed = useMemo(() => getUserSeed(), []);
  const [mode, setMode] = useState(() => localStorage.getItem('apex-ball-knowledge-mode') || 'normal');
  const modeConfig = MODES[mode] || MODES.normal;
  const [timeState, setTimeState] = useState({ status: 'loading', nowMs: null, source: null, error: null });
  const [dayKey, setDayKey] = useState(null);
  const [countdown, setCountdown] = useState('—');
  const [progress, setProgress] = useState(defaultProgress());
  const [stats, setStats] = useState(() => loadStats());
  const [guess, setGuess] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const verifiedAtRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem('apex-ball-knowledge-mode', mode); } catch { /* ignore */ }
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    fetchGlobalTimeMs()
      .then(({ ms, source }) => {
        if (cancelled) return;
        verifiedAtRef.current = { ms, perf: performance.now() };
        setTimeState({ status: 'ready', nowMs: ms, source, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setTimeState({ status: 'error', nowMs: null, source: null, error });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (timeState.status !== 'ready' || !verifiedAtRef.current) return undefined;
    function tick() {
      const verified = verifiedAtRef.current;
      const nowMs = verified.ms + (performance.now() - verified.perf);
      const nextDayKey = getDailyKey(nowMs);
      setTimeState((prev) => ({ ...prev, nowMs }));
      setDayKey((prev) => (prev === nextDayKey ? prev : nextDayKey));
      setCountdown(formatDuration(nextResetMs(nowMs, mode) - nowMs));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timeState.status, mode]);

  const puzzleKey = useMemo(() => (dayKey ? `${getModeDayKey(dayKey, mode)}:${mode}` : null), [dayKey, mode]);
  const puzzle = useMemo(
    () => (dayKey ? getPuzzleForDay(candidates, dayKey, mode, userSeed) : null),
    [candidates, dayKey, mode, userSeed]
  );

  useEffect(() => {
    if (puzzleKey) setProgress(loadProgress(puzzleKey));
  }, [puzzleKey]);

  function submitGuess(e) {
    e.preventDefault();
    if (!puzzle || !guess.trim()) return;
    const cleanGuess = normalizeGuess(guess);
    const isCorrect = cleanGuess === normalizeGuess(puzzle.unit.name);

    const nextGuesses = [...progress.guesses, { name: guess.trim(), correct: isCorrect }];
    const won = isCorrect;
    const lost = !won && modeConfig.maxGuesses && nextGuesses.length >= modeConfig.maxGuesses;

    const nextProgress = { ...progress, guesses: nextGuesses, won, lost };
    setProgress(nextProgress);
    if (puzzleKey) saveProgress(puzzleKey, nextProgress);

    if (won) {
      setStats((prev) => recordWin(prev, dayKey, nextGuesses.length));
      setMessage('🎉 Correct! Magnificent Ball Knowledge!');
    } else if (lost) {
      setMessage(`❌ Out of guesses. Today's unit was ${puzzle.unit.name}.`);
    } else {
      setMessage('Not quite right. Keep guessing!');
    }
    setGuess('');
    setDropdownOpen(false);
  }

  const suggestions = useMemo(() => {
    if (!guess.trim()) return [];
    const q = normalizeGuess(guess);
    return units.filter((u) => normalizeGuess(u.name).includes(q)).slice(0, 8);
  }, [guess, units]);

  if (timeState.status === 'loading') {
    return <main className="bk-page"><div className="bk-panel card">Verifying global time…</div></main>;
  }

  if (!puzzle) {
    return <main className="bk-page"><div className="bk-panel card">No puzzle available.</div></main>;
  }

  const locked = progress.won || progress.lost;

  return (
    <main className="bk-page">
      <div className="bk-hero">
        <span className="page-kicker">Daily Minigame</span>
        <h1>Ball Knowledge</h1>
        <p>Test your Tower Defense stats expertise. Guess today&apos;s unit from its upgrade progression data!</p>
      </div>

      <div className="bk-modes">
        {Object.entries(MODES).map(([id, cfg]) => (
          <button key={id} type="button" className={mode === id ? 'bk-mode active' : 'bk-mode'} onClick={() => setMode(id)}>
            <span>{cfg.icon}</span> {cfg.label}
          </button>
        ))}
      </div>

      <div className="bk-stats-strip">
        <StatTile label="Current Streak" value={stats.currentStreak} />
        <StatTile label="Max Streak" value={stats.maxStreak} />
        <StatTile label="Wins" value={stats.wins} />
        <StatTile label="Next Reset" value={countdown} />
      </div>

      <div className={progress.won ? 'bk-panel card bk-panel-won' : 'bk-panel card'}>
        {progress.won && <CorrectVfx />}
        <div className="bk-panel-head">
          <div>
            <div className="bk-day">{modeConfig.icon} {modeConfig.label} · Puzzle {getModeDayKey(dayKey, mode)}</div>
            <h2>Guess the Unit</h2>
          </div>
        </div>

        <div className="bk-clues">
          <ClueCard label="Upgrade Name" value={puzzle.upgrade.label} always />
          <ClueCard label="DPS Stats" value={formatEntries(puzzle.upgrade.dps)} always />
          <ClueCard label="Cost Per DPS" value={puzzle.upgrade.costPerDps} always />
          <ClueCard label="Range" value={puzzle.upgrade.range} always />
          <ClueCard label="Attack Cooldown" value={puzzle.upgrade.cooldown} always />
          <ClueCard label="Rarity Tier" value={puzzle.unit.rarity} always />
        </div>

        {locked ? (
          <div className={progress.won ? 'bk-success' : 'bk-success bk-loss'}>
            <div className="bk-result-label">{progress.won ? 'Winner!' : 'Answer Revealed'}</div>
            <div className="bk-result-name">{puzzle.unit.name}</div>
            <div className="bk-success-actions">
              <Link to={`/wiki/units/${encodeURIComponent(puzzle.unit.rarity)}/${puzzle.unit.slug}`} className="bk-link">View Unit WIKI Page →</Link>
            </div>
          </div>
        ) : (
          <form className="bk-guess-form" onSubmit={submitGuess}>
            <label htmlFor="bk-guess">Type Your Guess</label>
            <div className="bk-guess-row">
              <div className="bk-combobox">
                <input
                  id="bk-guess"
                  value={guess}
                  onChange={(e) => { setGuess(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
                  placeholder="Type unit name…"
                  autoComplete="off"
                />
                {dropdownOpen && (
                  <div className="bk-suggestion-menu" data-lenis-prevent>
                    {suggestions.length > 0 ? suggestions.map((unit) => (
                      <button type="button" key={unit.slug} className="bk-suggestion-option" onMouseDown={(e) => e.preventDefault()} onClick={() => { setGuess(unit.name); setDropdownOpen(false); }}>
                        <span>{unit.name}</span><small>{unit.rarity}</small>
                      </button>
                    )) : <div className="bk-suggestion-empty">No matching units.</div>}
                  </div>
                )}
              </div>
              <button type="submit" className="filled">Submit Guess</button>
            </div>
          </form>
        )}

        {message && <div className={progress.won ? 'bk-message success' : 'bk-message'}>{message}</div>}
      </div>
    </main>
  );
}

function CorrectVfx() {
  return (
    <div className="bk-correct-vfx" aria-hidden="true">
      <div className="bk-green-explosion" />
      {confettiPieces().map((piece) => <i key={piece.id} style={{ '--x': `${piece.x}px`, '--y': `${piece.y}px`, '--delay': piece.delay }} />)}
    </div>
  );
}

function StatTile({ label, value }) {
  return <div className="bk-stat-tile card"><strong>{value}</strong><span>{label}</span></div>;
}

function ClueCard({ label, value }) {
  return (
    <div className="bk-clue revealed">
      <div className="bk-clue-label">{label}</div>
      <div className="bk-clue-value">{value}</div>
    </div>
  );
}
