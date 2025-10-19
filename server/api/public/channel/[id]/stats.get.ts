import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const channelId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const days = Math.min(365, Math.max(7, parseInt(query.days as string || '30', 10)))

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

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get channel stats for the date range
    const { data: stats, error: statsError } = await supabase
      .from('channel_stats')
      .select(`
        date,
        subscriber_count,
        view_count,
        video_count,
        subscriber_gained,
        subscriber_lost,
        view_gained,
        estimated_minutes_watched
      `)
      .eq('channel_id', channelId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (statsError) {
      console.error('Channel stats fetch error:', statsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch channel stats'
      })
    }

    // Format the response
    const formattedStats = (stats || []).map(stat => ({
      date: stat.date,
      subscribers: stat.subscriber_count || 0,
      views: stat.view_count || 0,
      videos: stat.video_count || 0,
      subscriberGained: stat.subscriber_gained || 0,
      subscriberLost: stat.subscriber_lost || 0,
      viewGained: stat.view_gained || 0,
      minutesWatched: stat.estimated_minutes_watched || 0
    }))

    return {
      channelId,
      days,
      stats: formattedStats,
      summary: calculateSummary(formattedStats)
    }

  } catch (error) {
    console.error('Channel stats API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch channel stats'
    })
  }
})

function calculateSummary(stats: any[]) {
  if (stats.length === 0) return null

  const latest = stats[stats.length - 1]
  const previous = stats.length > 1 ? stats[stats.length - 2] : null

  return {
    currentSubscribers: latest.subscribers,
    currentViews: latest.views,
    currentVideos: latest.videos,
    subscriberChange: previous ? latest.subscribers - previous.subscribers : 0,
    viewChange: previous ? latest.views - previous.views : 0,
    videoChange: previous ? latest.videos - previous.videos : 0,
    totalSubscriberGained: stats.reduce((sum, s) => sum + s.subscriberGained, 0),
    totalSubscriberLost: stats.reduce((sum, s) => sum + s.subscriberLost, 0),
    totalViewGained: stats.reduce((sum, s) => sum + s.viewGained, 0),
    avgSubscriberGain: stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.subscriberGained, 0) / stats.length) : 0
  }
}