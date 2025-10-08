-- Migration: 015_channel_feed_trigger.sql
-- Description: Insert a default YouTube RSS feed into channel_feeds when a new channel is created
-- Created: $(date)

-- Function to insert default feed for new channels
CREATE OR REPLACE FUNCTION insert_default_channel_feed()
RETURNS TRIGGER AS $$
DECLARE
    default_feed_url TEXT;
BEGIN
    -- Build the YouTube channel RSS feed URL using the youtube_channel_id
    IF NEW.youtube_channel_id IS NULL THEN
        RETURN NEW;
    END IF;

    default_feed_url := 'https://www.youtube.com/feeds/videos.xml?channel_id=' || NEW.youtube_channel_id;

    -- Insert into channel_feeds if not already present for this channel and feed_url
    INSERT INTO channel_feeds (channel_id, feed_url, feed_type, is_active, created_at, updated_at)
    SELECT NEW.id, default_feed_url, 'youtube_rss', true, NOW(), NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM channel_feeds cf WHERE cf.channel_id = NEW.id AND cf.feed_url = default_feed_url
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after insert on channels
DROP TRIGGER IF EXISTS insert_default_channel_feed_trigger ON channels;
CREATE TRIGGER insert_default_channel_feed_trigger
AFTER INSERT ON channels
FOR EACH ROW
EXECUTE FUNCTION insert_default_channel_feed();
