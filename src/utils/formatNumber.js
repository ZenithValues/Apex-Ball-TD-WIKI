export function formatCompactNumber(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  const cleanDecimals = (n) => n.toFixed(decimals).replace(/\.?0+$/, '');

  if (abs >= 1e12) {
    return `${sign}${cleanDecimals(abs / 1e12)}T`;
  }
  if (abs >= 1e9) {
    return `${sign}${cleanDecimals(abs / 1e9)}B`;
  }
  if (abs >= 1e6) {
    return `${sign}${cleanDecimals(abs / 1e6)}M`;
  }
  if (abs >= 1e3) {
    return `${sign}${cleanDecimals(abs / 1e3)}K`;
  }
  return `${sign}${num.toLocaleString()}`;
}

export function formatFullNumber(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString();
}

export function formatRelativeTime(input) {
  const ts = input ? new Date(input).getTime() : NaN;
  if (!Number.isFinite(ts)) return '';
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
