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
          // Get category data for popular videos
          const videoIds = performanceData.map((r: any) => r.youtube_video_id)
          const { data: categoryData, error: categoryError } = await supabase
            .from('videos')
            .select('youtube_video_id, category_id, video_categories(id, name, key, color, icon)')
            .in('youtube_video_id', videoIds)

          // Create category lookup map
          const categoryMap = new Map()
          if (!categoryError && categoryData) {
            categoryData.forEach((item: any) => {
              if (item.video_categories) {
                categoryMap.set(item.youtube_video_id, item.video_categories)
              }
            })
          }

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
              },
              category: categoryMap.get(r.youtube_video_id) ? {
                id: categoryMap.get(r.youtube_video_id).id,
                name: categoryMap.get(r.youtube_video_id).name,
                key: categoryMap.get(r.youtube_video_id).key,
                color: categoryMap.get(r.youtube_video_id).color,
                icon: categoryMap.get(r.youtube_video_id).icon
              } : null
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
          // Get category data for popular videos
          const videoIds = performanceData.map((r: any) => r.youtube_video_id)
          const { data: categoryData, error: categoryError } = await supabase
            .from('videos')
            .select('youtube_video_id, category_id, video_categories(id, name, key, color, icon)')
            .in('youtube_video_id', videoIds)

          // Create category lookup map
          const categoryMap = new Map()
          if (!categoryError && categoryData) {
            categoryData.forEach((item: any) => {
              if (item.video_categories) {
                categoryMap.set(item.youtube_video_id, item.video_categories)
              }
            })
          }

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
              },
              category: categoryMap.get(r.youtube_video_id) ? {
                id: categoryMap.get(r.youtube_video_id).id,
                name: categoryMap.get(r.youtube_video_id).name,
                key: categoryMap.get(r.youtube_video_id).key,
                color: categoryMap.get(r.youtube_video_id).color,
                icon: categoryMap.get(r.youtube_video_id).icon
              } : null
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
          // Get category data for popular videos
          const videoIds = performanceData.map((r: any) => r.youtube_video_id)
          const { data: categoryData, error: categoryError } = await supabase
            .from('videos')
            .select('youtube_video_id, category_id, video_categories(id, name, key, color, icon)')
            .in('youtube_video_id', videoIds)

          // Create category lookup map
          const categoryMap = new Map()
          if (!categoryError && categoryData) {
            categoryData.forEach((item: any) => {
              if (item.video_categories) {
                categoryMap.set(item.youtube_video_id, item.video_categories)
              }
            })
          }

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
              },
              category: categoryMap.get(r.youtube_video_id) ? {
                id: categoryMap.get(r.youtube_video_id).id,
                name: categoryMap.get(r.youtube_video_id).name,
                key: categoryMap.get(r.youtube_video_id).key,
                color: categoryMap.get(r.youtube_video_id).color,
                icon: categoryMap.get(r.youtube_video_id).icon
              } : null
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
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, category_id, channels(title, thumbnail_url, slug), video_categories(id, name, key, color, icon)')
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
            },
            category: r.video_categories ? {
              id: r.video_categories.id,
              name: r.video_categories.name,
              key: r.video_categories.key,
              color: r.video_categories.color,
              icon: r.video_categories.icon
            } : null
          }
        })

        result = { items, section, limit }
      }
    } else if (section === 'trending') {
      // Trending: recent videos (last 30 days) with performance data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('video_performance')
        .select(`
          youtube_video_id,
          slug,
          title,
          thumbnail_url,
          channel_title,
          channel_slug,
          channel_thumbnail_url,
          channel_id,
          view_count,
          duration,
          published_at,
          gain_24h,
          gain_7d,
          gain_30d
        `)
        .gte('published_at', thirtyDaysAgo)
        .gt('view_count', 0)
        .order('view_count', { ascending: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        // Get category data for trending videos
        const videoIds = data.map((r: any) => r.youtube_video_id)
        const { data: categoryData, error: categoryError } = await supabase
          .from('videos')
          .select('youtube_video_id, category_id, video_categories(id, name, key, color, icon)')
          .in('youtube_video_id', videoIds)

        // Create category lookup map
        const categoryMap = new Map()
        if (!categoryError && categoryData) {
          categoryData.forEach((item: any) => {
            if (item.video_categories) {
              categoryMap.set(item.youtube_video_id, item.video_categories)
            }
          })
        }

        result = {
          items: data.map((r: any) => ({
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
              gain: r.gain_24h || r.gain_7d || r.gain_30d || 0,
              period: r.gain_24h ? 'today' : r.gain_7d ? '7' : r.gain_30d ? '30' : 'all'
            },
            category: categoryMap.get(r.youtube_video_id) ? {
              id: categoryMap.get(r.youtube_video_id).id,
              name: categoryMap.get(r.youtube_video_id).name,
              key: categoryMap.get(r.youtube_video_id).key,
              color: categoryMap.get(r.youtube_video_id).color,
              icon: categoryMap.get(r.youtube_video_id).icon
            } : null
          })),
          section,
          limit
        }
      } else {
        // Fallback to basic videos query if no performance data
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, category_id, channels(title, thumbnail_url, slug), video_categories(id, name, key, color, icon)')
          .gte('published_at', thirtyDaysAgo)
          .order('view_count', { ascending: false })
          .limit(limit)

        if (fallbackError) {
          throw createError({
            statusCode: 500,
            statusMessage: fallbackError.message || 'Database error'
          })
        }

        result = {
          items: (fallbackData || []).map((r: any) => ({
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
            age: formatAge(new Date(r.published_at)),
            duration: r.duration ?? '—',
            trend: {
              gain: 0,
              period: 'all'
            },
            category: r.video_categories ? {
              id: r.video_categories.id,
              name: r.video_categories.name,
              key: r.video_categories.key,
              color: r.video_categories.color,
              icon: r.video_categories.icon
            } : null
          })),
          section,
          limit
        }
      }
    } else {
      // Handle other video sections (new, featured, top) with dbQuery pattern
      let dbQuery: any

      if (section === 'top') {
        // Top videos: all-time highest viewed videos
        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, category_id, channels(title, thumbnail_url, slug), video_categories(id, name, key, color, icon)')
          .gt('view_count', 0)
          .order('view_count', { ascending: false })
          .limit(limit)
      } else if (section === 'featured') {
        // Example: featured could be based on some criteria - for now using recent high-view videos
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, category_id, channels(title, thumbnail_url, slug), video_categories(id, name, key, color, icon)')
          .gte('published_at', sevenDaysAgo)
          .gt('view_count', 0)
          .order('view_count', { ascending: false })
          .limit(limit)
      } else {
        // Default section: 'new' videos
        let dateFilter = new Date()
        dateFilter.setDate(dateFilter.getDate() - 7) // Last 7 days by default

        dbQuery = supabase
          .from('videos')
          .select('youtube_video_id, slug, title, thumbnail_url, channel_id, published_at, view_count, duration, category_id, channels(title, thumbnail_url, slug), video_categories(id, name, key, color, icon)')
          .gte('published_at', dateFilter.toISOString())
          .gt('view_count', 0)
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
          },
          category: r.video_categories ? {
            id: r.video_categories.id,
            name: r.video_categories.name,
            key: r.video_categories.key,
            color: r.video_categories.color,
            icon: r.video_categories.icon
          } : null
        }
      })

      result = { items, section, limit }
    }
  }

  return result
})
