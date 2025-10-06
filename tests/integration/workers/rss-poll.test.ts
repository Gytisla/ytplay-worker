import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleRSSPollChannel } from '../../../src/workers/handlers/rss-poll'

// Use vi.__mock__ to expose mock instances safely
vi.mock('../../../src/workers/rss', async () => {
  const mockRSSOps = {
    getChannelFeed: vi.fn(),
    updateFeedState: vi.fn(),
    updateFeedStateAfterError: vi.fn(),
    enqueueVideoJobs: vi.fn()
  }
  const mock = { mockRSSOps }
  ;(vi as any).__mock__ = { ...((vi as any).__mock__ ?? {}), rss: mock }
  return {
    RSSPollingOperations: vi.fn().mockImplementation(() => mockRSSOps)
  }
})

vi.mock('../../../src/lib/rss/parser', async () => {
  const mockParser = { parseFeed: vi.fn() }
  const mock = { mockParser }
  ;(vi as any).__mock__ = { ...((vi as any).__mock__ ?? {}), parser: mock }
  return {
    RSSParser: vi.fn().mockImplementation(() => mockParser)
  }
})

vi.mock('../../../src/lib/rss/state', async () => {
  const mockFeedStateManager = {
    updateAfterSuccessfulPoll: vi.fn(),
    updateAfterFailedPoll: vi.fn()
  }
  const mock = { mockFeedStateManager }
  ;(vi as any).__mock__ = { ...((vi as any).__mock__ ?? {}), state: mock }
  return {
    FeedStateManager: mockFeedStateManager
  }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

const mockFetch = vi.fn()
global.fetch = mockFetch as any

function getMocks() {
  return {
    mockRSSOps: (vi as any).__mock__.rss.mockRSSOps,
    mockParser: (vi as any).__mock__.parser.mockParser,
    mockFeedStateManager: (vi as any).__mock__.state.mockFeedStateManager,
    mockFetch
  }
}

describe('RSS_POLL_CHANNEL (integration - mocked DB/HTTP)', () => {
  beforeEach(async () => {
    const { mockRSSOps, mockParser, mockFetch } = await getMocks()
    mockRSSOps.getChannelFeed.mockClear()
    mockRSSOps.updateFeedState.mockClear()
    mockRSSOps.updateFeedStateAfterError.mockClear()
    mockRSSOps.enqueueVideoJobs.mockClear()
    mockParser.parseFeed.mockClear()
    mockFetch.mockClear()

    mockRSSOps.getChannelFeed.mockResolvedValue({
      channelId: 'channel123',
      feedUrl: 'https://example.com/rss',
      lastETag: 'etag123',
      lastModified: 'Wed, 21 Oct 2023 07:28:00 GMT',
      lastVideoPublishedAt: new Date('2023-10-01T00:00:00Z'),
      pollIntervalMinutes: 10,
      consecutiveErrors: 0,
      status: 'active'
    })
    mockRSSOps.updateFeedState.mockResolvedValue(undefined)
    mockRSSOps.updateFeedStateAfterError.mockResolvedValue(undefined)
    mockRSSOps.enqueueVideoJobs.mockResolvedValue(undefined)
    mockParser.parseFeed.mockReturnValue([])
    mockRSSOps.updateFeedState.mockImplementation((state) => {
      if (typeof state === 'object' && state !== null) {
        // Assume this is an already updated state from FeedStateManager
        return Promise.resolve(undefined)
      }
      return Promise.reject(new Error('Invalid state passed to updateFeedState'))
    })
  })

  it('polls feed, parses and enqueues new videos', async () => {
    const { mockRSSOps, mockParser, mockFetch } = await getMocks()

    const mockVideos = [
      { videoId: 'video123', publishedAt: new Date('2023-10-02T00:00:00Z') },
      { videoId: 'video456', publishedAt: new Date('2023-09-30T00:00:00Z') }
    ]

    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      headers: { get: (h: string) => (h === 'etag' ? 'new-etag' : h === 'last-modified' ? 'Wed, 22 Oct 2023 07:28:00 GMT' : null) },
      text: () => Promise.resolve('<rss/>')
    })
    mockParser.parseFeed.mockReturnValue(mockVideos)

    const result = await handleRSSPollChannel({ channelId: 'channel123' }, {} as any)
    expect(result.success).toBe(true)
    expect(mockRSSOps.getChannelFeed).toHaveBeenCalledWith('channel123')

    // Fetch called with the feed URL
    expect(mockFetch).toHaveBeenCalled()
    const fetchCallArgs = mockFetch.mock.calls[0]!
    expect(String(fetchCallArgs[0])).toContain('https://example.com/rss')

    // Parser was invoked and enqueue was called with only the new video(s)
    expect(mockParser.parseFeed).toHaveBeenCalled()
    expect(mockRSSOps.enqueueVideoJobs).toHaveBeenCalled()
    const enqueueArgs = mockRSSOps.enqueueVideoJobs.mock.calls[0]
    expect(enqueueArgs[0]).toBe('channel123')
    // ensure the job list contains the newer videoId
    expect(enqueueArgs[1]).toEqual(expect.arrayContaining(['video123']))

    // rssOps.updateFeedState should be called with the updated state (including new headers)
    expect(mockRSSOps.updateFeedState).toHaveBeenCalled()
    const updatedStateArg = mockRSSOps.updateFeedState.mock.calls[0][0]
    expect(updatedStateArg).toHaveProperty('lastETag', 'new-etag')
    expect(updatedStateArg).toHaveProperty('lastModified', 'Wed, 22 Oct 2023 07:28:00 GMT')
  })

  it('returns error when feed configuration missing', async () => {
    const { mockRSSOps } = await getMocks()
    mockRSSOps.getChannelFeed.mockResolvedValue(null)
    const result = await handleRSSPollChannel({ channelId: 'channel123' }, {} as any)
    expect(result.success).toBe(false)
    expect(String(result.error)).toContain('No RSS feed configured')
  })
})
