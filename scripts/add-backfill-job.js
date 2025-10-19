#!/usr/bin/env node

/**
 * Script to add a BACKFILL_CHANNEL job for a given channel handle
 * Usage: node scripts/add-backfill-job.js "@ChannelHandle"
 *
 * This script:
 * 1. Resolves the channel handle to a channel ID using YouTube API
 * 2. Inserts a BACKFILL_CHANNEL job into the database
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Resolve a channel handle to a channel ID using YouTube API
 * @param {string} handle - Channel handle like "@PravalTuras"
 * @returns {Promise<string|null>} Channel ID or null if not found
 */
async function resolveChannelHandle(handle) {
  try {
    console.log(`Resolving channel handle: ${handle}`)

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is required')
    }

    // Try different approaches to resolve the handle

    // Method 1: Try using the handle directly as a channel ID
    try {
      const directUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(handle)}&key=${apiKey}`
      const directResponse = await fetch(directUrl)
      const directData = await directResponse.json()

      if (directData.items && directData.items.length > 0) {
        const channel = directData.items[0]
        console.log(`Resolved ${handle} to channel ID: ${channel.id}`)
        console.log(`Channel title: ${channel.snippet?.title}`)
        console.log(`Subscriber count: ${channel.statistics?.subscriberCount || 'N/A'}`)
        return channel.id
      }
    } catch (error) {
      console.log(`Direct handle lookup failed: ${error.message}`)
    }

    // Method 2: Use search API to find the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&key=${apiKey}&maxResults=1`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.items && searchData.items.length > 0) {
      const channel = searchData.items[0]
      const channelId = channel.id.channelId || channel.id

      // Verify this is the correct channel by fetching channel details
      const verifyUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`
      const verifyResponse = await fetch(verifyUrl)
      const verifyData = await verifyResponse.json()

      if (verifyData.items && verifyData.items.length > 0) {
        const verifiedChannel = verifyData.items[0]
        console.log(`Resolved ${handle} to channel ID: ${channelId}`)
        console.log(`Channel title: ${verifiedChannel.snippet?.title}`)
        console.log(`Subscriber count: ${verifiedChannel.statistics?.subscriberCount || 'N/A'}`)
        return channelId
      }
    }

    console.error(`No channel found for handle: ${handle}`)
    return null

  } catch (error) {
    console.error(`Failed to resolve channel handle ${handle}:`, error.message)
    return null
  }
}

/**
 * Add a BACKFILL_CHANNEL job to the database
 * @param {string} channelId - YouTube channel ID
 * @param {string} handle - Original channel handle for deduplication
 */
async function addBackfillJob(channelId, handle) {
  try {
    const dedupKey = `backfill:channel:${channelId}`

    // Check if job already exists
    const { data: existingJob, error: checkError } = await supabase
      .from('jobs')
      .select('id')
      .eq('dedup_key', dedupKey)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError
    }

    if (existingJob) {
      console.log(`Job already exists for channel ${channelId} (job ID: ${existingJob.id})`)
      return
    }

    // Insert new job
    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        job_type: 'BACKFILL_CHANNEL',
        priority: 10,
        payload: {
          channelId: channelId,
          maxVideos: 1000 // Reasonable limit for backfill
        },
        dedup_key: dedupKey,
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    console.log(`✅ Successfully added BACKFILL_CHANNEL job for ${handle} (${channelId})`)
    console.log(`Job ID: ${job.id}`)
    console.log(`Priority: ${job.priority}`)
    console.log(`Payload:`, JSON.stringify(job.payload, null, 2))

  } catch (error) {
    console.error('Failed to add backfill job:', error.message)
    process.exit(1)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 1) {
    console.error('Usage: node scripts/add-backfill-job.js "@ChannelHandle"')
    console.error('Example: node scripts/add-backfill-job.js "@PravalTuras"')
    process.exit(1)
  }

  const handle = args[0]

  // Validate handle format
  if (!handle.startsWith('@')) {
    console.error('Channel handle must start with @')
    console.error('Example: @PravalTuras')
    process.exit(1)
  }

  console.log('🎬 YouTube Channel Backfill Job Creator')
  console.log('=====================================')

  // Resolve handle to channel ID
  const channelId = await resolveChannelHandle(handle)

  if (!channelId) {
    console.error(`Could not resolve channel handle: ${handle}`)
    process.exit(1)
  }

  // Add the job
  await addBackfillJob(channelId, handle)

  console.log('\n🎉 Done! The channel backfill job has been added to the queue.')
  console.log('You can monitor job progress in the Supabase dashboard.')
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})