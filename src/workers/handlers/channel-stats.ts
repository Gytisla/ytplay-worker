import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeChannelsClient, type FetchChannelsOptions } from '../../lib/youtube/channels'
import { createYouTubeClientFromEnv } from '../../lib/youtube/client'

/**
 * REFRESH_CHANNEL_STATS job handler
 *
 * Updates channel statistics with current data from YouTube API:
 * 1. Fetches latest channel statistics from YouTube API
 * 2. Calculates daily changes and stores historical snapshot
 * 3. Updates channel summary statistics
 */
export async function handleRefreshChannelStats(
  payload: { channelId: string },
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  const { channelId } = payload

  if (!channelId) {
    return { success: false, error: 'Missing channelId in payload' }
  }

  try {
    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const channelsClient = new YouTubeChannelsClient(youtubeClient)

    // Fetch current channel statistics
    console.log(`Fetching current stats for channel ${channelId}`)
    const channelOptions: FetchChannelsOptions = {
      ids: [channelId]
      // Use default config which includes statistics part
    }

    const channels = await channelsClient.fetchChannels(channelOptions)
    if (channels.length === 0) {
      return { success: false, error: `Channel ${channelId} not found on YouTube` }
    }

    const channel = channels[0]!
    if (!channel.statistics) {
      return { success: false, error: `No statistics available for channel ${channelId}` }
    }

    // Prepare statistics data for storage
    const statsData = {
      channel_id: channelId,
      captured_at: new Date().toISOString(),
      view_count: channel.statistics.viewCount ?? 0,
      subscriber_count: channel.statistics.subscriberCount ?? 0,
      video_count: channel.statistics.videoCount ?? 0,
      // Additional stats that might be available in the future:
      // estimated_minutes_watched: channel.statistics.estimatedMinutesWatched || 0,
      // average_view_duration: channel.statistics.averageViewDuration || null
    }

    // Store statistics snapshot
    console.log(`Storing stats snapshot for channel ${channelId}`)
    const { data: statsResult, error: statsError } = await supabase
      .rpc('capture_channel_stats', {
        p_channel_id: channelId,
        stats_data: statsData
      })

    if (statsError) {
      console.error('Failed to capture channel stats:', statsError)
      return { success: false, error: `Failed to store channel statistics: ${statsError.message}` }
    }

    const isNewDay = statsResult?.[0]?.is_new_day ?? false
    console.log(`Successfully ${isNewDay ? 'created new daily' : 'updated existing'} stats snapshot for channel ${channelId}`)

    return { success: true }

  } catch (error) {
    console.error(`Error in REFRESH_CHANNEL_STATS handler for ${channelId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during channel stats refresh'
    }
  }
}