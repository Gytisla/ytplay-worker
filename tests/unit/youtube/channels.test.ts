import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { YouTubeApiClient } from '../../../src/lib/youtube/client'
import { YouTubeChannelsClient, createYouTubeChannelsClient } from '../../../src/lib/youtube/channels'
import type { ChannelsListResponse, ChannelResource } from '../../../src/lib/youtube/types'

// Configure MSW to allow YouTube API requests to pass through
beforeAll(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch (e) {
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
// Mock Data
// ============================================================================

const mockChannel1: ChannelResource = {
  kind: 'youtube#channel',
  etag: 'etag1',
  id: 'UC1234567890',
  snippet: {
    title: 'Test Channel 1',
    description: 'A test channel',
    publishedAt: '2020-01-01T00:00:00Z',
    thumbnails: {
      default: {
        url: 'https://example.com/thumb1.jpg',
        width: 88,
        height: 88,
      },
    },
  },
  statistics: {
    viewCount: '1000000',
    subscriberCount: '50000',
    hiddenSubscriberCount: false,
    videoCount: '100',
  },
}

const mockChannel2: ChannelResource = {
  kind: 'youtube#channel',
  etag: 'etag2',
  id: 'UC0987654321',
  snippet: {
    title: 'Test Channel 2',
    description: 'Another test channel',
    publishedAt: '2020-01-02T00:00:00Z',
    thumbnails: {
      default: {
        url: 'https://example.com/thumb2.jpg',
        width: 88,
        height: 88,
      },
    },
  },
  statistics: {
    viewCount: '2000000',
    subscriberCount: '75000',
    hiddenSubscriberCount: false,
    videoCount: '150',
  },
}

const mockChannelsResponse: ChannelsListResponse = {
  kind: 'youtube#channelListResponse',
  etag: 'channels-etag',
  pageInfo: {
    totalResults: 2,
    resultsPerPage: 2,
  },
  items: [mockChannel1, mockChannel2],
}

// ============================================================================
// Mock Server Handlers
// ============================================================================

// ============================================================================
// Mock Server Handlers
// ============================================================================

beforeEach(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch (e) {
    // Ignore if not running
  }

  // Add handlers for YouTube API
  server.use(
    http.get('https://www.googleapis.com/youtube/v3/channels', ({ request }) => {
      const url = new URL(request.url)
      const ids = url.searchParams.get('id')?.split(',') || []

      console.log('MSW intercepted request for IDs:', ids)

      // Handle quota error test
      if (ids.includes('UCquota')) {
        return HttpResponse.json(
          {
            error: {
              code: 403,
              message: 'quotaExceeded',
              errors: [{
                domain: 'youtube.quota',
                reason: 'quotaExceeded',
                message: 'Quota exceeded for quota metric',
              }],
            },
          },
          { status: 403 }
        )
      }

      // Simulate different responses based on requested IDs
      if (ids.includes('UC1234567890') && ids.includes('UC0987654321')) {
        return HttpResponse.json(mockChannelsResponse)
      } else if (ids.includes('UC1234567890')) {
        return HttpResponse.json({
          ...mockChannelsResponse,
          items: [mockChannel1],
          pageInfo: { totalResults: 1, resultsPerPage: 1 },
        })
      } else if (ids.includes('UC0987654321')) {
        return HttpResponse.json({
          ...mockChannelsResponse,
          items: [mockChannel2],
          pageInfo: { totalResults: 1, resultsPerPage: 1 },
        })
      } else if (ids.includes('UCnotfound')) {
        return HttpResponse.json({
          ...mockChannelsResponse,
          items: [],
          pageInfo: { totalResults: 0, resultsPerPage: 0 },
        })
      } else if (ids.length > 0) {
        // For batch testing, create mock channels for any IDs
        const mockChannels = ids.map((id, index) => ({
          ...mockChannel1,
          id,
          snippet: {
            ...mockChannel1.snippet,
            title: `Channel ${index + 1}`,
          },
        }))
        return HttpResponse.json({
          ...mockChannelsResponse,
          items: mockChannels,
          pageInfo: { totalResults: mockChannels.length, resultsPerPage: mockChannels.length },
        })
      }

      return HttpResponse.json(mockChannelsResponse)
    })
  )

  // Start server with bypass for unhandled requests
  server.listen({ onUnhandledRequest: 'bypass' })
})

// ============================================================================
// Test Suite
// ============================================================================

describe('YouTubeChannelsClient', () => {
  let client: YouTubeApiClient
  let channelsClient: YouTubeChannelsClient
  let sleepSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    client = new YouTubeApiClient({ apiKey: 'test-api-key' })
    channelsClient = new YouTubeChannelsClient(client)

    // Mock the sleep method to resolve immediately for faster tests
    sleepSpy = vi.spyOn(YouTubeApiClient.prototype as any, 'sleep').mockResolvedValue(undefined)
  })

  afterEach(() => {
    sleepSpy.mockRestore()
  })

  describe('fetchChannels', () => {
    it('should fetch multiple channels in a single batch', async () => {
      const result = await channelsClient.fetchChannels({
        ids: ['UC1234567890', 'UC0987654321'],
      })

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('UC1234567890')
      expect(result[1]?.id).toBe('UC0987654321')
      expect(result[0]?.snippet?.title).toBe('Test Channel 1')
      expect(result[1]?.snippet?.title).toBe('Test Channel 2')
    })

    it('should fetch channels in multiple batches when exceeding batch size', async () => {
      // Create 60 channel IDs to force 2 batches (batch size 50)
      const channelIds = Array.from({ length: 60 }, (_, i) => `UC${i.toString().padStart(10, '0')}`)

      // Mock responses for batches
      server.use(
        http.get('https://www.googleapis.com/youtube/v3/channels', ({ request }) => {
          const url = new URL(request.url)
          const ids = url.searchParams.get('id')?.split(',') || []

          if (ids.length === 50) {
            // First batch
            const items = ids.map(id => ({
              ...mockChannel1,
              id,
            }))
            return HttpResponse.json({
              kind: 'youtube#channelListResponse',
              etag: 'batch1-etag',
              pageInfo: { totalResults: 50, resultsPerPage: 50 },
              items,
            })
          } else if (ids.length === 10) {
            // Second batch
            const items = ids.map(id => ({
              ...mockChannel2,
              id,
            }))
            return HttpResponse.json({
              kind: 'youtube#channelListResponse',
              etag: 'batch2-etag',
              pageInfo: { totalResults: 10, resultsPerPage: 10 },
              items,
            })
          }

          return HttpResponse.json(mockChannelsResponse)
        })
      )

      const result = await channelsClient.fetchChannels({
        ids: channelIds,
        config: { batchSize: 50, part: ['snippet', 'statistics'] },
      })

      expect(result).toHaveLength(60)
      expect(result.slice(0, 50).every(c => c.snippet?.title === 'Test Channel 1')).toBe(true)
      expect(result.slice(50).every(c => c.snippet?.title === 'Test Channel 2')).toBe(true)
    })

    it('should handle empty results for non-existent channels', async () => {
      const result = await channelsClient.fetchChannels({
        ids: ['UCnotfound'],
      })

      expect(result).toHaveLength(0)
    })

    it('should apply custom configuration', async () => {
      const result = await channelsClient.fetchChannels({
        ids: ['UC1234567890'],
        config: {
          part: ['snippet', 'statistics', 'status'],
          fields: 'items(id,snippet(title),statistics)',
          batchSize: 50,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('UC1234567890')
    })

    it('should validate input parameters', async () => {
      await expect(
        channelsClient.fetchChannels({
          ids: [], // Empty array should fail
        })
      ).rejects.toThrow('At least one channel ID is required')
    })

    it('should handle API errors gracefully', async () => {
      await expect(
        channelsClient.fetchChannels({
          ids: ['UCquota'],
        })
      ).rejects.toThrow('YouTube API quota exceeded')
    })
  })

  describe('fetchChannel', () => {
    it('should fetch a single channel', async () => {
      const result = await channelsClient.fetchChannel('UC1234567890')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('UC1234567890')
      expect(result?.snippet?.title).toBe('Test Channel 1')
    })

    it('should return null for non-existent channel', async () => {
      const result = await channelsClient.fetchChannel('UCnotfound')

      expect(result).toBeNull()
    })

    it('should apply custom configuration', async () => {
      const result = await channelsClient.fetchChannel('UC1234567890', {
        part: ['snippet'],
      })

      expect(result).not.toBeNull()
      expect(result?.id).toBe('UC1234567890')
    })
  })

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultClient = new YouTubeChannelsClient(client)
      expect(defaultClient).toBeDefined()
    })

    it('should merge default and custom configuration', async () => {
      const customClient = new YouTubeChannelsClient(client, {
        part: ['snippet', 'statistics'],
        batchSize: 25,
      })

      const result = await customClient.fetchChannel('UC1234567890', {
        part: ['snippet'], // Should override default
      })

      expect(result).not.toBeNull()
    })
  })

  describe('batching logic', () => {
    it('should split large arrays into correct batch sizes', () => {
      const channelsClient = new YouTubeChannelsClient(client, { batchSize: 10 })
      const channelIds = Array.from({ length: 25 }, (_, i) => `UC${i}`)

      // Access private method for testing
      const batches = (channelsClient as any).chunkArray(channelIds, 10)

      expect(batches).toHaveLength(3)
      expect(batches[0]).toHaveLength(10)
      expect(batches[1]).toHaveLength(10)
      expect(batches[2]).toHaveLength(5)
    })

    it('should handle batch sizes larger than array', () => {
      const channelsClient = new YouTubeChannelsClient(client, { batchSize: 10 })
      const channelIds = ['UC1', 'UC2']

      const batches = (channelsClient as any).chunkArray(channelIds, 10)

      expect(batches).toHaveLength(1)
      expect(batches[0]).toHaveLength(2)
    })
  })
})

describe('createYouTubeChannelsClient', () => {
  it('should create a channels client with provided API client', () => {
    const apiClient = new YouTubeApiClient({ apiKey: 'test-key' })
    const channelsClient = createYouTubeChannelsClient(apiClient)

    expect(channelsClient).toBeInstanceOf(YouTubeChannelsClient)
  })

  it('should create a channels client with default config', () => {
    const apiClient = new YouTubeApiClient({ apiKey: 'test-key' })
    const channelsClient = createYouTubeChannelsClient(apiClient, {
      batchSize: 25,
    })

    expect(channelsClient).toBeInstanceOf(YouTubeChannelsClient)
  })
})

// Note: createYouTubeChannelsClientFromEnv is not tested here as it requires
// environment variables and would need integration testing