-- Add slug column to videos table for SEO-friendly URLs
ALTER TABLE videos ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Create function to generate URL-safe slug from title
CREATE OR REPLACE FUNCTION generate_video_slug(video_title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    base_slug := regexp_replace(
        regexp_replace(
            lower(video_title),
            '[^a-z0-9\s-]',
            '',
            'g'
        ),
        '\s+',
        '-',
        'g'
    );

    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'video';
    END IF;

    -- Check if slug already exists and append counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM videos WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing videos
UPDATE videos SET slug = generate_video_slug(title) WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing data
ALTER TABLE videos ALTER COLUMN slug SET NOT NULL;

-- Create index on slug for faster lookups
CREATE INDEX idx_videos_slug ON videos(slug);

-- Create trigger to auto-generate slug on insert/update if not provided
CREATE OR REPLACE FUNCTION set_video_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_video_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_video_slug
    BEFORE INSERT OR UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION set_video_slug();