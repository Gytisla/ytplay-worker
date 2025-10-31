<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">
      <!-- Breadcrumb -->
      <Breadcrumb :breadcrumbs="[{ label: t('liveUpcoming.title') }]" />

      <!-- Title and Filters -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ t('liveUpcoming.title') }}</h1>

          <!-- Type Filter -->
          <div class="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              @click="activeTab = 'live'"
              :class="[
                activeTab === 'live'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                'px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center space-x-2'
              ]"
            >
              <span>{{ t('liveUpcoming.tabs.live') }}</span>
              <span v-if="liveCount !== null" class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {{ liveCount }}
              </span>
            </button>
            <button
              @click="activeTab = 'upcoming'"
              :class="[
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                'px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap flex items-center space-x-2'
              ]"
            >
              <span>{{ t('liveUpcoming.tabs.upcoming') }}</span>
              <span v-if="upcomingCount !== null" class="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ upcomingCount }}
              </span>
            </button>
          </div>
        </div>

        <p class="text-muted dark:text-gray-400">
          {{ t('liveUpcoming.description') }}
        </p>
      </div>
      <!-- Live Videos -->
      <div v-if="activeTab === 'live'">
        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 12" :key="`live-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="liveVideos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <VideoCard
            v-for="video in liveVideos"
            :key="video.id"
            :video="video"
          />
        </div>

        <div v-else class="text-center py-12">
          <div class="text-6xl mb-4">📺</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ t('liveUpcoming.noLive.title') }}</h3>
          <p class="text-gray-500 dark:text-gray-400">{{ t('liveUpcoming.noLive.description') }}</p>
        </div>
      </div>

      <!-- Upcoming Videos -->
      <div v-if="activeTab === 'upcoming'">
        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 12" :key="`upcoming-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="upcomingVideos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <VideoCard
            v-for="video in upcomingVideos"
            :key="video.id"
            :video="video"
          />
        </div>

        <div v-else class="text-center py-12">
          <div class="text-6xl mb-4">📅</div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">{{ t('liveUpcoming.noUpcoming.title') }}</h3>
          <p class="text-gray-500 dark:text-gray-400">{{ t('liveUpcoming.noUpcoming.description') }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// https://nuxt.com/docs/guide/directory-structure/pages#page-metadata
definePageMeta({
  layout: 'default'
})

// ensure useHead is recognized (Nuxt auto-imported in most files)
declare const useHead: any
// Provide a minimal declaration so the TS checker knows about the auto-imported `useI18n` in SFCs
declare function useI18n(): { t: (key: string, ...args: any[]) => string }

// Vue composition helpers (these are normally auto-imported by Nuxt/Vite)
import { ref, watch, onMounted } from 'vue'

const { t } = useI18n()

// Page meta (SEO + Open Graph)
useHead({
  title: t('seo.liveUpcoming.title') + ' | ' + t('seo.siteName'),
  meta: [
    { name: 'description', content: t('seo.liveUpcoming.description') },
    { property: 'og:title', content: t('seo.liveUpcoming.ogTitle') },
    { property: 'og:description', content: t('seo.liveUpcoming.ogDescription') },
    { property: 'og:image', content: '/assets/hero-thumb.svg' },
    { property: 'og:url', content: 'https://toplay.lt/live-upcoming' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: t('seo.liveUpcoming.ogTitle') },
    { name: 'twitter:description', content: t('seo.liveUpcoming.ogDescription') },
    { name: 'twitter:image', content: '/assets/hero-thumb.svg' }
  ]
})

// State
const activeTab = ref<'live' | 'upcoming'>('live')
const liveVideos = ref<any[]>([])
const upcomingVideos = ref<any[]>([])
const loading = ref(true)
const liveCount = ref<number | null>(null)
const upcomingCount = ref<number | null>(null)

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadLiveVideos(),
    loadUpcomingVideos()
  ])
  loading.value = false
})

// Watch tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'live' && liveVideos.value.length === 0) {
    await loadLiveVideos()
  } else if (newTab === 'upcoming' && upcomingVideos.value.length === 0) {
    await loadUpcomingVideos()
  }
})

async function loadLiveVideos() {
  try {
    const response = await $fetch('/api/public/live-upcoming', {
      query: { type: 'live', limit: 24 }
    }) as { videos: any[], hasMore: boolean, total: number }

    liveVideos.value = response.videos
    liveCount.value = response.total
  } catch (error) {
    console.error('Error loading live videos:', error)
    liveVideos.value = []
    liveCount.value = 0
  }
}

async function loadUpcomingVideos() {
  try {
    const response = await $fetch('/api/public/live-upcoming', {
      query: { type: 'upcoming', limit: 24 }
    }) as { videos: any[], hasMore: boolean, total: number }

    upcomingVideos.value = response.videos
    upcomingCount.value = response.total
  } catch (error) {
    console.error('Error loading upcoming videos:', error)
    upcomingVideos.value = []
    upcomingCount.value = 0
  }
}
</script>