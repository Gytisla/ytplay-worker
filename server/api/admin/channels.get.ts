import { serverSupabaseClient } from '#supabase/server'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const search = query.search as string || ''
  const limit = parseInt(query.limit as string) || 20
  const offset = parseInt(query.offset as string) || 0
  const sort = (query.sort as string) || 'subscriber_count'
  const direction = (query.direction as string) || 'desc'
  const channelId = query.id as string

  try {
    // If specific channel ID is requested, fetch only that channel
    if (channelId) {
      const { data, error } = await client
        .from('channels')
        .select('id, title, thumbnail_url, subscriber_count, slug, youtube_channel_id, video_count, updated_at, videos(count)')
        .eq('id', channelId)
        .single()

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message
        })
      }

      return {
        channels: data ? [{
          id: data.id,
          title: data.title,
          thumbnail_url: data.thumbnail_url,
          subscriber_count: data.subscriber_count,
          slug: data.slug,
          youtube_channel_id: data.youtube_channel_id,
          video_count: data.video_count,
          updated_at: data.updated_at,
          tracked_video_count: data.videos?.[0]?.count || 0
        }] : [],
        total: data ? 1 : 0
      }
    }

    // Otherwise, fetch channels with search/limit/pagination
    let queryBuilder = client
      .from('channels')
      .select('id, title, thumbnail_url, subscriber_count, slug, youtube_channel_id, video_count, updated_at, videos(count)', { count: 'exact' })
      .order(sort, { ascending: direction === 'asc', nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (search) {
      queryBuilder = queryBuilder.ilike('title', `%${search}%`)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message
      })
    }

    return {
      channels: data?.map(channel => ({
        id: channel.id,
        title: channel.title,
        thumbnail_url: channel.thumbnail_url,
        subscriber_count: channel.subscriber_count,
        slug: channel.slug,
        youtube_channel_id: channel.youtube_channel_id,
        video_count: channel.video_count,
        updated_at: channel.updated_at,
        tracked_video_count: channel.videos?.[0]?.count || 0
      })) || [],
      total: count || 0
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch channels'
    })
  }
})