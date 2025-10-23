import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../../src/lib/supabase'

export default defineEventHandler(async (event) => {
  // Get the Supabase admin client for admin operations
  const supabase = getSupabaseAdmin()

  // Get current user for authorization check only
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: userError } = await client.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
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