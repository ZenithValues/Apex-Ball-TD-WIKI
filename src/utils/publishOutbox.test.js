import { beforeEach, describe, expect, it } from 'vitest';
import {
  enqueuePublish,
  listPublishes,
  outboxSize,
  removePublish,
  clearOutbox,
  asBatchEntries,
} from './publishOutbox.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => store.clear());

describe('publish outbox', () => {
  it('keeps a failed publish across a reload', () => {
    enqueuePublish({ section: 'value', slug: 'ball', row: { base_value: 5 }, reason: 'kv_put_quota' });
    expect(outboxSize()).toBe(1);
    const [entry] = listPublishes();
    expect(entry.slug).toBe('ball');
    expect(entry.reason).toBe('kv_put_quota');
  });

  it('merges a re-queued row instead of duplicating it', () => {
    enqueuePublish({ section: 'value', slug: 'ball', row: { base_value: 5 } });
    enqueuePublish({ section: 'value', slug: 'ball', row: { base_value: 9 } });
    expect(outboxSize()).toBe(1);
    expect(listPublishes()[0].row.base_value).toBe(9);
  });

  it('tracks sections independently', () => {
    enqueuePublish({ section: 'value', slug: 'ball', row: { base_value: 5 } });
    enqueuePublish({ section: 'wiki', slug: 'ball', row: { description: 'x' } });
    expect(outboxSize()).toBe(2);
  });

  it('removes one entry after a successful publish', () => {
    enqueuePublish({ section: 'value', slug: 'ball', row: {} });
    enqueuePublish({ section: 'wiki', slug: 'ball', row: {} });
    removePublish('value', 'ball');
    expect(outboxSize()).toBe(1);
    expect(listPublishes()[0].section).toBe('wiki');
  });

  it('builds the batch payload from the queue', () => {
    enqueuePublish({ section: 'value', slug: 'a', row: { base_value: 1 } });
    enqueuePublish({ section: 'value', slug: 'b', patch: { base_value: 2 } });
    const entries = asBatchEntries();
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.slug).sort()).toEqual(['a', 'b']);
    expect(entries.every((entry) => entry.row && typeof entry.row === 'object')).toBe(true);
  });

  it('ignores rows without a slug and clears on demand', () => {
    enqueuePublish({ section: 'value', slug: '', row: {} });
    expect(outboxSize()).toBe(0);
    enqueuePublish({ section: 'value', slug: 'a', row: {} });
    clearOutbox();
    expect(outboxSize()).toBe(0);
  });

  it('drops entries older than a week', () => {
    enqueuePublish({ section: 'value', slug: 'old', row: {} });
    const raw = JSON.parse(store.get('apex-publish-outbox-v1'));
    raw[0].at = Date.now() - 8 * 24 * 60 * 60 * 1000;
    store.set('apex-publish-outbox-v1', JSON.stringify(raw));
    expect(outboxSize()).toBe(0);
  });
});
