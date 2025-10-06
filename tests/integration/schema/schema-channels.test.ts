import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import type { Database } from '../../../types/supabase'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Channels Table Validation', () => {
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
    await client.query('DELETE FROM channels WHERE youtube_channel_id LIKE \'test_%\'')
    await client.end()
  })


  it('should insert and retrieve complete channel data', async () => {
    const uniqueId = `test_UC${Date.now()}_${Math.floor(Math.random()*10000)}`
    const insertQuery = `
      INSERT INTO channels (
        youtube_channel_id, title, description, published_at,
        subscriber_count, video_count, view_count, country, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, youtube_channel_id, title, subscriber_count, status, created_at
    `

    const result = await client.query(insertQuery, [
      uniqueId,
      'Test Channel',
      'A test YouTube channel for schema validation',
      '2020-01-01T00:00:00Z',
      100000,
      250,
      5000000,
      'US',
      'active'
    ])

    expect(result.rows).toHaveLength(1)
    const insertedChannel = result.rows[0] as Database['public']['Tables']['channels']['Row']

    expect(insertedChannel.youtube_channel_id).toBe(uniqueId)
    expect(insertedChannel.title).toBe('Test Channel')
    expect(Number(insertedChannel.subscriber_count)).toBe(100000)
    expect(insertedChannel.status).toBe('active')
    expect(insertedChannel.id).toBeTruthy()
    expect(insertedChannel.created_at).toBeTruthy()
  })

  it('should enforce required field constraints', async () => {
    const uniqueId = `test_UC${Date.now()}_${Math.floor(Math.random()*10000)}`
    const insertWithoutTitle = `
      INSERT INTO channels (youtube_channel_id, published_at)
      VALUES ('${uniqueId}', '2020-01-01T00:00:00Z')
    `
    await expect(client.query(insertWithoutTitle)).rejects.toThrow()
  })

  it('should enforce unique constraints', async () => {
    const uniqueId = `test_UC${Date.now()}_${Math.floor(Math.random()*10000)}`
    // Insert once
    await client.query(
      `INSERT INTO channels (youtube_channel_id, title, published_at)
       VALUES ($1, $2, $3)`,
      [uniqueId, 'Original Channel', '2020-01-01T00:00:00Z']
    )
    // Attempt duplicate
    await expect(
      client.query(
        `INSERT INTO channels (youtube_channel_id, title, published_at)
         VALUES ($1, $2, $3)`,
        [uniqueId, 'Duplicate Channel', '2020-01-01T00:00:00Z']
      )
    ).rejects.toThrow()
  })
})