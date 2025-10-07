import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleRefreshHotVideos } from '../../../supabase/functions/workers/handlers/hot-videos'

// Mock the YouTube API clients
const mockVideosClient = {
  fetchVideos: vi.fn()
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockResolvedValue({
        data: [
          { id: 'video1', youtube_video_id: 'video123' },
          { id: 'video2', youtube_video_id: 'video456' }
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

describe('REFRESH_HOT_VIDEOS Handler Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockVideosClient.fetchVideos.mockClear()
    mockSupabase.rpc.mockClear()
  })

  describe('Hot Videos Refresh Process', () => {
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
      // Mock database query for hot videos
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [
              { id: 'video1', youtube_video_id: 'video123' },
              { id: 'video2', youtube_video_id: 'video456' }
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

    it('should successfully refresh statistics for hot videos', async () => {
      const result = await handleRefreshHotVideos({}, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.itemsProcessed).toBe(2)

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

    it('should handle empty hot videos list', async () => {
      // Mock empty result
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const result = await handleRefreshHotVideos({}, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.itemsProcessed).toBe(0)
      expect(mockVideosClient.fetchVideos).not.toHaveBeenCalled()
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle YouTube API errors gracefully', async () => {
      mockVideosClient.fetchVideos.mockRejectedValue(new Error('YouTube API quota exceeded'))

      const result = await handleRefreshHotVideos({}, mockSupabase as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('YouTube API quota exceeded')
    })

    it('should handle videos without statistics', async () => {
      // Mock response with no statistics for first video
      mockVideosClient.fetchVideos.mockResolvedValue([
        { id: 'video123', statistics: null },
        { id: 'video456', statistics: { viewCount: 1000, likeCount: 50, commentCount: 5 } }
      ])

      const result = await handleRefreshHotVideos({}, mockSupabase as any)

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

    it('should handle database errors gracefully', async () => {
      // Mock RPC error
      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Database connection failed' }
      })

      const result = await handleRefreshHotVideos({}, mockSupabase as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to store video statistics')
    })
  })
})