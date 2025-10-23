import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Main admin user ID (from seed data)
const MAIN_ADMIN_AUTH_USER_ID = '46f41081-c641-4cf8-a2ec-96fa9a0fd249'

async function changeAdminPassword(newPassword) {
  try {
    console.log('🔄 Updating admin password and email...')

        // Update both password and email using Supabase admin API
    const { data, error } = await supabase.auth.admin.updateUserById(MAIN_ADMIN_AUTH_USER_ID, {
      password: newPassword,
      email: 'admin@toplay.lt'
    })

    if (error) {
      console.error('❌ Error updating admin auth:', error.message)
      process.exit(1)
    }

    // Also update the email in user_profiles table
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ email: 'admin@toplay.lt' })
      .eq('auth_user_id', MAIN_ADMIN_AUTH_USER_ID)

    if (profileError) {
      console.error('❌ Error updating user profile:', profileError.message)
      process.exit(1)
    }

    console.log('✅ Admin password and email updated successfully!')
    console.log('📧 New Email: admin@toplay.lt')
    console.log('🔑 New Password: [HIDDEN FOR SECURITY]')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Get password from command line argument
const newPassword = process.argv[2]

if (!newPassword) {
  console.error('❌ Usage: node change-admin-password.js <new-password>')
  console.error('Example: node change-admin-password.js "myNewSecurePassword123"')
  process.exit(1)
}

if (newPassword.length < 6) {
  console.error('❌ Password must be at least 6 characters long')
  process.exit(1)
}

// Run the script
changeAdminPassword(newPassword)