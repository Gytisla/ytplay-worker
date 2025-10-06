export interface ChannelFeedResult {
  id: string
  channel_id: string
  feed_url: string
  feed_type: 'youtube_rss' | 'custom_rss'
  poll_interval_minutes: number
  is_active: boolean
  consecutive_failures: number
  last_error_message?: string | null
  last_error_at?: string | null
  created_at: string
  updated_at: string
  last_polled_at?: string | null
  last_successful_poll_at?: string | null
  youtube_channel_id: string  // From join with channels table
}

export interface JobResult {
  id: string
  job_type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: number
  payload: Record<string, unknown>
  dedup_key?: string | null
  created_at: string
  updated_at: string
  feed_type: string
  feed_url: string
  channel_id: string
}

export interface JobEventResult {
  id: string
  job_type: string
  job_id: string
  status: string
  error_message?: string | null
  created_at: string
  metadata?: Record<string, unknown>
  duration_ms?: number | null
  attempt_number?: number | null
}