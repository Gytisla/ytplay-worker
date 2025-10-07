import { z } from 'zod'
import type { YouTubeApiClient } from './client'
import { createYouTubeClientFromEnv } from './client.ts'
import {
  ChannelsListResponseSchema,
  ChannelResourceSchema,
  type ChannelsListResponse,
  type ChannelResource,
} from './types.ts'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for channels.list API calls
 */
export const ChannelsListConfigSchema = z.object({
  part: z.array(z.enum(['snippet', 'statistics', 'status', 'contentDetails', 'brandingSettings'])).default(['snippet', 'statistics', 'contentDetails']),
  fields: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  batchSize: z.number().int().min(1).max(50).default(50), // YouTube API limit
}).default({})

export type ChannelsListConfig = z.infer<typeof ChannelsListConfigSchema>

/**
 * Options for fetching channels
 */
export const FetchChannelsOptionsSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one channel ID is required'),
  config: ChannelsListConfigSchema.optional(),
})

export type FetchChannelsOptions = z.infer<typeof FetchChannelsOptionsSchema>

// ============================================================================
// Channels API Client
// ============================================================================

/**
 * YouTube Channels API client wrapper
 */
export class YouTubeChannelsClient {
  private client: YouTubeApiClient
  private defaultConfig: ChannelsListConfig

  constructor(
    client: YouTubeApiClient,
    defaultConfig: Partial<ChannelsListConfig> = {}
  ) {
    this.client = client
    this.defaultConfig = ChannelsListConfigSchema.parse(defaultConfig)
  }

  /**
   * Fetch channels by IDs with automatic batching
   */
  async fetchChannels(options: FetchChannelsOptions): Promise<ChannelResource[]> {
    const validatedOptions = FetchChannelsOptionsSchema.parse(options)
    const { ids, config } = validatedOptions

    // Merge with default config
    const mergedConfig = { ...this.defaultConfig, ...config }
    const batchSize = mergedConfig.batchSize

    // Split IDs into batches
    const batches: string[][] = this.chunkArray(ids, batchSize)

    console.debug(`Fetching ${ids.length} channels in ${batches.length} batches (batch size: ${batchSize})`)

    // Process batches concurrently
    const batchPromises = batches.map(batch => this.fetchChannelBatch(batch, mergedConfig))

    try {
      const batchResults = await Promise.all(batchPromises)
      const allChannels = batchResults.flat()

      console.debug(`Successfully fetched ${allChannels.length} channels`)
      return allChannels

    } catch (error) {
      console.error('Failed to fetch channels:', error)
      throw error
    }
  }

  /**
   * Fetch a single batch of channels
   */
  private async fetchChannelBatch(
    channelIds: string[],
    config: ChannelsListConfig
  ): Promise<ChannelResource[]> {
    const params: Record<string, string | number | boolean> = {
      id: channelIds.join(','),
      part: config.part.join(','),
    }

    if (config.fields) {
      params['fields'] = config.fields
    }

    if (config.maxResults) {
      params['maxResults'] = config.maxResults
    }

    console.debug(`Fetching batch of ${channelIds.length} channels: ${channelIds.slice(0, 3).join(', ')}${channelIds.length > 3 ? '...' : ''}`)

    const response = await this.client.get<ChannelsListResponse>('/channels', params)

    // Validate response
    const validatedResponse = ChannelsListResponseSchema.parse(response)

    // Validate each channel resource
    const validatedChannels = validatedResponse.items.map(item =>
      ChannelResourceSchema.parse(item)
    )

    console.debug(`Fetched ${validatedChannels.length} channels in batch`)

    return validatedChannels
  }

  /**
   * Fetch a single channel by ID
   */
  async fetchChannel(
    channelId: string,
    config: Partial<ChannelsListConfig> = {}
  ): Promise<ChannelResource | null> {
    const mergedConfig = { ...this.defaultConfig, ...config }
    const channels = await this.fetchChannels({
      ids: [channelId],
      config: mergedConfig,
    })

    return channels.length > 0 ? (channels[0] as ChannelResource) : null
  }

  /**
   * Utility method to split array into chunks
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
 * Create a YouTube Channels API client
 */
export function createYouTubeChannelsClient(
  client: YouTubeApiClient,
  defaultConfig: Partial<ChannelsListConfig> = {}
): YouTubeChannelsClient {
  return new YouTubeChannelsClient(client, defaultConfig)
}

/**
 * Create a YouTube Channels API client from environment
 */
export function createYouTubeChannelsClientFromEnv(
  defaultConfig: Partial<ChannelsListConfig> = {}
): YouTubeChannelsClient {
  const client = createYouTubeClientFromEnv()
  return new YouTubeChannelsClient(client, defaultConfig)
}