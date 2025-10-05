import { describe, it, expect } from 'vitest'
import { supabaseAdmin, supabaseClient } from '../../src/lib/supabase'

describe('Supabase Client', () => {
  it('should have admin client configured', () => {
    expect(supabaseAdmin).toBeDefined()
    expect(typeof supabaseAdmin.from).toBe('function')
  })

  it('should have client configured', () => {
    expect(supabaseClient).toBeDefined()
    expect(typeof supabaseClient.from).toBe('function')
  })

  it('should be able to initialize client', () => {
    // Test that the client can be initialized without connection errors
    // This validates that environment variables are properly configured
    expect(() => {
      // Just accessing the client should not throw if env vars are set
      supabaseAdmin.auth.getSession()
    }).not.toThrow()
  })
})