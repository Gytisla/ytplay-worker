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

    // Check for duplicate pending submissions
    const { data: existingSubmission, error: checkError } = await supabase
      .from('channel_submissions')
      .select('id')
      .eq('submission_type', submissionType)
      .eq('submitted_value', channelInput)
      .eq('status', 'pending')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${checkError.message}`
      })
    }

    if (existingSubmission) {
      throw createError({
        statusCode: 409,
        statusMessage: 'This channel has already been submitted and is pending review'
      })
    }

    // Insert the submission
    const { data: submission, error: insertError } = await supabase
      .from('channel_submissions')
      .insert({
        submission_type: submissionType,
        submitted_value: channelInput,
        status: 'pending'
      })
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