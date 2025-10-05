import { describe, it, expect } from 'vitest'
// This file runs all schema validation tests in the schema/ folder
import './schema-channels.test'
import './schema-videos.test'
import './schema-jobs.test'
import './schema-stats.test'
import './schema-additional.test'
import './schema-integrity.test'

describe('Full Database Schema Validation', () => {
  it('runs all schema validation suites', () => {
    // This is a placeholder to ensure the file is picked up by the test runner.
    // All actual tests are in the imported files above.
    expect(true).toBe(true)
  })
})