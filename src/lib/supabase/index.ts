import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://your-project-id.supabase.co';

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

// Singleton instance for client-side usage
let clientInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the publishable key.
 * Safe for client-side and browser usage.
 */
export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) return clientInstance;

  if (!supabasePublishableKey) {
    console.warn('Notice: Supabase publishable key is not configured.');
  }

  clientInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}

/**
 * Returns a privileged Supabase client configured with the secret service key.
 * Strictly restricted to server-side route handlers and background jobs.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseSecretKey) {
    throw new Error('Supabase secret key (SUPABASE_SECRET_KEY) is not configured.');
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type { SupabaseClient };

