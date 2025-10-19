import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

/**
 * REFRESH_VIDEO_STATS job handler
 *
 * Updates video statistics and metadata for periodic refresh:
 * - When video_ids are provided: refreshes specific videos
 * - When channel criteria provided: refreshes videos based on channel rotation
 * 1. Identifies videos to refresh based on payload criteria
 * 2. Fetches current statistics, content details, and snippet from YouTube API
 * 3. Updates videos table with latest data (view_count, description, etc.)
 * 4. Stores statistics snapshots for trend analysis
 */
export async function handleRefreshVideoStats(
  payload: { 
    channelHashPrefix?: string; 
    channelHashRange?: { min: number; max: number };
    video_ids?: string[];
    channel_id?: string;
  },
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

  // Build query for videos to refresh based on channel rotation criteria or specific video IDs
  logger.info('querying videos for stats refresh', { payload })

    let query = supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        channel_id,
        channels!inner(youtube_channel_id)
      `)

    // If specific video_ids are provided, query only those videos
    if (payload.video_ids && payload.video_ids.length > 0) {
      query = query.in('youtube_video_id', payload.video_ids)
      logger.info('refreshing specific videos', { videoIds: payload.video_ids })
    } else if (payload.channel_id) {
      // Refresh all videos for a specific channel
      // payload.channel_id is a YouTube channel ID, so we filter by channels.youtube_channel_id
      query = query.eq('channels.youtube_channel_id', payload.channel_id)
      logger.info('refreshing all videos for channel', { channelId: payload.channel_id })
    } else {
      // Apply channel hash filtering for rotation
      if (payload.channelHashPrefix) {
        // Use substring of channel ID for rotation (first N characters)
        query = query.ilike('channels.youtube_channel_id', `${payload.channelHashPrefix}%`)
      } else if (payload.channelHashRange) {
        // More complex rotation logic could be implemented here
        // For now, we'll process all videos if no specific criteria
        logger.info('channel hash range specified but not implemented; processing all', { payload })
      }
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

    // Create map of youtube_video_id to channel_id
    const channelIdMap = new Map(videosToRefresh.map(v => [v.youtube_video_id, v.channel_id]))

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
        part: ['statistics', 'contentDetails', 'snippet'], // Include details and snippet for description, duration, etc.
        batchSize: 50, // YouTube API limit
      }
    }

    const videos = await videosClient.fetchVideos(fetchOptions)

    if (videos.length === 0) {
      logger.info('no videos returned from youtube api')
      return { success: true, itemsProcessed: 0 }
    }

    // Update videos table with latest data
    logger.info('updating videos table with latest data', { count: videos.length })
    const videoUpdates = videos.map(video => ({
      youtube_video_id: video.id,
      channel_id: channelIdMap.get(video.id) || null, // Should not be null since videos exist
      published_at: video.snippet?.publishedAt || null,
      view_count: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : 0,
      like_count: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : 0,
      comment_count: video.statistics?.commentCount ? parseInt(video.statistics.commentCount) : 0,
      duration: video.contentDetails?.duration || null,
      description: video.snippet?.description || null,
      title: video.snippet?.title || null,
      thumbnail_url: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || null,
      tags: video.snippet?.tags || null,
      youtube_category_id: video.snippet?.categoryId || null, // Update YouTube's category ID
      live_broadcast_content: video.snippet?.liveBroadcastContent || 'none',
      default_audio_language: video.snippet?.defaultAudioLanguage || null,
      default_language: video.snippet?.defaultLanguage || null,
      projection: video.contentDetails?.projection || 'rectangular',
      dimension: video.contentDetails?.dimension || '2d',
      definition: video.contentDetails?.definition || 'hd',
      caption: video.contentDetails?.caption === 'true',
      status: video.status?.uploadStatus || null,
      privacy_status: video.status?.privacyStatus || null,
      embeddable: video.status?.embeddable || false,
      licensed_content: video.contentDetails?.licensedContent || false,
      last_fetched_at: new Date().toISOString(),
    }))

    // Upsert videos table
    const { error: updateError } = await supabase
      .from('videos')
      .upsert(videoUpdates, { onConflict: 'youtube_video_id' })

    if (updateError) {
      logger.error('failed to update videos table', { error: updateError })
      return { success: false, error: `Failed to update videos: ${updateError.message}` }
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