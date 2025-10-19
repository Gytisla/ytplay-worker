#!/usr/bin/env node

/**
 * Remove Channel Script
 *
 * Safely removes a YouTube channel and all associated data from the database.
 * This includes videos, stats, jobs, and job events.
 *
 * Usage:
 *   node scripts/remove-channel.js <channel_identifier>
 *
 * Where channel_identifier can be:
 *   - Channel ID (UC...)
 *   - Channel handle (@...)
 *   - Channel URL
 *   - Channel slug
 *
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const envPath = join(__dirname, '..', '.env.local')
let envVars = {}

try {
  const envContent = readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  })
} catch (error) {
  console.log('No .env.local file found, using process environment variables')
}

const SUPABASE_URL = process.env.SUPABASE_URL || envVars.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  if (!SUPABASE_URL) console.error('  - SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file or environment.')
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✓ Set' : '✗ Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing')
  process.exit(1)
}

console.log('✅ Environment variables loaded successfully')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Resolve channel identifier to channel ID
 */
async function resolveChannelIdentifier(identifier) {
  console.log(`🔍 Resolving channel identifier: ${identifier}`)

  // Try different resolution strategies
  const strategies = [
    // 1. Direct channel ID lookup
    async () => {
      if (identifier.startsWith('UC') && identifier.length === 24) {
        const { data, error } = await supabase
          .from('channels')
          .select('id, title, slug, custom_url, youtube_channel_id')
          .eq('youtube_channel_id', identifier)
          .single()
        if (!error && data) {
          return { type: 'id', channel: data }
        }
      }
      return null
    },

    // 2. Handle lookup (with or without @)
    async () => {
      const handle = identifier.startsWith('@') ? identifier : `@${identifier}`
      const { data, error } = await supabase
        .from('channels')
        .select('id, title, handle, custom_url')
        .eq('handle', handle)
        .single()

      if (!error && data) {
        return { type: 'handle', channel: data }
      }
      return null
    },

    // 3. Custom URL lookup
    async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('id, title, handle, custom_url')
        .eq('custom_url', identifier)
        .single()

      if (!error && data) {
        return { type: 'custom_url', channel: data }
      }
      return null
    },

    // 4. Slug lookup
    async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('id, title, handle, custom_url')
        .eq('slug', identifier)
        .single()

      if (!error && data) {
        return { type: 'slug', channel: data }
      }
      return null
    },

    // 5. URL parsing (extract handle or ID from YouTube URL)
    async () => {
      let extracted = null

      if (identifier.includes('youtube.com/channel/')) {
        extracted = identifier.split('youtube.com/channel/')[1].split('/')[0]
      } else if (identifier.includes('youtube.com/@')) {
        extracted = '@' + identifier.split('youtube.com/@')[1].split('/')[0]
      } else if (identifier.includes('youtube.com/c/')) {
        extracted = identifier.split('youtube.com/c/')[1].split('/')[0]
      } else if (identifier.includes('youtu.be/')) {
        // This would be a video URL, not channel URL
        return null
      }

      if (extracted) {
        // Try to resolve the extracted identifier
        return await resolveChannelIdentifier(extracted)
      }

      return null
    }
  ]

  for (const strategy of strategies) {
    try {
      const result = await strategy()
      if (result) {
        return result
      }
    } catch (error) {
      // Continue to next strategy
    }
  }

  return null
}

/**
 * Get all data that will be deleted for a channel
 */
async function getChannelDataSummary(channelId) {
  console.log('📊 Gathering data summary...')

  const summary = {
    channel: null,
    videos: { count: 0, data: [] },
    videoStats: { count: 0 },
    channelStats: { count: 0 },
    jobs: { count: 0 },
    jobEvents: { count: 0 }
  }

  // Get channel info
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single()

  if (channelError || !channel) {
    throw new Error(`Channel not found: ${channelId}`)
  }
  summary.channel = channel

  // Get videos (limit to first 5 for display)
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, title, published_at')
    .eq('channel_id', channelId)
    .order('published_at', { ascending: false })
    .limit(5)

  if (!videosError && videos) {
    summary.videos.count = videos.length
    summary.videos.data = videos
  }

  // Get total video count
  const { count: totalVideos, error: countError } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId)

  if (!countError && totalVideos !== null) {
    summary.videos.count = totalVideos
  }

  // Get video stats count (through videos)
  const { data: videoIds, error: videoIdsError } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channelId)

  if (!videoIdsError && videoIds && videoIds.length > 0) {
    const videoIdsList = videoIds.map(v => v.id)
    const { count: videoStatsCount, error: videoStatsError } = await supabase
      .from('video_stats')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIdsList)

    if (!videoStatsError && videoStatsCount !== null) {
      summary.videoStats.count = videoStatsCount
    }
  }

  // Get channel stats count
  const { count: channelStatsCount, error: channelStatsError } = await supabase
    .from('channel_stats')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId)

  if (!channelStatsError && channelStatsCount !== null) {
    summary.channelStats.count = channelStatsCount
  }


  return summary
}

/**
 * Display data summary
 */
function displayDataSummary(summary) {
  console.log('\n📋 DATA TO BE DELETED:')
  console.log('=' .repeat(50))

  console.log(`🎥 Channel: ${summary.channel.title}`)
  console.log(`   ID: ${summary.channel.id}`)
  console.log(`   Handle: ${summary.channel.handle || 'N/A'}`)
  console.log(`   Custom URL: ${summary.channel.custom_url || 'N/A'}`)
  console.log(`   Created: ${new Date(summary.channel.created_at).toLocaleDateString()}`)

  console.log(`\n📹 Videos: ${summary.videos.count}`)
  if (summary.videos.data.length > 0) {
    console.log('   Recent videos:')
    summary.videos.data.forEach(video => {
      console.log(`   - ${video.title.substring(0, 60)}${video.title.length > 60 ? '...' : ''}`)
    })
    if (summary.videos.count > 5) {
      console.log(`   ... and ${summary.videos.count - 5} more`)
    }
  }

  console.log(`\n📊 Video Stats: ${summary.videoStats.count}`)
  console.log(`📈 Channel Stats: ${summary.channelStats.count}`)
  console.log(`⚙️  Jobs: ${summary.jobs.count}`)
  console.log(`📝 Job Events: ${summary.jobEvents.count}`)

  const totalItems = summary.videos.count + summary.videoStats.count +
                    summary.channelStats.count + summary.jobs.count +
                    summary.jobEvents.count + 1 // +1 for channel

  console.log(`\n💀 Total items to delete: ${totalItems}`)
}

/**
 * Prompt for confirmation
 */
function promptForConfirmation() {
  return new Promise((resolve) => {
    process.stdout.write('\n⚠️  Are you sure you want to delete this channel and ALL associated data? (type "yes" to confirm): ')

    process.stdin.setEncoding('utf8')
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase()
      resolve(input === 'yes')
    })
  })
}

async function deleteChannel(channelId) {
  console.log('\n🗑️  Starting deletion process...')

  try {
    // Delete in order to respect foreign key constraints

    // 1. Get all video IDs for this channel (needed for video stats deletion)
    const { data: videos, error: videosQueryError } = await supabase
      .from('videos')
      .select('id')
      .eq('channel_id', channelId)

    if (videosQueryError) {
      throw new Error(`Failed to query videos: ${videosQueryError.message}`)
    }

    // 2. Delete video stats for all videos in this channel
    if (videos && videos.length > 0) {
      const videoIds = videos.map(v => v.id)
      const { error: videoStatsError } = await supabase
        .from('video_stats')
        .delete()
        .in('video_id', videoIds)

      if (videoStatsError) {
        throw new Error(`Failed to delete video stats: ${videoStatsError.message}`)
      }
      console.log(`✅ Deleted video stats for ${videos.length} videos`)
    }

    // 3. Delete videos
    const { error: videosError } = await supabase
      .from('videos')
      .delete()
      .eq('channel_id', channelId)

    if (videosError) {
      throw new Error(`Failed to delete videos: ${videosError.message}`)
    }
    console.log(`✅ Deleted videos`)

    // 4. Delete channel stats
    const { error: channelStatsError } = await supabase
      .from('channel_stats')
      .delete()
      .eq('channel_id', channelId)

    if (channelStatsError) {
      throw new Error(`Failed to delete channel stats: ${channelStatsError.message}`)
    }
    console.log(`✅ Deleted channel stats`)

    // 5. Finally, delete the channel
    const { error: channelError } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

    if (channelError) {
      throw new Error(`Failed to delete channel: ${channelError.message}`)
    }
    console.log(`✅ Deleted channel`)

    console.log('\n🎉 Channel and all associated data deleted successfully!')

  } catch (error) {
    console.error(`\n❌ Deletion failed: ${error.message}`)
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Usage: node scripts/remove-channel.js <channel_identifier>')
    console.error('   channel_identifier can be: channel ID, handle (@...), URL, or slug')
    process.exit(1)
  }

  const identifier = args[0]

  try {
    // Resolve the channel identifier
    const resolution = await resolveChannelIdentifier(identifier)

    if (!resolution) {
      console.error(`❌ Could not find channel with identifier: ${identifier}`)
      console.error('   Try using the channel ID (UC...), handle (@...), or custom URL.')
      process.exit(1)
    }

    console.log(`✅ Found channel via ${resolution.type}: ${resolution.channel.title}`)

    // Get data summary
    const summary = await getChannelDataSummary(resolution.channel.id)

    // Display what will be deleted
    displayDataSummary(summary)

    // Prompt for confirmation
    const confirmed = await promptForConfirmation()

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user.')
      process.exit(0)
    }

    // Perform deletion
    await deleteChannel(resolution.channel.id)

  } catch (error) {
    console.error(`\n💥 Error: ${error.message}`)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Operation cancelled by user.')
  process.exit(0)
})

// Run the script
main()