#!/usr/bin/env node

/**
 * Script to add a BACKFILL_CHANNEL job for a given channel handle or channel ID
 * Usage: node scripts/add-backfill-job.js "@ChannelHandle" or node scripts/add-backfill-job.js "UCChannelID"
 *
 * This script:
 * 1. If handle starts with @, resolves the channel handle to a channel ID using YouTube API
 * 2. If direct channel ID provided, uses it directly
 * 3. Inserts a BACKFILL_CHANNEL job into the database
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

    // Remove @ symbol for searching
    const searchQuery = handle.startsWith('@') ? handle.substring(1) : handle
    console.log(`Searching for: ${searchQuery}`)

    // Method 1: Search for the channel by username/handle
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=channel&key=${apiKey}&maxResults=5`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.items && searchData.items.length > 0) {
      // Look for exact matches first
      for (const item of searchData.items) {
        const channelId = item.id.channelId
        const channelTitle = item.snippet.title.toLowerCase()
        const searchQueryLower = searchQuery.toLowerCase()

        // Check if the title matches the search query (exact or very close)
        if (channelTitle.includes(searchQueryLower) || searchQueryLower.includes(channelTitle)) {
          // Verify this is the correct channel by fetching channel details
          const verifyUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${apiKey}`
          const verifyResponse = await fetch(verifyUrl)
          const verifyData = await verifyResponse.json()

          if (verifyData.items && verifyData.items.length > 0) {
            const verifiedChannel = verifyData.items[0]
            console.log(`✅ Found matching channel:`)
            console.log(`   Title: ${verifiedChannel.snippet?.title}`)
            console.log(`   Channel ID: ${channelId}`)
            console.log(`   Subscriber count: ${verifiedChannel.statistics?.subscriberCount || 'N/A'}`)
            console.log(`   Custom URL: ${verifiedChannel.snippet?.customUrl || 'N/A'}`)

            // Additional check: see if custom URL matches
            const customUrl = verifiedChannel.snippet?.customUrl
            if (customUrl && (customUrl.toLowerCase().includes(searchQueryLower) || searchQueryLower.includes(customUrl.toLowerCase()))) {
              console.log(`✅ Custom URL match confirmed!`)
              return channelId
            }

            // If no custom URL match but title is very close, still return it
            return channelId
          }
        }
      }

      // If no exact matches, show available options and ask user to choose
      console.log(`\n❌ No exact matches found for "${handle}". Available channels:`)
      searchData.items.forEach((item, index) => {
        const channelId = item.id.channelId
        const title = item.snippet.title
        const description = item.snippet.description?.substring(0, 100) + '...'
        console.log(`${index + 1}. ${title} (ID: ${channelId})`)
        console.log(`   ${description}`)
      })

      console.log(`\n💡 Try using the direct channel ID instead of the handle.`)
      console.log(`   You can find the channel ID in the channel's URL or by inspecting available options above.`)
    }

    console.error(`❌ No channel found for handle: ${handle}`)
    return null

  } catch (error) {
    console.error(`❌ Failed to resolve channel handle ${handle}:`, error.message)
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
          maxVideos: 200 // Reasonable limit for backfill
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
    console.error('Usage: node scripts/add-backfill-job.js "@ChannelHandle" or node scripts/add-backfill-job.js "UCChannelID"')
    console.error('Examples:')
    console.error('  node scripts/add-backfill-job.js "@PravalTuras"')
    console.error('  node scripts/add-backfill-job.js "UCChannelID123"')
    process.exit(1)
  }

  const input = args[0]
  let channelId = null
  let displayName = input

  console.log('🎬 YouTube Channel Backfill Job Creator')
  console.log('=====================================')

  if (input.startsWith('@')) {
    // Handle format - need to resolve to channel ID
    console.log(`Resolving channel handle: ${input}`)
    channelId = await resolveChannelHandle(input)
    if (!channelId) {
      console.error(`Could not resolve channel handle: ${input}`)
      process.exit(1)
    }
  } else {
    // Direct channel ID format
    console.log(`Using direct channel ID: ${input}`)
    channelId = input
    displayName = input
  }

  // Add the job
  await addBackfillJob(channelId, displayName)

  console.log('\n🎉 Done! The channel backfill job has been added to the queue.')
  console.log('You can monitor job progress in the Supabase dashboard.')
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})