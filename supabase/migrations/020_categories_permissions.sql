-- Migration: 020_categories_permissions.sql
-- Description: Add RLS and public read policies for video categorization tables

-- Enable RLS on categorization tables
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Allow public read access to video categories for browsing
CREATE POLICY "video_categories_public_read" ON video_categories
    FOR SELECT USING (true);

-- Allow public read access to categorization rules (read-only for transparency)
CREATE POLICY "categorization_rules_public_read" ON categorization_rules
    FOR SELECT USING (true);

-- Service role policies for admin access (categorization management)
CREATE POLICY "video_categories_service_role_access" ON video_categories
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "categorization_rules_service_role_access" ON categorization_rules
    FOR ALL USING (auth.role() = 'service_role');