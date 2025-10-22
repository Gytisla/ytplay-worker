import { z } from 'zod'

// ============================================================================
// Common YouTube API Types
// ============================================================================

/**
 * YouTube API Error Response Schema
 */
export const YouTubeApiErrorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    errors: z.array(z.object({
      domain: z.string(),
      reason: z.string(),
      message: z.string(),
      location: z.string().optional(),
      locationType: z.string().optional(),
    })),
  }),
})

export type YouTubeApiError = z.infer<typeof YouTubeApiErrorSchema>

/**
 * YouTube API Page Info Schema
 */
export const PageInfoSchema = z.object({
  totalResults: z.number(),
  resultsPerPage: z.number(),
})

export type PageInfo = z.infer<typeof PageInfoSchema>

/**
 * YouTube Thumbnail Schema
 */
export const ThumbnailSchema = z.object({
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export type Thumbnail = z.infer<typeof ThumbnailSchema>

/**
 * YouTube Thumbnails Collection Schema
 */
export const ThumbnailsSchema = z.object({
  default: ThumbnailSchema.optional(),
  medium: ThumbnailSchema.optional(),
  high: ThumbnailSchema.optional(),
  standard: ThumbnailSchema.optional(),
  maxres: ThumbnailSchema.optional(),
})

export type Thumbnails = z.infer<typeof ThumbnailsSchema>

// ============================================================================
// Channel API Types
// ============================================================================

/**
 * YouTube Channel Snippet Schema
 */
export const ChannelSnippetSchema = z.object({
  title: z.string(),
  description: z.string(),
  customUrl: z.string().optional(),
  publishedAt: z.string().datetime(),
  thumbnails: ThumbnailsSchema,
  defaultLanguage: z.string().optional(),
  localized: z.object({
    title: z.string(),
    description: z.string(),
  }).optional(),
  country: z.string().optional(),
})

export type ChannelSnippet = z.infer<typeof ChannelSnippetSchema>

/**
 * YouTube Channel Statistics Schema
 */
export const ChannelStatisticsSchema = z.object({
  viewCount: z.string(),
  subscriberCount: z.string().optional(), // Hidden for some channels
  hiddenSubscriberCount: z.boolean(),
  videoCount: z.string(),
})

export type ChannelStatistics = z.infer<typeof ChannelStatisticsSchema>

/**
 * YouTube Channel Status Schema
 */
export const ChannelStatusSchema = z.object({
  privacyStatus: z.enum(['public', 'unlisted', 'private']),
  isLinked: z.boolean(),
  longUploadsStatus: z.enum(['allowed', 'disallowed', 'eligible', 'longUploadsUnspecified']),
  madeForKids: z.boolean().optional(),
  selfDeclaredMadeForKids: z.boolean().optional(),
})

export type ChannelStatus = z.infer<typeof ChannelStatusSchema>

/**
 * YouTube Channel Content Details Schema
 */
export const ChannelContentDetailsSchema = z.object({
  relatedPlaylists: z.object({
    likes: z.string().optional(),
    favorites: z.string().optional(),
    uploads: z.string(),
    watchHistory: z.string().optional(),
    watchLater: z.string().optional(),
  }),
})

export type ChannelContentDetails = z.infer<typeof ChannelContentDetailsSchema>

/**
 * YouTube Channel Branding Settings Schema
 */
export const ChannelBrandingSettingsSchema = z.object({
  channel: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.string().optional(),
    defaultTab: z.string().optional(),
    trackingAnalyticsAccountId: z.string().optional(),
    moderateComments: z.boolean().optional(),
    showRelatedChannels: z.boolean().optional(),
    showBrowseView: z.boolean().optional(),
    featuredChannelsTitle: z.string().optional(),
    featuredChannelsUrls: z.array(z.string()).optional(),
    unsubscribedTrailer: z.string().optional(),
    profileColor: z.string().optional(),
    defaultLanguage: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  watch: z.object({
    textColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    featuredPlaylistId: z.string().optional(),
  }).optional(),
}).optional()

export type ChannelBrandingSettings = z.infer<typeof ChannelBrandingSettingsSchema>

/**
 * YouTube Channel Resource Schema
 */
export const ChannelResourceSchema = z.object({
  kind: z.literal('youtube#channel'),
  etag: z.string(),
  id: z.string(),
  snippet: ChannelSnippetSchema.optional(),
  statistics: ChannelStatisticsSchema.optional(),
  status: ChannelStatusSchema.optional(),
  contentDetails: ChannelContentDetailsSchema.optional(),
  brandingSettings: ChannelBrandingSettingsSchema.optional(),
})

export type ChannelResource = z.infer<typeof ChannelResourceSchema>

/**
 * YouTube Channels List Response Schema
 */
export const ChannelsListResponseSchema = z.object({
  kind: z.literal('youtube#channelListResponse'),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: PageInfoSchema,
  items: z.array(ChannelResourceSchema).optional().default([]),
})

export type ChannelsListResponse = z.infer<typeof ChannelsListResponseSchema>

// ============================================================================
// Video API Types
// ============================================================================

/**
 * YouTube Video Snippet Schema
 */
export const VideoSnippetSchema = z.object({
  publishedAt: z.string().datetime(),
  channelId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnails: ThumbnailsSchema,
  channelTitle: z.string(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string(),
  liveBroadcastContent: z.enum(['none', 'upcoming', 'live', 'completed']),
  defaultLanguage: z.string().optional(),
  localized: z.object({
    title: z.string(),
    description: z.string(),
  }).optional(),
  defaultAudioLanguage: z.string().optional(),
})

export type VideoSnippet = z.infer<typeof VideoSnippetSchema>

/**
 * YouTube Video Statistics Schema
 */
export const VideoStatisticsSchema = z.object({
  viewCount: z.string().optional(),
  likeCount: z.string().optional(),
  dislikeCount: z.string().optional(),
  favoriteCount: z.string().optional(),
  commentCount: z.string().optional(),
})

export type VideoStatistics = z.infer<typeof VideoStatisticsSchema>

/**
 * YouTube Video Status Schema
 */
export const VideoStatusSchema = z.object({
  uploadStatus: z.enum(['uploaded', 'processed', 'rejected', 'failed', 'deleted']),
  failureReason: z.string().optional(),
  rejectionReason: z.string().optional(),
  privacyStatus: z.enum(['public', 'unlisted', 'private']),
  publishAt: z.string().datetime().optional(),
  license: z.enum(['youtube', 'creativeCommon']),
  embeddable: z.boolean(),
  publicStatsViewable: z.boolean(),
  madeForKids: z.boolean().optional(),
  selfDeclaredMadeForKids: z.boolean().optional(),
})

export type VideoStatus = z.infer<typeof VideoStatusSchema>

/**
 * YouTube Video Content Details Schema
 */
export const VideoContentDetailsSchema = z.object({
  duration: z.string().optional(), // ISO 8601 duration (PT4M13S) - optional for unavailable videos
  dimension: z.enum(['2d', '3d']).optional(),
  definition: z.enum(['sd', 'hd']).optional(),
  caption: z.enum(['true', 'false']).optional(),
  licensedContent: z.boolean().optional(),
  regionRestriction: z.object({
    allowed: z.array(z.string()).optional(),
    blocked: z.array(z.string()).optional(),
  }).optional(),
  contentRating: z.object({
    acbRating: z.string().optional(),
    agcomRating: z.string().optional(),
    anatelRating: z.string().optional(),
    bbfcRating: z.string().optional(),
    bfvcRating: z.string().optional(),
    bmukkRating: z.string().optional(),
    catvfrRating: z.string().optional(),
    catvRating: z.string().optional(),
    cbfcRating: z.string().optional(),
    cccRating: z.string().optional(),
    cceRating: z.string().optional(),
    chfilmRating: z.string().optional(),
    chvrsRating: z.string().optional(),
    cicfRating: z.string().optional(),
    cnaRating: z.string().optional(),
    cncRating: z.string().optional(),
    csaRating: z.string().optional(),
    cscfRating: z.string().optional(),
    czfilmRating: z.string().optional(),
    djctqRating: z.string().optional(),
    djctqRatingReasons: z.array(z.string()).optional(),
    ecbmctRating: z.string().optional(),
    eefilmRating: z.string().optional(),
    egfilmRating: z.string().optional(),
    eirinRating: z.string().optional(),
    fcbmRating: z.string().optional(),
    fcoRating: z.string().optional(),
    fmocRating: z.string().optional(),
    fpbRating: z.string().optional(),
    fpbRatingReasons: z.array(z.string()).optional(),
    fskRating: z.string().optional(),
    grfilmRating: z.string().optional(),
    icaaRating: z.string().optional(),
    ifcoRating: z.string().optional(),
    ilfilmRating: z.string().optional(),
    incaaRating: z.string().optional(),
    kfcbRating: z.string().optional(),
    kijkwijzerRating: z.string().optional(),
    kmrbRating: z.string().optional(),
    lsfRating: z.string().optional(),
    mccaaRating: z.string().optional(),
    mccypRating: z.string().optional(),
    mcstRating: z.string().optional(),
    mdaRating: z.string().optional(),
    medietilsynetRating: z.string().optional(),
    mekuRating: z.string().optional(),
    mibacRating: z.string().optional(),
    mocRating: z.string().optional(),
    moctwRating: z.string().optional(),
    mpaaRating: z.string().optional(),
    mpaatRating: z.string().optional(),
    mtrcbRating: z.string().optional(),
    nbcRating: z.string().optional(),
    nbcplRating: z.string().optional(),
    nfrcRating: z.string().optional(),
    nfvcbRating: z.string().optional(),
    nkclvRating: z.string().optional(),
    oflcRating: z.string().optional(),
    pefilmRating: z.string().optional(),
    rcnofRating: z.string().optional(),
    resorteviolenciaRating: z.string().optional(),
    rtcRating: z.string().optional(),
    rteRating: z.string().optional(),
    russiaRating: z.string().optional(),
    skfilmRating: z.string().optional(),
    smaisRating: z.string().optional(),
    smsaRating: z.string().optional(),
    tvpgRating: z.string().optional(),
    ytRating: z.enum(['ytUnspecified', 'ytAgeRestricted']).optional(),
  }).optional(),
  projection: z.enum(['rectangular', '360']).optional(),
  hasCustomThumbnail: z.boolean().optional(),
})

export type VideoContentDetails = z.infer<typeof VideoContentDetailsSchema>

/**
 * YouTube Video Topic Details Schema
 */
export const VideoTopicDetailsSchema = z.object({
  topicIds: z.array(z.string()),
  relevantTopicIds: z.array(z.string()).optional(),
  topicCategories: z.array(z.string()).optional(),
})

export type VideoTopicDetails = z.infer<typeof VideoTopicDetailsSchema>

/**
 * YouTube Video Resource Schema
 */
export const VideoResourceSchema = z.object({
  kind: z.literal('youtube#video'),
  etag: z.string(),
  id: z.string(),
  snippet: VideoSnippetSchema.optional(),
  statistics: VideoStatisticsSchema.optional(),
  status: VideoStatusSchema.optional(),
  contentDetails: VideoContentDetailsSchema.optional(),
  topicDetails: VideoTopicDetailsSchema.optional(),
})

export type VideoResource = z.infer<typeof VideoResourceSchema>

/**
 * YouTube Videos List Response Schema
 */
export const VideosListResponseSchema = z.object({
  kind: z.literal('youtube#videoListResponse'),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: PageInfoSchema,
  items: z.array(VideoResourceSchema),
})

export type VideosListResponse = z.infer<typeof VideosListResponseSchema>

// ============================================================================
// Playlist API Types
// ============================================================================

/**
 * YouTube Playlist Item Snippet Schema
 */
export const PlaylistItemSnippetSchema = z.object({
  publishedAt: z.string().datetime(),
  channelId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnails: ThumbnailsSchema,
  channelTitle: z.string(),
  videoOwnerChannelTitle: z.string().optional(),
  videoOwnerChannelId: z.string().optional(),
  playlistId: z.string(),
  position: z.number(),
  resourceId: z.object({
    kind: z.string(),
    videoId: z.string().optional(),
  }),
})

export type PlaylistItemSnippet = z.infer<typeof PlaylistItemSnippetSchema>

/**
 * YouTube Playlist Item Status Schema
 */
export const PlaylistItemStatusSchema = z.object({
  privacyStatus: z.enum(['public', 'unlisted', 'private']),
})

export type PlaylistItemStatus = z.infer<typeof PlaylistItemStatusSchema>

/**
 * YouTube Playlist Item Content Details Schema
 */
export const PlaylistItemContentDetailsSchema = z.object({
  videoId: z.string(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  note: z.string().optional(),
  videoPublishedAt: z.string().datetime().optional(),
})

export type PlaylistItemContentDetails = z.infer<typeof PlaylistItemContentDetailsSchema>

/**
 * YouTube Playlist Item Resource Schema
 */
export const PlaylistItemResourceSchema = z.object({
  kind: z.literal('youtube#playlistItem'),
  etag: z.string(),
  id: z.string(),
  snippet: PlaylistItemSnippetSchema.optional(),
  status: PlaylistItemStatusSchema.optional(),
  contentDetails: PlaylistItemContentDetailsSchema.optional(),
})

export type PlaylistItemResource = z.infer<typeof PlaylistItemResourceSchema>

/**
 * YouTube Playlist Items List Response Schema
 */
export const PlaylistItemsListResponseSchema = z.object({
  kind: z.literal('youtube#playlistItemListResponse'),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: PageInfoSchema,
  items: z.array(PlaylistItemResourceSchema),
})

export type PlaylistItemsListResponse = z.infer<typeof PlaylistItemsListResponseSchema>

// ============================================================================
// Request Parameter Types
// ============================================================================

/**
 * Common YouTube API Request Parameters
 */
export const CommonRequestParamsSchema = z.object({
  key: z.string(),
  part: z.string(),
  maxResults: z.number().min(0).max(50).optional(),
  pageToken: z.string().optional(),
  fields: z.string().optional(),
})

/**
 * Channels List Request Parameters
 */
export const ChannelsListParamsSchema = CommonRequestParamsSchema.extend({
  part: z.string(), // Required override
  id: z.string().optional(),
  forUsername: z.string().optional(),
  managedByMe: z.boolean().optional(),
  mine: z.boolean().optional(),
  hl: z.string().optional(),
  onBehalfOfContentOwner: z.string().optional(),
})

export type ChannelsListParams = z.infer<typeof ChannelsListParamsSchema>

/**
 * Videos List Request Parameters
 */
export const VideosListParamsSchema = CommonRequestParamsSchema.extend({
  part: z.string(), // Required override
  id: z.string().optional(),
  chart: z.enum(['mostPopular']).optional(),
  myRating: z.enum(['like', 'dislike']).optional(),
  hl: z.string().optional(),
  maxHeight: z.number().optional(),
  maxWidth: z.number().optional(),
  regionCode: z.string().optional(),
  videoCategoryId: z.string().optional(),
  onBehalfOfContentOwner: z.string().optional(),
})

export type VideosListParams = z.infer<typeof VideosListParamsSchema>

/**
 * Playlist Items List Request Parameters
 */
export const PlaylistItemsListParamsSchema = CommonRequestParamsSchema.extend({
  part: z.string(), // Required override
  playlistId: z.string(),
  videoId: z.string().optional(),
  id: z.string().optional(),
  onBehalfOfContentOwner: z.string().optional(),
})

export type PlaylistItemsListParams = z.infer<typeof PlaylistItemsListParamsSchema>

// ============================================================================
// Utility Types for Our Application
// ============================================================================

/**
 * Parsed ISO 8601 duration in seconds
 */
export const DurationSchema = z.number().int().positive()
export type Duration = z.infer<typeof DurationSchema>

/**
 * YouTube video ID validation
 */
export const VideoIdSchema = z.string().regex(/^[\w-]{11}$/)
export type VideoId = z.infer<typeof VideoIdSchema>

/**
 * YouTube channel ID validation
 */
export const ChannelIdSchema = z.string().regex(/^UC[\w-]{22}$/)
export type ChannelId = z.infer<typeof ChannelIdSchema>

/**
 * YouTube playlist ID validation
 */
export const PlaylistIdSchema = z.string().regex(/^PL[\w-]{32}$/)
export type PlaylistId = z.infer<typeof PlaylistIdSchema>

/**
 * Batch request IDs (up to 50)
 */
export const BatchIdsSchema = z.array(z.string()).min(1).max(50)
export type BatchIds = z.infer<typeof BatchIdsSchema>

// ============================================================================
// Export all schemas for validation
// ============================================================================

export const YouTubeApiSchemas = {
  // Error handling
  YouTubeApiErrorSchema,

  // Common
  PageInfoSchema,
  ThumbnailSchema,
  ThumbnailsSchema,

  // Channel API
  ChannelSnippetSchema,
  ChannelStatisticsSchema,
  ChannelStatusSchema,
  ChannelContentDetailsSchema,
  ChannelBrandingSettingsSchema,
  ChannelResourceSchema,
  ChannelsListResponseSchema,

  // Video API
  VideoSnippetSchema,
  VideoStatisticsSchema,
  VideoStatusSchema,
  VideoContentDetailsSchema,
  VideoTopicDetailsSchema,
  VideoResourceSchema,
  VideosListResponseSchema,

  // Playlist API
  PlaylistItemSnippetSchema,
  PlaylistItemStatusSchema,
  PlaylistItemContentDetailsSchema,
  PlaylistItemResourceSchema,
  PlaylistItemsListResponseSchema,

  // Request parameters
  CommonRequestParamsSchema,
  ChannelsListParamsSchema,
  VideosListParamsSchema,
  PlaylistItemsListParamsSchema,

  // Utility
  DurationSchema,
  VideoIdSchema,
  ChannelIdSchema,
  PlaylistIdSchema,
  BatchIdsSchema,
} as const