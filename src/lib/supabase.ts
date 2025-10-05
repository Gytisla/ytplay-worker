import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

// Server-side Supabase client (has admin privileges)
export const supabaseAdmin = createClient<Database>(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Client-side Supabase client (limited to RLS policies)
export const supabaseClient = createClient<Database>(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_ANON_KEY']!
)

// Helper function to get the appropriate client based on context
export function getSupabaseClient(server = false) {
  return server ? supabaseAdmin : supabaseClient
}