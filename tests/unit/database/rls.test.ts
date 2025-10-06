import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import '../../database-setup' // Use database-specific setup

describe('Row Level Security (RLS) Policies', () => {
  let db: Pool
  let testChannelId: string

  beforeAll(async () => {
    // Connect directly to PostgreSQL to test RLS
    db = new Pool({
      host: '127.0.0.1',
      port: 54322, // Supabase database port
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    })

    // Clean up any existing test data (use valid UUID format)
    const testJobUuid = '550e8400-e29b-41d4-a716-446655440000'
    await db.query('DELETE FROM job_events WHERE job_id = $1', [testJobUuid])
    await db.query('DELETE FROM jobs WHERE id = $1', [testJobUuid])
    await db.query('DELETE FROM videos WHERE youtube_video_id = $1', ['rls_test_video_123'])
    await db.query('DELETE FROM channels WHERE youtube_channel_id = $1', ['UC_rls_test_channel'])

    // Create test data (using direct SQL with no RLS restrictions)
    const channelResult = await db.query(`
      INSERT INTO channels (youtube_channel_id, title, published_at) 
      VALUES ($1, $2, $3) RETURNING id
    `, ['UC_rls_test_channel', 'RLS Test Channel', new Date().toISOString()])
  const channelRows = channelResult.rows as Array<{ id: string }>;
  expect(channelRows.length).toBeGreaterThan(0);
  testChannelId = channelRows[0]!.id;

    await db.query(`
      INSERT INTO videos (youtube_video_id, channel_id, title, published_at) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['rls_test_video_123', testChannelId, 'RLS Test Video', new Date().toISOString()])

    await db.query(`
      INSERT INTO jobs (id, job_type, payload) 
      VALUES ($1, $2, $3) RETURNING id
    `, [testJobUuid, 'TEST_JOB', '{"test": "rls"}'])
  })

  afterAll(async () => {
    // Clean up test data (use valid UUID format)
    const testJobUuid = '550e8400-e29b-41d4-a716-446655440000'
    await db.query('DELETE FROM job_events WHERE job_id = $1', [testJobUuid])
    await db.query('DELETE FROM jobs WHERE id = $1', [testJobUuid])
    await db.query('DELETE FROM videos WHERE youtube_video_id = $1', ['rls_test_video_123'])
    await db.query('DELETE FROM channels WHERE youtube_channel_id = $1', ['UC_rls_test_channel'])
    
    await db.end()
  })

  describe('RLS Configuration', () => {
    it('should have RLS enabled on channels table', async () => {
      const result = await db.query(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'channels'
      `)
      const rows = result.rows as Array<{ relname: string; relrowsecurity: boolean }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.relrowsecurity).toBe(true)
    })

    it('should have RLS enabled on videos table', async () => {
      const result = await db.query(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'videos'
      `)
      const rows = result.rows as Array<{ relname: string; relrowsecurity: boolean }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.relrowsecurity).toBe(true)
    })

    it('should have RLS enabled on jobs table', async () => {
      const result = await db.query(`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'jobs'
      `)
      const rows = result.rows as Array<{ relname: string; relrowsecurity: boolean }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.relrowsecurity).toBe(true)
    })
  })

  describe('RLS Policies', () => {
    it('should have service role policies for channels', async () => {
      const result = await db.query(`
        SELECT pol.polname, pol.polcmd 
        FROM pg_policy pol 
        JOIN pg_class cls ON pol.polrelid = cls.oid 
        WHERE cls.relname = 'channels'
      `)
      const rows = result.rows as Array<{ polname: string; polcmd: string }>
      expect(rows.length).toBeGreaterThan(0)
      // Check for service role policy
      const serviceRolePolicy = rows.find(row => row.polname.includes('service_role'))
      expect(serviceRolePolicy).toBeTruthy()
    })

    it('should have service role policies for videos', async () => {
      const result = await db.query(`
        SELECT pol.polname, pol.polcmd 
        FROM pg_policy pol 
        JOIN pg_class cls ON pol.polrelid = cls.oid 
        WHERE cls.relname = 'videos'
      `)
      const rows = result.rows as Array<{ polname: string; polcmd: string }>
      expect(rows.length).toBeGreaterThan(0)
      // Check for service role policy
      const serviceRolePolicy = rows.find(row => row.polname.includes('service_role'))
      expect(serviceRolePolicy).toBeTruthy()
    })

    it('should have service role policies for jobs', async () => {
      const result = await db.query(`
        SELECT pol.polname, pol.polcmd 
        FROM pg_policy pol 
        JOIN pg_class cls ON pol.polrelid = cls.oid 
        WHERE cls.relname = 'jobs'
      `)
      const rows = result.rows as Array<{ polname: string; polcmd: string }>
      expect(rows.length).toBeGreaterThan(0)
      // Check for service role policy
      const serviceRolePolicy = rows.find(row => row.polname.includes('service_role'))
      expect(serviceRolePolicy).toBeTruthy()
    })
  })

  describe('RLS Functions', () => {
    it('should have is_admin function', async () => {
      const result = await db.query(`
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname = 'is_admin'
      `)
      const rows = result.rows as Array<{ proname: string; prosrc: string }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.prosrc).toContain('service_role')
    })

    it('should have can_access_channel function', async () => {
      const result = await db.query(`
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname = 'can_access_channel'
      `)
      const rows = result.rows as Array<{ proname: string; prosrc: string }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.prosrc).toContain('authenticated')
    })

    it('should have can_access_video function', async () => {
      const result = await db.query(`
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname = 'can_access_video'
      `)
      const rows = result.rows as Array<{ proname: string; prosrc: string }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.prosrc).toContain('authenticated')
    })
  })

  describe('Data Access Tests', () => {
    it('should allow postgres user to access all data', async () => {
      // Verify channel exists and is accessible
      const channelResult = await db.query(`
        SELECT * FROM channels 
        WHERE youtube_channel_id = $1
      `, ['UC_rls_test_channel'])
      const channelRows = channelResult.rows as Array<{ youtube_channel_id: string }>
  expect(channelRows).toHaveLength(1)
  expect(channelRows[0]?.youtube_channel_id).toBe('UC_rls_test_channel')
    })

    it('should allow postgres user to modify all data', async () => {
      // Test that postgres user can update channels
      const updateResult = await db.query(`
        UPDATE channels 
        SET description = $1 
        WHERE youtube_channel_id = $2 
        RETURNING id
      `, ['Updated description', 'UC_rls_test_channel'])
      const updateRows = updateResult.rows as Array<{ id: string }>
      expect(updateRows).toHaveLength(1)
    })

    it('should verify foreign key relationships work', async () => {
      // Verify video is linked to correct channel
      const result = await db.query(`
        SELECT v.youtube_video_id, c.youtube_channel_id 
        FROM videos v 
        JOIN channels c ON v.channel_id = c.id 
        WHERE v.youtube_video_id = $1
      `, ['rls_test_video_123'])
      const rows = result.rows as Array<{ youtube_video_id: string; youtube_channel_id: string }>
  expect(rows).toHaveLength(1)
  expect(rows[0]?.youtube_channel_id).toBe('UC_rls_test_channel')
    })

    it('should verify test data integrity', async () => {
      // Verify all test data exists
      const channelCount = await db.query(`
        SELECT COUNT(*) as count FROM channels 
        WHERE youtube_channel_id = $1
      `, ['UC_rls_test_channel'])
      const channelCountRows = channelCount.rows as Array<{ count: string }>;
      expect(channelCountRows.length).toBeGreaterThan(0);
  expect(parseInt(channelCountRows[0]!.count)).toBe(1);

      const videoCountRows = (await db.query(`
        SELECT COUNT(*) as count FROM videos 
        WHERE youtube_video_id = $1
      `, ['rls_test_video_123'])).rows as Array<{ count: string }>;
      expect(videoCountRows.length).toBeGreaterThan(0);
  expect(parseInt(videoCountRows[0]!.count)).toBe(1);

      const jobCountRows = (await db.query(`
        SELECT COUNT(*) as count FROM jobs 
        WHERE id = $1
      `, ['550e8400-e29b-41d4-a716-446655440000'])).rows as Array<{ count: string }>;
      expect(jobCountRows.length).toBeGreaterThan(0);
  expect(parseInt(jobCountRows[0]!.count)).toBe(1);
    })
  })
})