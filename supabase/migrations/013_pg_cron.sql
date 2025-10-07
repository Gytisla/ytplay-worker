-- Migration: 012_pg_cron.sql
-- Description: Install pg_cron and schedule recurring jobs (idempotent)
-- Created: $(date)

-- Ensure pg_cron extension exists (Supabase may require specific extension permissions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- RSS poll every 10 minutes
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rss_poll_every_10_minutes') THEN
    PERFORM cron.schedule(
      'rss_poll_every_10_minutes',
      '*/10 * * * *',
      $cron$SELECT enqueue_scheduled_rss_polls();$cron$
    );
  END IF;

  -- Refresh channel stats daily at 03:00
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_channel_stats_daily') THEN
    PERFORM cron.schedule(
      'refresh_channel_stats_daily',
      '0 3 * * *',
      $cron$SELECT schedule_refresh_channel_stats();$cron$
    );
  END IF;

  -- Refresh hot videos hourly at minute 0
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_hot_videos_hourly') THEN
    PERFORM cron.schedule(
      'refresh_hot_videos_hourly',
      '0 * * * *',
      $cron$SELECT enqueue_refresh_hot_videos();$cron$
    );
  END IF;

  -- Refresh video stats weekly rotation (Sunday 04:00) — implement rotation in the RPC
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_video_stats_weekly') THEN
    PERFORM cron.schedule(
      'refresh_video_stats_weekly',
      '0 4 * * 0',
      $cron$SELECT schedule_refresh_video_stats_weekly();$cron$
    );
  END IF;
END
$$ LANGUAGE plpgsql;
