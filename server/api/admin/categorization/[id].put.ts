import { serverSupabaseClient } from '#supabase/server'
import { getSupabaseAdmin } from '../../../../src/lib/supabase'

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

  // Get the rule ID from the URL
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Rule ID is required'
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

  // Handle priority assignment
  let priority = body.priority || 1

  // Check if the desired priority is already taken by another rule
  const { data: conflictingRule } = await supabase
    .from('categorization_rules')
    .select('id')
    .eq('priority', priority)
    .neq('id', id) // Exclude the current rule
    .single()

  // If priority is taken, throw an error
  if (conflictingRule) {
    throw createError({
      statusCode: 400,
      statusMessage: `Priority ${priority} is already taken by another rule. Please choose a different priority.`
    })
  }

  // Update the categorization rule
  const { error: updateError } = await supabase
    .from('categorization_rules')
    .update({
      name: body.name,
      category_id: body.category_id,
      conditions: conditionsObject,
      priority: priority,
      active: body.active !== undefined ? body.active : true
    })
    .eq('id', id)

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message
    })
  }

  // Fetch the updated rule with category info
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
    .eq('id', id)
    .single()

  if (selectError) {
    throw createError({
      statusCode: 500,
      statusMessage: selectError.message
    })
  }

  return rule
})