import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = (query.type as string) || 'live' // 'live' or 'upcoming'
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string || '24', 10)))
  const offset = Math.max(0, parseInt(query.offset as string || '0', 10))

  // Get runtime config
  const config = useRuntimeConfig()

  // Create admin client for server-side
  const supabase = createClient(
    config.public.supabase.url as string,
    config.supabaseServiceKey as string
  )

  // Determine the broadcast content type
  const broadcastContent = type === 'live' ? 'live' : 'upcoming'

  // Build the query
  let dbQuery = supabase
    .from('videos')
    .select(`
      id,
      youtube_video_id,
      slug,
      title,
      thumbnail_url,
      published_at,
      view_count,
      duration,
      live_broadcast_content,
      category_id,
      channels!inner(
        id,
        slug,
        title,
        thumbnail_url
      ),
      video_categories(
        id,
        name,
        key,
        color,
        icon
      )
    `)
    .eq('live_broadcast_content', broadcastContent)

  // For upcoming videos, skip those older than a month
  if (broadcastContent === 'upcoming') {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    dbQuery = dbQuery.gt('published_at', oneMonthAgo)
  }

  const { data: videos, error } = await dbQuery
    .order(type === 'live' ? 'view_count' : 'published_at', { ascending: false }) // Live: by views desc, Upcoming: by date desc
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching live/upcoming videos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch videos'
    })
  }

  // Transform the data to match the expected format
  const transformedVideos = videos?.map((video: any) => ({
    id: video.id,
    youtube_video_id: video.youtube_video_id,
    slug: video.slug,
    title: video.title,
    thumb: video.thumbnail_url,
    duration: video.duration,
    channel: video.channels?.title || 'Unknown',
    channelThumb: video.channels?.thumbnail_url,
    channelSlug: video.channels?.slug,
    channelId: video.channels?.id,
    views: video.view_count,
    age: formatAge(new Date(video.published_at)),
    category: video.video_categories ? {
        id: video.video_categories.id,
        name: video.video_categories.name,
        key: video.video_categories.key,
        color: video.video_categories.color,
        icon: video.video_categories.icon
    } : null,
    category_id: video.category_id,
    live_broadcast_content: video.live_broadcast_content
  })) || []

  // Get total count for pagination
  let countQuery = supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('live_broadcast_content', broadcastContent)

  // Apply the same filter for upcoming videos
  if (broadcastContent === 'upcoming') {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    countQuery = countQuery.gt('published_at', oneMonthAgo)
  }

  const { count, error: countError } = await countQuery

  if (countError) {
    console.error('Error getting video count:', countError)
  }

  return {
    videos: transformedVideos,
    hasMore: (count || 0) > offset + limit,
    total: count || 0
  }
})

function formatAge(d: Date) {
  const diff = Date.now() - d.getTime()
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