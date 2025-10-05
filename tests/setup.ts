import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'

// Extend global type for test utilities
declare global {
  var testUtils: Record<string, unknown>
}

// Mock server for external API calls (constitutional requirement)
export const server = setupServer()

// Global test setup
beforeAll(() => {
  // Only start MSW server for non-database tests
  // Database tests need real Supabase connections
  const isDatabaseTest = process.env['VITEST_TEST_NAME']?.includes('database') || 
                        process.env['VITEST_FILE_PATH']?.includes('database')
  
  if (!isDatabaseTest) {
    server.listen({ onUnhandledRequest: 'error' })
  }
})

afterAll(() => {
  // Clean up MSW server if it was started
  try {
    server.close()
  } catch (e) {
    // Server wasn't started, ignore
  }
})

afterEach(() => {
  // Reset handlers after each test if server is listening
  try {
    server.resetHandlers()
  } catch (e) {
    // Server not active, ignore
  }
})

// Initialize global test utilities
global.testUtils = {
  // Add any global test utilities here
}