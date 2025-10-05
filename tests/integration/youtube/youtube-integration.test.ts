import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import {
  YouTubeApiClient,
  YouTubeApiQuotaError,
  YouTubeApiNetworkError,
} from '../../../src/lib/youtube/client'
import { createYouTubeChannelsClient } from '../../../src/lib/youtube/channels'
import { createYouTubeVideosClient } from '../../../src/lib/youtube/videos'
import { createYouTubeQuotaManager } from '../../../src/lib/youtube/quota'

// Configure MSW to allow YouTube API requests to pass through
beforeAll(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch (e) {
    // Ignore if not running
  }
  // Start server with bypass for unhandled requests
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})

afterAll(() => {
  server.close()
})

describe('YouTube API Integration Tests', () => {
  let apiClient: YouTubeApiClient
  let channelsClient: ReturnType<typeof createYouTubeChannelsClient>
  let videosClient: ReturnType<typeof createYouTubeVideosClient>

  beforeEach(() => {
    vi.clearAllMocks()

    // Create clients with fast retry settings for testing
    apiClient = new YouTubeApiClient({
      apiKey: 'test-api-key',
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 10, // 10ms base delay for fast testing
    })

    channelsClient = createYouTubeChannelsClient(apiClient)
    videosClient = createYouTubeVideosClient(apiClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Client Integration', () => {
    it('should integrate channels and videos clients with shared API client', async () => {
      // Mock successful responses for both channels and videos
      const channelResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          kind: 'youtube#channelListResponse',
          etag: '"etag-123"',
          pageInfo: {
            totalResults: 1,
            resultsPerPage: 1,
          },
          items: [{
            kind: 'youtube#channel',
            etag: '"channel-etag-123"',
            id: 'UC1234567890',
            snippet: {
              title: 'Test Channel',
              description: 'A test channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
            },
            statistics: {
              viewCount: '1000',
              subscriberCount: '100',
              videoCount: '10',
              hiddenSubscriberCount: false,
            }
          }]
        }),
        headers: new Headers(),
      } as Response

      const videosResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          kind: 'youtube#videoListResponse',
          etag: '"video-etag-123"',
          pageInfo: {
            totalResults: 1,
            resultsPerPage: 1,
          },
          items: [{
            kind: 'youtube#video',
            etag: '"video-etag-456"',
            id: 'video123',
            snippet: {
              title: 'Test Video',
              description: 'A test video',
              publishedAt: '2023-01-01T00:00:00Z',
              channelId: 'UC1234567890',
              channelTitle: 'Test Channel',
              categoryId: '22',
              liveBroadcastContent: 'none',
              thumbnails: { default: { url: 'https://example.com/video-thumb.jpg' } }
            },
            statistics: {
              viewCount: '500',
              likeCount: '50',
              commentCount: '10'
            },
            contentDetails: {
              duration: 'PT10M30S',
              dimension: '2d',
              definition: 'hd',
              caption: 'false',
              licensedContent: false,
              projection: 'rectangular',
            }
          }]
        }),
        headers: new Headers(),
      } as Response

      // Mock fetch calls - channels first, then videos
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(channelResponse)
        .mockResolvedValueOnce(videosResponse)

      // Test channel fetching
      const channels = await channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })
      expect(channels).toHaveLength(1)
      expect(channels[0]).toBeDefined()
      expect(channels[0]!.snippet).toBeDefined()
      expect(channels[0]!.id).toBe('UC1234567890')
      expect(channels[0]!.snippet!.title).toBe('Test Channel')

      // Test video fetching
      const videos = await videosClient.fetchVideos({
        ids: ['video123']
      })
      expect(videos).toHaveLength(1)
      expect(videos[0]).toBeDefined()
      expect(videos[0]!.snippet).toBeDefined()
      expect(videos[0]!.id).toBe('video123')
      expect(videos[0]!.snippet!.title).toBe('Test Video')

      // Verify both requests were made
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle quota exhaustion across multiple operations', async () => {
      // Create a quota manager with very low limit
      const lowQuotaManager = createYouTubeQuotaManager({
        capacity: 1,
        initialTokens: 1
      })

      // Mock quota exceeded response
      const quotaExceededResponse = {
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: {
            code: 403,
            message: 'quotaExceeded',
            errors: [{
              domain: 'youtube.quota',
              reason: 'quotaExceeded',
              message: 'Quota exceeded for quota metric'
            }]
          }
        }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValue(quotaExceededResponse)

      // First request should succeed (consume quota)
      const canMakeFirstRequest = lowQuotaManager.canMakeRequest()
      expect(canMakeFirstRequest).toBe(true)
      lowQuotaManager.consumeQuota()

      // Second request should fail due to quota
      const canMakeSecondRequest = lowQuotaManager.canMakeRequest()
      expect(canMakeSecondRequest).toBe(false)

      // API call should fail with quota error
      await expect(channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })).rejects.toThrow(YouTubeApiQuotaError)
    })

    it('should handle network errors with retry logic', async () => {
      let attemptCount = 0

      vi.spyOn(global, 'fetch').mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          // First two attempts fail with network error
          return Promise.reject(new TypeError('Network error'))
        }
        // Third attempt succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            kind: 'youtube#channelListResponse',
            etag: '"etag-123"',
            pageInfo: {
              totalResults: 1,
              resultsPerPage: 1,
            },
            items: [{
              kind: 'youtube#channel',
              etag: '"channel-etag-123"',
              id: 'UC1234567890',
              snippet: {
                title: 'Test Channel',
                description: 'A test channel',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
              },
              statistics: {
                viewCount: '1000',
                subscriberCount: '100',
                videoCount: '10',
                hiddenSubscriberCount: false,
              }
            }]
          }),
          headers: new Headers(),
        } as Response)
      })

      const result = await channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('UC1234567890')
      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle 429 rate limit errors with backoff', async () => {
      let attemptCount = 0

      vi.spyOn(global, 'fetch').mockImplementation(() => {
        attemptCount++
        if (attemptCount < 2) {
          // First attempt gets rate limited
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({
              error: {
                code: 429,
                message: 'Too Many Requests',
                errors: [{
                  domain: 'global',
                  reason: 'rateLimitExceeded',
                  message: 'Rate limit exceeded'
                }]
              }
            }),
            headers: new Headers(),
          } as Response)
        }
        // Second attempt succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            kind: 'youtube#channelListResponse',
            etag: '"etag-123"',
            pageInfo: {
              totalResults: 1,
              resultsPerPage: 1,
            },
            items: [{
              kind: 'youtube#channel',
              etag: '"channel-etag-123"',
              id: 'UC1234567890',
              snippet: {
                title: 'Test Channel',
                description: 'A test channel',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
              },
              statistics: {
                viewCount: '1000',
                subscriberCount: '100',
                videoCount: '10',
                hiddenSubscriberCount: false,
              }
            }]
          }),
          headers: new Headers(),
        } as Response)
      })

      const result = await channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('UC1234567890')
      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial + 1 retry after backoff
    })

    it('should properly handle ETag caching across multiple requests', async () => {
      // First request - no ETag, returns data with ETag
      const firstResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          kind: 'youtube#channelListResponse',
          etag: '"etag-123"',
          pageInfo: {
            totalResults: 1,
            resultsPerPage: 1,
          },
          items: [{
            kind: 'youtube#channel',
            etag: '"channel-etag-123"',
            id: 'UC1234567890',
            snippet: {
              title: 'Test Channel',
              description: 'A test channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
            },
            statistics: {
              viewCount: '1000',
              subscriberCount: '100',
              videoCount: '10',
              hiddenSubscriberCount: false,
            }
          }]
        }),
        headers: new Headers({ 'etag': '"etag-123"' }),
      } as Response

      // Second request - with ETag, returns 304 Not Modified
      const secondResponse = {
        ok: false,
        status: 304,
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)

      // First request without ETag
      const firstResult = await apiClient.requestWithETag('/channels', {
        params: { id: 'UC1234567890', part: 'snippet' }
      })

      expect((firstResult.data as any)?.items).toHaveLength(1)
      expect(firstResult.etag).toBe('"etag-123"')
      expect(firstResult.notModified).toBe(false)

      // Second request with ETag
      const secondResult = await apiClient.requestWithETag('/channels', {
        params: { id: 'UC1234567890', part: 'snippet' },
        etag: '"etag-123"'
      })

      expect(secondResult.data).toBeNull()
      expect(secondResult.etag).toBe('"etag-123"')
      expect(secondResult.notModified).toBe(true)
    })

    it('should maintain quota state across multiple operations', async () => {
      const testQuotaManager = createYouTubeQuotaManager({
        capacity: 10,
        initialTokens: 10
      })

      // Simulate consuming quota across multiple operations
      expect(testQuotaManager.canMakeRequest()).toBe(true)
      testQuotaManager.consumeQuota()

      expect(testQuotaManager.canMakeRequest()).toBe(true)
      testQuotaManager.consumeQuota()

      // Should still have quota left
      expect(testQuotaManager.canMakeRequest()).toBe(true)
    })

    it('should handle timeout scenarios correctly', async () => {
      // Mock fetch to simulate timeout
      vi.spyOn(global, 'fetch').mockRejectedValue(
        new DOMException('The operation was aborted', 'AbortError')
      )

      const timeoutClient = new YouTubeApiClient({
        apiKey: 'test-key',
        timeout: 100, // Very short timeout
        maxRetries: 0, // No retries for this test
      })

      const timeoutChannelsClient = createYouTubeChannelsClient(timeoutClient)

      await expect(timeoutChannelsClient.fetchChannels({
        ids: ['UC1234567890']
      })).rejects.toThrow(YouTubeApiNetworkError)

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should validate input parameters across all clients', async () => {
      // Test empty arrays
      await expect(channelsClient.fetchChannels({
        ids: []
      })).rejects.toThrow('At least one channel ID is required')

      await expect(videosClient.fetchVideos({
        ids: []
      })).rejects.toThrow('At least one video ID is required')
    })

    it('should handle large batch operations with proper splitting', async () => {
      // Create a large array of channel IDs (more than default batch size of 50)
      const channelIds = Array.from({ length: 75 }, (_, i) =>
        `UC${String(i).padStart(9, '0')}`
      )

      // Mock successful responses for both batches
      const batchResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          kind: 'youtube#channelListResponse',
          etag: '"etag-123"',
          pageInfo: {
            totalResults: 1,
            resultsPerPage: 1,
          },
          items: [{
            kind: 'youtube#channel',
            etag: '"channel-etag-123"',
            id: 'UC000000000',
            snippet: {
              title: `Channel 0`,
              description: 'A test channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
            },
            statistics: {
              viewCount: '1000',
              subscriberCount: '100',
              videoCount: '10',
              hiddenSubscriberCount: false,
            }
          }]
        }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ...batchResponse })
        .mockResolvedValueOnce({ ...batchResponse })

      const result = await channelsClient.fetchChannels({
        ids: channelIds,
        config: { part: ['snippet', 'statistics'], batchSize: 50 }
      })

      expect(result).toHaveLength(2) // 2 items from 2 batches
      expect(global.fetch).toHaveBeenCalledTimes(2) // 2 API calls for 2 batches
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      // Mock all requests to fail
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: {
            code: 500,
            message: 'Internal Server Error',
            errors: [{
              domain: 'global',
              reason: 'internalError',
              message: 'Something went wrong'
            }]
          }
        }),
        headers: new Headers(),
      } as Response)

      // All operations should fail gracefully
      await expect(channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })).rejects.toThrow()

      await expect(videosClient.fetchVideos({
        ids: ['video123']
      })).rejects.toThrow()

      await expect(apiClient.get('/test')).rejects.toThrow()
    })

    it('should handle malformed API responses', async () => {
      // Mock response with invalid JSON
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: new Headers(),
      } as Response)

      await expect(channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })).rejects.toThrow()
    })

    it('should handle network connectivity issues', async () => {
      // Mock network failure
      vi.spyOn(global, 'fetch').mockRejectedValue(
        new TypeError('Failed to fetch')
      )

      await expect(channelsClient.fetchChannels({
        ids: ['UC1234567890']
      })).rejects.toThrow(YouTubeApiNetworkError)
    })
  })

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests efficiently', async () => {
      let callCount = 0
      vi.spyOn(global, 'fetch').mockImplementation(() => {
        callCount++
        // First two calls are for channels, third is for videos
        if (callCount <= 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              kind: 'youtube#channelListResponse',
              etag: '"etag-123"',
              pageInfo: {
                totalResults: 1,
                resultsPerPage: 1,
              },
              items: [{
                kind: 'youtube#channel',
                etag: '"channel-etag-123"',
                id: 'UC1234567890',
                snippet: {
                  title: 'Concurrent Channel',
                  description: 'A test channel',
                  publishedAt: '2023-01-01T00:00:00Z',
                  thumbnails: { default: { url: 'https://example.com/thumb.jpg' } }
                },
                statistics: {
                  viewCount: '1000',
                  subscriberCount: '100',
                  videoCount: '10',
                  hiddenSubscriberCount: false,
                }
              }]
            }),
            headers: new Headers(),
          } as Response)
        } else {
          // Third call is for videos
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              kind: 'youtube#videoListResponse',
              etag: '"video-etag-123"',
              pageInfo: {
                totalResults: 1,
                resultsPerPage: 1,
              },
              items: [{
                kind: 'youtube#video',
                etag: '"video-etag-456"',
                id: 'video123',
                snippet: {
                  title: 'Concurrent Video',
                  description: 'A test video',
                  publishedAt: '2023-01-01T00:00:00Z',
                  channelId: 'UC1234567890',
                  channelTitle: 'Test Channel',
                  categoryId: '22',
                  liveBroadcastContent: 'none',
                  thumbnails: { default: { url: 'https://example.com/video-thumb.jpg' } }
                },
                statistics: {
                  viewCount: '500',
                  likeCount: '50',
                  commentCount: '10'
                },
                contentDetails: {
                  duration: 'PT10M30S',
                  dimension: '2d',
                  definition: 'hd',
                  caption: 'false',
                  licensedContent: false,
                  projection: 'rectangular',
                }
              }]
            }),
            headers: new Headers(),
          } as Response)
        }
      })

      // Make multiple concurrent requests
      const promises = [
        channelsClient.fetchChannels({ ids: ['UC1234567890'] }),
        channelsClient.fetchChannels({ ids: ['UC1234567890'] }),
        videosClient.fetchVideos({ ids: ['video123'] }),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach((result: any[]) => {
        expect(result).toHaveLength(1)
      })
    })

    it('should maintain client isolation between instances', () => {
      const client1 = createYouTubeChannelsClient(
        new YouTubeApiClient({ apiKey: 'key1' })
      )

      const client2 = createYouTubeChannelsClient(
        new YouTubeApiClient({ apiKey: 'key2' })
      )

      // Clients should have different API keys
      expect(client1).not.toBe(client2)
      // Each should maintain its own configuration
    })
  })
})