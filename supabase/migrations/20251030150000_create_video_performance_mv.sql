-- Migration: 20251030150000_create_video_performance_mv.sql
-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON video_performance TO your_app_role;
-- GRANT EXECUTE ON FUNCTION refresh_mv_video_performance() TO your_app_role;
-- GRANT EXECUTE ON FUNCTION cron_refresh_mv_video_performance() TO your_app_role;
-- Description: Create materialized view for video_performance and setup refresh function

-- Note: Keeping the original video_performance view intact
-- Creating a separate materialized view for performance-critical queries

-- Create materialized view for video_performance (with mv_ prefix to distinguish)
CREATE MATERIALIZED VIEW mv_video_performance AS
SELECT * FROM video_performance;

-- Create indexes for better performance
CREATE UNIQUE INDEX idx_mv_video_performance_id ON mv_video_performance (id);
CREATE INDEX idx_mv_video_performance_published_at ON mv_video_performance (published_at);
CREATE INDEX idx_mv_video_performance_view_count ON mv_video_performance (view_count DESC);
CREATE INDEX idx_mv_video_performance_gain_24h ON mv_video_performance (gain_24h DESC);
CREATE INDEX idx_mv_video_performance_gain_7d ON mv_video_performance (gain_7d DESC);
CREATE INDEX idx_mv_video_performance_gain_30d ON mv_video_performance (gain_30d DESC);
CREATE INDEX idx_mv_video_performance_performance_score ON mv_video_performance (performance_score DESC);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_mv_video_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_video_performance;

    -- Log the refresh
    RAISE NOTICE 'mv_video_performance materialized view refreshed at %', NOW();
END;
$$;

-- Create a cron job function that can be called by pg_cron or external scheduler
CREATE OR REPLACE FUNCTION cron_refresh_mv_video_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Call the refresh function
    PERFORM refresh_mv_video_performance();

    -- Log completion
    INSERT INTO job_logs (job_name, status, message, executed_at)
    VALUES ('mv_video_performance_refresh', 'completed', 'Materialized view refreshed successfully', NOW())
    ON CONFLICT DO NOTHING;
END;
$$;

-- Create job_logs table if it doesn't exist (for tracking cron jobs)
CREATE TABLE IF NOT EXISTS job_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on job_logs for better performance
CREATE INDEX IF NOT EXISTS idx_job_logs_job_name_executed_at ON job_logs (job_name, executed_at DESC);


-- Schedule the materialized view refresh using pg_cron (every 30 minutes)
DO $$
BEGIN
  -- Refresh video performance materialized view every 30 minutes
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_mv_video_performance') THEN
    PERFORM cron.schedule(
      'refresh_mv_video_performance',
      '*/30 * * * *',
      $cron$SELECT cron_refresh_mv_video_performance();$cron$
    );
  END IF;
END
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON video_performance TO your_app_role;
-- GRANT EXECUTE ON FUNCTION refresh_video_performance_mv() TO your_app_role;
-- GRANT EXECUTE ON FUNCTION cron_refresh_video_performance() TO your_app_role;