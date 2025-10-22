import { getSupabaseAdmin } from '../../../../src/lib/supabase'

export default defineEventHandler(async (event) => {
  // Check if user is authenticated and is admin
  const supabase = getSupabaseAdmin()

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required'
    })
  }

  // Get request body
  const body = await readBody(event)
  const { userId, isActive } = body

  if (!userId || typeof isActive !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userId and isActive'
    })
  }

  // Update user status
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { success: true }
})