import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Videos Table Validation', () => {
  let client: Client
  let uniqueVideoId: string

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
  await client.query('DELETE FROM videos WHERE youtube_video_id LIKE \'test_%\'')
  await client.query('DELETE FROM channels WHERE youtube_channel_id LIKE \'test_UCvideoFK_%\'')
  await client.end()
  })

  it('should insert and retrieve video data with FK', async () => {
    // Create a unique channel for this test
    const uniqueChannelId = `test_UCvideoFK_${Date.now()}_${Math.floor(Math.random()*10000)}`
    const res = await client.query(
      `INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ('${uniqueChannelId}', 'Video FK Channel', '2020-01-01T00:00:00Z') RETURNING id`
    )
    const channelId = res.rows[0].id
    uniqueVideoId = `test_video${Date.now()}_${Math.floor(Math.random()*10000)}`
    const insertQuery = `
      INSERT INTO videos (
        youtube_video_id, channel_id, title, published_at,
        view_count, like_count, comment_count, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, youtube_video_id, channel_id, title, view_count
    `
    const result = await client.query(insertQuery, [
      uniqueVideoId,
      channelId,
      'Test Video Title',
      '2023-01-01T12:00:00Z',
      50000,
      1500,
      200,
      'active'
    ])
    expect(result.rows).toHaveLength(1)
    const insertedVideo = result.rows[0]
    expect(insertedVideo.youtube_video_id).toBe(uniqueVideoId)
    expect(insertedVideo.channel_id).toBe(channelId)
    expect(insertedVideo.title).toBe('Test Video Title')
    expect(insertedVideo.view_count).toBe('50000')
  // videoId assignment removed (unused)
  })

  it('should enforce foreign key constraints', async () => {
    const invalidChannelQuery = `
      INSERT INTO videos (youtube_video_id, channel_id, title, published_at)
      VALUES ('test_invalid_fk', 'invalid-uuid-that-does-not-exist', 'Test', '2023-01-01T00:00:00Z')
    `
    await expect(client.query(invalidChannelQuery)).rejects.toThrow()
  })
})