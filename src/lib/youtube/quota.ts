import { z } from 'zod'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for quota management
 */
export const QuotaConfigSchema = z.object({
  capacity: z.number().int().positive('Capacity must be positive').default(10000),
  refillRate: z.number().positive('Refill rate must be positive').default(10000),
  refillIntervalMs: z.number().int().positive('Refill interval must be positive').default(24 * 60 * 60 * 1000),
  initialTokens: z.number().int().min(0).default(0),
}).optional().default({})

export type QuotaConfig = z.infer<typeof QuotaConfigSchema>

// ============================================================================
// Quota Management Classes
// ============================================================================

/**
 * Token bucket implementation for quota management
 */
export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number
  private readonly refillIntervalMs: number

  constructor(config: QuotaConfig) {
    this.capacity = config.capacity
    this.refillRate = config.refillRate
    this.refillIntervalMs = config.refillIntervalMs
    this.tokens = Math.min(config.initialTokens, this.capacity)
    this.lastRefill = Date.now()
  }

  /**
   * Refill tokens based on elapsed time since last refill
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const intervals = Math.floor(elapsed / this.refillIntervalMs)

    if (intervals > 0) {
      const tokensToAdd = intervals * this.refillRate
      this.tokens = Math.min(this.tokens + tokensToAdd, this.capacity)
      this.lastRefill = now - (elapsed % this.refillIntervalMs)
    }
  }

  /**
   * Check if tokens are available without consuming them
   */
  canConsume(tokens: number = 1): boolean {
    this.refill()
    return this.tokens >= tokens
  }

  /**
   * Consume tokens if available
   */
  consume(tokens: number = 1): boolean {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill()
    return this.tokens
  }

  /**
   * Get capacity
   */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * Get usage percentage (0-100)
   */
  getUsagePercentage(): number {
    this.refill()
    return ((this.capacity - this.tokens) / this.capacity) * 100
  }

  /**
   * Get time until next refill in milliseconds
   */
  getTimeUntilRefill(): number {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    return Math.max(0, this.refillIntervalMs - (elapsed % this.refillIntervalMs))
  }

  /**
   * Force refill (for testing)
   */
  forceRefill(): void {
    this.tokens = this.capacity
    this.lastRefill = Date.now()
  }

  /**
   * Reset bucket to empty (for testing)
   */
  reset(): void {
    this.tokens = 0
    this.lastRefill = Date.now()
  }
}

/**
 * YouTube API quota manager using token bucket algorithm
 */
export class YouTubeQuotaManager {
  private bucket: TokenBucket
  private readonly costPerRequest: number

  constructor(config?: Partial<QuotaConfig>, costPerRequest: number = 1) {
    const validatedConfig = QuotaConfigSchema.parse(config)
    this.bucket = new TokenBucket(validatedConfig)
    this.costPerRequest = costPerRequest
  }

  /**
   * Check if quota is available for a request
   */
  canMakeRequest(): boolean {
    return this.bucket.canConsume(this.costPerRequest)
  }

  /**
   * Consume quota for a request
   */
  consumeQuota(): boolean {
    return this.bucket.consume(this.costPerRequest)
  }

  /**
   * Get current quota status
   */
  getQuotaStatus() {
    return {
      available: this.bucket.getTokens(),
      capacity: this.bucket.getCapacity(),
      usagePercentage: this.bucket.getUsagePercentage(),
      timeUntilRefill: this.bucket.getTimeUntilRefill(),
      canMakeRequest: this.canMakeRequest(),
    }
  }

  /**
   * Get the underlying token bucket (for advanced operations)
   */
  getTokenBucket(): TokenBucket {
    return this.bucket
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create quota manager from environment variables
 */
export function createYouTubeQuotaManagerFromEnv(): YouTubeQuotaManager {
  const quotaLimitStr = process.env['YOUTUBE_API_QUOTA_LIMIT'] ?? '10000'
  const quotaLimit = parseInt(quotaLimitStr, 10)

  // Validate that quotaLimit is a valid number
  if (isNaN(quotaLimit) || quotaLimit <= 0) {
    console.warn(`Invalid YOUTUBE_API_QUOTA_LIMIT: ${quotaLimitStr}, using default of 10000`)
    return new YouTubeQuotaManager({
      capacity: 10000,
      refillRate: 10000,
      refillIntervalMs: 24 * 60 * 60 * 1000,
      initialTokens: 10000,
    })
  }

  return new YouTubeQuotaManager({
    capacity: quotaLimit,
    refillRate: quotaLimit, // Daily refill
    refillIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
    initialTokens: quotaLimit, // Start with full quota
  })
}

/**
 * Create quota manager with custom configuration
 */
export function createYouTubeQuotaManager(config?: Partial<QuotaConfig>): YouTubeQuotaManager {
  return new YouTubeQuotaManager(config)
}