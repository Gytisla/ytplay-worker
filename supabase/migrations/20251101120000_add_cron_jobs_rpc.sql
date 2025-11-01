-- Migration: Add RPC function to get CRON jobs information
-- Description: Create a function to safely query pg_cron job information
-- Created: $(date)

CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  last_run timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return CRON job information from pg_cron with run details
  RETURN QUERY
  SELECT
    cj.jobid,
    cj.jobname,
    cj.schedule,
    cj.command,
    cj.nodename,
    cj.nodeport,
    cj.database,
    cj.username,
    cj.active,
    -- Get the most recent run start time
    (SELECT jr.start_time
     FROM cron.job_run_details jr
     WHERE jr.jobid = cj.jobid
     ORDER BY jr.start_time DESC
     LIMIT 1) as last_run
  FROM cron.job cj
  ORDER BY cj.jobname;
END;
$$;

COMMENT ON FUNCTION public.get_cron_jobs() IS 'Returns information about scheduled CRON jobs from pg_cron with run details.';