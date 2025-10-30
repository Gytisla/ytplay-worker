import type { SupabaseClient } from '@supabase/supabase-js'
import { RSSPollingOperations } from '../rss.ts'
import { DatabaseOperations } from '../db.ts'
import type { Database } from '../../../types/supabase'
import { RSSParser } from '../../../../src/lib/rss/parser.ts'
import { FeedStateManager } from '../../../../src/lib/rss/state.ts'
import type { FeedState } from '../../../../src/lib/rss/state.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

/**
 * RSS_POLL_CHANNEL job handler
 *
 * Polls RSS feed for a channel to discover new videos:
 * 1. Fetches current RSS feed content
 * 2. Parses videos from the feed
 * 3. Identifies newly published videos
 * 4. Enqueues jobs for new video processing
 * 5. Updates feed polling state
 */
export async function handleRSSPollChannel(
  payload: { channelId: string },
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  const { channelId } = payload

  if (!channelId) {
    return { success: false, error: 'Missing channelId in payload' }
  }

  try {
    // Initialize RSS operations
    const rssOps = new RSSPollingOperations(supabase)
    const parser = new RSSParser()

  // Get current feed state
  logger.info('getting feed state', { channelId })
    const currentState = await rssOps.getChannelFeed(channelId)

    if (!currentState) {
      logger.warn('no feed configuration found', { channelId })
      return { success: false, error: `No RSS feed configured for channel ${channelId}` }
    }

    if (currentState.status !== 'active') {
      logger.info('feed not active; skipping poll', { channelId, status: currentState.status })
      return { success: true, itemsProcessed: 0 }
    }

    // Fetch RSS feed content
  logger.info('fetching rss feed', { channelId, url: currentState.feedUrl })
    const response = await fetch(currentState.feedUrl, {
      headers: {
        ...(currentState.lastETag && { 'If-None-Match': currentState.lastETag }),
        ...(currentState.lastModified && { 'If-Modified-Since': currentState.lastModified }),
        'User-Agent': 'YouTube Fetcher Worker/1.0'
      }
    })

    if (response.status === 304) {
      logger.info('feed not modified since last poll', { channelId })
      // Update last polled time
      const updatedState = {
        ...currentState,
        lastPolledAt: new Date(),
        consecutiveErrors: 0,
        status: 'active' as const
      }
      delete updatedState.errorMessage
      await rssOps.updateFeedState(updatedState)
      return { success: true, itemsProcessed: 0 }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Parse RSS content
    const xmlContent = await response.text()
    const contentType = response.headers.get('content-type') ?? undefined
    logger.info('parsing rss feed', { channelId, sizeChars: xmlContent.length, contentType })
    let videos
    try {
      videos = parser.parseFeed(xmlContent)
    } catch (parseError) {
      // Log a short snippet and content-type to help debugging (don't log full secrets)
      logger.error('Failed to parse RSS feed', {
        channelId,
        error: parseError instanceof Error ? parseError.message : String(parseError),
        contentType,
        snippet: xmlContent?.slice?.(0, 200) ?? undefined,
        sizeChars: xmlContent?.length
      })
      // Re-throw so existing error handling updates feed state
      throw parseError
    }

    if (videos.length === 0) {
      logger.info('no videos found in rss feed', { channelId })
      const etag = response.headers.get('etag') ?? undefined
      const lastModified = response.headers.get('last-modified') ?? undefined
      const headers = {
        ...(etag && { etag }),
        ...(lastModified && { lastModified })
      }
      const updatedState = FeedStateManager.updateAfterSuccessfulPoll(currentState, headers)
      await rssOps.updateFeedState(updatedState)
      return { success: true, itemsProcessed: 0 }
    }

  logger.info('found videos in rss feed', { channelId, count: videos.length })

    // Identify new videos based on publication date
    const lastVideoPublishedAt = currentState.lastVideoPublishedAt
    const newVideos = lastVideoPublishedAt
      ? videos.filter(video => video.publishedAt > lastVideoPublishedAt)
      : videos // If no last published date, consider all videos as new

  logger.info('identified new videos since last poll', { channelId, newCount: newVideos.length })

    // Extract video IDs for job enqueueing
    const newVideoIds = newVideos.map(v => v.videoId)

    // Upsert newly discovered videos into the database (idempotent)
    if (newVideos.length > 0) {
      try {
        const dbOps = new DatabaseOperations(supabase as SupabaseClient<Database>)
        // Ensure channel exists and get internal channel UUID
        let channelRow = await dbOps.getChannelById(channelId)
        if (!channelRow) {
          // Create a minimal channel record if missing
          await dbOps.upsertChannel({ youtube_channel_id: channelId, title: `Channel ${channelId}`, published_at: new Date().toISOString() })
          channelRow = await dbOps.getChannelById(channelId)
        }

        if (channelRow) {
          const videoPayload = newVideos.map((v) => {
            const p: Record<string, unknown> = {
              youtube_video_id: v.videoId,
              channel_id: channelRow.id,
              title: v.title,
              published_at: v.publishedAt.toISOString(),
            }
            if (v.description) p.description = v.description
            if (v.thumbnailUrl) p.thumbnail_url = v.thumbnailUrl
            
            // Note: Categorization will happen later when video stats are fetched from YouTube API
            // (which provides duration and other metadata needed for proper categorization)
            
            return p
          })

          if (videoPayload.length > 0) {
            type UpsertVideoPayload = Array<{
              youtube_video_id: string
              channel_id: string
              title?: string
              description?: string
              published_at?: string
              thumbnail_url?: string
            }>
            logger.info('upserting discovered videos to db', { channelId, count: videoPayload.length })
            const upsertResult = await dbOps.upsertVideos(videoPayload as UpsertVideoPayload)

            // Insert initial video stats for newly discovered videos
            if (upsertResult && upsertResult.length > 0) {
              try {
                // Get the internal video IDs for the newly upserted videos
                const youtubeVideoIds = upsertResult.map(v => v.video_id)
                const { data: videoRecords, error: videosQueryError } = await supabase
                  .from('videos')
                  .select('id, youtube_video_id')
                  .in('youtube_video_id', youtubeVideoIds)

                if (videosQueryError) {
                  throw new Error(`Failed to query video records: ${videosQueryError.message}`)
                }

                if (videoRecords && videoRecords.length > 0) {
                  const today = new Date()
                  const currentDate = today.toISOString().split('T')[0] // YYYY-MM-DD format
                  const currentHour = today.getHours()

                  const statsPayload = videoRecords.map((video) => ({
                    video_id: video.id,
                    date: currentDate,
                    hour: currentHour - 1,
                    view_count: 0,
                    like_count: 0,
                    comment_count: 0,
                    share_count: 0,
                    view_gained: 0,
                    estimated_minutes_watched: 0
                  }))

                  logger.info('inserting initial video stats', { channelId, count: statsPayload.length })

                  // Insert stats directly using Supabase client
                  const { error: statsInsertError } = await supabase
                    .from('video_stats')
                    .upsert(statsPayload, {
                      onConflict: 'video_id,date,hour',
                      ignoreDuplicates: true
                    })

                  if (statsInsertError) {
                    throw new Error(`Failed to insert video stats: ${statsInsertError.message}`)
                  }
                }
              } catch (statsError) {
                logger.error('Failed to insert initial video stats', { channelId, error: statsError })
                // Continue processing even if stats insertion fails
              }
            }
          }
        } else {
          logger.warn('could not ensure channel exists for upserting videos', { channelId })
        }
      } catch (videosError) {
        logger.error('Failed to upsert discovered videos', { channelId, error: videosError })
        // Continue to enqueue jobs even if upsert fails
      }
    }

    // Enqueue jobs for new videos
    if (newVideoIds.length > 0) {
      logger.info('enqueueing video jobs', { channelId, newVideoIdsCount: newVideoIds.length })
      await rssOps.enqueueVideoJobs(channelId, newVideoIds)
    }

    // Update feed state
    const etag = response.headers.get('etag') ?? undefined
    const lastModified = response.headers.get('last-modified') ?? undefined
    const headers = {
      ...(etag && { etag }),
      ...(lastModified && { lastModified })
    }
    const latestVideoPublishedAt = videos.length > 0
      ? videos.reduce((latest, video) =>
          video.publishedAt > latest ? video.publishedAt : latest,
          new Date(0)
        )
      : undefined

    const updatedState: FeedState = {
      ...currentState,
      ...(headers.etag && { lastETag: headers.etag }),
      ...(headers.lastModified && { lastModified: headers.lastModified }),
      lastPolledAt: new Date(),
      ...(latestVideoPublishedAt && { lastVideoPublishedAt: latestVideoPublishedAt }),
      consecutiveErrors: 0,
      status: 'active'
    }
    await rssOps.updateFeedState(updatedState)

  logger.info('successfully processed rss feed', { channelId, itemsProcessed: newVideoIds.length })
  return { success: true, itemsProcessed: newVideoIds.length }

  } catch (error) {
    logger.error('error in RSS_POLL_CHANNEL handler', { channelId, error })

    // Update feed state with error
    try {
      const rssOps = new RSSPollingOperations(supabase)
      await rssOps.updateFeedStateAfterError(channelId, error as Error)
    } catch (updateError) {
      logger.error('failed to update feed state after error', { channelId, updateError })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during RSS polling'
    }
  }
}