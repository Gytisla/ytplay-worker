import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../types/supabase'
import { RSSPollingOperations } from '../../../src/workers/rss'
import type { ChannelFeedResult, JobResult, JobEventResult } from './utils'

dotenv.config({ path: '.env.local' })

describe('RSS Feed State Management Integration Tests', () => {
  let client: Client
  let supabase: ReturnType<typeof createClient<Database>>
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
  })

  describe('Channel Feed Configuration', () => {
    describe('upsertChannelFeed', () => {
      it('should create new channel feed configuration', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        await rssOps.upsertChannelFeed(channelId, feedUrl)

        const result = await client.query<ChannelFeedResult>(`
          SELECT cf.*, c.youtube_channel_id 
          FROM channel_feeds cf 
          JOIN channels c ON cf.channel_id = c.id 
          WHERE c.youtube_channel_id = $1
        `, [channelId])

        expect(result.rows).toHaveLength(1)
        const row = result.rows[0]!
        expect(row).toBeDefined()
        expect(row).toMatchObject({
          youtube_channel_id: channelId,
          feed_url: feedUrl,
          feed_type: 'youtube_rss',
          poll_interval_minutes: 10,
          is_active: true,
          consecutive_failures: 0,
        } as const)
        expect(row.created_at).toBeTruthy()
        expect(row.updated_at).toBeTruthy()
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

        const result = await client.query<ChannelFeedResult>(`
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

        const result = await client.query<ChannelFeedResult>(
          'SELECT cf.*, c.youtube_channel_id FROM channel_feeds cf JOIN channels c ON cf.channel_id = c.id WHERE c.youtube_channel_id = $1 ORDER BY cf.feed_url',
          [channelId]
        )

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
        const channelResult = await client.query<{ id: string }>(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])

        if (!channelResult.rows[0]) {
          throw new Error('Failed to create channel')
        }

        // Insert test data
        await client.query<ChannelFeedResult>(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, etag, last_modified, last_polled_at,
            last_successful_poll_at, poll_interval_minutes, consecutive_failures,
            is_active, last_error_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          channelResult.rows[0].id, feedUrl, etag, lastModified, lastPolledAt.toISOString(),
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
        const channelResult = await client.query<{ id: string }>(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])

        if (!channelResult.rows[0]) {
          throw new Error('Failed to create channel')
        }

        await client.query<ChannelFeedResult>(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active)
          VALUES ($1, $2, $3)
        `, [channelResult.rows[0].id, feedUrl, false])

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

        interface DetailedChannelFeed extends ChannelFeedResult {
          last_modified: string
          last_polled_at: string
          last_successful_poll_at: string
        }

        const result = await client.query<DetailedChannelFeed>(
          'SELECT cf.*, c.youtube_channel_id, ' +
          'to_char(cf.last_modified AT TIME ZONE \'UTC\', \'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"\') as last_modified, ' +
          'to_char(cf.last_polled_at AT TIME ZONE \'UTC\', \'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"\') as last_polled_at, ' +
          'to_char(cf.last_successful_poll_at AT TIME ZONE \'UTC\', \'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"\') as last_successful_poll_at ' +
          'FROM channel_feeds cf JOIN channels c ON cf.channel_id = c.id WHERE c.youtube_channel_id = $1',
          [channelId]
        )

        if (!result.rows[0]) {
          throw new Error('Failed to update feed state')
        }

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
        const channelResult = await client.query<{ id: string }>(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Test Channel', new Date().toISOString()])

        if (!channelResult.rows[0]) {
          throw new Error('Failed to create channel')
        }

        // Create feed with error
        await client.query<ChannelFeedResult>(`
          INSERT INTO channel_feeds (channel_id, feed_url, last_error_message, consecutive_failures, is_active)
          VALUES ($1, $2, $3, $4, $5)
        `, [channelResult.rows[0].id, feedUrl, 'Previous error', 3, true])

        const newState = {
          channelId,
          feedUrl,
          pollIntervalMinutes: 10,
          consecutiveErrors: 0,
          status: 'active' as const,
        }

        await rssOps.updateFeedState(newState)

        const result = await client.query<Pick<ChannelFeedResult, 'last_error_message' | 'consecutive_failures'>>(
          'SELECT cf.last_error_message, cf.consecutive_failures FROM channel_feeds cf JOIN channels c ON cf.channel_id = c.id WHERE c.youtube_channel_id = $1',
          [channelId])

        if (!result.rows[0]) {
          throw new Error('Failed to get feed state')
        }

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

        const result = await client.query<ChannelFeedResult>(
          'SELECT cf.*, c.youtube_channel_id FROM channel_feeds cf JOIN channels c ON cf.channel_id = c.id WHERE c.youtube_channel_id = $1',
          [channelId]
        )

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

        const result = await client.query(
          'SELECT cf.consecutive_failures, cf.is_active FROM channel_feeds cf JOIN channels c ON cf.channel_id = c.id WHERE c.youtube_channel_id = $1',
          [channelId]
        )

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

        const result = await client.query<JobResult>(
          'SELECT * FROM jobs ORDER BY created_at'
        )

        expect(result.rows).toHaveLength(3)
        result.rows.forEach((job: JobResult, index: number) => {
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

        const result = await client.query(
          'SELECT COUNT(*) FROM jobs'
        )
        expect(result.rows[0].count).toBe('0')
      })

      it('should use deduplication to prevent duplicate jobs', async () => {
        const channelId = 'UC1234567890'
        const videoId = 'video123'

        // Enqueue same video twice
        await rssOps.enqueueVideoJobs(channelId, [videoId])
        await rssOps.enqueueVideoJobs(channelId, [videoId])

        const result = await client.query<JobResult>(
          'SELECT * FROM jobs WHERE dedup_key = $1',
          [`refresh_video_stats_${videoId}`]
        )
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

  describe('Video Discovery and Job Enqueueing Workflow', () => {
    describe('discoverNewVideosAndEnqueueJobs', () => {
      it('should discover new videos from RSS feed and enqueue jobs only for truly new videos', async () => {
        const channelId = 'UC1234567890'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC1234567890'

        // Create channel and existing videos in database
        const channelResult = await client.query(
          'INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ($1, $2, $3) RETURNING id',
          [channelId, 'Test Channel', new Date('2025-01-01T00:00:00Z').toISOString()]
        )
        const channelUuid = channelResult.rows[0].id

        // Insert existing videos (already processed)
        const existingVideoIds = ['video001', 'video002', 'video003']
        for (const videoId of existingVideoIds) {
          await client.query(`
            INSERT INTO videos (youtube_video_id, channel_id, title, published_at)
            VALUES ($1, $2, $3, $4)
          `, [videoId, channelUuid, `Video ${videoId}`, new Date('2025-10-01T10:00:00Z').toISOString()])
        }

        // Set up feed state with last successful poll at 2025-10-01T12:00:00Z
        const lastSuccessfulPollAt = new Date('2025-10-01T12:00:00Z')
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, last_successful_poll_at,
            poll_interval_minutes, consecutive_failures
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [channelUuid, feedUrl, true, lastSuccessfulPollAt.toISOString(), 10, 0])

        // Mock RSS feed with mix of old and new videos
        // Old videos: published before lastSuccessfulPollAt (should not enqueue jobs)
        // New videos: published after lastSuccessfulPollAt (should enqueue jobs)
        const mockVideos = [
          { videoId: 'video001', publishedAt: new Date('2025-10-01T11:00:00Z') }, // Old - already exists
          { videoId: 'video002', publishedAt: new Date('2025-10-01T11:30:00Z') }, // Old - already exists
          { videoId: 'video004', publishedAt: new Date('2025-10-01T13:00:00Z') }, // New - should enqueue
          { videoId: 'video005', publishedAt: new Date('2025-10-01T14:00:00Z') }, // New - should enqueue
          { videoId: 'video006', publishedAt: new Date('2025-10-01T15:00:00Z') }, // New - should enqueue
        ]

        // Simulate the workflow: filter new videos and enqueue jobs
        const feedState = await rssOps.getChannelFeed(channelId)
        expect(feedState).toBeTruthy()
        expect(feedState!.lastVideoPublishedAt).toEqual(lastSuccessfulPollAt)

        // Filter videos that are newer than last successful poll
        const newVideoIds = mockVideos
          .filter(video => video.publishedAt > lastSuccessfulPollAt)
          .map(video => video.videoId)

        expect(newVideoIds).toEqual(['video004', 'video005', 'video006'])

        // Enqueue jobs for new videos
        await rssOps.enqueueVideoJobs(channelId, newVideoIds)

        // Verify jobs were enqueued correctly
        const jobsResult = await client.query<JobResult>(
          'SELECT * FROM jobs WHERE job_type = \'REFRESH_VIDEO_STATS\' ORDER BY created_at'
        )

        expect(jobsResult.rows).toHaveLength(3)
        const enqueuedVideoIds = jobsResult.rows.map((job: JobResult) => (job.payload as { video_ids: string[] })['video_ids'][0]).sort()
        expect(enqueuedVideoIds).toEqual(['video004', 'video005', 'video006'])

        // Verify each job has correct structure
        jobsResult.rows.forEach((job: JobResult) => {
          expect(job.job_type).toBe('REFRESH_VIDEO_STATS')
          expect(job.priority).toBe(7)
          expect(job.status).toBe('pending')
          expect(job.payload['channel_id']).toBe(channelId)
          expect(job.payload['video_ids']).toHaveLength(1)
          expect(job.dedup_key).toMatch(/^refresh_video_stats_video\d{3}$/)
        })

        // Verify deduplication works (enqueue same videos again)
        await rssOps.enqueueVideoJobs(channelId, ['video004']) // Should not create duplicate
        const jobsAfterDedup = await client.query(
          'SELECT COUNT(*) FROM jobs WHERE dedup_key = \'refresh_video_stats_video004\''
        )
        expect(jobsAfterDedup.rows[0].count).toBe('1')
      })

      it('should handle channel with no previous successful polls (first time polling)', async () => {
        const channelId = 'UCfreshchannel'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCfreshchannel'

        // Create channel with no previous polls
        const channelResult = await client.query(
          'INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ($1, $2, $3) RETURNING id',
          [channelId, 'Fresh Channel', new Date('2025-01-01T00:00:00Z').toISOString()]
        )
        const channelUuid = channelResult.rows[0].id

        // Set up feed state with no last_successful_poll_at (first time)
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, last_successful_poll_at,
            poll_interval_minutes, consecutive_failures
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [channelUuid, feedUrl, true, null, 10, 0])

        const mockVideos = [
          { videoId: 'fresh001', publishedAt: new Date('2025-10-01T10:00:00Z') },
          { videoId: 'fresh002', publishedAt: new Date('2025-10-01T11:00:00Z') },
          { videoId: 'fresh003', publishedAt: new Date('2025-10-01T12:00:00Z') },
        ]

        // Get feed state (should have no lastVideoPublishedAt)
        const feedState = await rssOps.getChannelFeed(channelId)
        expect(feedState).toBeTruthy()
        expect(feedState!.lastVideoPublishedAt).toBeUndefined()

        // All videos should be considered "new" for first-time polling
        const newVideoIds = mockVideos.map(video => video.videoId)
        expect(newVideoIds).toEqual(['fresh001', 'fresh002', 'fresh003'])

        // Enqueue jobs for all videos
        await rssOps.enqueueVideoJobs(channelId, newVideoIds)

        // Verify all jobs were enqueued
        const jobsResult = await client.query(`
          SELECT * FROM jobs
          WHERE job_type = 'REFRESH_VIDEO_STATS'
          ORDER BY (payload->'video_ids'->>0)
        `)

        expect(jobsResult.rows).toHaveLength(3)
        const enqueuedVideoIds = jobsResult.rows.map((job: JobResult) => (job.payload as { video_ids: string[] })['video_ids'][0]).sort()
        expect(enqueuedVideoIds).toEqual(['fresh001', 'fresh002', 'fresh003'])
      })

      it('should handle empty RSS feed with no new videos', async () => {
        const channelId = 'UCemptyfeed'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCemptyfeed'

        // Create channel with recent successful poll
        const channelResult = await client.query(
          'INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ($1, $2, $3) RETURNING id',
          [channelId, 'Empty Feed Channel', new Date('2025-01-01T00:00:00Z').toISOString()]
        )
        const channelUuid = channelResult.rows[0].id

        const lastSuccessfulPollAt = new Date('2025-10-01T12:00:00Z')
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, last_successful_poll_at,
            poll_interval_minutes, consecutive_failures
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [channelUuid, feedUrl, true, lastSuccessfulPollAt.toISOString(), 10, 0])

        // Empty video list (no videos in RSS feed)
        const mockVideos: Array<{ videoId: string; publishedAt: Date }> = []

        // No videos should be considered new
        const newVideoIds = mockVideos
          .filter(video => video.publishedAt > lastSuccessfulPollAt)
          .map(video => video.videoId)

        expect(newVideoIds).toEqual([])

        // Enqueue jobs for empty list (should do nothing)
        await rssOps.enqueueVideoJobs(channelId, newVideoIds)

        // Verify no jobs were enqueued
        const jobsResult = await client.query(`
          SELECT COUNT(*) FROM jobs
          WHERE job_type = 'REFRESH_VIDEO_STATS'
        `)

        expect(jobsResult.rows[0].count).toBe('0')
      })
    })
  })

  describe('RSS Error Handling and Fallback Mechanisms', () => {
    describe('consecutive error handling and feed pausing', () => {
      it('should increment consecutive failures and record error messages', async () => {
        const channelId = 'UCerrorchannel'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCerrorchannel'

        // Create channel
        const channelResult = await client.query(
          'INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ($1, $2, $3) RETURNING id',
          [channelId, 'Error Channel', new Date('2025-01-01T00:00:00Z').toISOString()]
        )
        const channelUuid = channelResult.rows[0].id

        // Create feed with initial state
        await client.query(
          'INSERT INTO channel_feeds (channel_id, feed_url, is_active, consecutive_failures, last_error_message) VALUES ($1, $2, $3, $4, $5)',
          [channelUuid, feedUrl, true, 2, 'Previous network error']
        )

        // Simulate error update
        const error = new Error('Network timeout')
        await rssOps.updateFeedStateAfterError(channelId, error)

        // Verify error state was updated
        const result = await client.query(`
          SELECT consecutive_failures, is_active, last_error_message, updated_at
          FROM channel_feeds WHERE channel_id = $1
        `, [channelUuid])

        expect(result.rows[0]).toMatchObject({
          consecutive_failures: 3,
          is_active: true,
          last_error_message: 'Network timeout',
        })
        expect(result.rows[0].updated_at).toBeTruthy()
      })

      it('should pause feed after 5 consecutive failures', async () => {
        const channelId = 'UCpausechannel'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCpausechannel'

        // Create channel
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Pause Channel', new Date('2025-01-01T00:00:00Z').toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Create feed with 4 failures (one more will pause it)
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, consecutive_failures
          ) VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, true, 4])

        // Simulate the 5th error
        const error = new Error('Persistent connection failure')
        await rssOps.updateFeedStateAfterError(channelId, error)

        // Verify feed was paused
        const result = await client.query(
          'SELECT consecutive_failures, is_active, last_error_message FROM channel_feeds WHERE channel_id = $1',
          [channelUuid]
        )

        expect(result.rows[0]).toMatchObject({
          consecutive_failures: 5,
          is_active: false,
          last_error_message: 'Persistent connection failure',
        })
      })

      it('should not poll paused feeds', async () => {
        const channelId = 'UCpausedchannel'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCpausedchannel'

        // Create channel
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Paused Channel', new Date('2025-01-01T00:00:00Z').toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Create paused feed
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, consecutive_failures
          ) VALUES ($1, $2, $3, $4)
        `, [channelUuid, feedUrl, false, 5])

        // Verify paused feed is not returned for polling
        const channelsDue = await rssOps.getChannelsDueForPolling()
        const pausedChannel = channelsDue.find((c: { channelId: string }) => c.channelId === channelId)
        expect(pausedChannel).toBeUndefined()
      })

      it('should reset consecutive failures and reactivate feed after successful poll', async () => {
        const channelId = 'UCrecovery'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCrecovery'

        // Create channel
        const channelResult = await client.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [channelId, 'Recovery Channel', new Date('2025-01-01T00:00:00Z').toISOString()])
        const channelUuid = channelResult.rows[0].id

        // Create feed with errors and paused
        await client.query(`
          INSERT INTO channel_feeds (
            channel_id, feed_url, is_active, consecutive_failures, last_error_message
          ) VALUES ($1, $2, $3, $4, $5)
        `, [channelUuid, feedUrl, false, 5, 'Previous error'])

        // Get initial feed state
        const feedState = await rssOps.getChannelFeed(channelId)
        expect(feedState).toMatchObject({
          status: 'paused',
          consecutiveErrors: 5,
          errorMessage: 'Previous error',
        } as const)

        // Simulate successful poll by updating state
        const successfulState = {
          ...feedState!,
          lastPolledAt: new Date(),
          lastVideoPublishedAt: new Date('2025-10-01T12:00:00Z'),
          consecutiveErrors: 0,
          status: 'active' as const,
        }
        delete (successfulState as any).errorMessage // Remove error message for successful state
        await rssOps.updateFeedState(successfulState)

        // Verify feed was reactivated and errors reset
        const result = await client.query(`
          SELECT is_active, consecutive_failures, last_error_message, last_polled_at, last_successful_poll_at
          FROM channel_feeds WHERE channel_id = $1
        `, [channelUuid])

        expect(result.rows[0]).toMatchObject({
          is_active: true,
          consecutive_failures: 0,
          last_error_message: null,
        })
        expect(result.rows[0].last_polled_at).toBeTruthy()
        expect(result.rows[0].last_successful_poll_at).toBeTruthy()

        // Verify feed state is correctly updated (active with no errors)
        const updatedFeedState = await rssOps.getChannelFeed(channelId)
        expect(updatedFeedState).toMatchObject({
          status: 'active',
          consecutiveErrors: 0,
        })
        expect(updatedFeedState!.errorMessage).toBeUndefined()
      })

      it('should handle multiple error types and preserve error messages', async () => {
        const channelId = 'UCmultichannel'
        const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCmultichannel'

        // Create channel
        const channelResult = await client.query(
          'INSERT INTO channels (youtube_channel_id, title, published_at) VALUES ($1, $2, $3) RETURNING id',
          [channelId, 'Multi Error Channel', new Date('2025-01-01T00:00:00Z').toISOString()]
        )
        const channelUuid = channelResult.rows[0].id

        // Create feed
        await client.query(`
          INSERT INTO channel_feeds (channel_id, feed_url, is_active)
          VALUES ($1, $2, $3)
        `, [channelUuid, feedUrl, true])

        // Simulate different types of errors
        const errors = [
          new Error('DNS resolution failed'),
          new Error('Connection timeout'),
          new Error('HTTP 500 Internal Server Error'),
          new Error('Malformed XML response'),
        ]

        for (let i = 0; i < errors.length; i++) {
          const error = errors[i]!
          await rssOps.updateFeedStateAfterError(channelId, error)

          const result = await client.query(`
            SELECT consecutive_failures, last_error_message
            FROM channel_feeds WHERE channel_id = $1
          `, [channelUuid])

          expect(result.rows[0]).toBeDefined()
          expect(result.rows[0]!.consecutive_failures).toBe(i + 1)
          expect(result.rows[0]!.last_error_message).toBe(error.message)
        }

        // Verify final state
        const finalResult = await client.query(`
          SELECT consecutive_failures, is_active, last_error_message
          FROM channel_feeds WHERE channel_id = $1
        `, [channelUuid])

        expect(finalResult.rows[0]).toMatchObject({
          consecutive_failures: 4,
          is_active: true,
          last_error_message: 'Malformed XML response',
        })
      })

      it('should handle non-existent channel gracefully in error updates', async () => {
        // Try to update error state for non-existent channel
        const nonExistentChannelId = 'UCnonexistent'

        // This should not throw an error, just silently do nothing
        await expect(
          rssOps.updateFeedStateAfterError(nonExistentChannelId, new Error('Test error'))
        ).resolves.not.toThrow()

        // Verify no state was created
        const result = await client.query(`
          SELECT COUNT(*) FROM channel_feeds
          WHERE channel_id IN (
            SELECT id FROM channels WHERE youtube_channel_id = $1
          )
        `, [nonExistentChannelId])

        expect(result.rows[0].count).toBe('0')
      })
    })
  })

  describe('RSS Polling Validation with Real YouTube Feeds', () => {
    // Test channels with known RSS feeds (small channels to avoid rate limits)
    const testChannels = [
      {
        channelId: 'UC4QobU6STFB0P71PMvOGN5A', // freeCodeCamp.org
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC4QobU6STFB0P71PMvOGN5A',
        name: 'freeCodeCamp.org'
      },
      {
        channelId: 'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp
        feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC8butISFwT-Wl7EV0hUK0BQ',
        name: 'freeCodeCamp'
      }
    ]

    testChannels.forEach(({ channelId, feedUrl, name }) => {
      describe(`Channel: ${name} (${channelId})`, () => {
        it('should successfully fetch and parse real RSS feed', async () => {
          // Create channel feed configuration
          await rssOps.upsertChannelFeed(channelId, feedUrl)

          // Fetch RSS feed directly
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          let response: Response
          try {
            response = await fetch(feedUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; YouTube RSS Poller)'
              },
              signal: controller.signal,
            })
            clearTimeout(timeoutId)
          } catch (error) {
            clearTimeout(timeoutId)
            throw error
          }

          expect(response.ok).toBe(true)
          expect(response.headers.get('content-type')).toContain('xml')

          const xmlContent = await response.text()
          expect(xmlContent).toContain('<feed') // YouTube uses Atom feeds
          expect(xmlContent).toContain('<entry>')
          expect(xmlContent).toContain(channelId)

          // Parse the RSS/Atom feed using the same parser as the edge function
          const { XMLParser } = await import('fast-xml-parser')
          const parser = new XMLParser({
            ignoreAttributes: false,
            allowBooleanAttributes: true,
            parseAttributeValue: true,
            trimValues: true,
          })

          const parsed = parser.parse(xmlContent)
          expect(parsed.feed).toBeTruthy() // Atom feed structure
          expect(parsed.feed.title).toBeTruthy()

          // Check for video entries
          if (parsed.feed.entry) {
            const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry]
            expect(entries.length).toBeGreaterThan(0)

            // Validate first entry structure
            const firstEntry = entries[0]
            expect(firstEntry.title).toBeTruthy()
            expect(firstEntry.link).toBeTruthy()
            expect(firstEntry['yt:videoId']).toBeTruthy()
            expect(firstEntry.published).toBeTruthy()

            console.log(`✅ ${name}: Successfully parsed ${entries.length} videos from Atom feed`)
          } else {
            console.log(`✅ ${name}: Atom feed fetched successfully (no videos or empty feed)`)
          }
        }, 60000) // 60 second timeout for real network calls

        it('should handle multiple RSS feed fetches without errors', async () => {
          // Create channel feed configuration
          await rssOps.upsertChannelFeed(channelId, feedUrl)

          // Fetch RSS feed multiple times
          for (let i = 0; i < 3; i++) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000)

            const headers: Record<string, string> = {
              'User-Agent': 'Mozilla/5.0 (compatible; YouTube RSS Poller)',
            }

            if (i > 0) {
              headers['If-None-Match'] = '"test-etag"' // Test conditional requests
            }

            let response: Response
            try {
              response = await fetch(feedUrl, {
                headers,
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
            } catch (error) {
              clearTimeout(timeoutId)
              throw error
            }

            expect(response.ok || response.status === 304).toBe(true)

            if (response.ok) {
              const xmlContent = await response.text()
              expect(xmlContent).toContain('<feed')
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

          console.log(`✅ ${name}: Multiple RSS fetches completed successfully`)
        }, 180000) // 3 minute timeout
      })
    })

    it('should validate RSS feed structure and video discovery', async () => {
      expect(testChannels.length).toBeGreaterThan(0)
      const testChannel = testChannels[0]!
      const { channelId, feedUrl, name } = testChannel

      // Create channel feed configuration
      await rssOps.upsertChannelFeed(channelId, feedUrl)

      // Fetch and parse RSS feed
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      let response: Response
      try {
        response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YouTube RSS Poller)'
          },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }

      expect(response.ok).toBe(true)

      const xmlContent = await response.text()
      const { XMLParser } = await import('fast-xml-parser')
      const parser = new XMLParser({
        ignoreAttributes: false,
        allowBooleanAttributes: true,
        parseAttributeValue: true,
        trimValues: true,
      })

      const parsed = parser.parse(xmlContent)
      const feed = parsed.feed // Atom feed structure
      expect(feed).toBeTruthy()
      expect(feed.title).toBeTruthy()

      interface FeedEntry {
        'yt:videoId': string;
        published: string;
      }

      interface VideoEntry {
        videoId: string;
        publishedAt: Date;
      }

      if (feed.entry) {
        const entries = Array.isArray(feed.entry) ? feed.entry as FeedEntry[] : [feed.entry as FeedEntry]

        // Extract video IDs like the real poller would
        const videos = entries.map(entry => ({
          videoId: entry['yt:videoId'],
          publishedAt: new Date(entry.published)
        } as VideoEntry)).filter(v => v.videoId)

        expect(videos.length).toBeGreaterThan(0)

        // Verify video ID format (YouTube video IDs are 11 characters)
        videos.forEach(video => {
          expect(video.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/)
          expect(video.publishedAt).toBeInstanceOf(Date)
          expect(video.publishedAt.getTime()).toBeGreaterThan(0)
        })

        // Test video filtering logic (new videos since a certain date)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const newVideos = videos.filter(video => video.publishedAt > oneDayAgo)

        console.log(`✅ ${name}: Found ${videos.length} total videos, ${newVideos.length} from last 24 hours`)

        // Verify feed state can be updated
        const feedState = await rssOps.getChannelFeed(channelId)
        expect(feedState).not.toBeNull()
        expect(feedState!.feedUrl).toBe(feedUrl)
        expect(feedState!.status).toBe('active')
      } else {
        console.log(`✅ ${name}: Atom feed structure validated (empty feed)`)
      }
    }, 60000)
  })
})