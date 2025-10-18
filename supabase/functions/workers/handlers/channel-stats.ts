import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeChannelsClient, type FetchChannelsOptions } from '../../../../src/lib/youtube/channels.ts'
import { createYouTubeClientFromEnv } from '../../../../src/lib/youtube/client.ts'
import { logger } from '../../../../src/lib/obs/logger.ts'

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
  logger.info('fetching current channel stats', { channelId })
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

    // Check if channel metadata needs updating
    logger.info('checking for channel metadata updates', { channelId })
    const { data: existingChannel, error: fetchError } = await supabase
      .from('channels')
      .select('title, description, thumbnail_url, custom_url, country, default_language, topic_categories, keywords, privacy_status, is_linked, long_uploads_status, made_for_kids')
      .eq('youtube_channel_id', channelId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      logger.error('Failed to fetch existing channel data', { channelId, error: fetchError })
      return { success: false, error: `Failed to fetch channel data: ${fetchError.message}` }
    }

    // Prepare updated channel data
    const updatedChannelData = {
      title: channel.snippet?.title || existingChannel?.title,
      description: channel.snippet?.description || existingChannel?.description,
      thumbnail_url: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || existingChannel?.thumbnail_url,
      custom_url: channel.snippet?.customUrl || existingChannel?.custom_url,
      country: channel.snippet?.country || existingChannel?.country,
      default_language: channel.snippet?.defaultLanguage || existingChannel?.default_language,
      topic_categories: channel.topicDetails?.topicCategories || existingChannel?.topic_categories,
      keywords: channel.snippet?.keywords ? channel.snippet.keywords.split(',').map((k: string) => k.trim()) : existingChannel?.keywords,
      privacy_status: channel.status?.privacyStatus || existingChannel?.privacy_status,
      is_linked: channel.status?.isLinked || existingChannel?.is_linked,
      long_uploads_status: channel.status?.longUploadsStatus || existingChannel?.long_uploads_status,
      made_for_kids: channel.status?.madeForKids || existingChannel?.made_for_kids,
      last_fetched_at: new Date().toISOString(),
    }

    // Check if any metadata has changed
    const hasMetadataChanged = !existingChannel || 
      updatedChannelData.title !== existingChannel.title ||
      updatedChannelData.description !== existingChannel.description ||
      updatedChannelData.thumbnail_url !== existingChannel.thumbnail_url ||
      updatedChannelData.custom_url !== existingChannel.custom_url ||
      updatedChannelData.country !== existingChannel.country ||
      updatedChannelData.default_language !== existingChannel.default_language ||
      JSON.stringify(updatedChannelData.topic_categories) !== JSON.stringify(existingChannel.topic_categories) ||
      JSON.stringify(updatedChannelData.keywords) !== JSON.stringify(existingChannel.keywords) ||
      updatedChannelData.privacy_status !== existingChannel.privacy_status ||
      updatedChannelData.is_linked !== existingChannel.is_linked ||
      updatedChannelData.long_uploads_status !== existingChannel.long_uploads_status ||
      updatedChannelData.made_for_kids !== existingChannel.made_for_kids

    if (hasMetadataChanged) {
      logger.info('updating channel metadata', { channelId })
      const { error: updateError } = await supabase
        .from('channels')
        .update(updatedChannelData)
        .eq('youtube_channel_id', channelId)

      if (updateError) {
        logger.error('Failed to update channel metadata', { channelId, error: updateError })
        return { success: false, error: `Failed to update channel metadata: ${updateError.message}` }
      }
      logger.info('updated channel metadata', { channelId })
    } else {
      logger.info('channel metadata unchanged', { channelId })
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
  logger.info('storing stats snapshot', { channelId })
    const { data: statsResult, error: statsError } = await supabase
      .rpc('capture_channel_stats', {
        p_channel_id: channelId,
        stats_data: statsData
      })

    if (statsError) {
      logger.error('Failed to capture channel stats', { channelId, error: statsError })
      return { success: false, error: `Failed to store channel statistics: ${statsError.message}` }
    }

    const isNewDay = statsResult?.[0]?.is_new_day ?? false
  logger.info('stored channel stats snapshot', { channelId, isNewDay })

    return { success: true }

  } catch (error) {
    logger.error('error in REFRESH_CHANNEL_STATS handler', { channelId, error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during channel stats refresh'
    }
  }
}