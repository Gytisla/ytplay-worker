<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: 'Populiariausi' }]" />

      <!-- Title and Filters -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Populiariausi</h1>

          <!-- Period Filter -->
          <div class="flex flex-wrap items-center gap-1 sm:gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-1 sm:mr-2 whitespace-nowrap">Laikotarpis:</span>
            <button
              v-for="periodOption in periodOptions"
              :key="periodOption.key"
              @click="selectedPeriod = periodOption.key"
              :class="[
                'px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap',
                selectedPeriod === periodOption.key
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              <span class="hidden sm:inline">{{ periodOption.label }}</span>
              <span class="sm:hidden">{{ periodOption.mobileLabel }}</span>
            </button>
          </div>
        </div>

        <p class="text-muted dark:text-gray-400">
          {{ getDescriptionText() }}
        </p>
      </div>

      <!-- Videos Grid -->
      <section>
        <!-- Loading State -->
        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          <VideoCardSkeleton v-for="i in 12" :key="`skeleton-${i}`" />
        </div>

        <!-- Videos -->
        <div v-else-if="videos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          <VideoCard
            v-for="(video, index) in videos"
            :key="video.id"
            :video="video"
            :ranking="{ showMedal: index < 3, position: index + 1 }"
          />
        </div>

        <!-- No videos -->
        <div v-else class="text-center py-12">
          <div class="text-gray-500 dark:text-gray-400">
            Nėra vaizdo įrašų
          </div>
        </div>

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
            Pasiekta maksimali vaizdo įrašų riba ({{ maxVideos }}). Išbandyk kitą laikotarpį.
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
// Nuxt auto-imported helpers (declare so TS doesn't complain in script-setup)
declare function useI18n(): { t: (key: string, ...args: any[]) => string }
declare function useRoute(): any
declare const useHead: any
const { t } = useI18n()

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// SEO meta
useHead(() => ({
  title: t('seo.topVideos.title') + ' | ' + t('seo.siteName'),
  meta: [
    {
      name: 'description',
      content: t('seo.topVideos.description')
    },
    // Open Graph
    {
      property: 'og:title',
      content: t('seo.topVideos.ogTitle')
    },
    {
      property: 'og:description',
      content: t('seo.topVideos.ogDescription')
    },
    { property: 'og:image', content: '/assets/hero-thumb.svg' },
    { property: 'og:url', content: 'https://toplay.lt/trending' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: t('seo.siteName') || 'ToPlay.lt' },
    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: t('seo.topVideos.ogTitle') },
    { name: 'twitter:description', content: t('seo.topVideos.ogDescription') },
    { name: 'twitter:image', content: '/assets/hero-thumb.svg' }
  ]
}))

// Period options
const periodOptions = [
  { key: 'today', label: 'Šiandien', mobileLabel: 'Šiandien' },
  { key: '7', label: 'Šią savaitę', mobileLabel: 'Šią sav.' },
  { key: '30', label: 'Šį mėnesį', mobileLabel: 'Šį mėn.' }
]

// Reactive state
const selectedPeriod = ref('today')
const videos = ref<any[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const pageSize = 24
const maxVideos = 48 // Limit total videos to prevent excessive loading

// Get initial period from query params
const route = useRoute()
const queryPeriod = route.query.period as string
if (queryPeriod && ['today', '7', '30'].includes(queryPeriod)) {
  selectedPeriod.value = queryPeriod
}

// Refs
const infiniteScrollTrigger = ref<HTMLElement | null>(null)

// Computed properties
const section = computed(() => 'popular')

const hasReachedLimit = computed(() => videos.value.length >= maxVideos)

const getDescriptionText = () => {
  switch (selectedPeriod.value) {
    case 'today':
      return 'Populiariausi vaizdo įrašai šiandien'
    case '7':
      return 'Populiariausi vaizdo įrašai šią savaitę'
    case '30':
      return 'Populiariausi vaizdo įrašai šį mėnesį'
    default:
      return 'Populiariausi vaizdo įrašai'
  }
}

// Load videos function
const loadVideos = async (page = 1, append = false) => {
  try {
    if (page === 1) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const data = await $fetch('/api/public/discovery', {
      query: {
        section: section.value,
        period: selectedPeriod.value,
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
    console.error('Error loading trending videos:', err)
    if (!append) {
      videos.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more videos
const loadMore = () => {
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

// Watch for period changes
watch(selectedPeriod, () => {
  currentPage.value = 1
  hasMore.value = true
  loadVideos(1, false)
})

// Intersection observer for infinite scroll
let observer: IntersectionObserver | null = null

onMounted(() => {
  // Initial load
  loadVideos()

  // Set up intersection observer for infinite scroll
  if (process.client && window.IntersectionObserver) {
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
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>