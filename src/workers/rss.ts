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
    const { data: channelRaw } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single()
    const channel = typeof channelRaw === 'object' && channelRaw !== null && 'id' in channelRaw ? channelRaw as { id: string } : null;
    if (!channel) {
      return null;
    }

    const { data: feedDataRaw, error } = await this.supabase
      .from('channel_feeds')
      .select('*')
      .eq('channel_id', channel.id)
      .single()
    const feedData = typeof feedDataRaw === 'object' && feedDataRaw !== null ? feedDataRaw as Record<string, unknown> : null;
    if (error || !feedData) {
      return null;
    }

    // Convert database row to FeedState
    return {
      channelId,
      feedUrl: typeof feedData['feed_url'] === 'string' ? feedData['feed_url'] : '',
      pollIntervalMinutes: typeof feedData['poll_interval_minutes'] === 'number' ? feedData['poll_interval_minutes'] : 10,
      consecutiveErrors: typeof feedData['consecutive_failures'] === 'number' ? feedData['consecutive_failures'] : 0,
      status: feedData['is_active'] === true ? 'active' : 'paused',
      ...(typeof feedData['etag'] === 'string' && feedData['etag'] ? { lastETag: feedData['etag'] } : {}),
      ...(typeof feedData['last_modified'] === 'string' && feedData['last_modified'] ? { lastModified: feedData['last_modified'] } : {}),
      ...(typeof feedData['last_polled_at'] === 'string' && feedData['last_polled_at'] ? { lastPolledAt: new Date(feedData['last_polled_at']) } : {}),
      ...(typeof feedData['last_successful_poll_at'] === 'string' && feedData['last_successful_poll_at'] ? { lastVideoPublishedAt: new Date(feedData['last_successful_poll_at']) } : {}),
      ...(typeof feedData['last_error_message'] === 'string' && feedData['last_error_message'] ? { errorMessage: feedData['last_error_message'] } : {}),
    };
  }

  /**
   * Update feed state after polling
   */
  async updateFeedState(state: FeedState): Promise<void> {
    // Get the channel UUID first
    const { data: channelRaw } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', state.channelId)
      .single()
    const channel = typeof channelRaw === 'object' && channelRaw !== null && 'id' in channelRaw ? channelRaw as { id: string } : null;
    if (!channel) {
      throw new Error(`Channel not found: ${state.channelId}`);
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
        last_error_message: state.errorMessage ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('channel_id', channel.id)
    if (error) {
      throw new Error(`Failed to update feed state: ${error.message}`);
    }
  }

  /**
   * Update feed state after polling error
   */
  async updateFeedStateAfterError(channelId: string, error: Error): Promise<void> {
    // Get the channel UUID first
    const { data: channelRaw } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single()
    const channel = typeof channelRaw === 'object' && channelRaw !== null && 'id' in channelRaw ? channelRaw as { id: string } : null;
    if (!channel) {
      // Channel doesn't exist, nothing to update
      return;
    }

    // First get current consecutive failures count
    interface ChannelFeedErrorState { consecutive_failures: number; is_active: boolean }
    const { data: currentFeedRaw } = await this.supabase
      .from('channel_feeds')
      .select('consecutive_failures, is_active')
      .eq('channel_id', channel.id)
      .single()
    const currentFeed = typeof currentFeedRaw === 'object' && currentFeedRaw !== null ? currentFeedRaw as ChannelFeedErrorState : null;
    const currentFailures = (currentFeed?.consecutive_failures ?? 0) + 1;
    const shouldDeactivate = currentFailures >= 5;

    const now = new Date();
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
      throw new Error(`Failed to update feed state after error: ${updateError.message}`);
    }
  }

  /**
   * Enqueue video hydration jobs for newly discovered videos
   */
  async enqueueVideoJobs(channelId: string, videoIds: string[]): Promise<void> {
    if (videoIds.length === 0) {
      return;
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
      });
      if (error) {
        throw new Error(`Failed to enqueue video job for ${videoId}: ${error.message}`);
      }
    }
  }

  /**
   * Get channels that are due for RSS polling
   */
  async getChannelsDueForPolling(): Promise<Array<{ channelId: string; feedUrl: string }>> {
    interface ChannelFeedResponse {
      feed_url: string;
      last_polled_at: string | null;
      poll_interval_minutes: number;
      channels: { youtube_channel_id: string };
    }
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    // Get channels that have never been polled (last_polled_at is null)
    const { data: neverPolledFeedsRaw, error: neverPolledError } = await this.supabase
      .from('channel_feeds')
      .select(`
        feed_url,
        last_polled_at,
        poll_interval_minutes,
        channels:channels!channel_feeds_channel_id_fkey(youtube_channel_id)
      `)
      .eq('is_active', true)
      .filter('last_polled_at', 'is', null)
      .returns<ChannelFeedResponse[]>();
    const neverPolledFeeds = Array.isArray(neverPolledFeedsRaw) ? neverPolledFeedsRaw : [];
    if (neverPolledError) {
      throw new Error(`Failed to get never polled channels: ${neverPolledError.message}`);
    }
    // Get channels polled more than 10 minutes ago
    const { data: overduePolledFeedsRaw, error: overduePolledError } = await this.supabase
      .from('channel_feeds')
      .select(`
        feed_url,
        last_polled_at,
        poll_interval_minutes,
        channels:channels!channel_feeds_channel_id_fkey(youtube_channel_id)
      `)
      .eq('is_active', true)
      .lt('last_polled_at', tenMinutesAgo)
      .returns<ChannelFeedResponse[]>();
    const overduePolledFeeds = Array.isArray(overduePolledFeedsRaw) ? overduePolledFeedsRaw : [];
    if (overduePolledError) {
      throw new Error(`Failed to get overdue polled channels: ${overduePolledError.message}`);
    }
    // Combine, filter out feeds with missing youtube_channel_id, and deduplicate
    const allFeeds = [...neverPolledFeeds, ...overduePolledFeeds];
     
    console.log('DEBUG getChannelsDueForPolling allFeeds:', JSON.stringify(allFeeds, null, 2));
    return allFeeds
      .filter(feed => typeof feed.channels === 'object' && feed.channels !== null && typeof feed.channels.youtube_channel_id === 'string')
      .filter((feed, index, self) =>
        index === self.findIndex(f => f.channels.youtube_channel_id === feed.channels.youtube_channel_id)
      )
      .map(feed => ({
        channelId: feed.channels.youtube_channel_id,
        feedUrl: feed.feed_url,
      }));
  }

  /**
   * Create or update channel feed configuration
   */
  async upsertChannelFeed(channelId: string, feedUrl: string, options?: {
    pollIntervalMinutes?: number
    feedType?: string
  }): Promise<void> {
    // Ensure the channel exists in the channels table
    const { data: existingChannelRaw } = await this.supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', channelId)
      .single();
    const existingChannel = typeof existingChannelRaw === 'object' && existingChannelRaw !== null && 'id' in existingChannelRaw ? existingChannelRaw as { id: string } : null;
    let channelUuid: string;
    if (!existingChannel) {
      // Create the channel if it doesn't exist
      const { data: newChannelRaw, error: insertError } = await this.supabase
        .from('channels')
        .insert({
          youtube_channel_id: channelId,
          title: `Channel ${channelId}`,
          published_at: '2025-01-01T00:00:00.000Z',
        })
        .select('id')
        .single();
      const newChannel = typeof newChannelRaw === 'object' && newChannelRaw !== null && 'id' in newChannelRaw ? newChannelRaw as { id: string } : null;
      if (insertError || !newChannel) {
        throw new Error(`Failed to create channel: ${channelId}`);
      }
      channelUuid = newChannel.id;
    } else {
      channelUuid = existingChannel.id;
    }
    const { error } = await this.supabase
      .from('channel_feeds')
      .upsert({
        channel_id: channelUuid,
        feed_url: feedUrl,
        feed_type: options?.feedType ?? 'youtube_rss',
        poll_interval_minutes: options?.pollIntervalMinutes ?? 10,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'channel_id,feed_url'
      });
    if (error) {
      throw new Error(`Failed to upsert channel feed: ${error.message}`);
    }
  }


}