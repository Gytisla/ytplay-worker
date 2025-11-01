import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default async function (event: H3Event) {
  try {
    const supabase = getSupabaseAdmin()

    // Use the get_cron_jobs RPC function we created
    const { data, error } = await supabase.rpc('get_cron_jobs')

    if (error) {
      console.error('CRON jobs RPC error:', error)
      return {
        error: `Unable to fetch CRON jobs: ${error.message}. Make sure the get_cron_jobs() function exists and you have proper permissions.`
      }
    }

    return { data: data || [] }
  } catch (err: any) {
    console.error('CRON jobs fetch error:', err)
    return {
      error: `Failed to fetch CRON jobs: ${err?.message || String(err)}`
    }
  }
}