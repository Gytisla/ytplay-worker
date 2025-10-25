<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('categoriesPage.breadcrumb') }]" />

      <!-- Title -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ t('categoriesPage.title') }}</h1>
        <p class="text-muted dark:text-gray-400 mt-2">
          {{ t('categoriesPage.description') }}
        </p>
      </div>

      <!-- Categories List -->
      <div v-if="!loading && categories.length > 0" class="mb-20">

        <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <NuxtLink
            v-for="category in categories"
            :key="`overview-${category.id}`"
            :to="`/categories/${category.key}`"
            class="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-1 overflow-hidden"
          >
            <!-- Background gradient overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 dark:to-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div class="relative flex flex-col items-center text-center h-full">
              <!-- Category Icon with enhanced styling -->
              <div class="relative mb-4">
                <div
                  class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                  :style="{
                    background: `linear-gradient(135deg, ${category.color}15, ${category.color}25)`,
                    color: category.color,
                    boxShadow: `0 8px 32px ${category.color}20`
                  }"
                >
                  {{ category.icon }}
                </div>
                <!-- Subtle glow effect -->
                <div
                  class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  :style="{ backgroundColor: category.color + '10' }"
                ></div>
              </div>

              <!-- Category Name -->
              <h3 class="font-semibold text-gray-900 dark:text-gray-50 text-base leading-tight mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors line-clamp-2">
                {{ category.name }}
              </h3>

              <!-- Video Count with modern badge style -->
              <div class="mt-auto">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  {{ category.video_count || 0 }}
                </span>
              </div>

              <!-- Hover arrow indicator -->
              <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="mb-20">
        <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <div v-for="i in 18" :key="`cat-loading-${i}`" class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
            <div class="flex flex-col items-center text-center">
              <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-auto"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Categories -->
      <div v-else-if="categories.length === 0" class="text-center py-12">
        <p class="text-muted dark:text-gray-400">{{ t('categoriesPage.noCategoriesFound') }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { t } = useI18n()

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
    slug: string
    title: string
    thumbnail: string | null
    duration: string
    views: string
    uploaded: string
    age: string
    channel: string
    channelThumb: string | null
    channelSlug: string | null
    channelId: string
  }>
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

onMounted(async () => {
  await fetchCategories()
})

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