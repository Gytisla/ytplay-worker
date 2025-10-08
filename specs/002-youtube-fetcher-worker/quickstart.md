# Quickstart Test Scenarios

## Test Environment Setup

### Prerequisites
- Local Supabase instance running with migrations applied
- YouTube API key configured
- Test API key for management endpoints
- Mock YouTube API responses for consistent testing

### Environment Variables
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
YT_API_KEY=test_youtube_api_key
API_KEY=test_management_api_key
RSS_POLL_INTERVAL_MIN=1
WORKER_MAX_CONCURRENCY=2
JOB_MAX_ATTEMPTS=3
```

## Scenario 1: Complete Channel Registration Flow

### Description
Test the full end-to-end flow of registering a new YouTube channel and processing its initial backfill.

### Steps

#### 1. Register New Channel
```bash
curl -X POST http://localhost:3000/api/channels \
  -H "x-api-key: test_management_api_key" \
  -H "Content-Type: application/json" \
  -d '{"channelId": "UCTestChannel123456789012"}'
```

**Expected Response**:
```json
{
  "success": true,
  "channelId": "UCTestChannel123456789012",
  "message": "Channel registered successfully",
  "jobId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. Verify Channel Record Created
```sql
SELECT id, title, status, tracked_since 
FROM channels 
WHERE id = 'UCTestChannel123456789012';
```

**Expected**: Single row with status 'active' and tracked_since = current timestamp

#### 3. Verify Backfill Job Enqueued
```sql
SELECT job_id, type, channel_id, status, dedup_key
FROM jobs 
WHERE channel_id = 'UCTestChannel123456789012' 
AND type = 'BACKFILL_CHANNEL';
```

**Expected**: Single job with status 'pending' and unique dedup_key

#### 4. Process Backfill Job
Trigger queue worker to process the backfill job (automatic in production, manual trigger for testing)

#### 5. Verify Channel Metadata Populated
```sql
SELECT id, title, subscriber_count, video_count, uploads_playlist_id 
FROM channels 
WHERE id = 'UCTestChannel123456789012';
```

**Expected**: Channel with populated metadata from YouTube API

#### 6. Verify Videos Discovered and Created
```sql
SELECT COUNT(*) as video_count, MIN(published_at) as oldest_video 
FROM videos 
WHERE channel_id = 'UCTestChannel123456789012';
```

**Expected**: Videos count > 0, oldest_video represents channel's earliest content

#### 7. Verify Initial Stats Captured
```sql
SELECT captured_at, subscriber_count, video_count, view_count 
FROM channel_stats 
WHERE channel_id = 'UCTestChannel123456789012' 
ORDER BY captured_at DESC 
LIMIT 1;
```

**Expected**: Stats record with current day's data

### Success Criteria
- Channel status remains 'active'
- All channel metadata populated
- Video count matches YouTube API response
- Initial stats snapshot created
- No failed jobs in queue
- Job events logged properly

## Scenario 2: RSS Feed Discovery and Processing

### Description
Test the RSS polling mechanism for discovering new videos and triggering hydration.

### Setup
- Channel already registered and backfilled from Scenario 1
- Mock RSS feed with new video entry

### Steps

#### 1. Verify RSS Feed Configuration
```sql
SELECT channel_id, feed_url, last_polled_at, status 
FROM channel_feeds 
WHERE channel_id = 'UCTestChannel123456789012';
```

**Expected**: Feed configured with active status

#### 2. Trigger RSS Polling Job
```bash
curl -X POST http://localhost:3000/api/jobs/enqueue \
  -H "x-api-key: test_management_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "RSS_POLL_CHANNEL",
    "channelId": "UCTestChannel123456789012",
    "priority": 8
  }'
```

#### 3. Process RSS Poll Job
Worker processes RSS_POLL_CHANNEL job and discovers new video

#### 4. Verify New Video Discovered
```sql
SELECT id, title, published_at, first_seen_at 
FROM videos 
WHERE channel_id = 'UCTestChannel123456789012' 
AND first_seen_at > NOW() - INTERVAL '5 minutes';
```

**Expected**: New video record with recent first_seen_at

#### 5. Verify Video Hydration Job Enqueued
```sql
SELECT job_id, type, video_ids, status 
FROM jobs 
WHERE type = 'REFRESH_VIDEO_STATS' 
AND video_ids @> ARRAY['new_video_id_here'];
```

**Expected**: Hydration job queued for new video

#### 6. Process Video Hydration
Worker processes video statistics refresh job

#### 7. Verify Video Stats Populated
```sql
SELECT video_id, view_count, like_count, captured_at 
FROM video_stats 
WHERE video_id = 'new_video_id_here' 
ORDER BY captured_at DESC 
LIMIT 1;
```

**Expected**: Fresh statistics for newly discovered video

### Success Criteria
- RSS feed polled successfully
- New video discovered within polling interval
- Video metadata fully populated
- Video statistics captured
- Feed polling state updated correctly

## Scenario 3: Quota Management and Rate Limiting

### Description
Test the system's ability to respect YouTube API quotas and handle rate limiting gracefully.

### Setup
- Configure low quota limits for testing
- Multiple channels registered requiring processing

### Steps

#### 1. Configure Test Quota Limits
```sql
UPDATE api_budget 
SET quota_limit = 100, quota_used = 0 
WHERE id = CURRENT_DATE::TEXT;
```

#### 2. Enqueue Multiple Heavy Jobs
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/jobs/enqueue \
    -H "x-api-key: test_management_api_key" \
    -H "Content-Type: application/json" \
    -d "{\"type\": \"BACKFILL_CHANNEL\", \"channelId\": \"UCTestChannel00$i\", \"priority\": 5}"
done
```

#### 3. Monitor Quota Usage
```bash
curl -H "x-api-key: test_management_api_key" \
  http://localhost:3000/api/metrics
```

#### 4. Verify Quota Enforcement
```sql
SELECT quota_used, quota_limit, (quota_used::FLOAT / quota_limit * 100) as usage_percent 
FROM api_budget 
WHERE id = CURRENT_DATE::TEXT;
```

**Expected**: Usage increases but never exceeds limit

#### 5. Verify Graceful Degradation
```sql
SELECT COUNT(*) as deferred_jobs 
FROM jobs 
WHERE status = 'pending' 
AND scheduled_at > NOW();
```

**Expected**: Jobs deferred when quota approaches limit

### Success Criteria
- Quota limits respected strictly
- Jobs deferred when quota insufficient
- No API 429 errors due to over-consumption
- System continues processing within limits
- Quota resets trigger resumed processing

## Scenario 4: Error Handling and Recovery

### Description
Test system resilience to various failure modes and recovery mechanisms.

### Steps

#### 1. Simulate YouTube API Failure
Configure mock to return 500 errors for specific requests

#### 2. Process Job with API Failure
Trigger job that will encounter API error

#### 3. Verify Retry Logic
```sql
SELECT job_id, attempts, status, error_message, scheduled_at 
FROM jobs 
WHERE type = 'REFRESH_CHANNEL_STATS' 
AND attempts > 1;
```

**Expected**: Job retried with exponential backoff delay

#### 4. Verify Job Event Logging
```sql
SELECT event_type, occurred_at, details 
FROM job_events 
WHERE job_id = 'failing_job_id' 
ORDER BY occurred_at;
```

**Expected**: Complete audit trail of retry attempts

#### 5. Simulate Max Retries Exceeded
Allow job to exceed max_attempts threshold

#### 6. Verify Dead Letter Handling
```sql
SELECT job_id, status, attempts, error_message 
FROM jobs 
WHERE status = 'dead' 
AND attempts >= 3;
```

**Expected**: Job moved to dead letter status

#### 7. Test Manual Recovery
```bash
curl -X POST http://localhost:3000/api/jobs/enqueue \
  -H "x-api-key: test_management_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "REFRESH_CHANNEL_STATS",
    "channelId": "UCTestChannel123456789012",
    "priority": 10
  }'
```

### Success Criteria
- Failed jobs retried with backoff
- Dead letter queue prevents infinite retries
- All failure modes logged comprehensively
- Manual recovery procedures work
- System stability maintained under failure

## Scenario 5: Health Monitoring and Observability

### Description
Validate monitoring endpoints and observability features.

### Steps

#### 1. Check System Health
```bash
curl -H "x-api-key: test_management_api_key" \
  http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "queueDepth": 5,
  "running": 2,
  "failed24h": 1,
  "dead": 0,
  "workersOk": true,
  "lastWorkerHeartbeat": "2025-10-05T15:30:00Z"
}
```

#### 2. Check Detailed Metrics
```bash
curl -H "x-api-key: test_management_api_key" \
  http://localhost:3000/api/metrics
```

**Expected**: Comprehensive metrics including queue, API, workers, and database stats

#### 3. Verify Log Structured Format
Check application logs for proper JSON formatting and correlation IDs

#### 4. Test Alerting Thresholds
Configure high queue depth and verify alerting (if implemented)

### Success Criteria
- Health endpoint returns accurate data
- Metrics endpoint provides actionable insights
- Logs are structured and searchable
- Performance baselines established
- Alerting triggers appropriately

## Automation and CI Integration

### Test Execution
```bash
# Run full quickstart test suite
npm run test:quickstart

# Run specific scenario
npm run test:scenario -- --scenario=channel-registration

# Run with coverage
npm run test:quickstart -- --coverage
```

### Expected CI Behavior
- All scenarios pass in clean environment
- Tests run in parallel where possible
- Cleanup procedures restore clean state
- Performance benchmarks within acceptable ranges
- No memory leaks or resource exhaustion

### Performance Baselines
- Channel registration: < 2 seconds
- Video discovery via RSS: < 30 seconds
- Backfill 100 videos: < 5 minutes
- Health check response: < 100ms
- Metric calculation: < 500ms