-- Migration: 20251021222113_auth_setup.sql
-- Description: Set up authentication with user roles and profiles

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- Will be set by trigger after auth.users is accessible
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on role for efficient queries
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Migration: 20251021222113_auth_setup.sql
-- Description: Set up authentication with user roles and profiles

-- Create enum for user roles (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user profiles table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only if it doesn't exist)
DO $$ BEGIN
    CREATE TRIGGER update_user_profiles_updated_at
        BEFORE UPDATE ON user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_user_profile_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create helper functions FIRST
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role;
BEGIN
    SELECT role INTO user_role
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND is_active = true;

    RETURN COALESCE(user_role, 'user'::user_role) >= check_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Admin policies for user_profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (has_role('admin'));

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (has_role('admin'));

CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (has_role('admin'));

-- Create remaining helper functions
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role,
    is_active BOOLEAN,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.email,
        up.full_name,
        up.avatar_url,
        up.role,
        up.is_active,
        up.last_login_at,
        up.created_at
    FROM user_profiles up
    WHERE up.auth_user_id = auth.uid()
    AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION setup_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET role = 'admin'
    WHERE email = user_email;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;