// Database test setup - no MSW mocking needed
import { beforeAll, afterAll } from 'vitest'
import { config } from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

// Initialize global test utilities for database tests
global.testUtils = {
  // Add any database-specific test utilities here
}

beforeAll(() => {
  // Database tests don't need MSW setup
  console.log('Database test environment initialized')
  console.log('SUPABASE_URL:', process.env['SUPABASE_URL'])
  console.log('Service role key exists:', !!process.env['SUPABASE_SERVICE_ROLE_KEY'])
})

afterAll(() => {
  // Clean up database test environment
  console.log('Database test environment cleaned up')
})