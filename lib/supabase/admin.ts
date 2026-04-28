import { createClient } from '@supabase/supabase-js'

/**
 * Admin client using Supabase service role key.
 * BYPASSES Row Level Security (RLS) - use only for:
 * - Server-side operations that require elevated privileges
 * - Operations where RLS would block legitimate admin actions
 * - Bulk operations and data migrations
 *
 * IMPORTANT: This client should be used sparingly. Most operations should use
 * the regular user client with RLS enabled.
 */
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
