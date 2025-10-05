-- migrations/008_rpc_dequeue.sql
-- T022: Create dequeue_jobs RPC function

-- This function dequeues jobs for processing, using SKIP LOCKED for concurrency.
-- Accepts: max_jobs (integer), job_type (optional text)
-- Returns: SETOF jobs

CREATE OR REPLACE FUNCTION dequeue_jobs(
    p_max_jobs INTEGER DEFAULT 1,
    p_job_type TEXT DEFAULT NULL
)
RETURNS SETOF jobs AS $$
BEGIN
    RETURN QUERY
    UPDATE jobs
    SET status = 'in_progress', started_at = NOW()
    WHERE id IN (
        SELECT id FROM jobs
        WHERE status = 'pending'
        AND (p_job_type IS NULL OR job_type = p_job_type)
        ORDER BY scheduled_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_max_jobs
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
