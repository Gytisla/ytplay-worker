-- Migration: 012_seed_example_job.sql
-- Description: Insert an example BACKFILL_CHANNEL job into the jobs queue (idempotent via dedup_key)
-- Created: $(date)

DO $$
BEGIN
    -- Insert a single example BACKFILL_CHANNEL job if one with the same dedup_key doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM jobs WHERE dedup_key = 'seed:example:backfill:channel:UCjC_7hcKPAWHnGOLjjvgzIg' LIMIT 1
    ) THEN
        INSERT INTO jobs (job_type, priority, payload, dedup_key, scheduled_at)
        VALUES (
            'BACKFILL_CHANNEL',
            10,
            jsonb_build_object('channelId', 'UCjC_7hcKPAWHnGOLjjvgzIg', 'maxVideos', 50),
            'seed:example:backfill:channel:UCjC_7hcKPAWHnGOLjjvgzIg',
            NOW()
        );
    END IF;
END;
$$;

-- Also insert a job_events record for observability if job was created (best-effort)
-- This will not create duplicates because job_events references an existing job id and we only insert if the job was created above.

DO $$
DECLARE
    j_id UUID;
BEGIN
    SELECT id INTO j_id FROM jobs WHERE dedup_key = 'seed:example:backfill:channel:UCjC_7hcKPAWHnGOLjjvgzIg' LIMIT 1;
    IF j_id IS NOT NULL THEN
        -- Insert a 'created' event only if it doesn't already exist for this job
        IF NOT EXISTS (SELECT 1 FROM job_events WHERE job_id = j_id AND event_type = 'created' LIMIT 1) THEN
            INSERT INTO job_events (job_id, event_type) VALUES (j_id, 'created');
        END IF;
    END IF;
END;
$$;
