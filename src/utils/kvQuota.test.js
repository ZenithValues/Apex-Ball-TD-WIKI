import { beforeEach, describe, expect, it } from 'vitest';
import {
  KV_DAILY_WRITE_LIMIT,
  WRITE_COST,
  noteWrites,
  quotaState,
  quotaResetAt,
  formatResetIn,
  msUntilReset,
  isQuotaFailure,
  resetQuotaMeter,
} from './kvQuota.js';

// A tiny localStorage stub — the meter must work without a browser.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
});

describe('kvQuota meter', () => {
  it('starts empty', () => {
    const state = quotaState();
    expect(state.used).toBe(0);
    expect(state.remaining).toBe(KV_DAILY_WRITE_LIMIT);
    expect(state.level).toBe('ok');
  });

  it('counts the writes a publish actually cost', () => {
    noteWrites(4);
    expect(quotaState().used).toBe(4);
    noteWrites(6, { publishes: 1 });
    expect(quotaState().used).toBe(10);
    expect(quotaState().publishes).toBe(2);
  });

  it('falls back to the default row cost when the worker does not report writes', () => {
    noteWrites(undefined);
    expect(quotaState().used).toBe(WRITE_COST.row);
  });

  it('warns at 80% and reports exhausted at 100%', () => {
    noteWrites(KV_DAILY_WRITE_LIMIT * 0.8);
    expect(quotaState().level).toBe('warning');
    noteWrites(KV_DAILY_WRITE_LIMIT * 0.2);
    expect(quotaState().level).toBe('exhausted');
    expect(quotaState().remaining).toBe(0);
  });

  it('never reports negative remaining', () => {
    noteWrites(KV_DAILY_WRITE_LIMIT * 3);
    expect(quotaState().remaining).toBe(0);
    expect(quotaState().percent).toBe(100);
  });

  it('resets at the next midnight UTC', () => {
    const now = new Date('2026-11-12T22:30:00.000Z');
    expect(quotaResetAt(now).toISOString()).toBe('2026-11-13T00:00:00.000Z');
    expect(msUntilReset(now)).toBe(90 * 60 * 1000);
    expect(formatResetIn(now)).toBe('1h 30m');
    expect(formatResetIn(new Date('2026-11-12T23:59:40.000Z'))).toBe('less than a minute');
    expect(formatResetIn(new Date('2026-11-12T23:20:00.000Z'))).toBe('40m');
  });

  it('recognises a quota refusal from the worker', () => {
    expect(isQuotaFailure({ code: 'kv_put_quota' })).toBe(true);
    expect(isQuotaFailure({ error: 'KV Write Failed: KV put() limit exceeded for the day.' })).toBe(true);
    expect(isQuotaFailure({ error: 'Something else broke' })).toBe(false);
    expect(isQuotaFailure(null)).toBe(false);
  });

  it('resetQuotaMeter zeroes today', () => {
    noteWrites(50);
    resetQuotaMeter();
    expect(quotaState().used).toBe(0);
  });
});
