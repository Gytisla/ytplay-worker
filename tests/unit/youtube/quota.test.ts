import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TokenBucket, YouTubeQuotaManager, createYouTubeQuotaManagerFromEnv, createYouTubeQuotaManager } from '../../../src/lib/youtube/quota'

// ============================================================================
// Test Suite
// ============================================================================

describe('TokenBucket', () => {
  let bucket: TokenBucket

  beforeEach(() => {
    bucket = new TokenBucket({
      capacity: 100,
      refillRate: 50,
      refillIntervalMs: 100, // 100ms for faster testing
      initialTokens: 50,
    })
  })

  describe('initialization', () => {
    it('should initialize with correct capacity and tokens', () => {
      expect(bucket.getTokens()).toBe(50)
      expect(bucket.getCapacity()).toBe(100)
    })

    it('should not exceed capacity on initialization', () => {
      const smallBucket = new TokenBucket({
        capacity: 10,
        refillRate: 50,
        refillIntervalMs: 1000,
        initialTokens: 50,
      })

      expect(smallBucket.getTokens()).toBe(10)
    })
  })

  describe('token consumption', () => {
    it('should consume tokens when available', () => {
      expect(bucket.consume(10)).toBe(true)
      expect(bucket.getTokens()).toBe(40)
    })

    it('should not consume tokens when insufficient', () => {
      expect(bucket.consume(60)).toBe(false)
      expect(bucket.getTokens()).toBe(50)
    })

    it('should check availability without consuming', () => {
      expect(bucket.canConsume(10)).toBe(true)
      expect(bucket.getTokens()).toBe(50) // Tokens unchanged

      expect(bucket.canConsume(60)).toBe(false)
      expect(bucket.getTokens()).toBe(50) // Tokens unchanged
    })
  })

  describe('refilling', () => {
    it('should refill tokens over time', async () => {
      // Consume all tokens
      bucket.consume(50)
      expect(bucket.getTokens()).toBe(0)

      // Wait for refill interval
      await new Promise(resolve => setTimeout(resolve, 110))

      // Should have refilled
      expect(bucket.getTokens()).toBe(50)
    })

    it('should not exceed capacity during refill', async () => {
      // Consume some tokens
      bucket.consume(20)
      expect(bucket.getTokens()).toBe(30)

      // Wait for multiple refill intervals
      await new Promise(resolve => setTimeout(resolve, 210))

      // Should be capped at capacity
      expect(bucket.getTokens()).toBe(100)
    })

    it('should calculate time until next refill', () => {
      const timeUntilRefill = bucket.getTimeUntilRefill()
      expect(timeUntilRefill).toBeGreaterThan(0)
      expect(timeUntilRefill).toBeLessThanOrEqual(100)
    })
  })

  describe('usage statistics', () => {
    it('should calculate usage percentage correctly', () => {
      expect(bucket.getUsagePercentage()).toBe(50) // 50/100 = 50%

      bucket.consume(25)
      expect(bucket.getUsagePercentage()).toBe(75) // 75/100 = 75%
    })

    it('should handle zero usage', () => {
      const fullBucket = new TokenBucket({
        capacity: 100,
        refillRate: 50,
        refillIntervalMs: 1000,
        initialTokens: 100,
      })

      expect(fullBucket.getUsagePercentage()).toBe(0)
    })

    it('should handle full usage', () => {
      bucket.consume(50)
      expect(bucket.getUsagePercentage()).toBe(100)
    })
  })

  describe('control methods', () => {
    it('should force refill', () => {
      bucket.consume(50)
      expect(bucket.getTokens()).toBe(0)

      bucket.forceRefill()
      expect(bucket.getTokens()).toBe(100)
    })

    it('should reset bucket', () => {
      expect(bucket.getTokens()).toBe(50)

      bucket.reset()
      expect(bucket.getTokens()).toBe(0)
    })
  })
})

describe('YouTubeQuotaManager', () => {
  let manager: YouTubeQuotaManager

  beforeEach(() => {
    manager = new YouTubeQuotaManager({
      capacity: 100,
      refillRate: 50,
      refillIntervalMs: 100, // 100ms for faster testing
      initialTokens: 50,
    })
  })

  describe('quota checking', () => {
    it('should check if request can be made', () => {
      expect(manager.canMakeRequest()).toBe(true)

      // Consume all tokens
      manager.getTokenBucket().consume(50)
      expect(manager.canMakeRequest()).toBe(false)
    })

    it('should consume quota for requests', () => {
      expect(manager.consumeQuota()).toBe(true)
      expect(manager.getQuotaStatus().available).toBe(49)

      // Consume remaining tokens
      for (let i = 0; i < 49; i++) {
        manager.consumeQuota()
      }

      expect(manager.consumeQuota()).toBe(false)
      expect(manager.getQuotaStatus().available).toBe(0)
    })
  })

  describe('quota status', () => {
    it('should provide comprehensive quota status', () => {
      const status = manager.getQuotaStatus()

      expect(status).toHaveProperty('available')
      expect(status).toHaveProperty('capacity')
      expect(status).toHaveProperty('usagePercentage')
      expect(status).toHaveProperty('timeUntilRefill')
      expect(status).toHaveProperty('canMakeRequest')

      expect(status.capacity).toBe(100)
      expect(status.available).toBe(50)
      expect(status.usagePercentage).toBe(50)
      expect(status.canMakeRequest).toBe(true)
    })

    it('should reflect changes in status', () => {
      let status = manager.getQuotaStatus()
      expect(status.available).toBe(50)

      manager.consumeQuota()
      status = manager.getQuotaStatus()
      expect(status.available).toBe(49)
      expect(status.usagePercentage).toBe(51)
    })
  })

  describe('custom cost per request', () => {
    it('should support custom cost per request', () => {
      const highCostManager = new YouTubeQuotaManager({
        capacity: 100,
        refillRate: 50,
        refillIntervalMs: 1000,
        initialTokens: 50,
      }, 10) // 10 tokens per request

      expect(highCostManager.canMakeRequest()).toBe(true)
      expect(highCostManager.consumeQuota()).toBe(true)

      const status = highCostManager.getQuotaStatus()
      expect(status.available).toBe(40) // 50 - 10
    })
  })
})

describe('createYouTubeQuotaManagerFromEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create manager with default quota limit', () => {
    delete process.env['YOUTUBE_API_QUOTA_LIMIT']

    const manager = createYouTubeQuotaManagerFromEnv()
    const status = manager.getQuotaStatus()

    expect(status.capacity).toBe(10000)
    expect(status.available).toBe(10000)
  })

  it('should create manager with custom quota limit', () => {
    process.env['YOUTUBE_API_QUOTA_LIMIT'] = '5000'

    const manager = createYouTubeQuotaManagerFromEnv()
    const status = manager.getQuotaStatus()

    expect(status.capacity).toBe(5000)
    expect(status.available).toBe(5000)
  })

  it('should handle invalid quota limit gracefully', () => {
    process.env['YOUTUBE_API_QUOTA_LIMIT'] = 'invalid'

    const manager = createYouTubeQuotaManagerFromEnv()
    const status = manager.getQuotaStatus()

    expect(status.capacity).toBe(10000) // Falls back to default
    expect(status.available).toBe(10000)
  })
})

describe('createYouTubeQuotaManager', () => {
  it('should create manager with default config', () => {
    const manager = createYouTubeQuotaManager()
    const status = manager.getQuotaStatus()

    expect(status.capacity).toBe(10000)
    expect(status.available).toBe(0) // Default initial tokens is 0
  })

  it('should create manager with custom config', () => {
    const manager = createYouTubeQuotaManager({
      capacity: 500,
      initialTokens: 250,
    })

    const status = manager.getQuotaStatus()
    expect(status.capacity).toBe(500)
    expect(status.available).toBe(250)
  })
})