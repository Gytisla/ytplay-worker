-- Migration: 20251022190000_schedule_rss_worker.sql
-- Description: Schedule RSS worker to run every minute via pg_cron, same as queue_worker
-- Created: 2025-10-22

CREATE OR REPLACE FUNCTION public.enqueue_rss_worker()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'RSS_WORKER_URL');
  v_auth text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'WORKER_AUTH');
  v_body jsonb := jsonb_build_object('action','process_rss_jobs', 'maxJobs', 10);
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
          v_http_res := net.http_post(v_url, v_body, '{}'::jsonb, COALESCE(v_headers, jsonb_build_object('Content-Type','application/json')), 2000);
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

COMMENT ON FUNCTION public.enqueue_rss_worker() IS 'Trigger RSS worker Edge Function via HTTP POST; intended to be scheduled via pg_cron.';

DO $$
BEGIN
  -- Schedule RSS worker every minute if pg_cron is available and schedule not already present
  -- Note: pg_cron doesn't support seconds, so this runs at the top of each minute
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'rss_worker_every_minute') THEN
      PERFORM cron.schedule(
        'rss_worker_every_minute',
        '* * * * *',
        $cron$SELECT enqueue_rss_worker();$cron$
      );
    END IF;
  END IF;
END
$$ LANGUAGE plpgsql;