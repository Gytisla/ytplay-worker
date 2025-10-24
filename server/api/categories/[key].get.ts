import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event: any) => {
  // Get runtime config
  const config = useRuntimeConfig()

  // Create admin client for server-side
  const supabase = createClient(
    config.public.supabase.url as string,
    config.supabaseServiceKey as string
  )
  const categoryKey = getRouterParam(event, 'key')
  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string || '1', 10))
  const limit = Math.min(50, Math.max(12, parseInt(query.limit as string || '24', 10)))
  const offset = (page - 1) * limit
  const sort = query.sort as string || 'new'
  const period = query.period as string || 'all'

  if (!categoryKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category key is required'
    })
  }

  try {
    // Get category details
    const { data: category, error: categoryError } = await supabase
      .from('video_categories')
      .select('*')
      .eq('key', categoryKey)
      .single()

    if (categoryError || !category) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category not found'
      })
    }

    // Get total video count for this category (with period filter if needed)
    let countQuery = supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)

    if (period !== 'all') {
      const days = parseInt(period)
      const dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - days)
      countQuery = countQuery.gte('published_at', dateFilter.toISOString())
    }

    const { count: totalCount } = await countQuery

    // Get paginated videos for this category
    let videosQuery = supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        slug,
        title,
        description,
        published_at,
        duration,
        view_count,
        thumbnail_url,
        live_broadcast_content,
        channels!inner (
          id,
          slug,
          youtube_channel_id,
          title,
          thumbnail_url,
          subscriber_count
        )
      `)
      .eq('category_id', category.id)

    // Apply period filter
    if (period !== 'all') {
      const days = parseInt(period)
      const dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - days)
      videosQuery = videosQuery.gte('published_at', dateFilter.toISOString())
    }

    // Apply sorting
    if (sort === 'popular') {
      videosQuery = videosQuery.order('view_count', { ascending: false })
    } else {
      videosQuery = videosQuery.order('published_at', { ascending: false })
    }

    videosQuery = videosQuery.range(offset, offset + limit - 1)

    const { data: videos, error: videosError } = await videosQuery

    if (videosError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch videos: ${videosError.message}`
      })
    }

    return {
      category,
      videos: (videos || []).map((video: any) => ({
        id: video.youtube_video_id,
        slug: video.slug,
        title: video.title,
        thumbnail: video.thumbnail_url,
        duration: formatDuration(video.duration),
        views: formatViewCount(video.view_count),
        uploaded: formatUploadDate(video.published_at),
        age: formatAge(video.published_at),
        channel: (video.channels as any)?.title || 'Unknown',
        channelThumb: (video.channels as any)?.thumbnail_url,
        channelSlug: (video.channels as any)?.slug,
        channelId: (video.channels as any)?.id,
        live_broadcast_content: video.live_broadcast_content
      })),
      total_count: totalCount || 0,
      page,
      limit,
      has_more: (totalCount || 0) > offset + limit
    }
  } catch (error) {
    console.error('Category detail API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

function formatAge(d: Date | string) {
  if (!d) return 'now'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return 'now'
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (hours < 1) return 'now'
  if (hours < 24) return `${hours}h`
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  return `${years}y`
}

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

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

function formatViewCount(count: number | null): string {
  if (!count) return '0'

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

function formatUploadDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}