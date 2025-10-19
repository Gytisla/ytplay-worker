import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const channelId = getRouterParam(event, 'id')
  const query = getQuery(event)

  if (!channelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Channel ID is required'
    })
  }

  const limit = Math.min(parseInt(query.limit as string) || 24, 50) // Max 50 videos
  const offset = Math.max(parseInt(query.offset as string) || 0, 0) // Start from offset
  const sort = (query.sort as string) || 'new' // 'new' or 'popular'

  try {
    // Create Supabase client with service role for server-side queries
    const supabase = createClient(
      config.public.supabase.url,
      config.supabaseServiceKey,
      {
        auth: { persistSession: false }
      }
    )

    // First, resolve the channel ID from either UUID or slug
    let channel: any = null
    let channelError: any = null

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channelId)

    if (isUUID) {
      // Try by ID first if it looks like a UUID
      const result = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelId)
        .single()
      channel = result.data
      channelError = result.error
    }

    // If not found by ID (or not a UUID), try by slug
    if ((!channel && !channelError) || (channelError && channelError.code === 'PGRST116')) {
      const { data: channelBySlug, error: slugError } = await supabase
        .from('channels')
        .select('id')
        .eq('slug', channelId)
        .single()

      if (!slugError && channelBySlug) {
        channel = channelBySlug
        channelError = null
      } else if (!channel) {
        channelError = slugError
      }
    }

    if (channelError || !channel) {
      console.error('Channel lookup error:', channelError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Channel not found'
      })
    }

    const resolvedChannelId = channel.id

    // Get channel videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        slug,
        title,
        description,
        thumbnail_url,
        duration,
        view_count,
        published_at
      `)
      .eq('channel_id', resolvedChannelId)
      .order(sort === 'popular' ? 'view_count' : 'published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (videosError) {
      console.error('Channel videos fetch error:', videosError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch channel videos'
      })
    }

    // Format the response
    const formattedVideos = (videos || []).map(video => {
      return {
        id: video.youtube_video_id,
        slug: video.slug,
        title: video.title,
        thumbnail: video.thumbnail_url,
        duration: formatDuration(video.duration),
        views: formatViewCount(video.view_count),
        uploaded: formatUploadDate(video.published_at)
      }
    })

    return {
      videos: formattedVideos,
      total: formattedVideos.length,
      offset,
      limit,
      hasMore: formattedVideos.length === limit
    }

  } catch (error) {
    console.error('Channel videos API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch channel videos'
    })
  }
})

function formatDuration(duration: any): string {
  // Handle PostgreSQL INTERVAL type
  if (!duration) return '0:00'

  // If it's already a number (seconds), use it directly
  if (typeof duration === 'number') {
    return formatSeconds(duration)
  }

  // If it's a string, try to parse it
  if (typeof duration === 'string') {
    // Parse ISO 8601 duration like "PT4M13S"
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (match) {
      const hours = parseInt(match[1] || '0')
      const minutes = parseInt(match[2] || '0')
      const seconds = parseInt(match[3] || '0')
      const totalSeconds = hours * 3600 + minutes * 60 + seconds
      return formatSeconds(totalSeconds)
    }

    // Try parsing as "HH:MM:SS" format
    const timeMatch = duration.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
    if (timeMatch && timeMatch[1] && timeMatch[2] && timeMatch[3]) {
      const hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[2])
      const seconds = parseInt(timeMatch[3])
      return formatSeconds(hours * 3600 + minutes * 60 + seconds)
    }

    // Try parsing as "MM:SS" format
    const shortMatch = duration.match(/^(\d{1,2}):(\d{2})$/)
    if (shortMatch && shortMatch[1] && shortMatch[2]) {
      const minutes = parseInt(shortMatch[1])
      const seconds = parseInt(shortMatch[2])
      return formatSeconds(minutes * 60 + seconds)
    }
  }

  // If it's an object (PostgreSQL interval object), try to extract values
  if (typeof duration === 'object' && duration !== null) {
    const hours = duration.hours || 0
    const minutes = duration.minutes || 0
    const seconds = duration.seconds || 0
    return formatSeconds(hours * 3600 + minutes * 60 + seconds)
  }

  return '0:00'
}

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count?.toString()
}

function formatUploadDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) // Use floor instead of ceil

  if (diffDays === 0) {
    return 'today'
  } else if (diffDays === 1) {
    return '1 day ago'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    if (weeks === 1) {
      return '1 week ago'
    }
    return `${weeks} weeks ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    if (months === 1) {
      return '1 month ago'
    }
    return `${months} months ago`
  } else {
    const years = Math.floor(diffDays / 365)
    if (years === 1) {
      return '1 year ago'
    }
    return `${years} years ago`
  }
}