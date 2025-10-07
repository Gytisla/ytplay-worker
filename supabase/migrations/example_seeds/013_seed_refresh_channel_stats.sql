-- Migration: 013_seed_refresh_channel_stats.sql
-- Description: Insert an example REFRESH_CHANNEL_STATS job into the jobs queue (idempotent via dedup_key)
-- Created: $(date)

DO $$
BEGIN
    -- Use the same channel as the example backfill seed
    IF NOT EXISTS (
        SELECT 1 FROM jobs WHERE dedup_key = 'seed:example:refresh_channel_stats:UCjC_7hcKPAWHnGOLjjvgzIg' LIMIT 1
    ) THEN
        INSERT INTO jobs (job_type, priority, payload, dedup_key, scheduled_at)
        VALUES (
            'REFRESH_CHANNEL_STATS',
            5,
            jsonb_build_object('channelId', 'UCjC_7hcKPAWHnGOLjjvgzIg'),
            'seed:example:refresh_channel_stats:UCjC_7hcKPAWHnGOLjjvgzIg',
            NOW()
        );
    END IF;
END;
$$;

-- Insert a 'created' job_events record if missing
DO $$
DECLARE
    j_id UUID;
BEGIN
    SELECT id INTO j_id FROM jobs WHERE dedup_key = 'seed:example:refresh_channel_stats:UCjC_7hcKPAWHnGOLjjvgzIg' LIMIT 1;
    IF j_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM job_events WHERE job_id = j_id AND event_type = 'created' LIMIT 1) THEN
            INSERT INTO job_events (job_id, event_type) VALUES (j_id, 'created');
        END IF;
    END IF;
END;
$$;
