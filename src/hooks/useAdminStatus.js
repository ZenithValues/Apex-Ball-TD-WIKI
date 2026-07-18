import { useEffect, useState } from 'react';
import { isMissingTableError, supabase } from '../utils/supabase';

const ADMIN_ROLES = new Set(['owner', 'admin', 'value_editor', 'wiki_editor', 'editor']);

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role);
}

export function useAdminStatus() {
  const [state, setState] = useState({ loading: true, isAdmin: false, role: null, email: null });

  useEffect(() => {
    let mounted = true;

    async function check(session) {
      const email = session?.user?.email?.toLowerCase() || null;
      if (!email) {
        if (mounted) setState({ loading: false, isAdmin: false, role: null, email: null });
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .maybeSingle();

      if (!mounted) return;
      if (error && !isMissingTableError(error)) {
        setState({ loading: false, isAdmin: false, role: null, email });
        return;
      }

      const role = data?.role || null;
      setState({ loading: false, isAdmin: isAdminRole(role), role, email });
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => check(session));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
