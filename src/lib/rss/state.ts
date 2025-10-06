export interface FeedState {
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

export interface FeedPollResult {
  state: FeedState
  hasChanges: boolean
  newVideos: string[] // video IDs
  headers: {
    etag?: string
    lastModified?: string
  }
}

/**
 * Manages RSS feed polling state and change detection
 */
export const FeedStateManager = {
  /**
   * Create initial feed state for a channel
   */
  createInitialState(channelId: string, feedUrl: string): FeedState {
    return {
      channelId,
      feedUrl,
      pollIntervalMinutes: 10, // Default 10 minutes
      consecutiveErrors: 0,
      status: 'active',
    }
  },

// Removed duplicate method definitions after FeedStateManager object
  /**
   * Update feed state after successful poll
   */
  updateAfterSuccessfulPoll(
    currentState: FeedState,
    headers: { etag?: string; lastModified?: string },
    latestVideoPublishedAt?: Date
  ): FeedState {
    const now = new Date()

    const updatedState: FeedState = {
      ...currentState,
      lastPolledAt: now,
      consecutiveErrors: 0, // Reset error count
      status: 'active',
    }

    // Only update optional fields if they have values
    if (headers.etag !== undefined) {
      updatedState.lastETag = headers.etag
    }

    if (headers.lastModified !== undefined) {
      updatedState.lastModified = headers.lastModified
    }

    if (latestVideoPublishedAt !== undefined) {
      updatedState.lastVideoPublishedAt = latestVideoPublishedAt
    }

    // Clear error message
    delete updatedState.errorMessage

    return updatedState
  },

  /**
   * Update feed state after failed poll
   */
  updateAfterFailedPoll(
    currentState: FeedState,
    error: Error
  ): FeedState {
    const newErrorCount = currentState.consecutiveErrors + 1
    const shouldPause = newErrorCount >= 5 // Pause after 5 consecutive errors

    return {
      ...currentState,
      consecutiveErrors: newErrorCount,
      status: shouldPause ? 'paused' : 'error',
      errorMessage: error.message,
      lastPolledAt: new Date(),
    }
  },

  /**
   * Check if feed has changes based on HTTP headers
   */
  hasChanges(
    currentState: FeedState,
    headers: { etag?: string; lastModified?: string }
  ): boolean {
    // If we have an ETag and it matches, no changes
    if (currentState.lastETag && headers.etag === currentState.lastETag) {
      return false
    }

    // If we have Last-Modified and it matches, no changes
    if (currentState.lastModified && headers.lastModified === currentState.lastModified) {
      return false
    }

    // If neither ETag nor Last-Modified changed, assume no changes
    // (though this is less reliable than the above checks)
    if (currentState.lastETag && currentState.lastModified &&
        headers.etag === currentState.lastETag &&
        headers.lastModified === currentState.lastModified) {
      return false
    }

    return true
  },

  /**
   * Determine if feed should be polled based on time since last poll
   */
  shouldPoll(state: FeedState): boolean {
    if (state.status === 'paused') {
      return false
    }

    if (!state.lastPolledAt) {
      return true // Never polled before
    }

    const now = new Date()
    const timeSinceLastPoll = now.getTime() - state.lastPolledAt.getTime()
    const pollIntervalMs = state.pollIntervalMinutes * 60 * 1000

    return timeSinceLastPoll >= pollIntervalMs
  },

  /**
   * Calculate next poll time
   */
  getNextPollTime(state: FeedState): Date {
    if (!state.lastPolledAt) {
      return new Date() // Poll immediately if never polled
    }

    const pollIntervalMs = state.pollIntervalMinutes * 60 * 1000
    return new Date(state.lastPolledAt.getTime() + pollIntervalMs)
  },

  /**
   * Check if video is new based on publication date
   */
  isVideoNew(state: FeedState, videoPublishedAt: Date): boolean {
    if (!state.lastVideoPublishedAt) {
      return true // No previous videos seen
    }

    return videoPublishedAt > state.lastVideoPublishedAt
  },

  /**
   * Get videos that are new since last poll
   */
  filterNewVideos(
    state: FeedState,
    videos: Array<{ videoId: string; publishedAt: Date }>
  ): string[] {
    return videos
      .filter(video => FeedStateManager.isVideoNew(state, video.publishedAt))
      .map(video => video.videoId)
  },

  /**
   * Update poll interval based on feed activity
   */
  adjustPollInterval(state: FeedState, hasNewVideos: boolean): FeedState {
    let newInterval = state.pollIntervalMinutes

    if (hasNewVideos) {
      // Reduce interval for active channels (minimum 5 minutes)
      newInterval = Math.max(5, Math.floor(state.pollIntervalMinutes * 0.8))
    } else {
      // Increase interval for inactive channels (maximum 60 minutes)
      newInterval = Math.min(60, Math.floor(state.pollIntervalMinutes * 1.2))
    }

    return {
      ...state,
      pollIntervalMinutes: newInterval,
    }
  },
}