import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const search = query.search as string || ''
  const limit = parseInt(query.limit as string) || 20
  const channelId = query.id as string

  try {
    // If specific channel ID is requested, fetch only that channel
    if (channelId) {
      const { data, error } = await client
        .from('channels')
        .select('id, title, thumbnail_url, subscriber_count, slug')
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
          thumbnail: data.thumbnail_url,
          subscribers: data.subscriber_count,
          slug: data.slug
        }] : []
      }
    }

    // Otherwise, fetch channels with search/limit
    let queryBuilder = client
      .from('channels')
      .select('id, title, thumbnail_url, subscriber_count, slug')
      .order('subscriber_count', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (search) {
      queryBuilder = queryBuilder.ilike('title', `%${search}%`)
    }

    const { data, error } = await queryBuilder

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
        thumbnail: channel.thumbnail_url,
        subscribers: channel.subscriber_count,
        slug: channel.slug
      })) || []
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch channels'
    })
  }
})