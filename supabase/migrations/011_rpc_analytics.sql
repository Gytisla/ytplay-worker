-- migrations/011_rpc_analytics.sql
-- T025: Create queue_metrics, api_quota_status RPCs

-- Queue metrics: count jobs by status
CREATE OR REPLACE FUNCTION queue_metrics()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_object_agg(status, count) INTO v_result
    FROM (
        SELECT status, COUNT(*) AS count FROM jobs GROUP BY status
    ) sub;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API quota status: dummy implementation (replace with real logic)
CREATE OR REPLACE FUNCTION api_quota_status()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('quota_used', 0, 'quota_limit', 10000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Capture video statistics snapshots
CREATE OR REPLACE FUNCTION capture_video_stats(
    video_stats_array JSONB[]
)
RETURNS TABLE(
    youtube_video_id TEXT,
    stats_id UUID,
    hourly_change INTEGER,
    daily_change INTEGER
) AS $$
DECLARE
    v_stats_record JSONB;
    v_video_uuid UUID;
    v_today DATE := CURRENT_DATE;
    v_current_hour INTEGER := EXTRACT(HOUR FROM NOW());
    v_previous_hourly_stats video_stats%ROWTYPE;
    v_previous_daily_stats video_stats%ROWTYPE;
    v_new_stats_id UUID;
    v_hourly_change INTEGER := 0;
    v_daily_change INTEGER := 0;
BEGIN
    FOREACH v_stats_record IN ARRAY video_stats_array LOOP
        -- Get video UUID from YouTube video ID
    SELECT id INTO v_video_uuid
    FROM videos
    WHERE videos.youtube_video_id = v_stats_record->>'video_id';

        IF v_video_uuid IS NULL THEN
            -- Skip if video not found
            CONTINUE;
        END IF;

        -- Get previous hourly stats (same day, previous hour)
        SELECT * INTO v_previous_hourly_stats
        FROM video_stats
        WHERE video_id = v_video_uuid
          AND date = v_today
          AND hour = (v_current_hour - 1 + 24) % 24  -- Handle hour 0
        ORDER BY created_at DESC
        LIMIT 1;

        -- Get previous daily stats (yesterday)
        SELECT * INTO v_previous_daily_stats
        FROM video_stats
        WHERE video_id = v_video_uuid
          AND date = v_today - INTERVAL '1 day'
          AND hour IS NULL  -- Daily aggregate
        ORDER BY created_at DESC
        LIMIT 1;

        -- Calculate changes
        v_hourly_change := CASE
            WHEN v_previous_hourly_stats.view_count IS NOT NULL
            THEN GREATEST(0, (v_stats_record->>'view_count')::BIGINT - v_previous_hourly_stats.view_count)
            ELSE 0
        END;

        v_daily_change := CASE
            WHEN v_previous_daily_stats.view_count IS NOT NULL
            THEN GREATEST(0, (v_stats_record->>'view_count')::BIGINT - v_previous_daily_stats.view_count)
            ELSE 0
        END;

        -- Insert new hourly stats
        INSERT INTO video_stats (
            video_id,
            date,
            hour,
            view_count,
            like_count,
            comment_count,
            share_count
        ) VALUES (
            v_video_uuid,
            v_today,
            v_current_hour,
            (v_stats_record->>'view_count')::BIGINT,
            COALESCE((v_stats_record->>'like_count')::BIGINT, 0),
            COALESCE((v_stats_record->>'comment_count')::BIGINT, 0),
            0  -- share_count not provided in current implementation
        )
        ON CONFLICT (video_id, date, hour) DO UPDATE SET
            view_count = EXCLUDED.view_count,
            like_count = EXCLUDED.like_count,
            comment_count = EXCLUDED.comment_count,
            share_count = EXCLUDED.share_count,
            created_at = NOW()
        RETURNING id INTO v_new_stats_id;

        -- Return result for this video (youtube_video_id avoids ambiguity with video_stats.video_id)
        RETURN QUERY SELECT
            v_stats_record->>'video_id' AS youtube_video_id,
            v_new_stats_id,
            v_hourly_change,
            v_daily_change;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
