-- Migration: 20251019184011_update_video_performance_gains.sql
-- Description: Add gain columns to video_performance view

-- Add gain columns to existing video_performance view
CREATE OR REPLACE VIEW video_performance AS
SELECT DISTINCT ON (v.id)
    v.id,
    v.youtube_video_id,
    v.slug,
    v.title,
    v.thumbnail_url,
    v.channel_id,
    c.title as channel_title,
    c.slug as channel_slug,
    c.thumbnail_url as channel_thumbnail_url,
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
    -- View gains (calculated from video_stats, skipping first record to avoid backfill inflation)
    CASE
        WHEN (
            SELECT COUNT(*) FROM video_stats
            WHERE video_id = v.id
            AND date >= CURRENT_DATE - INTERVAL '1 day'
        ) > 1 THEN
            GREATEST(0, v.view_count - COALESCE((
                SELECT view_count FROM video_stats
                WHERE video_id = v.id
                AND date >= CURRENT_DATE - INTERVAL '1 day'
                ORDER BY date ASC, hour ASC
                LIMIT 1
            ), 0))
        ELSE 0
    END as gain_24h,
    CASE
        WHEN (
            SELECT COUNT(*) FROM video_stats
            WHERE video_id = v.id
            AND date >= CURRENT_DATE - INTERVAL '7 days'
        ) > 1 THEN
            GREATEST(0, v.view_count - COALESCE((
                SELECT view_count FROM video_stats
                WHERE video_id = v.id
                AND date >= CURRENT_DATE - INTERVAL '7 days'
                ORDER BY date ASC, hour ASC
                LIMIT 1
            ), 0))
        ELSE 0
    END as gain_7d,
    CASE
        WHEN (
            SELECT COUNT(*) FROM video_stats
            WHERE video_id = v.id
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        ) > 1 THEN
            GREATEST(0, v.view_count - COALESCE((
                SELECT view_count FROM video_stats
                WHERE video_id = v.id
                AND date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY date ASC, hour ASC
                LIMIT 1
            ), 0))
        ELSE 0
    END as gain_30d
FROM videos v
JOIN channels c ON v.channel_id = c.id
LEFT JOIN video_stats vs ON v.id = vs.video_id
ORDER BY v.id, vs.date DESC, vs.hour DESC;

