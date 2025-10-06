import type { SupabaseClient } from '@supabase/supabase-js'
import { RSSPollingOperations } from '../../workers/rss'
import { RSSParser } from '../../lib/rss/parser'
import { FeedStateManager } from '../../lib/rss/state'

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
    console.log(`Getting feed state for channel ${channelId}`)
    const currentState = await rssOps.getChannelFeed(channelId)

    if (!currentState) {
      console.log(`No feed configuration found for channel ${channelId}`)
      return { success: false, error: `No RSS feed configured for channel ${channelId}` }
    }

    if (currentState.status !== 'active') {
      console.log(`Feed is not active for channel ${channelId} (status: ${currentState.status})`)
      return { success: true, itemsProcessed: 0 }
    }

    // Fetch RSS feed content
    console.log(`Fetching RSS feed from ${currentState.feedUrl}`)
    const response = await fetch(currentState.feedUrl, {
      headers: {
        ...(currentState.lastETag && { 'If-None-Match': currentState.lastETag }),
        ...(currentState.lastModified && { 'If-Modified-Since': currentState.lastModified }),
        'User-Agent': 'YouTube Fetcher Worker/1.0'
      }
    })

    if (response.status === 304) {
      console.log('Feed not modified since last poll')
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
    console.log(`Parsing RSS feed (${xmlContent.length} characters)`)
    const videos = parser.parseFeed(xmlContent)

    if (videos.length === 0) {
      console.log('No videos found in RSS feed')
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

    console.log(`Found ${videos.length} videos in RSS feed`)

    // Identify new videos based on publication date
    const lastVideoPublishedAt = currentState.lastVideoPublishedAt
    const newVideos = lastVideoPublishedAt
      ? videos.filter(video => video.publishedAt > lastVideoPublishedAt)
      : videos // If no last published date, consider all videos as new

    console.log(`Identified ${newVideos.length} new videos since last poll`)

    // Extract video IDs for job enqueueing
    const newVideoIds = newVideos.map(v => v.videoId)

    // Enqueue jobs for new videos
    if (newVideoIds.length > 0) {
      console.log(`Enqueueing jobs for ${newVideoIds.length} new videos`)
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

    const updatedState = {
      ...currentState,
      lastETag: headers.etag ?? currentState.lastETag,
      lastModified: headers.lastModified ?? currentState.lastModified,
      lastPolledAt: new Date(),
      lastVideoPublishedAt: latestVideoPublishedAt ?? currentState.lastVideoPublishedAt,
      consecutiveErrors: 0,
      status: 'active' as const,
      errorMessage: undefined
    }
    await rssOps.updateFeedState(updatedState)

    console.log(`Successfully processed RSS feed for channel ${channelId}`)
    return { success: true, itemsProcessed: newVideoIds.length }

  } catch (error) {
    console.error(`Error in RSS_POLL_CHANNEL handler for ${channelId}:`, error)

    // Update feed state with error
    try {
      const rssOps = new RSSPollingOperations(supabase)
      await rssOps.updateFeedStateAfterError(channelId, error as Error)
    } catch (updateError) {
      console.error('Failed to update feed state after error:', updateError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during RSS polling'
    }
  }
}