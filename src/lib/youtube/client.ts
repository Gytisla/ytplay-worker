import { z } from 'zod'
import {
  YouTubeApiErrorSchema,
  type YouTubeApiError,
} from './types'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * YouTube API client configuration
 */
export const YouTubeClientConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().default('https://www.googleapis.com/youtube/v3'),
  timeout: z.number().int().positive().default(30000), // 30 seconds
  maxRetries: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().positive().default(1000), // 1 second base delay
  retryJitter: z.number().min(0).max(1).default(0.1), // 10% jitter
  userAgent: z.string().default('YouTube-Fetcher-Worker/1.0'),
})

export type YouTubeClientConfig = z.infer<typeof YouTubeClientConfigSchema>

/**
 * HTTP request options
 */
export const RequestOptionsSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string()).default({}),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.unknown().optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().min(0).optional(),
  etag: z.string().optional(), // ETag for conditional requests
})

export type RequestOptions = z.infer<typeof RequestOptionsSchema>

/**
 * API response wrapper with ETag information
 */
export interface ApiResponse<T> {
  data: T
  etag?: string
  notModified?: boolean // true if 304 Not Modified
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for YouTube API errors
 */
export class YouTubeApiClientError extends Error {
  public readonly code: string
  public readonly statusCode?: number | undefined
  public readonly retryable: boolean
  public readonly details?: YouTubeApiError | undefined

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    retryable: boolean = false,
    details?: YouTubeApiError
  ) {
    super(message)
    this.name = 'YouTubeApiClientError'
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
    this.details = details
  }
}

/**
 * Network error class
 */
export class YouTubeApiNetworkError extends YouTubeApiClientError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode, true)
    this.name = 'YouTubeApiNetworkError'
  }
}

/**
 * Quota exceeded error
 */
export class YouTubeApiQuotaError extends YouTubeApiClientError {
  constructor(details?: YouTubeApiError) {
    super('YouTube API quota exceeded', 'QUOTA_EXCEEDED', 403, false, details)
    this.name = 'YouTubeApiQuotaError'
  }
}

/**
 * Authentication error
 */
export class YouTubeApiAuthError extends YouTubeApiClientError {
  constructor(details?: YouTubeApiError) {
    super('YouTube API authentication failed', 'AUTH_ERROR', 401, false, details)
    this.name = 'YouTubeApiAuthError'
  }
}

// ============================================================================
// HTTP Client Implementation
// ============================================================================

/**
 * Base HTTP client for YouTube Data API v3
 */
export class YouTubeApiClient {
  private config: YouTubeClientConfig

  constructor(config: Partial<YouTubeClientConfig> = {}) {
    this.config = YouTubeClientConfigSchema.parse(config)
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<YouTubeClientConfig>): void {
    this.config = YouTubeClientConfigSchema.parse({ ...this.config, ...config })
  }

  /**
   * Make a request to the YouTube API with automatic retries
   */
  async request<T>(
    endpoint: string,
    options: Partial<RequestOptions> = {}
  ): Promise<T> {
    const validatedOptions = RequestOptionsSchema.parse(options)
    const maxRetries = validatedOptions.retries ?? this.config.maxRetries
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.makeRequest<T>(endpoint, validatedOptions)
        
        // Unwrap ApiResponse for regular requests
        if (result && typeof result === 'object' && 'data' in result && 'notModified' in result) {
          return (result as ApiResponse<T>).data
        }
        
        return result
      } catch (error) {
        lastError = error as Error

        // Don't retry on the last attempt or non-retryable errors
        if (attempt === maxRetries || !(error instanceof YouTubeApiClientError) || !error.retryable) {
          throw error
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt)
        console.warn(`YouTube API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message)

        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /**
   * Make a request and return full response with ETag information
   */
  async requestWithETag<T>(
    endpoint: string,
    options: Partial<RequestOptions> = {}
  ): Promise<ApiResponse<T>> {
    const validatedOptions = RequestOptionsSchema.parse(options)
    const maxRetries = validatedOptions.retries ?? this.config.maxRetries
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.makeRequest<ApiResponse<T>>(endpoint, validatedOptions)
        return result
      } catch (error) {
        lastError = error as Error

        // Don't retry on the last attempt or non-retryable errors
        if (attempt === maxRetries || !(error instanceof YouTubeApiClientError) || !error.retryable) {
          throw error
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt)
        console.warn(`YouTube API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message)

        await this.sleep(delay)
      }
    }

    throw lastError!
  }

  /**
   * Make a single HTTP request without retries
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params)
    const headers = this.buildHeaders(options.headers, options.etag)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.config.timeout)

    try {
      console.debug(`YouTube API ${options.method} ${url}`)

      const response = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 304 Not Modified (ETag match)
      if (response.status === 304) {
        return {
          data: null as unknown as T,
          etag: options.etag, // Return the ETag that was sent
          notModified: true,
        } as T
      }

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleHttpError(response)
      }

      // Parse JSON response
      const data = await response.json()

      // Validate response is not an error
      const errorValidation = YouTubeApiErrorSchema.safeParse(data)
      if (errorValidation.success) {
        throw this.createApiError(errorValidation.data)
      }

      // Check if we should return ApiResponse format
      const etag = response.headers.get('etag') || undefined
      return {
        data,
        etag,
        notModified: false,
      } as T

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new YouTubeApiNetworkError(`Request timeout after ${options.timeout ?? this.config.timeout}ms`)
      }

      if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
        throw new YouTubeApiNetworkError(`Network error: ${error.message}`)
      }

      throw error
    }
  }

  /**
   * Build the full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    // Build base URL
    let baseUrl = this.config.baseUrl
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    // Combine base URL and endpoint
    const url = new URL(baseUrl + cleanEndpoint)

    // Add API key to all requests
    url.searchParams.set('key', this.config.apiKey)

    // Add additional parameters
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    return url.toString()
  }

  /**
   * Build request headers
   */
  private buildHeaders(additionalHeaders: Record<string, string> = {}, etag?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...additionalHeaders,
    }

    // Add If-None-Match header if ETag is provided
    if (etag) {
      headers['If-None-Match'] = etag
    }

    return headers
  }

  /**
   * Handle HTTP error responses
   */
  private async handleHttpError(response: Response): Promise<never> {
    let errorData: YouTubeApiError | undefined

    try {
      const data = await response.json()
      const validation = YouTubeApiErrorSchema.safeParse(data)
      if (validation.success) {
        errorData = validation.data
      }
    } catch {
      // Ignore JSON parsing errors for error responses
    }

    throw this.createApiError(errorData, response.status)
  }

  /**
   * Create appropriate error instance from API error data
   */
  private createApiError(errorData?: YouTubeApiError, statusCode?: number): YouTubeApiClientError {
    if (!errorData) {
      return new YouTubeApiNetworkError(`HTTP ${statusCode}`, statusCode)
    }

    const error = errorData.error
    const isQuotaError = error.errors.some(e => e.reason === 'quotaExceeded')
    const isAuthError = statusCode === 401 || statusCode === 403

    if (isQuotaError) {
      return new YouTubeApiQuotaError(errorData)
    }

    if (isAuthError) {
      return new YouTubeApiAuthError(errorData)
    }

    // Check if error is retryable (5xx or specific 4xx codes)
    const retryable = statusCode! >= 500 || statusCode === 429 || statusCode === 408 || statusCode === 503

    return new YouTubeApiClientError(
      error.message,
      error.errors[0]?.reason || 'UNKNOWN_ERROR',
      statusCode,
      retryable,
      errorData
    )
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay * Math.pow(2, attempt)
    const jitter = baseDelay * this.config.retryJitter * (Math.random() * 2 - 1) // ±jitter%
    return Math.floor(baseDelay + jitter)
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ============================================================================
  // Convenience Methods for Specific Endpoints
  // ============================================================================

  /**
   * GET request convenience method
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers: {}, params })
  }

  /**
   * POST request convenience method
   */
  async post<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', headers: {}, body, params })
  }

  /**
   * PUT request convenience method
   */
  async put<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', headers: {}, body, params })
  }

  /**
   * DELETE request convenience method
   */
  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers: {}, params })
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a YouTube API client with default configuration
 */
export function createYouTubeClient(config: Partial<YouTubeClientConfig> = {}): YouTubeApiClient {
  return new YouTubeApiClient(config)
}

/**
 * Create a YouTube API client from environment variables
 */
export function createYouTubeClientFromEnv(): YouTubeApiClient {
  const apiKey = process.env['YT_API_KEY'] || process.env['YOUTUBE_API_KEY']
  if (!apiKey) {
    throw new Error('YouTube API key not found. Set YT_API_KEY or YOUTUBE_API_KEY environment variable.')
  }

  return new YouTubeApiClient({ apiKey })
}