import type { SupabaseClient } from '@supabase/supabase-js'
import type { FeedState } from '../lib/rss/state'

/**
 * RSS polling database operations
 * Provides database access layer for RSS feed polling functionality
 */
export class RSSPollingOperations {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get channel feed configuration and current state
   */
  async getChannelFeed(channelId: string): Promise<FeedState | null> {
    // Get the channel UUID first
    const { data: channel } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single()

    if (!channel) {
      return null
    }

    const { data: feedData, error } = await this.supabase
      .from('channel_feeds')
      .select('*')
      .eq('channel_id', channel.id)
      .single()

    if (error || !feedData) {
      return null
    }

    // Convert database row to FeedState
    return {
      channelId,
      feedUrl: feedData.feed_url,
      pollIntervalMinutes: feedData.poll_interval_minutes || 10,
      consecutiveErrors: feedData.consecutive_failures || 0,
      status: feedData.is_active ? 'active' : 'paused',
      ...(feedData.etag && { lastETag: feedData.etag }),
      ...(feedData.last_modified && { lastModified: feedData.last_modified }),
      ...(feedData.last_polled_at && { lastPolledAt: new Date(feedData.last_polled_at) }),
      ...(feedData.last_successful_poll_at && { lastVideoPublishedAt: new Date(feedData.last_successful_poll_at) }),
      ...(feedData.last_error_message && { errorMessage: feedData.last_error_message }),
    }
  }

  /**
   * Update feed state after polling
   */
  async updateFeedState(state: FeedState): Promise<void> {
    // Get the channel UUID first
    const { data: channel } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', state.channelId)
      .single()

    if (!channel) {
      throw new Error(`Channel not found: ${state.channelId}`)
    }

    const { error } = await this.supabase
      .from('channel_feeds')
      .update({
        etag: state.lastETag,
        last_modified: state.lastModified,
        last_polled_at: state.lastPolledAt?.toISOString(),
        last_successful_poll_at: state.lastVideoPublishedAt?.toISOString(),
        poll_interval_minutes: state.pollIntervalMinutes,
        consecutive_failures: state.consecutiveErrors,
        is_active: state.status === 'active',
        last_error_message: state.errorMessage || null,
        updated_at: new Date().toISOString(),
      })
      .eq('channel_id', channel.id)

    if (error) {
      throw new Error(`Failed to update feed state: ${error.message}`)
    }
  }

  /**
   * Update feed state after polling error
   */
  async updateFeedStateAfterError(channelId: string, error: Error): Promise<void> {
    // Get the channel UUID first
    const { data: channel } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single()

    if (!channel) {
      // Channel doesn't exist, nothing to update
      return
    }

    // First get current consecutive failures count
    const { data: currentFeed } = await this.supabase
      .from('channel_feeds')
      .select('consecutive_failures, is_active')
      .eq('channel_id', channel.id)
      .single()

    const currentFailures = (currentFeed?.consecutive_failures || 0) + 1
    const shouldDeactivate = currentFailures >= 5

    const now = new Date()
    const { error: updateError } = await this.supabase
      .from('channel_feeds')
      .update({
        last_error_at: now.toISOString(),
        last_error_message: error.message,
        consecutive_failures: currentFailures,
        is_active: shouldDeactivate ? false : (currentFeed?.is_active ?? true),
        updated_at: now.toISOString(),
      })
      .eq('channel_id', channel.id)

    if (updateError) {
      throw new Error(`Failed to update feed state after error: ${updateError.message}`)
    }
  }

  /**
   * Enqueue video hydration jobs for newly discovered videos
   */
  async enqueueVideoJobs(channelId: string, videoIds: string[]): Promise<void> {
    if (videoIds.length === 0) {
      return
    }

    // Use the enqueue_job RPC function for proper deduplication
    for (const videoId of videoIds) {
      const { error } = await this.supabase.rpc('enqueue_job', {
        job_type_param: 'REFRESH_VIDEO_STATS',
        payload_param: {
          channel_id: channelId,
          video_ids: [videoId],
        },
        priority_param: 7,
        dedup_key_param: `refresh_video_stats_${videoId}`,
      })

      if (error) {
        throw new Error(`Failed to enqueue video job for ${videoId}: ${error.message}`)
      }
    }
  }

  /**
   * Get channels that are due for RSS polling
   */
  async getChannelsDueForPolling(): Promise<Array<{ channelId: string; feedUrl: string }>> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    // Get channels that have never been polled (last_polled_at is null)
    const { data: neverPolled, error: neverPolledError } = await this.supabase
      .from('channel_feeds')
      .select(`
        channel_id,
        feed_url,
        last_polled_at,
        poll_interval_minutes,
        channels!inner(youtube_channel_id)
      `)
      .eq('is_active', true)
      .filter('last_polled_at', 'is', null)

    if (neverPolledError) {
      throw new Error(`Failed to get never polled channels: ${neverPolledError.message}`)
    }

    // Get channels polled more than 10 minutes ago
    const { data: overduePolled, error: overduePolledError } = await this.supabase
      .from('channel_feeds')
      .select(`
        channel_id,
        feed_url,
        last_polled_at,
        poll_interval_minutes,
        channels!inner(youtube_channel_id)
      `)
      .eq('is_active', true)
      .lt('last_polled_at', tenMinutesAgo)

    if (overduePolledError) {
      throw new Error(`Failed to get overdue polled channels: ${overduePolledError.message}`)
    }

    // Combine and deduplicate results
    const allChannels = [...(neverPolled || []), ...(overduePolled || [])]
    const uniqueChannels = allChannels.filter((channel, index, self) => 
      index === self.findIndex(c => c.channel_id === channel.channel_id)
    )

    return uniqueChannels.map(row => ({
      channelId: (row.channels as any).youtube_channel_id,
      feedUrl: row.feed_url,
    }))
  }

  /**
   * Create or update channel feed configuration
   */
  async upsertChannelFeed(channelId: string, feedUrl: string, options?: {
    pollIntervalMinutes?: number
    feedType?: string
  }): Promise<void> {
    // Ensure the channel exists in the channels table
    const { data: existingChannel } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single()

    let channelUuid: string
    if (!existingChannel) {
      // Create the channel if it doesn't exist
      const { data: newChannel, error: insertError } = await this.supabase
        .from('channels')
        .insert({
          youtube_channel_id: channelId,
          title: `Channel ${channelId}`,
          published_at: '2025-01-01T00:00:00.000Z',
        })
        .select('id')
        .single()

      if (insertError || !newChannel) {
        throw new Error(`Failed to create channel: ${channelId}`)
      }
      channelUuid = newChannel.id
    } else {
      channelUuid = existingChannel.id
    }

    const { error } = await this.supabase
      .from('channel_feeds')
      .upsert({
        channel_id: channelUuid,
        feed_url: feedUrl,
        feed_type: options?.feedType || 'youtube_rss',
        poll_interval_minutes: options?.pollIntervalMinutes || 10,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'channel_id,feed_url'
      })

    if (error) {
      throw new Error(`Failed to upsert channel feed: ${error.message}`)
    }
  }


}