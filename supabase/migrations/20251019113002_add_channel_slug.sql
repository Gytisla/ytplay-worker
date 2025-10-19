-- Add slug column to channels table for SEO-friendly URLs
ALTER TABLE channels ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Create function to generate URL-safe slug from title
CREATE OR REPLACE FUNCTION generate_channel_slug(channel_title TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    RETURN regexp_replace(
        regexp_replace(
            lower(channel_title),
            '[^a-z0-9\s-]',
            '',
            'g'
        ),
        '\s+',
        '-',
        'g'
    );
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing channels
UPDATE channels SET slug = generate_channel_slug(title) WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing data
ALTER TABLE channels ALTER COLUMN slug SET NOT NULL;

-- Create index on slug for faster lookups
CREATE INDEX idx_channels_slug ON channels(slug);

-- Create trigger to auto-generate slug on insert/update if not provided
CREATE OR REPLACE FUNCTION set_channel_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_channel_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_channel_slug
    BEFORE INSERT OR UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION set_channel_slug();