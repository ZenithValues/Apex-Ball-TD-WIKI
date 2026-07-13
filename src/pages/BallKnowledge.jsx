import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BASE_UNITS } from '../data/units';
import './BallKnowledge.css';

const STORAGE_PREFIX = 'apex-ball-knowledge';
const DAILY_SALT = 'apex-values-ball-knowledge-v1';
const EASTERN_TIME_ZONE = 'America/New_York';
const RESET_HOUR_ET = 15; // 3PM Eastern Time

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay },
  }),
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

  Object.entries(upgrade.attacks || {}).forEach(([attackName, stats]) => {
    Object.entries(stats || {}).forEach(([key, value]) => {
      if (/damage/i.test(key)) {
        rows.push({ label: attackName === 'Stats' ? key : `${attackName} ${key}`, value });
      }
    });
  });

  return rows;
}

function isUsefulCostPerDps(value) {
  return value && !/^n\/?a\$?$/i.test(String(value).trim());
}

function buildCandidates() {
  return BASE_UNITS.flatMap((unit) =>
    (unit.upgrades || []).map((upgrade) => ({
      unit,
      upgrade,
      damageRows: getDamageRows(upgrade),
    }))
  ).filter(({ unit, upgrade, damageRows }) =>
    unit.documented &&
    !unit.unavailableData &&
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

function getEasternParts(nowMs) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(new Date(nowMs));

  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function formatDateKey(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function previousEasternDateKey(parts) {
  const noonUtcForEasternDate = Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  return formatDateKey(getEasternParts(noonUtcForEasternDate - 24 * 60 * 60 * 1000));
}

function getDailyKey(nowMs) {
  const parts = getEasternParts(nowMs);
  return parts.hour >= RESET_HOUR_ET ? formatDateKey(parts) : previousEasternDateKey(parts);
}

function getPuzzleForDay(candidates, dayKey) {
  if (!candidates.length || !dayKey) return null;
  const index = hashString(`${DAILY_SALT}:${dayKey}`) % candidates.length;
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

function loadProgress(dayKey) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${dayKey}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupted or blocked storage
  }
  return { guesses: [], won: false };
}

function saveProgress(dayKey, progress) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${dayKey}`, JSON.stringify(progress));
  } catch {
    // storage may be blocked; the daily answer still cannot be changed by PC time
  }
}

function normalizeGuess(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function BallKnowledge() {
  const candidates = useMemo(() => buildCandidates(), []);
  const units = useMemo(() => BASE_UNITS.filter((u) => u.documented && !u.unavailableData), []);
  const [timeState, setTimeState] = useState({ status: 'loading', nowMs: null, source: null, error: null });
  const [dayKey, setDayKey] = useState(null);
  const [progress, setProgress] = useState({ guesses: [], won: false });
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');
  const verifiedAtRef = useRef(null);

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

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (timeState.status !== 'ready' || !verifiedAtRef.current) return undefined;

    function tick() {
      const verified = verifiedAtRef.current;
      const nowMs = verified.ms + (performance.now() - verified.perf);
      const nextDayKey = getDailyKey(nowMs);
      setTimeState((prev) => ({ ...prev, nowMs }));
      setDayKey((prev) => (prev === nextDayKey ? prev : nextDayKey));
    }

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [timeState.status]);

  useEffect(() => {
    if (!dayKey) return;
    setProgress(loadProgress(dayKey));
    setGuess('');
    setMessage('');
  }, [dayKey]);

  const puzzle = useMemo(() => getPuzzleForDay(candidates, dayKey), [candidates, dayKey]);
  const wrongGuesses = progress.guesses.filter((g) => !g.correct).length;
  const showDamage = wrongGuesses >= 1 || progress.won;
  const showRange = wrongGuesses >= 2 || progress.won;
  const showCooldown = wrongGuesses >= 3 || progress.won;

  function commitProgress(nextProgress) {
    setProgress(nextProgress);
    if (dayKey) saveProgress(dayKey, nextProgress);
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!puzzle || progress.won) return;

    const normalized = normalizeGuess(guess);
    const guessedUnit = units.find((u) => normalizeGuess(u.name) === normalized || u.slug === normalized.replace(/\s+/g, '-'));

    if (!guessedUnit) {
      setMessage('Pick a unit from the unit list.');
      return;
    }

    if (progress.guesses.some((g) => g.slug === guessedUnit.slug)) {
      setMessage('You already guessed that unit today.');
      setGuess('');
      return;
    }

    const correct = guessedUnit.slug === puzzle.unit.slug;
    const nextProgress = {
      ...progress,
      won: progress.won || correct,
      guesses: [
        ...progress.guesses,
        { slug: guessedUnit.slug, name: guessedUnit.name, correct },
      ],
    };

    commitProgress(nextProgress);
    setGuess('');
    setMessage(correct ? 'Correct — your Ball TD knowledge is verified.' : 'Not that unit. New clue unlocked.');
  }

  if (timeState.status === 'loading') {
    return (
      <main className="bk-page">
        <div className="bk-panel card">
          <h1>Ball Knowledge</h1>
          <p>Verifying global time…</p>
        </div>
      </main>
    );
  }

  if (timeState.status === 'error') {
    return (
      <main className="bk-page">
        <div className="bk-panel card">
          <h1>Ball Knowledge</h1>
          <p className="bk-error">
            Couldn&apos;t verify global time, so today&apos;s puzzle is locked. This game does not use your PC clock.
            Check your connection and reload.
          </p>
        </div>
      </main>
    );
  }

  if (!puzzle) {
    return (
      <main className="bk-page">
        <div className="bk-panel card">
          <h1>Ball Knowledge</h1>
          <p>No eligible upgrade clues found.</p>
        </div>
      </main>
    );
  }

  const upgradeTitle = puzzle.upgrade.description || puzzle.upgrade.label;

  return (
    <main className="bk-page">
      <motion.section className="bk-hero" variants={fadeUp} initial="initial" animate="animate">
        <p className="bk-kicker">Daily Unit Guess</p>
        <h1>Ball Knowledge</h1>
        <p className="bk-tagline">Test your Ball TD unit knowledge.</p>
        <p className="bk-time-note">
          Daily puzzle verified by global time. New puzzle every day at 3PM ET.
        </p>
      </motion.section>

      <motion.section className="bk-panel card" variants={fadeUp} initial="initial" animate="animate" custom={0.12}>
        <div className="bk-panel-head">
          <div>
            <div className="bk-day">Puzzle {dayKey}</div>
            <h2>Guess the unit</h2>
          </div>
          <div className="bk-verified">Time source: {timeState.source}</div>
        </div>

        <div className="bk-clues">
          <ClueCard label="Upgrade" value={upgradeTitle} always />
          <ClueCard label="Upgrade Slot" value={puzzle.upgrade.label} always />
          <ClueCard label="DPS" value={formatEntries(puzzle.upgrade.dps)} always />
          <ClueCard label="Cost Per DPS" value={puzzle.upgrade.costPerDps} always />
          <ClueCard label="Damage" value={puzzle.damageRows.map((r) => `${r.label}: ${r.value}`).join(' / ')} revealed={showDamage} lockedText="Wrong guess #1" />
          <ClueCard label="Range" value={puzzle.upgrade.range} revealed={showRange} lockedText="Wrong guess #2" />
          <ClueCard label="Cooldown" value={puzzle.upgrade.cooldown} revealed={showCooldown} lockedText="Wrong guess #3" />
        </div>

        {progress.won ? (
          <div className="bk-success">
            <div className="bk-result-label">Answer</div>
            <div className="bk-result-name">{puzzle.unit.name}</div>
            <Link to={`/wiki/units/${encodeURIComponent(puzzle.unit.rarity)}/${puzzle.unit.slug}`} className="bk-link">
              Open unit page →
            </Link>
          </div>
        ) : (
          <form className="bk-guess-form" onSubmit={submitGuess}>
            <label htmlFor="bk-guess">Your guess</label>
            <div className="bk-guess-row">
              <input
                id="bk-guess"
                list="bk-unit-list"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type a unit name…"
                autoComplete="off"
              />
              <button type="submit">Guess</button>
            </div>
            <datalist id="bk-unit-list">
              {units.map((unit) => (
                <option key={unit.slug} value={unit.name} />
              ))}
            </datalist>
          </form>
        )}

        {message && <div className={progress.won ? 'bk-message success' : 'bk-message'}>{message}</div>}

        {progress.guesses.length > 0 && (
          <div className="bk-guesses">
            <h3>Today&apos;s guesses</h3>
            <div className="bk-guess-list">
              {progress.guesses.map((entry) => (
                <span key={entry.slug} className={entry.correct ? 'bk-guess-chip correct' : 'bk-guess-chip'}>
                  {entry.correct ? '✓' : '×'} {entry.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </main>
  );
}

function ClueCard({ label, value, always = false, revealed = false, lockedText }) {
  const isVisible = always || revealed;
  return (
    <div className={isVisible ? 'bk-clue revealed' : 'bk-clue'}>
      <div className="bk-clue-label">{label}</div>
      <div className="bk-clue-value">{isVisible ? value : lockedText}</div>
    </div>
  );
}
