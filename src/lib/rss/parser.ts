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
      const parsed = this.parser.parse(xmlContent) as any

      // RSS <rss><channel><item> handling
      if (parsed.rss?.channel) {
        // Empty feeds are valid, return empty array
        if (!parsed.rss.channel.item) {
          return []
        }

        const channel = parsed.rss.channel
        const items = Array.isArray(channel.item) ? channel.item : [channel.item]

        return items
          .filter((item: any) => item?.link)
          .map((item: any) => this.parseItem?.(item) as ParsedVideoItem | null)
          .filter((item: ParsedVideoItem | null): item is ParsedVideoItem => item !== null)
      }

      // Atom <feed><entry> handling (YouTube uses Atom for some feeds)
      if (parsed.feed?.entry) {
        const entries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry]

        return entries
          .map((entry: any) => this.parseAtomEntry(entry) as ParsedVideoItem | null)
          .filter((item: ParsedVideoItem | null): item is ParsedVideoItem => item !== null)
      }

      throw new Error('Invalid RSS feed structure: missing rss or channel or feed/entry')
    } catch (error) {
      throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse individual Atom <entry> into video data
   */
  private parseAtomEntry(entry: any): ParsedVideoItem | null {
    try {
      // Try to get a link href - entry.link can be array or object
      let link: string | undefined
      if (Array.isArray(entry.link)) {
        const alternate = entry.link.find((l: any) => !l['@_rel'] || l['@_rel'] === 'alternate')
        link = alternate ? alternate['@_href'] || alternate.href || alternate : undefined
      } else if (entry.link) {
        link = entry.link['@_href'] || entry.link.href || entry.link
      }

      // fallback to id if link is missing
      if (!link && entry.id) {
        link = typeof entry.id === 'string' ? entry.id : (entry.id['#text'] || undefined)
      }

      const videoId = link ? this.extractVideoId(String(link)) : null
      if (!videoId) return null

      // published or updated
      const pub = entry.published || entry.updated || entry['pubDate']
      const publishedAt = pub ? this.parsePubDate(String(pub)) : null
      if (!publishedAt) return null

      const title = entry.title && (typeof entry.title === 'string' ? entry.title : entry.title['#text'])
      const description = entry.summary && (typeof entry.summary === 'string' ? entry.summary : entry.summary['#text'])

      // media:group thumbnail (YouTube Atom) or media:thumbnail
      const thumbnailUrl = entry['media:group']?.['media:thumbnail']?.['@_url']
        || entry['media:thumbnail']?.['@_url']

      const result: ParsedVideoItem = {
        videoId,
        title: title ?? 'Untitled',
        link: String(link),
        publishedAt,
      }

      if (description) result.description = description
      if (thumbnailUrl) result.thumbnailUrl = thumbnailUrl

      return result
    } catch {
      return null
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
      const parsed = this.parser.parse(xmlContent) as any
      return !!(parsed.rss?.channel?.item || parsed.feed?.entry)
    } catch {
      return false
    }
  }
}