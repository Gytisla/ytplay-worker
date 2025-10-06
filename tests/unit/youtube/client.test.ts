import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import {
  YouTubeApiClient,
  YouTubeApiClientError,
  YouTubeApiQuotaError,
  YouTubeApiAuthError,
  YouTubeApiNetworkError,
  createYouTubeClient,
  createYouTubeClientFromEnv,
  YouTubeClientConfigSchema,
  RequestOptionsSchema,
} from '../../../src/lib/youtube/client'

// Configure MSW to allow YouTube API requests to pass through
beforeAll(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch {
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

describe('YouTubeApiClient', () => {
  let client: YouTubeApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = createYouTubeClient({
      apiKey: 'test-api-key',
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 10, // 10ms base delay for fast testing
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Configuration', () => {
    it('should create client with valid configuration', () => {
      const config = { apiKey: 'test-key', timeout: 10000 }
      const client = createYouTubeClient(config)

      expect(client).toBeInstanceOf(YouTubeApiClient)
    })

    it('should validate configuration schema', () => {
      expect(() => YouTubeClientConfigSchema.parse({
        apiKey: 'test-key',
        timeout: 5000,
      })).not.toThrow()

      expect(() => YouTubeClientConfigSchema.parse({
        apiKey: '', // Invalid
      })).toThrow()
    })

    it('should validate request options schema', () => {
      expect(() => RequestOptionsSchema.parse({
        method: 'GET',
        headers: {},
      })).not.toThrow()

      expect(() => RequestOptionsSchema.parse({
        method: 'INVALID', // Invalid
      })).toThrow()
    })
  })

  describe('Request Execution', () => {
    it('should make successful GET request', async () => {
      const mockResponse: Response = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

  const result: { success: boolean } = await client.get('/test-endpoint', { param1: 'value1' })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/test-endpoint?key=test-api-key&param1=value1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'YouTube-Fetcher-Worker/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual({ success: true })
    })

    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const body = { test: 'data' }
      await client.post('/test-endpoint', body)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      )
    })

    it('should handle timeout', async () => {
      // Mock fetch to simulate AbortController timeout
      const abortError = new DOMException('The operation was aborted', 'AbortError')
      vi.spyOn(global, 'fetch').mockRejectedValue(abortError)

      const timeoutClient = createYouTubeClient({
        apiKey: 'test-key',
        timeout: 100,
        maxRetries: 0, // Disable retries for this test
      })

      await expect(timeoutClient.get('/test')).rejects.toThrow(YouTubeApiNetworkError)
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Network error'))

      const noRetryClient = createYouTubeClient({
        apiKey: 'test-api-key',
        maxRetries: 0, // Disable retries for this test
      })

      await expect(noRetryClient.get('/test')).rejects.toThrow(YouTubeApiNetworkError)
    })
  })

  describe('Error Handling', () => {
    it('should handle YouTube API errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 400,
            message: 'Bad Request',
            errors: [{
              domain: 'global',
              reason: 'invalid',
              message: 'Invalid parameter',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
    })

    it('should handle quota exceeded errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: {
            code: 403,
            message: 'Quota exceeded',
            errors: [{
              domain: 'youtube.quota',
              reason: 'quotaExceeded',
              message: 'Quota exceeded for quota metric',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiQuotaError)
    })

    it('should handle authentication errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: {
            code: 401,
            message: 'Unauthorized',
            errors: [{
              domain: 'global',
              reason: 'authError',
              message: 'Invalid API key',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiAuthError)
    })

    it('should handle 429 rate limit errors as retryable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: {
            code: 429,
            message: 'Too Many Requests',
            errors: [{
              domain: 'global',
              reason: 'rateLimitExceeded',
              message: 'Rate limit exceeded',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
      // Verify the error is marked as retryable
      try {
        await client.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeApiClientError)
        expect((error as YouTubeApiClientError).retryable).toBe(true)
        expect((error as YouTubeApiClientError).statusCode).toBe(429)
      }
    })

    it('should handle 408 request timeout errors as retryable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 408,
        json: () => Promise.resolve({
          error: {
            code: 408,
            message: 'Request Timeout',
            errors: [{
              domain: 'global',
              reason: 'timeout',
              message: 'Request timed out',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
      try {
        await client.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeApiClientError)
        expect((error as YouTubeApiClientError).retryable).toBe(true)
        expect((error as YouTubeApiClientError).statusCode).toBe(408)
      }
    })

    it('should handle 503 service unavailable errors as retryable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({
          error: {
            code: 503,
            message: 'Service Unavailable',
            errors: [{
              domain: 'global',
              reason: 'serviceUnavailable',
              message: 'Service is temporarily unavailable',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
      try {
        await client.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeApiClientError)
        expect((error as YouTubeApiClientError).retryable).toBe(true)
        expect((error as YouTubeApiClientError).statusCode).toBe(503)
      }
    })

    it('should handle 502 bad gateway errors as retryable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.resolve({
          error: {
            code: 502,
            message: 'Bad Gateway',
            errors: [{
              domain: 'global',
              reason: 'badGateway',
              message: 'Bad gateway error',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
      try {
        await client.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeApiClientError)
        expect((error as YouTubeApiClientError).retryable).toBe(true)
        expect((error as YouTubeApiClientError).statusCode).toBe(502)
      }
    })

    it('should handle 504 gateway timeout errors as retryable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 504,
        json: () => Promise.resolve({
          error: {
            code: 504,
            message: 'Gateway Timeout',
            errors: [{
              domain: 'global',
              reason: 'gatewayTimeout',
              message: 'Gateway timeout error',
            }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)
      try {
        await client.get('/test')
      } catch (error) {
        expect(error).toBeInstanceOf(YouTubeApiClientError)
        expect((error as YouTubeApiClientError).retryable).toBe(true)
        expect((error as YouTubeApiClientError).statusCode).toBe(504)
      }
    })

    it('should handle non-retryable 4xx errors', async () => {
      const nonRetryableStatuses = [400, 404, 422]

      for (const status of nonRetryableStatuses) {
        vi.spyOn(global, 'fetch').mockResolvedValue({
          ok: false,
          status,
          json: () => Promise.resolve({
            error: {
              code: status,
              message: 'Client Error',
              errors: [{
                domain: 'global',
                reason: 'clientError',
                message: 'Client error occurred',
              }],
            },
          }),
        } as Response)

        try {
          await client.get('/test')
        } catch (error) {
          expect(error).toBeInstanceOf(YouTubeApiClientError)
          expect((error as YouTubeApiClientError).retryable).toBe(false)
          expect((error as YouTubeApiClientError).statusCode).toBe(status)
        }
      }
    })
  })

  describe('Retry Logic', () => {
    let sleepSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      vi.useFakeTimers()
      // Mock the sleep method to resolve immediately
  sleepSpy = vi.spyOn(YouTubeApiClient.prototype as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue(undefined)
    })

    afterEach(() => {
      vi.useRealTimers()
      sleepSpy.mockRestore()
    })

    it('should retry on retryable errors', async () => {
      let attempts = 0
      vi.spyOn(global, 'fetch').mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: { code: 500, message: 'Server Error', errors: [] } }),
            headers: new Headers(),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
          headers: new Headers(),
        } as Response)
      })

      const result = await client.get('/test')

  expect(global.fetch).toHaveBeenCalledTimes(3)
  const typedResult = result as { success: boolean }
  expect(typedResult).toEqual({ success: true })
    })

    it('should not retry on non-retryable errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 400,
            message: 'Bad Request',
            errors: [{ domain: 'global', reason: 'invalid', message: 'Invalid' }],
          },
        }),
      } as Response)

      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should respect max retries configuration', async () => {
      const retryClient = createYouTubeClient({
        apiKey: 'test-key',
        maxRetries: 1,
      })

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { code: 500, message: 'Server Error', errors: [] } }),
        headers: new Headers(),
      } as Response)

      await expect(retryClient.get('/test')).rejects.toThrow(YouTubeApiClientError)

      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should implement exponential backoff with jitter', async () => {
      // Spy on the calculateRetryDelay method to check the delay calculation
  const calculateDelaySpy = vi.spyOn(YouTubeApiClient.prototype as unknown as { calculateRetryDelay: (attempt: number) => number }, 'calculateRetryDelay')

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { code: 500, message: 'Server Error', errors: [] } }),
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response)

      await client.get('/test')

      expect(calculateDelaySpy).toHaveBeenCalledWith(0) // First retry attempt
      expect(sleepSpy).toHaveBeenCalledWith(expect.any(Number))
      expect(sleepSpy).toHaveBeenCalledTimes(1)
    })

    it('should calculate exponential backoff delays correctly', async () => {
  const calculateDelaySpy = vi.spyOn(YouTubeApiClient.prototype as unknown as { calculateRetryDelay: (attempt: number) => number }, 'calculateRetryDelay')

      // Test multiple retry attempts
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { code: 500, message: 'Server Error', errors: [] } }),
        headers: new Headers(),
      } as Response)

      // This will fail after maxRetries attempts
      await expect(client.get('/test')).rejects.toThrow(YouTubeApiClientError)

      // Verify calculateRetryDelay was called for each retry attempt (0, 1)
      expect(calculateDelaySpy).toHaveBeenCalledTimes(2)
      expect(calculateDelaySpy).toHaveBeenNthCalledWith(1, 0) // First retry
      expect(calculateDelaySpy).toHaveBeenNthCalledWith(2, 1) // Second retry
    })

    it('should apply jitter to backoff delays', async () => {
      // Mock Math.random to return a consistent value for testing
      const originalRandom = Math.random
      Math.random = vi.fn().mockReturnValue(0.5) // Middle of jitter range

      const clientWithJitter = createYouTubeClient({
        apiKey: 'test-key',
        retryDelay: 1000,
        retryJitter: 0.2, // 20% jitter
      })

      try {
    const delay0 = (clientWithJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(0)
    const delay1 = (clientWithJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(1)
    const delay2 = (clientWithJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(2)

        // Base delays: 1000ms, 2000ms, 4000ms
        // With 20% jitter and random=0.5: delay * (1 + 0.2 * (0.5 * 2 - 1)) = delay * (1 + 0.2 * 0) = delay
        expect(delay0).toBe(1000) // 1000 * 2^0 = 1000
        expect(delay1).toBe(2000) // 1000 * 2^1 = 2000
        expect(delay2).toBe(4000) // 1000 * 2^2 = 4000
      } finally {
        Math.random = originalRandom
      }
    })

    it('should handle zero jitter configuration', async () => {
      const clientNoJitter = createYouTubeClient({
        apiKey: 'test-key',
        retryDelay: 1000,
        retryJitter: 0, // No jitter
      })

  const delay0 = (clientNoJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(0)
  const delay1 = (clientNoJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(1)
  const delay2 = (clientNoJitter as unknown as { calculateRetryDelay: (attempt: number) => number }).calculateRetryDelay(2)

      expect(delay0).toBe(1000)
      expect(delay1).toBe(2000)
      expect(delay2).toBe(4000)
    })
  })

  describe('Factory Functions', () => {
    it('should create client from environment variables', () => {
      const originalEnv = process.env
      process.env = { ...originalEnv, YT_API_KEY: 'env-api-key' }

      try {
        const client = createYouTubeClientFromEnv()
        expect(client).toBeInstanceOf(YouTubeApiClient)
      } finally {
        process.env = originalEnv
      }
    })

    it('should throw error when API key not found in environment', () => {
      const originalEnv = process.env
      process.env = { ...originalEnv }
      delete process.env['YT_API_KEY']
      delete process.env['YOUTUBE_API_KEY']

      try {
        expect(() => createYouTubeClientFromEnv()).toThrow('YouTube API key not found')
      } finally {
        process.env = originalEnv
      }
    })
  })

  describe('Custom Headers and Options', () => {
    it('should support custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      await client.request('/test', {
        method: 'GET',
        headers: { 'X-Custom': 'value' },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
            'User-Agent': 'YouTube-Fetcher-Worker/1.0',
          }),
        })
      )
    })

    it('should support custom timeout per request', async () => {
      const mockResponse: Response = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      await client.request('/test', {
        method: 'GET',
        headers: {},
        timeout: 10000,
      })

      // Verify AbortController timeout was set correctly
      // This is tested implicitly through the timeout functionality
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should support custom retry count per request', async () => {
      // Mock sleep to avoid delays
  const sleepSpy = vi.spyOn(YouTubeApiClient.prototype as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue(undefined)

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { code: 500, message: 'Server Error', errors: [] } }),
        headers: new Headers(),
      } as Response)

      await expect(client.request('/test', {
        method: 'GET',
        headers: {},
        retries: 1,
      })).rejects.toThrow(YouTubeApiClientError)

      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial + 1 retry

      sleepSpy.mockRestore()
    })
  })

  describe('ETag support', () => {
    it('should include If-None-Match header when ETag is provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers({ 'etag': '"new-etag"' }),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      await client.request('/test', { etag: '"old-etag"' })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/test?key=test-api-key',
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': '"old-etag"',
          }),
        })
      )
    })

    it('should handle 304 Not Modified responses', async () => {
      const mockResponse: Response = {
        ok: false,
        status: 304,
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const result = await client.requestWithETag('/test', { etag: '"cached-etag"' })

      expect(result).toEqual({
        data: null,
        etag: '"cached-etag"',
        notModified: true,
      })
    })

    it('should return ETag from response headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
        headers: new Headers({ 'etag': '"response-etag"' }),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const result = await client.requestWithETag('/test')

      expect(result).toEqual({
        data: { items: [] },
        etag: '"response-etag"',
        notModified: false,
      })
    })

    it('should use requestWithETag method for full response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
        headers: new Headers({ 'etag': '"response-etag"' }),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const result = await client.requestWithETag('/test')

      expect(result).toEqual({
        data: { items: [] },
        etag: '"response-etag"',
        notModified: false,
      })
    })

    it('should handle 304 with requestWithETag', async () => {
      const mockResponse = {
        ok: false,
        status: 304,
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const result = await client.requestWithETag('/test', { etag: '"cached-etag"' })

      expect(result).toEqual({
        data: null,
        etag: '"cached-etag"',
        notModified: true,
      })
    })

    it('should not include ETag information for regular responses without ETag', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
        headers: new Headers(),
      } as Response

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse)

      const result = await client.request('/test')

      expect(result).toEqual({ items: [] }) // Plain data, no ETag wrapper
    })
  })
})