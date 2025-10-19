-- Migration: 20251019190000_create_channel_submissions.sql
-- Description: Create table for storing user-submitted YouTube channels for manual review

-- Channel submissions table
-- Stores user-submitted YouTube channels for manual approval/review
CREATE TABLE channel_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('handle', 'id', 'url')),
    submitted_value TEXT NOT NULL,
    client_ip INET NULL, -- Store client IP for rate limiting (nullable for development)
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
    reviewed_by UUID, -- Will reference admin user if we add user management
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_handle CHECK (
        submission_type != 'handle' OR (submitted_value LIKE '@%' AND LENGTH(submitted_value) >= 3)
    ),
    CONSTRAINT valid_channel_id CHECK (
        submission_type != 'id' OR (submitted_value LIKE 'UC%' AND LENGTH(submitted_value) = 24)
    ),
    CONSTRAINT valid_url CHECK (
        submission_type != 'url' OR submitted_value LIKE 'https://www.youtube.com/%' OR submitted_value LIKE 'https://youtu.be/%'
    )
);

-- Indexes for efficient querying
CREATE INDEX idx_channel_submissions_status ON channel_submissions(status);
CREATE INDEX idx_channel_submissions_type ON channel_submissions(submission_type);
CREATE INDEX idx_channel_submissions_submitted_at ON channel_submissions(submitted_at DESC);
CREATE INDEX idx_channel_submissions_value ON channel_submissions(submitted_value);
CREATE INDEX idx_channel_submissions_client_ip_time ON channel_submissions(client_ip, submitted_at DESC) WHERE client_ip IS NOT NULL;

-- Unique constraint to prevent duplicate pending submissions
CREATE UNIQUE INDEX idx_channel_submissions_unique_pending
ON channel_submissions (submission_type, submitted_value)
WHERE status = 'pending';

-- Row Level Security (RLS)
ALTER TABLE channel_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert submissions
CREATE POLICY "Anyone can submit channels" ON channel_submissions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only authenticated users can view submissions (for admin purposes)
-- For now, we'll allow public read for simplicity, but this should be restricted in production
CREATE POLICY "Public can view submissions" ON channel_submissions
    FOR SELECT
    USING (true);

-- Policy: Only admins can update submissions (approve/reject)
-- This will need to be implemented when user authentication is added
-- For now, allow all updates (should be restricted in production)
CREATE POLICY "Allow updates to submissions" ON channel_submissions
    FOR UPDATE
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_channel_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_channel_submissions_updated_at
    BEFORE UPDATE ON channel_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_submissions_updated_at();

-- Comments for documentation
COMMENT ON TABLE channel_submissions IS 'User-submitted YouTube channels awaiting manual review and approval';
COMMENT ON COLUMN channel_submissions.submission_type IS 'Type of submission: handle (@username), id (UC...), or url (full YouTube URL)';
COMMENT ON COLUMN channel_submissions.submitted_value IS 'The actual submitted value (handle, ID, or URL)';
COMMENT ON COLUMN channel_submissions.client_ip IS 'Client IP address for rate limiting and spam prevention (nullable in development)';
COMMENT ON COLUMN channel_submissions.status IS 'Review status: pending, approved, rejected, or duplicate';
COMMENT ON COLUMN channel_submissions.reviewed_by IS 'UUID of the admin who reviewed this submission';
COMMENT ON COLUMN channel_submissions.reviewed_at IS 'Timestamp when the submission was reviewed';
COMMENT ON COLUMN channel_submissions.review_notes IS 'Optional notes from the reviewer about the decision';