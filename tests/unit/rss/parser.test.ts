import { describe, it, expect, beforeEach } from 'vitest'
import { RSSParser } from '../../../src/lib/rss/parser'
import { VideoIdExtractor } from '../../../src/lib/rss/extractor'

// Mock YouTube RSS feed XML for testing
const mockRssFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>YouTube Channel - Test Channel</title>
    <link>https://www.youtube.com/channel/UC1234567890</link>
    <description>Test channel description</description>
    <item>
      <title>Test Video 1</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <description>This is a test video description</description>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
      <media:thumbnail url="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" />
    </item>
    <item>
      <title>Test Video 2</title>
      <link>https://youtu.be/abcdefghijk</link>
      <description>Another test video</description>
      <pubDate>Wed, 22 Oct 2023 08:30:00 GMT</pubDate>
      <media:thumbnail url="https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg" />
    </item>
  </channel>
</rss>`

const mockRssFeedWithInvalidItemsXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>YouTube Channel - Test Channel</title>
    <link>https://www.youtube.com/channel/UC1234567890</link>
    <description>Test channel description</description>
    <item>
      <title>Valid Video</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <description>Valid video description</description>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
    </item>
    <item>
      <title>Invalid Video - No Link</title>
      <description>No link provided</description>
      <pubDate>Wed, 22 Oct 2023 08:30:00 GMT</pubDate>
    </item>
    <item>
      <title>Invalid Video - Invalid URL</title>
      <link>https://example.com/not-youtube</link>
      <description>Invalid YouTube URL</description>
      <pubDate>Wed, 23 Oct 2023 09:45:00 GMT</pubDate>
    </item>
    <item>
      <title>Invalid Video - Bad Date</title>
      <link>https://www.youtube.com/watch?v=lmnopqrstuv</link>
      <description>Invalid publication date</description>
      <pubDate>Invalid Date Format</pubDate>
    </item>
  </channel>
</rss>`

const mockEmptyRssFeedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>YouTube Channel - Empty Channel</title>
    <link>https://www.youtube.com/channel/UC1234567890</link>
    <description>Empty channel with no videos</description>
  </channel>
</rss>`

const mockInvalidXml = `<not-rss>This is not valid RSS XML</not-rss>`

const mockRssWithSingleItemXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>YouTube Channel - Single Video</title>
    <link>https://www.youtube.com/channel/UC1234567890</link>
    <description>Channel with single video</description>
    <item>
      <title>Single Test Video</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <description>This is the only video</description>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
      <media:thumbnail url="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" />
    </item>
  </channel>
</rss>`

describe('RSSParser', () => {
  let parser: RSSParser

  beforeEach(() => {
    parser = new RSSParser()
  })

  describe('parseFeed', () => {
    it('should parse valid RSS feed with multiple items', () => {
      const result = parser.parseFeed(mockRssFeedXml)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        videoId: 'dQw4w9WgXcQ',
        title: 'Test Video 1',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'This is a test video description',
        publishedAt: new Date('Wed, 21 Oct 2023 07:28:00 GMT'),
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      })
      expect(result[1]).toEqual({
        videoId: 'abcdefghijk',
        title: 'Test Video 2',
        link: 'https://youtu.be/abcdefghijk',
        description: 'Another test video',
        publishedAt: new Date('Wed, 22 Oct 2023 08:30:00 GMT'),
        thumbnailUrl: 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg',
      })
    })

    it('should parse RSS feed with single item', () => {
      const result = parser.parseFeed(mockRssWithSingleItemXml)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        videoId: 'dQw4w9WgXcQ',
        title: 'Single Test Video',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'This is the only video',
        publishedAt: new Date('Wed, 21 Oct 2023 07:28:00 GMT'),
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      })
    })

    it('should filter out invalid items', () => {
      const result = parser.parseFeed(mockRssFeedWithInvalidItemsXml)

      expect(result).toHaveLength(1)
      expect(result[0]?.videoId).toBe('dQw4w9WgXcQ')
      expect(result[0]?.title).toBe('Valid Video')
    })

    it('should handle empty RSS feed', () => {
      const result = parser.parseFeed(mockEmptyRssFeedXml)

      expect(result).toHaveLength(0)
    })

    it('should throw error for invalid XML', () => {
      expect(() => parser.parseFeed(mockInvalidXml)).toThrow('Failed to parse RSS feed')
    })

    it('should throw error for malformed RSS structure', () => {
      const malformedXml = `<rss><channel></channel></rss>`
      expect(() => parser.parseFeed(malformedXml)).toThrow('Invalid RSS feed structure')
    })

    it('should handle items without optional fields', () => {
      const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Minimal Video</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      const result = parser.parseFeed(minimalXml)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        videoId: 'dQw4w9WgXcQ',
        title: 'Minimal Video',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        publishedAt: new Date('Wed, 21 Oct 2023 07:28:00 GMT'),
      })
      expect(result[0]).not.toHaveProperty('description')
      expect(result[0]).not.toHaveProperty('thumbnailUrl')
    })

    it('should handle items with missing title', () => {
      const noTitleXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

      const result = parser.parseFeed(noTitleXml)

      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe('Untitled')
    })
  })

  describe('validateFeed', () => {
    it('should validate correct RSS feed', () => {
      expect(parser.validateFeed(mockRssFeedXml)).toBe(true)
    })

    it('should reject invalid XML', () => {
      expect(parser.validateFeed(mockInvalidXml)).toBe(false)
    })

    it('should reject RSS without items', () => {
      expect(parser.validateFeed(mockEmptyRssFeedXml)).toBe(false)
    })

    it('should reject malformed RSS structure', () => {
      const malformedXml = `<rss><not-channel></not-channel></rss>`
      expect(parser.validateFeed(malformedXml)).toBe(false)
    })
  })

  describe('extractVideoId', () => {
    it('should extract video ID from standard YouTube watch URLs', () => {
      const testCases = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      ]

      testCases.forEach(url => {
        const result = VideoIdExtractor.extractVideoId(url)
        expect(result).toBe('dQw4w9WgXcQ')
      })
    })

    it('should extract video ID from youtu.be URLs', () => {
      const testCases = [
        'https://youtu.be/dQw4w9WgXcQ',
        'http://youtu.be/dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ?t=30',
      ]

      testCases.forEach(url => {
        const result = VideoIdExtractor.extractVideoId(url)
        expect(result).toBe('dQw4w9WgXcQ')
      })
    })

    it('should extract video ID from embed URLs', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      const result = VideoIdExtractor.extractVideoId(url)
      expect(result).toBe('dQw4w9WgXcQ')
    })

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/video',
        'not-a-url',
        '',
        'https://youtube.com/channel/UC123',
        'https://youtube.com/playlist?list=PL123',
      ]

      invalidUrls.forEach(url => {
        const result = VideoIdExtractor.extractVideoId(url)
        expect(result).toBeNull()
      })

      expect(VideoIdExtractor.extractVideoId(null as unknown as string)).toBeNull()
    })
  })

  describe('parsePubDate', () => {
    it('should parse valid RSS date formats', () => {
      // RFC 2822
      const rfc2822Date = 'Wed, 21 Oct 2015 07:28:00 GMT'
  let result: Date | null = ((parser as unknown) as { parsePubDate: (date: string) => Date | null }).parsePubDate(rfc2822Date)
      expect(result).toBeTruthy()
      expect(result).toEqual(new Date('2015-10-21T07:28:00.000Z'))

      // ISO 8601
      const isoDate = '2015-10-21T07:28:00Z'
  result = ((parser as unknown) as { parsePubDate: (date: string) => Date | null }).parsePubDate(isoDate)
      expect(result).toBeTruthy()
      expect(result).toEqual(new Date('2015-10-21T07:28:00.000Z'))
    })

    it('should return null for invalid date strings', () => {
      const invalidRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test</title>
      <link>https://www.youtube.com/watch?v=test123</link>
      <pubDate>Invalid Date</pubDate>
    </item>
  </channel>
</rss>`
      expect(parser.parseFeed(invalidRss)).toEqual([])
    })
  })

  describe('parseItem', () => {
    it('should parse complete RSS item', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Channel</title>
    <link>https://youtube.com/channel/test</link>
    <item>
      <title>Test Video</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <description>Test description</description>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
      <media:thumbnail url="https://example.com/thumb.jpg" />
    </item>
  </channel>
</rss>`

      const result = parser.parseFeed(xml)?.[0]

      expect(result).toEqual({
        videoId: 'dQw4w9WgXcQ',
        title: 'Test Video',
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'Test description',
        publishedAt: new Date('Wed, 21 Oct 2023 07:28:00 GMT'),
        thumbnailUrl: 'https://example.com/thumb.jpg'
      })
    })

    it('should handle media:content as thumbnail fallback', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Channel</title>
    <link>https://youtube.com/channel/test</link>
    <item>
      <title>Test Video</title>
      <link>https://www.youtube.com/watch?v=dQw4w9WgXcQ</link>
      <pubDate>Wed, 21 Oct 2023 07:28:00 GMT</pubDate>
      <media:content url="https://example.com/content.jpg" type="image/jpeg" />
    </item>
  </channel>
</rss>`

      const result = parser.parseFeed(xml)?.[0]
      expect(result?.thumbnailUrl).toBe('https://example.com/content.jpg')
    })

    it('should return null for invalid items', () => {
      const invalidXmls = [
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>No link</title>
    </item>
  </channel>
</rss>`,
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <link>https://example.com/not-youtube</link>
    </item>
  </channel>
</rss>`,
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <link>https://youtube.com/watch?v=invalid</link>
      <pubDate>Invalid Date</pubDate>
    </item>
  </channel>
</rss>`
      ]

      invalidXmls.forEach(xml => {
        const result = parser.parseFeed(xml)
        expect(result).toEqual([])
      })
    })
  })
})