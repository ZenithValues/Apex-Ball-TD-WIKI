export function decodeRouteParam(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
