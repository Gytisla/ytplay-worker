import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

// Server-side Supabase client (has admin privileges)
// Only available on server-side
let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin can only be used on the server side')
  }

  if (!supabaseAdminClient) {
    const supabaseUrl = process.env['SUPABASE_URL']
    const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

// For backward compatibility - this will be the Nuxt Supabase client on client side
// On server side, this creates a regular client (not admin)
export const supabaseClient = createClient<Database>(
  process.env['SUPABASE_URL'] || 'http://localhost:54321',
  process.env['SUPABASE_ANON_KEY'] || ''
)

// For backward compatibility
export const supabaseAdmin = getSupabaseAdmin()

// Helper function to get the appropriate client based on context
export function getSupabaseClient(server = false) {
  return server ? getSupabaseAdmin() : supabaseClient
}