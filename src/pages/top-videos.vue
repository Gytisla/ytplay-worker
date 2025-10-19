<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('topVideosPage.breadcrumb') }]" />

      <!-- Title and Controls -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
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
          <NuxtLink
            v-for="(video, index) in videos"
            :key="video.id"
            :to="`/video/${video.slug || video.id}`"
            class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer relative"
          >
            <!-- Ranking Badge -->
            <div class="absolute top-3 left-3 z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                 :class="index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-800/80 text-white'">
              {{ index + 1 }}
            </div>

            <!-- Medal for Top 3 -->
            <div v-if="index < 3" class="absolute top-3 right-3 z-10">
              <div class="w-8 h-8 rounded-full flex items-center justify-center"
                   :class="index === 0 ? 'bg-yellow-100 dark:bg-yellow-900' :
                          index === 1 ? 'bg-gray-100 dark:bg-gray-800' :
                          'bg-orange-100 dark:bg-orange-900'">
                <svg class="w-4 h-4" :class="index === 0 ? 'text-yellow-600' :
                                             index === 1 ? 'text-gray-600 dark:text-gray-400' :
                                             'text-orange-600'" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>

            <!-- Thumbnail -->
            <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <img
                :src="video.thumb"
                :alt="video.title"
                class="w-full h-full object-cover group-hover:scale-105 transition"
                loading="lazy"
              />
              <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {{ video.duration }}
              </div>
            </div>

            <!-- Video Info -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h3>
              <div class="flex items-center gap-2 text-sm text-muted dark:text-gray-400 mb-2">
                <img v-if="video.channelThumb" :src="video.channelThumb" alt="" class="w-5 h-5 rounded-full object-cover" />
                <div v-else class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <span>{{ video.channel }}</span>
              </div>
              <div class="flex items-center justify-between text-sm text-muted dark:text-gray-400">
                <span>{{ video.views }}</span>
                <span>{{ video.age }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">{{ t('topVideosPage.noVideosFound') }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const { t } = useI18n()

// Data state
const videos = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const sortBy = ref<'views' | 'trending'>('views')

// Load videos data
await loadVideos()

// Watch for sort changes and reload
watch(sortBy, async () => {
  await loadVideos()
})

async function loadVideos() {
  try {
    loading.value = true
    console.log(`Loading top videos sorted by ${sortBy.value}...`)

    const section = sortBy.value === 'views' ? 'new' : 'trending'
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
  title: `${t('topVideosPage.title')} - YouTube Player`,
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
      content: 'YouTube Player'
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