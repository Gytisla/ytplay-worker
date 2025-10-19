<template>
  <!-- Only render if loading or has videos -->
  <div ref="sectionRef" v-if="loading || videos.length > 0" class="popular-videos-section">
    <!-- Loading State -->
    <div v-if="loading" class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <VideoCardSkeleton v-for="i in 8" :key="`skeleton-${i}`" />
    </div>

    <!-- Videos Grid -->
    <div v-else class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
      />
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

// Lazy load on intersection
const { isLoaded } = useLazyLoadOnIntersection(sectionRef, loadPopularVideos)

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