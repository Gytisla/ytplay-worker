import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../../src/lib/supabase'

export default defineEventHandler(async (event) => {
  // Get the Supabase client with user session
  const supabase = await serverSupabaseClient(event)

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if user is admin
  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Admin access required'
    })
  }

  // Get request body
  const body = await readBody(event)

  // Validate required fields
  if (!body.name || !body.category_id || !body.conditions) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: name, category_id, conditions'
    })
  }

  // Validate conditions structure
  if (!Array.isArray(body.conditions) || body.conditions.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conditions must be a non-empty array'
    })
  }

  // Validate each condition
  for (const condition of body.conditions) {
    if (!condition.type || !condition.value) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Each condition must have type and value'
      })
    }
  }

  // Create the categorization rule
  const { data: rule, error } = await supabase
    .from('categorization_rules')
    .insert({
      name: body.name,
      category_id: body.category_id,
      conditions: body.conditions,
      priority: body.priority || 0,
      is_active: body.is_active !== undefined ? body.is_active : true
    })
    .select(`
      *,
      video_categories (
        id,
        name,
        key
      )
    `)
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  return rule
})