/**
 * Webhook System — verified & sanitized external change notifications.
 * Security guards:
 *  - Rejects non-HTTPS, localhost, private/link-local IPs, and invalid URLs.
 *  - Restricts Discord hooks to official discord.com/discordapp.com webhook paths.
 *  - Strips sensitive fields and neutralizes mass-mention pings before dispatch.
 */

const WEBHOOK_KEY = 'apex-webhooks-v1';
const DISCORD_HOOK_RE = /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d{17,22}\/[A-Za-z0-9_-]{40,}$/;
const SENSITIVE_KEY_RE = /(?:passcode|password|token|secret|webhook|email|authorization|cookie|apikey|api_key|credential)/i;

function isPrivateOrLocalHost(hostname) {
  const h = String(hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80:')) return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [, a, b] = ipv4.map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function validateWebhookUrl(rawUrl) {
  try {
    const u = new URL(String(rawUrl || '').trim());
    if (u.protocol !== 'https:') return { ok: false, reason: 'HTTPS is required' };
    if (u.username || u.password) return { ok: false, reason: 'Embedded credentials are not allowed' };
    if (isPrivateOrLocalHost(u.hostname)) return { ok: false, reason: 'Private or local hosts are blocked' };
    if (/(?:^|\.)discord(?:app)?\.com$/i.test(u.hostname) && !DISCORD_HOOK_RE.test(u.href)) {
      return { ok: false, reason: 'Invalid Discord webhook format' };
    }
    return { ok: true, url: u.href, isDiscord: DISCORD_HOOK_RE.test(u.href) };
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
}

export function scrubText(value) {
  return String(value ?? '')
    .replace(/@(everyone|here)/gi, '@ $1')
    .replace(/<@[!&]?\d+>/g, '[mention]')
    .replace(/https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/[^\s)\]]+/gi, '[REDACTED-WEBHOOK]');
}

export function sanitizeWebhookPayload(value, depth = 0) {
  if (depth > 5) return '[truncated]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return scrubText(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeWebhookPayload(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEY_RE.test(k)) continue;
      out[k] = sanitizeWebhookPayload(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function loadWebhooks() {
  try {
    const raw = localStorage.getItem(WEBHOOK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((h) => validateWebhookUrl(h?.url).ok) : [];
  } catch { return []; }
}

export function saveWebhooks(hooks) {
  try {
    const clean = (Array.isArray(hooks) ? hooks : []).filter((h) => validateWebhookUrl(h?.url).ok);
    localStorage.setItem(WEBHOOK_KEY, JSON.stringify(clean));
  } catch { /* ignore */ }
}

export function addWebhook(url, events = ['value_change', 'wiki_change']) {
  const check = validateWebhookUrl(url);
  if (!check.ok) throw new Error(check.reason);
  const hooks = loadWebhooks();
  hooks.push({ url: check.url, events, id: Date.now() });
  saveWebhooks(hooks);
}

export function removeWebhook(id) {
  const hooks = loadWebhooks().filter((h) => h.id !== id);
  saveWebhooks(hooks);
}

export async function triggerWebhooks(event, data) {
  const hooks = loadWebhooks().filter((h) => Array.isArray(h.events) && h.events.includes(event));
  const safeData = sanitizeWebhookPayload(data);
  const timestamp = new Date().toISOString();

  for (const hook of hooks) {
    const check = validateWebhookUrl(hook.url);
    if (!check.ok) continue;
    try {
      const body = check.isDiscord
        ? {
            username: 'Apex WIKI & Values',
            allowed_mentions: { parse: [] },
            content: scrubText(`Apex update: ${event}`),
            embeds: [{ title: scrubText(String(event)), description: scrubText(JSON.stringify(safeData).slice(0, 1800)), timestamp }],
          }
        : { event: scrubText(event), data: safeData, timestamp };

      await fetch(check.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      console.warn('Webhook delivery failed (endpoint details redacted).');
    }
  }
}
