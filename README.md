# YTPlay Worker

YouTube data collection worker built with Nuxt 3 + Supabase backend.

## Architecture

This project follows a backend-first approach with:

- **Nuxt 3** - Full-stack TypeScript framework
- **Supabase** - PostgreSQL database with Edge Functions
- **TypeScript** - Strict typing throughout
- **Vitest** - Testing framework with >90% coverage requirement
- **ESLint + Prettier** - Code quality and formatting

## Project Structure

```
ytplay-worker/
├── server/           # Nuxt server-side code
│   └── api/         # API routes
├── lib/             # Shared utilities and business logic
├── types/           # TypeScript type definitions
├── supabase/        # Database and Edge Functions
│   ├── migrations/  # Database schema migrations
│   └── functions/   # Supabase Edge Functions (Deno)
└── tests/           # Unit, integration, and E2E tests
```

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start Supabase:

   ```bash
   pnpm supabase:start
   ```

4. Run development server:
   ```bash
   pnpm dev
   ```

## Development Workflow

This project follows constitutional principles:

1. **Spec-Driven Development** - All features start with specifications
2. **Test-Driven Development** - Tests written before implementation
3. **TypeScript Strict Mode** - No `any` types allowed
4. **Idempotent Operations** - All database operations are safe to retry
5. **Observable Systems** - Comprehensive logging and monitoring

## Scripts

- `pnpm ci` - Full CI check (lint + typecheck + test with coverage)
- `pnpm lint` - ESLint with zero warnings tolerance
- `pnpm typecheck` - TypeScript type checking
- `pnpm test` - Run tests with Vitest
- `pnpm test:coverage` - Test coverage report
- `pnpm supabase:types` - Generate TypeScript types from database schema

## Requirements

- Node.js >=18.0.0
- pnpm >=8.0.0
- Supabase CLI

## License

MIT
