<!--
Sync Impact Report:
- Version change: template → 1.0.0
- Modified principles: All principles created from template
- Added sections: All core principles and governance sections
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md (Constitution Check section)
  ✅ spec-template.md (requirements alignment)
  ✅ tasks-template.md (task categorization)
- Follow-up TODOs: None
-->

# YouTube Fetcher Worker Constitution

## Core Principles

### I. Spec-Driven and Test-Driven Development (NON-NEGOTIABLE)

All features MUST begin with functional specifications in `/specs/` followed by comprehensive
tests. TDD cycle is mandatory: write tests first, ensure they fail, then implement. No code
merges without >90% test coverage. All external API calls MUST be mocked in tests.
CI pipeline MUST remain green at all times.

### II. Strong TypeScript Standards

All code MUST use strict TypeScript typing with no `any` types. ESLint and Prettier MUST be
enforced with zero warnings. Supabase client types MUST be used for all database interactions.
Type safety MUST be maintained across all Edge Functions and worker processes.
Code MUST pass `pnpm lint && pnpm test` before commit.

### III. Deterministic and Idempotent Operations

All database writes MUST be idempotent to handle retries safely. Jobs MUST be deterministic
with predictable outcomes. Queue operations MUST use `FOR UPDATE SKIP LOCKED` and advisory
locks for consistency. No side effects from repeated executions. All state changes MUST be
atomic and reversible.

### IV. Quota-Safe Adaptive Scheduling

All YouTube API calls MUST respect quota limits through intelligent batching and priority
systems. Hot videos MUST be prioritized over long-tail content. Scheduling MUST adapt based
on channel activity and API response patterns. System MUST handle 200-1000 channels
efficiently without quota exhaustion. Graceful degradation required when quotas approach limits.

### V. Comprehensive Observability

All operations MUST include structured logging with job metrics, retry counts, and performance
data. System MUST track quota usage, job success rates, and data freshness. Failed operations
MUST implement exponential backoff and dead letter handling. All components MUST be
monitorable and debuggable through logs and metrics.

## Architecture Standards

System MUST use Supabase Postgres for all data storage, queuing, and pg_cron scheduling.
Workers MUST be implemented as TypeScript/Deno Edge Functions. YouTube Data API v3 MUST be
the primary data source with RSS feeds for new video discovery. SQL migrations MUST define
all schema, views, and queue tables. Smart queuing MUST use advisory locks for coordination.

## Quality Gates

All code MUST pass linting, type checking, and testing before merge. No skipped tests are
allowed in the codebase. External API calls MUST be mocked for all tests. Database
interactions MUST be validated with proper Supabase typing. Historical data integrity MUST
be maintained across all operations. Performance benchmarks MUST be established and monitored.

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

All pull requests MUST verify compliance with TDD, TypeScript standards, and quota management
principles. Any deviation from deterministic operations or observability requirements MUST be
documented and justified. Constitution supersedes all other development practices. Amendments
require team consensus, documentation, and migration plan. Use agent-specific guidance files
for runtime development context.

**Version**: 1.0.0 | **Ratified**: 2025-10-05 | **Last Amended**: 2025-10-05
