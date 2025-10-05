import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Jobs Table Validation', () => {
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

  afterAll(async () => {
    await client.query("DELETE FROM jobs WHERE payload::text LIKE '%test_job%'")
    await client.end()
  })

  it('should insert and retrieve job queue data', async () => {
    const insertQuery = `
      INSERT INTO jobs (
        job_type, priority, status, payload, dedup_key
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, job_type, priority, status, payload
    `
    const payload = {
      type: 'backfill',
      test_marker: 'test_job'
    }
    const result = await client.query(insertQuery, [
      'BACKFILL_CHANNEL',
      5,
      'pending',
      JSON.stringify(payload),
      'test_backfill_job'
    ])
    expect(result.rows).toHaveLength(1)
    const insertedJob = result.rows[0]
    expect(insertedJob.job_type).toBe('BACKFILL_CHANNEL')
    expect(insertedJob.priority).toBe(5)
    expect(insertedJob.status).toBe('pending')
    expect(insertedJob.payload).toEqual(payload)
  })
})