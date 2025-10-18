<template>
  <!-- Only render if loading or has videos -->
  <div v-if="loading || videos.length > 0" class="popular-videos-section">
    <!-- Loading State -->
    <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <div v-for="i in 8" :key="`skeleton-${i}`" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
        <div class="p-4">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Videos Grid -->
    <div v-else class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <NuxtLink
        v-for="video in videos"
        :key="video.id"
        :to="`/video/${video.id}`"
        class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer"
      >
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  period: 'today' | '7' | '30'
}

const props = defineProps<Props>()

const videos = ref<any[]>([])
const loading = ref(true)

// Emit event when videos are loaded
const emit = defineEmits<{
  hasContent: [hasContent: boolean]
}>()

// Load videos based on period
await loadPopularVideos()

async function loadPopularVideos() {
  try {
    loading.value = true

    const data = await $fetch('/api/public/discovery', {
      query: {
        section: 'popular',
        period: props.period,
        limit: 8
      }
    }) as { items: any[] }

    videos.value = data.items || []
    
    // Emit whether we have content
    const hasContent = videos.value.length > 0
    console.log(`PopularVideosSection ${props.period}: hasContent = ${hasContent}, videos count = ${videos.value.length}`)
    emit('hasContent', hasContent)
  } catch (err: any) {
    console.error('Error loading popular videos:', err)
    videos.value = []
    console.log(`PopularVideosSection ${props.period}: error, emitting hasContent = false`)
    emit('hasContent', false)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>