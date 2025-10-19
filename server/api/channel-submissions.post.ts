import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event: any) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // Get runtime config
  const config = useRuntimeConfig()

  // Create admin client for server-side
  const supabase = createClient(
    config.public.supabase.url as string,
    config.supabaseServiceKey as string
  )

  try {
    // Parse request body
    const body = await readBody(event)
    const { submissionType, channelInput } = body

    // Validate required fields
    if (!submissionType || !channelInput) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: submissionType and channelInput'
      })
    }

    // Validate submission type
    if (!['handle', 'id', 'url'].includes(submissionType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid submission type. Must be: handle, id, or url'
      })
    }

    // Get client IP for rate limiting (optional in development)
    const clientIP = getClientIP(event)
    
    // Skip rate limiting if we can't identify the client (development/staging)
    if (!clientIP) {
      console.warn('Unable to identify client IP - skipping rate limiting')
    }

    // Rate limiting: Check submissions from this IP in the last hour (only if we have an IP)
    if (clientIP) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: recentSubmissions, error: rateLimitError } = await supabase
        .from('channel_submissions')
        .select('id, submitted_at')
        .eq('client_ip', clientIP)
        .gte('submitted_at', oneHourAgo)

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError)
        // Continue with submission but log the error
      } else if (recentSubmissions && recentSubmissions.length >= 3) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Per daug pasiūlymų. Prašome palaukti valandą prieš teikiant naują pasiūlymą.'
        })
      }
    }

    // Additional validation based on type
    let validationError = null
    switch (submissionType) {
      case 'handle':
        if (!channelInput.startsWith('@') || channelInput.length < 3) {
          validationError = 'Invalid handle format. Must start with @ and be at least 3 characters'
        }
        break
      case 'id':
        if (!channelInput.startsWith('UC') || channelInput.length !== 24) {
          validationError = 'Invalid channel ID format. Must start with UC and be 24 characters'
        }
        break
      case 'url':
        try {
          const url = new URL(channelInput)
          if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
            validationError = 'Invalid YouTube URL. Must be a valid YouTube URL'
          }
        } catch {
          validationError = 'Invalid URL format'
        }
        break
    }

    if (validationError) {
      throw createError({
        statusCode: 400,
        statusMessage: validationError
      })
    }

    // Check for duplicate submissions (both pending and recently approved/rejected)
    const { data: existingSubmission, error: checkError } = await supabase
      .from('channel_submissions')
      .select('id, status, submitted_at')
      .eq('submission_type', submissionType)
      .eq('submitted_value', channelInput)
      .neq('status', 'duplicate') // Allow resubmission of duplicates
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${checkError.message}`
      })
    }

    if (existingSubmission) {
      const timeSinceSubmission = Date.now() - new Date(existingSubmission.submitted_at).getTime()
      const hoursSinceSubmission = timeSinceSubmission / (1000 * 60 * 60)

      if (existingSubmission.status === 'pending') {
        throw createError({
          statusCode: 409,
          statusMessage: 'Šis kanalas jau buvo pasiūlytas ir laukia peržiūros.'
        })
      } else if (hoursSinceSubmission < 24) {
        // Don't allow resubmission within 24 hours for rejected/approved items
        throw createError({
          statusCode: 409,
          statusMessage: 'Šis kanalas jau buvo peržiūrėtas. Naujas pasiūlymas galimas po 24 valandų.'
        })
      }
    }

    // Insert the submission
    const submissionData: any = {
      submission_type: submissionType,
      submitted_value: channelInput,
      status: 'pending'
    }
    
    // Only include client_ip if we have it
    if (clientIP) {
      submissionData.client_ip = clientIP
    }

    const { data: submission, error: insertError } = await supabase
      .from('channel_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (insertError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to save submission: ${insertError.message}`
      })
    }

    // Return success response
    return {
      success: true,
      message: 'Channel submission received successfully',
      submission: {
        id: submission.id,
        type: submission.submission_type,
        value: submission.submitted_value,
        status: submission.status,
        submittedAt: submission.submitted_at
      }
    }

  } catch (error: any) {
    // Re-throw createError instances
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Channel submission error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

// Helper function to get client IP
function getClientIP(event: any): string | null {
  // Try different headers that might contain the real IP
  const forwardedFor = event.node.req.headers['x-forwarded-for']
  const realIP = event.node.req.headers['x-real-ip']
  const cfConnectingIP = event.node.req.headers['cf-connecting-ip']

  // x-forwarded-for can be a comma-separated list, take the first one
  if (forwardedFor) {
    return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP
  }

  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP
  }

  // Fallback to connection remote address
  return event.node.req.socket?.remoteAddress || null
}