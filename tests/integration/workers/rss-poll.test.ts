import { describe, it, expect, beforeEach, vi } from 'vitest'
import { handleRSSPollChannel } from '../../../supabase/functions/workers/handlers/rss-poll'

// Use vi.__mock__ to expose mock instances safely
// Mock the RSS operations module used by the handler (supabase/functions copy)
vi.mock('../../../supabase/functions/workers/rss', async () => {
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

// Mock DatabaseOperations module used for upserting videos
vi.mock('../../../supabase/functions/workers/db', async () => {
  const mockDBOps = {
    getChannelById: vi.fn(),
    upsertChannel: vi.fn(),
    upsertVideos: vi.fn()
  }
  const mock = { mockDBOps }
  ;(vi as any).__mock__ = { ...((vi as any).__mock__ ?? {}), db: mock }
  return {
    DatabaseOperations: vi.fn().mockImplementation(() => mockDBOps)
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
  // Prefer importing the mocked modules and invoking their mocked constructors.
  // This avoids timing issues where vi.__mock__ may not be populated yet.
  return (async () => {
  const rssMod = await import('../../../supabase/functions/workers/rss')
    const parserMod = await import('../../../src/lib/rss/parser')
  const stateMod = await import('../../../src/lib/rss/state')
  const dbMod = await import('../../../supabase/functions/workers/db')

    const mockRSSOps = typeof (rssMod as any).RSSPollingOperations === 'function'
      ? (rssMod as any).RSSPollingOperations()
      : (vi as any).__mock__?.rss?.mockRSSOps

    const mockParser = typeof (parserMod as any).RSSParser === 'function'
      ? (parserMod as any).RSSParser()
      : (vi as any).__mock__?.parser?.mockParser

    const mockFeedStateManager = (stateMod as any).FeedStateManager ?? (vi as any).__mock__?.state?.mockFeedStateManager
    const mockDBOps = typeof (dbMod as any).DatabaseOperations === 'function'
      ? (dbMod as any).DatabaseOperations()
      : (vi as any).__mock__?.db?.mockDBOps

    return {
      mockRSSOps,
      mockParser,
      mockFeedStateManager,
      mockDBOps,
      mockFetch
    }
  })()
}

describe('RSS_POLL_CHANNEL (integration - mocked DB/HTTP)', () => {
  beforeEach(async () => {
    const { mockRSSOps, mockParser, mockFetch, mockDBOps } = await getMocks()
    mockRSSOps.getChannelFeed.mockClear()
    mockRSSOps.updateFeedState.mockClear()
    mockRSSOps.updateFeedStateAfterError.mockClear()
    mockRSSOps.enqueueVideoJobs.mockClear()
    mockDBOps.getChannelById?.mockClear()
    mockDBOps.upsertChannel?.mockClear()
    mockDBOps.upsertVideos?.mockClear()
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
  mockDBOps.getChannelById?.mockResolvedValue({ id: 'uuid-channel-1' })
  mockDBOps.upsertChannel?.mockResolvedValue(undefined)
  mockDBOps.upsertVideos?.mockResolvedValue(undefined)
    mockParser.parseFeed.mockReturnValue([])
    mockRSSOps.updateFeedState.mockImplementation((s: any, headers: any) => ({
      ...s,
      lastETag: headers?.etag ?? s.lastETag,
      lastModified: headers?.lastModified ?? s.lastModified,
      lastPolledAt: new Date()
    }))
  })

  it('polls feed, parses and enqueues new videos', async () => {
  const { mockRSSOps, mockParser, mockFetch, mockDBOps } = await getMocks()

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
  // Ensure DB upsert happened for discovered videos
  expect(mockDBOps.upsertVideos).toHaveBeenCalled()
  const upsertArgs = mockDBOps.upsertVideos.mock.calls[0][0]
  expect(Array.isArray(upsertArgs)).toBe(true)
  expect(upsertArgs.map((v: any) => v.youtube_video_id)).toEqual(expect.arrayContaining(['video123']))
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
