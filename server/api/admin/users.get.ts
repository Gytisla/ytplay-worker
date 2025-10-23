import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

  // Get all users
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { users }
})