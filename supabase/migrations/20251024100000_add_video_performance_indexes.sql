-- Migration: 20251024100000_add_video_performance_indexes.sql
-- Description: Add indexes to optimize video_performance view queries

-- Index for videos table JOINs
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON videos(category_id);

-- Index for video_stats table queries (used heavily in the view)
CREATE INDEX IF NOT EXISTS idx_video_stats_video_id ON video_stats(video_id);
CREATE INDEX IF NOT EXISTS idx_video_stats_date ON video_stats(date);

-- Composite indexes for video_stats date range queries
CREATE INDEX IF NOT EXISTS idx_video_stats_video_id_date ON video_stats(video_id, date);
CREATE INDEX IF NOT EXISTS idx_video_stats_video_id_date_hour ON video_stats(video_id, date DESC, hour DESC);

-- Index for video_categories table
CREATE INDEX IF NOT EXISTS idx_video_categories_id ON video_categories(id);