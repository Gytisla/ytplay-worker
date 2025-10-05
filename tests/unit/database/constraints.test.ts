import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import '../../database-setup' // Use database-specific setup instead of main setup

describe('Database Constraints', () => {
  let db: Pool
  
  beforeAll(async () => {
    // Connect directly to PostgreSQL to test constraints
    db = new Pool({
      host: '127.0.0.1',
      port: 54322, // Supabase database port
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    })
    
    // Clean up any existing test data
    await db.query('DELETE FROM video_stats WHERE video_id IN (SELECT id FROM videos WHERE youtube_video_id LIKE $1)', ['test_%'])
    await db.query('DELETE FROM channel_stats WHERE channel_id IN (SELECT id FROM channels WHERE youtube_channel_id LIKE $1)', ['UC_test_%'])
    await db.query('DELETE FROM videos WHERE youtube_video_id LIKE $1', ['test_%'])
    await db.query('DELETE FROM channels WHERE youtube_channel_id LIKE $1', ['UC_test_%'])
    await db.query('DELETE FROM jobs WHERE job_type = $1', ['TEST_JOB'])
  })

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM video_stats WHERE video_id IN (SELECT id FROM videos WHERE youtube_video_id LIKE $1)', ['test_%'])
    await db.query('DELETE FROM channel_stats WHERE channel_id IN (SELECT id FROM channels WHERE youtube_channel_id LIKE $1)', ['UC_test_%'])
    await db.query('DELETE FROM videos WHERE youtube_video_id LIKE $1', ['test_%'])
    await db.query('DELETE FROM channels WHERE youtube_channel_id LIKE $1', ['UC_test_%'])
    await db.query('DELETE FROM jobs WHERE job_type = $1', ['TEST_JOB'])
    
    await db.end()
  })

  describe('Channels Table Constraints', () => {
    it('should enforce NOT NULL constraints on required fields', async () => {
      try {
        await db.query(`
          INSERT INTO channels (youtube_channel_id, title) 
          VALUES ($1, $2)
        `, ['UC_test_null', 'Test Channel'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/null value in column|violates not-null constraint/)
      }
    })

    it('should enforce UNIQUE constraint on youtube_channel_id', async () => {
      // First insertion should succeed
      const result1 = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at) 
        VALUES ($1, $2, $3) RETURNING id
      `, ['UC_test_unique', 'Test Channel 1', '2023-01-01T00:00:00Z'])
      
      expect(result1.rows).toHaveLength(1)
      
      // Second insertion with same youtube_channel_id should fail
      try {
        await db.query(`
          INSERT INTO channels (youtube_channel_id, title, published_at) 
          VALUES ($1, $2, $3)
        `, ['UC_test_unique', 'Test Channel 2', '2023-01-01T00:00:00Z'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/duplicate key value|unique constraint|violates unique/)
      }
    })

    it('should allow negative values (no CHECK constraints defined)', async () => {
      // The current schema doesn't have CHECK constraints on counts
      // This test verifies that negative values are allowed
      const result = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at, subscriber_count) 
        VALUES ($1, $2, $3, $4) RETURNING id, subscriber_count
      `, ['UC_test_negative', 'Test Channel', '2023-01-01T00:00:00Z', -1])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].subscriber_count).toBe('-1') // PostgreSQL returns bigints as strings
    })

    it('should allow valid channel insertion', async () => {
      const result = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at, subscriber_count, view_count) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id, youtube_channel_id
      `, ['UC_test_valid', 'Valid Test Channel', '2023-01-01T00:00:00Z', 1000, 50000])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].youtube_channel_id).toBe('UC_test_valid')
    })
  })

  describe('Videos Table Constraints', () => {
    let testChannelId: string

    beforeAll(async () => {
      // Create a test channel for video tests
      const result = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at) 
        VALUES ($1, $2, $3) RETURNING id
      `, ['UC_test_video_channel', 'Test Video Channel', '2023-01-01T00:00:00Z'])
      testChannelId = result.rows[0].id
    })

    it('should enforce NOT NULL constraints on required fields', async () => {
      try {
        await db.query(`
          INSERT INTO videos (youtube_video_id, channel_id, title) 
          VALUES ($1, $2, $3)
        `, ['test_video_null', testChannelId, 'Test Video'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/null value in column|violates not-null constraint/)
      }
    })

    it('should enforce FOREIGN KEY constraint to channels', async () => {
      try {
        await db.query(`
          INSERT INTO videos (youtube_video_id, channel_id, title, published_at) 
          VALUES ($1, $2, $3, $4)
        `, ['test_video_fk', '00000000-0000-0000-0000-000000000000', 'Test Video', '2023-01-01T00:00:00Z'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/violates foreign key constraint|foreign key/)
      }
    })

    it('should allow valid video insertion', async () => {
      const result = await db.query(`
        INSERT INTO videos (youtube_video_id, channel_id, title, published_at) 
        VALUES ($1, $2, $3, $4) RETURNING id, youtube_video_id
      `, ['test_video_valid', testChannelId, 'Valid Test Video', '2023-01-01T00:00:00Z'])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].youtube_video_id).toBe('test_video_valid')
    })
  })

  describe('Jobs Table Constraints', () => {
    it('should enforce NOT NULL constraints on required fields', async () => {
      try {
        await db.query(`
          INSERT INTO jobs (job_type) 
          VALUES ($1)
        `, ['TEST_JOB'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/null value in column|violates not-null constraint/)
      }
    })

    it('should allow negative priority values (no CHECK constraints defined)', async () => {
      // The current schema doesn't have CHECK constraints on priority
      // This test verifies that negative values are allowed
      const result = await db.query(`
        INSERT INTO jobs (job_type, payload, priority) 
        VALUES ($1, $2, $3) RETURNING id, priority
      `, ['TEST_JOB_NEGATIVE', '{"test": "data"}', -999])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].priority).toBe(-999)
    })

    it('should allow valid job insertion', async () => {
      const result = await db.query(`
        INSERT INTO jobs (job_type, payload, priority) 
        VALUES ($1, $2, $3) RETURNING id, job_type
      `, ['TEST_JOB', '{"test": "data"}', 5])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].job_type).toBe('TEST_JOB')
    })
  })

  describe('Channel Stats Table Constraints', () => {
    let testChannelId: string

    beforeAll(async () => {
      // Create a test channel for stats tests
      const result = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at) 
        VALUES ($1, $2, $3) RETURNING id
      `, ['UC_test_stats_channel', 'Test Stats Channel', '2023-01-01T00:00:00Z'])
      testChannelId = result.rows[0].id
    })

    it('should enforce FOREIGN KEY constraint to channels', async () => {
      try {
        await db.query(`
          INSERT INTO channel_stats (channel_id, date) 
          VALUES ($1, $2)
        `, ['00000000-0000-0000-0000-000000000000', '2023-01-01'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/violates foreign key constraint|foreign key/)
      }
    })

    it('should allow valid channel stats insertion', async () => {
      const result = await db.query(`
        INSERT INTO channel_stats (channel_id, date, view_count, subscriber_count) 
        VALUES ($1, $2, $3, $4) RETURNING id, channel_id
      `, [testChannelId, '2023-01-01', 1000, 500])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].channel_id).toBe(testChannelId)
    })
  })

  describe('Video Stats Table Constraints', () => {
    let testVideoId: string

    beforeAll(async () => {
      // Create a test channel and video for stats tests
      const channelResult = await db.query(`
        INSERT INTO channels (youtube_channel_id, title, published_at) 
        VALUES ($1, $2, $3) RETURNING id
      `, ['UC_test_video_stats_channel', 'Test Video Stats Channel', '2023-01-01T00:00:00Z'])
      
      const videoResult = await db.query(`
        INSERT INTO videos (youtube_video_id, channel_id, title, published_at) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `, ['test_video_stats', channelResult.rows[0].id, 'Test Video for Stats', '2023-01-01T00:00:00Z'])
      
      testVideoId = videoResult.rows[0].id
    })

    it('should enforce FOREIGN KEY constraint to videos', async () => {
      try {
        await db.query(`
          INSERT INTO video_stats (video_id, date) 
          VALUES ($1, $2)
        `, ['00000000-0000-0000-0000-000000000000', '2023-01-01'])
        // Should not reach here
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toMatch(/violates foreign key constraint|foreign key/)
      }
    })

    it('should allow valid video stats insertion', async () => {
      const result = await db.query(`
        INSERT INTO video_stats (video_id, date, view_count, like_count) 
        VALUES ($1, $2, $3, $4) RETURNING id, video_id
      `, [testVideoId, '2023-01-01', 1000, 50])
      
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].video_id).toBe(testVideoId)
    })
  })
})