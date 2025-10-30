#!/usr/bin/env node

/**
 * Script to insert baseline (zero) video_stats records for videos that don't have ANY baseline records
 * This handles videos discovered before baseline creation was implemented
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function insertMissingBaselineVideoStats() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Configuration
  const MAX_VIDEOS_TO_PROCESS = 50000 // Limit for testing

  try {
    console.log('🔍 Finding videos that completely lack baseline (zero) stats records...')
    console.log(`📊 Processing limit: ${MAX_VIDEOS_TO_PROCESS} videos (for testing)`)

    // Query to find videos without any baseline records
    // This is the SQL query the user ran that returned 33,645 records
    const SKIP_FIRST = 5000 // Skip first 3000 videos (already processed)
    const { data: videosNeedingBaseline, error: queryError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT
            v.id,
            v.youtube_video_id,
            v.title,
            v.published_at,
            c.title as channel_title
          FROM videos v
          LEFT JOIN channels c ON v.channel_id = c.id
          WHERE NOT EXISTS (
            SELECT 1
            FROM video_stats vs
            WHERE vs.video_id = v.id
            AND vs.view_count = 0
            AND vs.like_count = 0
            AND vs.comment_count = 0
          )
          ORDER BY v.published_at DESC
          LIMIT ${MAX_VIDEOS_TO_PROCESS}
          OFFSET ${SKIP_FIRST}
        `
      })

    if (queryError) {
      console.error('Error with SQL query:', queryError.message)
      console.log('Falling back to direct Supabase query...')

      // Fallback: Use direct Supabase query (less efficient but works)
      const SKIP_FIRST = 5000 // Skip first 3000 videos (already processed)
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select(`
          id,
          youtube_video_id,
          title,
          published_at,
          channels!inner(title)
        `)
        .order('published_at', { ascending: false })
        .range(SKIP_FIRST, SKIP_FIRST + MAX_VIDEOS_TO_PROCESS - 1)

      if (videosError) {
        console.error('Error fetching videos:', videosError)
        process.exit(1)
      }

      console.log(`📊 Checking ${videos.length} videos for missing baseline records (skipping first ${SKIP_FIRST})...`)

      // Check each video for baseline records (this will be slow for 50k+ videos)
      const videosNeedingBaseline = []
      const batchSize = 5000

      for (let i = 0; i < videos.length; i += batchSize) {
        const batch = videos.slice(i, i + batchSize)
        console.log(`  Checking videos ${i + 1}-${Math.min(i + batchSize, videos.length)}...`)

        for (const video of batch) {
          const { data: stats, error: statsError } = await supabase
            .from('video_stats')
            .select('video_id')
            .eq('video_id', video.id)
            .eq('view_count', 0)
            .eq('like_count', 0)
            .eq('comment_count', 0)
            .limit(1)

          if (statsError) {
            console.error(`Error checking stats for video ${video.youtube_video_id}:`, statsError)
            continue
          }

          if (!stats || stats.length === 0) {
            videosNeedingBaseline.push(video)
          }
        }
      }

      return await processVideosNeedingBaseline(supabase, videosNeedingBaseline, MAX_VIDEOS_TO_PROCESS, SKIP_FIRST)
    }

    console.log(`📊 Found ${videosNeedingBaseline?.length || 0} videos needing baseline records (skipping first ${SKIP_FIRST}, limited to ${MAX_VIDEOS_TO_PROCESS})`)

    if (!videosNeedingBaseline || videosNeedingBaseline.length === 0) {
      console.log('✅ All videos already have baseline (zero) stats records!')
      return
    }

    await processVideosNeedingBaseline(supabase, videosNeedingBaseline, MAX_VIDEOS_TO_PROCESS, SKIP_FIRST)

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

async function processVideosNeedingBaseline(supabase, videosNeedingBaseline, maxVideosToProcess, skipFirst) {
  console.log(`📝 Preparing to insert baseline stats for ${videosNeedingBaseline.length} videos...`)

  // For videos without any stats, we need to determine when to set the baseline
  // We'll use the video's published_at date and set it to hour 0 (midnight)
  const baselineStatsPayload = videosNeedingBaseline.map(video => {
    // Use the video's published date as the baseline date
    const publishedDate = new Date(video.published_at)
    const baselineDate = publishedDate.toISOString().split('T')[0] // YYYY-MM-DD format
    const baselineHour = 0 // Start of day when video was published

    return {
      video_id: video.id,
      date: baselineDate,
      hour: baselineHour,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_gained: 0,
      estimated_minutes_watched: 0
    }
  })

  console.log(`📤 Inserting baseline stats in batches...`)

  // Insert baseline stats in batches to avoid timeout
  const insertBatchSize = 500 // Larger batches for efficiency
  let totalInserted = 0

  for (let i = 0; i < baselineStatsPayload.length; i += insertBatchSize) {
    const batch = baselineStatsPayload.slice(i, i + insertBatchSize)
    const batchNumber = Math.floor(i / insertBatchSize) + 1
    const totalBatches = Math.ceil(baselineStatsPayload.length / insertBatchSize)

    console.log(`  Processing batch ${batchNumber}/${totalBatches} (${batch.length} videos)`)

    const { error: insertError } = await supabase
      .from('video_stats')
      .upsert(batch, {
        onConflict: 'video_id,date,hour',
        ignoreDuplicates: true
      })

    if (insertError) {
      console.error(`❌ Error inserting baseline stats batch ${batchNumber}:`, insertError)
      console.error('First few records in failed batch:', JSON.stringify(batch.slice(0, 3), null, 2))
      process.exit(1)
    }

    totalInserted += batch.length
    console.log(`  ✅ Batch ${batchNumber} completed (${totalInserted}/${baselineStatsPayload.length} total)`)
  }

  console.log(`\n🎉 SUCCESS!`)
  console.log(`📊 Inserted baseline stats for ${totalInserted} videos (skipping first ${skipFirst}, out of ${maxVideosToProcess} limit)`)
  console.log(`📈 Videos now have baseline (zero) records showing their discovery/publication time`)
  console.log(`\n💡 Remove the MAX_VIDEOS_TO_PROCESS limit to process all ${videosNeedingBaseline.length} remaining videos.`)
}

// Run the script
console.log('🎬 YouTube Video Baseline Stats Batch Inserter')
console.log('===============================================')
console.log('This script adds baseline (zero) stats records to videos that completely lack them.')
console.log('This handles videos discovered before baseline creation was implemented.')
console.log('')

insertMissingBaselineVideoStats()