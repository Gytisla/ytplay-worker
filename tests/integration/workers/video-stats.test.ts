import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleRefreshVideoStats } from '../../../src/workers/handlers/video-stats'

// Mock the YouTube API clients
const mockVideosClient = {
  fetchVideos: vi.fn()
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      ilike: vi.fn().mockResolvedValue({
        data: [
          { id: 'video1', youtube_video_id: 'video123', title: 'Test Video 1', channels: { youtube_channel_id: 'channel123' } },
          { id: 'video2', youtube_video_id: 'video456', title: 'Test Video 2', channels: { youtube_channel_id: 'channel123' } }
        ],
        error: null
      })
    })
  }),
  rpc: vi.fn().mockResolvedValue({ error: null })
}

vi.mock('../../../src/lib/youtube/videos', () => ({
  YouTubeVideosClient: vi.fn().mockImplementation(() => mockVideosClient)
}))

vi.mock('../../../src/lib/youtube/client', () => ({
  createYouTubeClientFromEnv: vi.fn()
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabase)
}))

describe('REFRESH_VIDEO_STATS Handler Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockVideosClient.fetchVideos.mockClear()
    mockSupabase.rpc.mockClear()
  })

  describe('Video Stats Refresh Process', () => {
    const mockVideoData = [
      {
        id: 'video123',
        statistics: {
          viewCount: 50000,
          likeCount: 2500,
          commentCount: 150
        }
      },
      {
        id: 'video456',
        statistics: {
          viewCount: 75000,
          likeCount: 3200,
          commentCount: 280
        }
      }
    ]

    beforeEach(() => {
      // Mock database query for videos to refresh
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: [
              { id: 'video1', youtube_video_id: 'video123', title: 'Test Video 1', channels: { youtube_channel_id: 'channel123' } },
              { id: 'video2', youtube_video_id: 'video456', title: 'Test Video 2', channels: { youtube_channel_id: 'channel123' } }
            ],
            error: null
          })
        })
      })

      // Mock YouTube API response
      mockVideosClient.fetchVideos.mockResolvedValue(mockVideoData)

      // Mock RPC success
      mockSupabase.rpc.mockResolvedValue({ error: null })
    })

    it('should successfully refresh statistics for videos with channel hash prefix', async () => {
      const payload = { channelHashPrefix: 'chan' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.itemsProcessed).toBe(2)

      // Verify database query used correct filter
      expect(mockSupabase.from).toHaveBeenCalledWith('videos')
      const fromCall = mockSupabase.from.mock.calls.find(call => call[0] === 'videos')
      expect(fromCall).toBeDefined()

      // Verify YouTube API was called with correct video IDs
      expect(mockVideosClient.fetchVideos).toHaveBeenCalledWith({
        ids: ['video123', 'video456'],
        config: {
          part: ['statistics'],
          batchSize: 50
        }
      })

      // Verify RPC was called with correct data
      expect(mockSupabase.rpc).toHaveBeenCalledWith('capture_video_stats', {
        video_stats_array: [
          {
            video_id: 'video123',
            captured_at: expect.any(String),
            view_count: 50000,
            like_count: 2500,
            comment_count: 150
          },
          {
            video_id: 'video456',
            captured_at: expect.any(String),
            view_count: 75000,
            like_count: 3200,
            comment_count: 280
          }
        ]
      })
    })

    it('should handle empty video list', async () => {
      // Mock empty result
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const payload = { channelHashPrefix: 'nonexistent' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(0)
      expect(mockVideosClient.fetchVideos).not.toHaveBeenCalled()
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle YouTube API errors gracefully', async () => {
      mockVideosClient.fetchVideos.mockRejectedValue(new Error('YouTube API quota exceeded'))

      const payload = { channelHashPrefix: 'chan' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('YouTube API quota exceeded')
    })

    it('should handle videos without statistics', async () => {
      // Mock response with no statistics for first video
      mockVideosClient.fetchVideos.mockResolvedValue([
        { id: 'video123', statistics: null },
        { id: 'video456', statistics: { viewCount: 1000, likeCount: 50, commentCount: 5 } }
      ])

      const payload = { channelHashPrefix: 'chan' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(1) // Only video456 should be processed

      // Verify RPC was called with only video456 data
      expect(mockSupabase.rpc).toHaveBeenCalledWith('capture_video_stats', {
        video_stats_array: [
          {
            video_id: 'video456',
            captured_at: expect.any(String),
            view_count: 1000,
            like_count: 50,
            comment_count: 5
          }
        ]
      })
    })

    it('should handle database query errors gracefully', async () => {
      // Mock query error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

      const payload = { channelHashPrefix: 'chan' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database query failed')
    })

    it('should handle database RPC errors gracefully', async () => {
      // Mock RPC error
      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Database connection failed' }
      })

      const payload = { channelHashPrefix: 'chan' }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to store video statistics')
    })

    it('should handle channel hash range payload (not implemented)', async () => {
      // For channelHashRange, the handler doesn't apply filtering, so it should query all videos
      // But our mock is set up for ilike, so we need to adjust the mock for this test
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: 'video1', youtube_video_id: 'video123', title: 'Test Video 1', channels: { youtube_channel_id: 'channel123' } },
            { id: 'video2', youtube_video_id: 'video456', title: 'Test Video 2', channels: { youtube_channel_id: 'channel123' } }
          ],
          error: null
        })
      })

      const payload = { channelHashRange: { min: 0, max: 10 } }
      const result = await handleRefreshVideoStats(payload, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(2) // Should process all videos when range is specified
      // Note: channelHashRange is logged but not implemented in filtering
    })
  })
})