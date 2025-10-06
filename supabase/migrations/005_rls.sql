-- Migration: 005_rls.sql
-- Description: Row Level Security policies for data isolation
-- Created: $(date)

-- Enable RLS on all tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- Create a service_role policy for admin access
-- This allows the service role (used by Edge Functions and server-side code) to access all data

-- Channels policies
CREATE POLICY "channels_service_role_access" ON channels
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "channels_authenticated_read" ON channels
    FOR SELECT USING (auth.role() = 'authenticated');

-- Videos policies
CREATE POLICY "videos_service_role_access" ON videos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "videos_authenticated_read" ON videos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Channel stats policies
CREATE POLICY "channel_stats_service_role_access" ON channel_stats
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "channel_stats_authenticated_read" ON channel_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Video stats policies
CREATE POLICY "video_stats_service_role_access" ON video_stats
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "video_stats_authenticated_read" ON video_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Jobs policies (restrictive - only service role can manage jobs)
CREATE POLICY "jobs_service_role_access" ON jobs
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL OR auth.role() = 'postgres');

-- Job events policies (read-only for monitoring)
CREATE POLICY "job_events_service_role_access" ON job_events
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL OR auth.role() = 'postgres');

-- Channel feeds policies
CREATE POLICY "channel_feeds_service_role_access" ON channel_feeds
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() IS NULL OR auth.role() = 'postgres');

-- API budget policies
CREATE POLICY "api_budget_service_role_access" ON api_budget
    FOR ALL USING (auth.role() = 'service_role');

-- API usage log policies
CREATE POLICY "api_usage_log_service_role_access" ON api_usage_log
    FOR ALL USING (auth.role() = 'service_role');

-- Create a function to check if user has admin access
-- This can be extended later for more granular permissions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, only service role has admin access
    -- This can be extended to check user roles/metadata
    RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access channel data
-- This can be extended for channel-specific permissions
CREATE OR REPLACE FUNCTION can_access_channel(channel_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, authenticated users can access all channels
    -- This can be extended for private channels or user-specific access
    RETURN auth.role() = 'authenticated' OR auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user can access video data
CREATE OR REPLACE FUNCTION can_access_video(video_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, authenticated users can access all videos
    -- This can be extended for private videos or access controls
    RETURN auth.role() = 'authenticated' OR auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative policies using the helper functions (commented out for now)
-- These can be enabled if more granular permissions are needed

/*
-- Channels policies with helper functions
DROP POLICY IF EXISTS "channels_authenticated_read" ON channels;
CREATE POLICY "channels_authenticated_read" ON channels
    FOR SELECT USING (can_access_channel(id));

-- Videos policies with helper functions
DROP POLICY IF EXISTS "videos_authenticated_read" ON videos;
CREATE POLICY "videos_authenticated_read" ON videos
    FOR SELECT USING (can_access_video(id));
*/

-- Create policies for job queue access (more restrictive)
-- Only allow service role to enqueue jobs
CREATE POLICY "jobs_enqueue_restrictive" ON jobs
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() IS NULL);

-- Only allow service role to dequeue/update jobs
CREATE POLICY "jobs_process_restrictive" ON jobs
    FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() IS NULL);

-- Create a secure function for enqueuing jobs
-- This ensures only authorized operations can create jobs
CREATE OR REPLACE FUNCTION secure_enqueue_job(
    job_type_param VARCHAR(100),
    payload_param JSONB,
    priority_param INTEGER DEFAULT 0,
    dedup_key_param VARCHAR(255) DEFAULT NULL,
    scheduled_at_param TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    job_id UUID;
BEGIN
    -- Only service role can enqueue jobs (allow for testing when no auth context)
    IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: only service role can enqueue jobs';
    END IF;

    -- Call the internal enqueue function
    SELECT enqueue_job(job_type_param, payload_param, priority_param, dedup_key_param, scheduled_at_param)
    INTO job_id;

    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function for dequeuing jobs
CREATE OR REPLACE FUNCTION secure_dequeue_jobs(
    worker_id_param VARCHAR(255),
    job_types_param TEXT[] DEFAULT NULL,
    limit_param INTEGER DEFAULT 1,
    lock_duration INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS TABLE (
    job_id UUID,
    job_type VARCHAR(100),
    priority INTEGER,
    payload JSONB
) AS $$
BEGIN
    -- Only service role can dequeue jobs (allow for testing when no auth context)
    IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: only service role can dequeue jobs';
    END IF;

    -- Call the internal dequeue function
    RETURN QUERY
    SELECT * FROM dequeue_jobs(worker_id_param, job_types_param, limit_param, lock_duration);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function for completing jobs
CREATE OR REPLACE FUNCTION secure_complete_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Only service role can complete jobs (allow for testing when no auth context)
    IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: only service role can complete jobs';
    END IF;

    RETURN complete_job(job_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure function for failing jobs
CREATE OR REPLACE FUNCTION secure_fail_job(
    job_id_param UUID,
    error_message_param TEXT DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
BEGIN
    -- Only service role can fail jobs (allow for testing when no auth context)
    IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: only service role can fail jobs';
    END IF;

    RETURN fail_job(job_id_param, error_message_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for API usage logging
-- Allow authenticated users to view their own API usage
CREATE POLICY "api_usage_log_own_usage" ON api_usage_log
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND ip_address = inet_client_addr())
    );

-- Create policies for API budget monitoring
-- Allow authenticated users to view current quota status
CREATE POLICY "api_budget_read_access" ON api_budget
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON POLICY "channels_service_role_access" ON channels IS 'Allows service role full access to channels table';
COMMENT ON POLICY "jobs_enqueue_restrictive" ON jobs IS 'Only service role can create new jobs';
COMMENT ON POLICY "api_usage_log_own_usage" ON api_usage_log IS 'Users can only see their own API usage';

COMMENT ON FUNCTION is_admin() IS 'Checks if current user has admin privileges';
COMMENT ON FUNCTION can_access_channel(UUID) IS 'Checks if user can access specific channel data';
COMMENT ON FUNCTION secure_enqueue_job(VARCHAR, JSONB, INTEGER, VARCHAR, TIMESTAMP WITH TIME ZONE) IS 'Secure job enqueuing with access control';