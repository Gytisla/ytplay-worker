-- Migration: 016_public_read.sql
-- Description: Add public read policies for discovery features
-- Created: $(date)

-- Allow public read access to videos for discovery
CREATE POLICY "videos_public_read" ON videos
    FOR SELECT USING (true);

-- Allow public read access to channels for video display
CREATE POLICY "channels_public_read" ON channels
    FOR SELECT USING (true);