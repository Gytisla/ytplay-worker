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
  active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return CRON job information from pg_cron
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
    cj.active
  FROM cron.job cj
  ORDER BY cj.jobname;
END;
$$;

COMMENT ON FUNCTION public.get_cron_jobs() IS 'Returns information about scheduled CRON jobs from pg_cron.';