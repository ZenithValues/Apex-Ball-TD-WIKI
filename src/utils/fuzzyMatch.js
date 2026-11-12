/** Cheap Levenshtein distance with an early cutoff. */
export function editDistance(a, b, max = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** True when `text` contains a word close enough to `query` (typo tolerant). */
export function fuzzyContains(text, query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return true;
  const words = String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const limit = q.length >= 8 ? 3 : q.length >= 5 ? 2 : 1;
  return words.some((word) => word.includes(q) || q.includes(word) || editDistance(word, q, limit) <= limit);
}
