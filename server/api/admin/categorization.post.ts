import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../../src/lib/supabase'

export default defineEventHandler(async (event) => {
  // Get the Supabase admin client for admin operations
  const supabase = getSupabaseAdmin()

  // Get current user for authorization check only
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: userError } = await client.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
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

  // Validate that the category exists
  const { data: category, error: categoryError } = await supabase
    .from('video_categories')
    .select('id')
    .eq('id', body.category_id)
    .single()

  if (categoryError || !category) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid category_id: category does not exist'
    })
  }

  // Convert conditions array to object for storage
  const conditionsObject: Record<string, string> = {}
  for (const condition of body.conditions) {
    conditionsObject[condition.type] = condition.value
  }

  // Find the next available priority if the requested one is taken
  let priority = body.priority || 1
  const { data: existingRules } = await supabase
    .from('categorization_rules')
    .select('priority')
    .order('priority', { ascending: false })
    .limit(1)

  if (existingRules && existingRules.length > 0) {
    const maxPriority = existingRules[0]?.priority || 0
    if (priority <= maxPriority) {
      priority = maxPriority + 1
    }
  }

  // Create the categorization rule
  const { data: insertedRule, error: insertError } = await supabase
    .from('categorization_rules')
    .insert({
      name: body.name,
      category_id: body.category_id,
      conditions: conditionsObject,
      priority: priority,
      active: body.active !== undefined ? body.active : true
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
    throw createError({
      statusCode: 500,
      statusMessage: insertError.message
    })
  }

  // Fetch the complete rule with category info
  const { data: rule, error: selectError } = await supabase
    .from('categorization_rules')
    .select(`
      *,
      video_categories (
        id,
        name,
        key
      )
    `)
    .eq('id', insertedRule.id)
    .single()

  if (selectError) {
    throw createError({
      statusCode: 500,
      statusMessage: selectError.message
    })
  }

  return rule
})