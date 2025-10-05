-- Migration: 001_init.sql
-- Description: Core tables for YouTube data collection
-- Created: $(date)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Channels table
-- Stores basic information about YouTube channels
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_channel_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    custom_url VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    thumbnail_url VARCHAR(500),
    country VARCHAR(2), -- ISO 3166-1 alpha-2
    default_language VARCHAR(10),
    view_count BIGINT DEFAULT 0,
    subscriber_count BIGINT DEFAULT 0,
    video_count BIGINT DEFAULT 0,
    topic_categories JSONB, -- Array of topic category IDs
    keywords TEXT[], -- Channel keywords/tags
    featured_channels TEXT[], -- Featured channel IDs
    privacy_status VARCHAR(50) DEFAULT 'public',
    is_linked BOOLEAN DEFAULT false,
    long_uploads_status VARCHAR(50),
    made_for_kids BOOLEAN,
    branding_settings JSONB,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, suspended
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
-- Stores information about individual YouTube videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youtube_video_id VARCHAR(255) UNIQUE NOT NULL,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTERVAL, -- ISO 8601 duration
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    thumbnail_url VARCHAR(500),
    tags TEXT[], -- Video tags
    category_id VARCHAR(10),
    live_broadcast_content VARCHAR(50) DEFAULT 'none',
    default_audio_language VARCHAR(10),
    default_language VARCHAR(10),
    projection VARCHAR(50) DEFAULT 'rectangular',
    dimension VARCHAR(50) DEFAULT '2d',
    definition VARCHAR(50) DEFAULT 'hd',
    caption BOOLEAN DEFAULT false,
    licensed_content BOOLEAN DEFAULT false,
    allowed_regions TEXT[], -- ISO 3166-1 alpha-2 codes
    blocked_regions TEXT[], -- ISO 3166-1 alpha-2 codes
    privacy_status VARCHAR(50) DEFAULT 'public',
    embeddable BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active', -- active, deleted, private
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channel statistics table
-- Historical statistics for channels (updated daily)
CREATE TABLE channel_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    view_count BIGINT DEFAULT 0,
    subscriber_count BIGINT DEFAULT 0,
    video_count BIGINT DEFAULT 0,
    subscriber_gained INTEGER DEFAULT 0,
    subscriber_lost INTEGER DEFAULT 0,
    view_gained INTEGER DEFAULT 0,
    estimated_minutes_watched BIGINT DEFAULT 0,
    average_view_duration INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, date)
);

-- Video statistics table
-- Historical statistics for videos (updated hourly/daily)
CREATE TABLE video_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER, -- 0-23 for hourly stats, NULL for daily
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    subscriber_gained INTEGER DEFAULT 0,
    view_gained INTEGER DEFAULT 0,
    estimated_minutes_watched BIGINT DEFAULT 0,
    average_view_duration INTERVAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, date, hour)
);

-- Create indexes for better query performance
CREATE INDEX idx_channels_youtube_channel_id ON channels(youtube_channel_id);
CREATE INDEX idx_channels_status ON channels(status);
CREATE INDEX idx_channels_last_fetched_at ON channels(last_fetched_at);

CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_youtube_video_id ON videos(youtube_video_id);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_last_fetched_at ON videos(last_fetched_at);

CREATE INDEX idx_channel_stats_channel_id ON channel_stats(channel_id);
CREATE INDEX idx_channel_stats_date ON channel_stats(date);

CREATE INDEX idx_video_stats_video_id ON video_stats(video_id);
CREATE INDEX idx_video_stats_date ON video_stats(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();