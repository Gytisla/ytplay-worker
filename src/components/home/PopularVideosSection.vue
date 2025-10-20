<template>
  <!-- Only render if loading or has videos -->
  <div ref="sectionRef" v-if="loading || videos.length > 0" class="popular-videos-section">
    <!-- Loading State -->
    <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
      <VideoCardSkeleton v-for="i in 6" :key="`skeleton-${i}`" />
    </div>

    <!-- Videos Grid -->
    <div v-else class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
      />
    </div>

    <!-- CTA Button -->
    <div v-if="!loading && videos.length > 0" class="mt-6 text-center">
      <NuxtLink
        :to="`/trending?period=${props.period}`"
        class="inline-flex items-center gap-2 px-6 py-2 border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 group"
      >
        <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
        {{ getCtaText() }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VideoCardSkeleton from '~/components/VideoCardSkeleton.vue'
import { useLazyLoadOnIntersection } from '../../composables/useLazyLoadOnIntersection'

interface Props {
  period: 'today' | '7' | '30'
}

const props = defineProps<Props>()

const videos = ref<any[]>([])
const loading = ref(true)

// Ref for intersection observer
const sectionRef = ref<HTMLElement | null>(null)

// Emit event when videos are loaded
const emit = defineEmits<{
  hasContent: [hasContent: boolean]
}>()

// Get CTA text based on period
function getCtaText() {
  switch (props.period) {
    case 'today':
      return 'Žiūrėti daugiau populiarių šiandien'
    case '7':
      return 'Žiūrėti daugiau populiarių šią savaitę'
    case '30':
      return 'Žiūrėti daugiau populiarių šį mėnesį'
    default:
      return 'Žiūrėti daugiau'
  }
}

// Lazy load on intersection
useLazyLoadOnIntersection(sectionRef, loadPopularVideos)

async function loadPopularVideos() {
  try {
    loading.value = true

    const data = await $fetch('/api/public/discovery', {
      query: {
        section: 'popular',
        period: props.period,
        limit: 6
      }
    }) as { items: any[] }

    videos.value = data.items || []
    
    // Emit whether we have content
    const hasContent = videos.value.length > 0
    emit('hasContent', hasContent)
  } catch (err: any) {
    console.error('Error loading popular videos:', err)
    videos.value = []
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