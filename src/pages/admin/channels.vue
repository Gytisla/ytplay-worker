<template>
  <div class="space-y-6">
    <!-- Channels Table -->
    <div class="bg-white dark:bg-slate-800 shadow-lg overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-5">
        <h3 class="text-lg leading-6 font-semibold text-gray-900 dark:text-white">
          All Channels
        </h3>
        <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          A list of all registered channels in the system.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search channels..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
              @input="debouncedSearch"
            />
          </div>
          <div class="flex gap-2">
            <select
              v-model="limit"
              @change="loadChannels"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:text-white"
            >
              <option :value="10">10 per page</option>
              <option :value="25">25 per page</option>
              <option :value="50">50 per page</option>
              <option :value="100">100 per page</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="loading" class="px-6 py-5">
        <div class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <span class="ml-2 text-gray-600 dark:text-gray-400">Loading channels...</span>
        </div>
      </div>

      <div v-else-if="channels.length === 0" class="px-6 py-5">
        <p class="text-gray-500 dark:text-gray-400 text-center">
          {{ searchQuery ? 'No channels found matching your search.' : 'No channels found.' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button @click="sortBy('title')" class="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Channel {{ getSortIndicator('title') }}
                </button>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button @click="sortBy('subscriber_count')" class="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Subscribers {{ getSortIndicator('subscriber_count') }}
                </button>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button @click="sortBy('video_count')" class="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Videos {{ getSortIndicator('video_count') }}
                </button>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tracked Videos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <button @click="sortBy('updated_at')" class="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Last Updated {{ getSortIndicator('updated_at') }}
                </button>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="channel in channels" :key="channel.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <img
                      :src="failedImages.has(channel.id) ? '/assets/logo.png' : (channel.thumbnail_url || '/assets/logo.png')"
                      :alt="channel.title"
                      class="h-10 w-10 rounded-full object-cover"
                      @error="handleImageError(channel.id)"
                    />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      <NuxtLink
                        :to="`/channel/${channel.slug}`"
                        class="hover:text-primary-600 dark:hover:text-primary-400"
                        target="_blank"
                      >
                        {{ channel.title }}
                      </NuxtLink>
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ channel.youtube_channel_id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatNumber(channel.subscriber_count) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatNumber(channel.video_count) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatNumber(channel.tracked_video_count || 0) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(channel.updated_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <NuxtLink
                    :to="`/channel/${channel.slug}`"
                    class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    target="_blank"
                  >
                    View
                  </NuxtLink>
                  <button
                    @click="refreshChannel(channel.id)"
                    :disabled="refreshingChannel === channel.id"
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                  >
                    {{ refreshingChannel === channel.id ? 'Refreshing...' : 'Refresh' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="channels.length > 0" class="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Showing {{ (currentPage - 1) * limit + 1 }} to {{ Math.min(currentPage * limit, totalChannels) }} of {{ totalChannels }} channels
          </div>
          <div class="flex space-x-2">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200"
            >
              Previous
            </button>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage * limit >= totalChannels"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import type { Database } from '~/types/supabase'

type Channel = Database['public']['Tables']['channels']['Row'] & {
  tracked_video_count?: number
}

// Page meta for middleware
definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiredRole: 'admin'
})

// State
const channels = ref<Channel[]>([])
const loading = ref(true)
const refreshingChannel = ref<string | null>(null)
const searchQuery = ref('')
const limit = ref(25)
const currentPage = ref(1)
const totalChannels = ref(0)
const failedImages = ref<Set<string>>(new Set())
const sortField = ref<'title' | 'subscriber_count' | 'video_count' | 'updated_at'>('subscriber_count')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadChannels()
  }, 300)
}

// Sort channels
const sortBy = (field: typeof sortField.value) => {
  if (sortField.value === field) {
    // Toggle direction if same field
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New field, default to desc for counts, asc for text
    sortField.value = field
    sortDirection.value = field === 'title' ? 'asc' : 'desc'
  }
  currentPage.value = 1
  loadChannels()
}

// Get sort indicator
const getSortIndicator = (field: typeof sortField.value) => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// Load channels
const loadChannels = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams({
      limit: limit.value.toString(),
      offset: ((currentPage.value - 1) * limit.value).toString(),
      ...(searchQuery.value && { search: searchQuery.value }),
      sort: sortField.value,
      direction: sortDirection.value
    })

    const response = await $fetch(`/api/admin/channels?${params}`) as {
      channels: Channel[]
      total: number
    }

    channels.value = response.channels || []
    totalChannels.value = response.total || 0
  } catch (error) {
    console.error('Error loading channels:', error)
  } finally {
    loading.value = false
  }
}

// Refresh channel data
const refreshChannel = async (channelId: string) => {
  refreshingChannel.value = channelId
  try {
    await $fetch('/api/admin/channels/refresh', {
      method: 'POST',
      body: { channelId }
    })

    // Reload channels to show updated data
    await loadChannels()
  } catch (error) {
    console.error('Error refreshing channel:', error)
  } finally {
    refreshingChannel.value = null
  }
}

// Pagination
const goToPage = (page: number) => {
  currentPage.value = page
  loadChannels()
}

// Format numbers
const formatNumber = (num: number | null) => {
  if (num === null) return 'N/A'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Format date
const formatDate = (date: string | null) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle image loading errors
const handleImageError = (channelId: string) => {
  failedImages.value.add(channelId)
}

// Load channels on mount
onMounted(() => {
  loadChannels()
})
</script>