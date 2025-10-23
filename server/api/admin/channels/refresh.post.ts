import { getSupabaseAdmin } from '../../../../src/lib/supabase'
import { requireAdminAuth } from '../../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

  const body = await readBody(event)
  const { channelId } = body

  if (!channelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Channel ID is required'
    })
  }

  try {
    // Get channel details
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('youtube_channel_id')
      .eq('id', channelId)
      .single()

    if (channelError || !channel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }

    // Trigger channel refresh by enqueuing a job
    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        job_type: 'REFRESH_CHANNEL_STATS',
        payload: { channel_id: channel.youtube_channel_id },
        status: 'pending',
        priority: 1
      })

    if (jobError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to enqueue refresh job'
      })
    }

    return { success: true, message: 'Channel refresh queued successfully' }
  } catch (error) {
    console.error('Error refreshing channel:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to refresh channel'
    })
  }
})