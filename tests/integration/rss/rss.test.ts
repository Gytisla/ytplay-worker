import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { RSSPollingOperations } from '../../../src/workers/rss'

dotenv.config({ path: '.env.local' })

describe('RSS Feed State Management Integration Tests', () => {
  let client: Client
  let supabase: any
  let rssOps: RSSPollingOperations

  beforeAll(async () => {
    client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    })
    await client.connect()

    // Disable RLS for testing (only for RSS-specific tables)
    await client.query('ALTER TABLE channels DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_feeds DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE jobs DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE job_events DISABLE ROW LEVEL SECURITY')

    // Initialize Supabase client
    const supabaseUrl = process.env['SUPABASE_URL']!
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!
    supabase = createClient(supabaseUrl, supabaseServiceKey)

    rssOps = new RSSPollingOperations(supabase)
  })

  afterAll(async () => {
    // Re-enable RLS that was disabled for testing
    await client.query('ALTER TABLE channels ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_feeds ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE jobs ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE job_events ENABLE ROW LEVEL SECURITY')
    await client.end()
  })

  beforeEach(async () => {
    // Clean up all tables used by RSS tests
    await client.query('TRUNCATE TABLE channels, channel_feeds, jobs, job_events RESTART IDENTITY CASCADE')
    console.log('RSS tables truncated')
  })

  describe('Channel Feed Configuration', () => {
    describe('upsertChannelFeed', () => {
      it('should create new channel feed configuration', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        await rssOps.upsertChannelFeed(channelId, feedUrl)

        const result = await client.query(`
          SELECT cf.*, c.youtube_channel_id 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows).toHaveLength(1)
        expect(result.rows[0]).toMatchObject({
          youtube_channel_id: channelId,
          feed_url: feedUrl,
          feed_type: 'youtube_rss',
          poll_interval_minutes: 10,
          is_active: true,
          consecutive_failures: 0,
        })
        expect(result.rows[0].created_at).toBeTruthy()
        expect(result.rows[0].updated_at).toBeTruthy()
      })

      it('should update existing channel feed configuration', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create initial feed
        await rssOps.upsertChannelFeed(channelId, feedUrl, {
          pollIntervalMinutes: 15,
          feedType: 'custom_rss'
        })

        // Update feed
        await rssOps.upsertChannelFeed(channelId, feedUrl, {
          pollIntervalMinutes: 20,
          feedType: 'youtube_rss'
        })

        const result = await client.query(`
          SELECT cf.*, c.youtube_channel_id 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows).toHaveLength(1)
        expect(result.rows[0]).toMatchObject({
          youtube_channel_id: channelId,
          feed_url: feedUrl,
          feed_type: 'youtube_rss',
          poll_interval_minutes: 20,
          is_active: true,
        })
      })

      it('should handle duplicate channel_id with different feed_url', async () => {
        const channelId = 'UC1234567890'
        const feedUrl1 = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'
        const feedUrl2 = 'https://example.com/rss.xml'

        await rssOps.upsertChannelFeed(channelId, feedUrl1)
        await rssOps.upsertChannelFeed(channelId, feedUrl2)

        const result = await client.query(`
          SELECT cf.*, c.youtube_channel_id 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1 ORDER BY cf.feed_url
        `, [channelId])

        expect(result.rows).toHaveLength(2)
        expect(result.rows.map(r => r.feed_url).sort()).toEqual([feedUrl1, feedUrl2].sort())
      })
    })

    describe('getChannelFeed', () => {
      it('should return null for non-existent channel feed', async () => {
        const result = await rssOps.getChannelFeed('UC-nonexistent')
        expect(result).toBeNull()
      })

      it('should retrieve complete channel feed state', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'
        const etag = '"abc123"'
        const lastModified = 'Wed, 21 Oct 2025 07:28:00 GMT'
        const lastPolledAt = new Date('2025-10-06T10:00:00Z')
        const lastSuccessfulPollAt = new Date('2025-10-06T09:30:00Z')
        const errorMessage = 'Previous error occurred'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Insert test data
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, etag, last_modified, last_polled_at,
            last_successful_poll_at, poll_interval_minutes, consecutive_failures,
            is_active, last_error_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          channelUuid, feedUrl, etag, lastModified, lastPolledAt.toISOString(),
          lastSuccessfulPollAt.toISOString(), 15, 2, true, errorMessage
        ])

        const result = await rssOps.getChannelFeed(channelId)

        expect(result).toEqual({
          channelId,
          feedUrl,
          lastETag: etag,
          lastModified: '2025-10-21T07:28:00+00:00',
          lastPolledAt,
          lastVideoPublishedAt: lastSuccessfulPollAt,
          pollIntervalMinutes: 15,
          consecutiveErrors: 2,
          status: 'active',
          errorMessage,
        })
      })

      it('should handle feed with minimal data', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active)
          VALUES ($1, $2, $3)
        `, [channelUuid, feedUrl, false])

        const result = await rssOps.getChannelFeed(channelId)

        expect(result).toEqual({
          channelId,
          feedUrl,
          pollIntervalMinutes: 10,
          consecutiveErrors: 0,
          status: 'paused',
        })
      })
    })
  })

  describe('Feed State Updates', () => {
    describe('updateFeedState', () => {
      it('should update feed state after successful polling', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create initial feed
        await rssOps.upsertChannelFeed(channelId, feedUrl)

        const newState = {
          channelId,
          feedUrl,
          lastETag: '"new-etag-123"',
          lastModified: 'Wed, 21 Oct 2025 08:00:00 GMT',
          lastPolledAt: new Date('2025-10-06T11:00:00Z'),
          lastVideoPublishedAt: new Date('2025-10-06T10:45:00Z'),
          pollIntervalMinutes: 12,
          consecutiveErrors: 0,
          status: 'active' as const,
        }

        await rssOps.updateFeedState(newState)

        const result = await client.query(`
          SELECT cf.*, c.youtube_channel_id,
                 to_char(cf.last_modified AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as last_modified,
                 to_char(cf.last_polled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as last_polled_at,
                 to_char(cf.last_successful_poll_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as last_successful_poll_at
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows[0]).toMatchObject({
          youtube_channel_id: channelId,
          etag: '"new-etag-123"',
          last_modified: '2025-10-21T08:00:00.000Z',
          last_polled_at: '2025-10-06T11:00:00.000Z',
          last_successful_poll_at: '2025-10-06T10:45:00.000Z',
          poll_interval_minutes: 12,
          consecutive_failures: 0,
          is_active: true,
        })
        expect(result.rows[0].last_error_message).toBeNull()
      })

      it('should clear error message on successful update', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Create feed with error
        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, last_error_message, consecutive_failures, is_active)
          VALUES ($1, $2, $3, $4, $5)
        `, [channelUuid, feedUrl, 'Previous error', 3, true])

        const newState = {
          channelId,
          feedUrl,
          pollIntervalMinutes: 10,
          consecutiveErrors: 0,
          status: 'active' as const,
        }

        await rssOps.updateFeedState(newState)

        const result = await client.query(`
          SELECT cf.last_error_message, cf.consecutive_failures 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows[0].last_error_message).toBeNull()
        expect(result.rows[0].consecutive_failures).toBe(0)
      })
    })

    describe('updateFeedStateAfterError', () => {
      it('should increment consecutive failures and record error', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create initial feed
        await rssOps.upsertChannelFeed(channelId, feedUrl)

        const error = new Error('Network timeout')

        await rssOps.updateFeedStateAfterError(channelId, error)

        const result = await client.query(`
          SELECT cf.*, c.youtube_channel_id 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows[0]).toMatchObject({
          youtube_channel_id: channelId,
          consecutive_failures: 1,
          last_error_message: 'Network timeout',
          is_active: true,
        })
        expect(result.rows[0].last_error_at).toBeTruthy()
      })

      it('should deactivate feed after 5 consecutive failures', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Create feed with 4 failures
        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, consecutive_failures, is_active)
          VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, 4, true])

        const error = new Error('5th failure - should deactivate')

        await rssOps.updateFeedStateAfterError(channelId, error)

        const result = await client.query(`
          SELECT cf.consecutive_failures, cf.is_active 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows[0].consecutive_failures).toBe(5)
        expect(result.rows[0].is_active).toBe(false)
      })

      it('should handle non-existent channel gracefully', async () => {
        const error = new Error('Test error')

        // Should not throw for non-existent channels
        await expect(
          rssOps.updateFeedStateAfterError('UC-nonexistent', error)
        ).resolves.toBeUndefined()
      })
    })
  })

  describe('Job Enqueueing', () => {
    describe('enqueueVideoJobs', () => {
      it('should enqueue jobs for new videos', async () => {
        const channelId = 'UC1234567890'
        const videoIds = ['video123', 'video456', 'video789']

        await rssOps.enqueueVideoJobs(channelId, videoIds)

        const result = await client.query('SELECT * FROM jobs ORDER BY created_at')

        expect(result.rows).toHaveLength(3)
        result.rows.forEach((job, index) => {
          expect(job).toMatchObject({
            job_type: 'REFRESH_VIDEO_STATS',
            priority: 7,
            status: 'pending',
          })
          expect(job.payload).toEqual({
            channel_id: channelId,
            video_ids: [videoIds[index]],
          })
          expect(job.dedup_key).toBe(`refresh_video_stats_${videoIds[index]}`)
        })
      })

      it('should handle empty video list', async () => {
        await rssOps.enqueueVideoJobs('UC1234567890', [])

        const result = await client.query('SELECT COUNT(*) FROM jobs')
        expect(result.rows[0].count).toBe('0')
      })

      it('should use deduplication to prevent duplicate jobs', async () => {
        const channelId = 'UC1234567890'
        const videoId = 'video123'

        // Enqueue same video twice
        await rssOps.enqueueVideoJobs(channelId, [videoId])
        await rssOps.enqueueVideoJobs(channelId, [videoId])

        const result = await client.query('SELECT * FROM jobs WHERE dedup_key = $1', [`refresh_video_stats_${videoId}`])
        expect(result.rows).toHaveLength(1)
      })
    })
  })

  describe('Polling Queries', () => {
    describe('getChannelsDueForPolling', () => {
      it('should return channels that have never been polled', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active, last_polled_at)
          VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, true, null])

        const result = await rssOps.getChannelsDueForPolling()

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          channelId,
          feedUrl,
        })
      })

      it('should return channels polled more than 10 minutes ago', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'
        const oldPollTime = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active, last_polled_at)
          VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, true, oldPollTime.toISOString()])

        const result = await rssOps.getChannelsDueForPolling()

        expect(result).toHaveLength(1)
        expect(result[0]).toEqual({
          channelId,
          feedUrl,
        })
      })

      it('should exclude inactive channels', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active, last_polled_at)
          VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, false, null])

        const result = await rssOps.getChannelsDueForPolling()
        expect(result).toHaveLength(0)
      })

      it('should exclude recently polled channels', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'
        const recentPollTime = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago

        // Create channel first
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])
        const channelUuid = channelResult.rows[0].id

        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active, last_polled_at)
          VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, true, recentPollTime.toISOString()])

        const result = await rssOps.getChannelsDueForPolling()
        expect(result).toHaveLength(0)
      })

      it('should return multiple channels due for polling', async () => {
        const channels = [
          { id: 'UC1111111111', url: 'https://example1.com/rss.xml' },
          { id: 'UC2222222222', url: 'https://example2.com/rss.xml' },
        ]

        for (const channel of channels) {
          // Create channel first
          const channelResult = await client.query(`
            INSERT INTO channels (youtube_channel_id, title, published_at)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [channel.id, 'Test Channel', new Date().toISOString()])
          const channelUuid = channelResult.rows[0].id

          await client.query(`
            INSERT INTO channel_feeds (channel_id, feed_url, is_active, last_polled_at)
            VALUES ($1, $2, $3, $4)
          `, [channelUuid, channel.url, true, null])
        }

        const result = await rssOps.getChannelsDueForPolling()

        expect(result).toHaveLength(2)
        expect(result.map(r => r.channelId)).toEqual(['UC1111111111', 'UC2222222222'])
      })
    })
  })
})