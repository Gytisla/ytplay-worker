import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default async function (event: H3Event) {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('job_queue_status')
      .select('*')
      .order('job_type', { ascending: true })
      .order('status', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}
