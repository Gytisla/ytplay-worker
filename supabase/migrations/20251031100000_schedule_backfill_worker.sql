-- Migration: 20251031100000_schedule_backfill_worker.sql
-- Description: Schedule backfill worker to run every 5 minutes via pg_cron
-- Created: 2025-10-31

CREATE OR REPLACE FUNCTION public.enqueue_backfill_worker()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'BACKFILL_WORKER_URL');
  v_auth text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'WORKER_AUTH');
  v_body jsonb := jsonb_build_object('maxJobs', 1);
  v_headers jsonb := NULL;
  v_called boolean := false;
  v_http_res bigint := NULL;
BEGIN
    IF v_auth IS NOT NULL THEN
      -- construct a JSON headers object like {"Authorization":"Bearer <token>", "Content-Type":"application/json"}
      v_headers := jsonb_build_object('Authorization', 'Bearer ' || v_auth, 'Content-Type', 'application/json');
    END IF;

    IF v_url IS NOT NULL THEN
      -- Prefer using net.http_post if the net schema and function exist
      IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net')
         AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'http_post' AND n.nspname = 'net') THEN
        BEGIN
          -- net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds int)
          v_http_res := net.http_post(v_url, v_body, '{}'::jsonb, COALESCE(v_headers, jsonb_build_object('Content-Type','application/json')), 5000);
          v_called := true;
        EXCEPTION WHEN OTHERS THEN
          v_called := false;
        END;
      END IF;
    END IF;

  -- If an HTTP call was triggered successfully, indicate success
  IF v_called THEN
    RETURN 1;
  END IF;

  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.enqueue_backfill_worker() IS 'Trigger backfill worker Edge Function via HTTP POST; intended to be scheduled via pg_cron.';

DO $$
BEGIN
  -- Schedule backfill worker every 5 minutes if pg_cron is available and schedule not already present
  -- Backfill jobs are resource-intensive, so we run less frequently than other workers
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backfill_worker_every_2_minutes') THEN
      PERFORM cron.schedule(
        'backfill_worker_every_2_minutes',
        '*/2 * * * *',
        $cron$SELECT enqueue_backfill_worker();$cron$
      );
    END IF;
  END IF;
END
$$ LANGUAGE plpgsql;