-- migrations/011_rpc_analytics.sql
-- T025: Create queue_metrics, api_quota_status RPCs

-- Queue metrics: count jobs by status
CREATE OR REPLACE FUNCTION queue_metrics()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_object_agg(status, count) INTO v_result
    FROM (
        SELECT status, COUNT(*) AS count FROM jobs GROUP BY status
    ) sub;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API quota status: dummy implementation (replace with real logic)
CREATE OR REPLACE FUNCTION api_quota_status()
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object('quota_used', 0, 'quota_limit', 10000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
