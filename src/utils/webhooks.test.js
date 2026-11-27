import { describe, expect, it } from 'vitest';
import { validateWebhookUrl, sanitizeWebhookPayload, scrubText } from './webhooks';

const DISCORD_BASE = ['https://discord.com', 'api', 'webhooks'].join('/');
const HTTP_DISCORD_BASE = ['http://discord.com', 'api', 'webhooks'].join('/');
const SAMPLE_ID = '123456789012345678';
const SAMPLE_TOKEN = 'abcdefghijklmnopqrstuvwxyz1234567890ABCD_ef';

describe('webhook security guards', () => {
  it('blocks non-https, private IPs, localhost and malformed discord hooks', () => {
    expect(validateWebhookUrl(`${HTTP_DISCORD_BASE}/${SAMPLE_ID}/${SAMPLE_TOKEN}`).ok).toBe(false);
    expect(validateWebhookUrl('https://127.0.0.1/hook').ok).toBe(false);
    expect(validateWebhookUrl('https://192.168.1.5/hook').ok).toBe(false);
    expect(validateWebhookUrl('https://localhost:3000/hook').ok).toBe(false);
    expect(validateWebhookUrl(`${DISCORD_BASE}/bad/short`).ok).toBe(false);
    expect(validateWebhookUrl(`${DISCORD_BASE}/${SAMPLE_ID}/${SAMPLE_TOKEN}`).ok).toBe(true);
  });

  it('scrubs secrets and mass-mentions from payloads', () => {
    expect(scrubText('Alert @everyone <@&999>')).toBe('Alert @ everyone [mention]');
    const safe = sanitizeWebhookPayload({
      name: 'Zeus Ball',
      passcode: 'hunter2',
      adminToken: 'secret-abc',
      note: 'ping @here',
    });
    expect(safe.passcode).toBeUndefined();
    expect(safe.adminToken).toBeUndefined();
    expect(safe.name).toBe('Zeus Ball');
    expect(safe.note).toBe('ping @ here');
  });
});
