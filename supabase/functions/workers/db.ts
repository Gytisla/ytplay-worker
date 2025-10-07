import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../types/supabase'

/**
 * Idempotent database operations for worker jobs
 * Provides high-level interfaces to RPC functions for data management
 */
export class DatabaseOperations {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Idempotent channel upsert - creates or updates channel data
   */
  async upsertChannel(channelData: {
    youtube_channel_id: string
    title?: string
    description?: string
    custom_url?: string
    published_at?: string
    thumbnail_url?: string
    country?: string
    default_language?: string
    view_count?: number
    subscriber_count?: number
    video_count?: number
    topic_categories?: any[]
    keywords?: string[]
    featured_channels?: string[]
    privacy_status?: string
    is_linked?: boolean
    long_uploads_status?: string
    made_for_kids?: boolean
    branding_settings?: any
    status?: string
  }): Promise<{ channel_id: string; was_created: boolean; was_updated: boolean }> {
    const { data, error } = await (this.supabase as any).rpc('upsert_channel', {
      channel_data: channelData
    })

    if (error) {
      throw new Error(`Failed to upsert channel ${channelData.youtube_channel_id}: ${error.message}`)
    }

    if (!data) {
      throw new Error(`No data returned from upsert_channel for ${channelData.youtube_channel_id}`)
    }

    return {
      channel_id: data.youtube_channel_id,
      was_created: true, // RPC doesn't return this info, assume success
      was_updated: true
    }
  }

  /**
   * Idempotent video batch upsert - creates or updates multiple videos
   */
  async upsertVideos(videoData: Array<{
    youtube_video_id: string
    channel_id: string
    title?: string
    description?: string
    published_at?: string
    duration?: string
    view_count?: number
    like_count?: number
    comment_count?: number
    thumbnail_url?: string
    tags?: string[]
    category_id?: string
    live_broadcast_content?: string
    default_audio_language?: string
    default_language?: string
    projection?: string
    dimension?: string
    definition?: string
    caption?: boolean
    licensed_content?: boolean
    allowed_regions?: string[]
    blocked_regions?: string[]
    privacy_status?: string
    embeddable?: boolean
    status?: string
  }>): Promise<Array<{
    video_id: string
    was_created: boolean
    was_updated: boolean
    change_summary?: any
  }>> {
    const { data, error } = await (this.supabase as any).rpc('upsert_videos', {
      video_data: videoData
    })

    if (error) {
      throw new Error(`Failed to upsert videos: ${error.message}`)
    }

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from upsert_videos RPC')
    }

    return data.map((video: any) => ({
      video_id: video.youtube_video_id,
      was_created: true, // RPC doesn't distinguish, assume success
      was_updated: true,
      change_summary: {} // RPC doesn't provide change summary
    }))
  }

  /**
   * Capture channel statistics snapshot
   */
  async captureChannelStats(
    channelId: string,
    statsData: {
      view_count?: number
      subscriber_count?: number
      video_count?: number
      estimated_minutes_watched?: number
      average_view_duration?: string
    }
  ): Promise<{ stats_id: string; is_new_day: boolean }> {
    const { data, error } = await (this.supabase as any).rpc('capture_channel_stats', {
      p_channel_id: channelId,
      stats_data: statsData
    })

    if (error) {
      throw new Error(`Failed to capture channel stats for ${channelId}: ${error.message}`)
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No data returned from capture_channel_stats for ${channelId}`)
    }

    const result = data[0]
    return {
      stats_id: result.stats_id,
      is_new_day: result.is_new_day
    }
  }

  /**
   * Capture video statistics snapshots
   */
  async captureVideoStats(
    videoStats: Array<{
      video_id: string
      view_count?: number
      like_count?: number
      comment_count?: number
      share_count?: number
    }>
  ): Promise<Array<{
    video_id: string
    stats_id: string
    hourly_change: number
    daily_change: number
  }>> {
    const { data, error } = await (this.supabase as any).rpc('capture_video_stats', {
      video_stats_array: videoStats
    })

    if (error) {
      throw new Error(`Failed to capture video stats: ${error.message}`)
    }

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from capture_video_stats RPC')
    }

    return data.map((stat: any) => ({
      video_id: stat.video_id,
      stats_id: stat.stats_id,
      hourly_change: stat.hourly_change ?? 0,
      daily_change: stat.daily_change ?? 0
    }))
  }

  /**
   * Get channel by YouTube ID
   */
  async getChannelById(youtubeChannelId: string): Promise<Database['public']['Tables']['channels']['Row'] | null> {
    const { data, error } = await this.supabase
      .from('channels')
      .select('*')
      .eq('youtube_channel_id', youtubeChannelId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null
      }
      throw new Error(`Failed to get channel ${youtubeChannelId}: ${error.message}`)
    }

    return data
  }

  /**
   * Get videos by YouTube IDs
   */
  async getVideosByIds(youtubeVideoIds: string[]): Promise<Database['public']['Tables']['videos']['Row'][]> {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .in('youtube_video_id', youtubeVideoIds)

    if (error) {
      throw new Error(`Failed to get videos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get channel statistics for date range
   */
  async getChannelStats(
    channelId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Database['public']['Tables']['channel_stats']['Row'][]> {
    let query = this.supabase
      .from('channel_stats')
      .select('*')
      .eq('channel_id', channelId)
      .order('date', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate.toISOString().split('T')[0])
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get channel stats for ${channelId}: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get video statistics for date range
   */
  async getVideoStats(
    videoId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Database['public']['Tables']['video_stats']['Row'][]> {
    let query = this.supabase
      .from('video_stats')
      .select('*')
      .eq('video_id', videoId)
      .order('date', { ascending: false })
      .order('hour', { ascending: false })

    if (startDate) {
      query = query.gte('date', startDate.toISOString().split('T')[0])
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get video stats for ${videoId}: ${error.message}`)
    }

    return data || []
  }
}