<template>
  <!-- Hidden image for loading detection -->
  <img
    v-if="!imageLoaded"
    :src="video.thumb"
    class="hidden"
    @load="imageLoaded = true"
    @error="imageLoaded = true"
  />

  <div v-if="!imageLoaded" class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
    <!-- Loading placeholder -->
    <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
    <div class="p-4">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  </div>
  <NuxtLink
    v-else
    :to="`/video/${video.slug || video.id}`"
    class="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer"
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
      <!-- Optional badge -->
      <div v-if="badge" class="absolute top-2 left-2">
        <span
          :class="[
            'text-white text-xs px-2 py-1 rounded font-medium',
            badge.type === 'new' ? 'bg-black/60' :
            badge.type === 'trending' ? 'bg-red-600' :
            badge.type === 'ranking' ? 'bg-primary-600' :
            'bg-gray-600'
          ]"
        >
          {{ badge.text }}
        </span>
      </div>
    </div>

    <!-- Video Info -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-gray-50 mb-1 line-clamp-2">{{ video.title }}</h3>
      <div class="flex items-center gap-2 text-sm text-muted dark:text-gray-400 mb-2">
        <img v-if="video.channelThumb" :src="video.channelThumb" alt="" class="w-5 h-5 rounded-full object-cover" />
        <div v-else class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <NuxtLink
          :to="`/channel/${video.channelSlug || video.channelId}`"
          class="hover:text-primary-600 dark:hover:text-primary-400 transition"
          @click.stop
        >
          {{ video.channel }}
        </NuxtLink>
      </div>
      <div class="flex items-center justify-between text-sm text-muted dark:text-gray-400">
        <span>{{ video.views }}</span>
        <div v-if="video.trend" class="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
          <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          <span class="text-sm font-bold text-green-700 dark:text-green-300">+{{ formatNumber(video.trend.gain) }}</span>
        </div>
        <span>{{ video.age }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  video: {
    id: string
    slug?: string
    title: string
    thumb: string
    duration: string
    channel: string
    channelThumb?: string
    channelSlug?: string
    channelId?: string
    views: string
    age: string
    trend?: {
      gain: number
      period: string
    }
  }
  badge?: {
    type: 'new' | 'trending' | 'ranking' | 'custom'
    text: string
  }
}

const { video, badge } = defineProps<Props>()

// Track image loading state
const imageLoaded = ref(false)

// Fallback: show card after 3 seconds if image fails to load
setTimeout(() => {
  if (!imageLoaded.value) {
    imageLoaded.value = true
  }
}, 3000)

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  } else {
    return num.toString()
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