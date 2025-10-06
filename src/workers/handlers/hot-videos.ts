import type { SupabaseClient } from '@supabase/supabase-js'
import { YouTubeVideosClient, type FetchVideosOptions } from '../../lib/youtube/videos'
import { createYouTubeClientFromEnv } from '../../lib/youtube/client'

/**
 * REFRESH_HOT_VIDEOS job handler
 *
 * Updates statistics for recently published videos ("hot videos"):
 * 1. Identifies videos published within the last 7 days
 * 2. Fetches current statistics from YouTube API
 * 3. Stores statistics snapshots for trend analysis
 */
export async function handleRefreshHotVideos(
  _payload: Record<string, never>, // No specific payload needed
  supabase: SupabaseClient
): Promise<{ success: boolean; itemsProcessed?: number; error?: string }> {
  try {
    // Initialize YouTube API client
    const youtubeClient = createYouTubeClientFromEnv()
    const videosClient = new YouTubeVideosClient(youtubeClient)

    // Query for hot videos (published within last 7 days)
    console.log('Querying for hot videos (published ≤7 days ago)')
    const { data: hotVideos, error: queryError } = await supabase
      .from('videos')
      .select('id, youtube_video_id, title')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (queryError) {
      console.error('Failed to query hot videos:', queryError)
      return { success: false, error: `Database query failed: ${queryError.message}` }
    }

    if (!hotVideos || hotVideos.length === 0) {
      console.log('No hot videos found to refresh')
      return { success: true, itemsProcessed: 0 }
    }

    console.log(`Found ${hotVideos.length} hot videos to refresh`)

    // Extract YouTube video IDs
    const videoIds = hotVideos.map(v => v.youtube_video_id).filter(Boolean) as string[]

    if (videoIds.length === 0) {
      console.log('No valid YouTube video IDs found')
      return { success: true, itemsProcessed: 0 }
    }

    // Fetch current statistics from YouTube API
    console.log(`Fetching statistics for ${videoIds.length} videos`)
    const fetchOptions: FetchVideosOptions = {
      ids: videoIds,
      config: {
        part: ['statistics'], // Only need statistics for refresh
        batchSize: 50, // YouTube API limit
      }
    }

    const videos = await videosClient.fetchVideos(fetchOptions)

    if (videos.length === 0) {
      console.log('No videos returned from YouTube API')
      return { success: true, itemsProcessed: 0 }
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
      console.log('No videos with statistics to capture')
      return { success: true, itemsProcessed: 0 }
    }

    // Store statistics snapshots
    console.log(`Capturing statistics for ${statsData.length} videos`)
    const { error: captureError } = await supabase
      .rpc('capture_video_stats', {
        video_stats_array: statsData
      })

    if (captureError) {
      console.error('Failed to capture video stats:', captureError)
      return { success: false, error: `Failed to store video statistics: ${captureError.message}` }
    }

    console.log(`Successfully refreshed statistics for ${statsData.length} hot videos`)
    return { success: true, itemsProcessed: statsData.length }

  } catch (error) {
    console.error('Error in REFRESH_HOT_VIDEOS handler:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during hot videos refresh'
    }
  }
}