# Data Model: YouTube Fetcher Worker

## Core Entities

### Channel
**Purpose**: Represents a YouTube channel being monitored
**Key Attributes**:
- `id` (Primary Key): YouTube channel ID (UC...)
- `title`: Channel display name
- `description`: Channel description
- `custom_url`: Channel custom URL (if any)
- `subscriber_count`: Current subscriber count
- `video_count`: Total video count
- `view_count`: Total channel view count
- `thumbnail_url`: Channel avatar URL
- `uploads_playlist_id`: YouTube uploads playlist ID
- `country`: Channel country (if public)
- `created_at`: Channel creation timestamp on YouTube
- `tracked_since`: When we started tracking this channel
- `last_refreshed_at`: Last successful data refresh
- `status`: active|paused|deleted|error
- `priority`: Queue priority (1-10, higher = more important)

**Relationships**:
- One-to-many with Videos
- One-to-many with ChannelStats
- One-to-many with Jobs (for processing)
- One-to-many with ChannelFeeds (RSS)

### Video
**Purpose**: Represents individual YouTube videos
**Key Attributes**:
- `id` (Primary Key): YouTube video ID
- `channel_id` (Foreign Key): Associated channel
- `title`: Video title
- `description`: Video description
- `published_at`: Original publication timestamp
- `duration`: Video duration in seconds
- `view_count`: Current view count
- `like_count`: Current like count
- `comment_count`: Current comment count
- `thumbnail_url`: Video thumbnail URL
- `category_id`: YouTube category ID
- `tags`: Array of video tags
- `language`: Detected/declared language
- `caption_available`: Whether captions exist
- `definition`: sd|hd
- `privacy_status`: public|unlisted|private
- `upload_status`: uploaded|processed|failed|rejected
- `first_seen_at`: When we first discovered this video
- `last_refreshed_at`: Last successful stat refresh

**Relationships**:
- Many-to-one with Channel
- One-to-many with VideoStats

### ChannelStats
**Purpose**: Daily snapshots of channel-level statistics
**Key Attributes**:
- `id` (Primary Key): Auto-generated UUID
- `channel_id` (Foreign Key): Associated channel
- `captured_at`: Timestamp when stats were captured
- `subscriber_count`: Subscriber count at capture time
- `video_count`: Total video count at capture time
- `view_count`: Total view count at capture time
- `daily_views`: Views gained in the last 24 hours
- `daily_subscribers`: Subscribers gained in the last 24 hours
- `daily_videos`: Videos published in the last 24 hours

**Unique Constraint**: (channel_id, DATE(captured_at)) - one record per channel per day

### VideoStats
**Purpose**: Historical snapshots of video-level statistics
**Key Attributes**:
- `id` (Primary Key): Auto-generated UUID
- `video_id` (Foreign Key): Associated video
- `captured_at`: Timestamp when stats were captured
- `view_count`: View count at capture time
- `like_count`: Like count at capture time
- `comment_count`: Comment count at capture time
- `hourly_views`: Views gained in the last hour (for hot videos)
- `daily_views`: Views gained in the last 24 hours

**Unique Constraint**: (video_id, captured_at) - allows multiple captures per day for hot videos

### Job
**Purpose**: Represents queued work items for processing
**Key Attributes**:
- `id` (Primary Key): Auto-generated UUID
- `type`: Job type (BACKFILL_CHANNEL, REFRESH_CHANNEL_STATS, etc.)
- `channel_id`: Target channel (nullable for system jobs)
- `video_ids`: Array of video IDs for batch processing (nullable)
- `priority`: Processing priority (1-10)
- `dedup_key`: Unique key to prevent duplicate jobs
- `status`: pending|running|completed|failed|dead
- `attempts`: Current attempt count
- `max_attempts`: Maximum retry attempts
- `scheduled_at`: When job should be processed
- `started_at`: When job execution began
- `completed_at`: When job finished (success or failure)
- `error_message`: Last error message (if failed)
- `payload`: JSON payload with job-specific data

**Indexes**: 
- (status, scheduled_at, priority) for queue processing
- (dedup_key) for duplicate prevention
- (channel_id) for per-channel queries

### JobEvent
**Purpose**: Audit log of job execution events
**Key Attributes**:
- `id` (Primary Key): Auto-generated UUID
- `job_id` (Foreign Key): Associated job
- `event_type`: started|completed|failed|retried|dead_lettered
- `occurred_at`: Event timestamp
- `details`: JSON details about the event
- `duration_ms`: Execution duration (for completed events)

### ChannelFeed
**Purpose**: RSS feed polling state for channels
**Key Attributes**:
- `channel_id` (Primary Key): Associated channel
- `feed_url`: RSS feed URL
- `last_etag`: Last ETag header value
- `last_modified`: Last-Modified header value
- `last_polled_at`: Last successful poll timestamp
- `last_video_published_at`: Most recent video publication time seen
- `poll_interval_minutes`: Custom polling interval (default 10)
- `consecutive_errors`: Count of consecutive poll failures
- `status`: active|paused|error

### ApiBudget
**Purpose**: Tracks YouTube API quota usage
**Key Attributes**:
- `id` (Primary Key): Budget period identifier (e.g., "2025-10-05")
- `quota_used`: API units consumed in this period
- `quota_limit`: Total quota limit for the period
- `period_start`: Budget period start time
- `period_end`: Budget period end time
- `last_updated_at`: Last quota update timestamp

## Entity Relationships

```
Channel 1:N ChannelStats
Channel 1:N Videos
Channel 1:1 ChannelFeed
Channel 1:N Jobs

Video 1:N VideoStats

Job 1:N JobEvent
```

## Data Access Patterns

### High-Frequency Queries
- Queue job polling: `SELECT * FROM jobs WHERE status = 'pending' AND scheduled_at <= NOW() ORDER BY priority DESC, scheduled_at ASC FOR UPDATE SKIP LOCKED LIMIT 10`
- Channel status lookup: `SELECT status, last_refreshed_at FROM channels WHERE id = ?`
- Recent video stats: `SELECT * FROM video_stats WHERE video_id = ? ORDER BY captured_at DESC LIMIT 24`

### Medium-Frequency Queries
- Channel dashboard: `SELECT c.*, cs.* FROM channels c LEFT JOIN channel_stats cs ON c.id = cs.channel_id AND DATE(cs.captured_at) = CURRENT_DATE`
- Hot videos identification: `SELECT * FROM videos WHERE channel_id = ? AND published_at >= NOW() - INTERVAL '7 days'`
- Failed job analysis: `SELECT * FROM jobs WHERE status = 'failed' AND attempts < max_attempts`

### Low-Frequency Queries
- Historical trend analysis: `SELECT * FROM channel_stats WHERE channel_id = ? AND captured_at >= ? ORDER BY captured_at`
- System health metrics: `SELECT COUNT(*) as pending_jobs FROM jobs WHERE status = 'pending'`
- Quota usage reporting: `SELECT SUM(quota_used) FROM api_budget WHERE period_start >= ?`

## Data Retention Policies

### Permanent Retention
- Channels: Keep all channel records indefinitely
- Videos: Keep all video metadata indefinitely
- Channel Stats: Retain daily snapshots permanently for trend analysis

### Time-Based Retention
- Video Stats: Retain hourly stats for 30 days, daily stats for 1 year
- Job Events: Retain for 90 days for debugging and audit purposes
- Jobs: Archive completed jobs after 30 days, keep metadata for 1 year

### Configurable Retention
- API Budget: Configurable retention period (default 1 year)
- Error logs: Configurable based on storage constraints

## Performance Considerations

### Indexing Strategy
- Primary keys and foreign keys automatically indexed
- Composite indexes for common query patterns
- Partial indexes for status-based filtering
- Time-series indexes for temporal queries

### Partitioning Strategy
- Channel Stats: Partition by month for time-series efficiency
- Video Stats: Partition by month with sub-partitioning by channel for large datasets
- Job Events: Partition by month for log data management

### Archival Strategy
- Compress old statistical data
- Move infrequently accessed data to cold storage
- Implement automated cleanup procedures
- Maintain data integrity during archival operations