-- Migration: 004_indexes.sql
-- Description: Performance indexes for optimal query execution
-- Created: $(date)

-- Additional indexes for channels table
CREATE INDEX IF NOT EXISTS idx_channels_country ON channels(country);
CREATE INDEX IF NOT EXISTS idx_channels_subscriber_count ON channels(subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_channels_video_count ON channels(video_count DESC);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at);
CREATE INDEX IF NOT EXISTS idx_channels_updated_at ON channels(updated_at);

-- Composite indexes for channels
CREATE INDEX IF NOT EXISTS idx_channels_status_country ON channels(status, country);
CREATE INDEX IF NOT EXISTS idx_channels_status_subscribers ON channels(status, subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_channels_active_recent ON channels(status, updated_at DESC) WHERE status = 'active';

-- Additional indexes for videos table
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_like_count ON videos(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_comment_count ON videos(comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_duration ON videos(duration);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_privacy_status ON videos(privacy_status);
CREATE INDEX IF NOT EXISTS idx_videos_live_broadcast ON videos(live_broadcast_content);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_updated_at ON videos(updated_at);

-- Composite indexes for videos
CREATE INDEX IF NOT EXISTS idx_videos_channel_published ON videos(channel_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_channel_status ON videos(channel_id, status);
CREATE INDEX IF NOT EXISTS idx_videos_status_published ON videos(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_channel_views ON videos(channel_id, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_popular_recent ON videos(published_at DESC, view_count DESC) WHERE status = 'active';

-- GIN indexes for array and JSONB columns in videos
CREATE INDEX IF NOT EXISTS idx_videos_tags_gin ON videos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_videos_allowed_regions_gin ON videos USING GIN(allowed_regions);
CREATE INDEX IF NOT EXISTS idx_videos_blocked_regions_gin ON videos USING GIN(blocked_regions);

-- Additional indexes for channel_stats table
CREATE INDEX IF NOT EXISTS idx_channel_stats_subscriber_count ON channel_stats(subscriber_count DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_view_count ON channel_stats(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_subscriber_gained ON channel_stats(subscriber_gained DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_view_gained ON channel_stats(view_gained DESC);

-- Composite indexes for channel_stats
CREATE INDEX IF NOT EXISTS idx_channel_stats_channel_date ON channel_stats(channel_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_date_subscribers ON channel_stats(date, subscriber_count DESC);

-- Additional indexes for video_stats table
CREATE INDEX IF NOT EXISTS idx_video_stats_view_count ON video_stats(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_stats_like_count ON video_stats(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_stats_comment_count ON video_stats(comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_video_stats_view_gained ON video_stats(view_gained DESC);

-- Composite indexes for video_stats
CREATE INDEX IF NOT EXISTS idx_video_stats_video_date ON video_stats(video_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_video_stats_video_hour ON video_stats(video_id, date DESC, hour);
CREATE INDEX IF NOT EXISTS idx_video_stats_date_views ON video_stats(date, view_count DESC);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_active_only ON videos(published_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_videos_public_only ON videos(published_at DESC) WHERE privacy_status = 'public' AND status = 'active';

-- Indexes for job queue optimization
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX IF NOT EXISTS idx_jobs_failed_at ON jobs(failed_at);

-- Partial indexes for job states
CREATE INDEX IF NOT EXISTS idx_jobs_dead_letter ON jobs(created_at DESC) WHERE status = 'dead_letter';

-- Indexes for job events
CREATE INDEX IF NOT EXISTS idx_job_events_job_created ON job_events(job_id, created_at DESC);

-- Indexes for channel feeds
CREATE INDEX IF NOT EXISTS idx_channel_feeds_feed_type ON channel_feeds(feed_type);
CREATE INDEX IF NOT EXISTS idx_channel_feeds_consecutive_failures ON channel_feeds(consecutive_failures);
CREATE INDEX IF NOT EXISTS idx_channel_feeds_error_recent ON channel_feeds(last_error_at DESC) WHERE last_error_at IS NOT NULL;

-- Indexes for API budget and usage
CREATE INDEX IF NOT EXISTS idx_api_budget_usage_ratio ON api_budget(date, current_usage, daily_limit) WHERE current_usage > 0;
CREATE INDEX IF NOT EXISTS idx_api_usage_log_response_status ON api_usage_log(response_status);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_cost ON api_usage_log(cost_usd DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_channels_title_search ON channels USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_channels_description_search ON channels USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_videos_title_search ON videos USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_videos_description_search ON videos USING GIN(to_tsvector('english', description));

-- BRIN indexes for time-series data (more efficient for large datasets)
-- These are alternatives to B-tree indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_channel_stats_date_brin ON channel_stats USING BRIN(date);
CREATE INDEX IF NOT EXISTS idx_video_stats_date_brin ON video_stats USING BRIN(date);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_brin ON api_usage_log USING BRIN(created_at);

-- Comments for documentation
COMMENT ON INDEX idx_channels_title_search IS 'Full-text search index for channel titles';
COMMENT ON INDEX idx_videos_popular_recent IS 'Index for finding popular recent videos';
COMMENT ON INDEX idx_jobs_status_priority_scheduled IS 'Critical index for job queue ordering';
COMMENT ON INDEX idx_api_budget_usage_ratio IS 'Index for quota monitoring and alerts';