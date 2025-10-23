import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

  // Get all video categories
  const { data: categories, error } = await supabase
    .from('video_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return { categories }
})