export const LOCAL_VALUE_OVERRIDES_KEY = 'apex-local-value-overrides-v1';
export const LOCAL_VALUE_CHANGE_LOG_KEY = 'apex-local-value-change-log-v1';

export function loadLocalValueOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_VALUE_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalValueOverrides(overrides) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_VALUE_OVERRIDES_KEY, JSON.stringify(overrides || {}));
}

export function loadLocalValueChangeLog() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_VALUE_CHANGE_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalValueChangeLog(log) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_VALUE_CHANGE_LOG_KEY, JSON.stringify(Array.isArray(log) ? log : []));
}
