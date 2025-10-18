import type { SupabaseClient } from '@supabase/supabase-js'

export interface VideoForCategorization {
  id: string
  youtube_video_id: string
  title: string
  description?: string
  channel_id: string
}

export interface CategorizationRule {
  id: string
  priority: number
  conditions: Record<string, unknown>
  category_id: string
  active: boolean
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

      default:
        console.warn('Unknown condition type:', key)
        return false
    }
  }

  return true // All conditions matched
}