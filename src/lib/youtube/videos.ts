import { z } from 'zod'
import type { YouTubeApiClient } from './client'
import { createYouTubeClientFromEnv } from './client.ts'
import {
  VideosListResponseSchema,
  VideoResourceSchema,
  type VideosListResponse,
  type VideoResource,
} from './types.ts'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for videos.list API calls
 */
export const VideosListConfigSchema = z.object({
  part: z.array(z.enum(['snippet', 'statistics', 'status', 'contentDetails', 'topicDetails'])).default(['snippet', 'statistics', 'contentDetails']),
  fields: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  batchSize: z.number().int().min(1).max(50).default(50), // YouTube API limit
}).default({})

export type VideosListConfig = z.infer<typeof VideosListConfigSchema>

/**
 * Options for fetching videos
 */
export const FetchVideosOptionsSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one video ID is required'),
  config: VideosListConfigSchema.optional(),
})

export type FetchVideosOptions = z.infer<typeof FetchVideosOptionsSchema>

/**
 * Options for fetching a single video
 */
export const FetchVideoOptionsSchema = z.object({
  id: z.string().min(1, 'Video ID is required'),
  config: VideosListConfigSchema.optional(),
})

export type FetchVideoOptions = z.infer<typeof FetchVideoOptionsSchema>

// ============================================================================
// Videos API Client
// ============================================================================

/**
 * YouTube Videos API client wrapper
 */
export class YouTubeVideosClient {
  private client: YouTubeApiClient
  private defaultConfig: VideosListConfig

  constructor(
    client: YouTubeApiClient,
    defaultConfig: Partial<VideosListConfig> = {}
  ) {
    this.client = client
    this.defaultConfig = VideosListConfigSchema.parse(defaultConfig)
  }

  /**
   * Fetch videos by IDs with automatic batching
   */
  async fetchVideos(options: FetchVideosOptions): Promise<VideoResource[]> {
    const validatedOptions = FetchVideosOptionsSchema.parse(options)
    const { ids, config } = validatedOptions

    // Merge with default config
    const mergedConfig = { ...this.defaultConfig, ...config }
    const batchSize = mergedConfig.batchSize

    // Split IDs into batches
    const batches: string[][] = this.chunkArray(ids, batchSize)

    console.debug(`Fetching ${ids.length} videos in ${batches.length} batches (batch size: ${batchSize})`)

    // Process batches concurrently
    const batchPromises = batches.map(batch => this.fetchVideoBatch(batch, mergedConfig))

    try {
      const batchResults = await Promise.all(batchPromises)
      const allVideos = batchResults.flat()

      console.debug(`Successfully fetched ${allVideos.length} videos`)
      return allVideos

    } catch (error) {
      console.error('Failed to fetch videos:', error)
      throw error
    }
  }

  /**
   * Fetch a single video by ID
   */
  async fetchVideo(options: FetchVideoOptions): Promise<VideoResource | null> {
    const validatedOptions = FetchVideoOptionsSchema.parse(options)
    const { id, config } = validatedOptions

    // Merge with default config
    const mergedConfig = { ...this.defaultConfig, ...config }

    try {
      const videos = await this.fetchVideos({
        ids: [id],
        config: mergedConfig,
      })
      return videos.length > 0 ? (videos[0] as VideoResource) : null
    } catch (error) {
      console.error(`Failed to fetch video ${id}:`, error)
      throw error
    }
  }

  /**
   * Fetch a single batch of videos
   */
  private async fetchVideoBatch(
    videoIds: string[],
    config: VideosListConfig
  ): Promise<VideoResource[]> {
    console.debug(`Fetching batch of ${videoIds.length} videos: ${videoIds.slice(0, 3).join(', ')}${videoIds.length > 3 ? '...' : ''}`)

    const params: Record<string, string | number | boolean> = {
      id: videoIds.join(','),
      part: config.part.join(','),
    }

    if (config.fields) {
      params['fields'] = config.fields
    }

    if (config.maxResults) {
      params['maxResults'] = config.maxResults
    }

    const response = await this.client.get<VideosListResponse>('/videos', params)

    // Validate response
    const validatedResponse = VideosListResponseSchema.parse(response)

    // Validate each video resource individually, skipping invalid ones
    const validatedVideos: VideoResource[] = []
    for (const item of validatedResponse.items) {
      try {
        const validatedVideo = VideoResourceSchema.parse(item)
        validatedVideos.push(validatedVideo)
      } catch (error) {
        console.warn(`Skipping invalid video ${item.id}:`, error instanceof Error ? error.message : String(error))
        // Continue with other videos instead of failing the batch
      }
    }

    console.debug(`Fetched ${validatedVideos.length} valid videos in batch (${validatedResponse.items.length - validatedVideos.length} skipped)`)
    return validatedVideos
  }

  /**
   * Split an array into chunks of specified size
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a YouTube Videos client with the provided API client
 */
export function createYouTubeVideosClient(
  client: YouTubeApiClient,
  defaultConfig?: Partial<VideosListConfig>
): YouTubeVideosClient {
  return new YouTubeVideosClient(client, defaultConfig)
}

/**
 * Create a YouTube Videos client from environment variables
 */
export function createYouTubeVideosClientFromEnv(
  defaultConfig?: Partial<VideosListConfig>
): YouTubeVideosClient {
  const client = createYouTubeClientFromEnv()
  return new YouTubeVideosClient(client, defaultConfig)
}