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

    // Get total video count for this category
    const { count: totalCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)

    // Get paginated videos for this category
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        published_at,
        duration,
        view_count,
        thumbnail_url
      `)
      .eq('category_id', category.id)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (videosError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch videos: ${videosError.message}`
      })
    }

    return {
      category,
      videos: videos || [],
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