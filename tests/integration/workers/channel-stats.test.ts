import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { handleRefreshChannelStats } from '../../../src/workers/handlers/channel-stats'

dotenv.config({ path: '.env.local' })

// Mock the YouTube API clients
const mockChannelsClient = {
  fetchChannels: vi.fn()
}

vi.mock('../../../src/lib/youtube/channels', () => ({
  YouTubeChannelsClient: vi.fn().mockImplementation(() => mockChannelsClient)
}))

vi.mock('../../../src/lib/youtube/client', () => ({
  createYouTubeClientFromEnv: vi.fn()
}))

describe('REFRESH_CHANNEL_STATS Handler Integration Tests', () => {
  let client: Client
  let supabase: any

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
    await client.query('ALTER TABLE channels DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_stats DISABLE ROW LEVEL SECURITY')

    // Initialize Supabase client
    const supabaseUrl = process.env['SUPABASE_URL']!
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  })

  afterAll(async () => {
    // Re-enable RLS
    await client.query('ALTER TABLE channels ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_stats ENABLE ROW LEVEL SECURITY')
    await client.end()

    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    // Clean up data
    await client.query('TRUNCATE TABLE channels, channel_stats RESTART IDENTITY CASCADE')

    // Reset mocks
    mockChannelsClient.fetchChannels.mockClear()
  })

  describe('Channel Stats Refresh Process', () => {
    const mockChannelData = {
      id: 'UC1234567890',
      statistics: {
        subscriberCount: 15000, // Increased from initial
        videoCount: 75,         // Increased from initial
        viewCount: 750000       // Increased from initial
      }
    }

    beforeEach(async () => {
      // Insert a test channel
      await client.query(`
        INSERT INTO channels (
          youtube_channel_id, title, description, published_at,
          subscriber_count, video_count, view_count, status
        ) VALUES (
          'UC1234567890', 'Test Channel', 'A test channel',
          '2020-01-01T00:00:00Z', 10000, 50, 500000, 'active'
        )
      `)

      // Insert yesterday's stats for delta calculation
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      await client.query(`
        INSERT INTO channel_stats (
          channel_id, date, view_count, subscriber_count, video_count,
          subscriber_gained, view_gained
        ) VALUES (
          (SELECT id FROM channels WHERE youtube_channel_id = 'UC1234567890'),
          $1, 500000, 10000, 50, 1000, 50000
        )
      `, [yesterdayStr])

      // Mock the YouTube API response
      mockChannelsClient.fetchChannels.mockResolvedValue([mockChannelData])
    })

    it('should successfully refresh channel statistics', async () => {
      const result = await handleRefreshChannelStats(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()

      // Verify channel stats were captured
      const today = new Date().toISOString().split('T')[0]
      const statsResult = await client.query(
        'SELECT * FROM channel_stats WHERE channel_id = (SELECT id FROM channels WHERE youtube_channel_id = $1) AND date = $2',
        ['UC1234567890', today]
      )
      expect(statsResult.rows).toHaveLength(1)

      const stats = statsResult.rows[0]
      expect(stats.subscriber_count).toBe('15000')
      expect(stats.video_count).toBe('75')
      expect(stats.view_count).toBe('750000')
      expect(stats.subscriber_gained).toBe(5000) // 15000 - 10000
      expect(stats.view_gained).toBe(250000)     // 750000 - 500000
      // Check that date is set (DATE type from PostgreSQL)
      expect(stats.date).toBeInstanceOf(Date)
      expect(stats.date.getFullYear()).toBeGreaterThan(2020)

      // Verify channel table was updated
      const channelResult = await client.query(
        'SELECT * FROM channels WHERE youtube_channel_id = $1',
        ['UC1234567890']
      )
      expect(channelResult.rows).toHaveLength(1)

      const channel = channelResult.rows[0]
      expect(channel.subscriber_count).toBe('15000')
      expect(channel.video_count).toBe('75')
      expect(channel.view_count).toBe('750000')
      expect(channel.last_fetched_at).toBeTruthy()
    })

    it('should update existing stats for the same day', async () => {
      // First refresh
      await handleRefreshChannelStats({ channelId: 'UC1234567890' }, supabase)

      // Update mock with new stats
      const updatedMockData = {
        ...mockChannelData,
        statistics: {
          subscriberCount: 16000, // Further increase
          videoCount: 80,
          viewCount: 800000
        }
      }
      mockChannelsClient.fetchChannels.mockResolvedValue([updatedMockData])

      // Second refresh on same day
      const result = await handleRefreshChannelStats(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(true)

      // Should still have only one stats record for today
      const today = new Date().toISOString().split('T')[0]
      const statsResult = await client.query(
        'SELECT * FROM channel_stats WHERE channel_id = (SELECT id FROM channels WHERE youtube_channel_id = $1) AND date = $2',
        ['UC1234567890', today]
      )
      expect(statsResult.rows).toHaveLength(1)

      const stats = statsResult.rows[0]
      expect(stats.subscriber_count).toBe('16000') // Updated value
      expect(stats.video_count).toBe('80')
      expect(stats.view_count).toBe('800000')
      // Deltas remain the same when updating existing stats for the same day
      expect(stats.subscriber_gained).toBe(5000) // Still calculated from yesterday's baseline
    })

    it('should handle channel not found on YouTube', async () => {
      // Mock empty response
      mockChannelsClient.fetchChannels.mockResolvedValue([])

      const result = await handleRefreshChannelStats(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Channel UC1234567890 not found on YouTube')
    })

    it('should handle channel not found in database', async () => {
      const result = await handleRefreshChannelStats(
        { channelId: 'UC-nonexistent' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Channel not found')
    })

    it('should handle channel without statistics', async () => {
      const channelWithoutStats = {
        id: 'UC1234567890',
        statistics: null
      }
      mockChannelsClient.fetchChannels.mockResolvedValue([channelWithoutStats])

      const result = await handleRefreshChannelStats(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No statistics available for channel UC1234567890')
    })

    it('should handle missing channelId in payload', async () => {
      const result = await handleRefreshChannelStats(
        { channelId: '' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing channelId in payload')
    })

    it('should handle API errors gracefully', async () => {
      mockChannelsClient.fetchChannels.mockRejectedValue(
        new Error('YouTube API quota exceeded')
      )

      const result = await handleRefreshChannelStats(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('YouTube API quota exceeded')
    })
  })
})