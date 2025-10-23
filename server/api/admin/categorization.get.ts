import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

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