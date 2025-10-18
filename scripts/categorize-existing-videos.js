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

  try {
    // Get total count of videos without categories
    const { count, error: countError } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .is('category_id', null)

    if (countError) {
      console.error('Error getting video count:', countError)
      return
    }

    console.log(`Found ${count} videos without categories`)

    if (count === 0) {
      console.log('No videos need categorization!')
      return
    }

    // Process videos in batches to avoid memory issues
    const batchSize = 100
    let processed = 0
    let categorized = 0

    while (processed < count) {
      console.log(`Processing batch ${Math.floor(processed / batchSize) + 1}...`)

      // Get batch of videos
      const { data: videos, error: fetchError } = await supabase
        .from('videos')
        .select('id, youtube_video_id, title, description, channel_id')
        .is('category_id', null)
        .range(processed, processed + batchSize - 1)

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
            categorized++
          }
        } catch (error) {
          console.error(`Error categorizing video ${video.youtube_video_id}:`, error)
        }
      }

      // Update videos with categories in parallel batches
      if (updates.length > 0) {
        const updatePromises = updates.map(update =>
          supabase
            .from('videos')
            .update({ category_id: update.category_id })
            .eq('id', update.id)
        )

        const results = await Promise.all(updatePromises)
        const errors = results.filter(result => result.error)

        if (errors.length > 0) {
          console.error(`Errors updating ${errors.length} videos:`, errors.slice(0, 3))
        }

        console.log(`Updated ${updates.length - errors.length} videos with categories`)
      }

      processed += videos.length

      // Progress update
      console.log(`Progress: ${processed}/${count} videos processed, ${categorized} categorized`)
    }

    console.log(`\nCategorization complete!`)
    console.log(`Total videos processed: ${processed}`)
    console.log(`Videos categorized: ${categorized}`)
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