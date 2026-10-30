// This controls only the site's optional, on-device visit/search statistics.
// It is NOT an advertising CMP or proof of parental consent.
export const PRIVACY_CHOICE_KEY = 'apex-privacy-choice-v1';
export const PRIVACY_CHANGE_EVENT = 'apex-privacy-choice-changed';
export const PRIVACY_OPEN_EVENT = 'apex-open-privacy-choices';

export function getStatsChoice() {
  try {
    const raw = localStorage.getItem(PRIVACY_CHOICE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return typeof value?.localStats === 'boolean' ? value.localStats : null;
  } catch { return null; }
}

export function localStatsAllowed() {
  return getStatsChoice() === true;
}

export function saveStatsChoice(allow) {
  const choice = Boolean(allow);
  try {
    localStorage.setItem(PRIVACY_CHOICE_KEY, JSON.stringify({ version: 1, localStats: choice }));
    if (!choice) {
      // Remove previous optional search/usage history; preserve game progress.
      localStorage.removeItem('apex-analytics-v1');
      localStorage.removeItem('apex-recent-searches-v1');
      const key = 'apex-achievement-progress-v1';
      const raw = localStorage.getItem(key);
      if (raw) {
        const progress = JSON.parse(raw);
        for (const field of ['visited_pages', 'last_visit_date', 'visit_dates', 'daily_streak', 'days_active']) delete progress[field];
        localStorage.setItem(key, JSON.stringify(progress));
      }
    }
  } catch { /* If storage is blocked, no choice or optional stats persist. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRIVACY_CHANGE_EVENT));
}

export function openPrivacyChoices() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRIVACY_OPEN_EVENT));
}

/** Remove this app's local keys only, not remote reports or other site data. */
export function clearApexLocalData() {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((key) => key?.startsWith('apex-'));
      keys.forEach((key) => storage.removeItem(key));
    }
  } catch { /* Browser storage may be unavailable. */ }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PRIVACY_CHANGE_EVENT));
    window.dispatchEvent(new Event('apex-admin-auth-changed'));
  }
}
