-- migrations/010_rpc_data.sql
-- T024: Create upsert_channel, upsert_videos RPCs

-- migrations/010_rpc_data.sql
-- T024: Create upsert_channel, upsert_videos RPCs

-- Upsert channel (insert or update)
CREATE OR REPLACE FUNCTION upsert_channel(
    channel_data JSONB
)
RETURNS channels AS $$
DECLARE
    v_channel channels;
BEGIN
    INSERT INTO channels (
        youtube_channel_id,
        title,
        description,
        custom_url,
        published_at,
        thumbnail_url,
        country,
        default_language,
        view_count,
        subscriber_count,
        video_count,
        topic_categories,
        keywords,
        featured_channels,
        privacy_status,
        is_linked,
        long_uploads_status,
        made_for_kids,
        branding_settings,
        status,
        last_fetched_at
    ) VALUES (
        channel_data->>'youtube_channel_id',
        channel_data->>'title',
        channel_data->>'description',
        channel_data->>'custom_url',
        (channel_data->>'published_at')::TIMESTAMP WITH TIME ZONE,
        channel_data->>'thumbnail_url',
        channel_data->>'country',
        channel_data->>'default_language',
        (channel_data->>'view_count')::BIGINT,
        (channel_data->>'subscriber_count')::BIGINT,
        (channel_data->>'video_count')::BIGINT,
        (channel_data->>'topic_categories')::JSONB,
        CASE 
            WHEN channel_data->'keywords' IS NOT NULL AND jsonb_typeof(channel_data->'keywords') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(channel_data->'keywords'))
            ELSE NULL
        END,
        CASE 
            WHEN channel_data->'featured_channels' IS NOT NULL AND jsonb_typeof(channel_data->'featured_channels') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(channel_data->'featured_channels'))
            ELSE NULL
        END,
        channel_data->>'privacy_status',
        (channel_data->>'is_linked')::BOOLEAN,
        channel_data->>'long_uploads_status',
        (channel_data->>'made_for_kids')::BOOLEAN,
        (channel_data->>'branding_settings')::JSONB,
        channel_data->>'status',
        NOW()
    )
    ON CONFLICT (youtube_channel_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        custom_url = EXCLUDED.custom_url,
        published_at = EXCLUDED.published_at,
        thumbnail_url = EXCLUDED.thumbnail_url,
        country = EXCLUDED.country,
        default_language = EXCLUDED.default_language,
        view_count = EXCLUDED.view_count,
        subscriber_count = EXCLUDED.subscriber_count,
        video_count = EXCLUDED.video_count,
        topic_categories = EXCLUDED.topic_categories,
        keywords = EXCLUDED.keywords,
        featured_channels = EXCLUDED.featured_channels,
        privacy_status = EXCLUDED.privacy_status,
        is_linked = EXCLUDED.is_linked,
        long_uploads_status = EXCLUDED.long_uploads_status,
        made_for_kids = EXCLUDED.made_for_kids,
        branding_settings = EXCLUDED.branding_settings,
        status = EXCLUDED.status,
        last_fetched_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_channel;
    RETURN v_channel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert videos (bulk insert/update)
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
        value->>'category_id',
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
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        published_at = EXCLUDED.published_at,
        duration = EXCLUDED.duration,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        thumbnail_url = EXCLUDED.thumbnail_url,
        tags = EXCLUDED.tags,
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

-- Capture channel statistics
CREATE OR REPLACE FUNCTION capture_channel_stats(
    p_channel_id UUID,
    stats_data JSONB
)
RETURNS channel_stats AS $$
DECLARE
    v_stats channel_stats;
BEGIN
    INSERT INTO channel_stats (
        channel_id,
        date,
        view_count,
        subscriber_count,
        video_count
    ) VALUES (
        p_channel_id,
        CURRENT_DATE,
        (stats_data->>'view_count')::BIGINT,
        (stats_data->>'subscriber_count')::BIGINT,
        (stats_data->>'video_count')::BIGINT
    )
    ON CONFLICT (channel_id, date) DO UPDATE SET
        view_count = EXCLUDED.view_count,
        subscriber_count = EXCLUDED.subscriber_count,
        video_count = EXCLUDED.video_count
    RETURNING * INTO v_stats;
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
