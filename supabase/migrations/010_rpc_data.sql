-- migrations/010_rpc_data.sql
-- T024: Create upsert_channel, upsert_videos RPCs

-- Upsert channel (insert or update)
CREATE OR REPLACE FUNCTION upsert_channel(
    p_channel_id TEXT,
    p_data JSONB
)
RETURNS channels AS $$
DECLARE
    v_channel channels;
BEGIN
    INSERT INTO channels (id, data)
    VALUES (p_channel_id, p_data)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    RETURNING * INTO v_channel;
    RETURN v_channel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert videos (bulk insert/update)
CREATE OR REPLACE FUNCTION upsert_videos(
    p_videos JSONB
)
RETURNS SETOF videos AS $$
BEGIN
    RETURN QUERY
    INSERT INTO videos (id, data)
    SELECT value->>'id', value FROM jsonb_array_elements(p_videos) AS value
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
