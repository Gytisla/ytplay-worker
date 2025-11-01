import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default async function (event: H3Event) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('channel_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(500)

    if (error) return { error: error.message }
    return { data }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}
