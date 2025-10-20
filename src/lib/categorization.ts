import type { SupabaseClient } from '@supabase/supabase-js'

export interface VideoForCategorization {
  id: string
  youtube_video_id: string
  title: string
  description?: string
  channel_id: string
  duration: string  // YouTube duration format like "PT4M13S"
}

export interface CategorizationRule {
  id: string
  priority: number
  conditions: Record<string, unknown>
  category_id: string
  active: boolean
}

// Helper function to parse YouTube duration to seconds
function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0
  
  // Handle HH:MM:SS format (e.g., "00:22:21" or "3:00:00")
  if (/^\d+:\d+:\d+$/.test(duration)) {
    const parts = duration.split(':')
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = parseInt(parts[2], 10)
      return hours * 3600 + minutes * 60 + seconds
    }
  }
  
  // Handle ISO 8601 format (e.g., "PT3H", "PT4M13S", "PT1H2M3S")
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

export async function categorizeVideo(
  video: VideoForCategorization,
  supabase: SupabaseClient
): Promise<string | null> {
  // Get active rules ordered by priority (lowest number first)
  const { data: rules, error } = await supabase
    .from('categorization_rules')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error || !rules) {
    console.error('Failed to fetch categorization rules:', error)
    return null
  }

  // Type assertion for database results
  const typedRules = rules as CategorizationRule[]

  // Check each rule in priority order
  for (const rule of typedRules) {
    if (matchesRule(video, rule)) {
      return rule.category_id
    }
  }

  return null // No rule matched
}

function matchesRule(video: VideoForCategorization, rule: CategorizationRule): boolean {
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

      case 'duration_lt':  // New condition: duration less than X seconds
        const videoSeconds = parseDurationToSeconds(video.duration)
        const thresholdSeconds = Number(value)
        if (videoSeconds >= thresholdSeconds) return false
        break

      default:
        console.warn('Unknown condition type:', key)
        return false
    }
  }

  return true // All conditions matched
}