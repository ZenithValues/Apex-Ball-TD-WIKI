// ROLE GATES - entry-safe module. The public entry graph (useAdminStatus,
// DataContext) imports role checks from here so utils/adminForms - and the
// generated value datasets it pulls in - stay out of the initial bundle.
// utils/adminForms re-exports these symbols for existing admin callers.

export const VALUE_ROLES = ['owner', 'admin_plus', 'admin', 'lead_value_editor', 'value_editor', 'editor'];
export const WIKI_ROLES = ['owner', 'admin_plus', 'admin', 'lead_wiki_editor', 'wiki_editor', 'editor'];
export const FANART_ROLES = ['owner', 'admin_plus', 'admin', 'fanart_editor', 'editor'];

export function canEditValue(role) {
  if (!role) return false;
  return VALUE_ROLES.includes(role.toLowerCase());
}

export function canEditWiki(role) {
  if (!role) return false;
  return WIKI_ROLES.includes(role.toLowerCase());
}

export function canEditFanart(role) {
  if (!role) return false;
  return FANART_ROLES.includes(role.toLowerCase());
}
