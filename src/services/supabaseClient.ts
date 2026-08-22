import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  CUSTOM_URL: 'brewlog_supabase_url',
  CUSTOM_ANON_KEY: 'brewlog_supabase_anon_key',
};

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  let customUrl = '';
  let customAnonKey = '';
  if (typeof window !== 'undefined') {
    customUrl = localStorage.getItem(STORAGE_KEYS.CUSTOM_URL) || '';
    customAnonKey = localStorage.getItem(STORAGE_KEYS.CUSTOM_ANON_KEY) || '';
  }

  const url = customUrl || envUrl;
  const anonKey = customAnonKey || envAnonKey;
  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));

  return { url, anonKey, isConfigured };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEYS.CUSTOM_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEYS.CUSTOM_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEYS.CUSTOM_ANON_KEY);

    // Re-initialize client
    reinitializeSupabaseClient();
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function reinitializeSupabaseClient(): SupabaseClient | null {
  supabaseInstance = null;
  return getSupabase();
}
