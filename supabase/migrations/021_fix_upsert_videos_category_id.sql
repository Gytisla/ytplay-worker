-- Migration: 021_fix_upsert_videos_category_id.sql
-- Description: Update upsert_videos RPC to properly handle UUID category_id

-- Update the upsert_videos function to cast category_id to UUID
CREATE OR REPLACE FUNCTION upsert_videos(
    video_data JSONB
)
RETURNS SETOF videos AS $$
BEGIN
    RETURN QUERY
    INSERT INTO videos (
        youtube_video_id,
        channel_id,
        title,
        description,
        published_at,
        duration,
        view_count,
        like_count,
        comment_count,
        thumbnail_url,
        tags,
        youtube_category_id,
        category_id,
        live_broadcast_content,
        default_audio_language,
        default_language,
        projection,
        dimension,
        definition,
        caption,
        licensed_content,
        allowed_regions,
        blocked_regions,
        privacy_status,
        embeddable,
        status,
        last_fetched_at
    )
    SELECT
        (value->>'youtube_video_id')::VARCHAR(255),
        (value->>'channel_id')::UUID,
        value->>'title',
        value->>'description',
        (value->>'published_at')::TIMESTAMP WITH TIME ZONE,
        (value->>'duration')::INTERVAL,
        (value->>'view_count')::BIGINT,
        (value->>'like_count')::BIGINT,
        (value->>'comment_count')::BIGINT,
        value->>'thumbnail_url',
        CASE
            WHEN value->'tags' IS NOT NULL AND jsonb_typeof(value->'tags') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(value->'tags'))
            ELSE NULL
        END,
        value->>'youtube_category_id',
        CASE
            WHEN value->>'category_id' IS NOT NULL AND value->>'category_id' != ''
            THEN (value->>'category_id')::UUID
            ELSE NULL
        END,
        value->>'live_broadcast_content',
        value->>'default_audio_language',
        value->>'default_language',
        value->>'projection',
        value->>'dimension',
        value->>'definition',
        (value->>'caption')::BOOLEAN,
        (value->>'licensed_content')::BOOLEAN,
        CASE
            WHEN value->'allowed_regions' IS NOT NULL AND jsonb_typeof(value->'allowed_regions') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(value->'allowed_regions'))
            ELSE NULL
        END,
        CASE
            WHEN value->'blocked_regions' IS NOT NULL AND jsonb_typeof(value->'blocked_regions') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(value->'blocked_regions'))
            ELSE NULL
        END,
        value->>'privacy_status',
        (value->>'embeddable')::BOOLEAN,
        value->>'status',
        (value->>'last_fetched_at')::TIMESTAMP WITH TIME ZONE
    FROM jsonb_array_elements(video_data) AS value
    ON CONFLICT (youtube_video_id) DO UPDATE SET
        channel_id = EXCLUDED.channel_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        published_at = EXCLUDED.published_at,
        duration = EXCLUDED.duration,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        thumbnail_url = EXCLUDED.thumbnail_url,
        tags = EXCLUDED.tags,
        youtube_category_id = EXCLUDED.youtube_category_id,
        category_id = EXCLUDED.category_id,
        live_broadcast_content = EXCLUDED.live_broadcast_content,
        default_audio_language = EXCLUDED.default_audio_language,
        default_language = EXCLUDED.default_language,
        projection = EXCLUDED.projection,
        dimension = EXCLUDED.dimension,
        definition = EXCLUDED.definition,
        caption = EXCLUDED.caption,
        licensed_content = EXCLUDED.licensed_content,
        allowed_regions = EXCLUDED.allowed_regions,
        blocked_regions = EXCLUDED.blocked_regions,
        privacy_status = EXCLUDED.privacy_status,
        embeddable = EXCLUDED.embeddable,
        status = EXCLUDED.status,
        last_fetched_at = EXCLUDED.last_fetched_at,
        updated_at = NOW()
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;