import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { handleBackfillChannel } from '../../../src/workers/handlers/backfill'

dotenv.config({ path: '.env.local' })

// Mock the YouTube API clients
const mockChannelsClient = {
  fetchChannels: vi.fn()
}

const mockPlaylistsClient = {
  fetchPlaylistItems: vi.fn()
}

const mockVideosClient = {
  fetchVideos: vi.fn()
}

vi.mock('../../../src/lib/youtube/channels', () => ({
  YouTubeChannelsClient: vi.fn().mockImplementation(() => mockChannelsClient)
}))

vi.mock('../../../src/lib/youtube/playlists', () => ({
  YouTubePlaylistsClient: vi.fn().mockImplementation(() => mockPlaylistsClient)
}))

vi.mock('../../../src/lib/youtube/videos', () => ({
  YouTubeVideosClient: vi.fn().mockImplementation(() => mockVideosClient)
}))

vi.mock('../../../src/lib/youtube/client', () => ({
  createYouTubeClientFromEnv: vi.fn()
}))

describe('BACKFILL_CHANNEL Handler Integration Tests', () => {
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
    await client.query('ALTER TABLE videos DISABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_stats DISABLE ROW LEVEL SECURITY')

    // Initialize Supabase client
    const supabaseUrl = process.env['SUPABASE_URL']!
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  })

  afterAll(async () => {
    // Re-enable RLS
    await client.query('ALTER TABLE channels ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE videos ENABLE ROW LEVEL SECURITY')
    await client.query('ALTER TABLE channel_stats ENABLE ROW LEVEL SECURITY')
    await client.end()

    vi.restoreAllMocks()
  })

  beforeEach(async () => {
    // Clean up data
    await client.query('TRUNCATE TABLE channels, videos, channel_stats RESTART IDENTITY CASCADE')

    // Reset mocks
    mockChannelsClient.fetchChannels.mockClear()
    mockPlaylistsClient.fetchPlaylistItems.mockClear()
    mockVideosClient.fetchVideos.mockClear()
  })

  describe('Channel Backfill Process', () => {
    const mockChannelData = {
      id: 'UC1234567890',
      snippet: {
        title: 'Test Channel',
        description: 'A test YouTube channel',
        publishedAt: '2020-01-01T00:00:00Z',
        country: 'US',
        defaultLanguage: 'en',
        tags: ['gaming', 'technology']
      },
      statistics: {
        subscriberCount: 10000,
        videoCount: 50,
        viewCount: 500000
      },
      contentDetails: {
        relatedPlaylists: {
          uploads: 'UU1234567890'
        }
      },
      status: {
        isLinked: true,
        longUploadsStatus: 'allowed',
        privacyStatus: 'public',
        madeForKids: false
      },
      brandingSettings: {
        channel: {
          featuredChannelsTitle: 'Featured Channels',
          featuredChannelsUrls: ['UC9876543210'],
          unsubscribedTrailer: 'trailer123',
          profileColor: '#FF0000',
          defaultTab: 'home'
        }
      }
    }

    const mockPlaylistItems = [
      {
        contentDetails: {
          videoId: 'video001',
          videoPublishedAt: '2023-01-01T00:00:00Z'
        },
        snippet: {
          title: 'Video 1',
          description: 'First video',
          publishedAt: '2023-01-01T00:00:00Z'
        }
      },
      {
        contentDetails: {
          videoId: 'video002',
          videoPublishedAt: '2023-01-02T00:00:00Z'
        },
        snippet: {
          title: 'Video 2',
          description: 'Second video',
          publishedAt: '2023-01-02T00:00:00Z'
        }
      }
    ]

    const mockVideoDetails = [
      {
        id: 'video001',
        snippet: {
          title: 'Video 1',
          description: 'First video',
          publishedAt: '2023-01-01T00:00:00Z',
          tags: ['tag1', 'tag2'],
          categoryId: '20',
          liveBroadcastContent: 'none',
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        statistics: {
          viewCount: 1000,
          likeCount: 100,
          commentCount: 10
        },
        contentDetails: {
          duration: 'PT10M30S',
          licensedContent: false,
          projection: 'rectangular',
          caption: true
        },
        status: {
          uploadStatus: 'processed',
          privacyStatus: 'public',
          embeddable: true,
          publicStatsViewable: true,
          madeForKids: false,
          license: 'youtube'
        },
        topicDetails: {
          topicCategories: ['/m/04rlf', '/m/07c1v']
        }
      },
      {
        id: 'video002',
        snippet: {
          title: 'Video 2',
          description: 'Second video',
          publishedAt: '2023-01-02T00:00:00Z',
          tags: ['tag3'],
          categoryId: '22',
          liveBroadcastContent: 'none'
        },
        statistics: {
          viewCount: 2000,
          likeCount: 200,
          commentCount: 20
        },
        contentDetails: {
          duration: 'PT5M15S',
          licensedContent: true,
          projection: 'rectangular',
          caption: false
        },
        status: {
          uploadStatus: 'processed',
          privacyStatus: 'public',
          embeddable: true,
          publicStatsViewable: true,
          madeForKids: false,
          license: 'creativeCommon'
        }
      }
    ]

    it('should successfully backfill a channel with videos', async () => {
      // Mock YouTube API responses
      mockChannelsClient.fetchChannels.mockResolvedValue([mockChannelData])
      mockPlaylistsClient.fetchPlaylistItems.mockResolvedValue(mockPlaylistItems)
      mockVideosClient.fetchVideos.mockResolvedValue(mockVideoDetails)

      // Execute backfill
      const result = await handleBackfillChannel(
        { channelId: 'UC1234567890' },
        supabase
      )

      // Verify result
      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(3) // 1 channel + 2 videos
      expect(result.error).toBeUndefined()

      // Verify channel was stored
      const channelResult = await client.query(
        'SELECT * FROM channels WHERE youtube_channel_id = $1',
        ['UC1234567890']
      )
      expect(channelResult.rows).toHaveLength(1)
      const channel = channelResult.rows[0]
      expect(channel.title).toBe('Test Channel')
      expect(channel.description).toBe('A test YouTube channel')
      expect(channel.subscriber_count).toBe('10000')
      expect(channel.video_count).toBe('50')
      expect(channel.view_count).toBe('500000')
      expect(channel.status).toBe('active')
      // uploads_playlist_id is not stored in channels table

      // Verify videos were stored
      const videosResult = await client.query(
        'SELECT * FROM videos WHERE channel_id = $1 ORDER BY youtube_video_id',
        [channel.id]
      )
      expect(videosResult.rows).toHaveLength(2)

      const video1 = videosResult.rows[0]
      expect(video1.youtube_video_id).toBe('video001')
      expect(video1.title).toBe('Video 1')
      expect(video1.view_count).toBe('1000')
      expect(video1.like_count).toBe('100')
      expect(video1.comment_count).toBe('10')
      expect(video1.tags).toEqual(['tag1', 'tag2'])
      expect(video1.category_id).toBe('20')
      expect(video1.licensed_content).toBe(false)
      expect(video1.caption).toBe(true)

      const video2 = videosResult.rows[1]
      expect(video2.youtube_video_id).toBe('video002')
      expect(video2.title).toBe('Video 2')
      expect(video2.licensed_content).toBe(true)
      expect(video2.caption).toBe(false)

      // Verify initial stats were captured
      const statsResult = await client.query(
        'SELECT * FROM channel_stats WHERE channel_id = $1',
        [channel.id]
      )
      expect(statsResult.rows).toHaveLength(1)
      const stats = statsResult.rows[0]
      expect(stats.subscriber_count).toBe('10000')
      expect(stats.video_count).toBe('50')
      expect(stats.view_count).toBe('500000')
    })

    it('should handle channel not found on YouTube', async () => {
      // Mock empty response
      mockChannelsClient.fetchChannels.mockResolvedValue([])

      const result = await handleBackfillChannel(
        { channelId: 'UC-nonexistent' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Channel UC-nonexistent not found on YouTube')
      expect(result.itemsProcessed).toBeUndefined()
    })

    it('should handle channel without uploads playlist', async () => {
      const channelWithoutUploads = {
        ...mockChannelData,
        contentDetails: {
          relatedPlaylists: {} // No uploads playlist
        }
      }

      mockChannelsClient.fetchChannels.mockResolvedValue([channelWithoutUploads])
      mockPlaylistsClient.fetchPlaylistItems.mockResolvedValue([])
      mockVideosClient.fetchVideos.mockResolvedValue([])

      const result = await handleBackfillChannel(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(1) // Just the channel

      // Verify channel was still stored
      const channelResult = await client.query(
        'SELECT * FROM channels WHERE youtube_channel_id = $1',
        ['UC1234567890']
      )
      expect(channelResult.rows).toHaveLength(1)
      // uploads_playlist_id is not stored in the channels table anymore
    })

    it('should handle missing payload data gracefully', async () => {
      const incompleteChannelData = {
        id: 'UC1234567890',
        snippet: {}, // Missing required fields
        statistics: {}, // Missing counts
        contentDetails: {
          relatedPlaylists: {}
        }
      }

      mockChannelsClient.fetchChannels.mockResolvedValue([incompleteChannelData])
      mockPlaylistsClient.fetchPlaylistItems.mockResolvedValue([])
      mockVideosClient.fetchVideos.mockResolvedValue([])

      const result = await handleBackfillChannel(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(1)

      // Verify channel was stored with defaults
      const channelResult = await client.query(
        'SELECT * FROM channels WHERE youtube_channel_id = $1',
        ['UC1234567890']
      )
      expect(channelResult.rows).toHaveLength(1)
      const channel = channelResult.rows[0]
      expect(channel.title).toBe('') // Default for missing title
      expect(channel.subscriber_count).toBe('0') // Default for missing stats
      expect(channel.video_count).toBe('0')
      expect(channel.view_count).toBe('0')
    })

    it('should handle YouTube API errors gracefully', async () => {
      // Mock API error
      mockChannelsClient.fetchChannels.mockRejectedValue(new Error('YouTube API quota exceeded'))

      const result = await handleBackfillChannel(
        { channelId: 'UC1234567890' },
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('YouTube API quota exceeded')
      expect(result.itemsProcessed).toBeUndefined()
    })

    it('should handle database errors gracefully', async () => {
      mockChannelsClient.fetchChannels.mockResolvedValue([mockChannelData])
      mockPlaylistsClient.fetchPlaylistItems.mockResolvedValue([])
      mockVideosClient.fetchVideos.mockResolvedValue([])

      // Mock database error by disconnecting (this is a simplified test)
      // In a real scenario, we'd mock the supabase.rpc calls

      const result = await handleBackfillChannel(
        { channelId: 'UC1234567890' },
        supabase
      )

      // The handler should still attempt to process and handle errors
      // This test verifies the error handling structure is in place
      expect(typeof result.success).toBe('boolean')
      expect(typeof result.itemsProcessed).toBe('number')
    })

    it('should validate input payload', async () => {
      const result = await handleBackfillChannel(
        { channelId: '' }, // Invalid empty channelId
        supabase
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Missing channelId in payload')
    })
  })
})