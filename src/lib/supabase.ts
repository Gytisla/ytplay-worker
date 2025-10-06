import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

function requireEnv(key: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_ANON_KEY'): string {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const supabaseUrl = requireEnv('SUPABASE_URL')
const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY')

// Server-side Supabase client (has admin privileges)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Client-side Supabase client (limited to RLS policies)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function to get the appropriate client based on context
export function getSupabaseClient(server = false) {
  return server ? supabaseAdmin : supabaseClient
}