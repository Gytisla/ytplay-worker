import { z } from 'zod'
import type { YouTubeApiClient } from './client'
import { createYouTubeClientFromEnv } from './client.ts'
import {
  PlaylistItemsListResponseSchema,
  PlaylistItemResourceSchema,
  type PlaylistItemsListResponse,
  type PlaylistItemResource,
} from './types.ts'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for playlistItems.list API calls
 */
export const PlaylistItemsListConfigSchema = z.object({
  part: z.array(z.enum(['snippet', 'status', 'contentDetails'])).default(['snippet', 'contentDetails']),
  fields: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).default(50), // YouTube API limit per page
}).default({})

export type PlaylistItemsListConfig = z.infer<typeof PlaylistItemsListConfigSchema>

/**
 * Options for fetching playlist items
 */
export const FetchPlaylistItemsOptionsSchema = z.object({
  playlistId: z.string().min(1, 'Playlist ID is required'),
  config: PlaylistItemsListConfigSchema.optional(),
  maxPages: z.number().int().min(1).max(100).default(10), // Safety limit to prevent infinite loops
})

export type FetchPlaylistItemsOptions = z.infer<typeof FetchPlaylistItemsOptionsSchema>

// ============================================================================
// Playlist API Client
// ============================================================================

/**
 * YouTube Playlist Items API client wrapper
 */
export class YouTubePlaylistsClient {
  private client: YouTubeApiClient
  private defaultConfig: PlaylistItemsListConfig

  constructor(
    client: YouTubeApiClient,
    defaultConfig: Partial<PlaylistItemsListConfig> = {}
  ) {
    this.client = client
    this.defaultConfig = PlaylistItemsListConfigSchema.parse(defaultConfig)
  }

  /**
   * Fetch all playlist items with automatic pagination
   */
  async fetchPlaylistItems(options: FetchPlaylistItemsOptions): Promise<PlaylistItemResource[]> {
    const validatedOptions = FetchPlaylistItemsOptionsSchema.parse(options)
    const { playlistId, config, maxPages } = validatedOptions

    // Merge with default config
    const mergedConfig = { ...this.defaultConfig, ...config }

    console.debug(`Fetching playlist items for playlist ${playlistId} (max ${maxPages} pages)`)

    const allItems: PlaylistItemResource[] = []
    let pageToken: string | undefined
    let pageCount = 0

    try {
      do {
        pageCount++;
        const pageItemsRaw = await this.fetchPlaylistItemsPage(playlistId, mergedConfig, pageToken);
        const pageItems = typeof pageItemsRaw === 'object' && pageItemsRaw !== null ? pageItemsRaw : { items: [], nextPageToken: undefined };

        // Validate each playlist item resource
        const validatedItems = Array.isArray(pageItems.items)
          ? pageItems.items.map(item => PlaylistItemResourceSchema.parse(item))
          : [];

        allItems.push(...validatedItems);

        console.debug(`Fetched page ${pageCount} with ${validatedItems.length} items (total: ${allItems.length})`);

        // Check if we've reached the max pages limit
        if (pageCount >= maxPages) {
          console.warn(`Reached maximum page limit (${maxPages}) for playlist ${playlistId}`);
          break;
        }

        pageToken = pageItems.nextPageToken;

      } while (pageToken);

      console.debug(`Successfully fetched ${allItems.length} playlist items from ${pageCount} pages`);
      return allItems;

    } catch (error) {
       
      console.error(`Failed to fetch playlist items for ${playlistId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a single page of playlist items
   */
  private async fetchPlaylistItemsPage(
    playlistId: string,
    config: PlaylistItemsListConfig,
    pageToken?: string
  ): Promise<PlaylistItemsListResponse> {
    const params: Record<string, string | number | boolean> = {
      playlistId,
      part: config.part.join(','),
      maxResults: config.maxResults,
    }

    if (config.fields) {
      params['fields'] = config.fields
    }

    if (pageToken) {
      params['pageToken'] = pageToken
    }

    console.debug(`Fetching playlist items page for ${playlistId}${pageToken ? ` (pageToken: ${pageToken})` : ''}`)

    const response = await this.client.get<PlaylistItemsListResponse>('/playlistItems', params)

    // Validate response
    const validatedResponse = PlaylistItemsListResponseSchema.parse(response)

    console.debug(`Fetched ${validatedResponse.items.length} items in page`)
    return validatedResponse
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a YouTube Playlists client with the provided API client
 */
export function createYouTubePlaylistsClient(
  client: YouTubeApiClient,
  defaultConfig?: Partial<PlaylistItemsListConfig>
): YouTubePlaylistsClient {
  return new YouTubePlaylistsClient(client, defaultConfig)
}

/**
 * Create a YouTube Playlists client from environment variables
 */
export function createYouTubePlaylistsClientFromEnv(
  defaultConfig?: Partial<PlaylistItemsListConfig>
): YouTubePlaylistsClient {
  const client = createYouTubeClientFromEnv()
  return new YouTubePlaylistsClient(client, defaultConfig)
}