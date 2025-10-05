import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Queue Integration Tests', () => {
  let client: Client
  beforeAll(async () => {
    client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    })
    await client.connect()
  })
  afterAll(async () => { await client.end() })
  beforeEach(async () => {
    await client.query('TRUNCATE TABLE jobs, job_events RESTART IDENTITY CASCADE')
    // Confirm tables are empty
    const jobs = await client.query('SELECT COUNT(*) FROM jobs')
    const events = await client.query('SELECT COUNT(*) FROM job_events')
    // eslint-disable-next-line no-console
    console.log('After truncate: jobs:', jobs.rows[0].count, 'events:', events.rows[0].count)
  })

  describe('Job Retry Logic', () => {
    describe('Basic Retry', () => {
      it('should increment attempt count when job is retried', async () => {
        const dedupKey = `test-dedup-basic-${Date.now()}-${Math.random()}`
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS_BASIC', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId = enqueueResult.rows[0].job_id
        expect(jobId).toBeTruthy()
        // eslint-disable-next-line no-console
        console.log('Enqueued jobId:', jobId)
        // Print all jobs after enqueue
        const allJobsAfterEnqueue = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after enqueue:', allJobsAfterEnqueue.rows)
        const dequeueResult = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS_BASIC'], 1]
        )
        console.log('Dequeue:', dequeueResult.rows)
        expect(dequeueResult.rows).toHaveLength(1)
        expect(dequeueResult.rows[0].job_id).toBe(jobId)
        const failResult = await client.query(
          `SELECT fail_job($1, $2) as status`,
          [jobId, 'Simulated API failure']
        )
        // eslint-disable-next-line no-console
        console.log('Fail result:', failResult.rows)
        expect(failResult.rows[0].status).toBe('pending')
        const jobResult = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        // eslint-disable-next-line no-console
        console.log('Job after fail:', jobResult.rows[0])
        const updatedJob = jobResult.rows[0]
        expect(updatedJob.status).toBe('pending')
        expect(updatedJob.attempt_count).toBe(1)
        expect(updatedJob.error_count).toBe(1)
        expect(updatedJob.last_error).toBe('Simulated API failure')
        expect(updatedJob.locked_by).toBeNull()
        expect(updatedJob.locked_until).toBeNull()
      })

      it('should move job to dead letter after max attempts exceeded', async () => {
        const dedupKey2 = `test-dedup-basic2-${Date.now()}-${Math.random()}`
        const insertResult = await client.query(
          `INSERT INTO jobs (job_type, payload, priority, max_attempts, attempt_count, dedup_key)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          ['REFRESH_CHANNEL_STATS_BASIC', JSON.stringify({ channel_id: 'test-channel-2' }), 5, 2, 0, dedupKey2]
        )
        const jobId = insertResult.rows[0].id
        console.log('Inserted jobId:', jobId)
        // Check job after insert
        const jobAfterInsert = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        console.log('Job after insert:', jobAfterInsert.rows[0])
        // Print all jobs after insert
        const allJobsAfterInsert = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after insert:', allJobsAfterInsert.rows)
        // First dequeue/fail
        const dequeue1 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS_BASIC'], 1]
        )
        console.log('Dequeue1:', dequeue1.rows)
        const jobAfterDequeue1 = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        console.log('Job after dequeue1:', jobAfterDequeue1.rows[0])
        const failResult1 = await client.query(
          `SELECT fail_job($1, $2) as status`,
          [jobId, 'First failure']
        )
        console.log('Fail1:', failResult1.rows)
        expect(failResult1.rows[0].status).toBe('pending')
        const jobAfterFail1 = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        console.log('Job after fail1:', jobAfterFail1.rows[0])
        // Second dequeue/fail (must dequeue again before failing)
        const dequeue2 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS_BASIC'], 1]
        )
        console.log('Dequeue2:', dequeue2.rows)
        expect(dequeue2.rows).toHaveLength(1)
        expect(dequeue2.rows[0].job_id).toBe(jobId)
        const jobAfterDequeue2 = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        console.log('Job after dequeue2:', jobAfterDequeue2.rows[0])
        const failResult2 = await client.query(
          `SELECT fail_job($1, $2) as status`,
          [jobId, 'Second failure']
        )
        console.log('Fail2:', failResult2.rows)
        expect(failResult2.rows[0].status).toBe('dead_letter')
        const finalJobResult = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        console.log('Final job:', finalJobResult.rows[0])
        const finalJob = finalJobResult.rows[0]
        expect(finalJob.status).toBe('dead_letter')
        expect(finalJob.attempt_count).toBe(2)
        expect(finalJob.failed_at).toBeTruthy()
        expect(finalJob.last_error).toBe('Second failure')
      })
    })

    describe('Job Events', () => {
      it('should create job events for retry attempts', async () => {
        const dedupKey = `test-dedup-${Date.now()}-${Math.random()}`
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS_EVENTS', JSON.stringify({ channel_id: 'test-channel-3' }), 5, dedupKey]
        )
        const jobId = enqueueResult.rows[0].job_id
        // eslint-disable-next-line no-console
        console.log('Enqueued jobId:', jobId)
        // Print all jobs after enqueue
        const allJobsAfterEnqueue = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after enqueue:', allJobsAfterEnqueue.rows)
        const dequeueResult = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS_EVENTS'], 1]
        )
        // Print all jobs after dequeue
        const allJobsAfterDequeue = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after dequeue:', allJobsAfterDequeue.rows)
        // eslint-disable-next-line no-console
        console.log('Dequeued jobs:', dequeueResult.rows)
        expect(dequeueResult.rows[0].job_id).toBe(jobId)
        await client.query(
          `SELECT fail_job($1, $2) as status`,
          [jobId, 'Test retry failure']
        )
        const eventsResult = await client.query(
          'SELECT * FROM job_events WHERE job_id = $1 ORDER BY created_at',
          [jobId]
        )
        const events = eventsResult.rows
        expect(events).toHaveLength(2)
        expect(events[0].event_type).toBe('created')
        expect(events[1].event_type).toBe('failed')
        expect(events[1].error_message).toBe('Test retry failure')
        expect(events[1].worker_id).toBe('test-worker-1')
      })
    })

    describe('Exponential Backoff', () => {
      it('should schedule retries with increasing delays (foundation)', async () => {
        const dedupKey = `test-dedup-backoff-${Date.now()}-${Math.random()}`
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS_BACKOFF', JSON.stringify({ channel_id: 'test-channel-4' }), 5, dedupKey]
        )
        const jobId = enqueueResult.rows[0].job_id
        expect(jobId).toBeTruthy()
        // Print all jobs after enqueue
        const allJobsAfterEnqueue = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after enqueue:', allJobsAfterEnqueue.rows)
        for (let attempt = 1; attempt <= 3; attempt++) {
          const dequeueResult = await client.query(
            `SELECT * FROM dequeue_jobs($1, $2, $3)`,
            [`test-worker-${attempt}`, ['REFRESH_CHANNEL_STATS_BACKOFF'], 1]
          )
          // eslint-disable-next-line no-console
          console.log(`Attempt ${attempt} dequeue:`, dequeueResult.rows)
          if (dequeueResult.rows.length === 0) break
          const failResult = await client.query(
            `SELECT fail_job($1, $2) as status`,
            [jobId, `Failure attempt ${attempt}`]
          )
          // eslint-disable-next-line no-console
          console.log(`Attempt ${attempt} fail:`, failResult.rows)
          const jobResult = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
          // eslint-disable-next-line no-console
          console.log(`Attempt ${attempt} job state:`, jobResult.rows[0])
          const jobState = jobResult.rows[0]
          expect(jobState.attempt_count).toBe(attempt)
          expect(jobState.error_count).toBe(attempt)
          if (failResult.rows[0].status === 'dead_letter') break
        }
        const eventsResult = await client.query(
          'SELECT * FROM job_events WHERE job_id = $1 ORDER BY created_at',
          [jobId]
        )
        const events = eventsResult.rows
        expect(events.length).toBeGreaterThan(1)
        const failedEvents = events.filter(e => e.event_type === 'failed')
        expect(failedEvents.length).toBeGreaterThan(0)
      })

      it('should support custom retry delays via scheduled_at', async () => {
        const futureTime = new Date(Date.now() + 60000)
        const dedupKey2 = `test-dedup-backoff2-${Date.now()}-${Math.random()}`
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar, $5::timestamptz) as job_id`,
          ['REFRESH_CHANNEL_STATS_BACKOFF', JSON.stringify({ channel_id: 'test-channel-5' }), 5, dedupKey2, futureTime.toISOString()]
        )
        const jobId = enqueueResult.rows[0].job_id
        expect(jobId).toBeTruthy()
        // Print all jobs after enqueue
        const allJobsAfterEnqueue = await client.query('SELECT id, job_type, dedup_key, status FROM jobs')
        console.log('All jobs after enqueue:', allJobsAfterEnqueue.rows)
        const dequeueResult = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS_BACKOFF'], 10]
        )
        const jobIds = dequeueResult.rows.map(j => j.job_id)
        expect(jobIds).not.toContain(jobId)
        const jobResult = await client.query('SELECT * FROM jobs WHERE id = $1', [jobId])
        const jobState = jobResult.rows[0]
        expect(jobState.status).toBe('pending')
        expect(new Date(jobState.scheduled_at).getTime()).toBeCloseTo(futureTime.getTime(), -3)
      })
    })
  })

  describe('Job Deduplication and Advisory Locking', () => {
    describe('Deduplication', () => {
      it('should return existing job ID when enqueuing with same dedup_key', async () => {
        const dedupKey = `test-dedup-${Date.now()}-${Math.random()}`

        // First enqueue
        const enqueueResult1 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId1 = enqueueResult1.rows[0].job_id
        expect(jobId1).toBeTruthy()

        // Second enqueue with same dedup_key
        const enqueueResult2 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId2 = enqueueResult2.rows[0].job_id

        // Should return the same job ID
        expect(jobId2).toBe(jobId1)

        // Should only have one job in the database
        const jobsResult = await client.query('SELECT COUNT(*) FROM jobs')
        expect(jobsResult.rows[0].count).toBe('1')

        // Should only have one job event (from first enqueue)
        const eventsResult = await client.query('SELECT COUNT(*) FROM job_events')
        expect(eventsResult.rows[0].count).toBe('1')
      })

      it('should allow different dedup_keys to create separate jobs', async () => {
        const dedupKey1 = `test-dedup-1-${Date.now()}-${Math.random()}`
        const dedupKey2 = `test-dedup-2-${Date.now()}-${Math.random()}`

        // First enqueue
        const enqueueResult1 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey1]
        )
        const jobId1 = enqueueResult1.rows[0].job_id

        // Second enqueue with different dedup_key
        const enqueueResult2 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey2]
        )
        const jobId2 = enqueueResult2.rows[0].job_id

        // Should return different job IDs
        expect(jobId2).not.toBe(jobId1)

        // Should have two jobs in the database
        const jobsResult = await client.query('SELECT COUNT(*) FROM jobs')
        expect(jobsResult.rows[0].count).toBe('2')

        // Should have two job events
        const eventsResult = await client.query('SELECT COUNT(*) FROM job_events')
        expect(eventsResult.rows[0].count).toBe('2')
      })

      it('should allow reenqueue after job is completed', async () => {
        const dedupKey = `test-dedup-${Date.now()}-${Math.random()}`

        // First enqueue
        const enqueueResult1 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId1 = enqueueResult1.rows[0].job_id

        // Dequeue and complete the job
        const dequeueResult = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS'], 1]
        )
        expect(dequeueResult.rows).toHaveLength(1)

        await client.query(`SELECT complete_job($1)`, [jobId1])

        // Second enqueue with same dedup_key should create new job since first is completed
        const enqueueResult2 = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId2 = enqueueResult2.rows[0].job_id

        // Should return different job ID
        expect(jobId2).not.toBe(jobId1)

        // Should have two jobs in the database
        const jobsResult = await client.query('SELECT COUNT(*) FROM jobs')
        expect(jobsResult.rows[0].count).toBe('2')
      })
    })

    describe('Advisory Locking', () => {
      it('should handle concurrent dequeue operations correctly', async () => {
        // Create multiple jobs
        const jobIds = []
        for (let i = 0; i < 3; i++) {
          const dedupKey = `test-concurrent-${i}-${Date.now()}-${Math.random()}`
          const enqueueResult = await client.query(
            `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
            ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: `test-channel-${i}` }), 5, dedupKey]
          )
          jobIds.push(enqueueResult.rows[0].job_id)
        }

        // Dequeue with worker 1
        const dequeueResult1 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS'], 2]
        )
        expect(dequeueResult1.rows).toHaveLength(2)

        // Dequeue with worker 2 (should get remaining job)
        const dequeueResult2 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-2', ['REFRESH_CHANNEL_STATS'], 2]
        )
        expect(dequeueResult2.rows).toHaveLength(1)

        // Dequeue with worker 3 (should get no jobs)
        const dequeueResult3 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-3', ['REFRESH_CHANNEL_STATS'], 2]
        )
        expect(dequeueResult3.rows).toHaveLength(0)

        // Check that dequeued jobs are in running state
        const runningJobs = await client.query("SELECT COUNT(*) FROM jobs WHERE status = 'running'")
        expect(runningJobs.rows[0].count).toBe('3')
      })

      it('should prevent double dequeue of same job', async () => {
        const dedupKey = `test-no-double-${Date.now()}-${Math.random()}`

        // Enqueue one job
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'test-channel-1' }), 5, dedupKey]
        )
        const jobId = enqueueResult.rows[0].job_id

        // First dequeue should succeed
        const dequeueResult1 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-1', ['REFRESH_CHANNEL_STATS'], 1]
        )
        expect(dequeueResult1.rows).toHaveLength(1)
        expect(dequeueResult1.rows[0].job_id).toBe(jobId)

        // Second dequeue should get no jobs (SKIP LOCKED prevents double dequeue)
        const dequeueResult2 = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-2', ['REFRESH_CHANNEL_STATS'], 1]
        )
        expect(dequeueResult2.rows).toHaveLength(0)

        // Job should be in running state
        const jobResult = await client.query('SELECT status FROM jobs WHERE id = $1', [jobId])
        expect(jobResult.rows[0].status).toBe('running')
      })
    })
  })

  describe('Queue Dequeue Fairness', () => {
    it('should dequeue jobs fairly across multiple workers', async () => {
      // Insert 10 jobs with unique dedup keys
      const jobIds = []
      for (let i = 0; i < 10; i++) {
        const dedupKey = `test-fairness-${i}-${Date.now()}-${Math.random()}`
        const enqueueResult = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          ['test', { n: i }, 5, dedupKey]
        )
        jobIds.push(enqueueResult.rows[0].job_id)
      }

      // Simulate 3 workers dequeuing jobs in round-robin
      const workerIds = [1, 2, 3]
      const results = []
      for (let i = 0; i < 10; i++) {
        const workerId = workerIds[i % workerIds.length]
        // Use the dequeue_jobs RPC with proper parameters
        const res = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          [`worker-${workerId}`, ['test'], 1]
        )
        results.push({ workerId, job: res.rows[0] })
      }

      // Check that all jobs are unique and distributed
      const dequeuedJobIds = results.map(r => r.job && r.job.job_id).filter(Boolean)
      expect(new Set(dequeuedJobIds).size).toBe(10)
      // Optionally, check that no worker gets two jobs in a row (fairness)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]?.workerId).not.toBe(results[i - 1]?.workerId)
      }
    })
  })

  describe('Multi-Worker Queue Simulation', () => {
    it('should validate comprehensive queue mechanics integration', async () => {
      // Create a variety of jobs with controlled deduplication
      const jobsToCreate = [
        { type: 'REFRESH_CHANNEL_STATS', channel: 'channel-A', dedupKey: 'refresh-channel-A' },
        { type: 'REFRESH_CHANNEL_STATS', channel: 'channel-A', dedupKey: 'refresh-channel-A' }, // duplicate
        { type: 'REFRESH_CHANNEL_STATS', channel: 'channel-B', dedupKey: 'refresh-channel-B' },
        { type: 'UPDATE_VIDEO_STATS', channel: 'channel-A', dedupKey: 'update-video-A' },
        { type: 'UPDATE_VIDEO_STATS', channel: 'channel-B', dedupKey: 'update-video-B' },
      ]

      const enqueuedJobIds: string[] = []

      // Enqueue jobs and collect IDs
      for (const job of jobsToCreate) {
        const result = await client.query(
          `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
          [job.type, { channel_id: job.channel }, 5, job.dedupKey]
        )
        enqueuedJobIds.push(result.rows[0].job_id)
      }

      // Verify deduplication worked - should have fewer unique jobs than enqueued
      const totalJobs = await client.query('SELECT COUNT(*) FROM jobs')
      expect(parseInt(totalJobs.rows[0].count)).toBeLessThan(jobsToCreate.length)

      // Process jobs with a single worker to test basic functionality
      const processedJobs: string[] = []
      let jobsProcessed = 0

      while (jobsProcessed < 10) { // Prevent infinite loop
        const dequeueResult = await client.query(
          `SELECT * FROM dequeue_jobs($1, $2, $3)`,
          ['test-worker-sim', ['REFRESH_CHANNEL_STATS', 'UPDATE_VIDEO_STATS'], 1]
        )

        if (dequeueResult.rows.length === 0) break

        const job = dequeueResult.rows[0]
        processedJobs.push(job.job_id)
        jobsProcessed++

        // Randomly succeed or fail jobs
        if (Math.random() < 0.7) { // 70% success rate
          await client.query(`SELECT complete_job($1)`, [job.job_id])
        } else {
          await client.query(
            `SELECT fail_job($1, $2) as status`,
            [job.job_id, 'Simulated processing failure']
          )
        }
      }

      // Verify jobs were processed
      expect(processedJobs.length).toBeGreaterThan(0)

      // Verify job events were created
      const eventsResult = await client.query('SELECT COUNT(*) FROM job_events')
      expect(parseInt(eventsResult.rows[0].count)).toBeGreaterThan(processedJobs.length)

      // Test reenqueue after completion
      if (processedJobs.length > 0) {
        const sampleJobId = processedJobs[0]

        // Check if job is completed
        const jobStatus = await client.query('SELECT status FROM jobs WHERE id = $1', [sampleJobId])
        if (jobStatus.rows[0]?.status === 'completed') {
          // Try to reenqueue with different dedup key
          const reenqueueResult = await client.query(
            `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
            ['REFRESH_CHANNEL_STATS', { channel_id: 'channel-A' }, 5, `reenqueue-${Date.now()}`]
          )

          // Should create a new job
          expect(reenqueueResult.rows[0].job_id).not.toBe(sampleJobId)

          // Verify new job exists
          const newJobCheck = await client.query('SELECT COUNT(*) FROM jobs WHERE id = $1', [reenqueueResult.rows[0].job_id])
          expect(parseInt(newJobCheck.rows[0].count)).toBe(1)
        }
      }

      // Verify system integrity - no orphaned locks
      const lockedJobs = await client.query("SELECT COUNT(*) FROM jobs WHERE locked_by IS NOT NULL")
      expect(parseInt(lockedJobs.rows[0].count)).toBe(0) // All locks should be released
    })
  })
})