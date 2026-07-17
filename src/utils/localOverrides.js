export const LOCAL_VALUE_OVERRIDES_KEY = 'apex-local-value-overrides-v1';
export const LOCAL_VALUE_CHANGE_LOG_KEY = 'apex-local-value-change-log-v1';
export const LOCAL_WIKI_OVERRIDES_KEY = 'apex-local-wiki-overrides-v1';

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

export function setLocalValueOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalValueOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  saveLocalValueOverrides(current);
}

export function loadLocalWikiOverrides() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_WIKI_OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalWikiOverrides(overrides) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_WIKI_OVERRIDES_KEY, JSON.stringify(overrides || {}));
}

export function setLocalWikiOverride(slug, override) {
  if (!slug) return;
  const current = loadLocalWikiOverrides();
  if (override === null) {
    delete current[slug];
  } else {
    current[slug] = override;
  }
  saveLocalWikiOverrides(current);
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
