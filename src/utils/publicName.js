// PUBLIC UPDATE BYLINE — "updated by <display name> | <when>".
// Rules: only ever show a public display name. Staff emails are private data
// (worker strips updated_by / email; see PRIVATE_PUBLIC_KEYS), so an email is
// mapped to the roster's display name when we recognise it and otherwise the
// author is simply omitted rather than leaked.
import { TEAM_MEMBERS } from './teamMembers';

const NAME_FIELDS = ['updatedByName', 'updated_by_name', 'byName', 'by_name'];
const EMAIL_FIELDS = ['updated_by', 'updatedBy', 'changed_by', 'changedBy', 'by'];

const isEmail = (value) => typeof value === 'string' && value.includes('@');

export function publicDisplayName(row) {
  if (!row || typeof row !== 'object') return null;
  for (const field of NAME_FIELDS) {
    const value = row[field];
    if (typeof value === 'string' && value.trim() && !isEmail(value)) return value.trim();
  }
  for (const field of EMAIL_FIELDS) {
    const value = row[field];
    if (isEmail(value)) {
      const member = TEAM_MEMBERS[value.trim().toLowerCase()];
      if (member?.name) return member.name;
    }
  }
  return null;
}

/** "updated by X | 3h ago", falling back to the old wording when no name is known. */
export function updatedByline(row, updatedAt, relativeTime, { prefix = '' } = {}) {
  if (!updatedAt) return null;
  const name = publicDisplayName(row);
  return name
    ? `${prefix}updated by ${name} | ${relativeTime}`
    : `${prefix}Updated ${relativeTime}`;
}
