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
  const { userId, role } = body

  if (!userId || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: userId and role'
    })
  }

  // Validate role
  if (!['user', 'moderator', 'admin'].includes(role)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role. Must be user, moderator, or admin'
    })
  }

  // Prevent changes to main admin user
  const { data: targetUser } = await supabase
    .from('user_profiles')
    .select('auth_user_id')
    .eq('id', userId)
    .single()

  if (targetUser?.auth_user_id === '46f41081-c641-4cf8-a2ec-96fa9a0fd249') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot modify the main admin user'
    })
  }

  // Update user role
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { success: true }
})