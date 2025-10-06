import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import { YouTubePlaylistsClient, createYouTubePlaylistsClient } from '../../../src/lib/youtube/playlists'
import { createYouTubeClientFromEnv } from '../../../src/lib/youtube/client'
import type { PlaylistItemResource } from '../../../src/lib/youtube/types'

// Configure MSW to allow YouTube API requests to pass through
beforeAll(() => {
  // Close the global server if it's running
  try {
    server.close()
  } catch {
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

const mockPlaylistItem: PlaylistItemResource = {
  kind: 'youtube#playlistItem',
  etag: 'etag123',
  id: 'PLitem123',
  snippet: {
    publishedAt: '2023-01-01T00:00:00Z',
    channelId: 'UC1234567890',
    title: 'Playlist Video',
    description: 'A video in a playlist',
    thumbnails: {
      default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
    },
    channelTitle: 'Test Channel',
    playlistId: 'PLtest123',
    position: 0,
    resourceId: {
      kind: 'youtube#video',
      videoId: 'dQw4w9WgXcQ',
    },
  },
  contentDetails: {
    videoId: 'dQw4w9WgXcQ',
    videoPublishedAt: '2023-01-01T00:00:00Z',
  },
}

// ============================================================================
// MSW Handlers
// ============================================================================

const handlers = [
  http.get('https://www.googleapis.com/youtube/v3/playlistItems', ({ request }) => {
    const url = new URL(request.url)
    const playlistId = url.searchParams.get('playlistId')
    const pageToken = url.searchParams.get('pageToken')
    const maxResults = parseInt(url.searchParams.get('maxResults') ?? '50')

    console.log('MSW intercepted request for playlist:', playlistId, 'pageToken:', pageToken, 'maxResults:', maxResults)

    if (playlistId === 'PLquota') {
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

    if (playlistId === 'PLempty') {
      return HttpResponse.json({
        kind: 'youtube#playlistItemListResponse',
        etag: 'etag123',
        pageInfo: {
          totalResults: 0,
          resultsPerPage: 0,
        },
        items: [],
      })
    }

    if (playlistId === 'PLsinglepage') {
      const items = [
        { ...mockPlaylistItem, id: 'item1', snippet: { ...mockPlaylistItem.snippet, position: 0 } },
        { ...mockPlaylistItem, id: 'item2', snippet: { ...mockPlaylistItem.snippet, position: 1 } },
      ].slice(0, maxResults) // Respect maxResults

      return HttpResponse.json({
        kind: 'youtube#playlistItemListResponse',
        etag: 'etag123',
        pageInfo: {
          totalResults: 2,
          resultsPerPage: items.length,
        },
        items,
      })
    }

    if (playlistId === 'PLmultipage') {
      if (!pageToken) {
        // First page
        return HttpResponse.json({
          kind: 'youtube#playlistItemListResponse',
          etag: 'etag123',
          nextPageToken: 'page2',
          pageInfo: {
            totalResults: 4,
            resultsPerPage: 2,
          },
          items: [
            { ...mockPlaylistItem, id: 'item1', snippet: { ...mockPlaylistItem.snippet, position: 0 } },
            { ...mockPlaylistItem, id: 'item2', snippet: { ...mockPlaylistItem.snippet, position: 1 } },
          ],
        })
      } else if (pageToken === 'page2') {
        // Second page
        return HttpResponse.json({
          kind: 'youtube#playlistItemListResponse',
          etag: 'etag123',
          prevPageToken: 'page1',
          pageInfo: {
            totalResults: 4,
            resultsPerPage: 2,
          },
          items: [
            { ...mockPlaylistItem, id: 'item3', snippet: { ...mockPlaylistItem.snippet, position: 2 } },
            { ...mockPlaylistItem, id: 'item4', snippet: { ...mockPlaylistItem.snippet, position: 3 } },
          ],
        })
      }
    }

    // Default response for other playlist IDs
    return HttpResponse.json({
      kind: 'youtube#playlistItemListResponse',
      etag: 'etag123',
      pageInfo: {
        totalResults: 1,
        resultsPerPage: 1,
      },
      items: [mockPlaylistItem],
    })
  })
]

// ============================================================================
// Test Suite
// ============================================================================

describe('YouTubePlaylistsClient', () => {
  let client: YouTubePlaylistsClient

  beforeEach(() => {
    server.use(...handlers)
    client = createYouTubePlaylistsClient(createYouTubeClientFromEnv())
  })

  describe('fetchPlaylistItems', () => {
    it('should fetch playlist items from a single page', async () => {
      const result = await client.fetchPlaylistItems({ playlistId: 'PLsinglepage', maxPages: 10 })

      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('item1')
      expect(result[1]?.id).toBe('item2')
      expect(result[0]?.kind).toBe('youtube#playlistItem')
      expect(result[0]?.snippet?.playlistId).toBe('PLtest123')
    })

    it('should fetch playlist items across multiple pages', async () => {
      const result = await client.fetchPlaylistItems({ playlistId: 'PLmultipage', maxPages: 10 })

      expect(result).toHaveLength(4)
      expect(result[0]?.id).toBe('item1')
      expect(result[1]?.id).toBe('item2')
      expect(result[2]?.id).toBe('item3')
      expect(result[3]?.id).toBe('item4')
    })

    it('should handle empty playlists', async () => {
      const result = await client.fetchPlaylistItems({ playlistId: 'PLempty', maxPages: 10 })

      expect(result).toHaveLength(0)
    })

    it('should apply custom configuration', async () => {
      const result = await client.fetchPlaylistItems({
        playlistId: 'PLsinglepage',
        maxPages: 10,
        config: {
          part: ['snippet'],
          fields: 'items(id,snippet(title))',
          maxResults: 1,
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('item1')
      expect(result[0]?.snippet?.title).toBe('Playlist Video')
    })

    it('should respect maxPages limit', async () => {
      // This would normally create many pages, but we limit to 1 page
      const result = await client.fetchPlaylistItems({
        playlistId: 'PLmultipage',
        maxPages: 1,
      })

      expect(result).toHaveLength(2) // Only first page
      expect(result[0]?.id).toBe('item1')
      expect(result[1]?.id).toBe('item2')
    })

    it('should validate input parameters', async () => {
      await expect(client.fetchPlaylistItems({ playlistId: '', maxPages: 10 })).rejects.toThrow('Playlist ID is required')
    })

    it('should handle API errors gracefully', async () => {
      await expect(client.fetchPlaylistItems({ playlistId: 'PLquota', maxPages: 10 })).rejects.toThrow('YouTube API quota exceeded')
    })
  })

  describe('configuration', () => {
    it('should use default configuration', async () => {
      const result = await client.fetchPlaylistItems({ playlistId: 'PLsinglepage', maxPages: 10 })

      expect(result).toHaveLength(2)
      expect(result[0]?.contentDetails).toBeDefined()
      expect(result[0]?.snippet).toBeDefined()
    })

    it('should merge default and custom configuration', async () => {
      const customClient = createYouTubePlaylistsClient(createYouTubeClientFromEnv(), {
        part: ['snippet'],
        maxResults: 1,
      })

      const result = await customClient.fetchPlaylistItems({ playlistId: 'PLsinglepage', maxPages: 10 })

      expect(result).toHaveLength(1)
      expect(result[0]?.snippet).toBeDefined()
    })
  })
})

describe('createYouTubePlaylistsClient', () => {
  it('should create a playlists client with provided API client', () => {
    const apiClient = createYouTubeClientFromEnv()
    const playlistsClient = createYouTubePlaylistsClient(apiClient)

    expect(playlistsClient).toBeInstanceOf(YouTubePlaylistsClient)
  })

  it('should create a playlists client with default config', () => {
    const playlistsClient = createYouTubePlaylistsClient(createYouTubeClientFromEnv())

    expect(playlistsClient).toBeInstanceOf(YouTubePlaylistsClient)
  })
})