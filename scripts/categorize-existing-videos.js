#!/usr/bin/env node

/**
 * One-time script to categorize existing videos in the database
 * Run with: node scripts/categorize-existing-videos.js
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

// CLI parsing: support flags and positional channel id
// Usage examples:
//   node scripts/categorize-existing-videos.js                 -> process all videos
//   node scripts/categorize-existing-videos.js --all          -> process all videos
//   node scripts/categorize-existing-videos.js --channel UC.. -> process only channel by YouTube id
//   node scripts/categorize-existing-videos.js --channel <uuid> -> process only channel by DB id
//   node scripts/categorize-existing-videos.js UCxxxxx        -> positional YouTube channel id
//   node scripts/categorize-existing-videos.js <uuid>         -> positional DB channel id
//   node scripts/categorize-existing-videos.js --dry          -> dry run

const rawArgs = process.argv.slice(2)
let channelArg = null // null = process all
let dryRun = false

for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i]
  if (a === '--all') {
    channelArg = null
  } else if (a === '--dry' || a === '--dry-run') {
    dryRun = true
  } else if (a === '--channel' || a === '-c') {
    channelArg = rawArgs[i + 1] ? String(rawArgs[i + 1]).trim() : null
    i++
  } else if (a.startsWith('-')) {
    console.warn(`Unknown option: ${a} (ignoring)`)
  } else {
    // positional channel id
    channelArg = String(a).trim()
    break
  }
}

let targetChannelDbId = null // will hold DB channel id (UUID) or null for all

const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

async function resolveTargetChannel() {
  if (!channelArg) {
    targetChannelDbId = null
    return
  }

  // If argument looks like a UUID, assume it's the DB channel id
  if (isUuid(channelArg)) {
    targetChannelDbId = channelArg
    return
  }

  // Otherwise treat argument as YouTube channel id and resolve to DB id
  const { data: ch, error: chErr } = await supabase
    .from('channels')
    .select('id')
    .eq('youtube_channel_id', channelArg)
    .limit(1)

  if (chErr) {
    console.error('Error looking up channel by YouTube id:', chErr)
    process.exit(1)
  }

  if (!ch || ch.length === 0) {
    console.error(`Channel with YouTube id "${channelArg}" not found in DB`)
    process.exit(1)
  }

  targetChannelDbId = ch[0].id
}

// Inline categorization logic (copied from src/lib/categorization.ts)
async function categorizeVideo(video, supabaseClient) {
  // Get active rules ordered by priority (lowest number first)
  const { data: rules, error } = await supabaseClient
    .from('categorization_rules')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error || !rules) {
    console.error('Failed to fetch categorization rules:', error)
    return null
  }

  // Type assertion for database results
  const typedRules = rules

  // Check each rule in priority order
  for (const rule of typedRules) {
    if (matchesRule(video, rule)) {
      return rule.category_id
    }
  }

  return null // No rule matched
}

function matchesRule(video, rule) {
  const conditions = rule.conditions

  // Check each condition in the rule
  for (const [key, value] of Object.entries(conditions)) {
    if (key === 'operator') continue // Skip operator field

    switch (key) {
      case 'channel_id':
        if (video.channel_id !== value) return false
        break

      case 'title_contains':
        if (!video.title.toLowerCase().includes(String(value).toLowerCase())) return false
        break

      case 'description_contains':
        if (!video.description?.toLowerCase().includes(String(value).toLowerCase())) return false
        break

      case 'title_regex':
        try {
          const regex = new RegExp(String(value), 'i')
          if (!regex.test(video.title)) return false
        } catch {
          console.error('Invalid regex in rule:', value)
          return false
        }
        break

      default:
        console.warn('Unknown condition type:', key)
        return false
    }
  }

  return true // All conditions matched
}

async function categorizeExistingVideos() {
  console.log('Starting categorization of existing videos...')
  if (dryRun) console.log('(DRY RUN MODE - no changes will be made)')

  try {
    // Resolve CLI channel arg to DB id if needed
    await resolveTargetChannel()

    // Get total count of videos without categories (optionally scoped to a channel)
    let countQuery = supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .is('category_id', null)

    if (targetChannelDbId) {
      countQuery = countQuery.eq('channel_id', targetChannelDbId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting video count:', countError)
      return
    }

    console.log(`Found ${count} videos without categories`)

    if (count === 0) {
      console.log('No videos need categorization!')
      return
    }

    // Process videos in batches using cursor-based pagination to avoid missing rows when updates shift offsets
    const batchSize = 100
    let processed = 0
    let categorized = 0
    let lastId = null
    let batchNum = 0

    while (true) {
      batchNum++
      console.log(`Processing batch ${batchNum}...`)

      // Build base query ordered by id so we can use a cursor
      let fetchQuery = supabase
        .from('videos')
        .select('id, youtube_video_id, title, description, channel_id')
        .is('category_id', null)
        .order('id', { ascending: true })
        .limit(batchSize)

      if (targetChannelDbId) {
        fetchQuery = fetchQuery.eq('channel_id', targetChannelDbId)
      }

      if (lastId) {
        fetchQuery = fetchQuery.gt('id', lastId)
      }

      const { data: videos, error: fetchError } = await fetchQuery

      if (fetchError) {
        console.error('Error fetching videos:', fetchError)
        break
      }

      if (!videos || videos.length === 0) {
        break
      }

      // Categorize each video in the batch
      const updates = []
      for (const video of videos) {
        // Skip videos with missing required fields
        if (!video.youtube_video_id || !video.title || !video.channel_id) {
          console.warn(`Skipping video ${video.id} - missing required fields`)
          continue
        }

        try {
          const categoryId = await categorizeVideo(video, supabase)
          if (categoryId) {
            updates.push({
              id: video.id,
              category_id: categoryId
            })
          }
        } catch (error) {
          console.error(`Error categorizing video ${video.youtube_video_id}:`, error)
        }
      }

      // Update videos with categories in parallel batches
      if (updates.length > 0) {
        if (dryRun) {
          console.log(`[DRY RUN] Would update ${updates.length} videos with categories`)
          categorized += updates.length
        } else {
          const updatePromises = updates.map(update =>
            supabase
              .from('videos')
              .update({ category_id: update.category_id })
              .eq('id', update.id)
              .is('category_id', null) // ensure we only update if still uncategorized
          )

          const results = await Promise.all(updatePromises)
          let errors = []
          let successful = 0

          for (let i = 0; i < results.length; i++) {
            const res = results[i]
            if (res.error) {
              errors.push(res)
            } else if (!res.data || res.data.length === 0) {
              // No rows updated (likely someone else already set category_id)
              // We'll treat as skipped due to concurrent update
            } else {
              successful++
            }
          }

          if (errors.length > 0) {
            console.error(`Errors updating ${errors.length} videos:`, errors.slice(0, 3))
          }

          // Only increment categorized for actually-updated rows
          categorized += successful

          console.log(`Updated ${successful} videos with categories (skipped ${updates.length - successful - errors.length} due to concurrent changes)`)
        }
      }

      // Update cursor and counters
      lastId = videos[videos.length - 1].id
      processed += videos.length

      // Progress update
      console.log(`Progress: ${processed}/${count} videos processed, ${categorized} categorized`)
    }

    console.log(`\nCategorization complete!${dryRun ? ' (DRY RUN - no changes made)' : ''}`)
    console.log(`Total videos processed: ${processed}`)
    console.log(`${dryRun ? 'Videos that would be categorized' : 'Videos categorized'}: ${categorized}`)
    console.log(`Videos without categories: ${processed - categorized}`)

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
categorizeExistingVideos().then(() => {
  console.log('Script completed successfully')
  process.exit(0)
}).catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})