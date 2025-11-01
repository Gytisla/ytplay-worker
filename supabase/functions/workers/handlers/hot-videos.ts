import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import type { VideoResource } from '../../../../src/lib/youtube/types.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

/**
 * REFRESH_HOT_VIDEOS job handler
 *
 * Updates statistics and metadata for recently published videos ("hot videos"):
 * 1. Identifies videos published within the last 7 days
 * 2. Fetches current statistics, content details, and snippet from YouTube API
 * 3. Updates videos table with latest data (title, description, etc.)
 * 4. Stores statistics snapshots for trend analysis
 */
export async function handleRefreshHotVideos(
  payload: { offset?: number; batchSize?: number; maxBatches?: number } = {},
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    // Read pagination and limits from payload
    const offset = Number(payload.offset || 0)
    const batchSize = Number(payload.batchSize || 50)
    const maxBatches = Number(payload.maxBatches || 10) // limit number of YouTube API batches per run

    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

  // Query for hot videos (published within last 7 days) -- only fetch rows for this run using range()
  logger.info('querying for hot videos', { offset, batchSize, maxBatches })
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: hotVideos, error: queryError, count } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title, channel_id', { count: 'exact' })
      .gte('published_at', sevenDaysAgo)
      .order('published_at', { ascending: false })
      .range(offset, offset + batchSize * maxBatches - 1)

    if (queryError) {
      logger.error('failed to query hot videos', { error: queryError })
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!hotVideos || hotVideos.length === 0) {
      logger.info('no hot videos found')
      return { success: true, itemsProcessed: 0 }
    }

    logger.info('found hot videos to refresh (batch)', { count: hotVideos?.length ?? 0 })

    if (!hotVideos || hotVideos.length === 0) {
      logger.info('no hot videos found in this range')
      return { success: true, itemsProcessed: 0 }
    }

    // Create map of youtube_video_id to channel_id
  const channelIdMap = new Map(hotVideos.map((v: { youtube_video_id: string; channel_id: string | null }) => [v.youtube_video_id, v.channel_id]))

    // Extract YouTube video IDs (we will fetch in YouTube-sized batches below)
  const videoIds = hotVideos.map((v: { youtube_video_id?: string }) => v.youtube_video_id).filter(Boolean) as string[]

    if (videoIds.length === 0) {
      logger.info('no valid youtube video ids found')
      return { success: true, itemsProcessed: 0 }
    }

  // Fetch current statistics from YouTube API in smaller chunks, but limit total chunks to maxBatches
  logger.info('fetching video statistics in chunks', { totalVideoIds: videoIds.length, batchSize, maxBatches })
    const fetchOptionsBase: Partial<FetchVideosOptions> = {
      config: {
        part: ['statistics', 'contentDetails', 'snippet'], // Include details and snippet for description, duration, title, etc.
        batchSize: batchSize,
      }
    }

    // fetchVideos supports being called with subset of ids; iterate in chunks
    const chunked = (arr: string[], size: number) => {
      const out: string[][] = []
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
      return out
    }

    const idChunks = chunked(videoIds, batchSize).slice(0, maxBatches)
  let videos: VideoResource[] = []
    for (const idsChunk of idChunks) {
      const fetchOptions: FetchVideosOptions = { ...(fetchOptionsBase as FetchVideosOptions), ids: idsChunk }
      try {
        const part = await videosClient.fetchVideos(fetchOptions)
        videos = videos.concat(part)
      } catch (err) {
        logger.error('youtube api chunk fetch failed', { error: err })
      }
    }

    if (videos.length === 0) {
      logger.info('no videos returned from youtube api after chunked fetch')
      return { success: true, itemsProcessed: 0 }
    }

    // Update videos table with latest data
    logger.info('updating videos table with latest data', { count: videos.length })
  const videoUpdates = videos.map((video: VideoResource) => ({
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

    logger.info('successfully refreshed hot videos (batch)', { itemsProcessed: statsData.length })

    // enqueue next job if there are more rows to process
    const totalCount = typeof count === 'number' ? count : null
    const processedRows = offset + (hotVideos?.length || 0)
    if (totalCount !== null && processedRows < totalCount) {
      const nextOffset = offset + batchSize * maxBatches
      const nextPayload = { offset: nextOffset, batchSize, maxBatches }
      logger.info('enqueueing next batch job', { nextPayload, totalCount })

      try {
        const { error: enqueueErr } = await supabase.rpc('enqueue_job', {
          job_type_param: 'REFRESH_HOT_VIDEOS',
          payload_param: nextPayload,
          priority_param: 0,
          dedup_key_param: `refresh_hot_videos_offset_${nextOffset}`
        })

        if (enqueueErr) {
          logger.error('enqueue_job RPC failed for next batch', { error: enqueueErr })
        }
      } catch (err) {
        logger.error('failed to enqueue next batch job', { error: err })
      }
    }

    return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    logger.error('error in REFRESH_HOT_VIDEOS handler', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during hot videos refresh'
    }
  }
}