<template>
  <div class="category-detail-page">
    <div class="container mx-auto px-4 pt-2 pb-8">
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
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Category not found</h3>
        <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
        <NuxtLink to="/categories" class="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to categories
        </NuxtLink>
      </div>

      <!-- Category Content -->
      <div v-else-if="category">
        <!-- Breadcrumb -->
        <Breadcrumb :breadcrumbs="[
          { label: 'Kategorijos', to: '/categories' },
          { label: category.name }
        ]" />

        <!-- Category Header -->
        <div class="mb-8">
          <div class="flex items-center mb-4">
            <div
              class="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mr-6"
              :style="{ backgroundColor: category.color + '20', color: category.color }"
            >
              {{ category.icon }}
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ category.name }}</h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">{{ category.description }}</p>
            </div>
          </div>

          <div class="flex items-center space-x-6 text-sm text-gray-500">
            <span>{{ totalVideos }} videos</span>
          </div>
        </div>

        <!-- Sorting Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <h2 class="text-xl font-semibold">Videos</h2>
          <div class="flex items-center gap-2">
            <button
              @click="changeSort('new')"
              :class="[
                'text-sm px-3 py-1 rounded-md border transition',
                videoSort === 'new'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              Latest
            </button>
            <button
              @click="changeSort('popular')"
              :class="[
                'text-sm px-3 py-1 rounded-md border transition',
                videoSort === 'popular'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              Popular
            </button>
            <select
              v-model="timePeriod"
              @change="changeTimePeriod"
              class="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="7">Last 7 days</option>
            </select>
          </div>
        </div>

        <!-- Videos Grid -->
        <div v-if="videos.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <VideoCard
            v-for="video in videos"
            :key="video.id"
            :video="{
              id: video.id,
              slug: video.slug,
              title: video.title,
              thumb: video.thumbnail,
              duration: video.duration,
              channel: video.channel,
              channelThumb: video.channelThumb,
              channelSlug: video.channelSlug,
              channelId: video.channelId,
              views: video.views,
              age: video.age,
              category: category
            }"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No videos in this category yet</h3>
          <p class="text-gray-600">Videos will appear here as they are categorized.</p>
        </div>

        <!-- Load More Trigger (invisible element for intersection observer) -->
        <div
          v-if="hasMore"
          data-load-more-trigger
          class="h-10 flex items-center justify-center mt-8"
        >
          <div v-if="isLoadingMore" class="flex items-center gap-2 text-muted dark:text-gray-400">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
            <span class="text-sm">Loading more videos...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
interface Category {
  id: string
  name: string
  key: string
  description: string | null
  color: string | null
  icon: string | null
}

interface Video {
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
}

interface CategoryDetailResponse {
  category: Category
  videos: Video[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

const route = useRoute()
const categoryKey = Array.isArray(route.params.key) ? route.params.key[0] : route.params.key as string

const category = ref<Category | null>(null)
const videos = ref<Video[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const totalVideos = ref(0)
const hasMore = ref(false)
const page = ref(1)
const pageSize = 24

// Sorting state
const videoSort = ref<'new' | 'popular'>('new')
const timePeriod = ref<'all' | '7' | '30'>('all')

// Infinite scroll state
const isLoadingMore = ref(false)
const observer = ref<IntersectionObserver | null>(null)

const fetchCategory = async (resetPage = true) => {
  try {
    if (resetPage) {
      loading.value = true
      page.value = 1
    } else {
      isLoadingMore.value = true
    }
    error.value = null

    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: pageSize.toString(),
      sort: videoSort.value,
      period: timePeriod.value
    })

    const data = await $fetch<CategoryDetailResponse>(`/api/categories/${categoryKey}?${params}`)

    if (!data) {
      throw new Error('Category not found')
    }

    category.value = data.category
    if (resetPage) {
      videos.value = data.videos
    } else {
      videos.value = [...videos.value, ...data.videos]
    }
    totalVideos.value = data.total_count
    hasMore.value = data.has_more
    // Setup intersection observer after loading videos
    nextTick(() => setupIntersectionObserver())
  } catch (err) {
    console.error('Failed to fetch category:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load category'
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

const changeSort = async (sort: 'new' | 'popular') => {
  videoSort.value = sort
  await fetchCategory(true)
}

const changeTimePeriod = async () => {
  await fetchCategory(true)
}

// Infinite scroll functions
const setupIntersectionObserver = () => {
  if (process.client) {
    // Clean up existing observer
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }

    nextTick(() => {
      const triggerElement = document.querySelector('[data-load-more-trigger]')
      if (triggerElement) {
        observer.value = new IntersectionObserver(
          (entries) => {
            const target = entries[0]
            if (target?.isIntersecting && hasMore.value && !isLoadingMore.value) {
              loadMoreVideos()
            }
          },
          {
            rootMargin: '200px'
          }
        )
        observer.value.observe(triggerElement)
      }
    })
  }
}

const cleanupIntersectionObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
}

const loadMoreVideos = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  page.value++
  await fetchCategory(false)
  isLoadingMore.value = false
}

onMounted(() => {
  fetchCategory()
})

// SEO
useHead(() => ({
  title: category.value ? `${category.value.name} - YTPlay.lt` : 'Category - YTPlay.lt',
  meta: [
    {
      name: 'description',
      content: category.value ? `Explore ${totalVideos.value} videos in the ${category.value.name} category. ${category.value.description || ''}` : 'Browse videos by category'
    },
    // Open Graph
    {
      property: 'og:title',
  content: category.value ? `${category.value.name} - YTPlay.lt` : 'Category - YTPlay.lt'
    },
    {
      property: 'og:description',
      content: category.value ? `Explore ${totalVideos.value} videos in the ${category.value.name} category. ${category.value.description || ''}` : 'Browse videos by category'
    },
    {
      property: 'og:image',
      content: '/assets/hero-thumb.svg'
    },
    {
      property: 'og:url',
      content: `https://ytplay-worker.vercel.app/categories/${categoryKey}`
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:site_name',
  content: 'YTPlay.lt'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: category.value ? `${category.value.name} - YTPlay.lt` : 'Category - YTPlay.lt'
    },
    {
      name: 'twitter:description',
      content: category.value ? `Explore ${totalVideos.value} videos in the ${category.value.name} category. ${category.value.description || ''}` : 'Browse videos by category'
    },
    {
      name: 'twitter:image',
      content: '/assets/hero-thumb.svg'
    }
  ]
}))

onMounted(() => {
  fetchCategory()
  // Setup intersection observer after initial load
  nextTick(() => setupIntersectionObserver())
})

// Watch for hasMore changes to setup/cleanup observer
watch(hasMore, (newHasMore) => {
  if (newHasMore) {
    nextTick(() => setupIntersectionObserver())
  } else {
    cleanupIntersectionObserver()
  }
})
</script>

<style scoped>
.video-card {
  transition: all 0.2s ease;
}

.video-card:hover {
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
</style>