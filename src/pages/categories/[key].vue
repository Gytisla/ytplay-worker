<template>
  <div class="category-detail-page">
    <div class="container mx-auto px-4 py-8">
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
            <NuxtLink to="/categories" class="text-blue-600 hover:text-blue-800">
              ← All categories
            </NuxtLink>
          </div>
        </div>

        <!-- Videos Grid -->
        <div v-if="videos.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <NuxtLink
            v-for="video in videos"
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
              <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {{ formatDuration(video.duration) }}
              </div>
            </div>

            <!-- Video Info -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h3>
              <div class="flex items-center justify-between text-sm text-muted dark:text-gray-400">
                <span>{{ formatNumber(video.view_count) }} views</span>
                <span>{{ formatDate(video.published_at) }}</span>
              </div>
            </div>
          </NuxtLink>
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

        <!-- Load More -->
        <div v-if="hasMore && !loadingMore" class="text-center mt-8">
          <button
            @click="loadMore"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Videos
          </button>
        </div>

        <div v-if="loadingMore" class="text-center mt-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  title: string
  description: string | null
  published_at: string
  duration: string | null
  view_count: number | null
  thumbnail_url: string | null
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
const loadingMore = ref(false)
const error = ref<string | null>(null)
const totalVideos = ref(0)
const hasMore = ref(false)
const page = ref(1)
const pageSize = 24

const formatDuration = (duration: string | null) => {
  if (!duration) return '0:00'

  // Parse ISO 8601 duration (PT4M13S) to minutes:seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchCategory = async () => {
  console.log('fetchCategory called with key:', categoryKey)
  try {
    loading.value = true
    error.value = null

    const data = await $fetch<CategoryDetailResponse>(`/api/categories/${categoryKey}`)
    console.log('API response:', data)

    if (!data) {
      throw new Error('Category not found')
    }

    category.value = data.category
    videos.value = data.videos
    totalVideos.value = data.total_count
    hasMore.value = data.videos.length === pageSize
  } catch (err) {
    console.error('Failed to fetch category:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load category'
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  try {
    loadingMore.value = true
    page.value++

    const data = await $fetch<CategoryDetailResponse>(`/api/categories/${categoryKey}`, {
      query: { page: page.value, limit: pageSize }
    })

    if (data?.videos) {
      videos.value.push(...data.videos)
      hasMore.value = data.videos.length === pageSize
    } else {
      hasMore.value = false
    }
  } catch (err) {
    console.error('Failed to load more videos:', err)
  } finally {
    loadingMore.value = false
  }
}

onMounted(() => {
  fetchCategory()
})

// SEO
useHead(() => ({
  title: category.value ? `${category.value.name} - Video Categories` : 'Category',
  meta: [
    {
      name: 'description',
      content: category.value ? `Explore ${totalVideos.value} videos in the ${category.value.name} category` : 'Browse videos by category'
    }
  ]
}))

onMounted(() => {
  fetchCategory()
})
</script>

onMounted(() => {
  fetchCategory()
})

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