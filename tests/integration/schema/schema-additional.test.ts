import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Additional Tables Validation', () => {
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
    await client.query('DELETE FROM api_budget WHERE quota_type = \'test_quota\'')
    await client.end()
  })

  it('should insert and validate API budget data', async () => {
    const insertQuery = `
      INSERT INTO api_budget (date, quota_type, daily_limit, current_usage)
      VALUES ($1, $2, $3, $4)
      RETURNING date, quota_type, daily_limit, current_usage
    `
    const result = await client.query(insertQuery, [
      '2023-01-01',
      'test_quota',
      10000,
      1500
    ])
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].quota_type).toBe('test_quota')
    expect(result.rows[0].daily_limit).toBe("10000")
  })
})