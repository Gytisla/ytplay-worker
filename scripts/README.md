# Scripts

This directory contains utility scripts for database management and maintenance.

## Admin User Management

### Promote User to Admin

Promotes a registered user to admin role.

```bash
node scripts/promote-admin.js <email>
```

**Example:**
```bash
node scripts/promote-admin.js admin@example.com
```

**What it does:**
1. Finds the user by email in Supabase auth
2. Creates or updates their profile with admin role
3. Enables access to admin dashboard and user management features

**Requirements:**
- User must already be registered
- Environment variables must be set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

## One-time Video Categorization Script

This script categorizes existing videos in the database that don't have a `category_id` set yet.

## Usage

```bash
# Make sure you have the correct environment variables set
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY should be in your .env file

node scripts/categorize-existing-videos.js
```

## What it does

1. **Finds uncategorized videos**: Queries all videos where `category_id` is `NULL`
2. **Applies categorization rules**: Uses the same logic as the RSS poll and backfill handlers
3. **Updates videos**: Sets the `category_id` for videos that match categorization rules
4. **Batch processing**: Processes videos in batches of 100 to avoid memory issues
5. **Progress reporting**: Shows progress and final statistics

## Output

The script will output:
- Total videos found without categories
- Progress updates every batch
- Final statistics (processed, categorized, uncategorized)

## Safety

- **Idempotent**: Can be run multiple times safely
- **No data loss**: Only adds category_id, never removes existing data
- **Data validation**: Skips videos with missing required fields (prevents constraint violations)
- **Batch processing**: Won't overwhelm the database
- **Error handling**: Continues processing even if individual videos fail

## Requirements

- Node.js
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Database must have the categorization system migrations applied (017, 018)