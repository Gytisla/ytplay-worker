import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const videoId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const days = Math.min(365, Math.max(1, parseInt(query.days as string || '30', 10)))

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

    // First, get the internal video UUID from the YouTube video ID
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id')
      .eq('youtube_video_id', videoId)
      .single()

    if (videoError || !video) {
      console.error('Video lookup error:', videoError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Video not found'
      })
    }

    const internalVideoId = video.id

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get video stats for the date range
    const { data: stats, error: statsError } = await supabase
      .from('video_stats')
      .select(`
        date,
        hour,
        view_count,
        like_count,
        comment_count,
        share_count,
        view_gained,
        estimated_minutes_watched
      `)
      .eq('video_id', internalVideoId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('hour', { ascending: true })

    if (statsError) {
      console.error('Video stats fetch error:', statsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch video stats'
      })
    }

    // Group stats by date/hour (for today show hourly, otherwise daily)
    const isTodayView = days === 1
    const statsData = isTodayView ? groupByHour(stats) : groupByDay(stats)

    // Convert to array and sort
    const formattedStats = Object.values(statsData).sort((a: any, b: any) => {
      const aTime = new Date(`${a.date}${a.hour ? ` ${a.hour}:00:00` : ''}`).getTime()
      const bTime = new Date(`${b.date}${b.hour ? ` ${b.hour}:00:00` : ''}`).getTime()
      return aTime - bTime
    })

    return {
      videoId,
      days,
      stats: formattedStats,
      summary: calculateSummary(formattedStats, isTodayView),
      isTodayView
    }

  } catch (error) {
    console.error('Video stats API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch video stats'
    })
  }
})

function groupByDay(stats: any[]) {
  return stats.reduce((acc: any, stat: any) => {
    const dateKey = stat.date
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: stat.date,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        viewGained: 0,
        minutesWatched: 0
      }
    }

    // Take the maximum values for the day (since each record contains cumulative totals)
    acc[dateKey].views = Math.max(acc[dateKey].views, stat.view_count || 0)
    acc[dateKey].likes = Math.max(acc[dateKey].likes, stat.like_count || 0)
    acc[dateKey].comments = Math.max(acc[dateKey].comments, stat.comment_count || 0)
    acc[dateKey].shares = Math.max(acc[dateKey].shares, stat.share_count || 0)
    acc[dateKey].viewGained = Math.max(acc[dateKey].viewGained, stat.view_gained || 0)
    acc[dateKey].minutesWatched = Math.max(acc[dateKey].minutesWatched, stat.estimated_minutes_watched || 0)

    return acc
  }, {})
}

function groupByHour(stats: any[]) {
  return stats.reduce((acc: any, stat: any) => {
    const hourKey = `${stat.date}_${stat.hour}`
    acc[hourKey] = {
      date: stat.date,
      hour: stat.hour,
      views: stat.view_count || 0,
      likes: stat.like_count || 0,
      comments: stat.comment_count || 0,
      shares: stat.share_count || 0,
      viewGained: stat.view_gained || 0,
      minutesWatched: stat.estimated_minutes_watched || 0
    }
    return acc
  }, {})
}

function calculateSummary(stats: any[], isTodayView: boolean = false) {
  if (stats.length === 0) return null

  const latest = stats[stats.length - 1]
  const previous = stats.length > 1 ? stats[stats.length - 2] : null

  // For today view, calculate changes differently (hourly vs daily)
  const viewChange = previous ? latest.views - previous.views : 0
  const likeChange = previous ? latest.likes - previous.likes : 0
  const commentChange = previous ? latest.comments - previous.comments : 0

  return {
    currentViews: latest.views,
    currentLikes: latest.likes,
    currentComments: latest.comments,
    viewChange,
    likeChange,
    commentChange,
    totalViewGained: stats.reduce((sum, s) => sum + s.viewGained, 0),
    totalMinutesWatched: stats.reduce((sum, s) => sum + s.minutesWatched, 0),
    avgMinutesWatched: stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.minutesWatched, 0) / stats.length) : 0
  }
}