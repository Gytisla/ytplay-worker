<template>
  <section id="trending" class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-semibold">Trending</h2>
        <p class="text-sm text-muted dark:text-gray-400">Popular videos gaining traction across the network.</p>
      </div>
      <div class="hidden sm:flex items-center gap-2">
        <button class="text-sm px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-muted dark:text-gray-300">Today</button>
        <button class="text-sm px-3 py-1 rounded-md bg-primary-600 text-white hover:bg-primary-500 transition">This week</button>
      </div>
    </div>

    <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <template v-if="loading">
        <div v-for="i in 8" :key="`t-skel-${i}`" class="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden animate-pulse">
          <div class="w-full h-44 bg-gray-200 dark:bg-gray-700"></div>
          <div class="p-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 w-3/4 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
          </div>
        </div>
      </template>

      <template v-else>
        <article v-for="item in items" :key="item.id" class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition transform hover:-translate-y-1 hover:shadow-lg focus-within:shadow-lg cursor-pointer" @click="navigateToVideo(item.slug || item.id)">
          <div class="block focus:outline-none">
            <div class="relative">
              <img :src="item.thumb" alt="" class="w-full h-44 object-cover" />
              <span class="absolute left-3 top-3 bg-red-600 text-white text-xs px-2 py-1 rounded">TRENDING</span>
              <div class="absolute right-3 bottom-3 bg-white/90 dark:bg-black/60 text-xs px-2 py-1 rounded text-muted dark:text-gray-200">{{ item.duration }}</div>
            </div>

            <div class="p-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">{{ item.title }}</h3>
              <div class="mt-2 flex items-center justify-between text-xs text-muted dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <img v-if="item.channelThumb" :src="item.channelThumb" alt="" class="w-7 h-7 rounded-full object-cover" />
                  <div v-else class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div>{{ item.channel }}</div>
                </div>
                <div class="text-right">{{ item.views }} • {{ item.age }}</div>
              </div>
            </div>
          </div>
        </article>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'

// Use a simple static path as a safe fallback for the bundled SVG asset to
// avoid TypeScript import issues for image modules in this environment.
const thumb = '/assets/hero-thumb.svg'

const props = defineProps({
  loading: { type: Boolean, default: false },
})
const loading = toRef(props, 'loading')

// Real data state
const items = ref<Array<any>>([])
const localLoading = ref(true)
const error = ref<string | null>(null)

await loadTrendingVideos();

async function loadTrendingVideos() {
  try {
    console.log('Loading trending videos...')
    localLoading.value = false

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

function navigateToVideo(videoId: string) {
  navigateTo(`/video/${videoId}`)
}
</script>

<style scoped>
.text-muted { color: rgba(17,24,39,0.6); }
.dark .text-muted { color: rgba(148,163,184,0.8); }

/* Small optimizations for card content */
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; -webkit-line-clamp: 2; line-clamp: 2; }
</style>
