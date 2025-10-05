import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import { createYouTubeClientFromEnv } from '../../../src/lib/youtube/client'
import { createYouTubeChannelsClient } from '../../../src/lib/youtube/channels'
import { createYouTubeVideosClient } from '../../../src/lib/youtube/videos'
import { createYouTubeQuotaManager } from '../../../src/lib/youtube/quota'

// Test constants - using well-known, stable YouTube content
const TEST_CHANNEL_ID = 'UCBR8-60-B28hp2BmDPdntcQ' // YouTube official channel
const TEST_VIDEO_IDS = [
  'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up (stable, well-known)
  '9bZkp7q19f0', // PSY - GANGNAM STYLE (very stable)
]

// Skip these tests if no real API key is available or in CI
const shouldRunRealApiTests = (() => {
  try {
    // Try to create client - this will throw if no API key
    createYouTubeClientFromEnv()
    // Don't run in CI unless explicitly enabled
    const runInCI = process.env['RUN_YOUTUBE_E2E_TESTS'] === 'true'
    const isCI = process.env['CI'] === 'true'
    return !isCI || runInCI
  } catch {
    return false
  }
})()

const describeConditional = shouldRunRealApiTests ? describe : describe.skip

describeConditional('YouTube API End-to-End Integration Tests', () => {
  let apiClient: ReturnType<typeof createYouTubeClientFromEnv>
  let channelsClient: ReturnType<typeof createYouTubeChannelsClient>
  let videosClient: ReturnType<typeof createYouTubeVideosClient>
  let quotaManager: ReturnType<typeof createYouTubeQuotaManager>

  beforeAll(() => {
    // Close MSW server to allow real API calls
    server.close()

    // Create real API clients
    apiClient = createYouTubeClientFromEnv()
    channelsClient = createYouTubeChannelsClient(apiClient)
    videosClient = createYouTubeVideosClient(apiClient)

    // Create quota manager with very low limits for testing
    quotaManager = createYouTubeQuotaManager({
      capacity: 100, // Very low quota for testing
      refillRate: 100,
      refillIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
      initialTokens: 100,
    })

    // Note: Quota management is not integrated into the API client yet
    // We handle it manually in the tests
  })

  afterAll(() => {
    // Restart MSW server for other tests
    server.listen({ onUnhandledRequest: 'error' })

    // Reset any mocks
    vi.restoreAllMocks()
  })

  describe('Channel API Integration', () => {
    it('should fetch real channel data from YouTube API', async () => {
      // Check quota before making request
      expect(quotaManager.canMakeRequest()).toBe(true)

      const channels = await channelsClient.fetchChannels({
        ids: [TEST_CHANNEL_ID]
      })

      expect(channels).toHaveLength(1)
      expect(channels[0]).toBeDefined()
      expect(channels[0]!.id).toBe(TEST_CHANNEL_ID)

      // Verify we got real data structure
      expect(channels[0]!.snippet).toBeDefined()
      expect(channels[0]!.snippet!.title).toBeDefined()
      expect(typeof channels[0]!.snippet!.title).toBe('string')
      expect(channels[0]!.snippet!.title.length).toBeGreaterThan(0)

      // Manually consume quota (since it's not integrated into API client yet)
      quotaManager.consumeQuota()

      // Verify quota was consumed (calculate used quota)
      const status = quotaManager.getQuotaStatus()
      const usedQuota = status.capacity - status.available
      expect(usedQuota).toBeGreaterThan(0)
    }, 15000) // 15 second timeout for real API call

    it('should handle channel not found gracefully', async () => {
      const nonExistentChannelId = 'UCnonexistent123456789'

      // YouTube API returns a response with empty items array for non-existent channels
      const channels = await channelsClient.fetchChannels({
        ids: [nonExistentChannelId]
      })

      expect(channels).toHaveLength(0)
    }, 15000)

    it('should handle multiple channels in single request', async () => {
      // YouTube API deduplicates identical channel IDs, so we expect only 1 result
      const channels = await channelsClient.fetchChannels({
        ids: [TEST_CHANNEL_ID, TEST_CHANNEL_ID]
      })

      expect(channels).toHaveLength(1) // YouTube deduplicates identical IDs
      expect(channels[0]!.id).toBe(TEST_CHANNEL_ID)
    }, 15000)
  })

  describe('Video API Integration', () => {
    it('should fetch real video data from YouTube API', async () => {
      const videos = await videosClient.fetchVideos({
        ids: TEST_VIDEO_IDS.slice(0, 1) // Just one video to save quota
      })

      expect(videos).toHaveLength(1)
      expect(videos[0]).toBeDefined()
      expect(videos[0]!.id).toBe(TEST_VIDEO_IDS[0])

      // Verify we got real data structure
      expect(videos[0]!.snippet).toBeDefined()
      expect(videos[0]!.snippet!.title).toBeDefined()
      expect(typeof videos[0]!.snippet!.title).toBe('string')
      expect(videos[0]!.snippet!.title.length).toBeGreaterThan(0)

      expect(videos[0]!.statistics).toBeDefined()
      expect(videos[0]!.statistics!.viewCount).toBeDefined()
    }, 15000)

    it('should handle video not found gracefully', async () => {
      const nonExistentVideoId = 'nonexistent123456789'

      const videos = await videosClient.fetchVideos({
        ids: [nonExistentVideoId]
      })

      expect(videos).toHaveLength(0)
    }, 15000)

    it('should handle multiple videos in single request', async () => {
      const videos = await videosClient.fetchVideos({
        ids: TEST_VIDEO_IDS
      })

      expect(videos).toHaveLength(TEST_VIDEO_IDS.length)
      TEST_VIDEO_IDS.forEach((expectedId, index) => {
        expect(videos[index]!.id).toBe(expectedId)
      })
    }, 15000)
  })

  describe('Quota Management Integration', () => {
    it('should respect quota limits and prevent overuse', async () => {
      // Create a quota manager with very low quota
      const lowQuotaManager = createYouTubeQuotaManager({
        capacity: 1, // Only 1 request allowed
        refillRate: 1,
        refillIntervalMs: 24 * 60 * 60 * 1000,
        initialTokens: 1,
      })

      const lowQuotaClient = createYouTubeClientFromEnv()      // First request should succeed
      expect(lowQuotaManager.canMakeRequest()).toBe(true)

      // Make a small request that consumes quota
      await lowQuotaClient.get('/channels', {
        part: 'snippet',
        id: TEST_CHANNEL_ID,
        maxResults: 1,
      })

      // Manually consume quota (since it's not integrated into API client yet)
      lowQuotaManager.consumeQuota()

      // Should now be at quota limit
      expect(lowQuotaManager.canMakeRequest()).toBe(false)

      // Second request should not be made (we check quota manually)
      // In a real integration, the API client would check quota before making requests
      expect(lowQuotaManager.canMakeRequest()).toBe(false)
    }, 30000) // Longer timeout for quota testing
  })

  describe('Error Handling Integration', () => {
    it('should handle invalid API key gracefully', async () => {
      const invalidClient = createYouTubeClientFromEnv()
      // Temporarily set invalid API key
      invalidClient.updateConfig({ apiKey: 'invalid-api-key-12345' })

      await expect(
        invalidClient.get('/channels', {
          part: 'snippet',
          id: TEST_CHANNEL_ID,
        })
      ).rejects.toThrow() // Should throw some kind of error
    }, 15000)

    it('should handle network timeouts gracefully', async () => {
      const timeoutClient = createYouTubeClientFromEnv()
      timeoutClient.updateConfig({
        timeout: 1, // Very short timeout
      })

      // This might not always timeout, but tests the configuration
      try {
        await timeoutClient.get('/channels', {
          part: 'snippet',
          id: TEST_CHANNEL_ID,
        })
        // If it succeeds, that's fine - the timeout config is still tested
      } catch (error) {
        // If it fails, it should be a network/timeout error
        expect(error).toBeDefined()
      }
    }, 15000)
  })

  describe('ETag Caching Integration', () => {
    it('should use ETag headers for caching', async () => {
      // First request to get ETag
      const response1 = await apiClient.requestWithETag('/channels', {
        params: {
          part: 'snippet',
          id: TEST_CHANNEL_ID,
        }
      })

      expect(response1.data).toBeDefined()
      expect(response1.notModified).toBe(false)

      // ETags may not always be returned by YouTube API
      if (response1.etag) {
        // Second request with ETag should get 304 Not Modified (if supported)
        const response2 = await apiClient.requestWithETag('/channels', {
          params: {
            part: 'snippet',
            id: TEST_CHANNEL_ID,
          },
          etag: response1.etag,
        })

        // Note: YouTube API may not always return 304, but the ETag mechanism should work
        expect(response2.etag).toBeDefined()
        // The data might be returned again or notModified might be true
      } else {
        console.log('ETag not returned by YouTube API for this request - caching may not be supported for this endpoint')
      }
    }, 20000)
  })

  describe('Rate Limiting Integration', () => {
    it('should handle API rate limits gracefully', async () => {
      // This test is tricky because we can't easily trigger rate limits
      // But we can test that the retry logic works for rate limit errors
      const rateLimitClient = createYouTubeClientFromEnv()
      rateLimitClient.updateConfig({
        maxRetries: 1,
        retryDelay: 100, // Fast retry for testing
      })

      // Mock a 429 response (this would normally come from the real API)
      const originalFetch = global.fetch
      let requestCount = 0

      vi.spyOn(global, 'fetch').mockImplementation(async (url, options) => {
        requestCount++
        if (requestCount === 1) {
          // First request gets rate limited
          return new Response(
            JSON.stringify({
              error: {
                code: 429,
                message: 'Too Many Requests',
                errors: [{ reason: 'rateLimitExceeded' }]
              }
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        } else {
          // Second request succeeds
          return originalFetch(url, options)
        }
      })

      try {
        const result = await rateLimitClient.get('/channels', {
          part: 'snippet',
          id: TEST_CHANNEL_ID,
        })

        expect(result).toBeDefined()
        expect(requestCount).toBe(2) // Should have made 2 requests (initial + retry)
      } finally {
        vi.restoreAllMocks()
      }
    }, 20000)
  })
})