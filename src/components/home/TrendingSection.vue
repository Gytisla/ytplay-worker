<template>
  <section ref="sectionRef" id="trending">
    <div class="mb-6">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Trending</h2>
      <p class="text-sm text-muted dark:text-gray-400">Popular videos gaining traction across the network.</p>
    </div>

    <div class="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <template v-if="loading">
        <VideoCardSkeleton v-for="i in 8" :key="`t-skel-${i}`" />
      </template>

      <template v-else>
        <VideoCard
          v-for="item in items"
          :key="item.id"
          :video="item"
          :badge="{ type: 'trending', text: 'TRENDING' }"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import VideoCard from '~/components/VideoCard.vue'
import VideoCardSkeleton from '~/components/VideoCardSkeleton.vue'
import { useLazyLoadOnIntersection } from '../../composables/useLazyLoadOnIntersection'

// Use a simple static path as a safe fallback for the bundled SVG asset to
// avoid TypeScript import issues for image modules in this environment.
const thumb = '/assets/hero-thumb.svg'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = toRef(props, 'loading')

// Ref for intersection observer
const sectionRef = ref<HTMLElement | null>(null)

// Real data state
const items = ref<Array<any>>([])
const localLoading = ref(true)
const error = ref<string | null>(null)

// Lazy load on intersection
const { isLoaded } = useLazyLoadOnIntersection(sectionRef, loadTrendingVideos, { delay: 200 })

async function loadTrendingVideos() {
  try {
    console.log('Loading trending videos...')
    localLoading.value = true

    const data = await $fetch('/api/public/discovery', {
      query: { section: 'trending', limit: 8 }
    }) as { items: any[] }

    items.value = (data.items || []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      thumb: item.thumb,
      title: item.title,
      channel: item.channel,
      channelThumb: item.channelThumb,
      views: item.views,
      age: item.age,
      duration: item.duration,
    }))
  } catch (err: any) {
    error.value = String(err?.message ?? err)
    console.error('Error loading trending videos:', err)
    // Fallback to placeholder items on error
    items.value = Array.from({ length: 8 }).map((_, i) => ({
      id: `trend-${i}`,
      thumb,
      title: `Trending video ${i + 1} — watch this now`,
      channel: `Channel ${i + 1}`,
      channelThumb: null,
      views: `${Math.floor(Math.random() * 200) + 20}K views`,
      age: `${Math.floor(Math.random() * 30) + 1}h`,
      duration: `${Math.floor(Math.random() * 12) + 1}:0${Math.floor(Math.random() * 9)}`,
    }))
  } finally {
    localLoading.value = false
  }
}
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }

/* Small optimizations for card content */
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; -webkit-line-clamp: 2; line-clamp: 2; }
</style>
