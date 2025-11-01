import { defineEventHandler, readBody, sendError, createError } from 'h3'
import { getSupabaseAdmin } from '~/lib/supabase'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = event.context.params?.id as string
    const { action, review_notes } = body as any
    if (!id || !action) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'missing parameters' }))
    }

    const supabase = getSupabaseAdmin()
    const allowed = ['approved', 'rejected', 'duplicate', 'pending']
    if (!allowed.includes(action)) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'invalid action' }))
    }

    // Prepare update payload. If reverting to 'pending' clear reviewed_at and optionally review_notes.
    const updatePayload: any = { status: action }
    if (action === 'pending') {
      updatePayload.review_notes = null
      updatePayload.reviewed_at = null
    } else {
      updatePayload.review_notes = review_notes ?? null
      updatePayload.reviewed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('channel_submissions')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('Supabase update error', error)
      return sendError(event, createError({ statusCode: 500, statusMessage: error.message }))
    }

    return { ok: true }
  } catch (err: any) {
    console.error('channel-submissions action handler error', err)
    return sendError(event, createError({ statusCode: 500, statusMessage: err?.message || String(err) }))
  }
})
