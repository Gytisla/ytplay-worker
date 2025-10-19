<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('topVideosPage.breadcrumb') }]" />

      <!-- Title and Controls -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ t('topVideosPage.title') }}</h1>
          <div class="flex items-center gap-2">
            <button @click="sortBy = 'views'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', sortBy === 'views' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600']">
              {{ t('topVideosPage.sortByViews') }}
            </button>
            <button @click="sortBy = 'trending'" :class="['px-4 py-2 rounded-lg text-sm font-medium transition', sortBy === 'trending' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600']">
              {{ t('topVideosPage.sortByTrending') }}
            </button>
          </div>
        </div>
        <p class="text-muted dark:text-gray-400">
          {{ sortBy === 'views' ? t('topVideosPage.descriptionViews') : t('topVideosPage.descriptionTrending') }}
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
              trend: video.trend
            }"
            :ranking="{
              position: index + 1,
              showMedal: index < 3
            }"
          />
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">{{ t('topVideosPage.noVideosFound') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const { t } = useI18n()

// Data state
const videos = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortBy = ref<'views' | 'trending'>('views')

// Load videos data on client mount so navigation is instant
onMounted(async () => {
  await loadVideos()
})

// Watch for sort changes and reload
watch(sortBy, async () => {
  await loadVideos()
})

async function loadVideos() {
  try {
    loading.value = true

    const section = sortBy.value === 'views' ? 'top' : 'trending'
    const data = await $fetch('/api/public/discovery', {
      query: { section, limit: 50 }
    }) as { items: any[] }

    videos.value = (data.items || []).map((video: any) => ({
      id: video.id,
      thumb: video.thumb,
      title: video.title,
      channel: video.channel,
      channelThumb: video.channelThumb,
      views: video.views,
      age: video.age,
      duration: video.duration,
    }))
  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading videos:', err)
    // Fallback to placeholder items on error
    videos.value = Array.from({ length: 12 }).map((_, i) => ({
      id: `video-${i}`,
      thumb: '/assets/hero-thumb.svg',
      title: `Amazing Video ${i + 1}: Something really cool to watch`,
      channel: `Channel ${i + 1}`,
      channelThumb: null,
      views: `${Math.floor(Math.random() * 100) + 1}K views`,
      age: `${Math.floor(Math.random() * 30) + 1}d`,
      duration: `${Math.floor(Math.random() * 12) + 1}:0${Math.floor(Math.random() * 9)}`,
    }))
  } finally {
    loading.value = false
  }
}

// Meta tags
useHead({
  title: `${t('topVideosPage.title')} - YTPlay.lt`,
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
    {
      property: 'og:image',
      content: '/assets/hero-thumb.svg'
    },
    {
      property: 'og:url',
      content: 'https://ytplay-worker.vercel.app/top-videos'
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
      content: t('seo.topVideos.ogTitle')
    },
    {
      name: 'twitter:description',
      content: t('seo.topVideos.ogDescription')
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