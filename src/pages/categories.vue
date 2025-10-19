<template>
  <div class="categories-page">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Video Categories</h1>
        <p class="text-gray-600">Explore videos organized by topic and content type</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 mb-4">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load categories</h3>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Categories Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
        >
          <!-- Category Header -->
          <div class="p-6 border-b border-gray-100">
            <div class="flex items-center mb-3">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4"
                :style="{ backgroundColor: category.color + '20', color: category.color }"
              >
                {{ category.icon }}
              </div>
              <div>
                <h3 class="text-xl font-semibold text-gray-900">{{ category.name }}</h3>
                <p class="text-sm text-gray-600">{{ category.description }}</p>
              </div>
            </div>

            <!-- Category Stats -->
            <div class="flex items-center text-sm text-gray-500">
              <span class="mr-4">{{ category.video_count || 0 }} videos</span>
              <NuxtLink
                :to="`/categories/${category.key}`"
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                View all →
              </NuxtLink>
            </div>
          </div>

          <!-- Latest Videos -->
          <div class="p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Latest Videos</h4>
            <div v-if="category.latest_videos && category.latest_videos.length > 0" class="space-y-3">
              <NuxtLink
                v-for="video in category.latest_videos.slice(0, 3)"
                :key="video.id"
                :to="`/video/${video.youtube_video_id}`"
                class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <img
                  :src="video.thumbnail_url"
                  :alt="video.title"
                  class="w-16 h-12 object-cover rounded"
                  loading="lazy"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ video.title }}</p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(video.published_at) }}
                  </p>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="text-sm text-gray-500 py-4 text-center">
              No videos yet
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && categories.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
        <p class="text-gray-600">Categories will appear here once videos are categorized.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryWithVideos } from '~/types/category'

import { ref, onMounted } from 'vue'

const categories = ref<CategoryWithVideos[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

interface CategoryWithVideos {
  id: string
  name: string
  key: string
  description: string | null
  color: string | null
  icon: string | null
  video_count?: number
  latest_videos?: Array<{
    id: string
    youtube_video_id: string
    title: string
    thumbnail_url: string | null
    published_at: string
  }>
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const fetchCategories = async () => {
  try {
    loading.value = true
    error.value = null

    const data = await $fetch<CategoryWithVideos[]>('/api/categories')

    console.log(data)

    categories.value = data || []
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
})

// SEO
useHead({
  title: 'Video Categories',
  meta: [
    {
      name: 'description',
      content: 'Explore videos organized by topic and content type'
    }
  ]
})
</script>

<style scoped>
.category-card {
  transition: all 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
}
</style>