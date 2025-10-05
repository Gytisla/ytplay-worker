-- migrations/009_rpc_lifecycle.sql
-- T023: Create ack_job, retry_job, dead_letter_job RPCs

-- Acknowledge (complete) a job
CREATE OR REPLACE FUNCTION ack_job(p_job_id BIGINT)
RETURNS jobs AS $$
DECLARE
    v_job jobs;
BEGIN
    UPDATE jobs SET status = 'completed', finished_at = NOW()
    WHERE id = p_job_id RETURNING * INTO v_job;
    RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retry a job (reset to pending, increment attempts)
CREATE OR REPLACE FUNCTION retry_job(p_job_id BIGINT)
RETURNS jobs AS $$
DECLARE
    v_job jobs;
BEGIN
    UPDATE jobs SET status = 'pending', started_at = NULL, finished_at = NULL, attempts = attempts + 1
    WHERE id = p_job_id RETURNING * INTO v_job;
    RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Move a job to dead letter
CREATE OR REPLACE FUNCTION dead_letter_job(p_job_id BIGINT)
RETURNS jobs AS $$
DECLARE
    v_job jobs;
BEGIN
    UPDATE jobs SET status = 'dead_letter', finished_at = NOW()
    WHERE id = p_job_id RETURNING * INTO v_job;
    RETURN v_job;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
