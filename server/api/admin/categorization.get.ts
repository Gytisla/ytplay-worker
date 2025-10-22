import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../../src/lib/supabase'

export default defineEventHandler(async (event) => {
  // Get the Supabase client with user session
  const supabase = await serverSupabaseClient(event)

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
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

  // Get all categorization rules with category info
  const { data: rules, error } = await supabase
    .from('categorization_rules')
    .select(`
      *,
      video_categories (
        id,
        name,
        key
      )
    `)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { rules: rules || [] }
})