import { useEffect, useState } from 'react';
import { getOCRanks } from './adminAccounts';

let cache = [];
let fetched = false;
const listeners = new Set();

function publish(next) {
  cache = next;
  listeners.forEach((fn) => fn(next));
}

/** Public Shiny O/C ranking, fetched once and kept in sync after an admin edit. */
export function useOCRanks() {
  const [ranks, setRanks] = useState(cache);
  useEffect(() => {
    listeners.add(setRanks);
    if (!fetched) {
      fetched = true;
      getOCRanks().then(publish).catch(() => {});
    }
    return () => listeners.delete(setRanks);
  }, []);
  return ranks;
}

export async function refreshOCRanks() {
  publish(await getOCRanks());
}
