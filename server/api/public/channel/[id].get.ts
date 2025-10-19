import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const channelId = getRouterParam(event, 'id')

  if (!channelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Channel ID is required'
    })
  }

  try {
    // Create Supabase client with service role for server-side queries
    const supabase = createClient(
      config.public.supabase.url,
      config.supabaseServiceKey,
      {
        auth: { persistSession: false }
      }
    )

        // Get channel details - support both UUID and slug
    let channel: any = null
    let channelError: any = null

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelId)

    if (isUUID) {
      // Try by ID first if it looks like a UUID
      const result = await supabase
        .from('channels')
        .select(`
          id,
          slug,
          youtube_channel_id,
          title,
          description,
          thumbnail_url,
          subscriber_count,
          video_count,
          published_at
        `)
        .eq('id', channelId)
        .single()
      channel = result.data
      channelError = result.error
    }

    // If not found by ID (or not a UUID), try by slug
    if ((!channel && !channelError) || (channelError && channelError.code === 'PGRST116')) {
      const { data: channelBySlug, error: slugError } = await supabase
        .from('channels')
        .select(`
          id,
          slug,
          youtube_channel_id,
          title,
          description,
          thumbnail_url,
          subscriber_count,
          video_count,
          published_at
        `)
        .eq('slug', channelId)
        .single()

      if (!slugError && channelBySlug) {
        channel = channelBySlug
        channelError = null
      } else if (!channel) {
        channelError = slugError
      }
    }

    if (channelError) {
      console.error('Channel fetch error:', channelError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }

    // Format the response
    const formattedChannel = {
      id: channel.id,
      slug: channel.slug,
      youtubeId: channel.youtube_channel_id,
      name: channel.title,
      description: channel.description,
      avatar: channel.thumbnail_url,
      subs: formatSubscriberCount(channel.subscriber_count),
      videos: channel.video_count || 0,
      joined: formatJoinDate(channel.published_at)
    }

    return formattedChannel

  } catch (error) {
    console.error('Channel API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch channel'
    })
  }
})

function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 30) {
    return `${diffDays} days ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}