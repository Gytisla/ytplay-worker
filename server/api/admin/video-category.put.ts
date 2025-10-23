import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

  // Get request body
  const body = await readBody(event)

  // Validate required fields
  if (!body.videoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required field: videoId'
    })
  }

  // Update the video's category
  const { error: updateError } = await supabase
    .from('videos')
    .update({
      category_id: body.categoryId || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', body.videoId)

  if (updateError) {
    console.error('Error updating video category:', updateError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update video category'
    })
  }

  return {
    success: true,
    message: 'Video category updated successfully'
  }
})