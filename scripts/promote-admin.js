#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: node scripts/promote-admin.js <email>
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToAdmin(email) {
  try {
    console.log(`Promoting user ${email} to admin...`)

    // First, find the user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)

    if (authError || !authUser.user) {
      console.error(`User with email ${email} not found in auth system`)
      console.log('Make sure the user has registered first')
      return
    }

    const userId = authUser.user.id
    console.log(`Found user with ID: ${userId}`)

    // Update or insert the user profile with admin role
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        auth_user_id: userId,
        email: email,
        full_name: authUser.user.user_metadata?.full_name || email.split('@')[0],
        role: 'admin',
        is_active: true
      }, {
        onConflict: 'auth_user_id'
      })

    if (error) {
      console.error('Error promoting user to admin:', error)
      return
    }

    console.log(`✅ Successfully promoted ${email} to admin role!`)
    console.log('You can now access admin features at /admin')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Get email from command line arguments
const email = process.argv[2]
if (!email) {
  console.log('Usage: node scripts/promote-admin.js <email>')
  console.log('Example: node scripts/promote-admin.js admin@example.com')
  process.exit(1)
}

promoteToAdmin(email)