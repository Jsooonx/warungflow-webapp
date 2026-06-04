import { supabase, requireSupabaseConfig } from '../lib/supabaseClient';

export const signInWithEmail = async (email: string, password: string) => {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
      emailRedirectTo: `${window.location.origin}${window.location.pathname}?auth=confirm`,
    },
  });
  if (error) throw error;
  if (data.session) {
    await supabase.auth.signOut();
  }
  return data;
};

export const sendPasswordReset = async (email: string) => {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${window.location.pathname}`,
  });
  if (error) throw error;
  return data;
};

export const updateCurrentUserPassword = async (password: string) => {
  requireSupabaseConfig();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  requireSupabaseConfig();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
