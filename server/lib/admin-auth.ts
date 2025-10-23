import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../src/lib/supabase'

/**
 * Authenticates and authorizes admin access for API routes
 * @param event - The H3 event object
 * @throws Error with appropriate status code if authentication/authorization fails
 */
export async function requireAdminAuth(event: any) {
  // Get the Supabase client with user session
  const supabase = await serverSupabaseClient(event)

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Authentication required'
    })
  }

  // Check if user is admin
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required'
    })
  }

  // Return the authenticated user and their profile for convenience
  return { user, profile }
}