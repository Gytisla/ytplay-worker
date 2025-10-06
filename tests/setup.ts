import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'

// Extend global type for test utilities
declare global {
  var testUtils: Record<string, unknown>
}

// Create MSW server for testing
export const server = setupServer()

// Global test setup
beforeAll(() => {
  // No MSW setup for any tests - integration tests need real connections
  // Unit tests that need MSW can set it up individually
})

afterAll(() => {
  // No MSW server to clean up
})

afterEach(() => {
  // No MSW handlers to reset
})

// Initialize global test utilities
global.testUtils = {
  // Add any global test utilities here
}