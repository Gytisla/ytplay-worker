import { getSupabaseAdmin } from '../../../src/lib/supabase'
import { requireAdminAuth } from '../../lib/admin-auth'

export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdminAuth(event)

  // Get admin client for database operations
  const supabase = getSupabaseAdmin()

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

  // Check if the desired priority is already taken
  const { data: conflictingRule } = await supabase
    .from('categorization_rules')
    .select('id')
    .eq('priority', priority)
    .single()

  // If priority is taken, throw an error
  if (conflictingRule) {
    throw createError({
      statusCode: 400,
      statusMessage: `Priority ${priority} is already taken by another rule. Please choose a different priority.`
    })
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