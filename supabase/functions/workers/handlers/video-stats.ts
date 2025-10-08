import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

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
  logger.info('querying videos for stats refresh', { payload })

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
  logger.info('channel hash range specified but not implemented; processing all', { payload })
    }

    const { data: videosToRefresh, error: queryError } = await query

    if (queryError) {
      logger.error('failed to query videos for refresh', { error: queryError })
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!videosToRefresh || videosToRefresh.length === 0) {
      logger.info('no videos found matching refresh criteria')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('found videos to refresh statistics', { count: videosToRefresh.length })

    // Extract YouTube video IDs
    const videoIds = videosToRefresh
      .map(v => v.youtube_video_id)
      .filter(Boolean) as string[]

    if (videoIds.length === 0) {
      logger.info('no valid youtube video ids found')
      return { success: true, itemsProcessed: 0 }
    }

  // Fetch current statistics from YouTube API
  logger.info('fetching video statistics', { count: videoIds.length })
    const fetchOptions: FetchVideosOptions = {
      ids: videoIds,
      config: {
        part: ['statistics'], // Only need statistics for refresh
        batchSize: 50, // YouTube API limit
      }
    }

    const videos = await videosClient.fetchVideos(fetchOptions)

    if (videos.length === 0) {
      logger.info('no videos returned from youtube api')
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
      logger.info('no videos with statistics to capture')
      return { success: true, itemsProcessed: 0 }
    }

  // Store statistics snapshots
  logger.info('capturing video statistics', { count: statsData.length })
    const { error: captureError } = await supabase
      .rpc('capture_video_stats', {
        video_stats_array: statsData
      })

    if (captureError) {
      logger.error('failed to capture video stats', { error: captureError })
      return { success: false, error: `Failed to store video statistics: ${captureError.message}` }
    }

  logger.info('successfully refreshed video statistics', { itemsProcessed: statsData.length })
  return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    logger.error('error in REFRESH_VIDEO_STATS handler', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during video stats refresh'
    }
  }
}