#!/usr/bin/env node

/**
 * Script to insert initial video_stats records for videos that don't have any stats yet
 * This ensures all videos have baseline stats records with 0 values
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

  try {
    console.log('🔍 Finding videos that need baseline (zero) stats records...')

    // Use a more efficient SQL query to find videos needing baseline stats
    // This avoids loading 50k+ records into memory
    const { data: videosNeedingBaseline, error: queryError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        video_stats!inner(video_id)
      `)
      .eq('video_stats.view_count', 0)
      .eq('video_stats.like_count', 0)
      .eq('video_stats.comment_count', 0)

    if (queryError) {
      console.error('Error with join query, falling back to alternative method:', queryError.message)
      return insertMissingBaselineVideoStatsAlternative()
    }

    // Get videos that have stats but no baseline records
    const videosWithStats = new Set()
    const videosWithBaseline = new Set()

    // First, get all videos that have any stats
    const { data: allStats, error: allStatsError } = await supabase
      .from('video_stats')
      .select('video_id')
      .limit(1) // Just check if table has data

    if (allStatsError) {
      console.error('Error checking video stats table:', allStatsError)
      return insertMissingBaselineVideoStatsAlternative()
    }

    // Use a more efficient approach: get videos needing baseline in batches
    let offset = 0
    const batchSize = 1000
    const allVideosNeedingBaseline = []

    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('videos')
        .select(`
          id,
          youtube_video_id,
          title,
          video_stats!inner(
            video_id,
            date,
            hour
          )
        `)
        .range(offset, offset + batchSize - 1)
        .order('id')

      if (batchError) {
        console.error('Error in batch query:', batchError)
        break
      }

      if (!batch || batch.length === 0) {
        break
      }

      // Filter videos that have stats but no baseline (zero) records
      for (const video of batch) {
        const hasBaseline = video.video_stats.some(stat =>
          stat.view_count === 0 && stat.like_count === 0 && stat.comment_count === 0
        )

        if (!hasBaseline) {
          // Find earliest stats for this video
          const earliestStat = video.video_stats.reduce((earliest, stat) => {
            if (!earliest) return stat
            const earliestDate = new Date(`${earliest.date}T${earliest.hour}:00:00`)
            const statDate = new Date(`${stat.date}T${stat.hour}:00:00`)
            return statDate < earliestDate ? stat : earliest
          })

          allVideosNeedingBaseline.push({
            ...video,
            earliest_date: earliestStat.date,
            earliest_hour: earliestStat.hour
          })
        }
      }

      offset += batchSize

      if (batch.length < batchSize) {
        break // Last batch
      }
    }

    if (allVideosNeedingBaseline.length === 0) {
      console.log('✅ All videos with stats already have baseline (zero) records!')
      return
    }

    console.log(`📊 Found ${allVideosNeedingBaseline.length} videos that need baseline stats records`)
    console.log(`📊 (These videos have stats but no initial zero-record showing discovery time)`)

    // Prepare baseline stats data
    const baselineStatsPayload = allVideosNeedingBaseline.map(video => ({
      video_id: video.id,
      date: video.earliest_date,
      hour: video.earliest_hour,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      view_gained: 0,
      estimated_minutes_watched: 0
    }))

    console.log(`📝 Inserting baseline stats for ${baselineStatsPayload.length} videos...`)

    // Insert baseline stats in batches
    const insertBatchSize = 100
    let totalInserted = 0

    for (let i = 0; i < baselineStatsPayload.length; i += insertBatchSize) {
      const batch = baselineStatsPayload.slice(i, i + insertBatchSize)
      console.log(`  Processing batch ${Math.floor(i / insertBatchSize) + 1}/${Math.ceil(baselineStatsPayload.length / insertBatchSize)} (${batch.length} videos)`)

      const { error: insertError } = await supabase
        .from('video_stats')
        .upsert(batch, {
          onConflict: 'video_id,date,hour',
          ignoreDuplicates: true
        })

      if (insertError) {
        console.error(`Error inserting baseline stats batch ${Math.floor(i / insertBatchSize) + 1}:`, insertError)
        process.exit(1)
      }

      totalInserted += batch.length
    }

    console.log(`✅ Successfully inserted baseline stats for ${totalInserted} videos!`)
    console.log('📈 All videos with stats now have baseline (zero) records showing discovery time.')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Alternative approach using batch processing to handle large datasets
async function insertMissingBaselineVideoStatsAlternative() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔍 Finding videos that need baseline stats records (batch processing method)...')

    // Get total count of videos with stats to estimate processing time
    const { count: totalVideosWithStats, error: countError } = await supabase
      .from('video_stats')
      .select('video_id', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting video stats:', countError)
      process.exit(1)
    }

    console.log(`📊 Processing ${totalVideosWithStats} total video stats records...`)

    // Process videos in batches to avoid memory issues
    const batchSize = 1000 // Process 1000 videos at a time
    let offset = 0
    let totalProcessed = 0
    let totalNeedingBaseline = 0
    let totalInserted = 0

    while (true) {
      // Get a batch of videos with their stats
      const { data: videoBatch, error: batchError } = await supabase
        .from('videos')
        .select(`
          id,
          youtube_video_id,
          title,
          video_stats(
            video_id,
            date,
            hour,
            view_count,
            like_count,
            comment_count
          )
        `)
        .range(offset, offset + batchSize - 1)
        .order('id')

      if (batchError) {
        console.error('Error fetching video batch:', batchError)
        process.exit(1)
      }

      if (!videoBatch || videoBatch.length === 0) {
        break // No more videos to process
      }

      console.log(`  Processing videos ${offset + 1}-${offset + videoBatch.length}...`)

      // Filter videos that have stats but no baseline (zero) records
      const videosNeedingBaseline = []

      for (const video of videoBatch) {
        if (!video.video_stats || video.video_stats.length === 0) {
          continue // Skip videos with no stats
        }

        // Check if this video already has a baseline record
        const hasBaseline = video.video_stats.some(stat =>
          stat.view_count === 0 && stat.like_count === 0 && stat.comment_count === 0
        )

        if (!hasBaseline) {
          // Find the earliest stats record for baseline date
          const earliestStat = video.video_stats.reduce((earliest, stat) => {
            if (!earliest) return stat
            const earliestTime = new Date(`${earliest.date}T${earliest.hour}:00:00`)
            const statTime = new Date(`${stat.date}T${stat.hour}:00:00`)
            return statTime < earliestTime ? stat : earliest
          })

          videosNeedingBaseline.push({
            ...video,
            earliest_date: earliestStat.date,
            earliest_hour: earliestStat.hour
          })
        }
      }

      if (videosNeedingBaseline.length > 0) {
        console.log(`    Found ${videosNeedingBaseline.length} videos in this batch needing baseline stats`)

        // Prepare baseline stats data for this batch
        const baselineStatsPayload = videosNeedingBaseline.map(video => ({
          video_id: video.id,
          date: video.earliest_date,
          hour: video.earliest_hour,
          view_count: 0,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
          view_gained: 0,
          estimated_minutes_watched: 0
        }))

        // Insert baseline stats for this batch
        const { error: insertError } = await supabase
          .from('video_stats')
          .upsert(baselineStatsPayload, {
            onConflict: 'video_id,date,hour',
            ignoreDuplicates: true
          })

        if (insertError) {
          console.error('Error inserting baseline stats for batch:', insertError)
          process.exit(1)
        }

        totalNeedingBaseline += videosNeedingBaseline.length
        totalInserted += baselineStatsPayload.length
      }

      totalProcessed += videoBatch.length
      offset += batchSize

      // Break if this was the last batch
      if (videoBatch.length < batchSize) {
        break
      }
    }

    if (totalNeedingBaseline === 0) {
      console.log('✅ All videos with stats already have baseline (zero) records!')
    } else {
      console.log(`✅ Successfully inserted baseline stats for ${totalInserted} videos!`)
      console.log('📈 All videos with stats now have baseline (zero) records showing discovery time.')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
console.log('🎬 YouTube Video Baseline Stats Initializer')
console.log('===========================================')
console.log('This script adds baseline (zero) stats records to videos that have stats but lack an initial discovery record.')
console.log('')

// Use the alternative method which processes videos in batches
insertMissingBaselineVideoStatsAlternative()