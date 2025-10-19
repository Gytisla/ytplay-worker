<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: 'Categories' }]" />

      <!-- Title -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Categories</h1>
        <p class="text-muted dark:text-gray-400 mt-2">
          Explore videos organized by category
        </p>
      </div>

      <!-- Categories with Videos -->
      <div v-if="loading" class="space-y-12">
        <div v-for="i in 6" :key="`cat-skel-${i}`" class="space-y-6">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div v-for="j in 4" :key="`vid-skel-${i}-${j}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
              <div class="p-4">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="categories.length > 0" class="space-y-12">
        <section v-for="category in categories" :key="category.id" class="space-y-6">
          <!-- Category Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                :style="{ backgroundColor: category.color + '20', color: category.color }"
              >
                {{ category.icon }}
              </div>
              <div>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-50">{{ category.name }}</h2>
                <p class="text-sm text-muted dark:text-gray-400">{{ category.video_count || 0 }} videos</p>
              </div>
            </div>
            <NuxtLink
              :to="`/categories/${category.key}`"
              class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition text-sm font-medium"
            >
              View All
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </NuxtLink>
          </div>

          <!-- Videos Grid -->
          <div v-if="category.latest_videos && category.latest_videos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <NuxtLink
              v-for="video in category.latest_videos"
              :key="video.id"
              :to="`/video/${video.youtube_video_id}`"
              class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer"
            >
              <!-- Thumbnail -->
              <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                <img
                  :src="video.thumbnail_url"
                  :alt="video.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition"
                  loading="lazy"
                />
              </div>

              <!-- Video Info -->
              <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h3>
                <div class="text-sm text-muted dark:text-gray-400">
                  {{ formatDate(video.published_at) }}
                </div>
              </div>
            </NuxtLink>
          </div>

          <!-- No videos message -->
          <div v-else class="text-center py-8">
            <p class="text-muted dark:text-gray-400">No videos in this category yet.</p>
          </div>
        </section>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-muted dark:text-gray-400">No categories found.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const categories = ref<any[]>([])
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

// SEO and Open Graph meta tags
useHead({
  title: () => $t('seo.categories.title'),
  meta: [
    {
      name: 'description',
      content: () => $t('seo.categories.description')
    },
    // Open Graph tags
    {
      property: 'og:title',
      content: () => $t('seo.categories.ogTitle')
    },
    {
      property: 'og:description',
      content: () => $t('seo.categories.ogDescription')
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:url',
      content: () => `${$t('seo.siteUrl')}/categories`
    },
    {
      property: 'og:site_name',
      content: () => $t('seo.siteName')
    },
    // Twitter Card tags
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: () => $t('seo.categories.ogTitle')
    },
    {
      name: 'twitter:description',
      content: () => $t('seo.categories.ogDescription')
    }
  ]
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>