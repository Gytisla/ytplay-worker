<template>
  <div class="min-h-[60vh]">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Admin Dashboard
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage users, content, and system settings
      </p>
    </div>

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- User Management Card -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  User Management
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage user accounts and roles
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div class="text-sm">
            <NuxtLink to="/admin/users" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
              View users →
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Content Management Card -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Content Management
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage videos and channels
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">Coming soon</span>
          </div>
        </div>
      </div>

      <!-- Analytics Card -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Analytics
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                  View system statistics
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div class="text-sm">
            <span class="text-gray-500 dark:text-gray-400">Coming soon</span>
          </div>
        </div>
      </div>

      <!-- Categorization Card -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Categorization
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage video categorization rules
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div class="text-sm">
            <NuxtLink to="/admin/categorization" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
              Manage rules →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="mt-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        System Overview
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ userCount }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ activeUsers }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ adminCount }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Admin Users</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Page meta for middleware
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

const router = useRouter()
const { isAuthenticated, isAdmin, initialize } = useAuth()

// Reactive data for stats
const userCount = ref(0)
const activeUsers = ref(0)
const adminCount = ref(0)

// Initialize auth on page load
await initialize()

// Check authentication and role on client side
if (process.client) {
  if (!isAuthenticated.value) {
    await router.push('/login')
  } else if (!isAdmin.value) {
    await router.push('/')
  }
}

// TODO: Fetch actual stats from API
// For now, using placeholder values
userCount.value = 42
activeUsers.value = 38
adminCount.value = 3
</script>