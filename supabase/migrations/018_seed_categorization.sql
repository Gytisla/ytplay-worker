-- Migration: 018_seed_categorization.sql
-- Description: Seed data for video categorization system
-- Creates default categories and sample categorization rules

-- Insert default video categories
INSERT INTO video_categories (name, key, description, color, icon) VALUES
('Podcasts', 'podcasts', 'Audio-focused content, interviews, and discussions', '#8B5CF6', '🎙️'),
('Travel Vlogs', 'travel-vlogs', 'Travel adventures, destinations, and experiences', '#06B6D4', '✈️'),
('Tech Reviews', 'tech-reviews', 'Technology product reviews and tutorials', '#10B981', '💻'),
('Cooking Tutorials', 'cooking-tutorials', 'Recipes, cooking techniques, and food content', '#F59E0B', '👨‍🍳'),
('Music Videos', 'music-videos', 'Music performances, covers, and audio content', '#EF4444', '🎵'),
('Educational Content', 'educational-content', 'Tutorials, how-tos, and learning materials', '#3B82F6', '📚'),
('Entertainment', 'entertainment', 'General entertainment and lifestyle content', '#EC4899', '🎭'),
('Gaming', 'gaming', 'Video game content, reviews, and streams', '#6366F1', '🎮'),
('Fitness & Health', 'fitness-health', 'Exercise, wellness, and health-related content', '#84CC16', '💪'),
('News & Current Events', 'news-current-events', 'News coverage and current affairs', '#6B7280', '📰')
ON CONFLICT (name) DO UPDATE SET
  key = EXCLUDED.key,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon;

-- Insert sample categorization rules
-- These demonstrate different condition types and priorities

-- High priority: Podcasts (channel-specific)
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  100,
  jsonb_build_object(
    'channel_id', 'UC1234567890abcdef',  -- Replace with actual channel ID
    'title_contains', 'podcast'
  ),
  true,
  'High priority rule for podcast content from specific channel'
FROM video_categories vc
WHERE vc.name = 'Podcasts'
ON CONFLICT DO NOTHING;

-- Medium-high priority: Travel content by title patterns
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  80,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'travel'
  ),
  true,
  'Travel content identified by title keywords'
FROM video_categories vc
WHERE vc.name = 'Travel Vlogs'
ON CONFLICT DO NOTHING;

-- Medium priority: Tech reviews
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  70,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'review',
    'title_contains', 'unboxing'
  ),
  true,
  'Technology reviews and unboxing videos'
FROM video_categories vc
WHERE vc.name = 'Tech Reviews'
ON CONFLICT DO NOTHING;

-- Medium priority: Cooking content
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  65,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'recipe',
    'title_contains', 'cooking',
    'title_contains', 'kitchen'
  ),
  true,
  'Cooking and recipe content'
FROM video_categories vc
WHERE vc.name = 'Cooking Tutorials'
ON CONFLICT DO NOTHING;

-- Medium priority: Music videos
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  60,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'music',
    'title_contains', 'song',
    'title_contains', 'cover'
  ),
  true,
  'Music-related content'
FROM video_categories vc
WHERE vc.name = 'Music Videos'
ON CONFLICT DO NOTHING;

-- Lower priority: Educational content
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  50,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'tutorial',
    'title_contains', 'how to',
    'title_contains', 'learn',
    'title_contains', 'guide'
  ),
  true,
  'Educational and tutorial content'
FROM video_categories vc
WHERE vc.name = 'Educational Content'
ON CONFLICT DO NOTHING;

-- Lower priority: Gaming content
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  45,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'game',
    'title_contains', 'gaming',
    'title_contains', 'playthrough'
  ),
  true,
  'Gaming and video game content'
FROM video_categories vc
WHERE vc.name = 'Gaming'
ON CONFLICT DO NOTHING;

-- Lower priority: Fitness content
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  40,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'workout',
    'title_contains', 'exercise',
    'title_contains', 'fitness',
    'title_contains', 'health'
  ),
  true,
  'Fitness and health-related content'
FROM video_categories vc
WHERE vc.name = 'Fitness & Health'
ON CONFLICT DO NOTHING;

-- Low priority: Entertainment (catch-all)
INSERT INTO categorization_rules (category_id, priority, conditions, active, name)
SELECT
  vc.id,
  10,
  jsonb_build_object(
    'operator', 'OR',
    'title_contains', 'vlog',
    'title_contains', 'life',
    'title_contains', 'story'
  ),
  true,
  'General entertainment and lifestyle content'
FROM video_categories vc
WHERE vc.name = 'Entertainment'
ON CONFLICT DO NOTHING;