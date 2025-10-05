import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

describe('Schema Integrity and Constraints', () => {
  let client: Client

  beforeAll(async () => {
    client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    })
    await client.connect()
  })

  afterAll(async () => {
    await client.end()
  })

  it('should verify database indexes exist for performance', async () => {
    const indexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('channels', 'videos', 'jobs', 'channel_stats', 'video_stats')
      ORDER BY tablename, indexname
    `
    const result = await client.query(indexQuery)
    expect(result.rows.length).toBeGreaterThan(0)
    const indexNames = result.rows.map(row => row.indexname)
    expect(indexNames.some(name => name.includes('channels_pkey'))).toBe(true)
    expect(indexNames.some(name => name.includes('videos_pkey'))).toBe(true)
  })

  it('should verify RLS policies are enabled', async () => {
    const rlsQuery = `
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN ('channels', 'videos', 'jobs')
    `
    const result = await client.query(rlsQuery)
    expect(result.rows.length).toBeGreaterThan(0)
    result.rows.forEach(row => {
      expect(row.rowsecurity).toBe(true)
    })
  })

  it('should verify utility functions exist', async () => {
    const functionsQuery = `
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('is_admin', 'can_access_channel', 'can_access_video')
    `
    const result = await client.query(functionsQuery)
    expect(result.rows.length).toBe(3)
    const functionNames = result.rows.map(row => row.routine_name)
    expect(functionNames).toContain('is_admin')
    expect(functionNames).toContain('can_access_channel')
    expect(functionNames).toContain('can_access_video')
  })
})