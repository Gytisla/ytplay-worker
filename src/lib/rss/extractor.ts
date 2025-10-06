/**
 * Extract YouTube video ID from various URL formats found in RSS feeds
 */
export class VideoIdExtractor {
  /**
   * Extract video ID from a YouTube URL
   */
  static extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null
    }

    // Clean the URL
    const cleanUrl = url.trim()

    // YouTube URL patterns
    const patterns = [
      // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&\?].*)?$/,
      // Embed URLs: https://www.youtube.com/embed/VIDEO_ID
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
      // Shortened youtu.be URLs: https://youtu.be/VIDEO_ID
      /youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
      // Mobile URLs: https://m.youtube.com/watch?v=VIDEO_ID
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&\?].*)?$/,
      // YouTube Music URLs: https://music.youtube.com/watch?v=VIDEO_ID
      /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&\?].*)?$/,
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Extract multiple video IDs from an array of URLs
   */
  static extractVideoIds(urls: string[]): string[] {
    return urls
      .map(url => this.extractVideoId(url))
      .filter((id): id is string => id !== null)
  }

  /**
   * Validate if a string is a valid YouTube video ID
   */
  static isValidVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false
    }

    // YouTube video IDs are 11 characters long and contain only valid characters
    const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
    return videoIdPattern.test(videoId)
  }

  /**
   * Extract video ID from RSS feed item link, with fallback strategies
   */
  static extractFromRssItem(item: {
    link?: string
    guid?: string
    'media:content'?: { '@_url'?: string }
    'media:player'?: { '@_url'?: string }
  }): string | null {
    // Primary: Try the main link
    if (item.link) {
      const videoId = this.extractVideoId(item.link)
      if (videoId) {
        return videoId
      }
    }

    // Secondary: Try GUID (sometimes contains the video URL)
    if (item.guid && typeof item.guid === 'string') {
      const videoId = this.extractVideoId(item.guid)
      if (videoId) {
        return videoId
      }
    }

    // Tertiary: Try media:content URL
    if (item['media:content']?.['@_url']) {
      const videoId = this.extractVideoId(item['media:content']['@_url'])
      if (videoId) {
        return videoId
      }
    }

    // Quaternary: Try media:player URL
    if (item['media:player']?.['@_url']) {
      const videoId = this.extractVideoId(item['media:player']['@_url'])
      if (videoId) {
        return videoId
      }
    }

    return null
  }

  /**
   * Generate standard YouTube watch URL from video ID
   */
  static createWatchUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) {
      throw new Error(`Invalid YouTube video ID: ${videoId}`)
    }
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  /**
   * Generate YouTube embed URL from video ID
   */
  static createEmbedUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) {
      throw new Error(`Invalid YouTube video ID: ${videoId}`)
    }
    return `https://www.youtube.com/embed/${videoId}`
  }

  /**
   * Generate youtu.be short URL from video ID
   */
  static createShortUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) {
      throw new Error(`Invalid YouTube video ID: ${videoId}`)
    }
    return `https://youtu.be/${videoId}`
  }
}