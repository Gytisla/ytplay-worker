-- Migration: 003_feeds.sql
-- Description: RSS feed tracking and API quota management
-- Created: $(date)

-- Channel feeds table
-- Tracks RSS feed URLs and polling state for each channel
CREATE TABLE channel_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    feed_url VARCHAR(1000) NOT NULL,
    feed_type VARCHAR(50) DEFAULT 'youtube_rss', -- youtube_rss, custom_rss
    last_polled_at TIMESTAMP WITH TIME ZONE,
    last_successful_poll_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    poll_interval_minutes INTEGER DEFAULT 10, -- How often to poll this feed
    consecutive_failures INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    etag VARCHAR(255), -- HTTP ETag for conditional requests
    last_modified TIMESTAMP WITH TIME ZONE, -- Last-Modified header
    feed_metadata JSONB, -- Additional feed metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, feed_url)
);

-- API budget table
-- Tracks YouTube API quota usage and limits
CREATE TABLE api_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    quota_type VARCHAR(100) NOT NULL, -- 'youtube_data_api_v3', 'youtube_analytics_api', etc.
    daily_limit BIGINT NOT NULL,
    current_usage BIGINT DEFAULT 0,
    cost_per_unit DECIMAL(10,4) DEFAULT 0, -- Cost per API call in USD
    estimated_cost DECIMAL(10,2) DEFAULT 0, -- Running total for the day
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, quota_type)
);

-- API usage log table
-- Detailed log of API calls for auditing and analysis
CREATE TABLE api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quota_type VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL, -- API endpoint called
    method VARCHAR(10) DEFAULT 'GET',
    request_params JSONB, -- Sanitized request parameters
    response_status INTEGER,
    quota_cost INTEGER DEFAULT 1, -- How many quota units this call consumed
    cost_usd DECIMAL(10,4) DEFAULT 0, -- Cost in USD
    error_message TEXT,
    channel_id UUID REFERENCES channels(id), -- Associated channel if applicable
    video_id UUID REFERENCES videos(id), -- Associated video if applicable
    ip_address INET, -- Client IP (for rate limiting)
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for channel feeds
CREATE INDEX idx_channel_feeds_channel_id ON channel_feeds(channel_id);
CREATE INDEX idx_channel_feeds_is_active ON channel_feeds(is_active);
CREATE INDEX idx_channel_feeds_last_polled_at ON channel_feeds(last_polled_at);
CREATE INDEX idx_channel_feeds_next_poll ON channel_feeds(last_polled_at, poll_interval_minutes)
    WHERE is_active = true;

-- Indexes for API budget
CREATE INDEX idx_api_budget_date ON api_budget(date);
CREATE INDEX idx_api_budget_quota_type ON api_budget(quota_type);
CREATE INDEX idx_api_budget_date_type ON api_budget(date, quota_type);

-- Indexes for API usage log
CREATE INDEX idx_api_usage_log_quota_type ON api_usage_log(quota_type);
CREATE INDEX idx_api_usage_log_created_at ON api_usage_log(created_at);
CREATE INDEX idx_api_usage_log_channel_id ON api_usage_log(channel_id);
CREATE INDEX idx_api_usage_log_video_id ON api_usage_log(video_id);
CREATE INDEX idx_api_usage_log_endpoint ON api_usage_log(endpoint);

-- Updated_at triggers
CREATE TRIGGER update_channel_feeds_updated_at BEFORE UPDATE ON channel_feeds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if channel feed should be polled
CREATE OR REPLACE FUNCTION should_poll_feed(feed_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    feed_record RECORD;
    time_since_last_poll INTERVAL;
BEGIN
    SELECT * INTO feed_record FROM channel_feeds WHERE id = feed_id;

    IF NOT FOUND OR NOT feed_record.is_active THEN
        RETURN FALSE;
    END IF;

    -- Check if feed has never been polled
    IF feed_record.last_polled_at IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if enough time has passed since last poll
    time_since_last_poll := NOW() - feed_record.last_polled_at;
    RETURN EXTRACT(EPOCH FROM time_since_last_poll) / 60 >= feed_record.poll_interval_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function to update API budget usage
CREATE OR REPLACE FUNCTION update_api_budget(
    quota_type_param VARCHAR(100),
    quota_cost_param INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    cost_per_unit DECIMAL(10,4);
BEGIN
    -- Get cost per unit for this quota type
    SELECT cost_per_unit INTO cost_per_unit
    FROM api_budget
    WHERE date = current_date AND quota_type = quota_type_param;

    IF NOT FOUND THEN
        -- Insert new budget record if it doesn't exist
        -- Default limits based on YouTube API quotas
        CASE quota_type_param
            WHEN 'youtube_data_api_v3' THEN
                INSERT INTO api_budget (date, quota_type, daily_limit, cost_per_unit)
                VALUES (current_date, quota_type_param, 10000, 0.0);
            WHEN 'youtube_analytics_api' THEN
                INSERT INTO api_budget (date, quota_type, daily_limit, cost_per_unit)
                VALUES (current_date, quota_type_param, 100000, 0.0);
            ELSE
                INSERT INTO api_budget (date, quota_type, daily_limit, cost_per_unit)
                VALUES (current_date, quota_type_param, 1000, 0.0);
        END CASE;

        cost_per_unit := 0.0;
    END IF;

    -- Update usage
    UPDATE api_budget
    SET
        current_usage = current_usage + quota_cost_param,
        estimated_cost = estimated_cost + (quota_cost_param * cost_per_unit),
        last_updated = NOW()
    WHERE date = current_date AND quota_type = quota_type_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check if API quota is available
CREATE OR REPLACE FUNCTION check_api_quota(
    quota_type_param VARCHAR(100),
    requested_cost INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    budget_record RECORD;
BEGIN
    SELECT * INTO budget_record
    FROM api_budget
    WHERE date = CURRENT_DATE AND quota_type = quota_type_param;

    IF NOT FOUND THEN
        -- No budget record exists, assume quota is available
        RETURN TRUE;
    END IF;

    RETURN (budget_record.current_usage + requested_cost) <= budget_record.daily_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    quota_type_param VARCHAR(100),
    endpoint_param VARCHAR(255),
    method_param VARCHAR(10) DEFAULT 'GET',
    response_status_param INTEGER DEFAULT NULL,
    quota_cost_param INTEGER DEFAULT 1,
    channel_id_param UUID DEFAULT NULL,
    video_id_param UUID DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    cost_per_unit DECIMAL(10,4) := 0.0;
BEGIN
    -- Get cost per unit
    SELECT cost_per_unit INTO cost_per_unit
    FROM api_budget
    WHERE date = CURRENT_DATE AND quota_type = quota_type_param;

    -- Insert usage log
    INSERT INTO api_usage_log (
        quota_type, endpoint, method, response_status,
        quota_cost, cost_usd, channel_id, video_id, error_message
    ) VALUES (
        quota_type_param, endpoint_param, method_param, response_status_param,
        quota_cost_param, cost_per_unit * quota_cost_param, channel_id_param, video_id_param, error_message_param
    );

    -- Update budget if call was successful (status 200-299)
    IF response_status_param >= 200 AND response_status_param < 300 THEN
        PERFORM update_api_budget(quota_type_param, quota_cost_param);
    END IF;
END;
$$ LANGUAGE plpgsql;