import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

/**
 * REFRESH_MEDIUM_VIDEOS job handler
 *
 * Updates statistics and metadata for videos older than 7 days but newer than 30 days
 * This runs less frequently than REFRESH_HOT_VIDEOS and uses priority 9.
 */
export async function handleRefreshMediumVideos(
  _payload: Record<string, never>,
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

    logger.info('querying for medium-aged videos (7-30 days)')
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: videosToRefresh, error: queryError } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title, channel_id')
      .lt('published_at', sevenDaysAgo)
      .gte('published_at', thirtyDaysAgo)

    if (queryError) {
      logger.error('failed to query medium-aged videos', { error: queryError })
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!videosToRefresh || videosToRefresh.length === 0) {
      logger.info('no medium-aged videos found')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('found medium-aged videos to refresh', { count: videosToRefresh.length })

    const channelIdMap = new Map(videosToRefresh.map((v: any) => [v.youtube_video_id, v.channel_id]))
    const videoIds = videosToRefresh.map((v: any) => v.youtube_video_id).filter(Boolean) as string[]

    if (videoIds.length === 0) {
      logger.info('no valid youtube video ids found')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('fetching video statistics for medium-aged videos', { count: videoIds.length })
    const fetchOptions: FetchVideosOptions = {
      ids: videoIds,
      config: {
        part: ['statistics', 'contentDetails', 'snippet'],
        batchSize: 50,
      }
    }

    const videos = await videosClient.fetchVideos(fetchOptions)

    if (videos.length === 0) {
      logger.info('no videos returned from youtube api')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('updating videos table with latest data (medium-aged)', { count: videos.length })
    const videoUpdates = videos.map(video => ({
      youtube_video_id: video.id,
      channel_id: channelIdMap.get(video.id) || null,
      published_at: video.snippet?.publishedAt || null,
      view_count: video.statistics?.viewCount ? parseInt(video.statistics.viewCount) : 0,
      like_count: video.statistics?.likeCount ? parseInt(video.statistics.likeCount) : 0,
      comment_count: video.statistics?.commentCount ? parseInt(video.statistics.commentCount) : 0,
      duration: video.contentDetails?.duration || null,
      description: video.snippet?.description || null,
      title: video.snippet?.title || null,
      thumbnail_url: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || null,
      tags: video.snippet?.tags || null,
      youtube_category_id: video.snippet?.categoryId || null,
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

    const { error: updateError } = await supabase
      .from('videos')
      .upsert(videoUpdates, { onConflict: 'youtube_video_id' })

    if (updateError) {
      logger.error('failed to update videos table (medium-aged)', { error: updateError })
      return { success: false, error: `Failed to update videos: ${updateError.message}` }
    }

    const statsData = videos
      .filter(video => video.statistics)
      .map(video => ({
        video_id: video.id,
        captured_at: new Date().toISOString(),
        view_count: video.statistics?.viewCount ?? 0,
        like_count: video.statistics?.likeCount ?? 0,
        comment_count: video.statistics?.commentCount ?? 0,
      }))

    if (statsData.length === 0) {
      logger.info('no videos with statistics to capture (medium-aged)')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('capturing video statistics (medium-aged)', { count: statsData.length })
    const { error: captureError } = await supabase
      .rpc('capture_video_stats', {
        video_stats_array: statsData
      })

    if (captureError) {
      logger.error('failed to capture video stats (medium-aged)', { error: captureError })
      return { success: false, error: `Failed to store video statistics: ${captureError.message}` }
    }

    logger.info('successfully refreshed medium-aged videos', { itemsProcessed: statsData.length })
    return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    logger.error('error in REFRESH_MEDIUM_VIDEOS handler', { error })
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
