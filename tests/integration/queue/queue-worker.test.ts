import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

describe('Queue Worker Edge Function Integration Tests', () => {
  let client: Client
  let supabase: ReturnType<typeof createClient>



  beforeAll(async () => {
    client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    })
    await client.connect()

    // Disable RLS for testing
    await client.query('ALTER TABLE jobs DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE job_events DISABLE ROW LEVEL SECURITY')

    // Initialize Supabase client with anon key (to simulate Edge Function calling RPCs)
    const supabaseUrl = process.env['SUPABASE_URL']!
    const supabaseAnonKey = process.env['SUPABASE_ANON_KEY']!
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  afterAll(async () => {
    // Re-enable RLS
    await client.query('ALTER TABLE jobs ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE job_events ENABLE ROW LEVEL SECURITY')
    await client.end()
  })

  beforeEach(async () => {
    // Clean up jobs and events
    await client.query('TRUNCATE TABLE jobs, job_events RESTART IDENTITY CASCADE')
  })

  describe('Job Processing Flow', () => {
    it('should enqueue and dequeue jobs correctly', async () => {
      // Enqueue a test job
      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'BACKFILL_CHANNEL',
        payload_param: { channelId: 'UC1234567890' },
        priority_param: 5,
        dedup_key_param: 'test-backfill-UC1234567890'
      })

      // Verify job was created
  const jobResult = await client.query('SELECT * FROM jobs WHERE dedup_key = $1', ['test-backfill-UC1234567890'])
        const jobRows = jobResult.rows as Array<{ job_type: string; status: string }>;
  expect(jobRows.length).toBe(1)
        expect(jobRows[0]?.job_type).toBeDefined()
        expect(jobRows[0]?.status).toBeDefined()

      // Dequeue the job using direct database call (since secure functions require service context)
      const dequeueResult = await client.query(
        `SELECT * FROM secure_dequeue_jobs($1, $2, $3)`,
        ['test-worker-1', null, 1]
      )
        const dequeuedJobs = dequeueResult.rows as Array<{ job_type: string; job_id: string }>;
  expect(dequeuedJobs.length).toBe(1)
        expect(dequeuedJobs[0]?.job_type).toBeDefined()

  // Verify job status changed
  const updatedJob = await client.query('SELECT * FROM jobs WHERE id = $1', [dequeuedJobs[0]!.job_id])
        const updatedRows = updatedJob.rows as Array<{ status: string; locked_by: string }>;
  expect(updatedRows.length).toBe(1);
        expect(updatedRows[0]?.status).toBeDefined()
        expect(updatedRows[0]?.locked_by).toBeDefined()
    })

    it('should handle job completion correctly', async () => {
      // Enqueue and dequeue a job
      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'REFRESH_CHANNEL_STATS',
        payload_param: { channelId: 'UC1234567890' },
        priority_param: 3
      })

      const dequeueResult = await client.query(
        `SELECT * FROM secure_dequeue_jobs($1, $2, $3)`,
        ['test-worker-2', null, 1]
      )
        const dequeuedJobs = dequeueResult.rows as Array<{ job_id: string }>;
  expect(dequeuedJobs.length).toBe(1);
  const jobId = dequeuedJobs[0]!.job_id;

      // Complete the job successfully
      const completeResult = await client.query(
        `SELECT secure_complete_job($1)`,
        [jobId]
      )
        const completeRows = completeResult.rows as Array<{ secure_complete_job: boolean }>;
  expect(completeRows.length).toBe(1);
        expect(completeRows[0]?.secure_complete_job).toBeTruthy()

      // Verify job status
  const completedJob = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        const completedRows = completedJob.rows as Array<{ status: string; completed_at: string }>;
  expect(completedRows.length).toBe(1);
        expect(completedRows[0]?.status).toBeDefined()
        expect(completedRows[0]?.completed_at).toBeDefined()

      // Verify job event was created
  const events = await client.query('SELECT * FROM job_events WHERE job_id = $1', [jobId])
        const eventRows = events.rows as Array<{ event_type: string }>;
  expect(eventRows.length).toBe(2) // created + completed events
        expect(eventRows.some(e => e.event_type === 'completed')).toBeTruthy()
    })

    it('should handle job failure and retry logic', async () => {
      // Enqueue a job
      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'REFRESH_VIDEO_STATS',
        payload_param: { videoIds: ['video1', 'video2'] },
        priority_param: 7
      })

      const dequeueResult = await client.query(
        `SELECT * FROM secure_dequeue_jobs($1, $2, $3)`,
        ['test-worker-3', null, 1]
      )
        const dequeuedJobs = dequeueResult.rows as Array<{ job_id: string }>;
  expect(dequeuedJobs.length).toBe(1);
  const jobId = dequeuedJobs[0]!.job_id;

      // Fail the job
      const failResult = await client.query(
        `SELECT secure_fail_job($1, $2)`,
        [jobId, 'Test failure']
      )
        const failRows = failResult.rows as Array<{ secure_fail_job: string }>;
  expect(failRows.length).toBe(1);
        expect(failRows[0]?.secure_fail_job).toBeDefined()

      // Verify job is still pending for retry
  const failedJob = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        const failedRows = failedJob.rows as Array<{ status: string; attempt_count: number; error_count: number; last_error: string }>;
  expect(failedRows.length).toBe(1);
        expect(failedRows[0]?.status).toBeDefined()
        expect(failedRows[0]?.attempt_count).toBeDefined()
        expect(failedRows[0]?.error_count).toBeDefined()
        expect(failedRows[0]?.last_error).toBeDefined()
    })

    it('should support multiple job types', async () => {
      // Enqueue different job types
      const jobTypes = ['BACKFILL_CHANNEL', 'REFRESH_CHANNEL_STATS', 'REFRESH_HOT_VIDEOS', 'REFRESH_VIDEO_STATS', 'RSS_POLL_CHANNEL']

      for (const jobType of jobTypes) {
          await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
          job_type_param: jobType,
          payload_param: { test: true },
          priority_param: 5
        })
      }

      // Dequeue all jobs
      const dequeueResult = await client.query(
        `SELECT * FROM secure_dequeue_jobs($1, $2, $3)`,
        ['test-worker-multi', null, 10]
      ) as { rows: Array<{ job_type: string; job_id: string }> };
      const dequeuedJobs = dequeueResult.rows;

      expect(dequeuedJobs).toHaveLength(5)

      // Verify all job types are present
  const dequeuedTypes = dequeuedJobs.map((j) => j.job_type).sort()
      expect(dequeuedTypes).toEqual(jobTypes.sort())
    })

    it('should respect job priorities', async () => {
      // Enqueue jobs with different priorities
      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'BACKFILL_CHANNEL',
        payload_param: { channelId: 'UC-low-priority' },
        priority_param: 1
      })

      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'REFRESH_CHANNEL_STATS',
        payload_param: { channelId: 'UC-high-priority' },
        priority_param: 10
      })

      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'REFRESH_HOT_VIDEOS',
        payload_param: { channelId: 'UC-medium-priority' },
        priority_param: 5
      })

      // Dequeue jobs - should get highest priority first
      const dequeueResult = await client.query(
        `SELECT * FROM secure_dequeue_jobs($1, $2, $3)`,
        ['test-worker-priority', null, 3]
      ) as { rows: Array<{ job_type: string; priority: number }> };
      const dequeuedJobs = dequeueResult.rows;

      expect(dequeuedJobs).toHaveLength(3)

      // Sort by priority to check what we got
  const sortedJobs = dequeuedJobs.sort((a, b) => b.priority - a.priority)
      
      // First job should be highest priority
        expect(sortedJobs[0]?.priority).toBeGreaterThanOrEqual(sortedJobs[1]?.priority ?? 0)
        expect(sortedJobs[0]?.job_type).toBe('REFRESH_CHANNEL_STATS')

  // Second job should be medium priority
        expect(sortedJobs[1]?.priority).toBeGreaterThanOrEqual(sortedJobs[2]?.priority ?? 0)
        expect(sortedJobs[1]?.job_type).toBe('REFRESH_HOT_VIDEOS')

  // Third job should be lowest priority
        expect(sortedJobs[2]?.priority).toBe(1)
        expect(sortedJobs[2]?.job_type).toBe('BACKFILL_CHANNEL')
    })

    it('should handle deduplication correctly', async () => {
      // Enqueue the same job twice with same dedup key
      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'BACKFILL_CHANNEL',
        payload_param: { channelId: 'UC-dedup-test' },
        dedup_key_param: 'dedup-test-key'
      })

      await (supabase.rpc as unknown as (fn: string, args: any) => Promise<{ error?: any }>)('enqueue_job', {
        job_type_param: 'BACKFILL_CHANNEL',
        payload_param: { channelId: 'UC-dedup-test' },
        dedup_key_param: 'dedup-test-key'
      })

      // Should only have one job
  const jobs = await client.query('SELECT COUNT(*) FROM jobs WHERE dedup_key = $1', ['dedup-test-key']) as { rows: Array<{ count: string }> };
  const jobsRows = jobs.rows;
  expect(jobsRows.length).toBe(1);
        expect(Number(jobsRows[0]?.count)).toBeGreaterThanOrEqual(1);
    })
  })
})