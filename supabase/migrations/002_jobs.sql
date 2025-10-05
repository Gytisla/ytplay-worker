-- Migration: 002_jobs.sql
-- Description: Job queue system for background processing
-- Created: $(date)

-- Jobs table
-- Main job queue with different job types and states
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL, -- 'BACKFILL_CHANNEL', 'REFRESH_CHANNEL_STATS', etc.
    priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, dead_letter
    payload JSONB NOT NULL, -- Job-specific data
    dedup_key VARCHAR(255), -- For deduplication (optional)
    max_attempts INTEGER DEFAULT 3,
    attempt_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    locked_by VARCHAR(255), -- Worker identifier
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job events table
-- Audit trail for job lifecycle events
CREATE TABLE job_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- created, started, completed, failed, retried, dead_letter
    event_data JSONB, -- Additional event-specific data
    error_message TEXT,
    worker_id VARCHAR(255), -- Which worker processed this event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job types enum (for validation)
-- Note: PostgreSQL doesn't have native enums in JSONB, but we can validate in application code
-- Common job types based on the system requirements:
-- BACKFILL_CHANNEL - Initial channel data population
-- REFRESH_CHANNEL_STATS - Daily channel statistics update
-- REFRESH_HOT_VIDEOS - Hourly hot videos update
-- REFRESH_VIDEO_STATS - Weekly video statistics update
-- RSS_POLL_CHANNEL - RSS feed polling

-- Indexes for job queue performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX idx_jobs_dedup_key ON jobs(dedup_key);
CREATE INDEX idx_jobs_locked_until ON jobs(locked_until);
CREATE INDEX idx_jobs_status_priority_scheduled ON jobs(status, priority DESC, scheduled_at);

-- Partial indexes for common queries
CREATE INDEX idx_jobs_pending_high_priority ON jobs(scheduled_at, priority DESC)
    WHERE status = 'pending' AND locked_until IS NULL;


-- Indexes for job events
CREATE INDEX idx_job_events_job_id ON job_events(job_id);
CREATE INDEX idx_job_events_event_type ON job_events(event_type);
CREATE INDEX idx_job_events_created_at ON job_events(created_at);

-- Updated_at trigger for jobs table
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to acquire jobs for processing (SKIP LOCKED)
CREATE OR REPLACE FUNCTION dequeue_jobs(
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
    RETURN QUERY
    UPDATE jobs
    SET
        status = 'running',
        started_at = NOW(),
        attempt_count = attempt_count + 1,
        locked_by = worker_id_param,
        locked_until = NOW() + lock_duration,
        updated_at = NOW()
    WHERE id IN (
        SELECT j.id
        FROM jobs j
        WHERE j.status = 'pending'
          AND j.scheduled_at <= NOW()
          AND (job_types_param IS NULL OR j.job_type = ANY(job_types_param))
          AND j.attempt_count < j.max_attempts
          AND (j.locked_until IS NULL OR j.locked_until < NOW())
        ORDER BY j.priority DESC, j.scheduled_at ASC
        LIMIT limit_param
        FOR UPDATE SKIP LOCKED
    )
    RETURNING jobs.id AS job_id, jobs.job_type, jobs.priority, jobs.payload;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as completed
CREATE OR REPLACE FUNCTION complete_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Get job details before update
    SELECT * INTO job_record FROM jobs WHERE id = job_id_param;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update job status
    UPDATE jobs
    SET
        status = 'completed',
        completed_at = NOW(),
        locked_by = NULL,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = job_id_param;

    -- Log completion event
    INSERT INTO job_events (job_id, event_type, worker_id)
    VALUES (job_id_param, 'completed', job_record.locked_by);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as failed and potentially retry
CREATE OR REPLACE FUNCTION fail_job(
    job_id_param UUID,
    error_message_param TEXT DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
    job_record RECORD;
    new_status VARCHAR(50);
BEGIN
    -- Get job details
    SELECT * INTO job_record FROM jobs WHERE id = job_id_param;

    IF NOT FOUND THEN
        RETURN 'not_found';
    END IF;

    -- Determine new status
    IF job_record.attempt_count >= job_record.max_attempts THEN
        new_status := 'dead_letter';
    ELSE
        new_status := 'pending'; -- Will be retried
    END IF;

    -- Update job
    UPDATE jobs
    SET
        status = new_status,
        failed_at = CASE WHEN new_status = 'dead_letter' THEN NOW() ELSE failed_at END,
        last_error = error_message_param,
        error_count = error_count + 1,
        locked_by = NULL,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = job_id_param;

    -- Log failure event
    INSERT INTO job_events (job_id, event_type, error_message, worker_id)
    VALUES (job_id_param, CASE WHEN new_status = 'dead_letter' THEN 'dead_letter' ELSE 'failed' END, error_message_param, job_record.locked_by);

    RETURN new_status;
END;
$$ LANGUAGE plpgsql;

-- Function to enqueue a new job
CREATE OR REPLACE FUNCTION enqueue_job(
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
    -- Check for existing job with same dedup_key if provided
    IF dedup_key_param IS NOT NULL THEN
        SELECT id INTO job_id
        FROM jobs
        WHERE dedup_key = dedup_key_param
          AND status IN ('pending', 'running')
        LIMIT 1;

        IF FOUND THEN
            -- Return existing job ID (deduplication)
            RETURN job_id;
        END IF;
    END IF;

    -- Create new job
    INSERT INTO jobs (job_type, priority, payload, dedup_key, scheduled_at)
    VALUES (job_type_param, priority_param, payload_param, dedup_key_param, scheduled_at_param)
    RETURNING id INTO job_id;

    -- Log creation event
    INSERT INTO job_events (job_id, event_type)
    VALUES (job_id, 'created');

    RETURN job_id;
END;
$$ LANGUAGE plpgsql;