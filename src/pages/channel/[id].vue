<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <!-- Back Button -->
      <div class="mb-6">
        <NuxtLink to="/" class="flex items-center gap-2 text-muted dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back
        </NuxtLink>
      </div>

      <!-- Channel Info -->
      <section v-if="channel" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div class="flex flex-col md:flex-row gap-6">
            <img :src="channel.avatar" alt="" class="w-24 h-24 rounded-full object-cover mx-auto md:mx-0" />
            <div class="flex-1 text-center md:text-left">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{{ channel.name }}</h1>
              <p class="text-muted dark:text-gray-400 mb-4">{{ channel.description || 'No description available' }}</p>
              <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm mb-4">
                <span class="text-muted dark:text-gray-400">{{ channel.subs }} subscribers</span>
                <span class="text-muted dark:text-gray-400">{{ channel.videos }} videos</span>
                <span class="text-muted dark:text-gray-400">Joined {{ channel.joined }}</span>
              </div>
              <div class="flex justify-center md:justify-start">
                <button class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Videos Grid -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Videos</h3>
          <div class="flex items-center gap-2">
            <button class="text-sm px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300">Latest</button>
            <button class="text-sm px-3 py-1 rounded-md bg-primary-600 text-white hover:bg-primary-500 transition">Popular</button>
          </div>
        </div>

        <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 12" :key="`vid-skel-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
            <div class="p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
            </div>
          </div>
        </div>

        <div v-else-if="videos.length > 0" class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article v-for="video in videos" :key="video.id" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer" @click="navigateToVideo(video.id)">
            <div class="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
              <img :src="video.thumbnail" :alt="video.title" class="w-full h-full object-cover group-hover:scale-105 transition" />
              <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {{ video.duration }}
              </div>
            </div>
            <div class="p-4">
              <h4 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h4>
              <div class="flex items-center justify-between text-sm text-muted dark:text-gray-400">
                <span>{{ video.views }} views</span>
                <span>{{ video.uploaded }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="text-center py-12">
          <p class="text-muted dark:text-gray-400">No videos found for this channel.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const channelId = route.params.id as string

// Channel data
const channel = ref<any>(null)
const videos = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Load channel data
await loadChannel()

function navigateToVideo(videoId: string) {
  navigateTo(`/video/${videoId}`)
}

async function loadChannel() {
  try {
    loading.value = true
    console.log('Loading channel:', channelId)

    // Load channel info
    const channelData = await $fetch(`/api/public/channel/${channelId}`)
    channel.value = channelData

    // Load channel videos
    const videosData = await $fetch(`/api/public/channel/${channelId}/videos`, {
      query: { limit: 24 }
    }) as { videos: any[] }
    videos.value = videosData.videos || []

  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading channel:', err)
  } finally {
    loading.value = false
  }
}

// Meta tags
useHead({
  title: () => channel.value ? `${channel.value.name} - YouTube Player` : 'Channel - YouTube Player'
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>