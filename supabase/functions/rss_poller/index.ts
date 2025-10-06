 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { XMLParser } from 'https://esm.sh/fast-xml-parser@5.3.0'

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err ?? 'Unknown error'))
}

// Define types locally for Edge Function
interface ParsedVideoItem {
  videoId: string
  title: string
  link: string
  publishedAt: Date
  description?: string
  thumbnailUrl?: string
}

interface FeedState {
  channelId: string
  feedUrl: string
  lastETag?: string
  lastModified?: string
  lastPolledAt?: Date
  lastVideoPublishedAt?: Date
  pollIntervalMinutes: number
  consecutiveErrors: number
  status: 'active' | 'paused' | 'error'
  errorMessage?: string
}

// Type for RSS item structure
interface RSSItem {
  link?: string;
  title?: string;
  pubDate?: string;
  description?: string;
  'media:thumbnail'?: { ['@_url']?: string };
  'media:content'?: { ['@_url']?: string };
  [key: string]: unknown;
}

// Request/Response body types (stub, update as needed)
type RequestBody = Record<string, unknown>;
type ResponseBody = Record<string, unknown>;

// Copy RSS parser logic here for Edge Function compatibility
class RSSParser {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
      parseAttributeValue: true,
      trimValues: true,
    })
  }

  parseFeed(xmlContent: string): ParsedVideoItem[] {
    try {
      const parsed = this.parser.parse(xmlContent) as Record<string, unknown>
      // Type guard for expected RSS structure
      const rss = typeof parsed.rss === 'object' && parsed.rss !== null ? parsed.rss as Record<string, unknown> : {};
      const channel = typeof rss.channel === 'object' && rss.channel !== null ? rss.channel as Record<string, unknown> : {};
      const itemsRaw = channel.item ?? [];
      const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];
      return items
        .filter((item: unknown): item is RSSItem => {
          return typeof item === 'object' && item !== null && 'link' in item && typeof (item as RSSItem).link === 'string';
        })
        .map((item: RSSItem) => this.parseItem(item))
        .filter((item: ParsedVideoItem | null): item is ParsedVideoItem => item !== null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to parse RSS feed: ${msg}`)
    }
  }

  private parseItem(item: RSSItem): ParsedVideoItem | null {
    try {
      // Type guards for expected item shape
      const link = typeof item.link === 'string' ? item.link : '';
      const title = typeof item.title === 'string' ? item.title : 'Untitled';
      const pubDate = typeof item.pubDate === 'string' ? item.pubDate : '';
      const description = typeof item.description === 'string' ? item.description : undefined;
      let thumbnailUrl: string | undefined = undefined;
      if (
        item['media:thumbnail'] &&
        typeof item['media:thumbnail'] === 'object' &&
        item['media:thumbnail'] !== null &&
        '@_url' in item['media:thumbnail'] &&
        typeof (item['media:thumbnail'] as { ['@_url']: unknown })['@_url'] === 'string'
      ) {
        thumbnailUrl = (item['media:thumbnail'] as { ['@_url']: string })['@_url'];
      } else if (
        item['media:content'] &&
        typeof item['media:content'] === 'object' &&
        item['media:content'] !== null &&
        '@_url' in item['media:content'] &&
        typeof (item['media:content'] as { ['@_url']: unknown })['@_url'] === 'string'
      ) {
        thumbnailUrl = (item['media:content'] as { ['@_url']: string })['@_url'];
      }

      const videoId = this.extractVideoId(link);
      if (!videoId) {
        return null;
      }

      const publishedAt = this.parsePubDate(pubDate);
      if (!publishedAt) {
        return null;
      }

      const result: ParsedVideoItem = {
        videoId,
        title,
        link,
        publishedAt,
      };

      if (description) {
        result.description = description;
      }

      if (thumbnailUrl) {
        result.thumbnailUrl = thumbnailUrl;
      }

      return result;
    } catch {
      return null;
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) {
        return match[1]
      }
    }

    return null
  }

  private parsePubDate(pubDate: string): Date | null {
    try {
      if (!pubDate.includes(',') || !pubDate.includes('GMT')) {
        return null
      }

      const date = new Date(pubDate)
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }
}

// FeedStateManager as a plain object (avoid extraneous-class lint)
const FeedStateManager = {
  shouldPoll(state: FeedState): boolean {
    if (state.status === 'paused') {
      return false
    }

    if (!state.lastPolledAt) {
      return true
    }

    const now = new Date()
    const timeSinceLastPoll = now.getTime() - state.lastPolledAt.getTime()
    const pollIntervalMs = state.pollIntervalMinutes * 60 * 1000

    return timeSinceLastPoll >= pollIntervalMs
  },

  hasChanges(
    currentState: FeedState,
    headers: { etag?: string | undefined; lastModified?: string | undefined }
  ): boolean {
    if (currentState.lastETag && headers.etag === currentState.lastETag) {
      return false
    }
    if (currentState.lastModified && headers.lastModified === currentState.lastModified) {
      return false
    }
    return true
  },

  updateAfterSuccessfulPoll(
    currentState: FeedState,
    headers: { etag?: string | undefined; lastModified?: string | undefined },
    latestVideoPublishedAt?: Date
  ): FeedState {
    const now = new Date()

    const updatedState: FeedState = {
      ...currentState,
      lastPolledAt: now,
      consecutiveErrors: 0,
      status: 'active',
    }

    if (headers.etag !== undefined) {
      updatedState.lastETag = headers.etag
    }

    if (headers.lastModified !== undefined) {
      updatedState.lastModified = headers.lastModified
    }

    if (latestVideoPublishedAt !== undefined) {
      updatedState.lastVideoPublishedAt = latestVideoPublishedAt
    }

    delete updatedState.errorMessage

    return updatedState
  },

  updateAfterFailedPoll(
    currentState: FeedState,
    error: Error
  ): FeedState {
    const newErrorCount = currentState.consecutiveErrors + 1
    const shouldPause = newErrorCount >= 5

    return {
      ...currentState,
      consecutiveErrors: newErrorCount,
      status: shouldPause ? 'paused' : 'error',
      errorMessage: error.message,
      lastPolledAt: new Date(),
    }
  },

  filterNewVideos(
    state: FeedState,
    videos: Array<{ videoId: string; publishedAt: Date }>
  ): string[] {
    return videos
      .filter(video => {
        if (!state.lastVideoPublishedAt) {
          return true
        }
        return video.publishedAt > state.lastVideoPublishedAt
      })
      .map(video => video.videoId)
  },
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  const startTime = Date.now()

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json()
    const { channelId } = body

    if (!channelId) {
      throw new Error('channelId is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase env vars missing')
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get channel feed configuration
    const { data: feedData, error: dbError } = await supabase
      .from('channel_feeds')
      .select('*')
      .eq('channel_id', channelId)
      .single()

    if (dbError || !feedData) {
      throw new Error(`Channel feed not found: ${dbError?.message ?? 'No feed configured'}`)
    }

    // Convert database row to FeedState
    const currentState: FeedState = {
      channelId: feedData.channel_id,
      feedUrl: feedData.feed_url,
      pollIntervalMinutes: feedData.poll_interval_minutes ?? 10,
      consecutiveErrors: feedData.consecutive_errors ?? 0,
      status: feedData.status ?? 'active',
      ...(feedData.last_etag && { lastETag: feedData.last_etag }),
      ...(feedData.last_modified && { lastModified: feedData.last_modified }),
      ...(feedData.last_polled_at && { lastPolledAt: new Date(feedData.last_polled_at) }),
      ...(feedData.last_video_published_at && { lastVideoPublishedAt: new Date(feedData.last_video_published_at) }),
      ...(feedData.error_message && { errorMessage: feedData.error_message }),
    }

    // Check if feed should be polled
    if (!FeedStateManager.shouldPoll(currentState)) {
      return new Response(
        JSON.stringify({
          success: true,
          channelId,
          newVideosCount: 0,
          hasChanges: false,
          executionTimeMs: Date.now() - startTime,
        } as ResponseBody),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch RSS feed with conditional headers
    const headers: Record<string, string> = {}
    if (currentState.lastETag) {
      headers['If-None-Match'] = currentState.lastETag
    }
    if (currentState.lastModified) {
      headers['If-Modified-Since'] = currentState.lastModified
    }

    const feedResponse = await fetch(currentState.feedUrl, {
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    // Handle 304 Not Modified (no changes)
    if (feedResponse.status === 304) {
      const updatedState = FeedStateManager.updateAfterSuccessfulPoll(
        currentState,
        {
          etag: currentState.lastETag,
          lastModified: currentState.lastModified,
        },
        undefined // no new videos
      )

      await updateFeedState(supabase, updatedState)

      return new Response(
        JSON.stringify({
          success: true,
          channelId,
          newVideosCount: 0,
          hasChanges: false,
          executionTimeMs: Date.now() - startTime,
        } as ResponseBody),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (!feedResponse.ok) {
      throw new Error(`RSS feed fetch failed: ${feedResponse.status} ${feedResponse.statusText}`)
    }

    // Parse RSS feed
    const xmlContent = await feedResponse.text()
    const parser = new RSSParser()
    const videos: ParsedVideoItem[] = parser.parseFeed(xmlContent)

    // Get response headers for caching
    const responseHeaders = {
      etag: feedResponse.headers.get('etag') ?? undefined,
      lastModified: feedResponse.headers.get('last-modified') ?? undefined,
    }

    // Check if feed has changes
    const hasChanges = FeedStateManager.hasChanges(currentState, responseHeaders)

    if (!hasChanges) {
      // Update state but no new videos
      const updatedState = FeedStateManager.updateAfterSuccessfulPoll(
        currentState,
        responseHeaders,
        undefined
      )
      await updateFeedState(supabase, updatedState)

      return new Response(
        JSON.stringify({
          success: true,
          channelId,
          newVideosCount: 0,
          hasChanges: false,
          executionTimeMs: Date.now() - startTime,
        } as ResponseBody),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Find new videos
    const newVideos = FeedStateManager.filterNewVideos(currentState, videos)

    if (newVideos.length > 0) {
      // Enqueue video hydration jobs for new videos
      const jobInserts = newVideos.map(videoId => ({
        type: 'REFRESH_VIDEO_STATS',
        channel_id: channelId,
        video_ids: [videoId],
        priority: 7, // High priority for new videos
        dedup_key: `refresh_video_stats_${videoId}`,
      }))

      const { error: jobDbError } = await supabase
        .from('jobs')
        .insert(jobInserts)

      if (jobDbError) {
        console.error('Failed to enqueue video jobs:', jobDbError)
        // Continue with feed state update even if job enqueue fails
      }
    }

    // Update feed state
    const latestVideoPublishedAt = videos.length > 0
      ? videos.reduce((latest, video) =>
          video.publishedAt > latest ? video.publishedAt : latest,
          new Date(0)
        )
      : undefined

    const updatedState = FeedStateManager.updateAfterSuccessfulPoll(
      currentState,
      responseHeaders,
      latestVideoPublishedAt
    )

    await updateFeedState(supabase, updatedState)

    const response: ResponseBody = {
      success: true,
      channelId,
      newVideosCount: newVideos.length,
      hasChanges: true,
      executionTimeMs: Date.now() - startTime,
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (err: unknown) {
    const error = toError(err)
    console.error('RSS poller error:', error)

    // Try to update feed state with error if we have channel info
    try {
      const body: RequestBody = await req.clone().json()
      if (body.channelId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Supabase env vars missing')
        }
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: feedData } = await supabase
          .from('channel_feeds')
          .select('*')
          .eq('channel_id', body.channelId)
          .single()

        if (feedData) {
          const currentState: FeedState = {
            channelId: feedData.channel_id,
            feedUrl: feedData.feed_url,
            pollIntervalMinutes: feedData.poll_interval_minutes ?? 10,
            consecutiveErrors: feedData.consecutive_errors ?? 0,
            status: feedData.status ?? 'active',
            ...(feedData.last_etag && { lastETag: feedData.last_etag }),
            ...(feedData.last_modified && { lastModified: feedData.last_modified }),
            ...(feedData.last_polled_at && { lastPolledAt: new Date(feedData.last_polled_at) }),
            ...(feedData.last_video_published_at && { lastVideoPublishedAt: new Date(feedData.last_video_published_at) }),
            ...(feedData.error_message && { errorMessage: feedData.error_message }),
          }

          const errorState = FeedStateManager.updateAfterFailedPoll(
            currentState,
            error
          )

          await updateFeedState(supabase, errorState)
        }
      }
    } catch (updateErr: unknown) {
      const updateError = toError(updateErr)
      console.error('Failed to update error state:', updateError)
    }

    const response: ResponseBody = {
      success: false,
      channelId: '',
      newVideosCount: 0,
      hasChanges: false,
  error: error.message,
      executionTimeMs: Date.now() - startTime,
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
async function updateFeedState(supabase: SupabaseClient, state: FeedState) {
  const { error: dbError } = await supabase
    .from('channel_feeds')
    .update({
      last_etag: state.lastETag,
      last_modified: state.lastModified,
      last_polled_at: state.lastPolledAt?.toISOString(),
      last_video_published_at: state.lastVideoPublishedAt?.toISOString(),
      poll_interval_minutes: state.pollIntervalMinutes,
      consecutive_errors: state.consecutiveErrors,
      status: state.status,
      error_message: state.errorMessage,
    })
    .eq('channel_id', state.channelId)

  if (dbError) {
      console.error('Failed to update feed state:', toError(dbError))
      throw toError(dbError)
    }
}