# Tasks: YouTube Fetcher Worker — Ingestion & Refresh

**Input**: Design documents from `/Users/gytis/Documents/Projects/YT/specs/002-youtube-fetcher-worker/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Implementation plan loaded with 8-phase approach
   → ✅ Extracted: TypeScript + Nuxt + Supabase stack
2. Load optional design documents:
   → ✅ data-model.md: 8 entities (Channel, Video, ChannelStats, etc.)
   → ✅ contracts/: Management API + Database RPCs
   → ✅ research.md: Technical decisions and patterns
   → ✅ quickstart.md: 5 end-to-end test scenarios
3. Generate tasks by category:
   → ✅ Setup: TypeScript, ESLint, Vitest, Supabase configuration
   → ✅ Migrations: Database schema, indexes, RLS, utility functions
   → ✅ Libraries: YouTube client, queue management, observability
   → ✅ Workers: Edge Functions for job processing
   → ✅ API: Nuxt server routes with authentication
   → ✅ Observability: Logging, metrics, monitoring
4. Apply task rules:
   → Different files = marked [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD enforced)
5. Number tasks sequentially (T001-T080)
6. Generate dependency graph and parallel execution examples
7. Validate task completeness: All entities, contracts, and scenarios covered
8. Return: SUCCESS (80 tasks ready for execution across 8 phases)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
Backend-first monorepo structure:
- `src/lib/` - Shared libraries and utilities
- `src/workers/` - Job handlers and database operations
- `server/api/` - Nuxt API routes and middleware
- `edge-functions/` - Supabase Edge Functions (Deno)
- `migrations/` - Database schema and setup
- `tests/` - Unit, integration, and E2E tests

## Phase P0: Repository & Tooling Setup

- [x] T001 Initialize repository structure with package.json and basic configuration
- [x] T002 [P] Configure TypeScript strict mode with tsconfig.json
- [x] T003 [P] Set up ESLint configuration with @typescript-eslint rules in .eslint.config.js
- [x] T004 [P] Configure Prettier formatting rules in .prettierrc
- [x] T005 [P] Set up Vitest testing framework with vitest.config.ts
- [x] T006 [P] Create .env.example with required environment variables
- [x] T006-1 [P] Setup husky - precommit lint
- [x] T007 [P] Configure package.json scripts: lint, typecheck, test, coverage
- [x] T008 [P] Set up GitHub Actions CI workflow in .github/workflows/ci.yml
- [x] T009 Initialize Nuxt 3 project with TypeScript support
- [x] T010 [P] Configure Supabase project and local development setup

## Phase P1: Database Schema & RLS

- [x] T011 [P] Create migrations/001_init.sql with core tables (channels, videos, channel_stats, video_stats)
- [x] T012 [P] Create migrations/002_jobs.sql with job queue tables (jobs, job_events)
- [x] T013 [P] Create migrations/003_feeds.sql with RSS feed tracking (channel_feeds, api_budget)
- [x] T014 [P] Create migrations/004_indexes.sql with performance indexes
- [x] T015 [P] Create migrations/005_rls.sql with Row Level Security policies
- [x] T016 [P] Create migrations/006_utility.sql with utility functions and views
- [x] T017 Apply all migrations to local Supabase instance
- [x] T018 [P] Write database unit tests in tests/unit/database/ for constraints and RLS. Check migrations/ folter and allign to it!
- [x] T019 [P] Create Supabase TypeScript type definitions
- [x] T020 Validate database schema with sample data insertion

## Phase P2: Queue Mechanics & Database RPCs

- [x] T021 [P] Create enqueue_job RPC function in migrations/007_rpc_enqueue.sql
- [x] T022 [P] Create dequeue_jobs RPC function in migrations/008_rpc_dequeue.sql
- [x] T023 [P] Create ack_job/retry_job/dead_letter_job RPCs in migrations/009_rpc_lifecycle.sql
- [x] T024 [P] Create data management RPCs (upsert_channel, upsert_videos) in migrations/010_rpc_data.sql
- [x] T025 [P] Create analytics RPCs (queue_metrics, api_quota_status) in migrations/011_rpc_analytics.sql
- [x] T026 Apply RPC migrations to database
- [x] T027 [P] Write concurrency tests for queue dequeue fairness in tests/integration/queue/
- [x] T028 [P] Write tests for job retry logic and exponential backoff in tests/unit/queue/
- [x] T029 [P] Write tests for deduplication and advisory locking in tests/integration/queue/
- [x] T030 Validate queue mechanics with multi-worker simulation

## Phase P3: YouTube API Client (Batched, Typed, Mockable)

- [x] T031 [P] Create YouTube API types with Zod schemas in src/lib/youtube/types.ts
- [x] T032 [P] Create base HTTP client with retry logic in src/lib/youtube/client.ts
- [x] T033 [P] Create channels.list API wrapper with batching in src/lib/youtube/channels.ts
- [x] T034 [P] Create videos.list API wrapper with batching in src/lib/youtube/videos.ts
- [x] T035 [P] Create playlistItems.list API wrapper with pagination in src/lib/youtube/playlists.ts
- [x] T036 [P] Create quota management with token bucket in src/lib/youtube/quota.ts
- [x] T037 [P] Add ETag/If-None-Match support for bandwidth optimization
- [x] T038 [P] Write comprehensive mocked tests in tests/unit/youtube or tests/integration/youtube
- [x] T039 [P] Test error handling for 429/5xx responses with backoff
- [x] T040 Test end-to-end YouTube API integration with real but limited calls

## Phase P4: RSS Feed Polling

- [x] T041 [P] Create RSS feed parser in src/lib/rss/parser.ts with XML handling
- [x] T042 [P] Create feed state management in src/lib/rss/state.ts for ETag/Last-Modified
- [x] T043 [P] Create video ID extraction logic in src/lib/rss/extractor.ts
- [x] T044 Create RSS poller Edge Function in edge-functions/rss_poller/index.ts
- [x] T045 [P] Add RSS polling database operations in src/workers/rss.ts
- [x] T046 [P] Write RSS parsing tests with mock XML feeds in tests/unit/rss/
- [x] T047 [P] Write feed state management tests in tests/integration/rss/
- [x] T048 [P] Test new video discovery and job enqueueing workflow
- [x] T049 [P] Test RSS error handling and fallback mechanisms
- [x] T050 Validate RSS polling with real YouTube channel feeds

## Phase P5: Edge Function Workers

- [x] T051 Create main queue worker Edge Function in edge-functions/queue_worker/index.ts
- [x] T052 [P] Create BACKFILL_CHANNEL job handler in src/workers/handlers/backfill.ts
- [x] T053 [P] Create REFRESH_CHANNEL_STATS job handler in src/workers/handlers/channel-stats.ts
- [x] T054 [P] Create REFRESH_HOT_VIDEOS job handler in src/workers/handlers/hot-videos.ts
- [x] T055 [P] Create REFRESH_VIDEO_STATS job handler in src/workers/handlers/video-stats.ts
- [x] T056 [P] Create RSS_POLL_CHANNEL job handler in src/workers/handlers/rss-poll.ts
- [x] T057 [P] Create idempotent database operations in src/workers/db.ts
- [ ] T058 [P] Add job coordination and advisory locking logic
- [x] T059 [P] Write integration tests for each job handler in tests/integration/workers/
- [x] T060 [P] Test job coalescing and batch processing logic
- [ ] T061 [P] Test idempotency with duplicate job scenarios
- [x] T061-1 [P] Implement T052-T056 in the T051
- [x] T062 Deploy and test Edge Functions in Supabase environment

## Phase P6: pg_cron Scheduling

- [x] T063 [P] Create pg_cron setup in migrations/012_pg_cron.sql
- [x] T064 [P] Schedule RSS_POLL_CHANNEL jobs (every 10 minutes)
- [x] T065 [P] Schedule REFRESH_CHANNEL_STATS jobs (daily at 03:00)
- [x] T066 [P] Schedule REFRESH_HOT_VIDEOS jobs (hourly)
- [x] T067 [P] Schedule REFRESH_VIDEO_STATS jobs (weekly rotation by channel hash)
- [ ] T068 [P] Schedule REQUEUE_STUCK jobs (hourly cleanup)
- [x] T069 Apply cron scheduling to database
- [ ] T070 [P] Write tests for schedule timing and dedup keys in tests/unit/cron/
- [ ] T071 [P] Test schedule conflict resolution and job distribution
- [ ] T072 Validate cron scheduling with time-accelerated testing

## Phase P7: Nuxt Server API (API Key Authentication)

- [ ] T073 [P] Create API key authentication middleware in server/middleware/apiKey.ts
- [ ] T074 [P] Create channel registration endpoint in server/api/channels.post.ts
- [ ] T075 [P] Create channel pause/resume endpoints in server/api/channels/[id]/pause.post.ts and resume.post.ts
- [ ] T076 [P] Create system health endpoint in server/api/health.get.ts
- [ ] T077 [P] Create manual job enqueue endpoint in server/api/jobs/enqueue.post.ts
- [ ] T078 [P] Write API authentication tests in tests/integration/api/auth.test.ts
- [ ] T079 [P] Write endpoint validation tests in tests/integration/api/endpoints.test.ts
- [ ] T080 [P] Write API integration tests covering full request/response cycles

## Phase P8: Observability & Operations

- [x] T081 [P] Create structured logging utilities in src/lib/obs/logger.ts
- [x] T082 [P] Add logging to all job handlers
- [ ] T083 [P] Create metrics collection in src/lib/obs/metrics.ts
- [ ] T084 [P] Create database metrics views in migrations/013_metrics_views.sql
- [ ] T085 [P] Create system metrics endpoint in server/api/metrics.get.ts
- [ ] T086 [P] Add performance monitoring to all job handlers
- [ ] T087 [P] Add quota usage tracking logic
- [ ] T088 [P] Write observability tests in tests/unit/observability/
- [ ] T089 [P] Write metrics calculation tests in tests/integration/metrics/
- [ ] T090 Create comprehensive end-to-end test suite covering all quickstart scenarios
- [ ] T091 [P] Set up performance benchmarking and load testing
- [ ] T092 [P] Create operational runbook and troubleshooting documentation
- [ ] T093 Validate complete system with 100+ channel simulation

- [x] T094 [P] Call queue worker supabase functuon with Database-scheduled processing
 - [x] T095 [P] Create trigger to fill in channel_feeds automatically when new channel is added - https://www.youtube.com/feeds/videos.xml?channel_id=<channel_id>
- [ ] T096 [P] Create trigger to automatically insert BACKFILL_CHANNEL queue job on channel creation

# Phase P9: Front-end

- [ ] T099 [P] Create Layout with Header, Content and Footer
 - [x] T099 [P] Create Layout with Header, Content and Footer
 - [x] T100 [P] Create Home Page
- [ ] T101 [P] Create Top Channels Page
- [ ] T102 [P] Create Top Videos Page
- [ ] T103 [P] Create One Channel Page
 - [ ] T104 [P] Create Video Detail modal/page (no inline streaming)
 - [ ] T104 [P] Create Video Detail modal/page (no inline streaming)
 - [x] T105 [P] Implement theme selector in header (light/dark/system) with persistence
 - [ ] T106 [P] Implement search and category filters (server-side or client-side as appropriate)
 - [ ] T107 [P] Implement discovery sections on home page: New, Trending, Top (with skeleton loaders)
 - [ ] T108 [P] Implement infinite scroll/pagination for lists with graceful fallback
 - [ ] T109 [P] Implement accessible keyboard navigation and focus management for card grids
 - [ ] T110 [P] Implement open graph and SSR meta tags for landing and category pages
 - [ ] T111 [P] Add small animation library or utilities (prefers-reduced-motion aware)
 - [ ] T112 [P] Create lightweight client-side caching for discovery endpoints
 - [ ] T113 [P] Write unit tests for UI components (Vitest + testing-library)
 - [ ] T114 [P] Write integration tests for public endpoints and SSR pages
 - [ ] T115 [P] Create end-to-end smoke test for discovery flow (landing -> open video detail)

## Public API Endpoints (server)

- `GET /api/public/discovery?section=new|trending|top&category=&page=&limit=` - returns list of lightweight video cards
- `GET /api/public/videos/:id` - returns video metadata for detail view (no streaming)
- `GET /api/public/channels/:id` - returns channel card and aggregated stats
- `GET /api/public/top-channels?category=&page=&limit=` - paginated top channels
- `GET /api/public/search?q=&category=&page=&limit=` - simple search for videos and channels

## QA & Acceptance Tasks

- [ ] QA001 Validate landing page shows New, Trending, Top sections with content on mobile and desktop
- [ ] QA002 Validate theme toggle persists and prevents FOUT on first load (SSR cookie or server hint)
- [ ] QA003 Accessibility audit: keyboard navigation, color contrast, screen reader labels
- [ ] QA004 Performance: Lighthouse scores (PWA, Performance > 80, Accessibility > 90)
- [ ] QA005 Privacy audit: confirm no secrets or user PII stored for anonymous users
- [ ] QA006 Security: Ensure rate limits and no API keys are exposed client-side


## Dependencies

### Critical Path Dependencies
- T001-T010 (Setup) → Everything else
- T011-T020 (Database) → T021-T030 (Queue) → T051-T062 (Workers)
- T031-T040 (YouTube API) → T051-T062 (Workers)
- T041-T050 (RSS) → T056 (RSS handler)
- T063-T072 (Cron) → T051-T062 (Workers)
- T073-T080 (API) requires T021-T030 (Queue RPCs)
- T081-T092 (Observability) → Final validation

### Parallel Execution Opportunities
- T002-T008: All tooling configuration can run in parallel
- T011-T016: All migration files can be created in parallel
- T031-T037: All YouTube API components can be developed in parallel
- T052-T056: All job handlers can be implemented in parallel
- T074-T077: All API endpoints can be created in parallel

## Parallel Execution Examples

### Phase P0 Tooling Setup
```bash
# These can all run simultaneously:
Task: "Configure TypeScript strict mode with tsconfig.json"
Task: "Set up ESLint configuration with @typescript-eslint rules"
Task: "Configure Prettier formatting rules"
Task: "Set up Vitest testing framework"
Task: "Create .env.example with environment variables"
```

### Phase P3 YouTube API Development
```bash
# These can run in parallel after types are defined:
Task: "Create channels.list API wrapper with batching"
Task: "Create videos.list API wrapper with batching"
Task: "Create playlistItems.list API wrapper with pagination"
Task: "Create quota management with token bucket"
```

### Phase P5 Worker Handlers
```bash
# These can all be developed simultaneously:
Task: "Create BACKFILL_CHANNEL job handler"
Task: "Create REFRESH_CHANNEL_STATS job handler"
Task: "Create REFRESH_HOT_VIDEOS job handler"
Task: "Create REFRESH_VIDEO_STATS job handler"
```

## Notes
- [P] tasks target different files with no shared dependencies
- All tests must be written before implementation (TDD enforced)
- Commit after each completed task for incremental progress
- Integration tests require local Supabase instance
- Edge Functions require Supabase CLI for local development

## Validation Checklist

### Database Coverage
- [x] All 8 entities from data-model.md have corresponding tables
- [x] All RPC functions from contracts/database-rpcs.md implemented
- [x] Queue mechanics with advisory locks and SKIP LOCKED
- [x] RLS policies for security isolation

### API Coverage
- [x] All endpoints from contracts/management-api.yml implemented
- [x] Authentication middleware for API key validation
- [x] Input validation and error handling
- [x] Integration with database RPCs

### Test Coverage
- [x] All 5 quickstart scenarios have corresponding tests
- [x] Unit tests for all libraries and utilities
- [x] Integration tests for database and API operations
- [x] End-to-end tests for complete workflows

### Constitutional Compliance
- [x] >90% test coverage requirement planned
- [x] TypeScript strict mode enforced
- [x] Idempotent operations for all data writes
- [x] Comprehensive observability and monitoring
- [x] Quota-safe YouTube API integration