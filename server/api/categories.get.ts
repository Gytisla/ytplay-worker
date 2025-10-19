import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event: any) => {
  // Get runtime config
  const config = useRuntimeConfig()

  // Create admin client for server-side
  const supabase = createClient(
    config.public.supabase.url as string,
    config.supabaseServiceKey as string
  )

  try {
    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('video_categories')
      .select('*')
      .order('name')

    if (categoriesError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch categories: ${categoriesError.message}`
      })
    }

    if (!categories || categories.length === 0) {
      return []
    }

    // For each category, fetch the latest videos and count
    const categoriesWithVideos = await Promise.all(
      categories.map(async (category: any) => {
        // Get video count for this category
        const { count: videoCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)

        // Get latest 8 videos for this category
        const { data: latestVideos, error: videosError } = await supabase
          .from('videos')
          .select('id, youtube_video_id, slug, title, thumbnail_url, published_at')
          .eq('category_id', category.id)
          .order('published_at', { ascending: false })
          .limit(8)

        if (videosError) {
          console.error(`Failed to fetch videos for category ${category.name}:`, videosError)
        }

        return {
          ...category,
          video_count: videoCount || 0,
          latest_videos: latestVideos || []
        }
      })
    )

    return categoriesWithVideos
  } catch (error) {
    console.error('Categories API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})