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

      <!-- Video Player Section -->
      <section v-if="video" class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <!-- Video Player -->
          <div class="aspect-video w-full mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <iframe
              :src="`https://www.youtube.com/embed/${video.id}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="w-full h-full"
            ></iframe>
          </div>

          <!-- Video Info -->
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div class="flex-1">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{{ video.title }}</h1>
              <div class="flex items-center gap-4 text-sm text-muted dark:text-gray-400 mb-4">
                <span>{{ video.views }} views</span>
                <span>{{ video.uploaded }}</span>
              </div>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed" v-html="formatDescription(video.description)"></p>
            </div>

            <!-- Channel Info -->
            <div class="lg:w-80">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <img :src="video.channel.avatar" :alt="video.channel.name" class="w-10 h-10 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 dark:text-gray-50 truncate">{{ video.channel.name }}</h3>
                    <p class="text-sm text-muted dark:text-gray-400">{{ video.channel.subscribers }} subscribers</p>
                  </div>
                </div>
                <button
                  @click="openChannelInYouTube"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  View on YouTube
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-else class="flex items-center justify-center min-h-96">
        <div class="flex items-center gap-3 text-muted dark:text-gray-400">
          <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600"></div>
          <span>Loading video...</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const videoId = route.params.id as string

// Video data
const video = ref<any>(null)
const loading = ref(true)

// Load video data
await loadVideo()

async function loadVideo() {
  try {
    loading.value = true
    console.log('Loading video:', videoId)

    const videoData = await $fetch(`/api/public/video/${videoId}`)
    video.value = videoData

  } catch (err: any) {
    console.error('Error loading video:', err)
  } finally {
    loading.value = false
  }
}

function formatDescription(description: string): string {
  if (!description) return ''
  // Convert URLs to links and preserve line breaks
  return description
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-500">$1</a>')
}

function openChannelInYouTube() {
  if (video.value?.channel?.youtubeId) {
    window.open(`https://www.youtube.com/channel/${video.value.channel.youtubeId}`, '_blank')
  }
}

// Meta tags
useHead({
  title: () => video.value ? `${video.value.title} - YouTube Player` : 'Video - YouTube Player'
})
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }
.text-primary-600 { color: var(--tw-color-primary-600); }
</style>