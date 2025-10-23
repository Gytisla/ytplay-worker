<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('newVideosPage.breadcrumb') }]" />

      <!-- Title and Description -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ t('newVideosPage.title') }}</h1>
        <p class="text-muted dark:text-gray-400 mt-2">
          {{ t('newVideosPage.description') }}
        </p>
      </div>

      <!-- Videos Grid -->
      <section>
        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div v-for="i in 12" :key="`video-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="videos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <VideoCard
            v-for="(video, index) in videos"
            :key="video.id"
            :video="{
              id: video.id,
              slug: video.slug,
              title: video.title,
              thumb: video.thumb,
              duration: video.duration,
              channel: video.channel,
              channelThumb: video.channelThumb,
              channelSlug: video.channelSlug,
              channelId: video.channelId,
              views: video.views,
              age: video.age,
              category: video.category,
              live_broadcast_content: video.live_broadcast_content
            }"
            :badge="{ type: 'new', text: 'NAUJAS' }"
          />
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">{{ t('newVideosPage.noVideosFound') }}</p>
        </div>
      </section>

      <!-- Infinite scroll trigger -->
      <div
        v-if="hasMore && !loading"
        ref="infiniteScrollTrigger"
        class="h-10 flex items-center justify-center mt-8"
      >
        <div v-if="loadingMore" class="text-gray-500 dark:text-gray-400">
          Kraunama daugiau vaizdo įrašų...
        </div>
      </div>

      <!-- Limit reached message -->
      <div
        v-else-if="!hasMore && hasReachedLimit"
        class="text-center mt-8 py-4"
      >
        <div class="text-gray-500 dark:text-gray-400">
          Pasiekta maksimali vaizdo įrašų riba ({{ maxVideos }}). Išbandykite kitą laikotarpį.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useI18n } from '#i18n'

const { t } = useI18n()

// Data state
const videos = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const hasMore = ref(true)
const pageSize = 24
const maxVideos = 200 // Limit total videos to prevent excessive loading

// Refs
const infiniteScrollTrigger = ref<HTMLElement | null>(null)

// Computed properties
const hasReachedLimit = computed(() => videos.value.length >= maxVideos)

// Load videos function
async function loadVideos(page = 1, append = false) {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const data = await $fetch('/api/public/discovery', {
      query: {
        section: 'new',
        limit: pageSize,
        offset: (page - 1) * pageSize
      }
    }) as { items: any[] }

    const newVideos = data.items || []

    if (append) {
      videos.value = [...videos.value, ...newVideos]
    } else {
      videos.value = newVideos
    }

    hasMore.value = newVideos.length === pageSize && videos.value.length < maxVideos
    currentPage.value = page

  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading videos:', err)
    if (!append) {
      videos.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more videos
function loadMore() {
  // Check if we've reached the maximum limit
  if (videos.value.length >= maxVideos) {
    hasMore.value = false
    return
  }

  if (!loadingMore.value && hasMore.value) {
    loadVideos(currentPage.value + 1, true)
  }
}

// Watch for changes to the trigger element
watch(infiniteScrollTrigger, (newElement, oldElement) => {
  if (observer) {
    if (oldElement) {
      observer.unobserve(oldElement)
    }
    if (newElement) {
      observer.observe(newElement)
    }
  }
})

// Intersection observer for infinite scroll
let observer: IntersectionObserver | null = null

// Setup infinite scroll
function setupInfiniteScroll() {
  if (!process.client || !window.IntersectionObserver) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        loadMore()
      }
    },
    {
      rootMargin: '100px', // Start loading 100px before the trigger becomes visible
      threshold: 0.1
    }
  )

  // Watch the trigger element
  if (infiniteScrollTrigger.value) {
    observer.observe(infiniteScrollTrigger.value)
  }
}

// Cleanup
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Initial load
onMounted(() => {
  loadVideos()
  setupInfiniteScroll()
})

// Meta tags
useHead({
  title: `${t('newVideosPage.title')} - ToPlay.lt`,
  meta: [
    {
      name: 'description',
      content: t('newVideosPage.description')
    },
    // Open Graph
    {
      property: 'og:title',
      content: t('newVideosPage.ogTitle')
    },
    {
      property: 'og:description',
      content: t('newVideosPage.ogDescription')
    },
    {
      property: 'og:image',
      content: '/assets/hero-thumb.svg'
    },
    {
      property: 'og:url',
      content: 'https://toplay.lt/new'
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:site_name',
      content: 'ToPlay.lt'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: t('newVideosPage.ogTitle')
    },
    {
      name: 'twitter:description',
      content: t('newVideosPage.ogDescription')
    },
    {
      name: 'twitter:image',
      content: '/assets/hero-thumb.svg'
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>