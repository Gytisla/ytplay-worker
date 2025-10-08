
# Implementation Plan: YouTube Fetcher Worker — Ingestion & Refresh

**Branch**: `002-youtube-fetcher-worker` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/gytis/Documents/Projects/YT/specs/002-youtube-fetcher-worker/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Backend-first implementation of YouTube data ingestion system using Supabase Postgres + pg_cron + 
Edge Functions + Nuxt server API. Supports 200-1000 channels with quota-aware batching, 
intelligent scheduling, and comprehensive observability. API key authenticated management interface 
for channel registration and health monitoring.

## Technical Context
**Language/Version**: TypeScript 5.0+ (strict mode), Node.js 18+  
**Primary Dependencies**: Nuxt 3, Supabase (Postgres + Edge Functions), Vitest, ESLint, Prettier  
**Storage**: Supabase Postgres with RLS, pg_cron for scheduling  
**Testing**: Vitest with >90% coverage, mocked external APIs  
**Target Platform**: Supabase Edge Functions (Deno), Nuxt server (Node.js)  
**Project Type**: Backend-first monorepo with API server  
**Performance Goals**: Process 200-1000 channels, <10min new video discovery, quota-safe batching  
**Constraints**: YouTube API quotas, idempotent operations, no duplicate data  
**Scale/Scope**: Enterprise-grade data collection with comprehensive observability

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Spec-Driven and Test-Driven Development**: ✅ Feature has /specs/ documentation and >90% test coverage planned  
**II. Strong TypeScript Standards**: ✅ Strict typing enforced, ESLint/Prettier configured, no `any` types  
**III. Deterministic and Idempotent Operations**: ✅ All DB writes idempotent, jobs deterministic, atomic operations  
**IV. Quota-Safe Adaptive Scheduling**: ✅ YouTube API quota management and intelligent batching implemented  
**V. Comprehensive Observability**: ✅ Structured logging, metrics, retries, and monitoring planned  
**Architecture Standards**: ✅ Supabase Postgres + Edge Functions + SQL migrations defined  
**Quality Gates**: ✅ Linting, type checking, mocked externals, and performance benchmarks planned

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Backend-first Nuxt + Supabase architecture
src/
├── lib/
│   ├── youtube/          # YouTube API client, types, batching
│   ├── supabase/         # DB clients, types, utilities
│   └── obs/              # Observability, logging, metrics
├── workers/
│   ├── handlers/         # Job handlers (backfill, refresh, etc.)
│   └── db.ts            # Idempotent upserts, queries
server/
├── api/                 # Nuxt API routes
│   ├── channels/        # Channel management endpoints
│   ├── health.get.ts    # System health monitoring
│   ├── metrics.get.ts   # Observability metrics
│   └── jobs/            # Job management endpoints
└── middleware/
    └── apiKey.ts        # API key authentication

edge-functions/          # Supabase Edge Functions (Deno)
├── queue_worker/        # Main job processor
└── rss_poller/          # RSS feed polling

migrations/              # Supabase SQL migrations
├── 001_init.sql         # Core tables (channels, videos, stats)
├── 002_indexes.sql      # Performance indexes
├── 003_rls.sql          # Row Level Security
├── 004_helpers.sql      # Utility functions, views
└── 010_pg_cron.sql      # Cron job scheduling

tests/
├── unit/                # Unit tests for libraries
├── integration/         # DB + API integration tests
└── e2e/                 # End-to-end workflow tests
```

**Structure Decision**: Backend-first monorepo combining Nuxt server API with Supabase Edge 
Functions. Separation between server routes (API key auth) and Edge Functions (service role auth).

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load artifacts from Phase 1: data-model.md, contracts/, quickstart.md
- Generate 8 phases as defined in user requirements (P0-P8)
- Each phase contains setup, implementation, and testing tasks
- Focus on TDD approach: specs → tests → implementation
- Include observability and performance validation tasks

**Ordering Strategy**:
- P0: Repository and tooling setup (TypeScript, ESLint, Vitest)
- P1: Database schema and migrations with RLS
- P2: Queue mechanics with advisory locks and concurrency
- P3: YouTube API client with batching and quota management
- P4: RSS polling for new video discovery
- P5: Edge Function workers for job processing
- P6: pg_cron scheduling for automated jobs
- P7: Nuxt server API with authentication
- P8: Observability, metrics, and operational readiness

**Task Categories**:
- Setup tasks: Repository initialization, tooling configuration
- Migration tasks: Database schema, indexes, RLS policies
- Library tasks: TypeScript clients, utilities, types
- Worker tasks: Edge Functions, job handlers
- API tasks: Nuxt server routes, middleware
- Test tasks: Unit, integration, and E2E tests
- Observability tasks: Logging, metrics, monitoring

**Estimated Output**: 60-80 numbered, sequenced tasks across 8 phases in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations - all complexity justified by business requirements*

| Aspect | Complexity Level | Justification |
|--------|-----------------|---------------|
| Multi-service architecture | Moderate | Required for separation of concerns: Nuxt API + Edge Functions + Database |
| Queue management | High | Essential for scalable, reliable processing of 200-1000 channels |
| Advisory locking | Moderate | Required for per-channel serialization and idempotent operations |
| Quota management | High | Critical for respecting YouTube API limits and sustainable operation |
| Error handling | Moderate | Required for production reliability and data consistency |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach defined (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All technical decisions documented
- [x] Architecture aligns with constitutional principles

**Generated Artifacts**:
- [x] research.md - Technical decisions and patterns
- [x] data-model.md - Complete database design
- [x] contracts/management-api.yml - OpenAPI specification
- [x] contracts/database-rpcs.md - Database RPC contracts
- [x] quickstart.md - End-to-end test scenarios

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
