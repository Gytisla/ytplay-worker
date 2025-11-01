import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default async function (event: H3Event) {
  try {
    const q = getQuery(event)
    const job_type = String(q.job_type || '')
    if (!job_type) return { error: 'missing job_type' }

    const supabase = getSupabaseAdmin()
    // select job fields and related job_events
    const { data, error } = await supabase
      .from('jobs')
      .select('id, status, payload, last_error, attempt_count, created_at, updated_at, job_events(*)')
      .eq('job_type', job_type)
      .or('status.eq.failed,status.eq.dead_letter')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) return { error: error.message }
    return { jobs: data ?? [] }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}
