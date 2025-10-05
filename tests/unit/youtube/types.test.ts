import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  ChannelResourceSchema,
  VideoResourceSchema,
  PlaylistItemResourceSchema,
  YouTubeApiErrorSchema,
  ChannelsListResponseSchema,
  ChannelIdSchema,
  VideoIdSchema,
  PlaylistIdSchema,
  BatchIdsSchema,
} from '../../../src/lib/youtube/types'

describe('YouTube API Types', () => {
  describe('Validation Schemas', () => {
    it('should validate a valid channel resource', () => {
      const validChannel = {
        kind: 'youtube#channel',
        etag: 'etag123',
        id: 'UC1234567890123456789012',
        snippet: {
          title: 'Test Channel',
          description: 'A test channel',
          publishedAt: '2023-01-01T00:00:00Z',
          thumbnails: {
            default: { url: 'https://example.com/thumb.jpg', width: 88, height: 88 },
          },
        },
        statistics: {
          viewCount: '1000',
          subscriberCount: '100',
          hiddenSubscriberCount: false,
          videoCount: '10',
        },
      }

      expect(() => ChannelResourceSchema.parse(validChannel)).not.toThrow()
    })

    it('should validate a valid video resource', () => {
      const validVideo = {
        kind: 'youtube#video',
        etag: 'etag123',
        id: 'dQw4w9WgXcQ',
        snippet: {
          publishedAt: '2023-01-01T00:00:00Z',
          channelId: 'UC1234567890123456789012',
          title: 'Test Video',
          description: 'A test video',
          thumbnails: {
            default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
          },
          channelTitle: 'Test Channel',
          categoryId: '22',
          liveBroadcastContent: 'none',
        },
        statistics: {
          viewCount: '10000',
          likeCount: '100',
          commentCount: '10',
        },
      }

      expect(() => VideoResourceSchema.parse(validVideo)).not.toThrow()
    })

    it('should validate a valid playlist item resource', () => {
      const validPlaylistItem = {
        kind: 'youtube#playlistItem',
        etag: 'etag123',
        id: 'playlistItemId123',
        snippet: {
          publishedAt: '2023-01-01T00:00:00Z',
          channelId: 'UC1234567890123456789012',
          title: 'Test Video',
          description: 'A test video',
          thumbnails: {
            default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
          },
          channelTitle: 'Test Channel',
          playlistId: 'PL12345678901234567890123456789012',
          position: 0,
          resourceId: {
            kind: 'youtube#video',
            videoId: 'dQw4w9WgXcQ',
          },
        },
      }

      expect(() => PlaylistItemResourceSchema.parse(validPlaylistItem)).not.toThrow()
    })

    it('should validate YouTube API error responses', () => {
      const validError = {
        error: {
          code: 403,
          message: 'quotaExceeded',
          errors: [
            {
              domain: 'youtube.quota',
              reason: 'quotaExceeded',
              message: 'Quota exceeded for quota metric',
            },
          ],
        },
      }

      expect(() => YouTubeApiErrorSchema.parse(validError)).not.toThrow()
    })

    it('should validate channels list response', () => {
      const validResponse = {
        kind: 'youtube#channelListResponse',
        etag: 'etag123',
        pageInfo: {
          totalResults: 1,
          resultsPerPage: 1,
        },
        items: [
          {
            kind: 'youtube#channel',
            etag: 'etag123',
            id: 'UC1234567890123456789012',
            snippet: {
              title: 'Test Channel',
              description: 'A test channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'https://example.com/thumb.jpg', width: 88, height: 88 },
              },
            },
          },
        ],
      }

      expect(() => ChannelsListResponseSchema.parse(validResponse)).not.toThrow()
    })
  })

  describe('ID Validation', () => {
    it('should validate YouTube channel IDs', () => {
      expect(() => ChannelIdSchema.parse('UC1234567890123456789012')).not.toThrow()
      expect(() => ChannelIdSchema.parse('UC123')).toThrow()
      expect(() => ChannelIdSchema.parse('invalid')).toThrow()
    })

    it('should validate YouTube video IDs', () => {
      expect(() => VideoIdSchema.parse('dQw4w9WgXcQ')).not.toThrow()
      expect(() => VideoIdSchema.parse('dQw4w9')).toThrow()
      expect(() => VideoIdSchema.parse('invalid')).toThrow()
    })

    it('should validate YouTube playlist IDs', () => {
      expect(() => PlaylistIdSchema.parse('PL12345678901234567890123456789012')).not.toThrow()
      expect(() => PlaylistIdSchema.parse('PL123')).toThrow()
      expect(() => PlaylistIdSchema.parse('invalid')).toThrow()
    })

    it('should validate batch ID arrays', () => {
      expect(() => BatchIdsSchema.parse(['dQw4w9WgXcQ', 'anotherId123'])).not.toThrow()
      expect(() => BatchIdsSchema.parse([])).toThrow() // Must have at least 1
      expect(() => BatchIdsSchema.parse(Array(51).fill('dQw4w9WgXcQ'))).toThrow() // Max 50
    })
  })

  describe('Type Inference', () => {
    it('should correctly infer types from schemas', () => {
      // Test that we can use the inferred types
      const channel: z.infer<typeof ChannelResourceSchema> = {
        kind: 'youtube#channel',
        etag: 'etag123',
        id: 'UC12345678901234567890123456789012',
      }

      expect(channel.id).toBe('UC12345678901234567890123456789012')
      expect(channel.kind).toBe('youtube#channel')
    })
  })
})