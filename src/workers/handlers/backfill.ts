import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeChannelsClient, type FetchChannelsOptions } from '../../lib/youtube/channels'
import { YouTubePlaylistsClient, type FetchPlaylistItemsOptions } from '../../lib/youtube/playlists'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../lib/youtube/videos'
import type { VideoResource } from '../../lib/youtube/types'
import { createYouTubeClientFromEnv } from '../../lib/youtube/client'

/**
 * BACKFILL_CHANNEL job handler
 *
 * Performs initial data ingestion for a new channel:
 * 1. Fetches channel metadata from YouTube API
 * 2. Discovers all videos via uploads playlist
 * 3. Stores channel and video data in database
 * 4. Captures initial channel statistics
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
    console.log(`Fetching channel metadata for ${channelId}`)
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
    console.log(`Storing channel data for ${channelId}`)
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
      console.error('Failed to upsert channel:', channelError)
      return { success: false, error: `Failed to store channel data: ${channelError.message}` }
    }

    const typedInsertedChannel = insertedChannel as { id?: string } | null
    const channelUuid = typedInsertedChannel && typeof typedInsertedChannel.id === 'string'
      ? typedInsertedChannel.id
      : null

    // Step 3: Fetch all videos from uploads playlist
    console.log(`Fetching videos from uploads playlist for ${channelId}`)
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      console.warn(`No uploads playlist found for channel ${channelId}`)
      // Still capture initial stats even if no videos
    } else {
      const playlistOptions: FetchPlaylistItemsOptions = {
        playlistId: uploadsPlaylistId,
        maxPages: 100 // Allow fetching up to 5000 videos (100 pages * 50 videos)
      }

      const playlistItems = await playlistsClient.fetchPlaylistItems(playlistOptions)
      console.log(`Found ${playlistItems.length} videos in uploads playlist`)

      if (playlistItems.length > 0) {
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

        console.log(`Fetched detailed data for ${allVideos.length} videos`)

        // Convert to database format
        const videoData = allVideos.map(video => ({
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
          category_id: video.snippet?.categoryId ?? null,
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
        }))

        // Store videos in database

        if (videoData.length > 0) {
          const upsertVideosResult = await supabase
            .rpc('upsert_videos', {
              video_data: videoData
            }) as unknown

          const typedUpsertVideos = upsertVideosResult as { error?: { message?: string } | null }
          const videosError = typedUpsertVideos.error ?? null

          if (videosError) {
            console.error('Failed to upsert videos:', videosError)
            return { success: false, error: `Failed to store video data: ${videosError.message}` }
          }

          totalItemsProcessed += videoData.length
          console.log(`Stored ${videoData.length} videos for channel ${channelId}`)
        }
      }
    }

    // Step 4: Capture initial channel statistics
    console.log(`Capturing initial stats for channel ${channelId}`)
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
      console.error('Failed to capture channel stats:', statsError)
      // Don't fail the entire job for stats capture failure
      console.warn('Continuing despite stats capture failure')
    }

    // Step 5: Update channel status to active
    console.log(`Marking channel ${channelId} as active`)
    const { error: updateError } = await supabase
      .from('channels')
      .update({ status: 'active' })
      .eq('youtube_channel_id', channelId)

    if (updateError) {
      console.error('Failed to update channel status:', updateError)
      // Don't fail the job for this, but log it
      console.warn('Channel status not updated to active')
    }

    console.log(`Successfully backfilled channel ${channelId} with ${totalItemsProcessed} items processed`)
    return { success: true, itemsProcessed: totalItemsProcessed }

  } catch (error) {
    console.error(`Error in BACKFILL_CHANNEL handler for ${channelId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during channel backfill'
    }
  }
}