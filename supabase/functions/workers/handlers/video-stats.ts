import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'

/**
 * REFRESH_VIDEO_STATS job handler
 *
 * Updates video statistics for periodic refresh (weekly rotation):
 * 1. Identifies videos for channels matching the rotation criteria
 * 2. Fetches current statistics from YouTube API
 * 3. Stores statistics snapshots for trend analysis
 */
export async function handleRefreshVideoStats(
  payload: { channelHashPrefix?: string; channelHashRange?: { min: number; max: number } },
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

    // Build query for videos to refresh based on channel rotation criteria
    console.log('Querying videos for stats refresh with criteria:', payload)

    let query = supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        channels!inner(youtube_channel_id)
      `)

    // Apply channel hash filtering for rotation
    if (payload.channelHashPrefix) {
      // Use substring of channel ID for rotation (first N characters)
      query = query.ilike('channels.youtube_channel_id', `${payload.channelHashPrefix}%`)
    } else if (payload.channelHashRange) {
      // More complex rotation logic could be implemented here
      // For now, we'll process all videos if no specific criteria
      console.log('Channel hash range specified but not implemented, processing all videos')
    }

    const { data: videosToRefresh, error: queryError } = await query

    if (queryError) {
      console.error('Failed to query videos for refresh:', queryError)
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!videosToRefresh || videosToRefresh.length === 0) {
      console.log('No videos found matching refresh criteria')
      return { success: true, itemsProcessed: 0 }
    }

    console.log(`Found ${videosToRefresh.length} videos to refresh statistics`)

    // Extract YouTube video IDs
    const videoIds = videosToRefresh
      .map(v => v.youtube_video_id)
      .filter(Boolean) as string[]

    if (videoIds.length === 0) {
      console.log('No valid YouTube video IDs found')
      return { success: true, itemsProcessed: 0 }
    }

    // Fetch current statistics from YouTube API
    console.log(`Fetching statistics for ${videoIds.length} videos`)
    const fetchOptions: FetchVideosOptions = {
      ids: videoIds,
      config: {
        part: ['statistics'], // Only need statistics for refresh
        batchSize: 50, // YouTube API limit
      }
    }

    const videos = await videosClient.fetchVideos(fetchOptions)

    if (videos.length === 0) {
      console.log('No videos returned from YouTube API')
      return { success: true, itemsProcessed: 0 }
    }

    // Prepare statistics data for storage
    const statsData = videos
      .filter(video => video.statistics) // Only videos with statistics
      .map(video => ({
        video_id: video.id,
        captured_at: new Date().toISOString(),
        view_count: video.statistics?.viewCount ?? 0,
        like_count: video.statistics?.likeCount ?? 0,
        comment_count: video.statistics?.commentCount ?? 0,
      }))

    if (statsData.length === 0) {
      console.log('No videos with statistics to capture')
      return { success: true, itemsProcessed: 0 }
    }

    // Store statistics snapshots
    console.log(`Capturing statistics for ${statsData.length} videos`)
    const { error: captureError } = await supabase
      .rpc('capture_video_stats', {
        video_stats_array: statsData
      })

    if (captureError) {
      console.error('Failed to capture video stats:', captureError)
      return { success: false, error: `Failed to store video statistics: ${captureError.message}` }
    }

    console.log(`Successfully refreshed statistics for ${statsData.length} videos`)
    return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    console.error('Error in REFRESH_VIDEO_STATS handler:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during video stats refresh'
    }
  }
}