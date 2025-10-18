-- Migration: 017_video_categorization.sql
-- Description: Add video categorization system with rules

-- Create video categories table
CREATE TABLE video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  key VARCHAR(100) UNIQUE, -- URL-friendly identifier for programmatic access
  description TEXT,
  color VARCHAR(7), -- Hex color for UI (e.g., "#FF6B6B")
  icon VARCHAR(50), -- Icon name (e.g., "mic", "plane")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categorization rules table
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INTEGER NOT NULL,
  name VARCHAR(200) NOT NULL,
  conditions JSONB NOT NULL,
  category_id UUID REFERENCES video_categories(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(priority)
);

-- Rename existing category_id to youtube_category_id (YouTube's category ID)
ALTER TABLE videos RENAME COLUMN category_id TO youtube_category_id;

-- Rename the existing index to match the renamed column
ALTER INDEX idx_videos_category_id RENAME TO idx_videos_youtube_category_id;

-- Add our categorization system category_id
ALTER TABLE videos ADD COLUMN category_id UUID REFERENCES video_categories(id);

-- Create indexes for performance
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_categorization_rules_priority ON categorization_rules(priority) WHERE active = true;
CREATE INDEX idx_categorization_rules_active ON categorization_rules(active);
CREATE INDEX idx_video_categories_key ON video_categories(key);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_video_categories_updated_at BEFORE UPDATE ON video_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorization_rules_updated_at BEFORE UPDATE ON categorization_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();