<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      <!-- User Management Card -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-4 sm:p-6">
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
        <div class="p-4 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Channel Management
                </dt>
                <dd class="text-lg font-semibold text-gray-900 dark:text-white">
                  Manage YouTube channels
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div class="text-sm">
            <NuxtLink to="/admin/channels" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200">
              View channels →
            </NuxtLink>
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
        <div class="p-4 sm:p-6">
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

    <!-- User Statistics -->
    <div class="mt-8 sm:mt-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          User Statistics
        </h3>
        <button 
          @click="fetchStats"
          :disabled="isLoadingStats"
          class="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group self-end sm:self-auto"
          :title="isLoadingStats ? 'Refreshing...' : 'Refresh statistics'"
        >
          <svg 
            class="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
            :class="{ 'animate-spin': isLoadingStats }" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
      
      <!-- Error Alert -->
      <div v-if="statsError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Failed to load statistics</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ statsError }}</p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <!-- Users Stats -->
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
            </svg>
            <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ userCount }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
        </div>
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ activeUsers }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
        </div>
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ adminCount }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Admins</div>
        </div>
      </div>
    </div>

    <!-- Content & System Statistics -->
    <div class="mt-6 sm:mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Content & System Statistics
        </h3>
        <button 
          @click="fetchStats"
          :disabled="isLoadingStats"
          class="inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group self-end sm:self-auto"
          :title="isLoadingStats ? 'Refreshing...' : 'Refresh statistics'"
        >
          <svg 
            class="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" 
            :class="{ 'animate-spin': isLoadingStats }" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <!-- Content Stats -->
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ formattedChannelCount }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Channels</div>
        </div>
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ formattedVideoCount }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Videos</div>
        </div>
        
        <!-- Additional Stats -->
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ categoryCount }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Categories</div>
        </div>
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ formattedTotalViews }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
        </div>
        
        <!-- System Stats -->
        <div class="text-center">
          <div v-if="isLoadingStats" class="animate-pulse">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
          <div v-else>
            <svg class="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <div class="text-2xl font-bold text-teal-600 dark:text-teal-400">{{ processingJobs }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Active Jobs</div>
        </div>
      </div>
      
      <!-- Additional Metrics Row -->
      <div class="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div class="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Avg Videos per Channel:</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ formattedAvgVideos }}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Avg Views per Video:</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ formattedAvgViewsPerVideo }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

// Types for API response
interface StatsResponse {
  users: {
    total: number
    active: number
    admins: number
  }
  content: {
    channels: number
    videos: number
    categories: number
    totalViews: number
  }
  system: {
    activeJobs: number
    avgVideosPerChannel: number
  }
}

// Page meta for middleware
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiredRole: 'admin'
})

const router = useRouter()
const { isAuthenticated, isAdmin, initialize } = useAuth()

// Reactive data for stats
const userCount = ref(0)
const activeUsers = ref(0)
const adminCount = ref(0)
const channelCount = ref(0)
const videoCount = ref(0)
const categoryCount = ref(0)
const totalViews = ref(0)
const processingJobs = ref(0)
const avgVideosPerChannel = ref(0)
const isLoadingStats = ref(true)
const statsError = ref<string | null>(null)

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

// Computed properties for formatted stats
const formattedTotalViews = computed(() => {
  if (totalViews.value >= 1000000) {
    return `${(totalViews.value / 1000000).toFixed(1)}M`
  } else if (totalViews.value >= 1000) {
    return `${(totalViews.value / 1000).toFixed(1)}K`
  }
  return totalViews.value.toString()
})

const formattedVideoCount = computed(() => {
  if (videoCount.value >= 1000000) {
    return `${(videoCount.value / 1000000).toFixed(1)}M`
  } else if (videoCount.value >= 1000) {
    return `${(videoCount.value / 1000).toFixed(1)}K`
  }
  return videoCount.value.toString()
})

const formattedChannelCount = computed(() => {
  if (channelCount.value >= 1000) {
    return `${(channelCount.value / 1000).toFixed(1)}K`
  }
  return channelCount.value.toString()
})

const formattedAvgVideos = computed(() => {
  return avgVideosPerChannel.value.toFixed(1)
})

const formattedAvgViewsPerVideo = computed(() => {
  if (videoCount.value === 0) return '0'
  const avg = totalViews.value / videoCount.value
  if (avg >= 1000000) {
    return `${(avg / 1000000).toFixed(1)}M`
  } else if (avg >= 1000) {
    return `${(avg / 1000).toFixed(1)}K`
  }
  return Math.round(avg).toString()
})

// Fetch stats from API
async function fetchStats() {
  try {
    isLoadingStats.value = true
    statsError.value = null

    const response = await $fetch<StatsResponse>('/api/admin/stats')
    
    userCount.value = response.users.total
    activeUsers.value = response.users.active
    adminCount.value = response.users.admins
    channelCount.value = response.content.channels
    videoCount.value = response.content.videos
    categoryCount.value = response.content.categories
    totalViews.value = response.content.totalViews
    processingJobs.value = response.system.activeJobs
    avgVideosPerChannel.value = response.system.avgVideosPerChannel
  } catch (error: any) {
    console.error('Failed to fetch stats:', error)
    statsError.value = error.message || 'Failed to load statistics'
  } finally {
    isLoadingStats.value = false
  }
}

// Fetch stats on component mount
onMounted(() => {
  fetchStats()
})
</script>