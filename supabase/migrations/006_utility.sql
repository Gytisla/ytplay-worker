-- Migration: 006_utility.sql
-- Description: Utility functions and views for data aggregation and analytics
-- Created: $(date)

-- ===========================================
-- ANALYTICS VIEWS
-- ===========================================

-- View for channel performance metrics
CREATE OR REPLACE VIEW channel_performance AS
SELECT
    c.id,
    c.youtube_channel_id as channel_id,
    c.title,
    c.subscriber_count,
    c.video_count,
    c.view_count,
    c.created_at as channel_created_at,
    c.updated_at as channel_updated_at,
    -- Latest stats
    cs.subscriber_count as current_subscribers,
    cs.video_count as current_videos,
    cs.view_count as current_views,
    cs.date as last_stats_update,
    -- Growth metrics (last 30 days)
    COALESCE(cs.subscriber_count - lag(cs.subscriber_count, 1) OVER (
        PARTITION BY c.id ORDER BY cs.date
    ), 0) as subscriber_growth_30d,
    -- Video metrics
    v.video_count as total_videos,
    v.recent_video_count_30d,
    v.avg_views_per_video,
    v.total_views,
    -- Activity score (weighted combination of metrics)
    (
        COALESCE(cs.subscriber_count, 0) * 0.3 +
        COALESCE(v.total_views, 0) * 0.4 +
        COALESCE(v.recent_video_count_30d, 0) * 10 * 0.3
    ) as activity_score
FROM channels c
LEFT JOIN channel_stats cs ON c.id = cs.channel_id
LEFT JOIN (
    SELECT
        channel_id,
        COUNT(*) as video_count,
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days') as recent_video_count_30d,
        ROUND(AVG(view_count)) as avg_views_per_video,
        SUM(view_count) as total_views
    FROM videos
    GROUP BY channel_id
) v ON c.id = v.channel_id
WHERE cs.date = (
    SELECT MAX(date)
    FROM channel_stats cs2
    WHERE cs2.channel_id = c.id
);

-- View for video performance metrics
CREATE OR REPLACE VIEW video_performance AS
SELECT
    v.id,
    v.title,
    v.channel_id,
    c.title as channel_title,
    v.view_count,
    v.like_count,
    v.comment_count,
    v.duration,
    v.published_at,
    v.updated_at,
    -- Engagement rate
    CASE
        WHEN v.view_count > 0 THEN
            ROUND(((v.like_count + v.comment_count)::DECIMAL / v.view_count) * 100, 2)
        ELSE 0
    END as engagement_rate_percent,
    -- Age in days
    EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 86400 as age_days,
    -- Performance score
    (
        v.view_count * 0.5 +
        COALESCE(v.like_count, 0) * 2 +
        COALESCE(v.comment_count, 0) * 5
    ) as performance_score,
    -- Stats history
    vs.view_count as latest_views,
    vs.like_count as latest_likes,
    vs.comment_count as latest_comments,
    vs.date as last_stats_update,
    -- View gains (calculated from video_stats) - added at the end
    GREATEST(0, v.view_count - COALESCE((
        SELECT view_count FROM video_stats 
        WHERE video_id = v.id 
        AND date >= CURRENT_DATE - INTERVAL '1 day'
        ORDER BY date DESC, hour DESC LIMIT 1
    ), 0)) as gain_24h,
    GREATEST(0, v.view_count - COALESCE((
        SELECT view_count FROM video_stats 
        WHERE video_id = v.id 
        AND date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date DESC, hour DESC LIMIT 1
    ), 0)) as gain_7d,
    GREATEST(0, v.view_count - COALESCE((
        SELECT view_count FROM video_stats 
        WHERE video_id = v.id 
        AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC, hour DESC LIMIT 1
    ), 0)) as gain_30d
FROM videos v
JOIN channels c ON v.channel_id = c.id
LEFT JOIN video_stats vs ON v.id = vs.video_id
WHERE vs.date = (
    SELECT MAX(date)
    FROM video_stats vs2
    WHERE vs2.video_id = v.id
);

-- View for job queue monitoring
CREATE OR REPLACE VIEW job_queue_status AS
SELECT
    COALESCE(job_type, 'unknown') AS job_type,
    status,
    COUNT(*) AS count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS last_hour,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL) AS avg_processing_time_seconds,
    MIN(created_at) FILTER (WHERE status = 'pending') AS oldest_pending,
    MAX(updated_at) AS last_updated
FROM jobs
GROUP BY COALESCE(job_type, 'unknown'), status
ORDER BY job_type, status;

-- View for API usage monitoring
CREATE OR REPLACE VIEW api_usage_summary AS
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    endpoint,
    COUNT(*) as requests,
    SUM(cost_usd) as total_cost,
    AVG(cost_usd) as avg_cost,
    MAX(cost_usd) as max_cost,
    STRING_AGG(DISTINCT ip_address::text, ', ') as unique_ips
FROM api_usage_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('hour', created_at), endpoint
ORDER BY hour DESC, requests DESC;

-- ===========================================
-- UTILITY FUNCTIONS
-- ===========================================

-- Function to get channel statistics over time
CREATE OR REPLACE FUNCTION get_channel_stats_history(
    channel_id_param UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    date TIMESTAMP WITH TIME ZONE,
    subscriber_count BIGINT,
    video_count BIGINT,
    view_count BIGINT,
    subscriber_growth BIGINT,
    video_growth BIGINT,
    view_growth BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.date,
        cs.subscriber_count,
        cs.video_count,
        cs.view_count,
        cs.subscriber_count - LAG(cs.subscriber_count, 1) OVER (ORDER BY cs.date) as subscriber_growth,
        cs.video_count - LAG(cs.video_count, 1) OVER (ORDER BY cs.date) as video_growth,
        cs.view_count - LAG(cs.view_count, 1) OVER (ORDER BY cs.date) as view_growth
    FROM channel_stats cs
    WHERE cs.channel_id = channel_id_param
    AND cs.date >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY cs.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get video statistics over time
CREATE OR REPLACE FUNCTION get_video_stats_history(
    video_id_param UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    date TIMESTAMP WITH TIME ZONE,
    view_count BIGINT,
    like_count BIGINT,
    comment_count BIGINT,
    view_growth BIGINT,
    like_growth BIGINT,
    comment_growth BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vs.date,
        vs.view_count,
        vs.like_count,
        vs.comment_count,
        vs.view_count - LAG(vs.view_count, 1) OVER (ORDER BY vs.date) as view_growth,
        vs.like_count - LAG(vs.like_count, 1) OVER (ORDER BY vs.date) as like_growth,
        vs.comment_count - LAG(vs.comment_count, 1) OVER (ORDER BY vs.date) as comment_growth
    FROM video_stats vs
    WHERE vs.video_id = video_id_param
    AND vs.date >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY vs.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing channels
CREATE OR REPLACE FUNCTION get_top_channels(
    limit_param INTEGER DEFAULT 10,
    metric VARCHAR(50) DEFAULT 'activity_score',
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    channel_id UUID,
    channel_title VARCHAR(255),
    metric_value NUMERIC,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT
            id,
            title,
            CASE
                WHEN $1 = ''subscribers'' THEN subscriber_count::NUMERIC
                WHEN $1 = ''views'' THEN view_count::NUMERIC
                WHEN $1 = ''videos'' THEN video_count::NUMERIC
                WHEN $1 = ''activity_score'' THEN (
                    COALESCE(subscriber_count, 0) * 0.3 +
                    COALESCE(view_count, 0) * 0.4 +
                    COALESCE(video_count, 0) * 0.3
                )
                ELSE 0
            END as metric_value,
            ROW_NUMBER() OVER (ORDER BY
                CASE
                    WHEN $1 = ''subscribers'' THEN subscriber_count
                    WHEN $1 = ''views'' THEN view_count
                    WHEN $1 = ''videos'' THEN video_count
                    WHEN $1 = ''activity_score'' THEN (
                        COALESCE(subscriber_count, 0) * 0.3 +
                        COALESCE(view_count, 0) * 0.4 +
                        COALESCE(video_count, 0) * 0.3
                    )
                    ELSE 0
                END DESC
            ) as rank
        FROM channels
        WHERE updated_at >= NOW() - ($2 || '' days'')::INTERVAL
        ORDER BY metric_value DESC
        LIMIT $3
    ', metric, days_back, limit_param)
    USING metric, days_back, limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing videos
CREATE OR REPLACE FUNCTION get_top_videos(
    limit_param INTEGER DEFAULT 10,
    metric VARCHAR(50) DEFAULT 'views',
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    video_id UUID,
    video_title VARCHAR(255),
    channel_title VARCHAR(255),
    metric_value BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT
            v.id,
            v.title,
            c.title as channel_title,
            CASE
                WHEN $1 = ''views'' THEN v.view_count
                WHEN $1 = ''likes'' THEN COALESCE(v.like_count, 0)
                WHEN $1 = ''comments'' THEN COALESCE(v.comment_count, 0)
                WHEN $1 = ''performance_score'' THEN (
                    v.view_count * 0.5 +
                    COALESCE(v.like_count, 0) * 2 +
                    COALESCE(v.comment_count, 0) * 5
                )::BIGINT
                ELSE 0
            END as metric_value,
            ROW_NUMBER() OVER (ORDER BY
                CASE
                    WHEN $1 = ''views'' THEN v.view_count
                    WHEN $1 = ''likes'' THEN COALESCE(v.like_count, 0)
                    WHEN $1 = ''comments'' THEN COALESCE(v.comment_count, 0)
                    WHEN $1 = ''performance_score'' THEN (
                        v.view_count * 0.5 +
                        COALESCE(v.like_count, 0) * 2 +
                        COALESCE(v.comment_count, 0) * 5
                    )::BIGINT
                    ELSE 0
                END DESC
            ) as rank
        FROM videos v
        JOIN channels c ON v.channel_id = c.id
        WHERE v.published_at >= NOW() - ($2 || '' days'')::INTERVAL
        ORDER BY metric_value DESC
        LIMIT $3
    ', metric, days_back, limit_param)
    USING metric, days_back, limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE (
    metric VARCHAR(100),
    value TEXT,
    status VARCHAR(20)
) AS $$
DECLARE
    pending_jobs_count INTEGER;
    failed_jobs_last_hour INTEGER;
    api_quota_remaining INTEGER;
    stale_feeds_count INTEGER;
BEGIN
    -- Count pending jobs
    SELECT COUNT(*) INTO pending_jobs_count
    FROM jobs WHERE status = 'pending';

    -- Count failed jobs in last hour
    SELECT COUNT(*) INTO failed_jobs_last_hour
    FROM jobs
    WHERE status = 'failed'
    AND updated_at >= NOW() - INTERVAL '1 hour';

    -- Get API quota remaining
    SELECT COALESCE(remaining, 0) INTO api_quota_remaining
    FROM api_budget
    WHERE budget_type = 'daily'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Count stale feeds (not updated in 24 hours)
    SELECT COUNT(*) INTO stale_feeds_count
    FROM channel_feeds
    WHERE last_polled_at < NOW() - INTERVAL '24 hours'
    OR last_polled_at IS NULL;

    RETURN QUERY VALUES
        ('pending_jobs', pending_jobs_count::TEXT,
         CASE WHEN pending_jobs_count > 100 THEN 'warning'
              WHEN pending_jobs_count > 1000 THEN 'critical'
              ELSE 'healthy' END),
        ('failed_jobs_last_hour', failed_jobs_last_hour::TEXT,
         CASE WHEN failed_jobs_last_hour > 10 THEN 'warning'
              WHEN failed_jobs_last_hour > 50 THEN 'critical'
              ELSE 'healthy' END),
        ('api_quota_remaining', api_quota_remaining::TEXT,
         CASE WHEN api_quota_remaining < 1000 THEN 'warning'
              WHEN api_quota_remaining < 100 THEN 'critical'
              ELSE 'healthy' END),
        ('stale_feeds', stale_feeds_count::TEXT,
         CASE WHEN stale_feeds_count > 10 THEN 'warning'
              WHEN stale_feeds_count > 50 THEN 'critical'
              ELSE 'healthy' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data(
    days_to_keep INTEGER DEFAULT 90
)
RETURNS TABLE (
    table_name VARCHAR(50),
    records_deleted BIGINT
) AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Clean up old job events (keep last 30 days)
    DELETE FROM job_events
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY VALUES ('job_events', deleted_count);

    -- Clean up old API usage logs (keep last 90 days)
    DELETE FROM api_usage_log
    WHERE used_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY VALUES ('api_usage_log', deleted_count);

    -- Clean up old video stats (keep last 90 days)
    DELETE FROM video_stats
    WHERE date < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY VALUES ('video_stats', deleted_count);

    -- Clean up old channel stats (keep last 90 days)
    DELETE FROM channel_stats
    WHERE date < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY VALUES ('channel_stats', deleted_count);

    -- Clean up completed/failed jobs older than 7 days
    DELETE FROM jobs
    WHERE status IN ('completed', 'failed')
    AND updated_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY VALUES ('jobs', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database size information
CREATE OR REPLACE FUNCTION get_database_size_info()
RETURNS TABLE (
    table_name VARCHAR(100),
    row_count BIGINT,
    size_bytes BIGINT,
    size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_total_relation_size(schemaname || '.' || tablename) as size_bytes,
        ROUND(pg_total_relation_size(schemaname || '.' || tablename) / 1024.0 / 1024.0, 2) as size_mb
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- INDEXES FOR UTILITY FUNCTIONS
-- ===========================================

-- Index for channel stats history queries
CREATE INDEX IF NOT EXISTS idx_channel_stats_history
ON channel_stats (channel_id, date DESC);

-- Index for video stats history queries
CREATE INDEX IF NOT EXISTS idx_video_stats_history
ON video_stats (video_id, date DESC);

-- Index for top channels queries
CREATE INDEX IF NOT EXISTS idx_channels_performance
ON channels (subscriber_count DESC, view_count DESC, video_count DESC, updated_at);

-- Index for top videos queries
CREATE INDEX IF NOT EXISTS idx_videos_performance
ON videos (view_count DESC, like_count DESC, comment_count DESC, published_at);

-- Index for system health monitoring
CREATE INDEX IF NOT EXISTS idx_jobs_status_updated
ON jobs (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_channel_feeds_last_polled
ON channel_feeds (last_polled_at);

-- ===========================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================

COMMENT ON VIEW channel_performance IS 'Aggregated view of channel metrics including growth rates and activity scores';
COMMENT ON VIEW video_performance IS 'Video performance metrics with engagement rates, performance scores, and view gains over different time periods';
COMMENT ON VIEW job_queue_status IS 'Real-time job queue monitoring with processing statistics';
COMMENT ON VIEW api_usage_summary IS 'Hourly API usage aggregation for monitoring and billing';

COMMENT ON FUNCTION get_channel_stats_history(UUID, INTEGER) IS 'Returns time-series data for channel statistics with growth calculations';
COMMENT ON FUNCTION get_video_stats_history(UUID, INTEGER) IS 'Returns time-series data for video statistics with growth calculations';
COMMENT ON FUNCTION get_top_channels(INTEGER, VARCHAR, INTEGER) IS 'Returns top performing channels by various metrics';
COMMENT ON FUNCTION get_top_videos(INTEGER, VARCHAR, INTEGER) IS 'Returns top performing videos by various metrics';
COMMENT ON FUNCTION get_system_health() IS 'Returns system health metrics with status indicators';
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'Removes old data to maintain database performance';
COMMENT ON FUNCTION get_database_size_info() IS 'Returns table sizes and row counts for monitoring';