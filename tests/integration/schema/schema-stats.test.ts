import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import type { Database } from '../../../types/supabase'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Stats Tables Validation', () => {
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
  await client.query('DELETE FROM channel_stats WHERE channel_id IN (SELECT id FROM channels WHERE youtube_channel_id LIKE \'test_UCstatsFK_%\')')
  await client.query('DELETE FROM channels WHERE youtube_channel_id LIKE \'test_UCstatsFK_%\'')
  await client.end()
  })

  it('should insert and validate channel stats', async () => {
    // Create a unique channel for this test
    const uniqueChannelId = `test_UCstatsFK_${Date.now()}_${Math.floor(Math.random()*10000)}`
    const res = await client.query(
      `INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ('${uniqueChannelId}', 'Stats FK Channel', '2020-01-01T00:00:00Z') RETURNING id`
    )
  const channelRows = res.rows as Array<{ id: string }>;
  const channelId = channelRows[0]!.id
    const insertQuery = `
      INSERT INTO channel_stats (
        channel_id, date, view_count, subscriber_count, video_count
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, channel_id, date, view_count, subscriber_count
    `
    const result = await client.query(insertQuery, [
      channelId,
      '2023-01-01',
      5001000,
      100500,
      251
    ])
  const statsRows = result.rows as Array<Database['public']['Tables']['channel_stats']['Row']>;
  expect(statsRows).toHaveLength(1)
  const insertedStats = statsRows[0]!
  expect(insertedStats.channel_id).toBe(channelId)
    expect(Number(insertedStats.view_count)).toBe(5001000)
    expect(Number(insertedStats.subscriber_count)).toBe(100500)
  })
})