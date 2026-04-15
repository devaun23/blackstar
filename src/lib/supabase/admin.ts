import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Timing-safe admin key verification.
 * Prevents timing attacks on the x-admin-key header comparison.
 */
export function verifyAdminKey(headerValue: string | null): boolean {
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!headerValue || !expected) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerValue),
      Buffer.from(expected),
    );
  } catch {
    return false; // Different lengths
  }
}

// Service role client — bypasses RLS for factory writes
// NEVER expose this client to the browser
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
