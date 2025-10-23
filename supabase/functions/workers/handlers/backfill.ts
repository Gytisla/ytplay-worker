import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeChannelsClient, type FetchChannelsOptions } from '../../../../src/lib/youtube/channels.ts'
import { YouTubePlaylistsClient, type FetchPlaylistItemsOptions } from '../../../../src/lib/youtube/playlists.ts'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../../../src/lib/youtube/videos.ts'
import type { VideoResource } from '../../../../src/lib/youtube/types.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'
import { categorizeVideo } from '../../../../src/lib/categorization.ts'

/**
 * BACKFILL_CHANNEL job handler
 *
 * Performs initial data ingestion for a new channel:
 * 1. Fetches channel metadata from YouTube API
 * 2. Discovers all videos via uploads playlist
 * 3. Stores channel and video data in database
 * 4. Captures initial channel statistics
 * 5. Updates channel status to active
 * 6. Enqueues REFRESH_CHANNEL_STATS job
 * 7. Enqueues REFRESH_VIDEO_STATS job for all videos
 */
export async function handleBackfillChannel(
  payload: { channelId: string },
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  const { channelId } = payload

  if (!channelId) {
    return { success: false, error: 'Missing channelId in payload' }
  }

  try {
    // Initialize YouTube API clients
    const youtubeClient = createYouTubeClientFromEnv()
    const channelsClient = new YouTubeChannelsClient(youtubeClient)
    const playlistsClient = new YouTubePlaylistsClient(youtubeClient)
    const videosClient = new YouTubeVideosClient(youtubeClient)

    let totalItemsProcessed = 0

    const safeNumber = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }

  // Step 1: Fetch channel metadata
  logger.info('fetching channel metadata', { channelId })
    const channelOptions: FetchChannelsOptions = {
      ids: [channelId]
    }

    const channels = await channelsClient.fetchChannels(channelOptions)
    if (channels.length === 0) {
      return { success: false, error: `Channel ${channelId} not found on YouTube` }
    }

    const channel = channels[0]
    if (!channel) {
      return { success: false, error: `Channel ${channelId} not found after fetch` }
    }
    totalItemsProcessed++

  // Step 2: Store channel data
  logger.info('storing channel data', { channelId })
    const channelData = {
      youtube_channel_id: channel.id,
      title: channel.snippet?.title ?? '',
      description: channel.snippet?.description ?? '',
      published_at: channel.snippet?.publishedAt ?? new Date().toISOString(),
      country: channel.snippet?.country ?? null,
      default_language: channel.snippet?.defaultLanguage ?? null,
      subscriber_count: safeNumber(channel.statistics?.subscriberCount),
      video_count: safeNumber(channel.statistics?.videoCount),
      view_count: safeNumber(channel.statistics?.viewCount),
      keywords: null, // TODO: Extract from channel branding or description
      privacy_status: channel.status?.privacyStatus ?? 'public',
      is_linked: channel.status?.isLinked ?? false,
      long_uploads_status: channel.status?.longUploadsStatus ?? null,
      made_for_kids: channel.status?.madeForKids ?? false,
      branding_settings: channel.brandingSettings ?? null,
      status: 'pending', // Will be set to 'active' after successful backfill
      last_fetched_at: new Date().toISOString()
    }

    const upsertChannelResult = await supabase
      .rpc('upsert_channel', {
        channel_data: channelData
      }) as unknown

    const typedUpsert = upsertChannelResult as {
      data?: { id?: string } | null
      error?: { message?: string } | null
    }

    const insertedChannel = typedUpsert.data ?? null
    const channelError = typedUpsert.error ?? null

    if (channelError) {
    logger.error('Failed to upsert channel', { channelId, error: channelError })
      return { success: false, error: `Failed to store channel data: ${channelError.message}` }
    }

    const typedInsertedChannel = insertedChannel as { id?: string } | null
    const channelUuid = typedInsertedChannel && typeof typedInsertedChannel.id === 'string'
      ? typedInsertedChannel.id
      : null

  // Step 3: Fetch all videos from uploads playlist
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads
    logger.info('fetching uploads playlist', { channelId, uploadsPlaylistId })

    if (!uploadsPlaylistId) {
      logger.warn('no uploads playlist found', { channelId })
      // Still capture initial stats even if no videos
    } else {
      const playlistOptions: FetchPlaylistItemsOptions = {
        playlistId: uploadsPlaylistId,
        maxPages: 50 // Allow fetching up to 2500 videos (50 pages * 50 videos)
      }

  const playlistItems = await playlistsClient.fetchPlaylistItems(playlistOptions)
  logger.info('found videos in uploads playlist', { channelId, count: playlistItems.length })

      if (playlistItems.length > 0) {
        // Check that we have a valid channel UUID
        if (!channelUuid) {
          logger.error('Cannot process videos without valid channel UUID', { channelId })
          return { success: false, error: 'Failed to get channel UUID for video processing' }
        }

        // Extract video IDs
        const videoIds = playlistItems
          .map(item => item.contentDetails?.videoId)
          .filter((id): id is string => id != null)

        // Fetch detailed video information in batches
        const batchSize = 50 // YouTube API limit
        const videoBatches = []
        for (let i = 0; i < videoIds.length; i += batchSize) {
          videoBatches.push(videoIds.slice(i, i + batchSize))
        }

        const allVideos: VideoResource[] = []
        for (const batch of videoBatches) {
          const videoOptions: FetchVideosOptions = {
            ids: batch
          }

          const videos = await videosClient.fetchVideos(videoOptions)
          allVideos.push(...videos)
        }

          logger.info('fetched detailed video data', { channelId, count: allVideos.length })

        // Convert to database format with categorization
        const videoData = await Promise.all(allVideos.map(async (video) => {
          // Categorize the video
          const categoryId = await categorizeVideo({
            id: '', // Not needed for matching
            youtube_video_id: video.id,
            title: video.snippet?.title ?? '',
            description: video.snippet?.description ?? '',
            channel_id: channelUuid,
            ...(video.contentDetails?.duration && { duration: video.contentDetails.duration }),
            live_broadcast_content: video.snippet?.liveBroadcastContent || 'none'
          }, supabase)

          return {
            youtube_video_id: video.id,
            channel_id: channelUuid,
            title: video.snippet?.title ?? '',
            description: video.snippet?.description ?? '',
            published_at: video.snippet?.publishedAt ?? new Date().toISOString(),
            duration: video.contentDetails?.duration ?? null,
            view_count: safeNumber(video.statistics?.viewCount),
            like_count: safeNumber(video.statistics?.likeCount),
            comment_count: safeNumber(video.statistics?.commentCount),
            thumbnail_url:
              video.snippet?.thumbnails?.maxres?.url ??
              video.snippet?.thumbnails?.high?.url ??
              video.snippet?.thumbnails?.medium?.url ??
              video.snippet?.thumbnails?.default?.url ?? null,
            tags: video.snippet?.tags ?? null,
            youtube_category_id: video.snippet?.categoryId ?? null, // Store YouTube's category ID
            category_id: categoryId, // Use our categorization system result
            live_broadcast_content: video.snippet?.liveBroadcastContent ?? 'none',
            default_language: video.snippet?.defaultLanguage ?? null,
            default_audio_language: video.snippet?.defaultAudioLanguage ?? null,
            licensed_content: video.contentDetails?.licensedContent ?? false,
            projection: video.contentDetails?.projection ?? 'rectangular',
            dimension: video.contentDetails?.dimension ?? '2d',
            definition: video.contentDetails?.definition ?? 'hd',
            caption: video.contentDetails?.caption ?? false,
            allowed_regions: video.contentDetails?.regionRestriction?.allowed ?? null,
            blocked_regions: video.contentDetails?.regionRestriction?.blocked ?? null,
            privacy_status: video.status?.privacyStatus ?? 'public',
            embeddable: video.status?.embeddable !== false,
            status: 'active',
            last_fetched_at: new Date().toISOString()
          }
        }))

        // Store videos in database in batches to avoid timeout
        if (videoData.length > 0) {
          const batchSize = 100 // Upsert videos in batches of 100 to avoid statement timeout
          let totalStored = 0

          for (let i = 0; i < videoData.length; i += batchSize) {
            const batch = videoData.slice(i, i + batchSize)
            logger.info('upserting video batch', { channelId, batchIndex: Math.floor(i / batchSize) + 1, batchSize: batch.length })

            const upsertVideosResult = await supabase
              .rpc('upsert_videos', {
                video_data: batch
              }) as unknown

            const typedUpsertVideos = upsertVideosResult as { error?: { message?: string } | null }
            const videosError = typedUpsertVideos.error ?? null

            if (videosError) {
              logger.error('Failed to upsert video batch', { channelId, batchIndex: Math.floor(i / batchSize) + 1, error: videosError })
              return { success: false, error: `Failed to store video batch: ${videosError.message}` }
            }

            totalStored += batch.length
            logger.info('stored video batch', { channelId, batchIndex: Math.floor(i / batchSize) + 1, stored: batch.length, totalStored })
          }

          totalItemsProcessed += videoData.length
          logger.info('completed video storage', { channelId, totalStored: videoData.length })
        }
      }
    }

    // Step 4: Capture initial channel statistics
  logger.info('capturing initial channel stats', { channelId })
    const statsData = {
      channel_id: channelId,
      captured_at: new Date().toISOString(),
      subscriber_count: channel.statistics?.subscriberCount ?? 0,
      video_count: channel.statistics?.videoCount ?? 0,
      view_count: channel.statistics?.viewCount ?? 0,
      // Additional stats will be captured by REFRESH_CHANNEL_STATS jobs
    }

    const { error: statsError } = await supabase
      .rpc('capture_channel_stats', {
        p_channel_id: channelId,
        stats_data: statsData
      })

    if (statsError) {
      logger.error('Failed to capture channel stats', { channelId, error: statsError })
      // Don't fail the entire job for stats capture failure
      logger.warn('continuing despite stats capture failure', { channelId })
    }

    // Step 5: Update channel status to active
  logger.info('marking channel active', { channelId })
    const { error: updateError } = await supabase
      .from('channels')
      .update({ status: 'active' })
      .eq('youtube_channel_id', channelId)

    if (updateError) {
      logger.error('Failed to update channel status', { channelId, error: updateError })
      // Don't fail the job for this, but log it
      logger.warn('channel status not updated to active', { channelId })
    }

    // Step 6: Enqueue REFRESH_CHANNEL_STATS job
    logger.info('enqueueing REFRESH_CHANNEL_STATS job', { channelId })
    const { error: enqueueError } = await supabase.rpc('enqueue_job', {
      job_type_param: 'REFRESH_CHANNEL_STATS',
      payload_param: {
        channelId: channelId,
      },
      priority_param: 9,
      dedup_key_param: `refresh_channel_stats_${channelId}`,
    })

    if (enqueueError) {
      logger.error('Failed to enqueue REFRESH_CHANNEL_STATS job', { channelId, error: enqueueError })
      // Don't fail the entire job for enqueue failure
      logger.warn('continuing despite REFRESH_CHANNEL_STATS enqueue failure', { channelId })
    }

    // Step 7: Enqueue REFRESH_VIDEO_STATS job for all videos in the channel
    logger.info('enqueueing REFRESH_VIDEO_STATS job for channel', { channelId })
    const { error: videoStatsEnqueueError } = await supabase.rpc('enqueue_job', {
      job_type_param: 'REFRESH_VIDEO_STATS',
      payload_param: {
        channel_id: channelId,
      },
      priority_param: 8,
      dedup_key_param: `refresh_video_stats_channel_${channelId}`,
    })

    if (videoStatsEnqueueError) {
      logger.error('Failed to enqueue REFRESH_VIDEO_STATS job', { channelId, error: videoStatsEnqueueError })
      // Don't fail the entire job for enqueue failure
      logger.warn('continuing despite REFRESH_VIDEO_STATS enqueue failure', { channelId })
    }

  logger.info('successfully backfilled channel', { channelId, itemsProcessed: totalItemsProcessed })
  return { success: true, itemsProcessed: totalItemsProcessed }

  } catch (error) {
    logger.error('error in BACKFILL_CHANNEL handler', { channelId, error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during channel backfill'
    }
  }
}