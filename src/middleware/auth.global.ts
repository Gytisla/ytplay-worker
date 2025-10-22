import type { Database } from '~/types/supabase'

type UserRole = Database['public']['Enums']['user_role']

export default defineNuxtRouteMiddleware(async (to) => {
  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth
  const requiredRole = to.meta.requiredRole as UserRole

  if (!requiresAuth && !requiredRole) {
    return
  }

  // For SSR, we need to handle auth differently
  if (process.server) {
    // On server side, we can't use client-side composables
    // Let the page handle authentication checks
    return
  }

  // Client-side auth check
  const { isAuthenticated, hasRole, initialize } = useAuth()

  // Initialize auth state
  await initialize()

  if (requiresAuth && !isAuthenticated.value) {
    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // User doesn't have required role, redirect to home
    return navigateTo('/')
  }
})