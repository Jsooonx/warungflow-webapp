import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return sessionStorage.getItem('wa_order_manager_password_recovery') === 'true';
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      setAuthError('Supabase env belum dikonfigurasi.');
      return;
    }

    let isMounted = true;
    const searchParams = new URLSearchParams(window.location.search);
    const isEmailConfirmRedirect =
      searchParams.get('auth') === 'confirm' ||
      window.location.hash.includes('type=signup') ||
      window.location.hash.includes('type=email');

    if (isEmailConfirmRedirect) {
      sessionStorage.setItem('warungflow_email_confirm_redirect', 'true');
    }

    const finishEmailConfirmRedirect = async () => {
      sessionStorage.removeItem('warungflow_email_confirm_redirect');
      await supabase.auth.signOut();
      window.history.replaceState(null, '', `${window.location.pathname}#/login`);
      if (!isMounted) return;
      setSession(null);
      setUser(null);
      setIsAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setAuthError(error.message);
      }
      if (data.session && sessionStorage.getItem('warungflow_email_confirm_redirect') === 'true') {
        void finishEmailConfirmRedirect();
        return;
      }
      setSession(data.session);
      setUser(data.session?.user || null);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('wa_order_manager_password_recovery', 'true');
        setIsPasswordRecovery(true);
        window.location.hash = '/login?mode=reset';
      }
      if (event === 'SIGNED_IN' && nextSession && sessionStorage.getItem('warungflow_email_confirm_redirect') === 'true') {
        void finishEmailConfirmRedirect();
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user || null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    isAuthenticated: Boolean(session?.user),
    isPasswordRecovery,
    clearPasswordRecovery: () => {
      sessionStorage.removeItem('wa_order_manager_password_recovery');
      setIsPasswordRecovery(false);
    },
    isAuthLoading,
    authError,
  };
};
