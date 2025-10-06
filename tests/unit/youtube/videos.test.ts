import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { YouTubeVideosClient, createYouTubeVideosClient } from '../../../src/lib/youtube/videos'
import { createYouTubeClientFromEnv } from '../../../src/lib/youtube/client'
import type { VideoResource } from '../../../src/lib/youtube/types'

// Mock sleep function to speed up tests
vi.mock('./utils', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}))

// ============================================================================
// Mock Data
// ============================================================================

const mockVideo: VideoResource = {
  kind: 'youtube#video',
  etag: 'etag123',
  id: 'dQw4w9WgXcQ',
  snippet: {
    publishedAt: '2023-01-01T00:00:00Z',
    channelId: 'UC1234567890',
    title: 'Test Video',
    description: 'A test video description',
    thumbnails: {
      default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
    },
    channelTitle: 'Test Channel',
    tags: ['test', 'video'],
    categoryId: '22',
    liveBroadcastContent: 'none',
  },
  statistics: {
    viewCount: '1000000',
    likeCount: '50000',
    commentCount: '1000',
  },
  contentDetails: {
    duration: 'PT4M13S',
    dimension: '2d',
    definition: 'hd',
    caption: 'false',
    licensedContent: true,
    projection: 'rectangular',
  },
}

// Configure MSW to allow YouTube API requests to pass through
beforeAll(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch (_) {
    // Ignore if not running
  }

  // Restart server with bypass for unhandled requests (needed for YouTube API)
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

afterAll(() => {
  server.close()
})

// ============================================================================
// MSW Handlers
// ============================================================================

const handlers = [
  http.get('https://www.googleapis.com/youtube/v3/videos', ({ request }) => {
    const url = new URL(request.url)
    const ids = url.searchParams.get('id')?.split(',') ?? []

    console.log('MSW intercepted request for IDs:', ids)

    if (ids.includes('UCquota')) {
      return HttpResponse.json({
        error: {
          code: 403,
          message: 'quotaExceeded',
          errors: [{
            domain: 'youtube.quota',
            reason: 'quotaExceeded',
            message: 'YouTube API quota exceeded',
          }],
        },
      }, { status: 403 })
    }

    if (ids.includes('UCnotfound')) {
      return HttpResponse.json({
        kind: 'youtube#videoListResponse',
        etag: 'etag123',
        pageInfo: {
          totalResults: 0,
          resultsPerPage: 1,
        },
        items: [],
      })
    }

    // Generate mock videos for the requested IDs
    const items = ids.map(id => ({
      ...mockVideo,
      id,
    }))

    return HttpResponse.json({
      kind: 'youtube#videoListResponse',
      etag: 'etag123',
      pageInfo: {
        totalResults: items.length,
        resultsPerPage: items.length,
      },
      items,
    })
  })
]

// ============================================================================
// Test Suite
// ============================================================================

describe('YouTubeVideosClient', () => {
  let client: YouTubeVideosClient

  beforeEach(() => {
    server.use(...handlers)
    client = createYouTubeVideosClient(createYouTubeClientFromEnv())
  })

  describe('fetchVideos', () => {
    it('should fetch multiple videos in a single batch', async () => {
      const result = await client.fetchVideos({
        ids: ['dQw4w9WgXcQ', 'dQw4w9WgXcR'],
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('dQw4w9WgXcQ')
      expect(result[1]?.id).toBe('dQw4w9WgXcR')
      expect(result[0]?.kind).toBe('youtube#video')
    })

    it('should fetch videos in multiple batches when exceeding batch size', async () => {
      const videoIds = Array.from({ length: 60 }, (_, i) => `video${i}`)

      const result = await client.fetchVideos({
        ids: videoIds,
        config: { batchSize: 50, part: ['snippet', 'statistics', 'contentDetails'] },
      })

      expect(result).toHaveLength(60)
      expect(result[0]?.id).toBe('video0')
      expect(result[59]?.id).toBe('video59')
    })

    it('should handle empty results for non-existent videos', async () => {
      const result = await client.fetchVideos({
        ids: ['UCnotfound'],
      })

      expect(result).toHaveLength(0)
    })

    it('should apply custom configuration', async () => {
      const result = await client.fetchVideos({
        ids: ['dQw4w9WgXcQ'],
        config: {
          part: ['snippet'],
          fields: 'items(id,snippet(title))',
          batchSize: 50,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('dQw4w9WgXcQ')
      expect(result[0]?.snippet?.title).toBe('Test Video')
    })

    it('should validate input parameters', async () => {
      await expect(client.fetchVideos({ ids: [] })).rejects.toThrow('At least one video ID is required')
    })

    it('should handle API errors gracefully', async () => {
      await expect(client.fetchVideos({ ids: ['UCquota'] })).rejects.toThrow('YouTube API quota exceeded')
    })
  })

  describe('fetchVideo', () => {
    it('should fetch a single video', async () => {
      const result = await client.fetchVideo({ id: 'dQw4w9WgXcQ' })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('dQw4w9WgXcQ')
      expect(result?.kind).toBe('youtube#video')
    })

    it('should return null for non-existent video', async () => {
      const result = await client.fetchVideo({ id: 'UCnotfound' })

      expect(result).toBeNull()
    })

    it('should apply custom configuration', async () => {
      const result = await client.fetchVideo({
        id: 'dQw4w9WgXcQ',
        config: { part: ['snippet'], batchSize: 50 },
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('dQw4w9WgXcQ')
    })
  })

  describe('configuration', () => {
    it('should use default configuration', async () => {
      const result = await client.fetchVideos({ ids: ['dQw4w9WgXcQ'] })

      expect(result).toHaveLength(1)
      expect(result[0]?.statistics).toBeDefined()
      expect(result[0]?.contentDetails).toBeDefined()
    })

    it('should merge default and custom configuration', async () => {
      const customClient = createYouTubeVideosClient(createYouTubeClientFromEnv(), {
        part: ['snippet'],
        batchSize: 25,
      })

      const result = await customClient.fetchVideos({ ids: ['dQw4w9WgXcQ'] })

      expect(result).toHaveLength(1)
      expect(result[0]?.snippet).toBeDefined()
    })
  })

  describe('batching logic', () => {
    it('should split large arrays into correct batch sizes', () => {
      const client = new (YouTubeVideosClient as any)(createYouTubeClientFromEnv())
      const array = Array.from({ length: 100 }, (_, i) => `item${i}`)
      const batches = client.chunkArray(array, 30)

      expect(batches).toHaveLength(4)
      expect(batches[0]).toHaveLength(30)
      expect(batches[1]).toHaveLength(30)
      expect(batches[2]).toHaveLength(30)
      expect(batches[3]).toHaveLength(10)
    })

    it('should handle batch sizes larger than array', () => {
      const client = new (YouTubeVideosClient as any)(createYouTubeClientFromEnv())
      const array = ['item1', 'item2']
      const batches = client.chunkArray(array, 10)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toHaveLength(2)
    })
  })
})

describe('createYouTubeVideosClient', () => {
  it('should create a videos client with provided API client', () => {
    const apiClient = createYouTubeClientFromEnv()
    const videosClient = createYouTubeVideosClient(apiClient)

    expect(videosClient).toBeInstanceOf(YouTubeVideosClient)
  })

  it('should create a videos client with default config', () => {
    const videosClient = createYouTubeVideosClient(createYouTubeClientFromEnv())

    expect(videosClient).toBeInstanceOf(YouTubeVideosClient)
  })
})