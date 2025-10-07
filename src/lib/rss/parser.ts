import { XMLParser } from 'fast-xml-parser'
import { VideoIdExtractor } from './extractor.ts'

export interface RSSItem {
  title: string
  link: string
  guid?: string
  pubDate: string
  description?: string
  'media:thumbnail'?: {
    '@_url': string
  }
  'media:content'?: {
    '@_url': string
    '@_type': string
  }
}

export interface RSSChannel {
  title: string
  link: string
  description?: string
  item: RSSItem | RSSItem[]
}

export interface RSSFeed {
  rss: {
    channel: RSSChannel
  }
}

export interface ParsedVideoItem {
  videoId: string
  title: string
  link: string
  publishedAt: Date
  description?: string
  thumbnailUrl?: string
}

/**
 * Parses YouTube RSS feed XML content into structured video data
 */
export class RSSParser {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseAttributeValue: true,
      trimValues: true,
    })
  }

  /**
   * Parse RSS feed XML string into structured data
   */
  parseFeed(xmlContent: string): ParsedVideoItem[] {
    try {
      const parsed = this.parser.parse(xmlContent) as RSSFeed

      // Check if this is valid RSS structure
      if (!parsed.rss?.channel) {
        throw new Error('Invalid RSS feed structure: missing rss or channel')
      }

      // Empty feeds are valid, return empty array
      if (!parsed.rss.channel.item) {
        return []
      }

      const channel = parsed.rss.channel
      const items = Array.isArray(channel.item) ? channel.item : [channel.item]

        return items
          .filter(item => item?.link)
          .map(item => this.parseItem?.(item))
          .filter((item): item is ParsedVideoItem => item !== null)
    } catch (error) {
      throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse individual RSS item into video data
   */
  private parseItem(item: RSSItem): ParsedVideoItem | null {
    try {
      const videoId = this.extractVideoId(item.link)
      if (!videoId) {
        return null
      }

      const publishedAt = this.parsePubDate(item.pubDate)
      if (!publishedAt) {
        return null
      }

      const thumbnailUrl = item['media:thumbnail']?.['@_url'] ?? item['media:content']?.['@_url']

      const result: ParsedVideoItem = {
        videoId,
        title: item.title ?? 'Untitled',
        link: item.link,
        publishedAt,
      }

      if (item.description) {
        result.description = item.description
      }

      if (thumbnailUrl) {
        result.thumbnailUrl = thumbnailUrl
      }

      return result
    } catch {
      return null
    }
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  private extractVideoId(url: string): string | null {
    return VideoIdExtractor.extractVideoId(url)
  }

  /**
   * Parse RSS publication date into Date object
   */
  private parsePubDate(pubDate: string): Date | null {
    try {
      // First try parsing as-is
      let date = new Date(pubDate)
      if (!isNaN(date.getTime())) {
        return date
      }

      // Clean up the date string and try again
      const cleanDate = pubDate
        .replace(/^[a-zA-Z]+,\s*/, '') // Remove day name
        .replace(/\s+\([A-Z]+\)$/, '') // Remove timezone name if present
        .trim()

      date = new Date(cleanDate)
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  /**
   * Validate if XML content appears to be a valid RSS feed
   */
  validateFeed(xmlContent: string): boolean {
    try {
      const parsed = this.parser.parse(xmlContent) as RSSFeed
      return !!(parsed.rss?.channel?.item)
    } catch {
      return false
    }
  }
}