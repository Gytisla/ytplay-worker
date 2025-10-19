import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const section = (query.section as string) || 'new'
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string || '8', 10)))
  const sort = (query.sort as string) || 'subscribers'
  const period = query.period as string

  // Get runtime config
  const config = useRuntimeConfig()
  
  console.log('Discovery API called with:', { section, limit, sort, period })

  // Create admin client for server-side
  const supabase = createClient(
    config.public.supabase.url as string,
    config.supabaseServiceKey as string
  )

  let result: any = { items: [], section, limit }

  function formatAge(d: Date) {
    const diff = Date.now() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return '1d'
    if (days < 30) return `${days}d`
    const months = Math.floor(days / 30)
    return `${months}mo`
  }

  if (section === 'channels') {
    // Determine sort column and direction
    let sortColumn = 'subscriber_count'
    let ascending = false

    if (sort === 'views') {
      sortColumn = 'view_count'
    }

    // Fetch popular channels ordered by specified criteria
    const { data, error } = await supabase
      .from('channels')
      .select('id, slug, youtube_channel_id, title, thumbnail_url, subscriber_count, video_count, view_count')
      .order(sortColumn, { ascending, nullsFirst: false })
      .limit(limit)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Database error'
      })
    }

    // Format channel data
    const channels = (data || []).map((ch: any) => ({
      id: ch.id, // Use database ID for navigation
      slug: ch.slug, // Add slug for SEO-friendly URLs
      youtubeId: ch.youtube_channel_id, // Keep YouTube ID for reference
      name: ch.title,
      avatar: ch.thumbnail_url,
      subs: ch.subscriber_count ? `${(ch.subscriber_count / 1000).toFixed(1)}K` : '—',
      recent: ch.video_count || 0,
      views: ch.view_count ? `${ch.view_count.toLocaleString()} views` : '—',
    }))

    result = { channels, section, limit, sort }
  } else {
    // Handle video sections (new, trending, featured, popular)
    if (section === 'popular') {
      // Popular videos based on period - videos getting most views in the period
      if (period === 'today') {
        // Get videos with 24h gains from video_performance view
        const { data: performanceData, error: performanceError } = await supabase
          .from('video_performance')
          .select('id, youtube_video_id, slug, title, thumbnail_url, channel_title, channel_slug, channel_thumbnail_url, view_count, duration, published_at, gain_24h')
          .gt('gain_24h', 0)
          .order('gain_24h', { ascending: false })
          .limit(limit)

        if (!performanceError && performanceData && performanceData.length > 0) {
          result = {
            items: performanceData.map((r: any) => ({
              id: r.youtube_video_id,
              slug: r.slug,
              title: r.title,
              thumb: r.thumbnail_url,
              channel: r.channel_title,
              channelThumb: r.channel_thumbnail_url || null,
              channelSlug: r.channel_slug || null,
              channelId: r.channel_id,
              published_at: r.published_at,
              views: r.view_count ? `${r.view_count.toLocaleString()} views` : '—',
              age: formatAge(new Date(r.published_at)),
              duration: r.duration ?? '—',
              trend: {
                gain: r.gain_24h,
                period: 'today'
              }
            })),
            section,
            limit
          }
        }
      } else if (period === '7') {
        // Get videos with 7-day gains from video_performance view
        const { data: performanceData, error: performanceError } = await supabase
          .from('video_performance')
          .select('id, youtube_video_id, slug, title, thumbnail_url, channel_title, channel_slug, channel_thumbnail_url, view_count, duration, published_at, gain_7d')
          .gt('gain_7d', 0)
          .order('gain_7d', { ascending: false })
          .limit(limit)

        if (!performanceError && performanceData && performanceData.length > 0) {
          result = {
            items: performanceData.map((r: any) => ({
              id: r.youtube_video_id,
              slug: r.slug,
              title: r.title,
              thumb: r.thumbnail_url,
              channel: r.channel_title,
              channelThumb: r.channel_thumbnail_url || null,
              channelSlug: r.channel_slug || null,
              channelId: r.channel_id,
              published_at: r.published_at,
              views: r.view_count ? `${r.view_count.toLocaleString()} views` : '—',
              age: formatAge(new Date(r.published_at)),
              duration: r.duration ?? '—',
              trend: {
                gain: r.gain_7d,
                period: '7'
              }
            })),
            section,
            limit
          }
        }
      } else if (period === '30') {
        // Get videos with 30-day gains from video_performance view
        const { data: performanceData, error: performanceError } = await supabase
          .from('video_performance')
          .select('id, youtube_video_id, slug, title, thumbnail_url, channel_title, channel_slug, channel_thumbnail_url, view_count, duration, published_at, gain_30d')
          .gt('gain_30d', 0)
          .order('gain_30d', { ascending: false })
          .limit(limit)

        if (!performanceError && performanceData && performanceData.length > 0) {
          result = {
            items: performanceData.map((r: any) => ({
              id: r.youtube_video_id,
              slug: r.slug,
              title: r.title,
              thumb: r.thumbnail_url,
              channel: r.channel_title,
              channelThumb: r.channel_thumbnail_url || null,
              channelSlug: r.channel_slug || null,
              channelId: r.channel_id,
              published_at: r.published_at,
              views: r.view_count ? `${r.view_count.toLocaleString()} views` : '—',
              age: formatAge(new Date(r.published_at)),
              duration: r.duration ?? '—',
              trend: {
                gain: r.gain_30d,
                period: '30'
              }
            })),
            section,
            limit
          }
        }
      }

      // Fallback: if no results from video_performance, use regular query
      if (!result.items || result.items.length === 0) {
        let dateFilter = new Date()
        if (period === 'today') {
          dateFilter.setDate(dateFilter.getDate() - 1)
        } else if (period === '7') {
          dateFilter.setDate(dateFilter.getDate() - 7)
        } else if (period === '30') {
          dateFilter.setDate(dateFilter.getDate() - 30)
        } else {
          // Default to last 7 days
          dateFilter.setDate(dateFilter.getDate() - 7)
        }

        const { data, error } = await supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, channels(title, thumbnail_url, slug)')
          .gte('published_at', dateFilter.toISOString())
          .order('view_count', { ascending: false })
          .limit(limit)

        if (error) {
          throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Database error'
          })
        }

        // Sanitize and shape output for the public API
        const items = (data || []).map((r: any) => {
          const published = r.published_at ? new Date(r.published_at) : undefined
          const age = published ? formatAge(published) : '—'
          return {
            id: r.youtube_video_id,
            slug: r.slug,
            title: r.title,
            thumb: r.thumbnail_url,
            channel: r.channels?.title || 'Unknown',
            channelThumb: r.channels?.thumbnail_url || null,
            channelSlug: r.channels?.slug || null,
            channelId: r.channel_id,
            published_at: r.published_at,
            views: r.view_count ? `${r.view_count.toLocaleString()} views` : '—',
            age,
            duration: r.duration ?? '—',
            trend: {
              gain: 0, // Default gain for non-popular sections
              period: 'all'
            }
          }
        })

        result = { items, section, limit }
      }
    } else {
      // Handle other video sections (new, trending, featured)
      let dbQuery: any

      if (section === 'trending') {
        // Trending: recent videos (last 30 days) ordered by view count
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, channels(title, thumbnail_url, slug)')
          .gte('published_at', thirtyDaysAgo)
          .order('view_count', { ascending: false })
          .limit(limit)
      } else if (section === 'featured') {
        // Example: featured could be based on some criteria - for now using recent high-view videos
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, channels(title, thumbnail_url, slug)')
          .gte('published_at', sevenDaysAgo)
          .order('view_count', { ascending: false })
          .limit(limit)
      } else {
        // Default section: 'new' videos
        let dateFilter = new Date()
        dateFilter.setDate(dateFilter.getDate() - 7) // Last 7 days by default

        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, channels(title, thumbnail_url, slug)')
          .gte('published_at', dateFilter.toISOString())
          .order('published_at', { ascending: false })
          .limit(limit)
      }

      const { data, error } = await dbQuery

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message || 'Database error'
        })
      }

      // Sanitize and shape output for the public API
      const items = (data || []).map((r: any) => {
        const published = r.published_at ? new Date(r.published_at) : undefined
        const age = published ? formatAge(published) : '—'
        return {
          id: r.youtube_video_id,
          slug: r.slug,
          title: r.title,
          thumb: r.thumbnail_url,
          channel: r.channels?.title || 'Unknown',
          channelThumb: r.channels?.thumbnail_url || null,
          channelSlug: r.channels?.slug || null,
          channelId: r.channel_id,
          published_at: r.published_at,
          views: r.view_count ? `${r.view_count.toLocaleString()} views` : '—',
          age,
          duration: r.duration ?? '—',
          trend: {
            gain: 0, // Default gain for non-popular sections
            period: 'all'
          }
        }
      })

      result = { items, section, limit }
    }
  }

  return result
})
