-- migrations/007_rpc_enqueue.sql
-- T021: Create enqueue_job RPC function

-- This function enqueues a new job into the jobs table.
-- It should accept job_type, job_payload (JSON), and optional scheduled_at (timestamp).
-- Returns the inserted job row.

CREATE OR REPLACE FUNCTION enqueue_job(
    p_job_type TEXT,
    p_job_payload JSONB,
    p_scheduled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS jobs AS $$
DECLARE
    v_job jobs;
BEGIN
    INSERT INTO jobs (job_type, job_payload, scheduled_at, status)
    VALUES (p_job_type, p_job_payload, p_scheduled_at, 'pending')
    RETURNING * INTO v_job;
    RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
