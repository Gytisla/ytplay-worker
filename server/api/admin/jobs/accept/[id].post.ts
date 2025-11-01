import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default async function (event: H3Event) {
  try {
    const jobId = event.context.params?.id
    if (!jobId) {
      return { error: 'Job ID required' }
    }

    const supabase = getSupabaseAdmin()

    // Update the job status to completed
    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('status', 'dead_letter') // Only allow accepting dead letter jobs

    if (error) {
      return { error: `Failed to accept job: ${error.message}` }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}