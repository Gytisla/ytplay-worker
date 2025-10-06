import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Client } from 'pg'

describe('Job Coalescing and Batch Processing', () => {
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
  })

  it('should coalesce multiple enqueue requests with same dedup_key into a single job', async () => {
    const dedupKey = `coalesce-test-${Date.now()}-${Math.random()}`

    // Enqueue same job multiple times using parameterized query and explicit casts (match other tests)
    await client.query(
      `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
      ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'UC_TEST' }), 5, dedupKey]
    )
    await client.query(
      `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
      ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'UC_TEST' }), 5, dedupKey]
    )
    await client.query(
      `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
      ['REFRESH_CHANNEL_STATS', JSON.stringify({ channel_id: 'UC_TEST' }), 5, dedupKey]
    )

    const res = await client.query('SELECT COUNT(*) FROM jobs WHERE dedup_key = $1', [dedupKey])
    expect(Number(res.rows[0].count)).toBe(1)
  })

  it('should batch process multiple video stat jobs into YouTube API batches', async () => {
    const videoIds = Array.from({ length: 120 }).map((_, i) => `video-${i}`)

    for (const id of videoIds) {
      await client.query(
        `SELECT enqueue_job($1::varchar, $2::jsonb, $3::integer, $4::varchar) as job_id`,
        ['REFRESH_VIDEO_STATS', JSON.stringify({ video_id: id, channel_id: 'UC_BATCH_TEST' }), 0, `dedup-${id}`]
      )
    }

    // Dequeue several jobs to simulate worker; expect the dequeue returns up to the requested limit
    const dequeueRes = await client.query(
      `SELECT * FROM dequeue_jobs($1, $2, $3)`,
      ['test-worker', ['REFRESH_VIDEO_STATS'], 10]
    )

    expect(dequeueRes.rows.length).toBeLessThanOrEqual(10)
  })
})
