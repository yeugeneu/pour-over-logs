import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabaseClient';

export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase is not configured. Please enter your project credentials.') };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { error };
}

export async function signInWithApple(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase is not configured. Please enter your project credentials.') };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { error };
}

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase is not configured. Please enter your project credentials.') };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error };
}

export async function signOut(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}
