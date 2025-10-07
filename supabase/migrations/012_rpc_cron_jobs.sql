-- Migration: 013_rpc_cron_jobs.sql
-- Description: RPCs invoked by pg_cron to enqueue scheduled jobs (RSS polling, channel stats, hot videos, weekly video stats)
-- Idempotent: functions are created or replaced

/*
  Design notes:
  - Use existing enqueue_job(...) function to create jobs so deduplication/logic is centralized.
  - Return integer count of enqueued jobs where applicable.
  - Dedup keys include date/hour/week where useful to avoid accidental duplicates.
*/

CREATE OR REPLACE FUNCTION public.enqueue_scheduled_rss_polls()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
  v_youtube_id TEXT;
BEGIN
  FOR rec IN
    SELECT cf.*, c.youtube_channel_id
    FROM public.channel_feeds cf
    JOIN public.channels c ON c.id = cf.channel_id
    WHERE cf.is_active = true
      AND (cf.last_polled_at IS NULL OR cf.last_polled_at + (cf.poll_interval_minutes || ' minutes')::interval <= now())
  LOOP
    v_youtube_id := rec.youtube_channel_id;
    PERFORM enqueue_job(
      'RSS_POLL_CHANNEL',
      jsonb_build_object('channelId', v_youtube_id, 'feedUrl', rec.feed_url),
      0,
      'rss_poll:' || v_youtube_id
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.enqueue_scheduled_rss_polls() IS 'Enqueue RSS_POLL_CHANNEL jobs for feeds due for polling; returns number enqueued.';


CREATE OR REPLACE FUNCTION public.schedule_refresh_channel_stats()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ch RECORD;
  v_count INTEGER := 0;
  v_youtube_id TEXT;
  v_today TEXT := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
BEGIN
  FOR ch IN SELECT youtube_channel_id FROM public.channels WHERE status = 'active'
  LOOP
    v_youtube_id := ch.youtube_channel_id;
    PERFORM enqueue_job(
      'REFRESH_CHANNEL_STATS',
      jsonb_build_object('channelId', v_youtube_id),
      0,
      'refresh_channel_stats:' || v_youtube_id || ':' || v_today
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.schedule_refresh_channel_stats() IS 'Enqueue REFRESH_CHANNEL_STATS jobs for all active channels (daily); returns number enqueued.';


CREATE OR REPLACE FUNCTION public.enqueue_refresh_hot_videos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_hour TEXT := to_char(now() at time zone 'UTC', 'YYYY-MM-DD-HH24');
BEGIN
  -- Enqueue a single REFRESH_HOT_VIDEOS job with an hour-scoped dedup key
  v_job_id := enqueue_job('REFRESH_HOT_VIDEOS', jsonb_build_object(), 0, 'refresh_hot_videos:' || v_hour);

  IF v_job_id IS NOT NULL THEN
    RETURN 1;
  END IF;

  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.enqueue_refresh_hot_videos() IS 'Enqueue a REFRESH_HOT_VIDEOS job (hourly); returns 1 if enqueued, 0 otherwise.';


CREATE OR REPLACE FUNCTION public.schedule_refresh_video_stats_weekly()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id UUID;
  v_week TEXT := to_char(now() at time zone 'UTC', 'IYYY-IW'); -- ISO year-week
BEGIN
  -- Enqueue a single REFRESH_VIDEO_STATS job that can perform the weekly rotation
  v_job_id := enqueue_job('REFRESH_VIDEO_STATS', jsonb_build_object('mode', 'weekly'), 0, 'refresh_video_stats_weekly:' || v_week);

  IF v_job_id IS NOT NULL THEN
    RETURN 1;
  END IF;

  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.schedule_refresh_video_stats_weekly() IS 'Enqueue REFRESH_VIDEO_STATS rotation job weekly; returns 1 if enqueued, 0 otherwise.';
