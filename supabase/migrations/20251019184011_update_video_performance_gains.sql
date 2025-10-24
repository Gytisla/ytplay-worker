-- Migration: 20251019184011_update_video_performance_gains.sql
-- Description: Add gain columns to video_performance view

-- Drop existing view if it exists
DROP VIEW IF EXISTS video_performance;

-- Create video_performance view with gain columns
CREATE VIEW video_performance AS
WITH latest_stats AS (
  SELECT v.id AS video_id,
         ls.view_count    AS latest_views,
         ls.like_count    AS latest_likes,
         ls.comment_count AS latest_comments,
         (ls.date::timestamp + (ls.hour || ' hour')::interval) AS last_stats_ts
  FROM videos v
  LEFT JOIN LATERAL (
    SELECT vs.view_count, vs.like_count, vs.comment_count, vs.date, vs.hour
    FROM video_stats vs
    WHERE vs.video_id = v.id
    ORDER BY vs.date DESC, vs.hour DESC
    LIMIT 1
  ) ls ON TRUE
),
gains AS (
  SELECT
    v.id AS video_id,
    -- 24h gain
    CASE WHEN exists (
        SELECT 1 FROM video_stats vs
        WHERE vs.video_id = v.id
          AND vs.date >= CURRENT_DATE - INTERVAL '1 day'
          HAVING count(*) > 1
    ) THEN GREATEST(
           0,
           v.view_count - COALESCE((
             SELECT vs.view_count
             FROM video_stats vs
             WHERE vs.video_id = v.id
               AND vs.date >= CURRENT_DATE - INTERVAL '1 day'
             ORDER BY vs.date ASC, vs.hour ASC
             LIMIT 1
           ), 0)
         )
         ELSE 0
    END AS gain_24h,

    -- 7d gain
    CASE WHEN exists (
        SELECT 1 FROM video_stats vs
        WHERE vs.video_id = v.id
          AND vs.date >= CURRENT_DATE - INTERVAL '7 days'
          HAVING count(*) > 1
    ) THEN GREATEST(
           0,
           v.view_count - COALESCE((
             SELECT vs.view_count
             FROM video_stats vs
             WHERE vs.video_id = v.id
               AND vs.date >= CURRENT_DATE - INTERVAL '7 days'
             ORDER BY vs.date ASC, vs.hour ASC
             LIMIT 1
           ), 0)
         )
         ELSE 0
    END AS gain_7d,

    -- 30d gain
    CASE WHEN exists (
        SELECT 1 FROM video_stats vs
        WHERE vs.video_id = v.id
          AND vs.date >= CURRENT_DATE - INTERVAL '30 days'
          HAVING count(*) > 1
    ) THEN GREATEST(
           0,
           v.view_count - COALESCE((
             SELECT vs.view_count
             FROM video_stats vs
             WHERE vs.video_id = v.id
               AND vs.date >= CURRENT_DATE - INTERVAL '30 days'
             ORDER BY vs.date ASC, vs.hour ASC
             LIMIT 1
           ), 0)
         )
         ELSE 0
    END AS gain_30d
  FROM videos v
)
SELECT
  v.id,
  v.youtube_video_id,
  v.slug,
  v.title,
  v.thumbnail_url,
  v.channel_id,
  c.title AS channel_title,
  c.slug  AS channel_slug,
  c.thumbnail_url AS channel_thumbnail_url,
  v.view_count,
  v.like_count,
  v.comment_count,
  v.duration,
  v.published_at,
  v.updated_at,
  v.live_broadcast_content,
  vc.id AS category_id,
  vc.name AS category_name,
  vc.key AS category_key,
  vc.color AS category_color,
  vc.icon AS category_icon,

  CASE WHEN v.view_count > 0
       THEN ROUND(((COALESCE(v.like_count,0) + COALESCE(v.comment_count,0))::numeric / v.view_count) * 100, 2)
       ELSE 0 END AS engagement_rate_percent,

  EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 86400.0 AS age_days,

  (v.view_count * 0.5 + COALESCE(v.like_count,0) * 2 + COALESCE(v.comment_count,0) * 5) AS performance_score,

  ls.latest_views,
  ls.latest_likes,
  ls.latest_comments,
  ls.last_stats_ts::date AS last_stats_update,

  g.gain_24h,
  g.gain_7d,
  g.gain_30d

FROM videos v
JOIN channels c            ON v.channel_id = c.id
LEFT JOIN video_categories vc ON v.category_id = vc.id
LEFT JOIN latest_stats ls      ON ls.video_id = v.id
LEFT JOIN gains g              ON g.video_id = v.id;

