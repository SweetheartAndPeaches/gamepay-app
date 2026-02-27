import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseCredentials {
  url: string;
  serviceKey: string;
}

function getSupabaseCredentials(): SupabaseCredentials {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Please check your .env.local file.\n' +
      'Example: NEXT_PUBLIC_SUPABASE_URL=https://eplavqbtysmknzdcbgbq.supabase.co'
    );
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Please check your .env.local file.\n' +
      'Example: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here'
    );
  }

  return { url, serviceKey };
}

export function getSupabaseClient(token?: string): SupabaseClient {
  const { url, serviceKey } = getSupabaseCredentials();

  if (token) {
    return createClient(url, serviceKey, {
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

  return createClient(url, serviceKey, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
