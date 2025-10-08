# Database RPC Contracts

## Queue Management RPCs

### enqueue_job(job_type, channel_id, video_ids, priority, scheduled_at, dedup_key)
**Purpose**: Enqueue a new job with deduplication
**Parameters**:
- `job_type`: TEXT - Type of job (BACKFILL_CHANNEL, REFRESH_CHANNEL_STATS, etc.)
- `channel_id`: TEXT - YouTube channel ID (nullable for system jobs)
- `video_ids`: TEXT[] - Array of video IDs for batch processing (nullable)
- `priority`: INTEGER - Job priority 1-10 (default 5)
- `scheduled_at`: TIMESTAMPTZ - When to execute (default NOW())
- `dedup_key`: TEXT - Unique key to prevent duplicates

**Returns**: 
```sql
TABLE(job_id UUID, was_duplicate BOOLEAN)
```

**Behavior**:
- If dedup_key exists and job is pending/running, return existing job_id with was_duplicate=true
- Otherwise, insert new job and return job_id with was_duplicate=false
- Validates job_type against allowed enum values
- Sets default priority and scheduled_at if not provided

### dequeue_jobs(worker_id, max_count, channel_lock_timeout)
**Purpose**: Dequeue jobs with advisory locking and priority ordering
**Parameters**:
- `worker_id`: TEXT - Unique worker identifier
- `max_count`: INTEGER - Maximum jobs to dequeue (default 1)
- `channel_lock_timeout`: INTERVAL - How long to hold channel locks (default 1 hour)

**Returns**:
```sql
TABLE(
  job_id UUID,
  job_type TEXT,
  channel_id TEXT,
  video_ids TEXT[],
  priority INTEGER,
  payload JSONB,
  attempt_count INTEGER
)
```

**Behavior**:
- Uses `FOR UPDATE SKIP LOCKED` for concurrent processing
- Acquires advisory locks on channel_id to ensure per-channel serialization
- Orders by priority DESC, scheduled_at ASC
- Updates job status to 'running' and increments attempt count
- Records worker_id and started_at timestamp

### ack_job(job_id, success, error_message, execution_stats)
**Purpose**: Acknowledge job completion (success or failure)
**Parameters**:
- `job_id`: UUID - Job identifier
- `success`: BOOLEAN - Whether job completed successfully
- `error_message`: TEXT - Error details if failed (nullable)
- `execution_stats`: JSONB - Performance metrics (duration, items_processed, etc.)

**Returns**: `BOOLEAN` - Success status

**Behavior**:
- Updates job status to 'completed' or 'failed'
- Records completion timestamp and execution duration
- Releases advisory locks for the channel
- Creates job_event record with execution details
- If failed and under max_attempts, reschedules with exponential backoff

### retry_job(job_id, delay_seconds)
**Purpose**: Retry a failed job with custom delay
**Parameters**:
- `job_id`: UUID - Job identifier
- `delay_seconds`: INTEGER - Delay before retry (default exponential backoff)

**Returns**: `BOOLEAN` - Success status

**Behavior**:
- Resets job status to 'pending'
- Updates scheduled_at with delay
- Increments attempt count
- Records retry event

### dead_letter_job(job_id, reason)
**Purpose**: Move job to dead letter status after max attempts
**Parameters**:
- `job_id`: UUID - Job identifier  
- `reason`: TEXT - Reason for dead lettering

**Returns**: `BOOLEAN` - Success status

**Behavior**:
- Updates job status to 'dead'
- Records final error state
- Releases all locks
- Creates dead letter event

## Data Management RPCs

### upsert_channel(channel_data)
**Purpose**: Idempotent channel creation/update
**Parameters**:
- `channel_data`: JSONB - Complete channel metadata from YouTube API

**Returns**: 
```sql
TABLE(channel_id TEXT, was_created BOOLEAN, was_updated BOOLEAN)
```

**Behavior**:
- Uses ON CONFLICT to handle existing channels
- Updates only changed fields to minimize write amplification
- Maintains created_at but updates last_refreshed_at
- Validates required fields and constraints

### upsert_videos(video_data_array)
**Purpose**: Batch upsert of video metadata
**Parameters**:
- `video_data_array`: JSONB[] - Array of video metadata objects

**Returns**: 
```sql
TABLE(
  video_id TEXT, 
  was_created BOOLEAN, 
  was_updated BOOLEAN,
  change_summary JSONB
)
```

**Behavior**:
- Processes entire array in single transaction
- Tracks which fields changed for audit purposes
- Handles privacy status changes (public -> private)
- Maintains referential integrity with channels

### capture_channel_stats(channel_id, stats_data)
**Purpose**: Record daily channel statistics snapshot
**Parameters**:
- `channel_id`: TEXT - YouTube channel ID
- `stats_data`: JSONB - Channel statistics from API

**Returns**: 
```sql
TABLE(stats_id UUID, is_new_day BOOLEAN)
```

**Behavior**:
- Enforces one record per channel per day constraint
- Calculates daily deltas (views, subscribers gained)
- Updates channel summary statistics
- Handles timezone considerations for daily boundaries

### capture_video_stats(video_stats_array)
**Purpose**: Record video statistics snapshots
**Parameters**:
- `video_stats_array`: JSONB[] - Array of video statistics

**Returns**: 
```sql
TABLE(
  video_id TEXT,
  stats_id UUID,
  hourly_change INTEGER,
  daily_change INTEGER
)
```

**Behavior**:
- Supports multiple captures per day for hot videos
- Calculates growth rates and trends
- Identifies viral content patterns
- Optimizes storage for unchanged metrics

## Analytics RPCs

### get_queue_metrics()
**Purpose**: Real-time queue performance metrics
**Returns**:
```sql
TABLE(
  pending_jobs INTEGER,
  running_jobs INTEGER,
  failed_jobs_24h INTEGER,
  dead_jobs INTEGER,
  avg_queue_time_minutes NUMERIC,
  jobs_per_hour NUMERIC
)
```

### get_channel_health(channel_id)
**Purpose**: Channel-specific health and performance metrics
**Parameters**:
- `channel_id`: TEXT - YouTube channel ID (nullable for all channels)

**Returns**:
```sql
TABLE(
  channel_id TEXT,
  last_successful_refresh TIMESTAMPTZ,
  consecutive_failures INTEGER,
  avg_processing_time_seconds NUMERIC,
  data_freshness_score NUMERIC
)
```

### get_api_quota_status()
**Purpose**: Current API quota usage and projections
**Returns**:
```sql
TABLE(
  current_quota_used INTEGER,
  quota_limit INTEGER,
  quota_remaining INTEGER,
  reset_time TIMESTAMPTZ,
  projected_daily_usage INTEGER,
  risk_level TEXT
)
```

## Security and Access Control

### Execution Context
- All RPCs execute with SECURITY DEFINER privileges
- Row Level Security (RLS) enforced on underlying tables
- Input validation and sanitization for all parameters
- Rate limiting for administrative functions

### Access Patterns
- Worker processes use service role for job processing
- Nuxt server uses service role for management operations
- All external access goes through application layer
- Direct database access restricted to administrators

### Audit Trail
- All RPC executions logged with caller context
- Parameter values recorded for debugging
- Performance metrics tracked for optimization
- Error conditions escalated to monitoring systems