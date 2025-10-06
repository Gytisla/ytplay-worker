import { describe, it, expect } from 'vitest'
import { supabaseAdmin } from '../../../src/lib/supabase'
import type { Database } from '../../../types/supabase'

describe('Database Constraints', () => {
  it('enforces unique constraint on youtube_channel_id', async () => {
    const channels = supabaseAdmin.from('channels')
    const testChannelId = 'UC_test_unique'

    try {
      // First, clean up any leftover data from previous test runs
      await channels
        .delete()
        .eq('youtube_channel_id', testChannelId)

      // First insert should succeed
      await channels
        .insert({
          youtube_channel_id: testChannelId,
          title: 'Test Channel',
          published_at: '2023-01-01T00:00:00Z'
        })
        .select()

      // Second insert with same youtube_channel_id should fail
      await channels
        .insert({
          youtube_channel_id: testChannelId,
          title: 'Test Channel 2',
          published_at: '2023-01-01T00:00:00Z'
        })
        .select()
      // Should not reach here
      expect(true).toBe(false)
    } catch (error: unknown) {
      const { error: pgError } = error as { error: { message: string } }
      expect(pgError.message).toMatch(/duplicate key value|unique constraint|violates unique/)
    } finally {
      // Clean up test data
      await channels
        .delete()
        .eq('youtube_channel_id', testChannelId)
    }
  })
})
