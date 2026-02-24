import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function getSupabaseCredentials(): SupabaseCredentials {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your .env.local file.\n' +
      'Example: NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co'
    );
  }
  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your .env.local file.\n' +
      'Example: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here'
    );
  }

  return { url, anonKey };
}

export function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, anonKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
