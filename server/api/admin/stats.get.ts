import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Get user statistics
    const { count: totalUsers, data: userData } = await supabaseAdmin
      .from('user_profiles')
      .select('role, is_active', { count: 'exact' })

    const activeUsers = userData?.filter((u: any) => u.is_active).length || 0
    const adminUsers = userData?.filter((u: any) => u.role === 'admin').length || 0

    // Get content statistics
    const [channelResult, videoResult, categoryResult] = await Promise.all([
      supabaseAdmin.from('channels').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('videos').select('view_count', { count: 'exact' }),
      supabaseAdmin.from('video_categories').select('id', { count: 'exact', head: true })
    ])

    const totalChannels = channelResult.count || 0
    const totalVideos = videoResult.count || 0
    const totalCategories = categoryResult.count || 0

    // Calculate total views
    const totalViews = videoResult.data?.reduce((sum: number, video: any) => sum + (video.view_count || 0), 0) || 0

    // Calculate average videos per channel
    const avgVideosPerChannel = totalChannels > 0 ? (totalVideos / totalChannels).toFixed(1) : '0'

    // Get active jobs count
    const { count: activeJobs } = await supabaseAdmin
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'running'])

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers,
        admins: adminUsers
      },
      content: {
        channels: totalChannels,
        videos: totalVideos,
        categories: totalCategories,
        totalViews: totalViews
      },
      system: {
        activeJobs: activeJobs || 0,
        avgVideosPerChannel: parseFloat(avgVideosPerChannel)
      }
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch system statistics'
    })
  }
})