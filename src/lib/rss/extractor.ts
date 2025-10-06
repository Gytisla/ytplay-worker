/**
 * Extract YouTube video ID from various URL formats found in RSS feeds
 */
export const VideoIdExtractor = {
  extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null
    }

    const cleanUrl = url.trim()

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].*)?$/,
      /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].*)?$/,
    ]

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern)
      if (match?.[1]) {
        return match[1]
      }
    }

    return null
  },

  extractVideoIds(urls: string[]): string[] {
    return urls.map(url => this.extractVideoId(url)).filter((id): id is string => id !== null)
  },

  isValidVideoId(videoId: string): boolean {
    if (!videoId || typeof videoId !== 'string') {
      return false
    }
    const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
    return videoIdPattern.test(videoId)
  },

  extractFromRssItem(item: {
    link?: string
    guid?: string
    'media:content'?: { '@_url'?: string }
    'media:player'?: { '@_url'?: string }
  }): string | null {
    if (item.link) {
      const videoId = this.extractVideoId(item.link)
      if (videoId) return videoId
    }

    if (item.guid && typeof item.guid === 'string') {
      const videoId = this.extractVideoId(item.guid)
      if (videoId) return videoId
    }

    if (item['media:content']?.['@_url']) {
      const videoId = this.extractVideoId(item['media:content']['@_url'])
      if (videoId) return videoId
    }

    if (item['media:player']?.['@_url']) {
      const videoId = this.extractVideoId(item['media:player']['@_url'])
      if (videoId) return videoId
    }

    return null
  },

  createWatchUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) throw new Error(`Invalid YouTube video ID: ${videoId}`)
    return `https://www.youtube.com/watch?v=${videoId}`
  },

  createEmbedUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) throw new Error(`Invalid YouTube video ID: ${videoId}`)
    return `https://www.youtube.com/embed/${videoId}`
  },

  createShortUrl(videoId: string): string {
    if (!this.isValidVideoId(videoId)) throw new Error(`Invalid YouTube video ID: ${videoId}`)
    return `https://youtu.be/${videoId}`
  },
}