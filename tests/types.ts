interface PostgresError extends Error {
  code: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

interface ParsedRSSItem {
  title: string;
  link: string;
  videoId: string;
  published: string;
}

interface FeedState {
  channelId: string;
  feedUrl: string;
  pollIntervalMinutes: number;
  consecutiveErrors: number;
  status: string;
  lastEtag?: string;
  lastModified?: string;
  lastPolledAt?: Date;
  lastVideoPublishedAt?: Date;
  errorMessage?: string;
}

interface JobHandlerResult {
  success: boolean;
  itemsProcessed?: number;
  error?: string;
}

export type { PostgresError, ParsedRSSItem, FeedState, JobHandlerResult };