import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const videoId = getRouterParam(event, 'id')

  if (!videoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Video ID is required'
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

    // Get video details with channel info
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        thumbnail_url,
        duration,
        view_count,
        published_at,
        channel_id,
        channels!inner (
          id,
          slug,
          youtube_channel_id,
          title,
          thumbnail_url,
          subscriber_count
        )
      `)
      .eq('youtube_video_id', videoId)
      .single()

    if (videoError) {
      console.error('Video fetch error:', videoError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Video not found'
      })
    }

    // Format the response
    const formattedVideo = {
      id: video.youtube_video_id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail_url,
      duration: formatDuration(video.duration),
      views: formatViewCount(video.view_count),
      uploaded: formatUploadDate(video.published_at),
      publishedAt: video.published_at, // Raw date for date calculations
      channel: {
        id: video.channels.id,
        slug: video.channels.slug,
        youtubeId: video.channels.youtube_channel_id,
        name: video.channels.title,
        avatar: video.channels.thumbnail_url,
        subscribers: formatSubscriberCount(video.channels.subscriber_count)
      }
    }

    return formattedVideo

  } catch (error) {
    console.error('Video API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch video'
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
  return count.toString()
}

function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
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