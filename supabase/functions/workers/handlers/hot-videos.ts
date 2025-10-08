import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

/**
 * REFRESH_HOT_VIDEOS job handler
 *
 * Updates statistics for recently published videos ("hot videos"):
 * 1. Identifies videos published within the last 7 days
 * 2. Fetches current statistics from YouTube API
 * 3. Stores statistics snapshots for trend analysis
 */
export async function handleRefreshHotVideos(
  _payload: Record<string, never>, // No specific payload needed
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

  // Query for hot videos (published within last 7 days)
  logger.info('querying for hot videos')
    const { data: hotVideos, error: queryError } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (queryError) {
      logger.error('failed to query hot videos', { error: queryError })
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!hotVideos || hotVideos.length === 0) {
      logger.info('no hot videos found')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('found hot videos to refresh', { count: hotVideos.length })

    // Extract YouTube video IDs
    const videoIds = hotVideos.map(v => v.youtube_video_id).filter(Boolean) as string[]

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

  logger.info('successfully refreshed hot videos', { itemsProcessed: statsData.length })
  return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    logger.error('error in REFRESH_HOT_VIDEOS handler', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during hot videos refresh'
    }
  }
}