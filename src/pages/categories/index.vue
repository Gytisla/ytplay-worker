<template>
  <div class="categories-page">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Video Categories</h1>
        <p class="text-gray-600 dark:text-gray-400">Explore videos organized by topic and content type</p>
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
        <h3 class="text-lg font-medium text-gray-900  dark:text-white mb-2">Failed to load categories</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
      </div>

      <!-- Categories List -->
      <div v-else class="space-y-3">
        <div
          v-for="category in categories"
          :key="category.id"
          class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition group"
        >
          <div class="flex items-center gap-6">
            <!-- Category Icon -->
            <div
              class="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
              :style="{ backgroundColor: category.color + '20', color: category.color }"
            >
              {{ category.icon }}
            </div>

            <!-- Category Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-50">{{ category.name }}</h3>
                <span class="text-sm text-muted dark:text-gray-400">{{ category.video_count || 0 }} videos</span>
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-3">{{ category.description }}</p>

              <!-- Latest Videos Grid -->
                            <!-- Latest Videos Grid -->
              <div v-if="category.latest_videos && category.latest_videos.length > 0" class="mt-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Latest Videos</h4>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <NuxtLink
                    v-for="video in category.latest_videos.slice(0, 4)"
                    :key="video.id"
                    :to="`/video/${video.youtube_video_id}`"
                    class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer"
                  >
                    <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      <img
                        :src="video.thumbnail_url"
                        :alt="video.title"
                        class="w-full h-full object-cover group-hover:scale-105 transition"
                        loading="lazy"
                      />
                      <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        NEW
                      </div>
                    </div>
                    <div class="p-4">
                      <h5 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">
                        {{ video.title }}
                      </h5>
                      <p class="text-sm text-muted dark:text-gray-400">
                        {{ formatDate(video.published_at) }}
                      </p>
                    </div>
                  </NuxtLink>
                </div>
                <div v-if="category.latest_videos.length > 4" class="mt-3 text-center">
                  <NuxtLink
                    :to="`/categories/${category.key}`"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    <span>Discover {{ category.latest_videos.length - 4 }} more videos</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </NuxtLink>
                </div>
              </div>
              <div v-else class="text-sm text-muted dark:text-gray-400 py-2">
                No videos yet
              </div>
            </div>

            <!-- View All Link -->
            <div class="flex-shrink-0">
              <NuxtLink
                :to="`/categories/${category.key}`"
                class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                <span>Explore</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </NuxtLink>
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

    categories.value = data || []
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

await fetchCategories()

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
/* No custom styles needed for the vertical list layout */
</style>