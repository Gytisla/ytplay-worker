import { ref, computed } from 'vue'
import type { AuthError, User, Session } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserRole = Database['public']['Tables']['user_profiles']['Row']['role']

export const useAuth = () => {
  const supabase = useSupabaseClient<Database>()
  const user = ref<User | null>(null)
  const loading = ref(false)
  const profile = ref<UserProfile | null>(null)

  // Prevent multiple auth listeners
  let authListener: any = null

  // Set up auth state change listener only once
  if (!authListener) {
    authListener = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('Auth state changed:', event)

      try {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // For token refresh, we can use the session data directly (more reliable)
          if (event === 'TOKEN_REFRESHED' && session?.user) {
            user.value = session.user
            await loadProfile()
            return
          }

          // For sign in, get fresh user data
          const { data: { user: authenticatedUser }, error } = await supabase.auth.getUser()
          if (error) {
            console.error('Error getting authenticated user:', error)
            user.value = null
            profile.value = null
            return
          }
          user.value = authenticatedUser
          if (user.value) {
            await loadProfile()
          } else {
            profile.value = null
          }
        } else if (event === 'SIGNED_OUT') {
          user.value = null
          profile.value = null
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        user.value = null
        profile.value = null
      }
    })
  }

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isModerator = computed(() => profile.value?.role === 'moderator' || profile.value?.role === 'admin')
  const userRole = computed(() => profile.value?.role || 'user')

  // Load user profile
  const loadProfile = async () => {
    if (!user.value) {
      profile.value = null
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', user.value.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Profile doesn't exist, create it
          await upsertProfile({
            email: user.value.email || null,
            role: 'user' // Default role, can be changed later
          })
          return
        } else {
          console.error('Error loading profile:', error)
          // For debugging, create a temporary profile even if the query fails
          profile.value = {
            id: 'temp-id',
            auth_user_id: user.value.id,
            email: user.value.email || null,
            full_name: user.value.user_metadata?.['full_name'] || null,
            avatar_url: user.value.user_metadata?.['avatar_url'] || null,
            role: 'user', // Default to user, change manually if needed
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserProfile
          return
        }
      }

      profile.value = data
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  // Create or update user profile
  const upsertProfile = async (profileData: Partial<UserProfile>) => {
    if (!user.value) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          auth_user_id: user.value.id,
          email: user.value.email || null,
          ...profileData
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting profile:', error)
        return null
      }

      profile.value = data
      return data
    } catch (error) {
      console.error('Error upserting profile:', error)
      return null
    }
  }

  // Sign up
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    loading.value = true
    try {
      const signUpOptions = metadata ? { data: metadata } : {}
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions
      })

      if (error) throw error

      // Create profile after successful signup
      if (data.user) {
        await upsertProfile({
          full_name: metadata?.['full_name'],
          avatar_url: metadata?.['avatar_url']
        })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    } finally {
      loading.value = false
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Load profile after successful sign in
      await loadProfile()

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      profile.value = null
      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    } finally {
      loading.value = false
    }
  }

  // Check if user has required role
  const hasRole = (requiredRole: UserRole) => {
    if (!profile.value?.role || !requiredRole) return false

    const roleHierarchy: Record<NonNullable<UserRole>, number> = { user: 0, moderator: 1, admin: 2 }
    const userRole = profile.value.role
    if (!userRole) return false

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  // Initialize auth state
  const initialize = async () => {
    // Prevent multiple initializations
    if (loading.value) return
    loading.value = true

    try {
      // Get authenticated user securely
      const { data: { user: authenticatedUser }, error } = await supabase.auth.getUser()
      if (error) {
        // Don't log AuthSessionMissingError as it's expected when not authenticated
        if (error.message !== 'Auth session missing!') {
          console.error('Error getting authenticated user:', error)
        }
        user.value = null
        profile.value = null
        return
      }

      user.value = authenticatedUser

      if (user.value) {
        await loadProfile()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      user.value = null
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  // Cleanup function for auth listener
  const cleanup = () => {
    if (authListener) {
      authListener.unsubscribe?.()
      authListener = null
    }
  }

  return {
    // State
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isModerator,
    userRole,

    // Methods
    signUp,
    signIn,
    signOut,
    loadProfile,
    upsertProfile,
    hasRole,
    initialize,
    cleanup
  }
}